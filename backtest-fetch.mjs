// One-off fetcher: ~3 years of DAILY liquidations + open interest + funding for the majors,
// via Coinalyze (free tier keeps daily data indefinitely; intraday only ~2 months).
// QUOTA RULE: each SYMBOL in a request = 1 credit of the 40/min limit → 20-symbol batches, 31s apart.
import fs from 'fs';
const KEY = process.env.COINALYZE_KEY;
if (!KEY) { console.log('no COINALYZE_KEY'); process.exit(1); }
const CZ = 'https://api.coinalyze.net/v1';
const sleep = s => new Promise(r => setTimeout(r, s * 1000));
const get = async u => {
  for (let a = 0; a < 5; a++) {
    const r = await fetch(u);
    if (r.status === 429) { const ra = Math.min(120, +(r.headers.get('retry-after') || 25) + 2); console.log('429, waiting ' + ra + 's'); await sleep(ra); continue; }
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }
  throw new Error('still 429');
};
const mk = await get(CZ + '/future-markets?api_key=' + KEY);
const wantBases = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'SUI', 'ADA', 'LINK', 'AVAX', 'LTC', 'BNB', 'HYPE'];
const exPref = ['A', '6', '3', 'F', '0', 'K', '2', 'W', 'H'];
const cands = [];
(Array.isArray(mk) ? mk : []).forEach(m => {
  if (!m.is_perpetual) return;
  const b = (m.base_asset || '').toUpperCase();
  if (!wantBases.includes(b)) return;
  const q = (m.quote_asset || '').toUpperCase();
  if (q !== 'USDT' && q !== 'USD') return;
  const suf = ((m.symbol || '').split('.')[1] || '');
  const pr = exPref.indexOf(suf);
  if (pr < 0) return;
  cands.push({ sym: m.symbol, base: b, pr });
});
cands.sort((a, b) => a.pr - b.pr || (a.base < b.base ? -1 : 1));
const chosen = cands.slice(0, 120);
const nowS = Math.floor(Date.now() / 1000);
const from = nowS - Math.floor(10.2 * 365 * 86400); /* asks for 10y — the API returns whatever actually exists (perps only really date from ~2019) */
const out = { t: Date.now(), from, note: 'daily data, majors, liq/oi summed across top exchanges; fund = best exchange (pref order)', coins: {} };
const ensure = b => out.coins[b] || (out.coins[b] = { liq: {}, oi: {}, fund: {} });
let first = true;
async function pull(endpoint, extra, apply) {
  for (let i = 0; i < chosen.length; i += 20) {
    const batch = chosen.slice(i, i + 20);
    if (!first) await sleep(31);
    first = false;
    const u = CZ + '/' + endpoint + '?symbols=' + encodeURIComponent(batch.map(b => b.sym).join(',')) +
      '&interval=daily&from=' + from + '&to=' + nowS + extra + '&api_key=' + KEY;
    try {
      const r = await get(u);
      (Array.isArray(r) ? r : []).forEach(row => {
        const meta = batch.find(c => c.sym === row.symbol); if (!meta) return;
        (row.history || []).forEach(h => apply(ensure(meta.base), h, meta));
      });
      console.log(endpoint, 'batch', (i / 20 + 1) + '/' + Math.ceil(chosen.length / 20), 'ok');
    } catch (e) { console.log(endpoint, 'batch failed', e.message); }
  }
}
await pull('liquidation-history', '&convert_to_usd=true', (c, h) => {
  const a = c.liq[h.t] || (c.liq[h.t] = [0, 0]); a[0] += (+h.l || 0); a[1] += (+h.s || 0);
});
await pull('open-interest-history', '&convert_to_usd=true', (c, h) => {
  c.oi[h.t] = (c.oi[h.t] || 0) + (+h.c || 0); /* daily close, summed across exchanges */
});
await pull('funding-rate-history', '', (c, h) => {
  if (c.fund[h.t] == null) c.fund[h.t] = +h.c || 0; /* first hit = preferred exchange (sorted) */
});
fs.mkdirSync('data', { recursive: true });
fs.writeFileSync('data/backtest-3y.json', JSON.stringify(out));
const b0 = out.coins.BTC || { liq: {} };
console.log('backtest data:', Object.keys(out.coins).length, 'coins; BTC days:', Object.keys(b0.liq).length,
  '; range:', new Date(Math.min(...Object.keys(b0.liq).map(Number)) * 1000).toISOString().slice(0, 10), '→',
  new Date(Math.max(...Object.keys(b0.liq).map(Number)) * 1000).toISOString().slice(0, 10));
