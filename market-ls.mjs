/* market-ls.mjs — POSICIONAMENTO AGREGADO DE TODO O MERCADO DE PERPÉTUOS.
   Pedido dele: "across all markets não pode ser só Binance, precisamos do resto das CEX e fazer um
   agregado, arranja o máximo de informação possível".

   Seis bolsas, todas por API pública, todas verificadas a responder 200 a partir da VPS:
     Binance · Bybit · OKX · Bitget · HTX · Gate.io
   Mais a Hyperliquid, que não vem daqui — essa é medida por nós, carteira a carteira, em dólares
   reais (data/hl-ls.json), e entra no site como a linha das baleias.

   Duas famílias, porque medem coisas diferentes e misturá-las seria mentir:
     • CONTAS  — que percentagem das contas está longa. Uma conta de $200 pesa como uma de $2M.
       (Binance global · Bybit · OKX · Bitget · Gate lsr_account)
     • POSIÇÃO — ponderado pelo tamanho, ou seja onde está o dinheiro.
       (Binance top-trader position ratio · HTX elite · Gate top_lsr)

   Agregação: média ponderada pelo OPEN INTEREST EM USD de cada par em cada bolsa. Uma média simples
   deixaria um par de $20M pesar o mesmo que o BTC da Binance — isso não é "o mercado".
   Bolsa que falhe, ou par sem OI legível, fica DE FORA da média e é dito no ficheiro. Nada se estima.

   Saída: data/market-ls.json (+ KV). */
import fs from "fs";

const CF = { acc: process.env.CF_ACCOUNT_ID, tok: process.env.CF_API_TOKEN, ns: process.env.CF_KV_NAMESPACE_ID };
const OUT_F = "data/market-ls.json";
const TOP_N = 25;                 /* pares por bolsa, escolhidos pelo OI dessa bolsa */
const PACE = 130;                 /* ms entre pedidos */

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function jget(url, tries = 2) {
  for (let a = 0; a < tries; a++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (r.status === 429) { await sleep(2000 * (a + 1)); continue; }
      if (!r.ok) throw new Error("HTTP " + r.status);
      return await r.json();
    } catch (e) { if (a === tries - 1) throw e; await sleep(700 * (a + 1)); }
  }
}
const num = v => { const x = +v; return isFinite(x) ? x : null; };
/* nome canónico da moeda a partir do símbolo de cada bolsa (1000PEPE, kPEPE, PEPE → PEPE) */
function canon(sym) {
  let s = String(sym || "").toUpperCase();
  s = s.replace(/[-_]/g, "").replace(/SWAP$/, "").replace(/PERP$/, "");
  s = s.replace(/USDT$/, "").replace(/USDC$/, "").replace(/USD$/, "");
  s = s.replace(/^1000000/, "").replace(/^10000/, "").replace(/^1000/, "").replace(/^K(?=[A-Z]{3})/, "");
  return s;
}
/* ratio long/short (ex.: 1.81) → quota longa (0.645) */
const shareFromRatio = r => (r > 0 ? r / (1 + r) : null);

/* ---------------------------------------------------------------- bolsas */
/* Cada bolsa devolve: { name, family, rows: [{coin, sym, oi, long}] }
   family: "accounts" ou "position". oi em USD. long = quota longa 0..1. */

async function binance() {
  const out = { accounts: [], position: [] };
  /* OI por par: não há endpoint em bloco com valor em USD, mas o openInterestHist dá-o directo */
  const info = await jget("https://fapi.binance.com/fapi/v1/exchangeInfo");
  const syms = (info.symbols || [])
    .filter(s => s.contractType === "PERPETUAL" && s.quoteAsset === "USDT" && s.status === "TRADING")
    .map(s => s.symbol);
  /* usar o volume 24h para escolher os candidatos e só depois pedir OI aos melhores — evita
     centenas de pedidos para descobrir que um par tem OI residual */
  const t24 = await jget("https://fapi.binance.com/fapi/v1/ticker/24hr");
  const vol = new Map((Array.isArray(t24) ? t24 : []).map(x => [x.symbol, num(x.quoteVolume) || 0]));
  const cand = syms.sort((a, b) => (vol.get(b) || 0) - (vol.get(a) || 0)).slice(0, TOP_N + 8);
  for (const sym of cand) {
    try {
      const oiH = await jget(`https://fapi.binance.com/futures/data/openInterestHist?symbol=${sym}&period=5m&limit=1`);
      const oi = Array.isArray(oiH) && oiH[0] ? num(oiH[0].sumOpenInterestValue) : null;
      if (!oi) { await sleep(PACE); continue; }
      const g = await jget(`https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${sym}&period=5m&limit=1`);
      const gl = Array.isArray(g) && g[0] ? num(g[0].longAccount) : null;
      if (gl != null) out.accounts.push({ coin: canon(sym), sym, oi, long: gl });
      await sleep(PACE);
      const p = await jget(`https://fapi.binance.com/futures/data/topLongShortPositionRatio?symbol=${sym}&period=5m&limit=1`);
      const pl = Array.isArray(p) && p[0] ? num(p[0].longAccount) : null;
      if (pl != null) out.position.push({ coin: canon(sym), sym, oi, long: pl });
    } catch (e) {}
    await sleep(PACE);
  }
  return [
    { name: "Binance", family: "accounts", kind: "all accounts", rows: out.accounts },
    { name: "Binance", family: "position", kind: "top traders by position", rows: out.position }
  ];
}

async function bybit() {
  const t = await jget("https://api.bybit.com/v5/market/tickers?category=linear");
  const list = ((t.result || {}).list || [])
    .filter(x => /USDT$/.test(x.symbol) && num(x.openInterestValue))
    .sort((a, b) => num(b.openInterestValue) - num(a.openInterestValue)).slice(0, TOP_N);
  const rows = [];
  for (const x of list) {
    try {
      const j = await jget(`https://api.bybit.com/v5/market/account-ratio?category=linear&symbol=${x.symbol}&period=5min&limit=1`);
      const r = ((j.result || {}).list || [])[0];
      const long = r ? num(r.buyRatio) : null;
      if (long != null) rows.push({ coin: canon(x.symbol), sym: x.symbol, oi: num(x.openInterestValue), long });
    } catch (e) {}
    await sleep(PACE);
  }
  return [{ name: "Bybit", family: "accounts", kind: "all accounts", rows }];
}

async function okx() {
  const t = await jget("https://www.okx.com/api/v5/public/open-interest?instType=SWAP");
  const list = (t.data || [])
    .filter(x => /USDT-SWAP$/.test(x.instId) && num(x.oiUsd))
    .sort((a, b) => num(b.oiUsd) - num(a.oiUsd)).slice(0, TOP_N);
  const rows = [];
  for (const x of list) {
    try {
      const j = await jget(`https://www.okx.com/api/v5/rubik/stat/contracts/long-short-account-ratio-contract?instId=${x.instId}&period=5m`);
      const d = (j.data || [])[0];               /* [[ts, ratio], …] — o mais recente primeiro */
      const long = d ? shareFromRatio(num(d[1])) : null;
      if (long != null) rows.push({ coin: canon(x.instId), sym: x.instId, oi: num(x.oiUsd), long });
    } catch (e) {}
    await sleep(PACE);
  }
  return [{ name: "OKX", family: "accounts", kind: "all accounts", rows }];
}

async function bitget() {
  const t = await jget("https://api.bitget.com/api/v2/mix/market/tickers?productType=USDT-FUTURES");
  const list = (t.data || []).map(x => {
    const px = num(x.lastPr), hold = num(x.holdingAmount);
    return { sym: x.symbol, oi: px && hold ? px * hold : null };
  }).filter(x => x.oi).sort((a, b) => b.oi - a.oi).slice(0, TOP_N);
  const rows = [];
  for (const x of list) {
    try {
      const j = await jget(`https://api.bitget.com/api/v2/mix/market/account-long-short?symbol=${x.sym}&period=5m&productType=USDT-FUTURES`);
      const d = (j.data || [])[(j.data || []).length - 1];
      const long = d ? num(d.longAccountRatio) : null;
      if (long != null) rows.push({ coin: canon(x.sym), sym: x.sym, oi: x.oi, long });
    } catch (e) {}
    await sleep(PACE);
  }
  return [{ name: "Bitget", family: "accounts", kind: "all accounts", rows }];
}

async function htx() {
  const t = await jget("https://api.hbdm.com/linear-swap-api/v1/swap_open_interest");
  const list = (t.data || [])
    .filter(x => x.contract_type === "swap" && /USDT$/.test(String(x.contract_code).replace("-", "")) && num(x.value))
    .sort((a, b) => num(b.value) - num(a.value)).slice(0, TOP_N);
  const rows = [];
  for (const x of list) {
    try {
      const j = await jget(`https://api.hbdm.com/linear-swap-api/v1/swap_elite_account_ratio?contract_code=${x.contract_code}&period=5min`);
      const L = ((j.data || {}).list || []);
      const d = L[L.length - 1];
      /* buy + sell + locked = 1; quem está travado (hedge) não tem lado, por isso normaliza-se
         sobre buy+sell em vez de se inventar para onde ele está */
      const b = d ? num(d.buy_ratio) : null, s = d ? num(d.sell_ratio) : null;
      const long = b != null && s != null && b + s > 0 ? b / (b + s) : null;
      if (long != null) rows.push({ coin: canon(x.contract_code), sym: x.contract_code, oi: num(x.value), long });
    } catch (e) {}
    await sleep(PACE);
  }
  return [{ name: "HTX", family: "position", kind: "elite traders", rows }];
}

async function gate() {
  const [contracts, tickers] = await Promise.all([
    jget("https://api.gateio.ws/api/v4/futures/usdt/contracts"),
    jget("https://api.gateio.ws/api/v4/futures/usdt/tickers")
  ]);
  const mult = new Map((Array.isArray(contracts) ? contracts : []).map(c => [c.name, num(c.quanto_multiplier) || 0]));
  const list = (Array.isArray(tickers) ? tickers : []).map(x => {
    const m = mult.get(x.contract), size = num(x.total_size), px = num(x.mark_price);
    return { sym: x.contract, oi: m && size && px ? size * m * px : null };
  }).filter(x => x.oi).sort((a, b) => b.oi - a.oi).slice(0, TOP_N);
  const acc = [], pos = [];
  for (const x of list) {
    try {
      const j = await jget(`https://api.gateio.ws/api/v4/futures/usdt/contract_stats?contract=${x.sym}&limit=1`);
      const d = Array.isArray(j) ? j[j.length - 1] : null;
      if (d) {
        const a = shareFromRatio(num(d.lsr_account));
        if (a != null) acc.push({ coin: canon(x.sym), sym: x.sym, oi: x.oi, long: a });
        const tl = num(d.top_long_size), ts = num(d.top_short_size);
        if (tl != null && ts != null && tl + ts > 0) pos.push({ coin: canon(x.sym), sym: x.sym, oi: x.oi, long: tl / (tl + ts) });
      }
    } catch (e) {}
    await sleep(PACE);
  }
  return [
    { name: "Gate.io", family: "accounts", kind: "all accounts", rows: acc },
    { name: "Gate.io", family: "position", kind: "top traders by size", rows: pos }
  ];
}

/* ---------------------------------------------------------------- agregar */
const VENUES = [
  ["Binance", binance], ["Bybit", bybit], ["OKX", okx],
  ["Bitget", bitget], ["HTX", htx], ["Gate.io", gate]
];

const series = [], failed = [];
for (const [name, fn] of VENUES) {
  try {
    const got = await fn();
    for (const s of got) {
      if (s.rows.length) series.push(s);
      else failed.push(name + " (" + s.kind + "): sem linhas legíveis");
    }
    console.log(name + ": " + got.map(s => s.kind + "=" + s.rows.length).join(", "));
  } catch (e) { failed.push(name + ": " + e.message); console.log(name + " FALHOU: " + e.message); }
}

function agg(rows) {
  let w = 0, wl = 0;
  for (const r of rows) { if (r.oi > 0 && r.long != null) { w += r.oi; wl += r.long * r.oi; } }
  return w > 0 ? { long: +(wl / w * 100).toFixed(1), oi: Math.round(w), n: rows.length } : null;
}
const byFamily = f => series.filter(s => s.family === f).flatMap(s => s.rows);
const accounts = agg(byFamily("accounts"));
const position = agg(byFamily("position"));

/* por moeda, juntando todas as bolsas (família contas) — para se ver onde a multidão está mais esticada */
const perCoin = {};
for (const s of series) {
  if (s.family !== "accounts") continue;
  for (const r of s.rows) {
    const c = perCoin[r.coin] || (perCoin[r.coin] = { coin: r.coin, w: 0, wl: 0, venues: 0 });
    c.w += r.oi; c.wl += r.long * r.oi; c.venues++;
  }
}
const coins = Object.values(perCoin).filter(c => c.w > 0)
  .map(c => ({ coin: c.coin, long: +(c.wl / c.w * 100).toFixed(1), oi: Math.round(c.w), venues: c.venues }))
  .sort((a, b) => b.oi - a.oi).slice(0, 30);

const doc = {
  t: Date.now(), v: 2,
  method: "open-interest-weighted mean of public exchange positioning; venues or pairs that fail are excluded, never estimated",
  accounts, position,
  venues: series.map(s => {
    const a = agg(s.rows);
    return { name: s.name, family: s.family, kind: s.kind, pairs: s.rows.length, long: a ? a.long : null, oi: a ? a.oi : 0 };
  }),
  failed,
  coins
};

fs.mkdirSync("data", { recursive: true });
fs.writeFileSync(OUT_F, JSON.stringify(doc));
if (CF.acc && CF.tok && CF.ns) {
  const body = JSON.stringify(doc);
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF.acc}/storage/kv/namespaces/${CF.ns}/values/market-ls.json`,
    { method: "PUT", headers: { Authorization: "Bearer " + CF.tok }, body });
  console.log("kv put market-ls.json: HTTP " + r.status + " (" + body.length + " bytes)");
}
console.log("\ncontas: " + (accounts ? accounts.long + "% long · " + accounts.n + " pares · $" + (accounts.oi / 1e9).toFixed(1) + "B OI" : "—"));
console.log("posição: " + (position ? position.long + "% long · " + position.n + " pares · $" + (position.oi / 1e9).toFixed(1) + "B OI" : "—"));
for (const v of doc.venues) console.log("  " + v.name + " (" + v.kind + "): " + v.long + "% long · " + v.pairs + " pares · $" + (v.oi / 1e9).toFixed(2) + "B");
if (failed.length) console.log("fora: " + failed.join(" | "));
process.exit(0);
