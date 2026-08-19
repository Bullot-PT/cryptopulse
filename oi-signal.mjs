/* oi-signal.mjs — ESTÁGIO 2: o sinal ao vivo, na VPS, com direcção e alvo dimensionado.
   Corre a cada 5 min (grelha alinhada) dentro do oi-signal-daemon.sh.

   O que faz, por ordem:
     1. lê o OI 5m das últimas horas para cada moeda do universo
     2. detecta bursts: |ΔOI 15m| ≥ 3.5% (🟡 WATCH) / ≥ 5% (🔴 TRIGGER), com chão de OI
     3. classifica o evento no MESMO bucket do estudo (sinal do ΔOI × tendência prévia × tier × tamanho)
     4. só ARMA os buckets que o backtest mostrou terem vantagem a sério — os outros ficam a zero,
        não se manda nada só para haver alerta
     5. dimensiona alvo e stop em múltiplos de ATR (não 1% fixo) e RECUSA o sinal se o alvo ficar
        abaixo de MIN_TGT — pedido dele: "preciso de mais % nas trades, especialmente porque vou usar
        lev". Numa moeda parada, 2×ATR pode dar 0.7%: isso não é trade para ele, é ruído. Fica de fora.
     6. manda Telegram com LONG/SHORT explícito, probabilidade, amostra, alvo e stop em % e em preço
     7. escreve data/oi-signals.json (o site lê para o crachá do Reversal)

   Nada disto é conselho financeiro — é a leitura estatística de um padrão, com a amostra à vista.
   Fontes: Binance fapi (OI + klines). Sem dados = sem sinal; não se estima nada. */
import fs from "fs";

const TG = { tok: process.env.TELEGRAM_TOKEN, chat: process.env.TELEGRAM_CHAT };
const CF = { acc: process.env.CF_ACCOUNT_ID, tok: process.env.CF_API_TOKEN, ns: process.env.CF_KV_NAMESPACE_ID };
const SITE = "https://cryptomacho.io";
const STATE_F = "data/oi-signal-state.json";
const OUT_F = "data/oi-signals.json";

const UNIVERSE = ["BTC","ETH","SOL","XRP","DOGE","BNB","ADA","AVAX","LINK","LTC","SUI","NEAR","ARB","OP","APT","UNI","AAVE","ENA","TAO","WLD","PEPE","SHIB","BONK","FLOKI","JTO","LDO","ONDO","TRX","XLM","FET","VIRTUAL","PENDLE","CRV","ZRO","KAITO","TRUMP","PUMP","WLFI","HYPE","ZEC"];
const bnSym = c => (["PEPE","SHIB","BONK","FLOKI"].includes(c) ? "1000" + c : c) + "USDT";

const BAR = 300_000, PREV_MS = 2 * 3600_000, ATR_N = 288;
const OI_FLOOR = 2e7;              /* $20M — o chão que o backtest mostrou ser melhor nas alts */
const RED = 0.05, YELLOW = 0.035;
const COOLDOWN_MS = 2 * 3600_000;  /* um alerta por moeda de 2 em 2h — o detector já exige 1h entre eventos */
/* Exigência dele: "preciso de mais % nas trades, especialmente porque vou usar lev".
   Compara-se com a EXCURSÃO TÍPICA a 12h desta moeda (medida), não com o alvo de 5 minutos. */
const MIN_MOVE = 0.02;
const DEFAULT_K = { tgt: 4, stop: 2, horizonH: 6, mfeK: null, reach: null };

/* Buckets ARMADOS. Vindos do estudo de probabilidade (2276 eventos, 14 meses): só um perfil tem
   vantagem real fora do acaso. Os amarelos ficam DESARMADOS — dão 50-53%, ou seja, moeda ao ar —
   e por isso só entram no ficheiro do site como aviso, nunca em Telegram como trade. */
const ARMED = {
  "OIup|trUp|red": { p: 58.2, n: 208, note: "OI a subir com o preço já a subir — continuação" }
};

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function jget(url, tries = 3) {
  for (let a = 0; a < tries; a++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (r.status === 429) { await sleep(2500 * (a + 1)); continue; }
      if (!r.ok) throw new Error("HTTP " + r.status);
      return await r.json();
    } catch (e) { if (a === tries - 1) throw e; await sleep(900 * (a + 1)); }
  }
}
function readJson(f, fb) { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch (e) { return fb; } }
function atrPct(kl) {
  const i0 = kl.length - 1;
  let sum = 0, n = 0;
  for (let i = Math.max(1, i0 - ATR_N + 1); i <= i0; i++) {
    const tr = Math.max(kl[i][1] - kl[i][2], Math.abs(kl[i][1] - kl[i - 1][3]), Math.abs(kl[i][2] - kl[i - 1][3]));
    sum += tr; n++;
  }
  return n ? (sum / n) / kl[i0][3] : null;
}
/* casas decimais suficientes para o preço não aparecer arredondado a zero numa memecoin */
const fmtPx = p => p >= 1000 ? p.toFixed(1) : p >= 1 ? p.toFixed(3) : p.toPrecision(4);
const fmtUsd = v => v >= 1e9 ? "$" + (v / 1e9).toFixed(2) + "B" : v >= 1e6 ? "$" + (v / 1e6).toFixed(1) + "M" : "$" + Math.round(v / 1e3) + "k";
/* hora como ele pediu: dia/mês e London (UTC+1 no verão) com o UTC entre parênteses */
function stamp(t) {
  const d = new Date(t);
  const lon = new Date(t + 3600_000);
  const p = x => String(x).padStart(2, "0");
  return p(lon.getUTCDate()) + "/" + p(lon.getUTCMonth() + 1) + " " + p(lon.getUTCHours()) + ":" + p(lon.getUTCMinutes()) +
    " UTC+1 (" + p(d.getUTCHours()) + ":" + p(d.getUTCMinutes()) + "Z)";
}

/* multiplicadores: usa o que o estudo de alvos escolheu, se já existir no KV; senão o defeito */
async function loadK() {
  try {
    const j = await jget(SITE + "/data/oi-target.json?b=" + Math.floor(Date.now() / 600_000), 1);
    const b = j && j.buckets && (j.buckets["OIup|trUp|red|20M"] || j.buckets["OIup|trUp|red"]);
    if (b && b.best && b.best.combo) {
      const m = b.best.combo.match(/^(\d+)h\|([\d.]+)atr\|([\d.]+)atr$/);
      if (m) {
        const h12 = (b.H && (b.H["12"] || b.H[12])) || null;
        const h24 = (b.H && (b.H["24"] || b.H[24])) || null;
        return {
          tgt: +m[2], stop: +m[3], horizonH: +m[1],
          /* quantos ATR de 5m vale a excursão mediana a 12h, medido neste mesmo bucket */
          mfeK: (h12 && b.atrMed > 0) ? +(h12.mfeMed / b.atrMed).toFixed(2) : null,
          reach: h24 ? { p2: h24.pct2, p3: h24.pct3, p5: h24.pct5, p8: h24.pct8, med: h24.mfeMed } : null,
          n: b.best.n,
          src: "oi-target.json (" + b.best.wr + "% acerto, " + b.best.netMaker + "%/trade líquido maker, n=" + b.best.n + ")"
        };
      }
    }
  } catch (e) {}
  return { ...DEFAULT_K, src: "defeito (o estudo de alvos ainda não publicou)" };
}

async function coinData(coin) {
  const sym = bnSym(coin);
  const now = Date.now();
  const oi = await jget(`https://fapi.binance.com/futures/data/openInterestHist?symbol=${sym}&period=5m&limit=30`);
  if (!Array.isArray(oi) || oi.length < 5) return null;
  const kl = (await jget(`https://fapi.binance.com/fapi/v1/klines?symbol=${sym}&interval=5m&limit=500`))
    .map(x => [x[0], +x[2], +x[3], +x[4]]);
  if (kl.length < 40) return null;
  const last = oi[oi.length - 1], back = oi[oi.length - 4];      /* 3 barras = 15 min */
  const v1 = +last.sumOpenInterestValue, v0 = +back.sumOpenInterestValue;
  if (!(v0 > 0) || !(v1 > 0)) return null;
  if (last.timestamp - back.timestamp > 20 * 60_000) return null;
  if (now - last.timestamp > 15 * 60_000) return null;           /* dados velhos = sem sinal */
  const ch = (v1 - v0) / v0;
  const px = kl[kl.length - 1][3];
  const iPrev = kl.length - 1 - Math.round(PREV_MS / BAR);
  if (iPrev < 1) return null;
  const trend = Math.sign((px - kl[iPrev][3]) || 1);
  return { coin, sym, t: last.timestamp, ch, oi: v1, px, trend, atr: atrPct(kl) };
}

async function main() {
  const K = await loadK();
  const state = readJson(STATE_F, { sent: {} });
  const now = Date.now();
  const rows = [], fired = [];

  for (const c of UNIVERSE) {
    let d = null;
    try { d = await coinData(c); } catch (e) { }
    await sleep(150);
    if (!d || !d.atr) continue;
    const a = Math.abs(d.ch);
    if (a < YELLOW) continue;
    const tier = a >= RED ? "red" : "yellow";
    const key = (d.ch > 0 ? "OIup" : "OIdn") + "|" + (d.trend > 0 ? "trUp" : "trDn") + "|" + tier;
    const armed = ARMED[key];
    const dir = d.trend > 0 ? 1 : -1;                 /* regra cont, validada fora de amostra */
    const tgtPct = K.tgt * d.atr, stopPct = K.stop * d.atr;
    /* excursão típica desta moeda a 12h para este perfil = ATR dela × factor medido no backtest */
    const expMove = K.mfeK ? K.mfeK * d.atr : null;
    const row = {
      coin: c, t: d.t, tier, key, dOI: +(d.ch * 100).toFixed(2), oi: Math.round(d.oi),
      px: d.px, atr: +(d.atr * 100).toFixed(2), dir: dir > 0 ? "LONG" : "SHORT",
      tgtPct: +(tgtPct * 100).toFixed(2), stopPct: +(stopPct * 100).toFixed(2),
      expMove: expMove != null ? +(expMove * 100).toFixed(2) : null,
      tgtPx: dir > 0 ? d.px * (1 + tgtPct) : d.px * (1 - tgtPct),
      stopPx: dir > 0 ? d.px * (1 - stopPct) : d.px * (1 + stopPct),
      armed: !!armed, p: armed ? armed.p : null, n: armed ? armed.n : null,
      skip: null
    };
    /* razões para NÃO mandar — ditas em voz alta no ficheiro, para se ver o que foi filtrado */
    if (!armed) row.skip = "bucket sem vantagem no backtest";
    else if (d.oi < OI_FLOOR) row.skip = "OI abaixo de " + fmtUsd(OI_FLOOR);
    else if (expMove != null && expMove < MIN_MOVE) row.skip = "movimento típico " + row.expMove + "% abaixo do mínimo de " + (MIN_MOVE * 100) + "%";
    else if (state.sent[c] && now - state.sent[c] < COOLDOWN_MS) row.skip = "em arrefecimento";
    rows.push(row);
    if (!row.skip) fired.push(row);
  }

  /* --- Telegram --- */
  for (const r of fired) {
    /* o nome importa: o bucket armado é de CONTINUAÇÃO (OI a subir com o preço já a subir),
       não de reversão. Chamar-lhe "early reversal" seria mentir sobre o que o sinal é. */
    const msg =
      "🔴 OI BURST · " + r.dir + " " + r.coin + " (continuation)\n" +
      "OI " + (r.dOI > 0 ? "+" : "") + r.dOI + "% em 15 min · OI total " + fmtUsd(r.oi) + "\n" +
      "Probability " + r.p + "% (n=" + r.n + ", 14 months) — not a certainty\n" +
      "Entry " + fmtPx(r.px) + " · target " + fmtPx(r.tgtPx) + " (+" + r.tgtPct + "%) · stop " + fmtPx(r.stopPx) + " (−" + r.stopPct + "%)\n" +
      "Sizing: " + K.tgt + "×ATR / " + K.stop + "×ATR · ATR " + r.atr + "% · horizon " + K.horizonH + "h\n" +
      (r.expMove != null ? "Typical run for this profile: " + r.expMove + "% within 12h" +
        (K.reach ? " · of past cases " + K.reach.p3 + "% reached +3% and " + K.reach.p5 + "% reached +5% within 24h" : "") + "\n" : "") +
      "Use limit orders — at taker fees this edge is gone.\n" +
      stamp(r.t) + " · " + SITE + "/reversal.html\n" +
      "Not financial advice.";
    if (TG.tok && TG.chat) {
      try {
        const res = await fetch("https://api.telegram.org/bot" + TG.tok + "/sendMessage", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ chat_id: TG.chat, text: msg, disable_web_page_preview: true })
        });
        console.log("telegram " + r.coin + ": HTTP " + res.status);
        if (res.ok) state.sent[r.coin] = now;
      } catch (e) { console.log("telegram " + r.coin + " falhou: " + e.message); }
    } else {
      console.log("(sem TELEGRAM_TOKEN/CHAT — não enviado)\n" + msg);
      state.sent[r.coin] = now;
    }
  }

  /* --- v2 (18-ago-2026): REGISTO PERSISTENTE DOS SINAIS ---
     Até hoje este daemon não guardava nada: o oi-signal-state.json só tem o arrefecimento e nem
     está no repo. Ou seja, o sinal corria há semanas sem deixar registo nenhum — e sem registo
     forward não há maneira de julgar a estratégia (Playbook §10). Guarda-se toda a fila vermelha,
     enviada ou saltada, com preço de entrada, alvo e stop. O resultado calcula-se depois a partir
     das klines (que a Binance serve com anos de profundidade); o que não se pode recuperar mais
     tarde é o momento e o preço em que o sinal existiu — é isso que fica aqui. */
  try {
    const LOG_F = "data/oi-signal-log.json";
    const keep = 45 * 86400_000;
    let log = readJson(LOG_F, { v: 1, rows: [] });
    if (!Array.isArray(log.rows)) log = { v: 1, rows: [] };
    for (const r of rows) {
      if (r.tier !== "red" && !r.armed) continue;         /* amarelos desarmados não interessam */
      log.rows.push({ t: r.t, coin: r.coin, key: r.key, tier: r.tier, dOI: r.dOI, oi: r.oi,
        px: r.px, atr: r.atr, dir: r.dir, tgtPct: r.tgtPct, stopPct: r.stopPct,
        tgtPx: r.tgtPx, stopPx: r.stopPx, armed: r.armed, sent: !r.skip, skip: r.skip,
        k: { tgt: K.tgt, stop: K.stop, horizonH: K.horizonH } });
    }
    const cut = now - keep;
    log.rows = log.rows.filter(x => x.t > cut).slice(-20000);
    log.t = now;
    fs.writeFileSync(LOG_F, JSON.stringify(log));
    console.log("registo: " + log.rows.length + " sinais guardados em " + LOG_F);
  } catch (e) { console.log("registo de sinais falhou: " + e.message); }

  /* --- ficheiro para o site --- */
  rows.sort((a, b) => Math.abs(b.dOI) - Math.abs(a.dOI));
  const doc = {
    t: now, v: 1,
    params: { floor: OI_FLOOR, red: RED, yellow: YELLOW, minMove: MIN_MOVE, k: K, cooldownH: COOLDOWN_MS / 3600_000 },
    armedBuckets: Object.keys(ARMED),
    fired: fired.map(r => r.coin),
    rows: rows.slice(0, 40)
  };
  fs.mkdirSync("data", { recursive: true });
  fs.writeFileSync(OUT_F, JSON.stringify(doc));
  fs.writeFileSync(STATE_F, JSON.stringify(state));
  if (CF.acc && CF.tok && CF.ns) {
    const logBody = (() => { try { return fs.readFileSync("data/oi-signal-log.json", "utf8"); } catch (e) { return null; } })();
    for (const [k, body] of [["oi-signals.json", JSON.stringify(doc)]].concat(logBody ? [["oi-signal-log.json", logBody]] : [])) {
      const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF.acc}/storage/kv/namespaces/${CF.ns}/values/${k}`,
        { method: "PUT", headers: { Authorization: "Bearer " + CF.tok }, body });
      console.log("kv put " + k + ": HTTP " + r.status);
    }
  }
  console.log("passagem: " + rows.length + " bursts · " + fired.length + " enviados · alvos " + K.tgt + "×ATR (" + K.src + ")");
  for (const r of rows.slice(0, 8)) console.log("  " + r.coin + " " + r.tier + " " + r.dOI + "% " + r.dir + " alvo " + r.tgtPct + "% · típico " + r.expMove + "% " + (r.skip ? "— salto: " + r.skip : "— ENVIADO"));
}
await main();
process.exit(0);
