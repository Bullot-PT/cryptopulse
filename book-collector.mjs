/* book-collector.mjs — snapshots do orderbook agregado (Binance spot+perp + OKX + Hyperliquid + Bybit)
   para o heatmap de liquidez (v129-vps: modo daemon p/ systemd na VPS + fonte BNP via fapi + SQLite local opcional; v128: Frames de 10 em 10 minutos, guardados no Workers KV:
     book-live.json           — janela rolante de 48h (o que a página lê por defeito)
     book-arch-YYYYMMDD.json  — arquivo do dia anterior, escrito uma vez por dia
   REGRAS: só dados reais — uma exchange que falhe fica FORA do frame e o frame diz quais
   entraram (src). Sem estimativas, sem interpolação. Bins ABSOLUTOS por preço (step fixo por
   moeda) para as colunas do heatmap alinharem entre frames. Valores em USD, arredondados. */

/* steps afinados ao alcance REAL dos books (medido no 1º frame, 26-jul: os ~400 níveis do
   REST cobrem só ~±0,3-3% do preço — o heatmap é a fita de liquidez perto do preço, como no
   TapeSurf; steps grossos esmagavam o BTC em 2 colunas). */
const COINS = {
  BTC:  { step: 5,    bn: "BTCUSDT",  ok: "BTC-USDT-SWAP",  by: "BTCUSDT",  hl: "BTC" },
  ETH:  { step: 0.2,  bn: "ETHUSDT",  ok: "ETH-USDT-SWAP",  by: "ETHUSDT",  hl: "ETH" },
  SOL:  { step: 0.05, bn: "SOLUSDT",  ok: "SOL-USDT-SWAP",  by: "SOLUSDT",  hl: "SOL" },
  HYPE: { step: 0.02, bn: "HYPEUSDT", ok: "HYPE-USDT-SWAP", by: "HYPEUSDT", hl: "HYPE" }
};
const LIVE_KEY = "book-live.json";
const WINDOW_MS = 48 * 3600_000;
/* book-fine.json: frames AO MINUTO das últimas 4h — é o que faz o heatmap ficar quase
   contínuo mesmo com o PC dele desligado (pedido 26-jul). ~1.35KB/frame ⇒ doc ≈ 1.3MB.
   O book-live.json continua igual (10 min, 48h) e o arquivo diário também. */
const FINE_KEY = "book-fine.json";
const FINE_MS = 4 * 3600_000;

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

/* ---------- v129-vps: SQLite local (história longa para backtests, 14-ago) ----------
   Só activa com BOOK_DB definido E better-sqlite3 instalado (na VPS). Nos runners GitHub
   (standby) nada disto corre — zero dependências novas lá. Zero escritas KV extra. */
let db = null, dbIns = null;
if (process.env.BOOK_DB) {
  try {
    const mod = await import("better-sqlite3");
    db = new mod.default(process.env.BOOK_DB);
    db.pragma("journal_mode = WAL");
    db.exec("CREATE TABLE IF NOT EXISTS book_frames (coin TEXT NOT NULL, t INTEGER NOT NULL, step REAL, px REAL, src TEXT, b TEXT, a TEXT, PRIMARY KEY (coin, t))");
    dbIns = db.prepare("INSERT OR REPLACE INTO book_frames (coin,t,step,px,src,b,a) VALUES (?,?,?,?,?,?,?)");
    console.log("sqlite activo: " + process.env.BOOK_DB);
  } catch (e) { console.log("sqlite indisponível (" + e.message + ") — sigo só com KV"); db = null; }
}
function dbSave(coin, cfg, f) {
  if (!dbIns || !f) return;
  try { dbIns.run(coin, f.t, cfg.step, f.px, f.src.join("+"), JSON.stringify(f.b), JSON.stringify(f.a)); }
  catch (e) { console.log("sqlite insert falhou: " + e.message); }
}

/* devolve [[px, usd], ...] dos dois lados, ou null se a fonte falhou */
async function srcBinance(sym) {
  /* os runners do GitHub (IPs EUA) levam 451 da fapi. A própria Binance publica um endpoint
     público de market data SEM geo-block — data-api.binance.vision (book do SPOT, o mercado
     mais líquido; é o que o TapeSurf usa). Fallback para a fapi caso o vision falhe. */
  const mk = j => ({ bids: j.bids.map(x => [+x[0], +x[0] * +x[1]]), asks: j.asks.map(x => [+x[0], +x[0] * +x[1]]) });
  try {
    return mk(await jfetch("https://data-api.binance.vision/api/v3/depth?symbol=" + sym + "&limit=500"));
  } catch (e) {
    return mk(await jfetch("https://fapi.binance.com/fapi/v1/depth?symbol=" + sym + "&limit=500"));
  }
}
async function srcBinancePerp(sym) {
  /* v129-vps: na VPS (IP europeu) a fapi responde — book do PERP, onde vive o fluxo forçado.
     Nos runners GitHub continua 451 e a fonte fica simplesmente FORA do frame (src diz quem entrou). */
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
    body: JSON.stringify({ type: "l2Book", coin, nSigFigs: 5 })
  });
  const lv = j.levels; if (!lv) throw new Error("hl vazio");
  return { bids: lv[0].map(x => [+x.px, +x.px * +x.sz]), asks: lv[1].map(x => [+x.px, +x.px * +x.sz]) };
}

async function frameFor(coin, cfg) {
  const out = { t: Date.now(), b: {}, a: {}, src: [] };
  const srcs = [
    ["BN", () => srcBinance(cfg.bn)],
    ["BNP", () => srcBinancePerp(cfg.bn)],
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

async function pass(grid10) {
  /* frames buscados UMA vez por passe e usados nos dois docs */
  const frames = {};
  for (const [coin, cfg] of Object.entries(COINS)) {
    const f = await frameFor(coin, cfg);
    frames[coin] = f;
    dbSave(coin, cfg, f);
    if (f) console.log(coin + ": frame ok (" + f.src.join("+") + ", px " + f.px + ", " +
      Object.keys(f.b).length + "b/" + Object.keys(f.a).length + "a bins)" + (grid10 ? " [10m]" : ""));
  }

  /* FINO — todos os passes (grelha de 1 min), janela rolante de 4h */
  const fine = await kvGet(FINE_KEY);
  if (fine !== undefined) {
    const fdoc = fine && fine.v === 1 ? fine : { v: 1, step: {}, coins: {} };
    const nowF = Date.now();
    for (const [coin, cfg] of Object.entries(COINS)) {
      if (fdoc.step[coin] !== undefined && fdoc.step[coin] !== cfg.step) fdoc.coins[coin] = [];
      fdoc.step[coin] = cfg.step; fdoc.coins[coin] = fdoc.coins[coin] || [];
      if (frames[coin]) fdoc.coins[coin].push(frames[coin]);
      fdoc.coins[coin] = fdoc.coins[coin].filter(x => x.t > nowF - FINE_MS);
    }
    fdoc.t = nowF;
    await kvPut(FINE_KEY, fdoc);
  } else console.log("KV fine ilegível — salto o doc fino neste passe");

  /* GROSSO (48h @10 min) + arquivo diário — só nos passes da grelha de 10 min, como sempre */
  if (!grid10) return;
  const live = await kvGet(LIVE_KEY);
  if (live === undefined) { console.log("KV ilegível — salto esta passagem para não esmagar dados"); return; }
  const doc = live && live.v === 1 ? live : { v: 1, step: {}, coins: {} };
  Object.entries(COINS).forEach(([c, cfg]) => {
    /* mudança de step invalida os bins antigos (idx é preço/step) — recomeça essa moeda em vez
       de misturar escalas. Só dói nas primeiras horas de vida do coletor. */
    if (doc.step[c] !== undefined && doc.step[c] !== cfg.step) doc.coins[c] = [];
    doc.step[c] = cfg.step; doc.coins[c] = doc.coins[c] || [];
  });

  const now = Date.now();
  for (const [coin, cfg] of Object.entries(COINS)) {
    const f = frames[coin];
    if (f) doc.coins[coin].push(f);
    /* arquivar o dia que fechou ANTES de aparar a janela — senão perdem-se frames */
    const gone = doc.coins[coin].filter(x => x.t <= now - WINDOW_MS);
    doc.coins[coin] = doc.coins[coin].filter(x => x.t > now - WINDOW_MS);
    if (gone.length) {
      const byDay = {};
      gone.forEach(x => { (byDay[utcDay(x.t)] = byDay[utcDay(x.t)] || []).push(x); });
      for (const [day, frames2] of Object.entries(byDay)) {
        const key = "book-arch-" + day + ".json";
        const arch = await kvGet(key);
        if (arch === undefined) continue;         /* KV com soluços: tenta na próxima janela */
        const adoc = arch && arch.v === 1 ? arch : { v: 1, step: {}, coins: {} };
        adoc.step[coin] = cfg.step;
        (adoc.coins[coin] = adoc.coins[coin] || []).push(...frames2);
        await kvPut(key, adoc);
      }
    }
  }
  doc.t = now;
  await kvPut(LIVE_KEY, doc);
}

const mode = process.argv[2] || "loop";
if (mode === "once") {
  await pass(true);
} else if (mode === "daemon") {
  /* v129-vps: serviço systemd — corre para sempre, alinhado à grelha de 1 min; o systemd
     reinicia se rebentar (Restart=always). */
  for (;;) {
    const minute = Math.round(Date.now() / 60_000);
    try { await pass(minute % 10 === 0); } catch (e) { console.error("passagem rebentou: " + (e && e.message)); }
    const gap = 60_000 - (Date.now() % 60_000);
    await new Promise(r => setTimeout(r, gap));
  }
} else {
  const END = Date.now() + 55 * 60_000;
  while (Date.now() < END) {
    const minute = Math.round(Date.now() / 60_000);
    try { await pass(minute % 10 === 0); } catch (e) { console.error("passagem rebentou: " + (e && e.message)); }
    const now = Date.now();
    if (now >= END) break;
    const gap = 60_000 - (now % 60_000);          /* grelha de 1 min alinhada à época */
    await new Promise(r => setTimeout(r, Math.min(gap, END - now)));
  }
}
console.log("fim");
