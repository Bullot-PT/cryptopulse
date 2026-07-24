// Dedicated Lighter position-book scanner — its own workflow (own runner IP each run, own
// rate-limit bucket) on the minutes BETWEEN the main collector's runs. Writes data/liq-book-lighter.json.
// REGRA DO PROJETO: mais informacao, sempre atualizada — o book da Lighter deve crescer continuamente.
import fs from 'fs';
const now = Date.now();
let MIDS = {};
try {
  const r = await fetch('https://api.hyperliquid.xyz/info', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'allMids' }) });
  MIDS = await r.json();
} catch (e) { console.log('mids failed', e.message); }
try {
const LG = 'https://mainnet.zklighter.elliot.ai/api/v1';
    const lgEnd = Date.now() + 8 * 60_000; /* dedicated job — the whole run is ours */
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
    let prevL = {};
    try { prevL = (JSON.parse(fs.readFileSync('data/liq-book-lighter.json', 'utf8')) || {}).lighter || {}; } catch (e) {}
    if (!prevL.pos) { /* first run: migrate the cumulative caches from the old location */
      try { prevL = (JSON.parse(fs.readFileSync('data/liq-book.json', 'utf8')) || {}).lighter || {}; } catch (e) {}
    }
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
        if (Date.now() > lgEnd - 330_000) break; // reserve >=5.5 min for account scans
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
    console.log('lighter book:', known.size, 'accounts known,', lScanned, 'scanned this run,',
      Object.keys(posCache).length, 'holders cached,', lPos, 'positions >= $10k,',
      Object.keys(lbook).length, 'coins,', lg429, 'rate-limit hits,', unscanned.length, 'queued');
    fs.mkdirSync('data', { recursive: true });
    fs.writeFileSync('data/liq-book-lighter.json', JSON.stringify({ t: now, lighter: { t: now, scanned: lScanned, positions: lPos, coins: lbook,
      holders: Object.keys(posCache).length,
      pos: posCache, pts: tsCache,
      emp: [...empList, ...newEmpty].slice(-4000),
      queue: unscanned.slice(0, 6000) } }));
  } catch (e) { console.log('lighter book failed', e.message); }
