#!/usr/bin/env python3
"""
Regime Rider — research harness.

Widens the SAMPLE without touching the RULES. Everything here imports
`decide()` and `backtest()` from bot.py; no parameter is tuned, nothing is
optimised, no variant is invented. Playbook §3: the answer to "can we squeeze
more out of the backtest" is no — but "can we test the same rules against more
data" is a different, legitimate question, and this is it.

What it adds over a single BTC-perp backtest:

  1. LONGER HISTORY. The BTC perp only starts 2019-09. Spot BTC/ETH go back
     to 2017, which adds the 2017 blow-off and the entire 2018 bear — the
     regime the current sample most under-represents.

  2. CROSS-SECTION. The same fixed rules on ETH, SOL, BNB, XRP, DOGE perps.
     This is the strongest out-of-sample test available without waiting
     years: rules fitted to BTC have no reason to work on SOL. If the long
     side survives across assets and the short side fails across all of
     them, that is worth far more than one asset's opinion.

  3. REAL FUNDING. Binance publishes historical 8h funding rates. Every
     perp trade gets its actual funding summed over its holding period.
     This turns "funding is unmodelled, treat as a ceiling" into a number.
     NOTE ON SIGN: funding > 0 means LONGS PAY SHORTS. On BTC perps funding
     has historically been positive most of the time, so shorts may well
     have COLLECTED it. Measure, do not assume.

  4. SUB-PERIODS. Per calendar year, per variant. Read as "did it behave
     sanely", never as CAGR (Playbook §3).

  5. BOOTSTRAP. The headline backtest is one path with ~26 trades where a
     single trade carried 48% of the profit. Resampling the trade sequence
     with replacement gives the distribution that single path came from.

Usage:
  python research.py --out-dir /tmp/rr-research [--quick]
"""

import argparse
import json
import math
import random
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import bot  # noqa: E402  — the rules live there and only there

try:
    import ccxt
except ImportError:
    print("Missing dependency. Run:  pip install ccxt")
    sys.exit(1)


DAY_MS = 86_400_000

# (label, ccxt exchange id, symbol, has_funding)
UNIVERSE = [
    ("BTC-perp",  "binanceusdm", "BTC/USDT:USDT",  True),
    ("ETH-perp",  "binanceusdm", "ETH/USDT:USDT",  True),
    ("SOL-perp",  "binanceusdm", "SOL/USDT:USDT",  True),
    ("BNB-perp",  "binanceusdm", "BNB/USDT:USDT",  True),
    ("XRP-perp",  "binanceusdm", "XRP/USDT:USDT",  True),
    ("DOGE-perp", "binanceusdm", "DOGE/USDT:USDT", True),
    # Spot: no funding, no real shorting venue — included ONLY because it
    # carries the 2017 top and the 2018 bear that the perps never saw.
    ("BTC-spot",  "binance",     "BTC/USDT",       False),
    ("ETH-spot",  "binance",     "ETH/USDT",       False),
]

VARIANTS = [
    ("long",  {"enable_longs": True,  "enable_shorts": False}),
    ("short", {"enable_longs": False, "enable_shorts": True}),
    ("both",  {"enable_longs": True,  "enable_shorts": True}),
]


def log(msg):
    print(msg, flush=True)


# --------------------------------------------------------------------------
# Data
# --------------------------------------------------------------------------
def make_ex(ex_id):
    ex = getattr(ccxt, ex_id)({"enableRateLimit": True})
    if ex_id == "binanceusdm":
        ex.options["defaultType"] = "future"
    return ex


def fetch_ohlcv_all(ex, symbol, since_iso="2017-01-01T00:00:00Z"):
    since = ex.parse8601(since_iso)
    out, seen = [], set()
    while True:
        batch = ex.fetch_ohlcv(symbol, "1d", since=since, limit=1000)
        if not batch:
            break
        fresh = [c for c in batch if c[0] not in seen]
        if not fresh:
            break
        for c in fresh:
            seen.add(c[0])
        out.extend(fresh)
        nxt = batch[-1][0] + DAY_MS
        if nxt <= since:
            break
        since = nxt
        if since > ex.milliseconds():
            break
        time.sleep(ex.rateLimit / 1000.0)
    out.sort(key=lambda c: c[0])
    now = ex.milliseconds()
    if out and out[-1][0] > now - DAY_MS:
        out = out[:-1]
    return out


def fetch_funding_all(ex, symbol, since_ms):
    """[(timestamp_ms, rate), ...] 8h funding history, ascending."""
    out, seen = [], set()
    since = since_ms
    while True:
        try:
            batch = ex.fetch_funding_rate_history(symbol, since=since,
                                                  limit=1000)
        except Exception as e:
            log(f"      funding fetch failed ({e}) — continuing without it")
            return []
        if not batch:
            break
        fresh = [b for b in batch if b["timestamp"] not in seen]
        if not fresh:
            break
        for b in fresh:
            seen.add(b["timestamp"])
            out.append((b["timestamp"], float(b["fundingRate"])))
        nxt = batch[-1]["timestamp"] + 1
        if nxt <= since:
            break
        since = nxt
        if since > ex.milliseconds():
            break
        time.sleep(ex.rateLimit / 1000.0)
    out.sort()
    return out


# --------------------------------------------------------------------------
# Funding applied to a trade list
# --------------------------------------------------------------------------
def apply_funding(trades, funding, mkt):
    """Add real funding P&L to each trade.

    Convention (Binance): fundingRate > 0 => LONGS PAY SHORTS.
      long  position: pnl_funding = -rate * notional
      short position: pnl_funding = +rate * notional
    Notional at each funding event is approximated by qty * that day's close.
    """
    if not funding:
        for t in trades:
            t["funding_pnl"] = 0.0
            t["pnl_after_funding"] = t["pnl"]
        return trades

    ts_to_close = {mkt.ts[i]: mkt.closes[i] for i in range(mkt.n)}
    days = sorted(ts_to_close)

    def close_for(ms):
        day = ms - (ms % DAY_MS)
        if day in ts_to_close:
            return ts_to_close[day]
        lo, hi = 0, len(days) - 1
        best = days[0]
        while lo <= hi:
            mid = (lo + hi) // 2
            if days[mid] <= day:
                best = days[mid]
                lo = mid + 1
            else:
                hi = mid - 1
        return ts_to_close[best]

    f_ts = [f[0] for f in funding]

    def lower_bound(x):
        lo, hi = 0, len(f_ts)
        while lo < hi:
            mid = (lo + hi) // 2
            if f_ts[mid] < x:
                lo = mid + 1
            else:
                hi = mid
        return lo

    for t in trades:
        sign = -1.0 if t["side"] == "long" else 1.0
        total = 0.0
        n_events = 0
        i = lower_bound(t["entry_ts"])
        while i < len(funding) and funding[i][0] <= t["exit_ts"]:
            rate = funding[i][1]
            notional = t["qty"] * close_for(funding[i][0])
            total += sign * rate * notional
            n_events += 1
            i += 1
        t["funding_pnl"] = round(total, 2)
        t["funding_events"] = n_events
        t["pnl_after_funding"] = round(t["pnl"] + total, 2)
    return trades


def pf(vals):
    gw = sum(v for v in vals if v > 0)
    gl = -sum(v for v in vals if v <= 0)
    return round(gw / gl, 3) if gl > 0 else None


# --------------------------------------------------------------------------
# Sub-periods and bootstrap
# --------------------------------------------------------------------------
def by_year(trades):
    out = {}
    for t in trades:
        y = t["exit_date"][:4]
        d = out.setdefault(y, {"trades": 0, "wins": 0, "pnl": 0.0,
                               "long": 0, "short": 0})
        d["trades"] += 1
        d["wins"] += 1 if t["pnl"] > 0 else 0
        d["pnl"] += t["pnl"]
        d[t["side"]] += 1
    for y, d in out.items():
        d["win_rate_pct"] = round(100 * d["wins"] / d["trades"], 1)
        d["pnl"] = round(d["pnl"], 2)
        del d["wins"]
    return dict(sorted(out.items()))


def bootstrap(trades, iters=4000, seed=11):
    """Resample per-trade % returns with replacement and compound them.

    Answers: given these trades in some order, how wide is the range of
    outcomes the single observed path was drawn from?
    """
    rets = [t["pnl_pct_equity"] / 100.0 for t in trades]
    if len(rets) < 3:
        return None
    rng = random.Random(seed)
    finals = []
    for _ in range(iters):
        eq = 1.0
        for _ in range(len(rets)):
            eq *= (1.0 + rng.choice(rets))
            if eq <= 0:
                eq = 1e-9
                break
        finals.append(eq)
    finals.sort()

    def q(p):
        return round(100 * (finals[int(p * (len(finals) - 1))] - 1), 1)

    return {"iters": iters, "n_trades": len(rets),
            "p05_return_pct": q(0.05), "p50_return_pct": q(0.50),
            "p95_return_pct": q(0.95),
            "prob_negative_pct": round(
                100 * sum(1 for f in finals if f < 1.0) / len(finals), 1)}


# --------------------------------------------------------------------------
def base_cfg(overrides):
    cfg = dict(bot.DEFAULT_CONFIG)
    cfg.update(overrides)
    return cfg


def run(out_dir, quick=False):
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    universe = UNIVERSE[:2] if quick else UNIVERSE
    results = {}
    exchanges = {}

    for label, ex_id, symbol, has_funding in universe:
        log(f"\n=== {label} ({symbol} @ {ex_id}) ===")
        try:
            ex = exchanges.get(ex_id) or make_ex(ex_id)
            exchanges[ex_id] = ex
            ohlcv = fetch_ohlcv_all(ex, symbol)
        except Exception as e:
            log(f"    SKIP — data fetch failed: {e}")
            continue
        if len(ohlcv) < bot.DEFAULT_CONFIG["regime_len"] + 40:
            log(f"    SKIP — only {len(ohlcv)} candles")
            continue
        log(f"    {len(ohlcv)} candles")

        funding = []
        if has_funding:
            funding = fetch_funding_all(ex, symbol, ohlcv[0][0])
            log(f"    {len(funding)} funding events")

        for vname, vover in VARIANTS:
            cfg = base_cfg(vover)
            mkt = bot.Market(ohlcv, cfg)
            res = bot.backtest(mkt, cfg)
            trades = apply_funding(res["trade_list"], funding, mkt)

            raw = [t["pnl"] for t in trades]
            adj = [t["pnl_after_funding"] for t in trades]
            fund_total = round(sum(t["funding_pnl"] for t in trades), 2)

            entry = {
                "symbol": label,
                "variant": vname,
                "period": res["period"],
                "trades": res["trades"],
                "win_rate_pct": res["win_rate_pct"],
                "payoff_ratio": res["payoff_ratio"],
                "profit_factor": res["profit_factor"],
                "net_return_pct": res["net_return_pct"],
                "cagr_pct": res["cagr_pct"],
                "max_drawdown_pct": res["max_drawdown_pct"],
                "worst_losing_streak": res["worst_losing_streak"],
                "largest_win": res["largest_win"],
                "largest_loss": res["largest_loss"],
                "buy_hold_return_pct": res["buy_hold_return_pct"],
                "buy_hold_max_drawdown_pct": res["buy_hold_max_drawdown_pct"],
                "by_side": res["by_side"],
                "has_funding": bool(funding),
                "funding_total": fund_total,
                "profit_factor_after_funding": pf(adj) if funding else None,
                "net_pnl_raw": round(sum(raw), 2),
                "net_pnl_after_funding": round(sum(adj), 2) if funding else None,
                "top_trade_share_pct": (
                    round(100 * max(raw) / sum(v for v in raw if v > 0), 1)
                    if any(v > 0 for v in raw) else None),
                "by_year": by_year(trades),
                "bootstrap": bootstrap(trades),
                "trade_list": trades,
            }
            results[f"{label}|{vname}"] = entry
            log(f"    {vname:5s} trades={entry['trades']:3d} "
                f"PF={entry['profit_factor']} "
                f"PFfund={entry['profit_factor_after_funding']} "
                f"net={entry['net_return_pct']:8.1f}% "
                f"DD={entry['max_drawdown_pct']:5.1f}%")

    (out / "research.json").write_text(json.dumps(results, indent=2))
    log(f"\nWrote {out/'research.json'} ({len(results)} runs)")
    return results


# --------------------------------------------------------------------------
def pooled(results, vname, only_funded=False):
    """Pool every trade of a variant across all symbols — the big sample.

    Trades are pooled as % of the equity at entry, so a BTC trade and a DOGE
    trade are directly comparable and no symbol dominates by price scale.
    """
    raw, adj, syms = [], [], []
    for r in results.values():
        if r["variant"] != vname:
            continue
        if only_funded and not r["has_funding"]:
            continue
        syms.append(r["symbol"])
        for t in r["trade_list"]:
            # exact: equity_after is post-trade, so entry equity = after - pnl
            eq_at_entry = t["equity_after"] - t["pnl"]
            raw.append(t["pnl_pct_equity"])
            if eq_at_entry > 0:
                adj.append(t["pnl_pct_equity"]
                           + 100 * t["funding_pnl"] / eq_at_entry)
            else:
                adj.append(t["pnl_pct_equity"])
    if not raw:
        return None
    wins = [v for v in raw if v > 0]
    return {
        "symbols": sorted(set(syms)),
        "trades": len(raw),
        "win_rate_pct": round(100 * len(wins) / len(raw), 1),
        "profit_factor": pf(raw),
        "profit_factor_after_funding": pf(adj),
        "avg_trade_pct_equity": round(sum(raw) / len(raw), 3),
        "avg_trade_pct_equity_after_funding": round(sum(adj) / len(adj), 3),
        "median_trade_pct_equity": round(sorted(raw)[len(raw) // 2], 3),
    }


def _fmt(v):
    return "-" if v is None else str(v)


def write_markdown(results, summary, path, generated_utc):
    L = []
    a = L.append
    a("# Regime Rider — investigacao alargada (regras FIXAS, amostra maior)")
    a("")
    a("_Gerado por `vps-research-regime-rider.yml` / `research.py`. "
      "Nao editar a mao._")
    a("")
    a(f"**Gerado:** {generated_utc}")
    a("")
    a("Nenhum parametro foi alterado, afinado ou pesquisado. As regras sao as "
      "do `bot.py` que decide ao vivo, importadas directamente. O que muda "
      "aqui e so a AMOSTRA: mais historia, mais activos, funding real.")
    a("")

    # ---- the headline: pooled ----
    a("## 1. A amostra grande — todos os trades, todos os activos")
    a("")
    a("Trades agregados como % da equity a entrada, para que um trade de BTC "
      "e um de DOGE pesem o mesmo.")
    a("")
    a("| variante | activos | trades | win rate | **PF** | **PF c/ funding real** | media/trade | mediana/trade |")
    a("|---|---|---|---|---|---|---|---|")
    for v, _ in VARIANTS:
        p = summary[v]["all"]
        if not p:
            continue
        a(f"| **{v}** | {len(p['symbols'])} | {p['trades']} | "
          f"{p['win_rate_pct']}% | **{_fmt(p['profit_factor'])}** | "
          f"**{_fmt(p['profit_factor_after_funding'])}** | "
          f"{p['avg_trade_pct_equity']:+.3f}% | "
          f"{p['median_trade_pct_equity']:+.3f}% |")
    a("")
    a("Apenas perps (onde o funding existe de facto):")
    a("")
    a("| variante | trades | win rate | PF | PF c/ funding |")
    a("|---|---|---|---|---|")
    for v, _ in VARIANTS:
        p = summary[v]["perps_only"]
        if not p:
            continue
        a(f"| **{v}** | {p['trades']} | {p['win_rate_pct']}% | "
          f"{_fmt(p['profit_factor'])} | "
          f"{_fmt(p['profit_factor_after_funding'])} |")
    a("")

    # ---- per symbol ----
    a("## 2. Por activo e variante")
    a("")
    a("| activo | variante | periodo | trades | WR | PF | PF c/ fund | net % | maxDD % | pior serie | 1 trade = % do lucro |")
    a("|---|---|---|---|---|---|---|---|---|---|---|")
    for key in sorted(results):
        r = results[key]
        p = r["period"]
        a(f"| {r['symbol']} | {r['variant']} | {p['from'][:7]}..{p['to'][:7]} "
          f"| {r['trades']} | {r['win_rate_pct']}% | {_fmt(r['profit_factor'])} "
          f"| {_fmt(r['profit_factor_after_funding'])} | {r['net_return_pct']} "
          f"| {r['max_drawdown_pct']} | {r['worst_losing_streak']} "
          f"| {_fmt(r['top_trade_share_pct'])}% |")
    a("")

    # ---- funding ----
    a("## 3. Funding real — o custo que nunca tinha sido medido")
    a("")
    a("Convencao Binance: **funding > 0 => os LONGS PAGAM aos SHORTS**. "
      "Historicamente o funding do BTC perp e positivo a maior parte do "
      "tempo, portanto e preciso medir antes de assumir que o short paga.")
    a("")
    a("| activo | variante | trades | P&L funding (USDT) | P&L bruto | P&L c/ funding |")
    a("|---|---|---|---|---|---|")
    for key in sorted(results):
        r = results[key]
        if not r["has_funding"] or r["trades"] == 0:
            continue
        a(f"| {r['symbol']} | {r['variant']} | {r['trades']} "
          f"| {r['funding_total']:+.2f} | {r['net_pnl_raw']:+.2f} "
          f"| {_fmt(r['net_pnl_after_funding'])} |")
    a("")

    # ---- bootstrap ----
    a("## 4. Bootstrap — a distribuicao de onde o resultado unico saiu")
    a("")
    a("Reamostragem dos trades com reposicao, composta. Responde: dada esta "
      "colecao de trades, quao larga e a gama de desfechos possiveis? "
      "Um percentil 5 muito negativo com mediana positiva significa que o "
      "resultado observado teve sorte na ordem.")
    a("")
    a("| activo | variante | n | p05 | mediana | p95 | prob. de perder |")
    a("|---|---|---|---|---|---|---|")
    for key in sorted(results):
        r = results[key]
        b = r["bootstrap"]
        if not b:
            continue
        a(f"| {r['symbol']} | {r['variant']} | {b['n_trades']} "
          f"| {b['p05_return_pct']}% | {b['p50_return_pct']}% "
          f"| {b['p95_return_pct']}% | {b['prob_negative_pct']}% |")
    a("")

    # ---- per year ----
    a("## 5. Comportamento ano a ano (ler como sanidade, nunca como CAGR)")
    a("")
    for key in sorted(results):
        r = results[key]
        if not r["by_year"]:
            continue
        a(f"<details><summary>{r['symbol']} — {r['variant']}</summary>")
        a("")
        a("| ano | trades | long | short | WR | P&L |")
        a("|---|---|---|---|---|---|")
        for y, d in r["by_year"].items():
            a(f"| {y} | {d['trades']} | {d['long']} | {d['short']} "
              f"| {d['win_rate_pct']}% | {d['pnl']:+.2f} |")
        a("")
        a("</details>")
        a("")

    a("## 6. Como ler isto honestamente")
    a("")
    a("- **Isto continua a nao ser out-of-sample no tempo.** E out-of-sample "
      "na *seccao cruzada*: as regras foram desenhadas em BTC e aqui correm "
      "em activos que nunca as viram. E o antidoto mais forte disponivel sem "
      "esperar anos, mas nao substitui o registo forward.")
    a("- **Os activos nao sao independentes.** Cripto move-se em bloco; seis "
      "perps nao valem seis amostras independentes. O `n` agregado exagera a "
      "confianca — tratar como 2 a 3 amostras efectivas, nao 6.")
    a("- **Spot nao tem funding nem venue de short.** As linhas `-spot` "
      "existem so pela historia de 2017-2018 que os perps nunca viram; o "
      "lado short delas e teorico.")
    a("- **Slippage alem da regra de gap continua por modelar.**")
    a("- Playbook §2: nunca comecar pelo lucro. Trades, dependencia de "
      "outliers, win rate COM payoff, drawdown, e so depois o retorno.")
    Path(path).write_text("\n".join(L) + "\n")


def main():
    import datetime as _dt
    ap = argparse.ArgumentParser()
    ap.add_argument("--out-dir", default="/tmp/rr-research")
    ap.add_argument("--md", help="write the markdown report here")
    ap.add_argument("--quick", action="store_true",
                    help="BTC only — for smoke-testing the harness")
    args = ap.parse_args()

    results = run(args.out_dir, args.quick)

    summary = {v: {"all": pooled(results, v),
                   "perps_only": pooled(results, v, only_funded=True)}
               for v, _ in VARIANTS}
    Path(args.out_dir, "pooled.json").write_text(json.dumps(summary, indent=2))

    log("\n" + "=" * 72)
    log("  POOLED ACROSS ALL SYMBOLS — the big sample")
    log("=" * 72)
    for v, _ in VARIANTS:
        p = summary[v]["all"]
        if not p:
            continue
        log(f"  {v:5s}  n={p['trades']:4d}  WR={p['win_rate_pct']:5.1f}%  "
            f"PF={p['profit_factor']}  PF(funding)={p['profit_factor_after_funding']}  "
            f"avg/trade={p['avg_trade_pct_equity']:+.3f}% of equity")
    log("")

    if args.md:
        stamp = _dt.datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
        write_markdown(results, summary, args.md, stamp)
        log(f"Wrote {args.md}")


if __name__ == "__main__":
    main()
