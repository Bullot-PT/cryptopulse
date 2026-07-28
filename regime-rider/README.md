# Regime Rider Bot — BTC/USDT Perpetual (Binance USDT-M)

Automates the "Regime Rider v2.4" daily trend strategy validated on
TradingView (BINANCE:BTCUSDT 1D). Runs on the VPS as a systemd timer,
**00:07 UTC daily** — 7 minutes after the daily candle closes.

## Three instances, one codebase

Since 2026-07-28 the same `bot.py` runs **three independent paper instances**
so the long/short question is settled on forward evidence instead of opinion
(Playbook §10). Each instance has its own directory, config, state and log:

| instância | dir na VPS | config | longs | shorts |
|---|---|---|---|---|
| long-only | `/opt/regime-rider/long` | `config-long.json` | ✅ | ❌ |
| short-only | `/opt/regime-rider/short` | `config-short.json` | ❌ | ✅ |
| long+short | `/opt/regime-rider/both` | `config-both.json` | ✅ | ✅ |

`long` is the continuation of the original record (its `state.json` and
`bot.log` were carried over). `short` and `both` started 2026-07-28.

**All three are `dry_run: true` with no API keys — nothing touches real
money.** They exist to accumulate a forward record.

## The rules

- **Regime filter:** `regimeUp` while daily close holds above SMA200 with a
  ±2% hysteresis band. "Regime down" = not up.
- **Long entry (next open):** fresh regime-up cross, or a close above the
  **highest CLOSE** of the prior 20 days while regime is up and flat.
- **Short entry (next open):** exact mirror — fresh regime-down cross, or a
  close below the **lowest CLOSE** of the prior 20 days while regime is down
  and flat.
- **Stops:** long `max(entry − 2.5×ATR14, highestClose − 4×ATR14)`, trailed
  only upward; short `min(entry + 2.5×ATR14, lowestClose + 4×ATR14)`, trailed
  only downward. Held on-exchange as a reduce-only STOP_MARKET order.
- **Exit:** stop hit, or market exit at next open when the regime flips
  against the position.
- **Sizing:** `qty = min(equity × 4% / stopDistance, equity × cap / price)`,
  cap **2.0× equity long / 1.0× equity short**. The short cap is hard-clamped
  in code — the leverage framework does not negotiate it.
- **One position at a time.** Long and short never coexist.

> Note on `HH20`/`LL20`: these are extremes of daily **closes**, not intraday
> highs/lows. Reading them off a chart's wicks gives a different (higher)
> threshold than the bot actually uses.

## Files

- `bot.py` — the bot. One run = one daily decision cycle. Also does replay.
- `config-long.json` / `config-short.json` / `config-both.json` — the three
  live instance configs.
- `config.json` — legacy single-instance config, kept for reference only.
- `status.md` — auto-generated snapshot of all three instances on the VPS
  (written by the `vps-bot-log.yml` workflow). **Do not edit by hand.**
- `backtest.md` + `backtest-*.csv` — replay results (written by
  `vps-backtest-regime-rider.yml`). **Do not edit by hand.**

## Running it

```bash
pip install ccxt

python bot.py --dir /opt/regime-rider/long          # one daily cycle
python bot.py --dir /opt/regime-rider/short --backtest   # replay history
python bot.py --dir /opt/regime-rider/both --backtest \
    --json out.json --csv trades.csv
```

Deployment is by GitHub Actions, never by SSH:
`vps-deploy-regime-rider.yml` → Run workflow.

## Replay / backtest mode

`--backtest` walks the full available daily history through **the same
`decide()` function that trades live**. That is the point: it verifies the
implementation, it does not tune it.

Conventions, stated so they can be challenged (Playbook §1):

- Decision at the **close** of day *i*, execution at the **open** of day *i+1*.
- Stops fire intraday on any later day. If the day **opens beyond** the stop,
  the fill is the open, not the stop — gaps cost money and the sim admits it.
- The stop is checked **before** that day's close-based trail update.
- Commission `commission_pct` (default **0.04% per side**, Binance USDT-M
  taker) charged on entry and exit.
- Equity compounds; position size uses equity at entry.
- **Funding is NOT modelled.** Nor is slippage beyond the gap rule. Treat the
  favourable side of any result as a **ceiling** — this matters most on the
  short side, where the TradingView A/B already gave a closed-trade profit
  factor of 0.896 *before* funding.
- The replay is not out-of-sample. It is an implementation check and a source
  of trade-level forensics, not evidence that the rules work.

## Phased rollout — do not skip phases

1. **Dry run on real data.** `testnet: true, dry_run: true`. No keys needed.
   ← **all three instances are here.**
2. **Testnet / demo execution.** Verify orders, stop placement and the
   stop-hit reconciliation path.
3. **Live, small.** Real API key with **futures trade permission only —
   withdrawals disabled, IP whitelist on `169.58.80.103`**. Keys go in as
   GitHub Secrets (`RR_BINANCE_KEY` / `RR_BINANCE_SECRET`) and are injected
   into `config.json` **on the VPS**, never into this repo. **This repo is
   public — never commit a key here.**

## Safety systems built in

- **Dry-run and testnet defaults** — refuses to touch real money until two
  flags are deliberately changed.
- **Exchange reconciliation** — a position the bot did not open makes it
  refuse to act; a flat exchange with a long/short in state is read as a
  stop-out and the state resets cleanly.
- **Kill switch** — equity more than 35% below its peak halts all trading
  until the flag is cleared by hand in `state.json`.
- **Reduce-only stops** — the protective order can only close, never flip.
- **Short notional clamp** — `short_cap_x > 1.0` is forced back to 1.0.
- **Missed-run tolerance** — logic is recomputed from full daily history each
  run, so a skipped day is picked up on the next one (you lose one day of
  timing, not the plot). Note this heals the *signal*, not the *time*: a
  machine that is off for a week makes no decisions at all — which is exactly
  why this moved off a desktop and onto the VPS.

## Known gaps (deliberate, know them)

- Fill price is approximated by the ticker at run time; slippage vs the true
  daily open is expected and was not in the backtest either.
- Funding payments are neither modelled nor tracked. On shorts held through a
  trend this is a real, unmeasured cost. Check the funding tab monthly.
- One symbol, one position per instance.

## Disclaimer

Personal automation of your own strategy, provided as-is. Not financial
advice. Futures can lose more than the margin posted. Any backtest here was
partially fitted to the same history it is measured on; live results will
differ, possibly a lot. Trade only money you can afford to lose entirely.
