import fs from 'fs';

const res = await fetch('https://api.hyperliquid.xyz/info', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'metaAndAssetCtxs' })
});
const [meta, ctxs] = await res.json();
const coins = {};
const hlSet = new Set();
let total = 0;
(meta.universe || []).forEach((u, i) => {
  const c = ctxs[i];
  if (!c || u.isDelisted) return;
  hlSet.add(u.name);
  const oi = parseFloat(c.openInterest) * parseFloat(c.markPx);
  if (oi > 0) { coins[u.name] = Math.round(oi); total += oi; }
});
const topN = (o, n) => Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n));
const top = topN(coins, 60);

let bb = {}, ok = {};
try {
  const j = await fetch('https://api.bybit.com/v5/market/tickers?category=linear').then(r => r.json());
  (j.result && j.result.list || []).forEach(t => {
    if (!t.symbol || !t.symbol.endsWith('USDT')) return;
    let b = t.symbol.slice(0, -4);
    if (b.startsWith('1000')) b = 'k' + b.slice(4);
    const v = parseFloat(t.openInterestValue);
    if (v > 0) bb[b] = (bb[b] || 0) + Math.round(v);
  });
} catch (e) { console.log('bybit failed', e.message); }
try {
  const j = await fetch('https://www.okx.com/api/v5/public/open-interest?instType=SWAP').then(r => r.json());
  (j.data || []).forEach(d => {
    const b0 = (d.instId || '').split('-')[0];
    const b = hlSet.has(b0) ? b0 : (hlSet.has('k' + b0) ? 'k' + b0 : b0);
    const v = parseFloat(d.oiUsd);
    if (v > 0) ok[b] = (ok[b] || 0) + Math.round(v);
  });
} catch (e) { console.log('okx failed', e.message); }

let agg = 0, ex = {};
try {
  const [gxr, spr] = await Promise.all([
    fetch('https://api.coingecko.com/api/v3/derivatives/exchanges?per_page=100&page=1').then(r => r.json()),
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd').then(r => r.json())
  ]);
  const btcPx = spr.bitcoin.usd;
  gxr.forEach(e => {
    const oi = (parseFloat(e.open_interest_btc) || 0) * btcPx;
    if (oi > 0) { agg += oi; ex[(e.name || '').replace(' (Futures)', '')] = Math.round(oi); }
  });
} catch (e) { console.log('gx fetch failed', e.message); }

const path = 'data/oi-history.json';
let hist = { samples: [] };
try { hist = JSON.parse(fs.readFileSync(path, 'utf8')); } catch (e) {}
const sample = { t: Date.now(), total: Math.round(total), coins: top };
if (Object.keys(bb).length) sample.bb = topN(bb, 40);
if (Object.keys(ok).length) sample.ok = topN(ok, 40);
if (agg > 0) { sample.agg = Math.round(agg); sample.ex = topN(ex, 12); }
hist.samples.push(sample);
const cutoff = Date.now() - 8 * 86400 * 1000;
hist.samples = hist.samples.filter(s => s.t > cutoff);
fs.mkdirSync('data', { recursive: true });
fs.writeFileSync(path, JSON.stringify(hist));
console.log('samples stored:', hist.samples.length);

// Kalshi mirror — their API blocks browsers, so the bot fetches it server-side.
try {
  let cursor = '', out = [], pages = 0;
  while (pages < 5) {
    const u = 'https://api.elections.kalshi.com/trade-api/v2/events?limit=200&status=open&with_nested_markets=true' +
      (cursor ? '&cursor=' + encodeURIComponent(cursor) : '');
    const r = await fetch(u, { headers: { 'Accept': 'application/json', 'User-Agent': 'cryptopulse-bot/1.0' } });
    if (!r.ok) { console.log('kalshi http', r.status); break; }
    const j = await r.json();
    (j.events || []).forEach(ev => {
      const mkts = (ev.markets || []).slice(0, 6).map(m => ({
        tk: m.ticker, ti: m.title || m.yes_sub_title || '',
        y: m.last_price ?? m.yes_bid ?? null, v: m.volume_24h ?? m.volume ?? 0
      }));
      out.push({ t: ev.title, tk: ev.event_ticker, s: ev.series_ticker, m: mkts });
    });
    cursor = j.cursor;
    pages++;
    if (!cursor || !(j.events || []).length) break;
  }
  if (out.length) {
    fs.writeFileSync('data/kalshi.json', JSON.stringify({ t: Date.now(), events: out }));
    console.log('kalshi events:', out.length);
  } else {
    console.log('kalshi: no events returned');
  }
} catch (e) { console.log('kalshi failed', e.message); }
