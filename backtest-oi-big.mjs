/* backtest-oi-big.mjs v2 — GRELHA de parâmetros + história mais funda (corre na VPS).
   Passe A: Binance 5m 30d, 40 símbolos — grelha: 4 regras de direcção × 5 combos alvo/stop.
   Passe D: Bybit OI 5min, majors, a paginar PARA TRÁS até a API esgotar (loga a data mais antiga).
   Passe B: Coinalyze 4h, majors, tenta 3 anos (a 1h só deu ~2 meses).
   Regras de direcção: cont (+OI segue tendência 2h, −OI contra) · momo (segue o próprio candle
   do evento) · fade (contra o candle) · short (sempre short). Sem dados = fora; nada inventado. */
const CF = { acc: process.env.CF_ACCOUNT_ID, tok: process.env.CF_API_TOKEN, ns: process.env.CF_KV_NAMESPACE_ID };
const CZ = process.env.COINALYZE_KEY || "";
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function jget(url, hdrs) {
  for (let a = 0; a < 4; a++) {
    try {
      const r = await fetch(url, { headers: hdrs || {}, signal: AbortSignal.timeout(20000) });
      if (r.status === 429) { await sleep(3000 * (a + 1)); continue; }
      if (!r.ok) throw new Error("HTTP " + r.status);
      return await r.json();
    } catch (e) { if (a === 3) throw e; await sleep(1200 * (a + 1)); }
  }
}
const SYMS = ["BTC","ETH","SOL","XRP","DOGE","BNB","ADA","AVAX","LINK","LTC","SUI","NEAR","ARB","OP","APT","UNI","AAVE","ENA","TAO","WLD","PEPE","SHIB","BONK","FLOKI","JTO","LDO","ONDO","TRX","XLM","FET","VIRTUAL","PENDLE","CRV","ZRO","KAITO","TRUMP","PUMP","WLFI","HYPE","ZEC"];
const bn = c => (["PEPE","SHIB","BONK","FLOKI"].includes(c) ? "1000" + c : c) + "USDT";

function detect(oi, win, floor) {
  const evs = []; let lastT = 0;
  for (let i = win; i < oi.length; i++) {
    const v0 = oi[i - win][1], v1 = oi[i][1], t = oi[i][0];
    if (!v0 || v0 < floor) continue;
    const ch = (v1 - v0) / v0;
    if (Math.abs(ch) >= 0.035 && t - lastT > 3600_000) { evs.push({ t, ch, oi: v1, tier: Math.abs(ch) >= 0.05 ? "red" : "yellow" }); lastT = t; }
  }
  return evs;
}
const RULES = {
  cont: (e, kl, i0, iPrev) => { const pr = (kl[i0][4] - kl[iPrev][4]) / kl[iPrev][4]; return e.ch > 0 ? Math.sign(pr || 1) : -Math.sign(pr || 1); },
  momo: (e, kl, i0, iPrev, i15) => Math.sign((kl[i0][4] - kl[i15][4]) || 1),
  fade: (e, kl, i0, iPrev, i15) => -Math.sign((kl[i0][4] - kl[i15][4]) || 1),
  short: () => -1
};
const COMBOS = [[0.02, 0.01], [0.015, 0.01], [0.03, 0.015], [0.01, 0.01], [0.04, 0.02]];
function runGrid(evs, kl, barMs, horizonMs, prevMs) {
  const idx = new Map(kl.map((k, i) => [k[0], i]));
  const grid = {};
  for (const rn of Object.keys(RULES)) for (const [tp, sl] of COMBOS) for (const fl of [5e6, 2e7]) {
    const key = rn + " tp" + tp * 100 + "/sl" + sl * 100 + " f" + fl / 1e6 + "M";
    const g = grid[key] = grid[key] || { n: 0, win: 0, loss: 0, timeout: 0, pnl: 0, longs: 0, shorts: 0, red: { n: 0, win: 0 }, yellow: { n: 0, win: 0 } };
    for (const e of evs) {
      if (e.oi < fl) continue;   /* piso de OI como parâmetro (observação dele: $20M parece filtrar melhor) */
      const t0 = Math.floor(e.t / barMs) * barMs;
      const i0 = idx.get(t0); if (i0 == null || i0 < prevMs / barMs + 4) continue;
      const iPrev = i0 - Math.round(prevMs / barMs), i15 = Math.max(0, i0 - 3);
      const dir = RULES[rn](e, kl, i0, iPrev, i15);
      const p0 = kl[i0][4];
      let res = "timeout", pnl = 0;
      for (let i = i0 + 1; i < kl.length && kl[i][0] <= t0 + horizonMs; i++) {
        const hi = (kl[i][2] - p0) / p0, lo = (kl[i][3] - p0) / p0;
        const fav = dir > 0 ? hi : -lo, adv = dir > 0 ? -lo : hi;
        if (adv >= sl) { res = "loss"; pnl = -sl; break; }
        if (fav >= tp) { res = "win"; pnl = tp; break; }
        pnl = dir > 0 ? (kl[i][4] - p0) / p0 : (p0 - kl[i][4]) / p0;
      }
      g.n++; g[res]++; g.pnl += pnl * 100; dir > 0 ? g.longs++ : g.shorts++;
      g[e.tier].n++; if (res === "win") g[e.tier].win++;
    }
  }
  return grid;
}
function mergeGrid(a, b) {
  for (const k in b) {
    a[k] = a[k] || { n: 0, win: 0, loss: 0, timeout: 0, pnl: 0, longs: 0, shorts: 0, red: { n: 0, win: 0 }, yellow: { n: 0, win: 0 } };
    for (const f of ["n","win","loss","timeout","pnl","longs","shorts"]) a[k][f] += b[k][f];
    for (const t of ["red","yellow"]) { a[k][t].n += b[k][t].n; a[k][t].win += b[k][t].win; }
  }
}
function finish(g) {
  for (const k in g) { g[k].winRate = +(g[k].win / (g[k].n || 1) * 100).toFixed(1); g[k].avgPnl = +(g[k].pnl / (g[k].n || 1)).toFixed(3); g[k].pnl = +g[k].pnl.toFixed(1); }
  return g;
}

const results = { t: Date.now(), v: 2, passA: null, passD: null, passB: null };
/* ---------- A: Binance 5m 30d, grelha completa ---------- */
{
  const end = Date.now(), start = end - 29.5 * 86400_000;
  const grid = {}; let nEv = 0;
  for (const c of SYMS) {
    try {
      const sym = bn(c);
      let oi = [], t = start;
      while (t < end) {
        const j = await jget(`https://fapi.binance.com/futures/data/openInterestHist?symbol=${sym}&period=5m&limit=500&startTime=${t}&endTime=${Math.min(t + 500 * 300_000, end)}`);
        if (!Array.isArray(j) || !j.length) break;
        oi.push(...j.map(x => [x.timestamp, +x.sumOpenInterestValue]));
        t = j[j.length - 1].timestamp + 300_000; await sleep(120);
      }
      if (oi.length < 100) continue;
      let kl = [], t2 = start - 3 * 3600_000;
      while (t2 < end) {
        const j = await jget(`https://fapi.binance.com/fapi/v1/klines?symbol=${sym}&interval=5m&limit=1500&startTime=${t2}&endTime=${end}`);
        if (!Array.isArray(j) || !j.length) break;
        kl.push(...j.map(x => [x[0], +x[1], +x[2], +x[3], +x[4]]));
        t2 = j[j.length - 1][0] + 300_000; await sleep(120);
      }
      const evs = detect(oi, 3, 5e6); nEv += evs.length;
      mergeGrid(grid, runGrid(evs, kl, 300_000, 6 * 3600_000, 2 * 3600_000));
      console.log(`A ${c}: ${evs.length} eventos`);
    } catch (e) { console.log("A " + c + ": " + e.message); }
  }
  results.passA = { days: 30, granularity: "5m", nEvents: nEv, grid: finish(grid) };
  console.log("A GRID:", JSON.stringify(results.passA.grid));
}
/* ---------- D: Bybit 5min, o mais para trás que der (majors) ---------- */
{
  const MAJ = ["BTC","ETH","SOL","XRP","DOGE","LINK"];
  const grid = {}; let nEv = 0; let earliest = Date.now();
  for (const c of MAJ) {
    try {
      const sym = bn(c);
      let oi = []; let endT = Date.now(); let reqs = 0;
      while (reqs < 600) {
        const j = await jget(`https://api.bybit.com/v5/market/open-interest?category=linear&symbol=${sym}&intervalTime=5min&limit=200&endTime=${endT}`);
        const L = j.result && j.result.list || [];
        if (!L.length) break;
        oi.push(...L.map(x => [+x.timestamp, +x.openInterest]));
        const oldest = Math.min(...L.map(x => +x.timestamp));
        if (oldest >= endT) break;
        endT = oldest - 1; reqs++;
        await sleep(120);
        if (Date.now() - oi[0] > 3.1 * 365 * 86400_000) break;
      }
      oi.sort((a, b) => a[0] - b[0]);
      if (oi.length < 500) { console.log("D " + c + ": só " + oi.length + " pts"); continue; }
      /* openInterest da Bybit vem em CONTRATOS (=moedas p/ linear) — converter p/ USD com o kline */
      earliest = Math.min(earliest, oi[0][0]);
      const start = oi[0][0] - 3 * 3600_000, end = Date.now();
      let kl = [], t2 = start;
      while (t2 < end) {
        const j = await jget(`https://fapi.binance.com/fapi/v1/klines?symbol=${sym}&interval=5m&limit=1500&startTime=${t2}&endTime=${end}`);
        if (!Array.isArray(j) || !j.length) break;
        kl.push(...j.map(x => [x[0], +x[1], +x[2], +x[3], +x[4]]));
        t2 = j[j.length - 1][0] + 300_000; await sleep(120);
      }
      const pxAt = new Map(kl.map(k => [k[0], k[4]]));
      const oiUsd = oi.map(([t, v]) => [t, v * (pxAt.get(Math.floor(t / 300_000) * 300_000) || 0)]).filter(x => x[1] > 0);
      const evs = detect(oiUsd, 3, 5e6); nEv += evs.length;
      mergeGrid(grid, runGrid(evs, kl, 300_000, 6 * 3600_000, 2 * 3600_000));
      console.log(`D ${c}: ${oiUsd.length} pts desde ${new Date(oi[0][0]).toISOString().slice(0,10)}, ${evs.length} eventos`);
    } catch (e) { console.log("D " + c + ": " + e.message); }
  }
  results.passD = { granularity: "5m(Bybit)", earliest: new Date(earliest).toISOString().slice(0, 10), nEvents: nEv, grid: finish(grid) };
  console.log("D GRID:", JSON.stringify(results.passD.grid));
}
/* ---------- B: Coinalyze 4h, tenta 3 anos ---------- */
if (CZ) {
  const MAJ = ["BTC","ETH","SOL","XRP","DOGE","BNB","AVAX","LINK"];
  const grid = {}; let nEv = 0; let earliest = Date.now();
  for (const c of MAJ) {
    try {
      const now = Math.floor(Date.now() / 1000);
      const j = await jget(`https://api.coinalyze.net/v1/open-interest-history?symbols=${bn(c)}_PERP.A&interval=4hour&from=${now - 3 * 365 * 86400}&to=${now}&convert_to_usd=true`, { api_key: CZ });
      const hist = Array.isArray(j) && j[0] && j[0].history ? j[0].history : [];
      const oi = hist.map(x => [x.t * 1000, +x.c]).sort((a, b) => a[0] - b[0]);
      await sleep(1100);
      if (oi.length < 100) { console.log("B " + c + ": só " + oi.length); continue; }
      earliest = Math.min(earliest, oi[0][0]);
      let kl = [], t2 = oi[0][0] - 2 * 86400_000; const end = Date.now();
      while (t2 < end) {
        const jj = await jget(`https://fapi.binance.com/fapi/v1/klines?symbol=${bn(c)}&interval=4h&limit=1500&startTime=${t2}&endTime=${end}`);
        if (!Array.isArray(jj) || !jj.length) break;
        kl.push(...jj.map(x => [x[0], +x[1], +x[2], +x[3], +x[4]]));
        t2 = jj[jj.length - 1][0] + 4 * 3600_000; await sleep(150);
      }
      const evs = detect(oi, 3, 2e7); nEv += evs.length;   /* janela 12h a 4h bars */
      mergeGrid(grid, runGrid(evs, kl, 4 * 3600_000, 3 * 86400_000, 24 * 3600_000));
      console.log(`B ${c}: desde ${new Date(oi[0][0]).toISOString().slice(0,10)}, ${evs.length} eventos`);
    } catch (e) { console.log("B " + c + ": " + e.message); }
  }
  results.passB = { granularity: "4h", earliest: new Date(earliest).toISOString().slice(0, 10), nEvents: nEv, grid: finish(grid) };
  console.log("B GRID:", JSON.stringify(results.passB.grid));
}

import fs from "fs";
fs.writeFileSync("/tmp/backtest-oi.json", JSON.stringify(results));
if (CF.acc && CF.tok && CF.ns) {
  const body = JSON.stringify(results);
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF.acc}/storage/kv/namespaces/${CF.ns}/values/backtest-oi.json`, { method: "PUT", headers: { Authorization: "Bearer " + CF.tok }, body });
  console.log("kv put backtest-oi.json: HTTP " + r.status + " (" + body.length + " bytes)");
}
console.log("fim");
process.exit(0);
