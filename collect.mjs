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
  const j = await jget('https://api.bybit.com/v5/market/tickers?category=linear');
  (j.result && j.result.list || []).forEach(t => {
    if (!t.symbol || !t.symbol.endsWith('USDT')) return;
    let b = t.symbol.slice(0, -4);
    if (b.startsWith('1000')) b = 'k' + b.slice(4);
    const v = parseFloat(t.openInterestValue);
    if (v > 0) bb[b] = (bb[b] || 0) + Math.round(v);
  });
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

// ---------------- Kalshi mirror (group /markets by event_ticker; titles from /events) ----------------
try {
  const KH = { 'Accept': 'application/json', 'User-Agent': 'cryptopulse-bot/1.0' };
  // 1) /markets → group by event_ticker (markets carry prices; sort pages by volume via API)
  const evMap = {};
  let mc = '', mp = 0;
  while (mp < 12) {
    const u = 'https://api.elections.kalshi.com/trade-api/v2/markets?status=open&limit=1000' + (mc ? '&cursor=' + encodeURIComponent(mc) : '');
    const r = await fetch(u, { headers: KH });
    if (!r.ok) { console.log('kalshi markets http', r.status); break; }
    const j = await r.json();
    if (mp === 0) { try { fs.writeFileSync('data/_kdebug.json', JSON.stringify({sample: (j.markets||[]).slice(0,3), keys: (j.markets||[])[0] ? Object.keys(j.markets[0]) : []})); } catch(e){} }
    (j.markets || []).forEach(m => {
      let y = m.last_price;
      if (y == null) {
        if (m.yes_bid != null && m.yes_ask != null) y = Math.round((m.yes_bid + m.yes_ask) / 2);
        else y = m.yes_bid ?? m.yes_ask ?? null;
      }
      const et = m.event_ticker || m.ticker;
      const v = m.volume_24h ?? m.volume ?? 0;
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
  while (pages < 8) {
    const u = 'https://api.elections.kalshi.com/trade-api/v2/events?limit=200&status=open' + (cursor ? '&cursor=' + encodeURIComponent(cursor) : '');
    const r = await fetch(u, { headers: KH });
    if (!r.ok) break;
    const j = await r.json();
    (j.events || []).forEach(ev => { titleByEt[ev.event_ticker] = ev.title; });
    cursor = j.cursor; pages++;
    if (!cursor || !(j.events || []).length) break;
  }
  // 3) build events sorted by volume, priced
  const out = Object.entries(evMap).map(([et, d]) => ({
    t: titleByEt[et] || (d.m[0] && d.m[0].ti) || et,
    tk: et, s: (et || '').split('-')[0],
    m: d.m.sort((a, b) => (b.v || 0) - (a.v || 0)).slice(0, 12), vol: d.vol
  })).sort((a, b) => b.vol - a.vol).slice(0, 1500);
  const withPrice = out.filter(e => (e.m || []).some(m => m.y != null)).length;
  if (out.length) { fs.writeFileSync('data/kalshi.json', JSON.stringify({ t: now, events: out })); console.log('kalshi events:', out.length, 'withPrice:', withPrice, 'eventTitles:', Object.keys(titleByEt).length); }
} catch (e) { console.log('kalshi failed', e.message); }

// ---------------- Full-leaderboard liquidation book (feeds the DEX Liq Heatmap) ----------------
// Scans up to 2500 wallets (account >= $25k) — every position >= $10k, bucketed by liq price.
let LB = [], MIDS = {};
try {
  LB = (await jget('https://stats-data.hyperliquid.xyz/Mainnet/leaderboard')).leaderboardRows || [];
  MIDS = await post('https://api.hyperliquid.xyz/info', { type: 'allMids' });
  const wallets = LB.filter(r => (parseFloat(r.accountValue) || 0) >= 25000)
    .sort((a, b) => parseFloat(b.accountValue) - parseFloat(a.accountValue)).slice(0, 2500);
  const book = {}; // coin -> {px, step, bins:{binIdx:[sellFuelUsd, buyFuelUsd]}}
  let scanned = 0, positions = 0;
  for (let i = 0; i < wallets.length; i += 15) {
    const chunk = await Promise.allSettled(wallets.slice(i, i + 15).map(r =>
      post('https://api.hyperliquid.xyz/info', { type: 'clearinghouseState', user: r.ethAddress })));
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

// ---------------- Lighter: position book via trade-tape account discovery ----------------
// No bulk positions endpoint (735k accounts), but trades expose account ids and each
// account payload includes exchange-computed liquidation_price. Coverage builds over runs.
try {
  const LG = 'https://mainnet.zklighter.elliot.ai/api/v1';
  // Lighter rate-limits hard (~100-req token bucket, slow refill for datacenter IPs).
  // Strategy: paced single requests + 429 backoff + hard 5-min time budget, and a
  // cumulative per-account position cache so the book keeps building across runs.
  const lgEnd = Date.now() + 3.5 * 60_000; /* tighter budget — the cron now runs every 10 min */
  let lg429 = 0, lgDelay = 200; /* adaptive pacing: speed up while clean, back off on 429 */
  const lgGet = async (path) => {
    for (let att = 0; att < 4; att++) {
      if (Date.now() > lgEnd) throw new Error('lg-budget');
      const r = await fetch(LG + path);
      if (r.status === 429) { lg429++; lgDelay = Math.min(1200, Math.round(lgDelay * 1.8)); await new Promise(r2 => setTimeout(r2, 4000)); continue; }
      if (!r.ok) throw new Error('http ' + r.status);
      lgDelay = Math.max(150, lgDelay - 8);
      return r.json();
    }
    throw new Error('lg-429');
  };
  let prevB = {};
  try { prevB = JSON.parse(fs.readFileSync('data/liq-book.json', 'utf8')); } catch (e) {}
  const prevL = prevB.lighter || {};
  const posCache = prevL.pos || {};              // acctId -> [[symbol, liq, valueUsd, entry], ...]
  const tsCache = prevL.pts || {};               // acctId -> last successful scan ts (holders only)
  const empList = prevL.emp || [];               // recently scanned, no big positions (skip re-scan)
  const queue = prevL.queue || [];               // discovered but not yet scanned
  const holders = Object.keys(posCache).map(Number);
  const known = new Set([...holders, ...queue, ...empList]);
  // --- tape discovery (paced; market order rotates so all markets get covered over runs) ---
  const fresh = [];
  try {
    const ob = await lgGet('/orderBooks');
    const markets = (ob.order_books || []).filter(m => m.market_type === 'perp' && m.status === 'active');
    const rot = markets.length ? new Date(now).getUTCMinutes() % markets.length : 0;
    const mkts = markets.slice(rot).concat(markets.slice(0, rot));
    for (const m of mkts) {
      if (Date.now() > lgEnd - 150_000) break; // reserve >=2.5 min for account scans
      try {
        const tr = await lgGet('/recentTrades?market_id=' + m.market_id + '&limit=100');
        (tr.trades || []).forEach(t => {
          for (const a of [t.ask_account_id, t.bid_account_id])
            if (a != null && !known.has(a)) { known.add(a); fresh.push(a); }
        });
      } catch (e) { if (e.message === 'lg-budget') break; }
      await new Promise(r2 => setTimeout(r2, lgDelay));
    }
  } catch (e) {}
  // --- account scans: stale holders first (refresh), then backlog queue, then fresh tape ids ---
  const staleHolders = holders.filter(a => (tsCache[a] || 0) < Date.now() - 30 * 60_000);
  const order = [...new Set([...staleHolders, ...queue, ...fresh])];
  let lScanned = 0; const unscanned = []; const newEmpty = [];
  for (const a of order) {
    if (Date.now() > lgEnd) { unscanned.push(a); continue; }
    let j = null;
    try { j = await lgGet('/account?by=index&value=' + a); }
    catch (e) { unscanned.push(a); continue; }
    lScanned++;
    const acc = (j.accounts || [])[0];
    const rows = [];
    if (acc) (acc.positions || []).forEach(p => {
      const v = Math.abs(parseFloat(p.position_value));
      const liq = parseFloat(p.liquidation_price);
      if (v >= 10000 && liq > 0) rows.push([p.symbol, +liq, Math.round(v), +parseFloat(p.avg_entry_price) || 0]);
    });
    if (rows.length) { posCache[a] = rows; tsCache[a] = Date.now(); }
    else { delete posCache[a]; delete tsCache[a]; newEmpty.push(a); }
    await new Promise(r2 => setTimeout(r2, lgDelay));
  }
  // --- prune holders not refreshable for >24h, then rebuild book from the FULL cache ---
  Object.keys(posCache).forEach(a => { if ((tsCache[a] || 0) < Date.now() - 24 * 3600_000) { delete posCache[a]; delete tsCache[a]; } });
  const norm = s => (s || '').startsWith('1000') ? 'k' + s.slice(4) : s; // 1000PEPE -> kPEPE (HL naming)
  const lbook = {}; let lPos = 0;
  Object.values(posCache).forEach(rows => rows.forEach(([sym, liq, v, entry]) => {
    const base = norm(sym);
    const px = parseFloat(MIDS[base]) || entry || 0;
    if (!(px > 0) || !(liq > 0) || liq < px * 0.3 || liq > px * 3) return;
    const co = lbook[base] || (lbook[base] = { px, step: px * 0.005, bins: {} });
    const b = Math.round(liq / co.step);
    const cell = co.bins[b] || (co.bins[b] = [0, 0]);
    /* side inferred from geometry (robust to sign conventions): liq below px = long = sell fuel */
    if (liq < px) cell[0] += v; else cell[1] += v;
    lPos++;
  }));
  Object.values(lbook).forEach(co => { Object.keys(co.bins).forEach(b2 => { co.bins[b2] = [Math.round(co.bins[b2][0]), Math.round(co.bins[b2][1])]; }); });
  let lbj3 = { t: now };
  try { lbj3 = JSON.parse(fs.readFileSync('data/liq-book.json', 'utf8')); } catch (e) {}
  lbj3.lighter = { t: now, scanned: lScanned, positions: lPos, coins: lbook,
    holders: Object.keys(posCache).length,
    pos: posCache, pts: tsCache,
    emp: [...empList, ...newEmpty].slice(-4000),
    queue: unscanned.slice(0, 6000) };
  fs.writeFileSync('data/liq-book.json', JSON.stringify(lbj3));
  console.log('lighter book:', known.size, 'accounts known,', lScanned, 'scanned this run,',
    Object.keys(posCache).length, 'holders cached,', lPos, 'positions >= $10k,',
    Object.keys(lbook).length, 'coins,', lg429, 'rate-limit hits,', unscanned.length, 'queued');
} catch (e) { console.log('lighter book failed', e.message); }

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
      /* entryPrice precision is 1e30/10^indexDecimals (varies per token) — normalize by live-price magnitude */
      let entry = parseFloat(p.entryPrice); if (!(entry > 0)) return;
      while (entry > px * 50) entry /= 10;
      while (entry < px / 50) entry *= 10;
      /* liq ≈ price move that eats collateral down to ~1% maintenance: adverse = 1/lev − 0.01 */
      const adverse = 1 / lev - 0.01;
      if (!(adverse > 0)) return;
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
const seen = { whale: new Set(st.whale || []), sec: new Set(st.sec || []), liq: new Set(st.liq || []) };
const queue = [];
function consider(kind, key, msg) {
  if (seen[kind].has(key)) return;
  seen[kind].add(key);
  if (!firstRun) queue.push(msg); // seed silently on first run
}

// --- Whale liquidation risk: >= $25M within 10% of liquidation on Hyperliquid ---
try {
  const lb = LB.length ? LB : ((await jget('https://stats-data.hyperliquid.xyz/Mainnet/leaderboard')).leaderboardRows || []);
  const mids = Object.keys(MIDS).length ? MIDS : await post('https://api.hyperliquid.xyz/info', { type: 'allMids' });
  const top60 = lb.map(r => r).sort((a, b) => parseFloat(b.accountValue) - parseFloat(a.accountValue)).slice(0, 60);
  for (let i = 0; i < top60.length; i += 12) {
    const chunk = await Promise.allSettled(top60.slice(i, i + 12).map(r =>
      post('https://api.hyperliquid.xyz/info', { type: 'clearinghouseState', user: r.ethAddress }).then(s => ({ addr: r.ethAddress, s }))
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

// send queued alerts (cap to avoid floods), save state
for (const msg of queue.slice(0, 12)) { await tg(msg); await new Promise(r => setTimeout(r, 400)); }
if (queue.length > 12) await tg('… and ' + (queue.length - 12) + ' more alerts this cycle.');
fs.writeFileSync('data/alert-state.json', JSON.stringify({
  whale: [...seen.whale].slice(-600), sec: [...seen.sec].slice(-400), liq: [...seen.liq].slice(-600)
}));
console.log('alerts:', tgOn ? (firstRun ? 'seeded silently (first run)' : 'sent ' + Math.min(queue.length, 12)) : 'Telegram not configured (no secrets)');
