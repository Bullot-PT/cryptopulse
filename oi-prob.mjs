/* oi-prob.mjs — TABELA DE PROBABILIDADE DE DIRECÇÃO por perfil de burst de OI.
   Pergunta que responde: "dado um burst destes (sinal do ΔOI × tendência prévia × tier × tamanho
   do OI), historicamente o preço foi para onde, e com que probabilidade?"

   Método (barreira simétrica — a métrica mais honesta e interpretável):
   a partir do fecho do candle do evento, qual das barreiras ±X% é tocada PRIMEIRO em 6h.
   Empate no mesmo candle (as duas tocadas) = ambíguo, EXCLUÍDO (não se inventa vencedor).
   Sem barreira tocada = "none" (fica no n mas fora do cálculo de pUp).

   Dados: Bybit OI 5-min paginado o mais fundo que a API der (12 moedas) + Binance OI 5-min 30d
   (40 símbolos). Preços: klines 5m da Binance fapi. Só dados reais.
   Saída: KV data/oi-prob.json — buckets com n, pUp, pDown, medMove, e a direcção recomendada. */
const CF = { acc: process.env.CF_ACCOUNT_ID, tok: process.env.CF_API_TOKEN, ns: process.env.CF_KV_NAMESPACE_ID };
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function jget(url) {
  for (let a = 0; a < 4; a++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (r.status === 429) { await sleep(3000 * (a + 1)); continue; }
      if (!r.ok) throw new Error("HTTP " + r.status);
      return await r.json();
    } catch (e) { if (a === 3) throw e; await sleep(1200 * (a + 1)); }
  }
}
const DEEP = ["BTC","ETH","SOL","XRP","DOGE","LINK","ADA","AVAX","LTC","BNB","NEAR","UNI"];
const WIDE = ["BTC","ETH","SOL","XRP","DOGE","BNB","ADA","AVAX","LINK","LTC","SUI","NEAR","ARB","OP","APT","UNI","AAVE","ENA","TAO","WLD","PEPE","SHIB","BONK","FLOKI","JTO","LDO","ONDO","TRX","XLM","FET","VIRTUAL","PENDLE","CRV","ZRO","KAITO","TRUMP","PUMP","WLFI","HYPE","ZEC"];
const bn = c => (["PEPE","SHIB","BONK","FLOKI"].includes(c) ? "1000" + c : c) + "USDT";
const BAR = 300_000, HORIZON = 6 * 3600_000, PREV = 2 * 3600_000;
const BARRIERS = [0.01, 0.02];       /* ±1% e ±2% */

async function klines5m(sym, from, to) {
  let kl = [], t = from;
  while (t < to) {
    const j = await jget(`https://fapi.binance.com/fapi/v1/klines?symbol=${sym}&interval=5m&limit=1500&startTime=${t}&endTime=${to}`);
    if (!Array.isArray(j) || !j.length) break;
    kl.push(...j.map(x => [x[0], +x[2], +x[3], +x[4]]));   /* t, high, low, close */
    t = j[j.length - 1][0] + BAR;
    await sleep(110);
  }
  return kl;
}
function detect(oi, floor) {
  const evs = []; let last = 0;
  for (let i = 3; i < oi.length; i++) {
    const v0 = oi[i - 3][1], v1 = oi[i][1], t = oi[i][0];
    if (!v0 || v0 < floor) continue;
    if (t - oi[i - 3][0] > 20 * 60_000) continue;          /* janela realmente ~15 min */
    const ch = (v1 - v0) / v0;
    if (Math.abs(ch) >= 0.035 && t - last > 3600_000) { evs.push({ t, ch, oi: v1 }); last = t; }
  }
  return evs;
}
/* buckets: dOI(up/down) × tendência prévia(up/down) × tier(yellow/red) */
const B = {};
function bkey(e, trend, barrier) { return (e.ch > 0 ? "OIup" : "OIdn") + "|" + (trend > 0 ? "trUp" : "trDn") + "|" + (Math.abs(e.ch) >= 0.05 ? "red" : "yellow") + "|b" + barrier * 100; }
function add(key, big, out, mv) {
  const g = B[key] = B[key] || { n: 0, up: 0, down: 0, none: 0, ambig: 0, nBig: 0, upBig: 0, downBig: 0, mvSum: 0, mvN: 0 };
  g.n++;
  if (out === "up") g.up++; else if (out === "down") g.down++; else if (out === "ambig") g.ambig++; else g.none++;
  if (big) { g.nBig++; if (out === "up") g.upBig++; else if (out === "down") g.downBig++; }
  if (mv != null) { g.mvSum += Math.abs(mv); g.mvN++; }
}
function process(evs, kl) {
  const idx = new Map(kl.map((k, i) => [k[0], i]));
  for (const e of evs) {
    const t0 = Math.floor(e.t / BAR) * BAR;
    const i0 = idx.get(t0); if (i0 == null || i0 < PREV / BAR + 2) continue;
    const p0 = kl[i0][3];
    const pPrev = kl[i0 - PREV / BAR][3];
    const trend = Math.sign((p0 - pPrev) || 1);
    for (const bar of BARRIERS) {
      let out = "none", mv = 0;
      for (let i = i0 + 1; i < kl.length && kl[i][0] <= t0 + HORIZON; i++) {
        const hi = (kl[i][1] - p0) / p0, lo = (kl[i][2] - p0) / p0;
        if (Math.abs(hi) > Math.abs(mv)) mv = hi;
        if (Math.abs(lo) > Math.abs(mv)) mv = lo;
        const upHit = hi >= bar, dnHit = -lo >= bar;
        if (upHit && dnHit) { out = "ambig"; break; }
        if (upHit) { out = "up"; break; }
        if (dnHit) { out = "down"; break; }
      }
      add(bkey(e, trend, bar), e.oi >= 2e7, out, mv);
    }
  }
}

let deepest = Date.now(), totalEv = 0;
/* --- Bybit: história funda --- */
for (const c of DEEP) {
  try {
    const sym = bn(c);
    let raw = [], endT = Date.now(), reqs = 0;
    while (reqs < 620) {
      const j = await jget(`https://api.bybit.com/v5/market/open-interest?category=linear&symbol=${sym}&intervalTime=5min&limit=200&endTime=${endT}`);
      const L = (j.result && j.result.list) || [];
      if (!L.length) break;
      raw.push(...L.map(x => [+x.timestamp, +x.openInterest]));
      const oldest = Math.min(...L.map(x => +x.timestamp));
      if (oldest >= endT) break;
      endT = oldest - 1; reqs++;
      await sleep(110);
    }
    raw.sort((a, b) => a[0] - b[0]);
    if (raw.length < 500) { console.log("deep " + c + ": só " + raw.length); continue; }
    const kl = await klines5m(sym, raw[0][0] - 3 * 3600_000, Date.now());
    const px = new Map(kl.map(k => [k[0], k[3]]));
    const oi = raw.map(([t, v]) => [t, v * (px.get(Math.floor(t / BAR) * BAR) || 0)]).filter(x => x[1] > 0);
    const evs = detect(oi, 5e6);
    process(evs, kl);
    totalEv += evs.length;
    deepest = Math.min(deepest, oi[0][0]);
    console.log(`deep ${c}: desde ${new Date(oi[0][0]).toISOString().slice(0,10)}, ${evs.length} eventos`);
  } catch (e) { console.log("deep " + c + ": " + e.message); }
}
/* --- Binance: 30 dias, universo largo (inclui alts) --- */
{
  const end = Date.now(), start = end - 29.5 * 86400_000;
  for (const c of WIDE) {
    try {
      const sym = bn(c);
      let oi = [], t = start;
      while (t < end) {
        const j = await jget(`https://fapi.binance.com/futures/data/openInterestHist?symbol=${sym}&period=5m&limit=500&startTime=${t}&endTime=${Math.min(t + 500 * BAR, end)}`);
        if (!Array.isArray(j) || !j.length) break;
        oi.push(...j.map(x => [x.timestamp, +x.sumOpenInterestValue]));
        t = j[j.length - 1].timestamp + BAR;
        await sleep(110);
      }
      if (oi.length < 100) continue;
      const kl = await klines5m(sym, start - 3 * 3600_000, end);
      const evs = detect(oi, 5e6);
      process(evs, kl);
      totalEv += evs.length;
      console.log(`wide ${c}: ${evs.length} eventos`);
    } catch (e) { console.log("wide " + c + ": " + e.message); }
  }
}

/* --- finalizar: probabilidades --- */
const out = { t: Date.now(), v: 1, since: new Date(deepest).toISOString().slice(0, 10), nEvents: totalEv, buckets: {} };
for (const [k, g] of Object.entries(B)) {
  const decided = g.up + g.down;
  const decidedBig = g.upBig + g.downBig;
  out.buckets[k] = {
    n: g.n, decided, ambig: g.ambig, none: g.none,
    pUp: decided ? +(g.up / decided * 100).toFixed(1) : null,
    nBig: g.nBig, pUpBig: decidedBig >= 20 ? +(g.upBig / decidedBig * 100).toFixed(1) : null,
    medMove: g.mvN ? +(g.mvSum / g.mvN * 100).toFixed(2) : null
  };
}
console.log("BUCKETS:", JSON.stringify(out.buckets));
import fs from "fs";
fs.writeFileSync("/tmp/oi-prob.json", JSON.stringify(out));
if (CF.acc && CF.tok && CF.ns) {
  const body = JSON.stringify(out);
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF.acc}/storage/kv/namespaces/${CF.ns}/values/oi-prob.json`, { method: "PUT", headers: { Authorization: "Bearer " + CF.tok }, body });
  console.log("kv put oi-prob.json: HTTP " + r.status + " (" + body.length + " bytes)");
}
console.log("fim · eventos:", totalEv, "· desde", out.since);
process.exit(0);
