import fs from 'fs';

const now = Date.now();
const jget = (u, o) => fetch(u, o).then(r => r.json());
const post = (u, body) => fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json());
const fmtBig = n => n >= 1e9 ? '$' + (n/1e9).toFixed(2) + 'B' : n >= 1e6 ? '$' + (n/1e6).toFixed(1) + 'M' : '$' + Math.round(n).toLocaleString();
const fmtPx = p => p >= 1000 ? '$' + Math.round(p).toLocaleString() : p >= 1 ? '$' + p.toFixed(2) : '$' + p.toPrecision(4);

// ---------------- OI collection (Hyperliquid + Bybit + OKX + CoinGecko) ----------------
const [meta, ctxs] = await post('https://api.hyperliquid.xyz/info', { type: 'metaAndAssetCtxs' });
const coins = {}, hlSet = new Set(); let total = 0;
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
  /* api.bybit.com serves an HTML block page to GitHub runner IPs — try the mirror host too and verify JSON */
  let j = null;
  for (const h of ['api.bybit.com', 'api.bytick.com']) {
    try {
      const r = await fetch('https://' + h + '/v5/market/tickers?category=linear', { headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0 (cryptopulse-bot)' } });
      if (!r.ok) { console.log('bybit', h, 'http', r.status); continue; }
      const txt = await r.text();
      try { j = JSON.parse(txt); } catch (e2) { console.log('bybit', h, 'non-json:', txt.slice(0, 60).replace(/\s+/g, ' ')); continue; }
      if (j && j.result && j.result.list) break;
      j = null;
    } catch (e2) { console.log('bybit', h, 'failed', e2.message); }
  }
  if (j) {
    (j.result.list || []).forEach(t => {
      if (!t.symbol || !t.symbol.endsWith('USDT')) return;
      let b = t.symbol.slice(0, -4);
      if (b.startsWith('1000')) b = 'k' + b.slice(4);
      const v = parseFloat(t.openInterestValue);
      if (v > 0) bb[b] = (bb[b] || 0) + Math.round(v);
    });
  } else console.log('bybit OI unavailable this run (all hosts blocked)');
} catch (e) { console.log('bybit failed', e.message); }
try {
  const j = await jget('https://www.okx.com/api/v5/public/open-interest?instType=SWAP');
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
    jget('https://api.coingecko.com/api/v3/derivatives/exchanges?per_page=100&page=1'),
    jget('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd')
  ]);
  const btcPx = spr.bitcoin.usd;
  gxr.forEach(e => {
    const oi = (parseFloat(e.open_interest_btc) || 0) * btcPx;
    if (oi > 0) { agg += oi; ex[(e.name || '').replace(' (Futures)', '')] = Math.round(oi); }
  });
} catch (e) { console.log('gx fetch failed', e.message); }

let hist = { samples: [] };
try { hist = JSON.parse(fs.readFileSync('data/oi-history.json', 'utf8')); } catch (e) {}
const sample = { t: now, total: Math.round(total), coins: top };
if (Object.keys(bb).length) sample.bb = topN(bb, 40);
if (Object.keys(ok).length) sample.ok = topN(ok, 40);
if (agg > 0) { sample.agg = Math.round(agg); sample.ex = topN(ex, 12); }
hist.samples.push(sample);
hist.samples = hist.samples.filter(s => s.t > now - 8 * 86400 * 1000);
fs.mkdirSync('data', { recursive: true });
fs.writeFileSync('data/oi-history.json', JSON.stringify(hist));
console.log('OI samples stored:', hist.samples.length);

// ---------------- Coinalyze: MARKET-WIDE liquidation totals, 24/7 (needs COINALYZE_KEY secret) ----------------
// Feeds the dashboard's 1h/1D/1W 🌐 stats. QUOTA RULE (learned in run #33): each SYMBOL in a request
// counts as ONE API call toward the 40/min limit — a 20-symbol batch costs 20 credits, and 429s come back
// as parseable JSON (no throw), so they failed SILENTLY. Fix: 1 batch per 31s, real status checks with
// Retry-After honoring, hourly 7d pass only once per hour (merged + persisted), minute pass every run.
// Started HERE (before the slow book scans) and awaited at the end so the paced sleeps cost no wall time.
const CZ_KEY = process.env.COINALYZE_KEY;
const czPromise = CZ_KEY ? (async () => {
  try {
    const CZ = 'https://api.coinalyze.net/v1';
    const czSleep = s => new Promise(r => setTimeout(r, s * 1000));
    const czGet = async u => {
      for (let a = 0; a < 4; a++) {
        const r = await fetch(u);
        if (r.status === 429) { const ra = Math.min(120, +(r.headers.get('retry-after') || 25) + 2); console.log('coinalyze 429, waiting ' + ra + 's'); await czSleep(ra); continue; }
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      }
      throw new Error('still 429 after retries');
    };
    const mk2 = await czGet(CZ + '/future-markets?api_key=' + CZ_KEY);
    const wantBases = new Set(['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'HYPE', 'SUI', 'ADA', 'LINK', 'AVAX', 'LTC', 'BNB']);
    Object.keys(topN(coins, 30)).forEach(c => wantBases.add(c.replace(/^k/, '')));
    const exPref = ['A', '6', '3', 'F', '0', 'K', '2', 'W', 'H'];
    const cands = [];
    (Array.isArray(mk2) ? mk2 : []).forEach(m => {
      if (!m.is_perpetual) return;
      const base = (m.base_asset || '').toUpperCase();
      if (!wantBases.has(base)) return;
      const q = (m.quote_asset || '').toUpperCase();
      if (q !== 'USDT' && q !== 'USD') return; /* USDC perps skipped — tiny liq volume, saves quota for more exchanges */
      const suf = ((m.symbol || '').split('.')[1] || '');
      const pr = exPref.indexOf(suf);
      cands.push({ sym: m.symbol, base, pr: pr < 0 ? 99 : pr });
    });
    cands.sort((a, b) => a.pr - b.pr || (a.base < b.base ? -1 : 1));
    const chosen = cands.slice(0, 120); /* 6 batches/pass — every base on the top exchanges, within quota */
    const nowS = Math.floor(now / 1000);
    const round2 = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, [Math.round(v[0]), Math.round(v[1])]]));
    let failed = 0;
    const fetchLiq = async (interval, from) => {
      const aggB = {}, perCoin = {};
      for (let i = 0; i < chosen.length; i += 20) {
        const batch = chosen.slice(i, i + 20);
        if (i > 0) await czSleep(31); /* 20 credits per batch → ≤39 credits/min */
        const u = CZ + '/liquidation-history?symbols=' + encodeURIComponent(batch.map(b => b.sym).join(',')) +
          '&interval=' + interval + '&from=' + from + '&to=' + nowS + '&convert_to_usd=true&api_key=' + CZ_KEY;
        try {
          const r = await czGet(u);
          (Array.isArray(r) ? r : []).forEach(row => {
            const meta2 = batch.find(c => c.sym === row.symbol); if (!meta2) return;
            (row.history || []).forEach(h => {
              const L = +h.l || 0, S = +h.s || 0, hk = h.t;
              const a = aggB[hk] || (aggB[hk] = [0, 0]); a[0] += L; a[1] += S;
              const pcs = perCoin[meta2.base] || (perCoin[meta2.base] = {});
              const pc = pcs[hk] || (pcs[hk] = [0, 0]); pc[0] += L; pc[1] += S;
            });
          });
        } catch (e) { failed++; console.log('coinalyze batch failed', e.message); }
      }
      return { agg: round2(aggB), coins: Object.fromEntries(Object.entries(perCoin).map(([c, m2]) => [c, round2(m2)])) };
    };
    let old = {};
    try { old = JSON.parse(fs.readFileSync('data/liq-totals.json', 'utf8')); } catch (e) {}
    const out = { t: now, symbols: chosen.length, agg: old.agg || {}, coins: old.coins || {}, aggMin: old.aggMin || {}, coinsMin: old.coinsMin || {}, hT: old.hT || 0 };
    /* hourly pass: once per hour is enough (buckets only complete hourly) — full 7d only when starting empty */
    const doHourly = !out.hT || now - out.hT > 55 * 60 * 1000 || !Object.keys(out.agg).length;
    if (doHourly) {
      const hFrom = (out.hT && Object.keys(out.agg).length) ? nowS - 3 * 3600 : nowS - 7 * 86400;
      const before = failed;
      const hourly = await fetchLiq('1hour', hFrom);
      if (failed === before && Object.keys(hourly.agg).length) { /* only replace when the pass was complete — never publish partial sums */
        const keep = ([ts]) => +ts < hFrom;
        out.agg = { ...Object.fromEntries(Object.entries(out.agg).filter(keep)), ...hourly.agg };
        const nc = {};
        new Set([...Object.keys(out.coins), ...Object.keys(hourly.coins)]).forEach(b => {
          nc[b] = { ...Object.fromEntries(Object.entries(out.coins[b] || {}).filter(keep)), ...(hourly.coins[b] || {}) };
        });
        out.coins = nc;
        out.hT = now;
      } else console.log('coinalyze: hourly pass incomplete — keeping previous hourly data');
      await czSleep(31);
    }
    /* minute pass: every run — feeds the live "1h 🌐" stat */
    const before2 = failed;
    const minute = await fetchLiq('1min', nowS - 2 * 3600);
    if (failed === before2 && Object.keys(minute.agg).length) { out.aggMin = minute.agg; out.coinsMin = minute.coins; }
    else console.log('coinalyze: minute pass incomplete — keeping previous minute data');
    /* prune */
    const cutH = nowS - 7.3 * 86400, cutM = nowS - 3 * 3600;
    const pruneTo = (o2, cut) => Object.fromEntries(Object.entries(o2).filter(([ts]) => +ts >= cut));
    out.agg = pruneTo(out.agg, cutH); out.aggMin = pruneTo(out.aggMin, cutM);
    Object.keys(out.coins).forEach(b => { out.coins[b] = pruneTo(out.coins[b], cutH); if (!Object.keys(out.coins[b]).length) delete out.coins[b]; });
    Object.keys(out.coinsMin).forEach(b => { out.coinsMin[b] = pruneTo(out.coinsMin[b], cutM); if (!Object.keys(out.coinsMin[b]).length) delete out.coinsMin[b]; });
    fs.mkdirSync('data', { recursive: true });
    fs.writeFileSync('data/liq-totals.json', JSON.stringify(out));
    const totalD = Object.entries(out.agg).filter(([ts]) => +ts >= nowS - 86400).reduce((s, [, v]) => s + v[0] + v[1], 0);
    console.log('coinalyze:', chosen.length, 'symbols across', wantBases.size, 'bases,', (doHourly ? 'hourly+minute' : 'minute-only'), 'pass,',
      Object.keys(out.agg).length, 'hourly +', Object.keys(out.aggMin).length, 'minute buckets,', failed, 'failed batches, 24h total', fmtBig(totalD));
  } catch (e) { console.log('coinalyze failed', e.message); }
})() : null;

// ---------------- CoinGecko mirror (browser IPs get rate-limited/blocked; GitHub's servers don't) ----------------
// The dashboard falls back to this file whenever CoinGecko refuses the user's browser.
try {
  const mir = { t: now };
  try {
    const tr = await jget('https://api.coingecko.com/api/v3/search/trending');
    mir.trending = (tr.coins || []).slice(0, 8).map(w => w.item);
  } catch (e) { console.log('cg mirror trending failed', e.message); }
  await new Promise(r => setTimeout(r, 1500));
  try { mir.global = (await jget('https://api.coingecko.com/api/v3/global')).data || null; } catch (e) { console.log('cg mirror global failed', e.message); }
  await new Promise(r => setTimeout(r, 1500));
  try {
    const mk = await jget('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&price_change_percentage=24h');
    mir.markets = (Array.isArray(mk) ? mk : []).map(c => ({
      id: c.id, symbol: c.symbol, name: c.name, image: c.image,
      current_price: c.current_price, market_cap: c.market_cap, market_cap_rank: c.market_cap_rank,
      total_volume: c.total_volume, price_change_percentage_24h: c.price_change_percentage_24h
    }));
  } catch (e) { console.log('cg mirror markets failed', e.message); }
  fs.writeFileSync('data/cg-mirror.json', JSON.stringify(mir));
  console.log('cg mirror:', (mir.trending || []).length, 'trending,', (mir.markets || []).length, 'markets,', mir.global ? 'global ok' : 'no global');
} catch (e) { console.log('cg mirror failed', e.message); }

// ---------------- Upbit (Korea) — SPOT ONLY: caution flags, listings, verified identity map ----------------
// Browsers can read Upbit's ticker/market lists, but are CORS-blocked on isDetails=true, the announcements API
// and the WebSocket — and CoinGecko refuses browser IPs entirely. So those three come from here.
// The map matters: the same ticker is NOT the same coin across venues (Upbit DATA ≠ Binance DATA), so the
// kimchi premium is only ever computed for pairs whose CoinGecko coin_id matches on both sides.
let upbitAlerts = [];
try {
  const UH = { 'Accept': 'application/json', 'User-Agent': 'cryptopulse-bot/1.0' };
  const nap = ms => new Promise(r => setTimeout(r, ms));
  let prevU = {};
  try { prevU = JSON.parse(fs.readFileSync('data/upbit.json', 'utf8')); } catch (e) {}
  const up = { t: now };

  /* 1) KRW markets + Upbit's own warning / caution flags (투자유의 종목) */
  let umk = null;
  for (let i = 0; i < 3 && !umk; i++) {
    try {
      const r = await fetch('https://api.upbit.com/v1/market/all?isDetails=true', { headers: UH });
      if (r.ok) { const j = await r.json(); if (Array.isArray(j) && j.length) umk = j; }
      else console.log('upbit market/all http', r.status);
    } catch (e) { console.log('upbit market/all failed', e.message); }
    if (!umk) await nap(2000);
  }
  if (umk) {
    up.markets = umk.filter(m => (m.market || '').startsWith('KRW-')).map(m => {
      const ev = m.market_event || {};
      const ca = Object.entries(ev.caution || {}).filter(([, v]) => v).map(([k]) => k);
      const o = { s: m.market.slice(4), n: m.english_name || '' };
      if (ev.warning) o.w = 1;
      if (ca.length) o.c = ca;
      return o;
    });
  } else if (prevU.markets) { up.markets = prevU.markets; up.stale = 1; }

  /* 2) listings / delistings — a real diff of the KRW market list, stamped when first seen */
  up.recent = (prevU.recent || []).filter(r => now - r.t < 45 * 86400000);
  const curS = (up.markets || []).map(m => m.s), oldS = (prevU.markets || []).map(m => m.s);
  if (umk && curS.length && oldS.length) {
    curS.filter(s => !oldS.includes(s)).forEach(s => {
      up.recent.push({ s, t: now, k: 'list' });
      upbitAlerts.push({ key: 'list-' + s, msg: '🇰🇷 *Upbit listing* — ' + s + '/KRW is now trading on Upbit' });
    });
    oldS.filter(s => !curS.includes(s)).forEach(s => {
      up.recent.push({ s, t: now, k: 'del' });
      upbitAlerts.push({ key: 'del-' + s, msg: '🇰🇷 *Upbit delisting* — ' + s + '/KRW was removed from Upbit' });
    });
  }
  up.recent = up.recent.slice(-40);

  /* new official warning/caution flags — Upbit flags a coin before most dumps */
  if (umk) {
    const oldF = {};
    (prevU.markets || []).forEach(m => { oldF[m.s] = (m.w ? 'W' : '') + (m.c || []).join(','); });
    (up.markets || []).forEach(m => {
      const f = (m.w ? 'W' : '') + (m.c || []).join(',');
      if (!f || !Object.keys(oldF).length || oldF[m.s] === f) return;
      upbitAlerts.push({ key: 'flag-' + m.s + '-' + f, msg: '🇰🇷 *Upbit ' + (m.w ? 'WARNING' : 'caution') + '* — ' + m.s + ' (' + (m.c || []).join(', ').toLowerCase().replace(/_/g, ' ') + ')' });
    });
  }

  /* 3) listing announcements. Upbit's api-manager answered 403 to the plain bot UA, so this asks the way a
        Korean browser would; if it still refuses, the listing DIFF above is the real source anyway. */
  try {
    const r = await fetch('https://api-manager.upbit.com/api/v1/announcements?os=web&page=1&per_page=20&category=trade', {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Referer': 'https://upbit.com/service_center/notice',
        'Origin': 'https://upbit.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
      }
    });
    if (r.ok) {
      const j = await r.json();
      const list = (j.data && (j.data.notices || j.data.list)) || (Array.isArray(j.data) ? j.data : []) || [];
      const ns = (Array.isArray(list) ? list : []).map(n => ({ id: n.id, ti: n.title || '', t: Date.parse(n.listed_at || n.created_at || '') || 0 })).filter(n => n.ti);
      if (ns.length) up.notices = ns.slice(0, 20);
    } else console.log('upbit notices http', r.status);
  } catch (e) { console.log('upbit notices failed', e.message); }
  if (!up.notices && prevU.notices) up.notices = prevU.notices;

  /* 4) the verified identity map — the whole reason the kimchi premium can be trusted.
        Upbit ticker -> CoinGecko coin_id -> Binance ticker. Only pairs that survive that round trip are the
        SAME asset; matching on the ticker alone gives nonsense (Upbit DATA vs Binance DATA differ by 30000%).

        CoinGecko's free tier 429s after ~2 quick calls from a datacenter IP, so the walk is INCREMENTAL:
        a few pages per run, parked in data/upbit.json, resumed next run. A full rebuild lands in ~1-2h and
        then refreshes daily. Until it lands the previous map stays in force, and coins outside it show "—". */
  const CG_PER_RUN = 3, CG_GAP = 14000, U_PAGES = 10, B_PAGES = 28;
  up.map = prevU.map || {}; up.cgid = prevU.cgid || {}; up.mapT = prevU.mapT || 0;
  let wip = prevU.wip || null;
  if (!wip && (now - up.mapT > 24 * 3600000 || !Object.keys(up.map).length)) wip = { ex: 'upbit', page: 1, u: {}, b: {}, t: now };
  if (wip) {
    await nap(4000); /* let the CoinGecko mirror above clear the rate-limit window first */
    for (let done = 0; done < CG_PER_RUN && wip; done++) {
      let r = null;
      try { r = await fetch('https://api.coingecko.com/api/v3/exchanges/' + wip.ex + '/tickers?page=' + wip.page, { headers: { Accept: 'application/json' } }); }
      catch (e) { console.log('cg fetch failed', e.message); break; }
      if (r.status === 429) { console.log('cg 429 — parking the map walk until the next run'); break; }
      if (!r.ok) { console.log('cg', wip.ex, 'p' + wip.page, 'http', r.status); break; }
      const ts = ((await r.json()) || {}).tickers || [];
      ts.forEach(t => {
        if (!t.coin_id || !t.base) return;
        if (wip.ex === 'upbit') { if (t.target === 'KRW') wip.u[t.base] = t.coin_id; }
        else if (t.target === 'USDT' && !wip.b[t.coin_id]) wip.b[t.coin_id] = t.base;
      });
      const last = ts.length < 100 || wip.page >= (wip.ex === 'upbit' ? U_PAGES : B_PAGES);
      if (!last) wip.page++;
      else if (wip.ex === 'upbit') { wip.ex = 'binance'; wip.page = 1; }
      else {
        const pair = {};
        Object.entries(wip.u).forEach(([sym, cid]) => { if (wip.b[cid]) pair[sym] = wip.b[cid]; });
        if (Object.keys(pair).length >= 40) {
          up.map = pair; up.cgid = wip.u; up.mapT = now;
          console.log('upbit map REBUILT:', Object.keys(wip.u).length, 'KRW coin_ids,', Object.keys(wip.b).length, 'binance coin_ids →', Object.keys(pair).length, 'verified pairs');
        } else console.log('upbit map too small:', Object.keys(pair).length, '— keeping the previous one');
        wip = null;
      }
      if (wip && done + 1 < CG_PER_RUN) await nap(CG_GAP);
    }
  }
  if (wip) { up.wip = wip; console.log('upbit map walk:', wip.ex, 'page', wip.page, '·', Object.keys(wip.u).length, 'KRW /', Object.keys(wip.b).length, 'binance so far'); }

  if ((up.markets || []).length || Object.keys(up.map || {}).length) {
    fs.writeFileSync('data/upbit.json', JSON.stringify(up));
    console.log('upbit:', (up.markets || []).length, 'KRW markets,', (up.markets || []).filter(m => m.w || m.c).length, 'flagged,', Object.keys(up.map || {}).length, 'mapped,', (up.notices || []).length, 'notices,', up.recent.length, 'recent events');
  } else console.log('upbit: nothing to write');
} catch (e) { console.log('upbit section failed', e.message); }

// ---------------- Kalshi mirror (group /markets by event_ticker; titles from /events) ----------------
try {
  const KH = { 'Accept': 'application/json', 'User-Agent': 'cryptopulse-bot/1.0' };
  // 1) /markets → group by event_ticker (markets carry prices; sort pages by volume via API)
  const evMap = {};
  let mc = '', mp = 0;
  while (mp < 12) {
    const u = 'https://api.elections.kalshi.com/trade-api/v2/markets?status=open&limit=1000&mve_filter=exclude' + (mc ? '&cursor=' + encodeURIComponent(mc) : '');
    const r = await fetch(u, { headers: KH });
    if (!r.ok) { console.log('kalshi markets http', r.status); break; }
    const j = await r.json();
    (j.markets || []).forEach(m => {
      /* 2026-07 API change: integer-cent fields became *_dollars strings, volumes became *_fp */
      const cents = d => { const f = parseFloat(d); return isFinite(f) ? Math.round(f * 100) : null; };
      let y = m.last_price ?? cents(m.last_price_dollars);
      if (!y) { /* 0 = never traded → try the book midpoint */
        const bY = m.yes_bid ?? cents(m.yes_bid_dollars), aY = m.yes_ask ?? cents(m.yes_ask_dollars);
        if (bY && aY) y = Math.round((bY + aY) / 2);
        else y = bY || aY || null;
      }
      const et = m.event_ticker || m.ticker;
      /* sports multi-leg parlays (KXMVE…MULTIGAME…) flood the volume ranking with joined-leg junk — skip at source */
      if (/MULTIGAME|^KXMVE/i.test(et || '') || /,\s*(yes|no)\s/i.test(m.title || '')) return;
      const v = m.volume_24h ?? m.volume ?? (parseFloat(m.volume_24h_fp) || parseFloat(m.volume_fp) || 0);
      const e = evMap[et] || (evMap[et] = { m: [], vol: 0 });
      e.m.push({ tk: m.ticker, ti: m.title || m.yes_sub_title || '', y: y ?? null, v });
      e.vol += v;
    });
    mc = j.cursor; mp++;
    if (!mc || !(j.markets || []).length) break;
  }
  // 2) /events → umbrella titles by event_ticker
  const titleByEt = {};
  let cursor = '', pages = 0;
  while (pages < 20) {
    const u = 'https://api.elections.kalshi.com/trade-api/v2/events?limit=200&status=open' + (cursor ? '&cursor=' + encodeURIComponent(cursor) : '');
    const r = await fetch(u, { headers: KH });
    if (!r.ok) { console.log('kalshi events http', r.status); break; }
    const j = await r.json();
    (j.events || []).forEach(ev => { titleByEt[ev.event_ticker] = ev.title; });
    cursor = j.cursor; pages++;
    if (!cursor || !(j.events || []).length) break;
  }
  // 3) build events sorted by volume, priced
  /* parlay markets carry joined-leg 'titles' ("yes A,yes B,…") — never let those become event titles */
  const junkTitle = t => !t || t.length > 110 || /,\s*(yes|no)\s/i.test(t) || /^(yes|no)\s/i.test(t);
  const out = Object.entries(evMap).map(([et, d]) => ({
    t: titleByEt[et] || (d.m[0] && d.m[0].ti) || et,
    tk: et, s: (et || '').split('-')[0],
    m: d.m.sort((a, b) => (b.v || 0) - (a.v || 0)).slice(0, 12), vol: d.vol
  })).filter(e => !junkTitle(e.t)).sort((a, b) => b.vol - a.vol).slice(0, 1500);
  const withPrice = out.filter(e => (e.m || []).some(m => m.y != null)).length;
  const umbrella = out.filter(e => titleByEt[e.tk]).length;
  /* /events failing → zero umbrella titles → the mirror would be junk. Keep the previous good file. */
  /* /events has been flaky — accept a mirror without umbrella titles as long as the per-market
     titles are real (junk leg-joins already filtered) and a healthy share carries prices */
  if (out.length >= 30 && (umbrella > 0 || withPrice >= Math.min(50, Math.floor(out.length * 0.3)))) {
    fs.writeFileSync('data/kalshi.json', JSON.stringify({ t: now, events: out }));
    console.log('kalshi events:', out.length, 'withPrice:', withPrice, 'umbrella:', umbrella, 'eventTitles:', Object.keys(titleByEt).length);
    console.log('kalshi sample titles:', out.slice(0, 3).map(e => e.t).join(' | '));
  } else {
    console.log('kalshi mirror NOT written (events:', out.length, ', umbrella:', umbrella, ', withPrice:', withPrice, ') — keeping the previous file');
  }
} catch (e) { console.log('kalshi failed', e.message); }

// ---------------- Full-leaderboard liquidation book (feeds the DEX Liq Heatmap) ----------------
// Scans up to 2500 wallets (account >= $25k) — every position >= $10k, bucketed by liq price.
let LB = [], MIDS = {}, lbFresh = false;
try {
  // stats-data can hang for minutes — hard 90s timeout, then fall back to our own cached wallet list
  try {
    LB = (await jget('https://stats-data.hyperliquid.xyz/Mainnet/leaderboard', { signal: AbortSignal.timeout(90000) })).leaderboardRows || [];
    lbFresh = LB.length > 0;
  } catch (e) {
    console.log('leaderboard fetch failed (' + e.message + ') — using cached data/hl-wallets.json');
    try {
      LB = JSON.parse(fs.readFileSync('data/hl-wallets.json', 'utf8')).rows
        .map(r => ({ ethAddress: r[0], accountValue: String(r[1]) }));
    } catch (e2) {}
  }
  MIDS = await post('https://api.hyperliquid.xyz/info', { type: 'allMids' });
  try { // xyz builder-dex (RWA/stocks) marks
    const MX = await post('https://api.hyperliquid.xyz/info', { type: 'allMids', dex: 'xyz' });
    Object.entries(MX || {}).forEach(([k, v]) => { MIDS[k] = v; if (!k.startsWith('xyz:')) MIDS['xyz:' + k] = v; });
  } catch (e) {}
  const wallets = LB.filter(r => (parseFloat(r.accountValue) || 0) >= 25000)
    .sort((a, b) => parseFloat(b.accountValue) - parseFloat(a.accountValue)).slice(0, 2500);
  // publish the wallet list itself (top 700) — the browser falls back to it when stats-data hangs client-side
  if (lbFresh) {
    const wl = wallets.slice(0, 700).map(r => [r.ethAddress, Math.round(parseFloat(r.accountValue) || 0)]);
    fs.mkdirSync('data', { recursive: true });
    fs.writeFileSync('data/hl-wallets.json', JSON.stringify({ t: Date.now(), rows: wl }));
    console.log('hl-wallets.json:', wl.length, 'wallets');
  }
  const book = {}; // coin -> {px, step, bins:{binIdx:[sellFuelUsd, buyFuelUsd]}}
  let scanned = 0, positions = 0;
  for (let i = 0; i < wallets.length; i += 15) {
    const chunk = await Promise.allSettled(wallets.slice(i, i + 15).map((r, ci) =>
      (i + ci < 1200
        ? Promise.all([
            post('https://api.hyperliquid.xyz/info', { type: 'clearinghouseState', user: r.ethAddress }),
            post('https://api.hyperliquid.xyz/info', { type: 'clearinghouseState', user: r.ethAddress, dex: 'xyz' }).catch(() => null)
          ]).then(([s, sx]) => (sx && (sx.assetPositions || []).length
            ? { ...s, assetPositions: (s.assetPositions || []).concat(sx.assetPositions) } : s))
        : post('https://api.hyperliquid.xyz/info', { type: 'clearinghouseState', user: r.ethAddress }))));
    chunk.forEach(c => {
      if (c.status !== 'fulfilled' || !c.value) return;
      scanned++;
      (c.value.assetPositions || []).forEach(ap => {
        const p = ap.position;
        const v = Math.abs(parseFloat(p.positionValue));
        const liq = parseFloat(p.liquidationPx);
        const px = parseFloat(MIDS[p.coin]);
        if (!(v >= 10000) || !(liq > 0) || !(px > 0)) return;
        if (liq < px * 0.3 || liq > px * 3) return; // sanity band
        const co = book[p.coin] || (book[p.coin] = { px, step: px * 0.005, bins: {} });
        const b = Math.round(liq / co.step);
        const cell = co.bins[b] || (co.bins[b] = [0, 0]);
        if (parseFloat(p.szi) > 0) cell[0] += v; else cell[1] += v; // longs = sell fuel, shorts = buy fuel
        positions++;
      });
    });
    await new Promise(r => setTimeout(r, 120)); // stay friendly with HL rate limits
  }
  Object.values(book).forEach(co => {
    Object.keys(co.bins).forEach(b => { co.bins[b] = [Math.round(co.bins[b][0]), Math.round(co.bins[b][1])]; });
  });
  fs.writeFileSync('data/liq-book.json', JSON.stringify({ t: now, wallets: scanned, positions, coins: book }));
  console.log('liq-book:', scanned, 'wallets,', positions, 'positions,', Object.keys(book).length, 'coins');
} catch (e) { console.log('liq-book failed', e.message); }

// ---------------- dYdX v4: FULL on-chain book (EVERY subaccount, ~26 pages) ----------------
// equity = USDC + Σ size·oracle ; liq for position i (others at oracle):
//   p_liq = (MM_rest − equity + size·oracle) / (size − mmf·|size|)
try {
  const mk = await jget('https://indexer.dydx.trade/v4/perpetualMarkets?limit=1000');
  const byClob = {};
  Object.values(mk.markets || {}).forEach(m => {
    byClob[String(m.clobPairId)] = {
      base: (m.ticker || '').split('-')[0],
      px: parseFloat(m.oraclePrice),
      mmf: parseFloat(m.maintenanceMarginFraction),
      ar: parseInt(m.atomicResolution)
    };
  });
  const HOSTS = ['https://dydx-rest.publicnode.com', 'https://rest-dydx.ecostake.com', 'https://dydx-api.polkachu.com'];
  let host = null;
  for (const h of HOSTS) {
    try { const t0 = await jget(h + '/dydxprotocol/subaccounts/subaccount?pagination.limit=1'); if (t0 && t0.subaccount) { host = h; break; } }
    catch (e) {}
  }
  if (!host) throw new Error('no dydx LCD host reachable');
  const dbook = {}; let dPos = 0, dSubs = 0, key = '';
  for (let page = 0; page < 40; page++) {
    const u = host + '/dydxprotocol/subaccounts/subaccount?pagination.limit=1000' + (key ? '&pagination.key=' + encodeURIComponent(key) : '');
    const j2 = await jget(u);
    const subs = j2.subaccount || [];
    subs.forEach(s => {
      const perps = s.perpetual_positions || [];
      if (!perps.length) return;
      let usdc = 0;
      (s.asset_positions || []).forEach(a => { if (!a.asset_id || a.asset_id === 0 || a.asset_id === '0') usdc += parseInt(a.quantums) / 1e6; });
      const pos = perps.map(p => {
        const m = byClob[String(p.perpetual_id ?? 0)]; // BTC-USD has id 0, omitted in proto JSON
        if (!m || !(m.px > 0)) return null;
        const size = parseInt(p.quantums) * Math.pow(10, m.ar);
        if (!size) return null;
        return { m, size, notional: size * m.px };
      }).filter(Boolean);
      if (!pos.length) return;
      dSubs++;
      const equity = usdc + pos.reduce((t, q) => t + q.notional, 0);
      const mmTotal = pos.reduce((t, q) => t + q.m.mmf * Math.abs(q.notional), 0);
      pos.forEach(q => {
        const v = Math.abs(q.notional);
        if (v < 10000) return;
        const mmRest = mmTotal - q.m.mmf * v;
        const denom = q.size - q.m.mmf * Math.abs(q.size);
        if (!denom) return;
        const liq = (mmRest - equity + q.notional) / denom;
        if (!(liq > 0) || liq < q.m.px * 0.3 || liq > q.m.px * 3) return;
        const co = dbook[q.m.base] || (dbook[q.m.base] = { px: q.m.px, step: q.m.px * 0.005, bins: {} });
        const b = Math.round(liq / co.step);
        const cell = co.bins[b] || (co.bins[b] = [0, 0]);
        if (q.size > 0) cell[0] += v; else cell[1] += v;
        dPos++;
      });
    });
    key = j2.pagination && j2.pagination.next_key;
    if (!key || !subs.length) break;
    await new Promise(r2 => setTimeout(r2, 150));
  }
  Object.values(dbook).forEach(co => { Object.keys(co.bins).forEach(b => { co.bins[b] = [Math.round(co.bins[b][0]), Math.round(co.bins[b][1])]; }); });
  let lbj = { t: now };
  try { lbj = JSON.parse(fs.readFileSync('data/liq-book.json', 'utf8')); } catch (e) {}
  lbj.dydx = { t: now, subs: dSubs, positions: dPos, coins: dbook };
  fs.writeFileSync('data/liq-book.json', JSON.stringify(lbj));
  console.log('dydx book:', dSubs, 'subaccounts with positions,', dPos, 'positions >= $10k,', Object.keys(dbook).length, 'coins, host:', host);
} catch (e) { console.log('dydx book failed', e.message); }

// ---------------- Jupiter Perps (Solana): full position book via getProgramAccounts ----------------
// Needs the SOLANA_RPC secret (free Helius/other RPC URL that allows getProgramAccounts). Skips when absent.
const SOLANA_RPC = process.env.SOLANA_RPC;
if (SOLANA_RPC) {
  try {
    const CUST = { // Jupiter custody accounts (hex of the 32-byte pubkeys)
      '67595dd846c007f26896f2aed31ba7b55fd12ccc158e0b007a9d8fe846b69fe9': 'SOL',
      '8baa4a4864226cc022484dc8281e1a168f5cf4e8053f1ae5066d916a88b9df9f': 'ETH',
      '414d81486af13e6eec9e2d5bcf459132e3a4664709b66d38d064779124c6ce3e': 'BTC'
    };
    const res = await post(SOLANA_RPC, { jsonrpc: '2.0', id: 1, method: 'getProgramAccounts',
      params: ['PERPHjGBqRHArX4DySjwM6UJHiR3sWAatqfdBS2qQJu',
        { encoding: 'base64', filters: [{ memcmp: { offset: 0, bytes: 'VZMoMoKgZQb' } }] }] });
    if (res.error) throw new Error(JSON.stringify(res.error).slice(0, 120));
    const accs = res.result || [];
    const jbook = {}; let jPos = 0;
    const u64 = (b, o) => Number(b.readBigUInt64LE(o));
    accs.forEach(a => {
      const b = Buffer.from(a.account.data[0], 'base64');
      if (b.length < 210) return;
      const base = CUST[b.subarray(72, 104).toString('hex')];
      if (!base) return;
      const side = b[152];                 // 1 = long, 2 = short
      const entry = u64(b, 153) / 1e6;
      const sizeUsd = u64(b, 161) / 1e6;
      const collUsd = u64(b, 169) / 1e6;
      if (!(sizeUsd >= 10000) || !(entry > 0) || (side !== 1 && side !== 2)) return;
      const px = parseFloat(MIDS[base]) || entry; // live ref from HL mids
      /* Jupiter liq (official formula, approx — excludes accrued borrow fees):
         maxLoss = size*(1/maxLev + closeFeeBps); diff = |maxLoss − collateral|·entry/size */
      const maxLoss = sizeUsd * (0.002 + 0.0006);
      const diff = Math.abs(maxLoss - collUsd) * entry / sizeUsd;
      let liq;
      if (side === 1) liq = maxLoss > collUsd ? entry + diff : entry - diff;
      else liq = maxLoss > collUsd ? entry - diff : entry + diff;
      if (!(liq > 0) || liq < px * 0.3 || liq > px * 3) return;
      const co = jbook[base] || (jbook[base] = { px, step: px * 0.005, bins: {} });
      const bIx = Math.round(liq / co.step);
      const cell = co.bins[bIx] || (co.bins[bIx] = [0, 0]);
      if (side === 1) cell[0] += sizeUsd; else cell[1] += sizeUsd;
      jPos++;
    });
    Object.values(jbook).forEach(co => { Object.keys(co.bins).forEach(b2 => { co.bins[b2] = [Math.round(co.bins[b2][0]), Math.round(co.bins[b2][1])]; }); });
    let lbj2 = { t: now };
    try { lbj2 = JSON.parse(fs.readFileSync('data/liq-book.json', 'utf8')); } catch (e) {}
    lbj2.jup = { t: now, accounts: accs.length, positions: jPos, coins: jbook };
    fs.writeFileSync('data/liq-book.json', JSON.stringify(lbj2));
    console.log('jupiter book:', accs.length, 'position accounts,', jPos, 'open positions >= $10k,', Object.keys(jbook).length, 'coins');
  } catch (e) { console.log('jupiter book failed', e.message); }
} else console.log('jupiter book skipped (no SOLANA_RPC secret yet)');

// ---------------- Lighter book: moved to its own dedicated workflow (lighter-collector.yml) ----------------

// ---------------- GMX v2: complete open-position book via GMX's own public subsquid indexer ----------------
// No key needed. Liq price approximated from leverage (maintenance ~1%) — conservative, tooltip explains.
try {
  const GEP = 'https://gmx.squids.live/gmx-synthetics-arbitrum:prod/api/graphql';
  const gq = async (query) => {
    const r = await fetch(GEP, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) });
    return r.json();
  };
  const minfo = await jget('https://arbitrum-api.gmxinfra.io/markets/info');
  const mkMap = {};
  (minfo.markets || []).forEach(m => {
    let base = (m.name || '').split('/')[0].trim(); // "ETH/USD [ETH-USDC]" -> ETH
    if (base === 'WBTC' || base === 'BTC.b') base = 'BTC';
    if (base.startsWith('1000')) base = 'k' + base.slice(4);
    if (m.marketToken && base) mkMap[m.marketToken.toLowerCase()] = base;
  });
  const gbook = {}; let gPos = 0, gFetched = 0, offset = 0;
  for (let page = 0; page < 8; page++) {
    const j = await gq('{ positions(limit: 1000, offset: ' + offset + ', orderBy: sizeInUsd_DESC, ' +
      'where: {isSnapshot_eq: false, sizeInUsd_gt: "10000000000000000000000000000000000"}) ' +
      '{ market isLong sizeInUsd entryPrice leverage } }');
    const ps = (j.data && j.data.positions) || [];
    gFetched += ps.length;
    ps.forEach(p => {
      const base = mkMap[(p.market || '').toLowerCase()]; if (!base) return;
      const sz = parseFloat(p.sizeInUsd) / 1e30;
      const lev = parseFloat(p.leverage) / 1e4;
      if (!(sz >= 10000) || !(lev > 0)) return;
      const px = parseFloat(MIDS[base]) || 0; if (!(px > 0)) return;
      /* entryPrice precision is 1e30/10^indexDecimals (varies per token) — normalize by live-price
         magnitude. Window must be NARROWER than one decade (×3.162 = √10) or the shift lands a
         factor of 10 off (v68 bug: ×50 window rejected almost every position). */
      let entry = parseFloat(p.entryPrice); if (!(entry > 0)) return;
      while (entry > px * 3.163) entry /= 10;
      while (entry < px / 3.163) entry *= 10;
      /* liq ≈ price move that eats collateral down to ~1% maintenance: adverse = 1/lev − 0.01;
         ≥100x positions liquidate essentially at entry — floor keeps them mapped */
      const adverse = Math.max(1 / lev - 0.01, 0.001);
      const liq = p.isLong ? entry * (1 - adverse) : entry * (1 + adverse);
      if (!(liq > 0) || liq < px * 0.3 || liq > px * 3) return;
      const co = gbook[base] || (gbook[base] = { px, step: px * 0.005, bins: {} });
      const b = Math.round(liq / co.step);
      const cell = co.bins[b] || (co.bins[b] = [0, 0]);
      if (p.isLong) cell[0] += sz; else cell[1] += sz; /* longs -> sell fuel, shorts -> buy fuel */
      gPos++;
    });
    if (ps.length < 1000) break;
    offset += 1000;
    await new Promise(r2 => setTimeout(r2, 300));
  }
  Object.values(gbook).forEach(co => { Object.keys(co.bins).forEach(b2 => { co.bins[b2] = [Math.round(co.bins[b2][0]), Math.round(co.bins[b2][1])]; }); });
  let lbj4 = { t: now };
  try { lbj4 = JSON.parse(fs.readFileSync('data/liq-book.json', 'utf8')); } catch (e) {}
  lbj4.gmx = { t: now, scanned: gFetched, positions: gPos, coins: gbook };
  fs.writeFileSync('data/liq-book.json', JSON.stringify(lbj4));
  console.log('gmx book:', gFetched, 'open positions fetched,', gPos, 'mapped >= $10k,', Object.keys(gbook).length, 'coins');
} catch (e) { console.log('gmx book failed', e.message); }

// ---------------- Coinalyze totals: kicked off earlier (concurrent) — wait for it to finish here ----------------
if (czPromise) await czPromise; else console.log('coinalyze skipped (no COINALYZE_KEY secret yet)');

// ================= TELEGRAM ALERTS =================
const TG_TOKEN = process.env.TELEGRAM_TOKEN, TG_CHAT = process.env.TELEGRAM_CHAT;
const tgOn = !!(TG_TOKEN && TG_CHAT);
async function tg(text) {
  if (!tgOn) return;
  try {
    await fetch('https://api.telegram.org/bot' + TG_TOKEN + '/sendMessage', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT, text, parse_mode: 'Markdown', disable_web_page_preview: true })
    });
  } catch (e) { console.log('tg send failed', e.message); }
}
// state: which alerts we've already sent (dedup). First-ever run seeds silently.
let st = { whale: [], sec: [], liq: [] }, firstRun = false;
try { st = JSON.parse(fs.readFileSync('data/alert-state.json', 'utf8')); }
catch (e) { firstRun = true; }
const seen = { whale: new Set(st.whale || []), sec: new Set(st.sec || []), liq: new Set(st.liq || []), upbit: new Set(st.upbit || []) };
const queue = [];
function consider(kind, key, msg) {
  if (seen[kind].has(key)) return;
  seen[kind].add(key);
  if (!firstRun) queue.push(msg); // seed silently on first run
}

// --- Upbit: listings, delistings and new official caution flags (collected above) ---
upbitAlerts.forEach(a => consider('upbit', a.key, a.msg));

// --- Whale liquidation risk: >= $25M within 10% of liquidation on Hyperliquid ---
try {
  const lb = LB.length ? LB : ((await jget('https://stats-data.hyperliquid.xyz/Mainnet/leaderboard', { signal: AbortSignal.timeout(90000) })).leaderboardRows || []);
  const mids = Object.keys(MIDS).length ? MIDS : await post('https://api.hyperliquid.xyz/info', { type: 'allMids' });
  const top60 = lb.map(r => r).sort((a, b) => parseFloat(b.accountValue) - parseFloat(a.accountValue)).slice(0, 60);
  for (let i = 0; i < top60.length; i += 12) {
    const chunk = await Promise.allSettled(top60.slice(i, i + 12).map(r =>
      Promise.all([
        post('https://api.hyperliquid.xyz/info', { type: 'clearinghouseState', user: r.ethAddress }),
        post('https://api.hyperliquid.xyz/info', { type: 'clearinghouseState', user: r.ethAddress, dex: 'xyz' }).catch(() => null)
      ]).then(([s, sx]) => ({ addr: r.ethAddress, s: (sx && (sx.assetPositions || []).length
        ? { ...s, assetPositions: (s.assetPositions || []).concat(sx.assetPositions) } : s) }))
    ));
    chunk.forEach(c => {
      if (c.status !== 'fulfilled') return;
      (c.value.s.assetPositions || []).forEach(ap => {
        const p = ap.position;
        const v = Math.abs(parseFloat(p.positionValue));
        const liq = parseFloat(p.liquidationPx), mark = parseFloat(mids[p.coin]);
        if (v < 25e6 || !liq || !mark) return;
        const szi = parseFloat(p.szi);
        let dist = null;
        if (szi > 0 && liq < mark) dist = (mark - liq) / mark * 100;
        if (szi < 0 && liq > mark) dist = (liq - mark) / mark * 100;
        if (dist == null || dist > 10) return;
        const key = c.value.addr + ':' + p.coin;
        consider('whale', key, '🐋 *Whale liquidation risk*\n' + fmtBig(v) + ' ' + (szi > 0 ? 'LONG' : 'SHORT') + ' ' + p.coin +
          '\nliq @ ' + fmtPx(liq) + ' · ' + dist.toFixed(1) + '% away\n`' + c.value.addr + '`');
      });
    });
  }
} catch (e) { console.log('whale alert failed', e.message); }

// --- SEC: new material filings for tracked companies ---
const SEC_CIKS = [
  ['0001679788','Coinbase'],['0001050446','Strategy'],['0001507605','MARA Holdings'],
  ['0001167419','Riot Platforms'],['0001720424','HIVE Digital'],['0001512673','Block'],
  ['0001783879','Robinhood'],['0001318605','Tesla'],['0001980994','iShares Bitcoin Trust'],
  ['0001876042','Circle'],['0001859392','Galaxy Digital']
];
const MATERIAL = /^(8-K|10-Q|10-K|S-1|424B|6-K|20-F|SC 13D|13D)/i;
try {
  for (const [cik, short] of SEC_CIKS) {
    let j;
    try { j = await jget('https://data.sec.gov/submissions/CIK' + cik + '.json', { headers: { 'User-Agent': 'cryptopulse-bot bullot@example.com' } }); }
    catch (e) { continue; }
    const r = j.filings && j.filings.recent; if (!r || !r.form) continue;
    for (let i = 0; i < Math.min(r.form.length, 6); i++) {
      if (!MATERIAL.test(r.form[i])) continue;
      const acc = r.accessionNumber[i];
      consider('sec', acc, '📄 *New SEC filing*\n' + short + ' — ' + r.form[i] +
        '\n' + (r.primaryDocDescription && r.primaryDocDescription[i] || 'filing') + ' · ' + r.filingDate[i]);
    }
  }
} catch (e) { console.log('sec alert failed', e.message); }

// --- Liquidation risk: Morpho positions >= $10M within ~8% of liquidation ---
try {
  const q = { query: '{ marketPositions(first:200, orderBy: HealthFactor, orderDirection: Asc, where:{healthFactor_lte:1.08, healthFactor_gte:1.0}) { items { healthFactor state{ collateralUsd } user{ address } market{ collateralAsset{ symbol } loanAsset{ symbol } morphoBlue{ chain{ network } } } } } }' };
  const j = await post('https://blue-api.morpho.org/graphql', q);
  const items = ((j.data && j.data.marketPositions.items) || []).filter(i => i.state && i.state.collateralUsd >= 10e6 && i.healthFactor >= 1);
  items.forEach(i => {
    const dist = (1 - 1 / i.healthFactor) * 100;
    const sym = i.market.collateralAsset.symbol, loan = i.market.loanAsset.symbol;
    const chain = i.market.morphoBlue.chain.network;
    const key = i.user.address + ':' + sym + '/' + loan;
    consider('liq', key, '💥 *Liquidation risk*\n' + fmtBig(i.state.collateralUsd) + ' ' + sym + '/' + loan + ' on ' + chain +
      '\nHF ' + i.healthFactor.toFixed(3) + ' · ' + dist.toFixed(1) + '% from liquidation');
  });
} catch (e) { console.log('liq alert failed', e.message); }

// --- Cascade Radar: hourly component history (W included!) + 24/7 alerts, same score as the dashboard ---
try {
  const rdFund = {};
  (meta.universe || []).forEach((u, i) => { const c = ctxs[i]; if (c && !u.isDelisted) rdFund[u.name] = parseFloat(c.funding) || 0; });
  let lbR = {}; try { lbR = JSON.parse(fs.readFileSync('data/liq-book.json', 'utf8')); } catch (e) {}
  let lgR = null; try { lgR = (JSON.parse(fs.readFileSync('data/liq-book-lighter.json', 'utf8')) || {}).lighter; } catch (e) {}
  let ltR = {}; try { ltR = JSON.parse(fs.readFileSync('data/liq-totals.json', 'utf8')); } catch (e) {}
  const booksR = [lbR.coins, lbR.dydx && lbR.dydx.coins, lbR.jup && lbR.jup.coins, lgR && lgR.coins, lbR.gmx && lbR.gmx.coins];
  const nowSR = now / 1000;
  const velR = {};
  Object.entries(ltR.coinsMin || {}).forEach(([c2, buckets]) => {
    let L = 0, S = 0;
    Object.entries(buckets).forEach(([ts, v]) => { if (+ts >= nowSR - 900) { L += v[0] || 0; S += v[1] || 0; } });
    if (L || S) velR[c2] = { L, S };
  });
  const tgtR = now - 86400000;
  let refR = null;
  hist.samples.forEach(s2 => { if (!refR || Math.abs(s2.t - tgtR) < Math.abs(refR.t - tgtR)) refR = s2; });
  const oiRefR = (refR && Math.abs(refR.t - tgtR) < 3 * 3600000) ? (refR.coins || {}) : {};
  const rowsR = [];
  Object.entries(coins).forEach(([coin, oiUsd]) => {
    if (oiUsd < 5e6) return;
    const px = parseFloat(MIDS[coin]) || 0;
    if (!(px > 0)) return;
    let below = 0, above = 0, big = 0, bigPct = null;
    booksR.forEach(bs => {
      const b = bs && bs[coin];
      if (!b || !b.bins || !b.step) return;
      Object.entries(b.bins).forEach(([idx, v]) => {
        const rel = ((+idx) * b.step - px) / px;
        if (rel <= -0.0005 && rel >= -0.05) { below += v[0] || 0; if ((v[0] || 0) > big) { big = v[0]; bigPct = rel * 100; } }
        else if (rel >= 0.0005 && rel <= 0.05) { above += v[1] || 0; if ((v[1] || 0) > big) { big = v[1]; bigPct = rel * 100; } }
      });
    });
    const v = velR[coin] || velR[coin.replace(/^k/, '')] || { L: 0, S: 0 };
    const f = rdFund[coin] || 0;
    const W = Math.min(40, 40 * Math.max(below, above) / (oiUsd * 0.08));
    const F = Math.min(20, 20 * Math.abs(f) / 0.0001);
    const mktOi = oiUsd + (bb[coin] || 0) + (ok[coin] || 0); /* market-wide liqs need a market-wide OI denominator */
    const V = Math.min(25, 25 * (v.L + v.S) / Math.max(mktOi * 0.001, 1000000));
    let M = 0, dOi = 0;
    if (oiRefR[coin] > 0) { dOi = (oiUsd - oiRefR[coin]) / oiRefR[coin] * 100; M = Math.min(15, Math.abs(dOi) * 1.5); }
    const down = (below + v.L * 30 + (f > 0.00002 ? oiUsd * 0.02 : 0)) >= (above + v.S * 30 + (f < -0.00002 ? oiUsd * 0.02 : 0));
    rowsR.push({ coin, score: Math.round(W + F + V + M), w: Math.round(W), f: Math.round(F), vv: Math.round(V), m: Math.round(M), down,
      wall: Math.round(Math.max(below, above)), big: Math.round(big), bigPct, liq15: Math.round(v.L + v.S), fund: f, dOi });
  });
  rowsR.sort((a, b) => b.score - a.score);
  /* hourly snapshots, 60 days — the dataset the next backtest needs (finally with W) */
  let rh = { samples: [] };
  try { rh = JSON.parse(fs.readFileSync('data/radar-history.json', 'utf8')); } catch (e) {}
  const lastT = rh.samples.length ? rh.samples[rh.samples.length - 1].t : 0;
  if (now - lastT >= 55 * 60 * 1000) {
    const snap = { t: now, coins: {} };
    rowsR.forEach(r => { snap.coins[r.coin] = [r.score, r.w, r.f, r.vv, r.m, r.down ? 1 : 0]; });
    rh.samples.push(snap);
    rh.samples = rh.samples.filter(s2 => s2.t > now - 60 * 86400000);
    fs.writeFileSync('data/radar-history.json', JSON.stringify(rh));
  }
  /* 24/7 Telegram: lvl2 >=61, lvl3 >=75 OR V>=15 (cascade confirmed). Re-alert only on escalation or after 6h. */
  const rdSt = st.radar || {};
  const rdNew = {};
  rowsR.forEach(r => {
    const burst = r.vv >= 15; /* heavy forced flow right now — warns, never cries cascade */
    const lvl = r.score >= 75 ? 3 : (r.score >= 61 || burst) ? 2 : 0;
    if (lvl < 2) return;
    const prev = rdSt[r.coin] || { lvl: 0, t: 0 };
    const fire = lvl > prev.lvl || now - prev.t > 6 * 3600000;
    rdNew[r.coin] = { lvl, t: fire ? now : prev.t };
    if (fire && !firstRun) {
      const head = lvl >= 3 ? '\ud83d\udea8 *' + (r.down ? 'SHORT' : 'LONG') + ' CASCADE \u2014 ' + r.coin + ' ' + r.score + '/100*'
        : (burst && r.score < 61 ? '\u26a1 *LIQ BURST \u2014 ' + r.coin + ' ' + r.score + '/100*' : '\u26a0\ufe0f *Cascade Radar \u2014 ' + r.coin + ' ' + r.score + '/100*');
      queue.push(head + ' ' + (r.down ? '\ud83d\udd3b SHORT' : '\ud83d\udd3a LONG') +
        '\n' + fmtBig(r.wall) + ' in liq walls \u00b15%' + (r.bigPct != null ? ' (biggest ' + fmtBig(r.big) + ' at ' + r.bigPct.toFixed(1) + '%)' : '') +
        '\nliqs 15m ' + fmtBig(r.liq15) + ' \u00b7 funding ' + (r.fund * 100).toFixed(4) + '%/h \u00b7 OI 24h ' + (r.dOi > 0 ? '+' : '') + r.dOi.toFixed(1) + '%' +
        '\nW' + r.w + ' F' + r.f + ' V' + r.vv + ' OI' + r.m);
    }
  });
  st.radar = rdNew;
  console.log('radar:', rowsR.length, 'coins scored, top:', rowsR.slice(0, 3).map(r => r.coin + ' ' + r.score).join(', '));
} catch (e) { console.log('radar section failed', e.message); }

// persist a rolling 48h log of every alert fired — the site's Alert Center reads this,
// so alerts keep counting even with the user's PC off
try {
  let alog = [];
  try { alog = JSON.parse(fs.readFileSync('data/alert-log.json', 'utf8')).entries || []; } catch (e) {}
  const kindOf = m => /🇰🇷/.test(m) ? 'upbit' : (/🐋|whale|liquidation risk/i.test(m) ? 'whale' : 'radar');
  queue.forEach(m => alog.push({ t: Date.now(), k: kindOf(m), x: m.replace(/<[^>]+>/g, '') }));
  alog = alog.filter(e => e.t > Date.now() - 48 * 3600_000).slice(-400);
  fs.writeFileSync('data/alert-log.json', JSON.stringify({ t: Date.now(), entries: alog }));
} catch (e) { console.log('alert-log write failed', e.message); }
// send queued alerts (cap to avoid floods), save state
for (const msg of queue.slice(0, 12)) { await tg(msg); await new Promise(r => setTimeout(r, 400)); }
if (queue.length > 12) await tg('… and ' + (queue.length - 12) + ' more alerts this cycle.');
fs.writeFileSync('data/alert-state.json', JSON.stringify({
  whale: [...seen.whale].slice(-600), sec: [...seen.sec].slice(-400), liq: [...seen.liq].slice(-600),
  upbit: [...seen.upbit].slice(-300),
  radar: st.radar || {}
}));
console.log('alerts:', tgOn ? (firstRun ? 'seeded silently (first run)' : 'sent ' + Math.min(queue.length, 12)) : 'Telegram not configured (no secrets)');
