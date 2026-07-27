/* backtest-oi-big.mjs — backtest GRANDE do gatilho de ΔOI (corre na VPS via workflow).
   Passe A: Binance fapi openInterestHist 5m — 30 dias (o máximo que a API dá a 5m), ~40 símbolos.
   Passe B: Coinalyze (key dele) OI 1h — o mais para trás que a API der (tenta anos), majors.
   Para cada evento: AMARELO |ΔOI 15m| 3.5-5% · VERMELHO ≥5% (floor $5M; passe B: janela 3h, floor $20M).
   Direcção do setup (regra do estudo pequeno): +OI → continuação da tendência das 2h antes;
   −OI → reversão dela. Trade simulada: entrada no fecho do candle do evento, alvo +2%, stop −1%,
   horizonte 6h (B: alvo +4%/stop −2%/24h). Sem dados = evento fora; nada inventado.
   Resultado: resumo no log + data/backtest-oi.json no KV. */
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

function detect(oi, win, floor) {          /* oi = [[t,v]] ordenado; win = nº de barras da janela */
  const evs = []; let lastT = 0;
  for (let i = win; i < oi.length; i++) {
    const v0 = oi[i - win][1], v1 = oi[i][1], t = oi[i][0];
    if (!v0 || v0 < floor) continue;
    const ch = (v1 - v0) / v0;
    if (Math.abs(ch) >= 0.035 && t - lastT > 3600_000) { evs.push({ t, ch, oi: v1, tier: Math.abs(ch) >= 0.05 ? "red" : "yellow" }); lastT = t; }
  }
  return evs;
}
function simulate(evs, kl, barMs, tgt, stp, horizonMs, prevMs) {
  /* kl = [[t,o,h,l,c]] ordenado */
  const idx = new Map(kl.map((k, i) => [k[0], i]));
  const out = [];
  for (const e of evs) {
    const t0 = Math.floor(e.t / barMs) * barMs;
    const i0 = idx.get(t0); if (i0 == null || i0 < prevMs / barMs + 1) continue;
    const p0 = kl[i0][4];
    const iPrev = i0 - Math.round(prevMs / barMs);
    const prior = (p0 - kl[iPrev][4]) / kl[iPrev][4];
    const dir = e.ch > 0 ? Math.sign(prior || 1) : -Math.sign(prior || 1);   /* +OI continua · −OI reverte */
    let res = "timeout", move = 0, mm = 0;
    for (let i = i0 + 1; i < kl.length && kl[i][0] <= t0 + horizonMs; i++) {
      const hi = (kl[i][2] - p0) / p0, lo = (kl[i][3] - p0) / p0;
      const fav = dir > 0 ? hi : -lo, adv = dir > 0 ? -lo : hi;
      if (Math.abs(hi) > Math.abs(mm)) mm = hi;
      if (Math.abs(lo) > Math.abs(mm)) mm = lo;
      if (adv >= stp) { res = "loss"; move = -stp; break; }
      if (fav >= tgt) { res = "win"; move = tgt; break; }
      move = dir > 0 ? (kl[i][4] - p0) / p0 : (p0 - kl[i][4]) / p0;
    }
    out.push({ c: e.c, t: e.t, tier: e.tier, ch: +(e.ch * 100).toFixed(2), oi: Math.round(e.oi), dir: dir > 0 ? "LONG" : "SHORT", res, pnl: +(move * 100).toFixed(2), maxMove: +(mm * 100).toFixed(2) });
  }
  return out;
}
function agg(rows) {
  const g = {};
  for (const r of rows) {
    for (const k of [r.tier, r.tier + ":" + r.dir, "all"]) {
      g[k] = g[k] || { n: 0, win: 0, loss: 0, timeout: 0, pnl: 0, mm: 0 };
      g[k].n++; g[k][r.res]++; g[k].pnl += r.pnl; g[k].mm += Math.abs(r.maxMove);
    }
  }
  for (const k in g) { g[k].winRate = +(g[k].win / g[k].n * 100).toFixed(1); g[k].avgPnl = +(g[k].pnl / g[k].n).toFixed(2); g[k].avgAbsMove = +(g[k].mm / g[k].n).toFixed(2); delete g[k].pnl; delete g[k].mm; }
  return g;
}

const results = { t: Date.now(), passA: null, passB: null };
/* ---------- PASSE A: Binance 5m, 30 dias ---------- */
{
  const end = Date.now(), start = end - 29.5 * 86400_000;
  const all = [];
  for (const c of SYMS) {
    try {
      const sym = bn(c);
      let oi = [], t = start;
      while (t < end) {
        const j = await jget(`https://fapi.binance.com/futures/data/openInterestHist?symbol=${sym}&period=5m&limit=500&startTime=${t}&endTime=${Math.min(t + 500 * 300_000, end)}`);
        if (!Array.isArray(j) || !j.length) break;
        oi.push(...j.map(x => [x.timestamp, +x.sumOpenInterestValue]));
        t = j[j.length - 1].timestamp + 300_000;
        await sleep(150);
      }
      if (oi.length < 100) { console.log(c + ": sem OI hist (" + oi.length + ")"); continue; }
      let kl = [], t2 = start - 3 * 3600_000;
      while (t2 < end) {
        const j = await jget(`https://fapi.binance.com/fapi/v1/klines?symbol=${sym}&interval=5m&limit=1500&startTime=${t2}&endTime=${end}`);
        if (!Array.isArray(j) || !j.length) break;
        kl.push(...j.map(x => [x[0], +x[1], +x[2], +x[3], +x[4]]));
        t2 = j[j.length - 1][0] + 300_000;
        await sleep(150);
      }
      const evs = detect(oi, 3, 5e6).map(e => ({ ...e, c }));
      const rows = simulate(evs, kl, 300_000, 0.02, 0.01, 6 * 3600_000, 2 * 3600_000);
      all.push(...rows);
      console.log(`A ${c}: ${oi.length} oi pts, ${evs.length} eventos, ${rows.length} simulados`);
    } catch (e) { console.log("A " + c + " falhou: " + e.message); }
  }
  results.passA = { days: 30, granularity: "5m", nSymbols: SYMS.length, rows: all, summary: agg(all) };
  console.log("PASSE A resumo:", JSON.stringify(results.passA.summary));
}
/* ---------- PASSE B: Coinalyze 1h, o mais para trás possível ---------- */
if (CZ) {
  const MAJ = ["BTC","ETH","SOL","XRP","DOGE","BNB","AVAX","LINK","ADA","LTC"];
  const all = []; let earliest = Date.now();
  for (const c of MAJ) {
    try {
      const sym = bn(c) + "_PERP.A";
      let oi = []; const now = Math.floor(Date.now() / 1000);
      let from = now - 3 * 365 * 86400;      /* tenta 3 anos; a API devolve o que tiver */
      const j = await jget(`https://api.coinalyze.net/v1/open-interest-history?symbols=${sym}&interval=1hour&from=${from}&to=${now}&convert_to_usd=true`, { api_key: CZ });
      const hist = Array.isArray(j) && j[0] && j[0].history ? j[0].history : [];
      oi = hist.map(x => [x.t * 1000, +x.c]).sort((a, b) => a[0] - b[0]);
      await sleep(1100);
      if (oi.length < 200) { console.log("B " + c + ": só " + oi.length + " pts"); continue; }
      earliest = Math.min(earliest, oi[0][0]);
      let kl = [], t2 = oi[0][0] - 12 * 3600_000; const end = Date.now();
      while (t2 < end) {
        const jj = await jget(`https://fapi.binance.com/fapi/v1/klines?symbol=${bn(c)}&interval=1h&limit=1500&startTime=${t2}&endTime=${end}`);
        if (!Array.isArray(jj) || !jj.length) break;
        kl.push(...jj.map(x => [x[0], +x[1], +x[2], +x[3], +x[4]]));
        t2 = jj[jj.length - 1][0] + 3600_000;
        await sleep(150);
      }
      const evs = detect(oi, 3, 2e7).map(e => ({ ...e, c }));
      const rows = simulate(evs, kl, 3600_000, 0.04, 0.02, 24 * 3600_000, 6 * 3600_000);
      all.push(...rows);
      console.log(`B ${c}: ${oi.length} oi pts desde ${new Date(oi[0][0]).toISOString().slice(0,10)}, ${evs.length} eventos, ${rows.length} simulados`);
    } catch (e) { console.log("B " + c + " falhou: " + e.message); }
  }
  results.passB = { granularity: "1h", earliest: new Date(earliest).toISOString().slice(0, 10), rows: all, summary: agg(all) };
  console.log("PASSE B resumo:", JSON.stringify(results.passB.summary));
} else console.log("sem COINALYZE_KEY — passe B saltado");

import fs from "fs";
fs.writeFileSync("/tmp/backtest-oi.json", JSON.stringify(results));
if (CF.acc && CF.tok && CF.ns) {
  const body = JSON.stringify(results);
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF.acc}/storage/kv/namespaces/${CF.ns}/values/backtest-oi.json`, { method: "PUT", headers: { Authorization: "Bearer " + CF.tok }, body });
  console.log("kv put backtest-oi.json: HTTP " + r.status + " (" + body.length + " bytes)");
}
console.log("fim");
process.exit(0);
