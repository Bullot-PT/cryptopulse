# Regime Rider Bot — BTC/USDT Perpetual (Binance USDT-M)

Automates the "Regime Rider v2.4" daily trend strategy validated on
TradingView (BINANCE:BTCUSDT 1D, 2017–2026 backtest):

- **Regime filter:** long only while daily close holds above SMA200 with a
  ±2% hysteresis band.
- **Entries (next open):** fresh regime-up cross, or a close above the
  highest close of the prior 20 days while regime is up and flat.
- **Stops:** initial `max(entry − 2.5×ATR14, highestClose − 4×ATR14)`;
  chandelier trail `highestClose − 4×ATR14`, raised only, once per day.
  Held on-exchange as a reduce-only STOP_MARKET order.
- **Exit:** stop hit, or market exit at next open when regime flips down.
- **Sizing:** `qty = min(equity × 4% / stopDistance, equity × 2.0 / price)`.
  With 10x cross margin this keeps liquidation far beyond the stop.
- **Shorts:** disabled by default. Closed-trade backtest profit factor was
  0.896 before funding costs. Flip `enable_shorts` only after independent
  paper validation (note: short logic is stubbed in config but the current
  bot version intentionally trades long-only).

## Files
- `bot.py` — the bot. One run = one daily decision cycle.
- `config.json` — settings. **Starts in testnet + dry-run.**
- `state.json` — created automatically; the bot's memory between runs.
- `bot.log` — every decision, signal, and order.

## Setup

```bash
pip install ccxt
python bot.py        # first run in dry-run mode, no keys needed for public data
```

Schedule it daily just after the UTC close (cron example, 00:07 UTC):

```
7 0 * * * cd /path/to/regime-rider-bot && /usr/bin/python3 bot.py >> cron.log 2>&1
```

## Phased rollout — do not skip phases

1. **Dry run on real data (2–4 weeks).** `testnet: true, dry_run: true`.
   No keys needed. Read `bot.log` daily; verify signals match the
   TradingView chart.
2. **Testnet execution (4–8 weeks).** Create keys at
   testnet.binancefuture.com, set `dry_run: false`, keep `testnet: true`.
   Verify orders, stop placement, and the stop-hit reconciliation path
   (state resets itself after an intraday stop-out).
3. **Live, small.** Real API key with **futures trade permission only —
   withdrawals disabled, IP whitelist on**. Set `testnet: false`. Fund the
   futures wallet with a fraction first. Scale only after a full quarter
   of the bot doing exactly what the strategy says.

## Safety systems built in

- **Dry-run and testnet defaults** — refuses to touch real money until you
  deliberately change two flags.
- **Exchange reconciliation** — if the exchange shows a position the bot
  didn't open, it refuses to act and tells you. If the exchange shows flat
  while state says long, it concludes the stop fired and resets cleanly.
- **Kill switch** — if account equity falls more than 35% below its peak,
  the bot halts all trading until you manually clear the flag in
  `state.json`.
- **Reduce-only stops** — the protective order can only close, never flip.
- **Missed-run tolerance** — logic is recomputed from full daily history
  each run, so a skipped day is picked up the next run (you lose one day of
  timing, not the plot).

## Known gaps (deliberate, know them)

- Fill price is approximated by the ticker at run time; slight slippage vs
  the true daily open is expected and was not in the backtest either.
- Funding payments are not modeled or tracked; on longs they historically
  cut both ways. Check your funding tab monthly.
- One symbol, one position, long-only. That is the validated scope.

## Disclaimer

Personal automation of your own strategy, provided as-is. Not financial
advice. Futures can lose more than the margin posted. The 2017–2026
backtest (~19–22% CAGR, ~12% max drawdown, longs-only, risk 4%) was
partially fitted to that history; live results will differ, possibly a lot.
Trade only money you can afford to lose entirely.
