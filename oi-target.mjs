/* oi-target.mjs — QUANTO % dá para tirar de cada burst, e com que combinação de alvo/stop.
   Pergunta dele: "tinhas dito que as trades iam ser de menos de 1%, eu preciso de mais % nas
   trades, especialmente porque vou usar lev."

   O estudo anterior (oi-prob.mjs) só perguntava DIRECÇÃO com barreiras fixas de ±1% e ±2%. Este
   pergunta TAMANHO: dado o burst, até onde é que o preço chega a favor antes de chegar contra?
   Três coisas mudam em relação ao anterior:
     1. horizonte 6h → também 12h e 24h (movimentos grandes precisam de tempo)
     2. alvos dimensionados pela VOLATILIDADE da moeda (múltiplos de ATR), não 1% fixo para todas —
        1% numa alt de ATR 3% é ruído; numa BTC de ATR 0.4% é um movimento a sério
     3. mede MFE/MAE (excursão máxima a favor / contra) para se ver a distribuição real, incluindo
        a percentagem de eventos que chegam a +3% e +5%
   Custos incluídos: taker 0.055%/lado (0.11% ida-e-volta) e maker 0.01%/lado (0.02%).
   Só dados reais. Empate dentro do mesmo candle conta como STOP (conservador, nunca a favor). */
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
const BAR = 300_000, PREV = 2 * 3600_000;
const HORIZONS = [6, 12, 24];                 /* horas */
const ATR_N = 288;                            /* 24h de candles 5m */
const K_TGT = [1, 1.5, 2, 3, 4];              /* alvo em múltiplos de ATR% */
const K_STP = [1, 1.5, 2];                    /* stop em múltiplos de ATR% */
const FIX_TGT = [0.01, 0.02, 0.03, 0.05];     /* alvos fixos, para comparar */
const COST_TAKER = 0.0011, COST_MAKER = 0.0002;

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
    if (t - oi[i - 3][0] > 20 * 60_000) continue;
    const ch = (v1 - v0) / v0;
    if (Math.abs(ch) >= 0.035 && t - last > 3600_000) { evs.push({ t, ch, oi: v1 }); last = t; }
  }
  return evs;
}
/* ATR% clássico (true range médio das últimas ATR_N barras) em fracção do preço */
function atrPct(kl, i0) {
  let sum = 0, n = 0;
  for (let i = Math.max(1, i0 - ATR_N + 1); i <= i0; i++) {
    const tr = Math.max(kl[i][1] - kl[i][2], Math.abs(kl[i][1] - kl[i - 1][3]), Math.abs(kl[i][2] - kl[i - 1][3]));
    sum += tr; n++;
  }
  if (!n) return null;
  return (sum / n) / kl[i0][3];
}
/* simula uma entrada com alvo/stop em fracção; devolve "win" | "loss" | "open" e o R alcançado */
function sim(kl, i0, dir, tgt, stp, horizonMs) {
  const p0 = kl[i0][3], t0 = kl[i0][0];
  let pe = p0;
  for (let i = i0 + 1; i < kl.length && kl[i][0] <= t0 + horizonMs; i++) {
    const up = (kl[i][1] - p0) / p0, dn = (kl[i][2] - p0) / p0;
    const fav = dir > 0 ? up : -dn;          /* excursão a favor nesta barra */
    const adv = dir > 0 ? -dn : up;          /* excursão contra nesta barra */
    const hitT = fav >= tgt, hitS = adv >= stp;
    if (hitT && hitS) return { r: -stp, out: "loss" };   /* ambíguo = perda (conservador) */
    if (hitS) return { r: -stp, out: "loss" };
    if (hitT) return { r: tgt, out: "win" };
    pe = kl[i][3];
  }
  /* fechado ao fim do horizonte, ao preço de fecho */
  return { r: dir > 0 ? (pe - p0) / p0 : (p0 - pe) / p0, out: "open" };
}
function excursions(kl, i0, dir, horizonMs) {
  const p0 = kl[i0][3], t0 = kl[i0][0];
  let mfe = 0, mae = 0, mfeBeforeMae2 = 0;
  for (let i = i0 + 1; i < kl.length && kl[i][0] <= t0 + horizonMs; i++) {
    const up = (kl[i][1] - p0) / p0, dn = (kl[i][2] - p0) / p0;
    const fav = dir > 0 ? up : -dn, adv = dir > 0 ? -dn : up;
    if (fav > mfe) mfe = fav;
    if (adv > mae) mae = adv;
  }
  return { mfe, mae, mfeBeforeMae2 };
}

const G = {};                                  /* bucket -> acumulador */
function grp(key) {
  return G[key] || (G[key] = {
    n: 0, atr: [], H: {}, grid: {}, fix: {}
  });
}
function med(a) { if (!a.length) return null; const b = [...a].sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; }
function pct(a, q) { if (!a.length) return null; const b = [...a].sort((x, y) => x - y); return b[Math.min(b.length - 1, Math.floor(b.length * q))]; }

function processEvents(evs, kl, coin) {
  const idx = new Map(kl.map((k, i) => [k[0], i]));
  for (const e of evs) {
    const t0 = Math.floor(e.t / BAR) * BAR;
    const i0 = idx.get(t0); if (i0 == null || i0 < PREV / BAR + 2) continue;
    const p0 = kl[i0][3], pPrev = kl[i0 - PREV / BAR][3];
    const trend = Math.sign((p0 - pPrev) || 1);
    const a = atrPct(kl, i0); if (!a || a <= 0) continue;
    const dir = trend;                                        /* regra cont: seguir a tendência prévia */
    const tier = Math.abs(e.ch) >= 0.05 ? "red" : "yellow";
    const big = e.oi >= 2e7;
    const key = (e.ch > 0 ? "OIup" : "OIdn") + "|" + (trend > 0 ? "trUp" : "trDn") + "|" + tier + (big ? "|20M" : "|small");
    const g = grp(key);
    g.n++; g.atr.push(a);
    for (const H of HORIZONS) {
      const ms = H * 3600_000;
      const ex = excursions(kl, i0, dir, ms);
      const h = g.H[H] || (g.H[H] = { mfe: [], mae: [], n2: 0, n3: 0, n5: 0, n8: 0 });
      h.mfe.push(ex.mfe); h.mae.push(ex.mae);
      if (ex.mfe >= 0.02) h.n2++;
      if (ex.mfe >= 0.03) h.n3++;
      if (ex.mfe >= 0.05) h.n5++;
      if (ex.mfe >= 0.08) h.n8++;
      for (const kt of K_TGT) for (const ks of K_STP) {
        const gk = H + "h|" + kt + "atr|" + ks + "atr";
        const s = sim(kl, i0, dir, kt * a, ks * a, ms);
        const c = g.grid[gk] || (g.grid[gk] = { n: 0, win: 0, loss: 0, open: 0, sum: 0 });
        c.n++; c.sum += s.r; c[s.out]++;
      }
      for (const ft of FIX_TGT) {
        const gk = H + "h|" + (ft * 100) + "%";
        const s = sim(kl, i0, dir, ft, ft, ms);        /* alvo = stop, 1:1, para ler direito a taxa de acerto */
        const c = g.fix[gk] || (g.fix[gk] = { n: 0, win: 0, loss: 0, open: 0, sum: 0 });
        c.n++; c.sum += s.r; c[s.out]++;
      }
    }
  }
}

let deepest = Date.now(), totalEv = 0;
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
    const kl = await klines5m(sym, raw[0][0] - 30 * 3600_000, Date.now());
    const px = new Map(kl.map(k => [k[0], k[3]]));
    const oi = raw.map(([t, v]) => [t, v * (px.get(Math.floor(t / BAR) * BAR) || 0)]).filter(x => x[1] > 0);
    const evs = detect(oi, 5e6);
    processEvents(evs, kl, c);
    totalEv += evs.length;
    deepest = Math.min(deepest, oi[0][0]);
    console.log(`deep ${c}: desde ${new Date(oi[0][0]).toISOString().slice(0, 10)}, ${evs.length} eventos`);
  } catch (e) { console.log("deep " + c + ": " + e.message); }
}
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
      const kl = await klines5m(sym, start - 30 * 3600_000, end);
      const evs = detect(oi, 5e6);
      processEvents(evs, kl, c);
      totalEv += evs.length;
      console.log(`wide ${c}: ${evs.length} eventos`);
    } catch (e) { console.log("wide " + c + ": " + e.message); }
  }
}

const out = { t: Date.now(), v: 1, since: new Date(deepest).toISOString().slice(0, 10), nEvents: totalEv, buckets: {} };
for (const [k, g] of Object.entries(G)) {
  const b = { n: g.n, atrMed: +(med(g.atr) * 100).toFixed(2), H: {}, best: null, grid: {}, fix: {} };
  for (const H of HORIZONS) {
    const h = g.H[H]; if (!h) continue;
    b.H[H] = {
      mfeMed: +(med(h.mfe) * 100).toFixed(2), mfeP75: +(pct(h.mfe, 0.75) * 100).toFixed(2), mfeP90: +(pct(h.mfe, 0.9) * 100).toFixed(2),
      maeMed: +(med(h.mae) * 100).toFixed(2),
      pct2: +(h.n2 / h.mfe.length * 100).toFixed(1), pct3: +(h.n3 / h.mfe.length * 100).toFixed(1),
      pct5: +(h.n5 / h.mfe.length * 100).toFixed(1), pct8: +(h.n8 / h.mfe.length * 100).toFixed(1)
    };
  }
  for (const [gk, c] of Object.entries(g.grid)) {
    const gross = c.sum / c.n;
    b.grid[gk] = { n: c.n, wr: +(c.win / c.n * 100).toFixed(1), gross: +(gross * 100).toFixed(3),
      netTaker: +((gross - COST_TAKER) * 100).toFixed(3), netMaker: +((gross - COST_MAKER) * 100).toFixed(3) };
    if (c.n >= 40 && (!b.best || b.grid[gk].netMaker > b.best.netMaker)) b.best = { combo: gk, ...b.grid[gk] };
  }
  for (const [gk, c] of Object.entries(g.fix)) {
    const gross = c.sum / c.n;
    b.fix[gk] = { n: c.n, wr: +(c.win / c.n * 100).toFixed(1), gross: +(gross * 100).toFixed(3),
      netMaker: +((gross - COST_MAKER) * 100).toFixed(3) };
  }
  out.buckets[k] = b;
}
import fs from "fs";
fs.writeFileSync("/tmp/oi-target.json", JSON.stringify(out));
/* resumo legível no log */
for (const [k, b] of Object.entries(out.buckets)) {
  if (b.n < 30) continue;
  console.log("\n=== " + k + " · n=" + b.n + " · ATR mediano " + b.atrMed + "%");
  for (const H of HORIZONS) {
    const h = b.H[H]; if (!h) continue;
    console.log(`  ${H}h: MFE med ${h.mfeMed}% p75 ${h.mfeP75}% p90 ${h.mfeP90}% · MAE med ${h.maeMed}% · chega a +2% ${h.pct2}% · +3% ${h.pct3}% · +5% ${h.pct5}% · +8% ${h.pct8}%`);
  }
  if (b.best) console.log("  melhor grelha ATR: " + b.best.combo + " · win " + b.best.wr + "% · líquido maker " + b.best.netMaker + "%/trade (n=" + b.best.n + ")");
}
if (CF.acc && CF.tok && CF.ns) {
  const body = JSON.stringify(out);
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF.acc}/storage/kv/namespaces/${CF.ns}/values/oi-target.json`, { method: "PUT", headers: { Authorization: "Bearer " + CF.tok }, body });
  console.log("kv put oi-target.json: HTTP " + r.status + " (" + body.length + " bytes)");
}
console.log("\nfim · eventos:", totalEv, "· desde", out.since);
process.exit(0);
