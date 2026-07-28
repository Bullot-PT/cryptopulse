#!/usr/bin/env python3
"""
Regime Rider Bot — BTC/USDT perpetual futures (Binance USDT-M)

Implements the "Regime Rider v2.4" strategy developed and backtested on
TradingView (BINANCE:BTCUSDT, 1D), now with a symmetric SHORT side that can
be enabled per instance, and a replay/backtest mode that runs the SAME
decision function over history.

  Regime:   hysteresis filter. regimeUp turns TRUE when daily close
            > SMA200 * (1 + band), FALSE when close < SMA200 * (1 - band).
            "regime down" is simply "not regime up".

  LONG  (enable_longs):
    Entry:  at the daily open following either (a) a fresh regime-up cross,
            or (b) a close ABOVE the highest CLOSE of the prior 20 days
            while the regime is up and the bot is flat.
    Stop:   initial = max(entry - 2.5*ATR14, highestClose - 4*ATR14).
            Trails at highestClose - 4*ATR14, raised only upward.
    Exit:   stop hit (intraday, exchange-side), or market exit at the next
            open if the regime flips down.
    Size:   qty = min(equity*risk_pct/stopDist, equity*long_cap_x/price).

  SHORT (enable_shorts) — exact mirror of the long:
    Entry:  at the daily open following either (a) a fresh regime-down
            cross, or (b) a close BELOW the lowest CLOSE of the prior 20
            days while the regime is down and the bot is flat.
    Stop:   initial = min(entry + 2.5*ATR14, lowestClose + 4*ATR14).
            Trails at lowestClose + 4*ATR14, lowered only downward.
    Exit:   stop hit, or market exit at the next open if the regime flips up.
    Size:   qty = min(equity*risk_pct/stopDist, equity*short_cap_x/price).
            short_cap_x is hard-capped at 1.0 by the leverage framework.

  One position at a time, always. Long and short never coexist.

Run ONCE PER DAY shortly after 00:00 UTC. Deterministic from exchange OHLCV
history plus a small local state file, so a missed day self-heals.

USAGE
  python bot.py                      # live/dry-run cycle, state in script dir
  python bot.py --dir /path/to/inst  # ... using another instance directory
  python bot.py --backtest           # replay history through the same rules
  python bot.py --backtest --json out.json --csv trades.csv

An "instance directory" holds config.json, state.json and bot.log. Running
several instances with different configs (long-only, short-only, both) from
the same bot.py is the supported way to accumulate parallel forward records.

SAFETY DEFAULTS: dry_run=true and testnet=true in config.json. The bot
refuses to run live until you deliberately change both. Use an API key
with FUTURES TRADE permission ONLY — withdrawals disabled, IP whitelisted.

DISCLAIMER: educational/personal-automation code, not financial advice.
Futures trading can lose more than your initial margin. Past backtest
performance does not predict live results. You are responsible for any
orders this software places.
"""

import argparse
import json
import logging
import os
import sys
import time
from dataclasses import dataclass, asdict
from pathlib import Path

try:
    import ccxt
except ImportError:
    print("Missing dependency. Run:  pip install ccxt")
    sys.exit(1)


# --------------------------------------------------------------------------
# Paths & logging (instance directory resolved at startup)
# --------------------------------------------------------------------------
ROOT = Path(__file__).resolve().parent
CONFIG_PATH = ROOT / "config.json"
STATE_PATH = ROOT / "state.json"
LOG_PATH = ROOT / "bot.log"

log = logging.getLogger("regime-rider")


def setup_paths(instance_dir, tag=""):
    """Point config/state/log at an instance directory and start logging."""
    global ROOT, CONFIG_PATH, STATE_PATH, LOG_PATH
    if instance_dir:
        ROOT = Path(instance_dir).resolve()
        ROOT.mkdir(parents=True, exist_ok=True)
    CONFIG_PATH = ROOT / "config.json"
    STATE_PATH = ROOT / "state.json"
    LOG_PATH = ROOT / "bot.log"
    name = tag or ROOT.name
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] [" + name + "] %(message)s",
        handlers=[logging.FileHandler(LOG_PATH), logging.StreamHandler()],
    )


# --------------------------------------------------------------------------
# Config & state
# --------------------------------------------------------------------------
DEFAULT_CONFIG = {
    "exchange": "binanceusdm",
    "symbol": "BTC/USDT:USDT",       # USDT-M perpetual in ccxt notation
    "timeframe": "1d",
    "testnet": True,                  # Binance Futures testnet
    "dry_run": True,                  # log intended orders, place nothing
    "api_key": "",
    "api_secret": "",
    "regime_len": 200,
    "band_pct": 0.02,
    "atr_len": 14,
    "chand_mult": 4.0,
    "init_mult": 2.5,
    "breakout_len": 20,
    "risk_pct": 0.04,                 # 4% of equity risked per trade
    "enable_longs": True,
    "long_cap_x": 2.0,                # max long notional as multiple of equity
    "enable_shorts": False,           # OFF by default: backtest PF 0.896
    "short_cap_x": 1.0,               # hard ceiling — leverage framework
    "max_equity_drawdown_halt": 0.35, # kill switch: halt if equity < 65% of peak
    "leverage": 10,                   # margin headroom only; sizing controls risk
    "paper_equity": 5000.0,           # simulated equity used in dry_run mode
    # --- replay/backtest only (never touches live decisions) ---
    "commission_pct": 0.0004,         # 0.04% per side, Binance USDT-M taker
}

# Legacy key -> new key, so older config.json files keep working.
LEGACY_KEYS = {"enable_short": "enable_shorts"}


@dataclass
class BotState:
    in_position: bool = False
    side: str = ""                    # "long" or "short"
    entry_price: float = 0.0
    entry_ts: int = 0                 # ms timestamp of entry candle
    qty: float = 0.0
    extreme_close: float = 0.0        # highest close since entry (long) /
                                      # lowest close since entry (short)
    trail_stop: float = 0.0
    stop_order_id: str = ""
    peak_equity: float = 0.0
    halted: bool = False


def load_config():
    if not CONFIG_PATH.exists():
        CONFIG_PATH.write_text(json.dumps(DEFAULT_CONFIG, indent=2))
        log.error("No config.json found. A template was created at %s — "
                  "review it, then re-run.", CONFIG_PATH)
        sys.exit(1)
    raw = json.loads(CONFIG_PATH.read_text())
    for old, new in LEGACY_KEYS.items():
        if old in raw and new not in raw:
            raw[new] = raw.pop(old)
    cfg = {**DEFAULT_CONFIG, **raw}
    if cfg["short_cap_x"] > 1.0:
        log.warning("short_cap_x %.2f exceeds the 1.0x ceiling — clamping.",
                    cfg["short_cap_x"])
        cfg["short_cap_x"] = 1.0
    if not cfg["enable_longs"] and not cfg["enable_shorts"]:
        log.error("Both sides disabled in config — nothing to do.")
        sys.exit(1)
    return cfg


def load_state():
    if STATE_PATH.exists():
        raw = json.loads(STATE_PATH.read_text())
        known = set(BotState.__dataclass_fields__)
        return BotState(**{k: v for k, v in raw.items() if k in known})
    return BotState()


def save_state(state):
    STATE_PATH.write_text(json.dumps(asdict(state), indent=2))


# --------------------------------------------------------------------------
# Indicators (must match Pine: ta.sma, ta.atr = Wilder RMA of true range)
# --------------------------------------------------------------------------
def sma(values, length):
    out = [None] * len(values)
    s = 0.0
    for i, v in enumerate(values):
        s += v
        if i >= length:
            s -= values[i - length]
        if i >= length - 1:
            out[i] = s / length
    return out


def wilder_atr(highs, lows, closes, length):
    """Pine's ta.atr: RMA (Wilder smoothing) of true range."""
    n = len(closes)
    tr = [0.0] * n
    tr[0] = highs[0] - lows[0]
    for i in range(1, n):
        tr[i] = max(highs[i] - lows[i],
                    abs(highs[i] - closes[i - 1]),
                    abs(lows[i] - closes[i - 1]))
    out = [None] * n
    if n < length:
        return out
    first = sum(tr[:length]) / length
    out[length - 1] = first
    prev = first
    for i in range(length, n):
        prev = (prev * (length - 1) + tr[i]) / length
        out[i] = prev
    return out


def compute_regime(closes, sma200, band):
    """Hysteresis regime, computed deterministically over full history."""
    regime = [False] * len(closes)
    up = False
    for i, c in enumerate(closes):
        m = sma200[i]
        if m is None:
            regime[i] = False
            continue
        if c > m * (1 + band):
            up = True
        elif c < m * (1 - band):
            up = False
        regime[i] = up
    return regime


class Market:
    """Indicator bundle for one OHLCV history. Shared by live and replay."""

    def __init__(self, ohlcv, cfg):
        self.ts = [c[0] for c in ohlcv]
        self.opens = [c[1] for c in ohlcv]
        self.highs = [c[2] for c in ohlcv]
        self.lows = [c[3] for c in ohlcv]
        self.closes = [c[4] for c in ohlcv]
        self.sma200 = sma(self.closes, cfg["regime_len"])
        self.atr = wilder_atr(self.highs, self.lows, self.closes,
                              cfg["atr_len"])
        self.regime = compute_regime(self.closes, self.sma200, cfg["band_pct"])
        self.n = len(self.closes)

    def hh(self, i, length):
        """Highest CLOSE of the `length` days BEFORE i."""
        return max(self.closes[i - length:i])

    def ll(self, i, length):
        """Lowest CLOSE of the `length` days BEFORE i."""
        return min(self.closes[i - length:i])

    def ready(self, i, cfg):
        need = max(cfg["regime_len"], cfg["breakout_len"], cfg["atr_len"])
        return (i >= need and self.sma200[i] is not None
                and self.atr[i] is not None)


# --------------------------------------------------------------------------
# THE DECISION FUNCTION — the single source of truth.
# Live trading and the replay/backtest both call this and nothing else.
# --------------------------------------------------------------------------
def decide(mkt, i, cfg, in_position, side, extreme_close, trail_stop):
    """Decide what to do after the close of candle `i`.

    Returns one of:
      {"action": "none"}
      {"action": "exit",  "reason": str}
      {"action": "trail", "new_stop": float, "new_extreme": float}
      {"action": "hold",  "new_extreme": float}
      {"action": "enter", "side": "long"|"short", "reason": str,
       "extreme": float, "stop_dist": float}
    """
    c = mkt.closes[i]
    a = mkt.atr[i]
    r = mkt.regime[i]
    r_prev = mkt.regime[i - 1]

    # ---- managing an open position ----
    if in_position:
        if side == "long":
            if not r:
                return {"action": "exit", "reason": "regime_flip_down"}
            new_extreme = max(extreme_close, c)
            candidate = new_extreme - cfg["chand_mult"] * a
            if candidate > trail_stop:
                return {"action": "trail", "new_stop": candidate,
                        "new_extreme": new_extreme}
            return {"action": "hold", "new_extreme": new_extreme}
        else:  # short
            if r:
                return {"action": "exit", "reason": "regime_flip_up"}
            new_extreme = min(extreme_close, c)
            candidate = new_extreme + cfg["chand_mult"] * a
            if candidate < trail_stop:
                return {"action": "trail", "new_stop": candidate,
                        "new_extreme": new_extreme}
            return {"action": "hold", "new_extreme": new_extreme}

    # ---- flat: look for an entry ----
    if cfg["enable_longs"] and r:
        fresh_cross = not r_prev
        breakout = c > mkt.hh(i, cfg["breakout_len"])
        if fresh_cross or breakout:
            return {"action": "enter", "side": "long",
                    "reason": "regime_cross" if fresh_cross else "breakout_20d",
                    "extreme": c, "stop_dist": cfg["init_mult"] * a}

    if cfg["enable_shorts"] and not r:
        fresh_cross = r_prev
        breakdown = c < mkt.ll(i, cfg["breakout_len"])
        if fresh_cross or breakdown:
            return {"action": "enter", "side": "short",
                    "reason": "regime_cross" if fresh_cross else "breakdown_20d",
                    "extreme": c, "stop_dist": cfg["init_mult"] * a}

    return {"action": "none"}


def initial_stop(side, entry_price, extreme, atr, cfg):
    if side == "long":
        return max(entry_price - cfg["init_mult"] * atr,
                   extreme - cfg["chand_mult"] * atr)
    return min(entry_price + cfg["init_mult"] * atr,
               extreme + cfg["chand_mult"] * atr)


def position_qty(side, equity, price, stop_dist, cfg):
    cap_x = cfg["long_cap_x"] if side == "long" else cfg["short_cap_x"]
    qty_risk = (equity * cfg["risk_pct"]) / stop_dist
    qty_cap = (equity * cap_x) / price
    return min(qty_risk, qty_cap)


# --------------------------------------------------------------------------
# Exchange helpers
# --------------------------------------------------------------------------
def make_exchange(cfg):
    klass = getattr(ccxt, cfg["exchange"])
    ex = klass({
        "apiKey": cfg["api_key"],
        "secret": cfg["api_secret"],
        "enableRateLimit": True,
        "options": {"defaultType": "future"},
    })
    # Sandbox only matters when actually placing orders. In dry_run we use
    # the public production API for data and touch no private endpoints.
    # NOTE (2026): Binance discontinued the old futures testnet; ccxt raises
    # NotSupported for binanceusdm sandbox. Phase 2 will use Binance "demo
    # trading" or another venue — revisit before setting dry_run=false.
    if cfg["testnet"] and not cfg["dry_run"]:
        ex.set_sandbox_mode(True)
    return ex


def fetch_candles(ex, cfg, limit=320):
    """Fetch daily OHLCV and drop the still-forming candle."""
    ohlcv = ex.fetch_ohlcv(cfg["symbol"], cfg["timeframe"], limit=limit)
    if len(ohlcv) < cfg["regime_len"] + 5:
        raise RuntimeError("Only %d candles returned; need >%d. Aborting."
                           % (len(ohlcv), cfg["regime_len"]))
    now_ms = ex.milliseconds()
    day_ms = 86_400_000
    if ohlcv[-1][0] > now_ms - day_ms:   # last candle not yet closed
        ohlcv = ohlcv[:-1]
    return ohlcv


def fetch_all_candles(ex, cfg):
    """Page back through the full available daily history."""
    day_ms = 86_400_000
    since = ex.parse8601("2017-01-01T00:00:00Z")
    out, seen = [], set()
    while True:
        batch = ex.fetch_ohlcv(cfg["symbol"], cfg["timeframe"],
                               since=since, limit=1000)
        if not batch:
            break
        fresh = [c for c in batch if c[0] not in seen]
        for c in fresh:
            seen.add(c[0])
        out.extend(fresh)
        nxt = batch[-1][0] + day_ms
        if nxt <= since or not fresh:
            break
        since = nxt
        if since > ex.milliseconds():
            break
        time.sleep(ex.rateLimit / 1000.0)
    out.sort(key=lambda c: c[0])
    now_ms = ex.milliseconds()
    if out and out[-1][0] > now_ms - day_ms:
        out = out[:-1]
    return out


def get_equity_usdt(ex, cfg):
    bal = ex.fetch_balance()
    total = bal.get("USDT", {}).get("total")
    if total is None:
        raise RuntimeError("Could not read USDT futures balance.")
    return float(total)


def get_position_qty(ex, cfg):
    """Signed position size from the exchange (source of truth)."""
    positions = ex.fetch_positions([cfg["symbol"]])
    for p in positions:
        if p.get("symbol") == cfg["symbol"]:
            qty = float(p.get("contracts") or 0.0)
            if qty > 0 and p.get("side") == "short":
                return -qty
            return qty
    return 0.0


def round_qty(ex, cfg, qty):
    return float(ex.amount_to_precision(cfg["symbol"], qty))


def place_market(ex, cfg, side, qty, dry, reduce_only=False):
    params = {"reduceOnly": True} if reduce_only else {}
    if dry:
        log.info("[DRY RUN] MARKET %s %.6f %s %s", side.upper(), qty,
                 cfg["symbol"], "(reduceOnly)" if reduce_only else "")
        return {"id": "dry"}
    return ex.create_order(cfg["symbol"], "market", side, qty, None, params)


def place_stop_market(ex, cfg, side, qty, stop_price, dry):
    params = {"stopPrice": ex.price_to_precision(cfg["symbol"], stop_price),
              "reduceOnly": True}
    if dry:
        log.info("[DRY RUN] STOP_MARKET %s %.6f @ %.2f (reduceOnly)",
                 side.upper(), qty, stop_price)
        return {"id": "dry"}
    return ex.create_order(cfg["symbol"], "stop_market", side, qty, None,
                           params)


def cancel_order_safe(ex, cfg, order_id, dry):
    if dry or not order_id or order_id == "dry":
        return
    try:
        ex.cancel_order(order_id, cfg["symbol"])
    except Exception as e:                      # already filled/cancelled
        log.warning("Cancel of order %s failed (may be filled): %s",
                    order_id, e)


# --------------------------------------------------------------------------
# Core daily logic (live / dry run)
# --------------------------------------------------------------------------
def run_once():
    cfg = load_config()
    state = load_state()
    dry = cfg["dry_run"]

    if not dry and not cfg["testnet"]:
        log.warning("LIVE MODE on real exchange. 10s to abort (Ctrl+C)...")
        time.sleep(10)

    ex = make_exchange(cfg)
    ex.load_markets()

    mkt = Market(fetch_candles(ex, cfg), cfg)
    i = mkt.n - 1                            # last CLOSED daily candle
    if not mkt.ready(i, cfg):
        log.error("Not enough history to decide. Aborting.")
        return

    c, a, r = mkt.closes[i], mkt.atr[i], mkt.regime[i]
    hh = mkt.hh(i, cfg["breakout_len"])
    ll = mkt.ll(i, cfg["breakout_len"])
    price_now = ex.fetch_ticker(cfg["symbol"])["last"]

    sides = ("L" if cfg["enable_longs"] else "") + \
            ("S" if cfg["enable_shorts"] else "")
    log.info("Close=%.2f SMA200=%.2f ATR=%.2f regime=%s (prev %s) "
             "HH%d=%.2f LL%d=%.2f sides=%s",
             c, mkt.sma200[i], a, "UP" if r else "DOWN",
             "UP" if mkt.regime[i - 1] else "DOWN",
             cfg["breakout_len"], hh, cfg["breakout_len"], ll, sides)

    # -- equity & kill switch ---------------------------------------------
    # Dry run is fully self-contained: no API keys, no private endpoints.
    equity = float(cfg.get("paper_equity", 5000.0)) if dry \
        else get_equity_usdt(ex, cfg)
    state.peak_equity = max(state.peak_equity, equity)
    if state.peak_equity > 0 and equity < state.peak_equity * (
            1 - cfg["max_equity_drawdown_halt"]):
        state.halted = True
    if state.halted:
        log.error("KILL SWITCH: equity %.2f is >%d%% below peak %.2f. "
                  "Bot halted — no orders will be placed. Review, then "
                  "set 'halted' to false in state.json to resume.",
                  equity, cfg["max_equity_drawdown_halt"] * 100,
                  state.peak_equity)
        save_state(state)
        return

    # -- reconcile local state with the exchange ---------------------------
    if dry:
        exch_qty = state.qty if state.in_position else 0.0
        # Simulated stop-out: if any candle since entry pierced the trail,
        # the exchange stop would have fired intraday.
        if state.in_position and state.trail_stop > 0:
            idx = [j for j in range(mkt.n) if mkt.ts[j] > state.entry_ts]
            if idx:
                pierced = (
                    (state.side == "long"
                     and min(mkt.lows[j] for j in idx) <= state.trail_stop)
                    or (state.side == "short"
                        and max(mkt.highs[j] for j in idx) >= state.trail_stop)
                )
                if pierced:
                    log.info("[DRY RUN] Simulated stop hit at %.2f -> flat.",
                             state.trail_stop)
                    exch_qty = 0.0
    else:
        exch_qty = get_position_qty(ex, cfg)

    if state.in_position and abs(exch_qty) < 1e-9:
        log.info("Exchange shows FLAT but state says in position -> the "
                 "stop was hit intraday. Resetting state.")
        cancel_order_safe(ex, cfg, state.stop_order_id, dry)
        state = BotState(peak_equity=state.peak_equity)
    elif not state.in_position and abs(exch_qty) > 1e-9:
        log.error("Exchange shows a position the bot did not open "
                  "(qty=%.6f). Refusing to act. Flatten manually or "
                  "update state.json.", exch_qty)
        save_state(state)
        return

    # -- the decision ------------------------------------------------------
    d = decide(mkt, i, cfg, state.in_position, state.side,
               state.extreme_close, state.trail_stop)

    if d["action"] == "exit":
        closing = "sell" if state.side == "long" else "buy"
        log.info("%s -> closing %s %.6f at market.", d["reason"],
                 state.side, state.qty)
        cancel_order_safe(ex, cfg, state.stop_order_id, dry)
        place_market(ex, cfg, closing, state.qty, dry, reduce_only=True)
        state = BotState(peak_equity=state.peak_equity)
        save_state(state)
        return

    if d["action"] in ("trail", "hold"):
        state.extreme_close = d["new_extreme"]
        if d["action"] == "trail":
            log.info("Moving stop %.2f -> %.2f", state.trail_stop,
                     d["new_stop"])
            cancel_order_safe(ex, cfg, state.stop_order_id, dry)
            stop_side = "sell" if state.side == "long" else "buy"
            order = place_stop_market(ex, cfg, stop_side, state.qty,
                                      d["new_stop"], dry)
            state.trail_stop = d["new_stop"]
            state.stop_order_id = str(order.get("id", ""))
        else:
            log.info("Stop unchanged at %.2f", state.trail_stop)
        save_state(state)
        return

    if d["action"] == "none":
        log.info("Flat, no signal. Done.")
        save_state(state)
        return

    # -- entry -------------------------------------------------------------
    side = d["side"]
    qty = round_qty(ex, cfg, position_qty(side, equity, price_now,
                                          d["stop_dist"], cfg))
    if qty <= 0:
        log.warning("Computed qty rounds to zero (equity too small vs lot "
                    "step). No trade.")
        save_state(state)
        return

    notional = qty * price_now
    log.info("ENTRY signal %s (%s): qty=%.6f (~%.2f USDT, %.2fx equity), "
             "risk=%.2f USDT, stopDist=%.2f",
             side.upper(), d["reason"], qty, notional, notional / equity,
             equity * cfg["risk_pct"], d["stop_dist"])

    if not dry:
        try:
            ex.set_leverage(cfg["leverage"], cfg["symbol"])
            ex.set_margin_mode("cross", cfg["symbol"])
        except Exception as e:
            log.warning("Leverage/margin-mode call failed (may already be "
                        "set): %s", e)

    place_market(ex, cfg, "buy" if side == "long" else "sell", qty, dry)
    entry_price = price_now                     # approximation of fill
    init_stop = initial_stop(side, entry_price, d["extreme"], a, cfg)
    order = place_stop_market(ex, cfg, "sell" if side == "long" else "buy",
                              qty, init_stop, dry)

    state = BotState(
        in_position=True, side=side, entry_price=entry_price,
        entry_ts=mkt.ts[i], qty=qty, extreme_close=d["extreme"],
        trail_stop=init_stop, stop_order_id=str(order.get("id", "")),
        peak_equity=state.peak_equity,
    )
    save_state(state)
    log.info("%s opened. Initial stop %.2f (%.1f%% away).", side.capitalize(),
             init_stop, 100 * abs(entry_price - init_stop) / entry_price)


# --------------------------------------------------------------------------
# Replay / backtest — same decide(), simulated broker
# --------------------------------------------------------------------------
def backtest(mkt, cfg):
    """Walk history candle by candle using the live decision function.

    Conventions, stated explicitly (Playbook §1):
      * Decision at the CLOSE of day i, execution at the OPEN of day i+1.
      * Stops are exchange-side and can fire intraday on any later day.
        If the day OPENS beyond the stop, the fill is the open (gap), not
        the stop price — gaps cost money and the sim admits it.
      * The stop is checked BEFORE that day's close-based trail update.
      * Commission `commission_pct` per side. Funding is NOT modelled.
      * Equity compounds; sizing uses equity at entry.
    """
    eq = float(cfg["paper_equity"])
    peak = eq
    max_dd = 0.0
    trades = []
    pos = None
    warmup = max(cfg["regime_len"], cfg["breakout_len"], cfg["atr_len"]) + 1
    fee = cfg["commission_pct"]

    for i in range(warmup, mkt.n - 1):
        if not mkt.ready(i, cfg):
            continue

        # --- 1) intraday stop check for the CURRENT day
        if pos is not None:
            hit = False
            fill = pos["stop"]
            if pos["side"] == "long" and mkt.lows[i] <= pos["stop"]:
                hit, fill = True, min(mkt.opens[i], pos["stop"])
            elif pos["side"] == "short" and mkt.highs[i] >= pos["stop"]:
                hit, fill = True, max(mkt.opens[i], pos["stop"])
            if hit:
                eq = _close_trade(trades, pos, fill, mkt.ts[i], eq, fee,
                                  "stop")
                pos = None

        # --- 2) decide on the close of day i
        d = decide(mkt, i, cfg,
                   pos is not None,
                   pos["side"] if pos else "",
                   pos["extreme"] if pos else 0.0,
                   pos["stop"] if pos else 0.0)

        nxt_open = mkt.opens[i + 1]

        if d["action"] == "exit":
            eq = _close_trade(trades, pos, nxt_open, mkt.ts[i + 1], eq, fee,
                              d["reason"])
            pos = None
        elif d["action"] in ("trail", "hold"):
            pos["extreme"] = d["new_extreme"]
            if d["action"] == "trail":
                pos["stop"] = d["new_stop"]
        elif d["action"] == "enter":
            qty = position_qty(d["side"], eq, nxt_open, d["stop_dist"], cfg)
            stop = initial_stop(d["side"], nxt_open, d["extreme"],
                                mkt.atr[i], cfg)
            pos = {"side": d["side"], "entry": nxt_open, "qty": qty,
                   "extreme": d["extreme"], "stop": stop,
                   "entry_ts": mkt.ts[i + 1], "reason": d["reason"],
                   "equity_at_entry": eq}

        peak = max(peak, eq)
        if peak > 0:
            max_dd = max(max_dd, (peak - eq) / peak)

    if pos is not None:                       # mark open trade to last close
        eq = _close_trade(trades, pos, mkt.closes[-1], mkt.ts[-1], eq, fee,
                          "open_at_end")

    return _summarise(trades, cfg, eq, max_dd, mkt)


def _close_trade(trades, pos, exit_price, exit_ts, eq, fee, reason):
    sign = 1.0 if pos["side"] == "long" else -1.0
    gross = (exit_price - pos["entry"]) * pos["qty"] * sign
    costs = pos["qty"] * (pos["entry"] + exit_price) * fee
    net = gross - costs
    eq += net
    trades.append({
        "side": pos["side"],
        "reason_in": pos["reason"],
        "reason_out": reason,
        "entry_ts": pos["entry_ts"],
        "exit_ts": exit_ts,
        "entry": round(pos["entry"], 2),
        "exit": round(exit_price, 2),
        "qty": round(pos["qty"], 6),
        "pnl": round(net, 2),
        "pnl_pct_equity": round(100 * net / pos["equity_at_entry"], 2),
        "equity_after": round(eq, 2),
    })
    return eq


def _summarise(trades, cfg, eq, max_dd, mkt):
    import datetime as _dt

    def d(ms):
        return _dt.datetime.utcfromtimestamp(ms / 1000).strftime("%Y-%m-%d")

    for t in trades:
        t["entry_date"] = d(t["entry_ts"])
        t["exit_date"] = d(t["exit_ts"])

    wins = [t for t in trades if t["pnl"] > 0]
    losses = [t for t in trades if t["pnl"] <= 0]
    gross_win = sum(t["pnl"] for t in wins)
    gross_loss = -sum(t["pnl"] for t in losses)
    start_eq = float(cfg["paper_equity"])
    years = max((mkt.ts[-1] - mkt.ts[0]) / (365.25 * 86_400_000), 1e-9)

    streak = worst_streak = 0
    for t in trades:
        if t["pnl"] <= 0:
            streak += 1
            worst_streak = max(worst_streak, streak)
        else:
            streak = 0

    bh = 100 * (mkt.closes[-1] / mkt.closes[0] - 1)
    bh_peak, bh_dd = mkt.closes[0], 0.0
    for c in mkt.closes:
        bh_peak = max(bh_peak, c)
        bh_dd = max(bh_dd, (bh_peak - c) / bh_peak)

    def side_stats(s):
        sub = [t for t in trades if t["side"] == s]
        if not sub:
            return {"trades": 0}
        w = [t for t in sub if t["pnl"] > 0]
        gl = -sum(t["pnl"] for t in sub if t["pnl"] <= 0)
        gw = sum(t["pnl"] for t in w)
        return {
            "trades": len(sub),
            "win_rate_pct": round(100 * len(w) / len(sub), 1),
            "net_pnl": round(sum(t["pnl"] for t in sub), 2),
            "profit_factor": round(gw / gl, 3) if gl > 0 else None,
        }

    payoff = None
    if wins and losses and gross_loss > 0:
        payoff = round((gross_win / len(wins)) / (gross_loss / len(losses)), 2)

    return {
        "period": {"from": d(mkt.ts[0]), "to": d(mkt.ts[-1]),
                   "candles": mkt.n, "years": round(years, 2)},
        "config": {k: cfg[k] for k in (
            "enable_longs", "enable_shorts", "risk_pct", "long_cap_x",
            "short_cap_x", "regime_len", "band_pct", "atr_len", "chand_mult",
            "init_mult", "breakout_len", "commission_pct", "paper_equity")},
        "trades": len(trades),
        "win_rate_pct": round(100 * len(wins) / len(trades), 1) if trades else 0,
        "avg_win": round(gross_win / len(wins), 2) if wins else 0,
        "avg_loss": round(gross_loss / len(losses), 2) if losses else 0,
        "payoff_ratio": payoff,
        "profit_factor": round(gross_win / gross_loss, 3) if gross_loss > 0 else None,
        "largest_loss": round(min([t["pnl"] for t in trades], default=0), 2),
        "largest_win": round(max([t["pnl"] for t in trades], default=0), 2),
        "worst_losing_streak": worst_streak,
        "start_equity": start_eq,
        "end_equity": round(eq, 2),
        "net_return_pct": round(100 * (eq / start_eq - 1), 2),
        "cagr_pct": round(100 * ((eq / start_eq) ** (1 / years) - 1), 2)
                    if eq > 0 else None,
        "max_drawdown_pct": round(100 * max_dd, 2),
        "buy_hold_return_pct": round(bh, 2),
        "buy_hold_max_drawdown_pct": round(100 * bh_dd, 2),
        "by_side": {"long": side_stats("long"), "short": side_stats("short")},
        "trade_list": trades,
    }


def print_report(res, name=""):
    p = res["period"]
    print("\n" + "=" * 72)
    print("  BACKTEST %s  —  %s .. %s  (%d candles, %sy)"
          % (name, p["from"], p["to"], p["candles"], p["years"]))
    print("=" * 72)
    c = res["config"]
    print("  sides: longs=%s shorts=%s  risk=%.0f%%  caps L%sx/S%sx  "
          "fee=%.3f%%/side"
          % (c["enable_longs"], c["enable_shorts"], c["risk_pct"] * 100,
             c["long_cap_x"], c["short_cap_x"], c["commission_pct"] * 100))
    L = res["by_side"]["long"].get("trades", 0)
    S = res["by_side"]["short"].get("trades", 0)
    print("\n   1. Trades ................ %d   (long %d, short %d)"
          % (res["trades"], L, S))
    print("   2. Win rate .............. %s%%" % res["win_rate_pct"])
    print("   3. Avg win / avg loss .... %s / %s   payoff %s"
          % (res["avg_win"], res["avg_loss"], res["payoff_ratio"]))
    print("   4. Profit factor ......... %s" % res["profit_factor"])
    print("   5. Net return ............ %s%%   (CAGR %s%%)"
          % (res["net_return_pct"], res["cagr_pct"]))
    print("   6. Max drawdown .......... %s%%" % res["max_drawdown_pct"])
    print("   7. Largest loss / win .... %s / %s"
          % (res["largest_loss"], res["largest_win"]))
    print("   8. Worst losing streak ... %d" % res["worst_losing_streak"])
    print("   9. Buy & hold ............ %s%% (drawdown %s%%)"
          % (res["buy_hold_return_pct"], res["buy_hold_max_drawdown_pct"]))
    print("  10. Long side ............. %s" % res["by_side"]["long"])
    print("      Short side ........... %s" % res["by_side"]["short"])
    print("\n  Funding is NOT modelled. On the short side especially, treat")
    print("  these numbers as a CEILING (Playbook 5).\n")


# --------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser(description="Regime Rider Bot")
    ap.add_argument("--dir", help="instance directory (config/state/log)")
    ap.add_argument("--tag", default="", help="label used in log lines")
    ap.add_argument("--backtest", action="store_true",
                    help="replay history instead of trading")
    ap.add_argument("--json", help="write backtest result JSON here")
    ap.add_argument("--csv", help="write backtest trade list CSV here")
    args = ap.parse_args()

    setup_paths(args.dir or os.environ.get("RR_DIR"), args.tag)

    if not args.backtest:
        run_once()
        return

    cfg = load_config()
    ex = make_exchange(cfg)
    ex.load_markets()
    mkt = Market(fetch_all_candles(ex, cfg), cfg)
    res = backtest(mkt, cfg)
    name = args.tag or (args.dir or "").rstrip("/").split("/")[-1]
    print_report(res, name)
    if args.json:
        Path(args.json).write_text(json.dumps(res, indent=2))
    if args.csv:
        import csv
        cols = ["side", "entry_date", "exit_date", "reason_in", "reason_out",
                "entry", "exit", "qty", "pnl", "pnl_pct_equity",
                "equity_after"]
        with open(args.csv, "w", newline="") as f:
            w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
            w.writeheader()
            w.writerows(res["trade_list"])


if __name__ == "__main__":
    try:
        main()
    except Exception:
        log.exception("Bot run failed:")
        sys.exit(1)
