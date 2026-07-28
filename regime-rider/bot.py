#!/usr/bin/env python3
"""
Regime Rider Bot — BTC/USDT perpetual futures (Binance USDT-M)

Implements the "Regime Rider v2.4" strategy developed and backtested on
TradingView (BINANCE:BTCUSDT, 1D):

  Regime:   long-only regime filter. regimeUp turns TRUE when daily close
            > SMA200 * (1 + band), FALSE when close < SMA200 * (1 - band).
  Entry:    at the daily open following either (a) a fresh regime-up cross,
            or (b) a close above the highest close of the prior 20 days
            while the regime is up and the bot is flat.
  Stop:     initial = max(entry - 2.5*ATR14, highestClose - 4*ATR14).
            Trails at highestClose - 4*ATR14, updated only upward, once
            per day after the UTC close. Placed as a reduce-only
            STOP_MARKET order on the exchange.
  Exit:     stop hit (intraday, exchange-side), or market-close at the
            next open if the regime flips down.
  Sizing:   qty = min(equity * risk_pct / stop_distance,
                      equity * long_cap_x / price), rounded to lot step.

Run this ONCE PER DAY shortly after 00:00 UTC (e.g. cron: "7 0 * * *").
It is deterministic from exchange OHLCV history plus a small local state
file, so a missed day self-heals on the next run.

SAFETY DEFAULTS: dry_run=true and testnet=true in config.json. The bot
refuses to run live until you deliberately change both. Use an API key
with FUTURES TRADE permission ONLY — withdrawals disabled, IP whitelisted.

DISCLAIMER: educational/personal-automation code, not financial advice.
Futures trading can lose more than your initial margin. Past backtest
performance does not predict live results. You are responsible for any
orders this software places.
"""

import json
import logging
import math
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
# Paths & logging
# --------------------------------------------------------------------------
ROOT = Path(__file__).resolve().parent
CONFIG_PATH = ROOT / "config.json"
STATE_PATH = ROOT / "state.json"
LOG_PATH = ROOT / "bot.log"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.FileHandler(LOG_PATH), logging.StreamHandler()],
)
log = logging.getLogger("regime-rider")


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
    "long_cap_x": 2.0,                # max long notional as multiple of equity
    "enable_shorts": False,           # OFF: closed-trade PF 0.896 in backtest
    "short_cap_x": 1.0,
    "max_equity_drawdown_halt": 0.35, # kill switch: halt if equity < 65% of peak
    "leverage": 10,                   # margin headroom only; sizing controls risk
    "paper_equity": 5000.0,           # simulated equity used in dry_run mode
}

@dataclass
class BotState:
    in_position: bool = False
    side: str = ""                    # "long" or "short"
    entry_price: float = 0.0
    entry_ts: int = 0                 # ms timestamp of entry candle
    qty: float = 0.0
    extreme_close: float = 0.0        # highest close since entry (long)
    trail_stop: float = 0.0
    stop_order_id: str = ""
    peak_equity: float = 0.0
    halted: bool = False


def load_config() -> dict:
    if not CONFIG_PATH.exists():
        CONFIG_PATH.write_text(json.dumps(DEFAULT_CONFIG, indent=2))
        log.error("No config.json found. A template was created at %s — "
                  "review it, then re-run.", CONFIG_PATH)
        sys.exit(1)
    cfg = {**DEFAULT_CONFIG, **json.loads(CONFIG_PATH.read_text())}
    return cfg


def load_state() -> BotState:
    if STATE_PATH.exists():
        return BotState(**json.loads(STATE_PATH.read_text()))
    return BotState()


def save_state(state: BotState) -> None:
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
        raise RuntimeError(f"Only {len(ohlcv)} candles returned; need "
                           f">{cfg['regime_len']}. Aborting.")
    now_ms = ex.milliseconds()
    day_ms = 86_400_000
    if ohlcv[-1][0] > now_ms - day_ms:   # last candle not yet closed
        ohlcv = ohlcv[:-1]
    return ohlcv


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
            side = p.get("side")
            if qty > 0 and side == "short":
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
    return ex.create_order(cfg["symbol"], "stop_market", side, qty, None, params)


def cancel_order_safe(ex, cfg, order_id, dry):
    if dry or not order_id or order_id == "dry":
        return
    try:
        ex.cancel_order(order_id, cfg["symbol"])
    except Exception as e:                      # already filled/cancelled
        log.warning("Cancel of order %s failed (may be filled): %s",
                    order_id, e)


# --------------------------------------------------------------------------
# Core daily logic
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

    # -- data & indicators -------------------------------------------------
    candles = fetch_candles(ex, cfg)
    ts = [c[0] for c in candles]
    highs = [c[2] for c in candles]
    lows = [c[3] for c in candles]
    closes = [c[4] for c in candles]

    sma200 = sma(closes, cfg["regime_len"])
    atr = wilder_atr(highs, lows, closes, cfg["atr_len"])
    regime = compute_regime(closes, sma200, cfg["band_pct"])

    i = len(closes) - 1                     # last CLOSED daily candle
    c, a, r, r_prev = closes[i], atr[i], regime[i], regime[i - 1]
    hh = max(closes[i - cfg["breakout_len"]:i])   # highest close, prior N days
    price_now = ex.fetch_ticker(cfg["symbol"])["last"]

    log.info("Close=%.2f SMA200=%.2f ATR=%.2f regime=%s (prev %s) HH%d=%.2f",
             c, sma200[i], a, "UP" if r else "DOWN",
             "UP" if r_prev else "DOWN", cfg["breakout_len"], hh)

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
                  "delete 'halted' from state.json to resume.",
                  equity, cfg["max_equity_drawdown_halt"] * 100,
                  state.peak_equity)
        save_state(state)
        return

    # -- reconcile local state with the exchange ---------------------------
    # In dry run there is no exchange position; simulate agreement with
    # local state (a simulated stop-hit check runs below instead).
    if dry:
        exch_qty = state.qty if (state.in_position and state.side == "long") \
            else 0.0
        # Simulated stop-out: if any day's low since entry pierced the
        # trail, the exchange stop would have fired intraday.
        if state.in_position and state.trail_stop > 0:
            recent_lows = [lows[j] for j in range(len(ts))
                           if ts[j] > state.entry_ts]
            if recent_lows and min(recent_lows) <= state.trail_stop:
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

    # -- position management (runs after each daily close) -----------------
    if state.in_position and state.side == "long":
        # 1) regime breakdown -> exit at market ("next open")
        if not r:
            log.info("Regime DOWN -> closing long %.6f at market.", state.qty)
            cancel_order_safe(ex, cfg, state.stop_order_id, dry)
            place_market(ex, cfg, "sell", state.qty, dry, reduce_only=True)
            state = BotState(peak_equity=state.peak_equity)
            save_state(state)
            return
        # 2) trail the chandelier upward only
        state.extreme_close = max(state.extreme_close, c)
        candidate = state.extreme_close - cfg["chand_mult"] * a
        if candidate > state.trail_stop:
            log.info("Raising stop %.2f -> %.2f", state.trail_stop, candidate)
            cancel_order_safe(ex, cfg, state.stop_order_id, dry)
            order = place_stop_market(ex, cfg, "sell", state.qty,
                                      candidate, dry)
            state.trail_stop = candidate
            state.stop_order_id = str(order.get("id", ""))
        else:
            log.info("Stop unchanged at %.2f", state.trail_stop)
        save_state(state)
        return

    # -- flat: look for an entry -------------------------------------------
    fresh_cross = r and not r_prev
    breakout = r and c > hh
    if not (fresh_cross or breakout):
        log.info("Flat, no signal. Done.")
        save_state(state)
        return

    reason = "regime_cross" if fresh_cross else "breakout_20d"
    stop_dist = cfg["init_mult"] * a
    qty_risk = (equity * cfg["risk_pct"]) / stop_dist
    qty_cap = (equity * cfg["long_cap_x"]) / price_now
    qty = round_qty(ex, cfg, min(qty_risk, qty_cap))
    if qty <= 0:
        log.warning("Computed qty rounds to zero (equity too small vs lot "
                    "step). No trade.")
        save_state(state)
        return

    notional = qty * price_now
    log.info("ENTRY signal (%s): qty=%.6f (~%.2f USDT, %.2fx equity), "
             "risk=%.2f USDT, stopDist=%.2f",
             reason, qty, notional, notional / equity,
             equity * cfg["risk_pct"], stop_dist)

    if not dry:
        try:
            ex.set_leverage(cfg["leverage"], cfg["symbol"])
            ex.set_margin_mode("cross", cfg["symbol"])
        except Exception as e:
            log.warning("Leverage/margin-mode call failed (may already be "
                        "set): %s", e)

    place_market(ex, cfg, "buy", qty, dry)
    entry_price = price_now                     # approximation of fill
    extreme = c
    init_stop = max(entry_price - cfg["init_mult"] * a,
                    extreme - cfg["chand_mult"] * a)
    order = place_stop_market(ex, cfg, "sell", qty, init_stop, dry)

    state = BotState(
        in_position=True, side="long", entry_price=entry_price,
        entry_ts=ts[i], qty=qty, extreme_close=extreme,
        trail_stop=init_stop, stop_order_id=str(order.get("id", "")),
        peak_equity=state.peak_equity,
    )
    save_state(state)
    log.info("Long opened. Initial stop %.2f (%.1f%% away).",
             init_stop, 100 * (entry_price - init_stop) / entry_price)


if __name__ == "__main__":
    try:
        run_once()
    except Exception:
        log.exception("Bot run failed:")
        sys.exit(1)
