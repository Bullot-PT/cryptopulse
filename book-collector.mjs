/* book-collector.mjs — snapshots do orderbook agregado (Binance + OKX + Hyperliquid + Bybit)
   para o heatmap de liquidez (v128). Frames de 10 em 10 minutos, guardados no Workers KV:
     book-live.json           — janela rolante de 48h (o que a página lê por defeito)
     book-arch-YYYYMMDD.json  — arquivo do dia anterior, escrito uma vez por dia
   REGRAS: só dados reais — uma exchange que falhe fica FORA do frame e o frame diz quais
   entraram (src). Sem estimativas, sem interpolação. Bins ABSOLUTOS por preço (step fixo por
   moeda) para as colunas do heatmap alinharem entre frames. Valores em USD, arredondados. */

const COINS = {
  BTC:  { step: 50,   bn: "BTCUSDT",  ok: "BTC-USDT-SWAP",  by: "BTCUSDT",  hl: "BTC" },
  ETH:  { step: 2,    bn: "ETHUSDT",  ok: "ETH-USDT-SWAP",  by: "ETHUSDT",  hl: "ETH" },
  SOL:  { step: 0.1,  bn: "SOLUSDT",  ok: "SOL-USDT-SWAP",  by: "SOLUSDT",  hl: "SOL" },
  HYPE: { step: 0.05, bn: "HYPEUSDT", ok: "HYPE-USDT-SWAP", by: "HYPEUSDT", hl: "HYPE" }
};
const LIVE_KEY = "book-live.json";
const WINDOW_MS = 48 * 3600_000;

const ACC = process.env.CF_ACCOUNT_ID, TOK = process.env.CF_API_TOKEN, NS = process.env.CF_KV_NAMESPACE_ID;
if (!ACC || !TOK || !NS) { console.error("faltam secrets CF_*"); process.exit(1); }
const KV = "https://api.cloudflare.com/client/v4/accounts/" + ACC + "/storage/kv/namespaces/" + NS + "/values/";

async function jfetch(url, opts, timeoutMs) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs || 15000);
  try {
    const r = await fetch(url, Object.assign({}, opts, { signal: ctl.signal }));
    if (!r.ok) throw new Error("HTTP " + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}
async function kvGet(key) {
  try {
    const r = await fetch(KV + key, { headers: { Authorization: "Bearer " + TOK } });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error("kv get HTTP " + r.status);
    return await r.json();
  } catch (e) { console.error("kv get " + key + ": " + e.message); return undefined; } /* undefined = erro, null = não existe */
}
async function kvPut(key, obj) {
  const body = JSON.stringify(obj);
  const r = await fetch(KV + key, { method: "PUT", headers: { Authorization: "Bearer " + TOK }, body });
  console.log("kv put " + key + ": HTTP " + r.status + " (" + body.length + " bytes)");
  return r.ok;
}

/* devolve [[px, usd], ...] dos dois lados, ou null se a fonte falhou */
async function srcBinance(sym) {
  const j = await jfetch("https://fapi.binance.com/fapi/v1/depth?symbol=" + sym + "&limit=500");
  return { bids: j.bids.map(x => [+x[0], +x[0] * +x[1]]), asks: j.asks.map(x => [+x[0], +x[0] * +x[1]]) };
}
async function srcOkx(inst) {
  const j = await jfetch("https://www.okx.com/api/v5/market/books?instId=" + inst + "&sz=400");
  const d = j.data && j.data[0]; if (!d) throw new Error("okx vazio");
  /* contratos OKX: sz em contratos; ctVal varia por instrumento — usar books com sz*px é ERRADO
     para swaps de contrato. Correcção: /books devolve sz em CONTRATOS; para USDT-swaps lineares
     1 contrato = ctVal moedas. Buscar ctVal uma vez por instrumento. */
  if (!srcOkx.ct) srcOkx.ct = {};
  if (!srcOkx.ct[inst]) {
    const ji = await jfetch("https://www.okx.com/api/v5/public/instruments?instType=SWAP&instId=" + inst);
    srcOkx.ct[inst] = ji.data && ji.data[0] ? +ji.data[0].ctVal : 1;
  }
  const ct = srcOkx.ct[inst] || 1;
  return { bids: d.bids.map(x => [+x[0], +x[0] * +x[1] * ct]), asks: d.asks.map(x => [+x[0], +x[0] * +x[1] * ct]) };
}
async function srcBybit(sym) {
  const j = await jfetch("https://api.bybit.com/v5/market/orderbook?category=linear&symbol=" + sym + "&limit=500", null, 8000);
  const d = j.result; if (!d || !d.b) throw new Error("bybit vazio");
  return { bids: d.b.map(x => [+x[0], +x[0] * +x[1]]), asks: d.a.map(x => [+x[0], +x[0] * +x[1]]) };
}
async function srcHl(coin) {
  const j = await jfetch("https://api.hyperliquid.xyz/info", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "l2Book", coin })
  });
  const lv = j.levels; if (!lv) throw new Error("hl vazio");
  return { bids: lv[0].map(x => [+x.px, +x.px * +x.sz]), asks: lv[1].map(x => [+x.px, +x.px * +x.sz]) };
}

async function frameFor(coin, cfg) {
  const out = { t: Date.now(), b: {}, a: {}, src: [] };
  const srcs = [
    ["BN", () => srcBinance(cfg.bn)],
    ["OKX", () => srcOkx(cfg.ok)],
    ["BY", () => srcBybit(cfg.by)],
    ["HL", () => srcHl(cfg.hl)]
  ];
  let bestBid = 0, bestAsk = Infinity;
  for (const [tag, fn] of srcs) {
    try {
      const bk = await fn();
      if (!bk.bids.length || !bk.asks.length) throw new Error("lado vazio");
      bestBid = Math.max(bestBid, bk.bids[0][0]);
      bestAsk = Math.min(bestAsk, bk.asks[0][0]);
      for (const [px, usd] of bk.bids) {
        const i = Math.round(px / cfg.step);
        out.b[i] = (out.b[i] || 0) + usd;
      }
      for (const [px, usd] of bk.asks) {
        const i = Math.round(px / cfg.step);
        out.a[i] = (out.a[i] || 0) + usd;
      }
      out.src.push(tag);
    } catch (e) { console.log(coin + " " + tag + " falhou: " + e.message); }
  }
  if (!out.src.length) return null;               /* nenhuma fonte = sem frame, sem inventar */
  out.px = isFinite(bestAsk) && bestBid > 0 ? +((bestBid + bestAsk) / 2).toFixed(6) : null;
  for (const k of Object.keys(out.b)) out.b[k] = Math.round(out.b[k]);
  for (const k of Object.keys(out.a)) out.a[k] = Math.round(out.a[k]);
  return out;
}

function utcDay(ts) {
  const d = new Date(ts);
  return d.getUTCFullYear() + String(d.getUTCMonth() + 1).padStart(2, "0") + String(d.getUTCDate()).padStart(2, "0");
}

async function pass() {
  const live = await kvGet(LIVE_KEY);
  if (live === undefined) { console.log("KV ilegível — salto esta passagem para não esmagar dados"); return; }
  const doc = live && live.v === 1 ? live : { v: 1, step: {}, coins: {} };
  Object.entries(COINS).forEach(([c, cfg]) => { doc.step[c] = cfg.step; doc.coins[c] = doc.coins[c] || []; });

  const now = Date.now();
  for (const [coin, cfg] of Object.entries(COINS)) {
    const f = await frameFor(coin, cfg);
    if (f) {
      doc.coins[coin].push(f);
      console.log(coin + ": frame ok (" + f.src.join("+") + ", px " + f.px + ", " +
        Object.keys(f.b).length + "b/" + Object.keys(f.a).length + "a bins)");
    }
    /* arquivar o dia que fechou ANTES de aparar a janela — senão perdem-se frames */
    const gone = doc.coins[coin].filter(x => x.t <= now - WINDOW_MS);
    doc.coins[coin] = doc.coins[coin].filter(x => x.t > now - WINDOW_MS);
    if (gone.length) {
      const byDay = {};
      gone.forEach(x => { (byDay[utcDay(x.t)] = byDay[utcDay(x.t)] || []).push(x); });
      for (const [day, frames] of Object.entries(byDay)) {
        const key = "book-arch-" + day + ".json";
        const arch = await kvGet(key);
        if (arch === undefined) continue;         /* KV com soluços: tenta na próxima janela */
        const adoc = arch && arch.v === 1 ? arch : { v: 1, step: {}, coins: {} };
        adoc.step[coin] = cfg.step;
        (adoc.coins[coin] = adoc.coins[coin] || []).push(...frames);
        await kvPut(key, adoc);
      }
    }
  }
  doc.t = now;
  await kvPut(LIVE_KEY, doc);
}

const mode = process.argv[2] || "loop";
if (mode === "once") {
  await pass();
} else {
  const END = Date.now() + 55 * 60_000;
  while (Date.now() < END) {
    try { await pass(); } catch (e) { console.error("passagem rebentou: " + (e && e.message)); }
    const now = Date.now();
    if (now >= END) break;
    const gap = 600_000 - (now % 600_000);        /* grelha de 10 min alinhada à época */
    await new Promise(r => setTimeout(r, Math.min(gap, END - now)));
  }
}
console.log("fim");
