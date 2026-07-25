/* nansen-collector.mjs — o único sítio do projecto que fala com a Nansen.
 *
 * PORQUÊ ISTO EXISTE
 * O painel das baleias mostra carteiras cruas (0x92ea…50e9). A Nansen sabe o nome de muitas
 * delas. Mas a chave é paga e o repositório é público, por isso a chave NUNCA pode ir para o
 * index.html: ela vive só como secret NANSEN_KEY do GitHub, este colector corre no Actions, e
 * o browser recebe o resultado já cozinhado em data/nansen-*.json.
 *
 * A REGRA DO BULLOT: 2000 créditos por mês, e nada de chamadas repetitivas de 5 em 5 minutos.
 * Daí três modos:
 *
 *   probe   ~5 créditos   valida a chave e mostra o que a Nansen devolve. Corre à mão.
 *   sweep   ~180 créditos varrimento intensivo, uma vez. Semeia a cache de nomes com milhares
 *                         de endereços de uma assentada. É o que ele pediu para fazer antes do
 *                         fim do mês, enquanto os créditos de Julho ainda estão quase intactos.
 *   daily   ~45 créditos  manutenção, uma vez por dia. 45×30 = 1350/mês, sobra folga.
 *
 * A CACHE DE NOMES NUNCA É RECONSULTADA. Um nome que já sabemos custa zero para sempre, por isso
 * a cobertura só cresce mês após mês. Isto é o oposto de pedir a mesma coisa outra vez.
 *
 * A ARMADILHA QUE EVITAMOS: os endpoints dedicados a labels custam 100 (comuns) ou 500 (premium)
 * créditos POR ENDEREÇO. Com 2000/mês dariam para 20 carteiras. Mas o perp-leaderboard e o
 * tgm/perp-positions custam 5 créditos por chamada, devolvem até 1000 linhas cada, e cada linha
 * já traz o nome. É por aí que vamos: os nomes vêm de borla à boleia dos dados de posições.
 *
 * Uso:  NANSEN_KEY=... node nansen-collector.mjs probe|sweep|daily [--dry]
 */

import fs from "fs";
import path from "path";

const MODE = (process.argv[2] || "probe").toLowerCase();
const DRY = process.argv.includes("--dry");
const KEY = process.env.NANSEN_KEY || "";
const BASE = "https://api.nansen.ai/api/v1";
const DIR = "data";

/* ---------------------------------------------------------------- orçamento */

/* O tecto é do plano dele: 2000/mês. A reserva é o que fica intocado para um sweep de
   emergência ou para um probe no fim do mês — o colector recusa-se a gastá-la. */
const CAP = 2000;
const RESERVE = 200;
/* Se UMA chamada custar mais do que isto, alguma coisa está errada (labels premium a 150,
   por exemplo) e é melhor parar o run inteiro do que descobrir no fim do mês. */
const MAX_CALL_COST = 25;

const BUDGET_FILE = path.join(DIR, "nansen-budget.json");
const LABELS_FILE = path.join(DIR, "nansen-labels.json");
const SM_FILE = path.join(DIR, "nansen-sm.json");
const PERPS_FILE = path.join(DIR, "nansen-perps.json");

function readJson(f, fallback) {
  try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return fallback; }
}
function writeJson(f, obj) {
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify(obj));
}

/* O mês é o do relógio UTC do runner. A Nansen conta por mês de calendário, e o dia em que
   o mês vira é o único momento em que este ficheiro se reinicia. */
const nowMonth = () => new Date().toISOString().slice(0, 7);

const budget = readJson(BUDGET_FILE, null) || { v: 1, month: nowMonth(), spent: 0, cap: CAP, runs: [] };
if (budget.month !== nowMonth()) {
  console.log(`mês novo (${budget.month} -> ${nowMonth()}), contador a zero`);
  budget.month = nowMonth();
  budget.spent = 0;
  budget.runs = [];
}
budget.cap = CAP;

const remaining = () => Math.max(0, CAP - RESERVE - budget.spent);

/* ------------------------------------------------------------------ chamada */

/* Limites publicados: 20 pedidos/s e 300/min. 300/min é o apertado — a 500 ms entre pedidos
   ficamos em 120/min, com margem de sobra e sem nunca apanhar um 429. */
const GAP_MS = 500;
let lastCall = 0;
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* Custos da tabela oficial, usados só como estimativa à priori. O valor que conta no
   contador é o que a resposta disser. */
const COST = {
  "/perp-leaderboard": 5,
  "/tgm/perp-positions": 5,
  "/tgm/perp-pnl-leaderboard": 5,
  "/smart-money/netflow": 5,
  "/smart-money/holdings": 5,
};

let creditHeaderName = null;   // descoberto no primeiro pedido
const stats = { calls: 0, rows: 0, errors: [], unbilled: 0 };

/* O /perp-leaderboard exige uma janela de datas — sem ela devolve 422 antes sequer de olhar
   para a chave. Dias em UTC, que é o relógio do runner e o da Nansen.
   A janela curta não é só economia: a tabela de créditos cobra 25 (em vez de 5) às variantes
   "historical", e não vale a pena descobrir da maneira cara onde é que fica essa fronteira. */
const DAY_MS = 86400000;
function dateRange(days) {
  const to = new Date();
  const from = new Date(to.getTime() - days * DAY_MS);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

async function call(endpoint, body) {
  const est = COST[endpoint] || 5;
  if (est > remaining()) {
    throw new Error(`ORCAMENTO: ${endpoint} custa ~${est} e só sobram ${remaining()} créditos este mês`);
  }
  if (DRY) {
    console.log(`  [dry] ${endpoint} ${JSON.stringify(body).slice(0, 120)}`);
    return { data: [], pagination: { is_last_page: true } };
  }

  const wait = GAP_MS - (Date.now() - lastCall);
  if (wait > 0) await sleep(wait);
  lastCall = Date.now();

  let res, txt;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      res = await fetch(BASE + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", apiKey: KEY },
        body: JSON.stringify(body),
      });
      txt = await res.text();
    } catch (e) {
      if (attempt === 3) throw new Error(`${endpoint}: rede falhou — ${e.message}`);
      await sleep(attempt * 2000);
      continue;
    }
    /* 429 é o único código que vale a pena repetir. Um 400 repetido continua a ser um 400
       e cada tentativa arrisca custar créditos. */
    if (res.status === 429 && attempt < 3) { await sleep(attempt * 5000); continue; }
    break;
  }

  /* Quanto é que isto custou mesmo. A Nansen devolve o gasto num header; o nome exacto não
     está documentado, por isso procura-se qualquer header que fale de créditos e fica-se com
     ele. Se não houver nenhum, usa-se a estimativa da tabela — nunca zero, que seria mentir
     ao contador a nosso favor. */
  let used = null;
  for (const [k, v] of res.headers) {
    if (/credit/i.test(k) && /used|consumed|cost/i.test(k)) {
      const n = parseFloat(v);
      if (Number.isFinite(n)) { used = n; creditHeaderName = k; break; }
    }
  }
  if (used == null) {
    for (const [k, v] of res.headers) {
      if (/^x-nansen-credits/i.test(k) && !/remain|left|balance/i.test(k)) {
        const n = parseFloat(v);
        if (Number.isFinite(n)) { used = n; creditHeaderName = k; break; }
      }
    }
  }
  /* Um 4xx é rejeitado na validação, antes de a Nansen ir buscar dados — não é cobrado. Se
     mesmo assim vier um header de créditos, é o header que manda; o que não se faz é somar
     uma estimativa por um pedido mal formado nosso e ficar a dever créditos que ninguém gastou.
     O 429 fica de fora desta regra: esse chegou a bater na porta. */
  const rejected = used == null && !res.ok && res.status >= 400 && res.status < 500 && res.status !== 429;
  const charged = rejected ? 0 : (used == null ? est : used);
  budget.spent += charged;
  if (rejected) stats.unbilled++;
  stats.calls++;

  if (charged > MAX_CALL_COST) {
    throw new Error(`TRAVÃO: ${endpoint} custou ${charged} créditos numa só chamada (tecto ${MAX_CALL_COST}). ` +
      `Isto cheira a labels premium. Run abortado antes de queimar o mês.`);
  }

  if (!res.ok) {
    const msg = `${endpoint} HTTP ${res.status}: ${txt.slice(0, 300)}`;
    stats.errors.push(msg);
    throw new Error(msg);
  }
  let json;
  try { json = JSON.parse(txt); } catch { throw new Error(`${endpoint}: resposta não é JSON — ${txt.slice(0, 200)}`); }

  const n = Array.isArray(json?.data) ? json.data.length : 0;
  stats.rows += n;
  console.log(`  ${endpoint} -> ${n} linhas, ${charged} créditos (gasto ${budget.spent}/${CAP})`);
  return json;
}

/* ------------------------------------------------------------------- nomes */

const labelsFile = readJson(LABELS_FILE, null) || { v: 1, t: 0, labels: {} };
const labels = labelsFile.labels;
let newLabels = 0;

/* Uma "label" só vale a pena guardar se disser alguma coisa que o endereço já não diga.
   A Nansen devolve muitas vezes o próprio endereço, ou um pedaço dele, como nome. */
function keepLabel(addr, label) {
  if (!addr || !label) return;
  const a = String(addr).toLowerCase();
  if (!/^0x[0-9a-f]{40}$/.test(a)) return;
  const l = String(label).trim();
  if (!l || l.length > 60) return;
  const bare = l.toLowerCase().replace(/[^0-9a-z]/g, "");
  if (a.includes(bare) || bare.includes(a.slice(2, 10))) return;   /* é o endereço outra vez */
  if (/^0x[0-9a-f]{4}/i.test(l)) return;
  if (labels[a] === l) return;
  if (!labels[a]) newLabels++;
  labels[a] = l;
}

/* --------------------------------------------------------------- as moedas */

/* As moedas a consultar saem dos dados reais que já temos: o data/hl-pos.json traz as posições
   agregadas por moeda na Hyperliquid. Ordena-se por nocional total e vai-se às maiores — não há
   lista inventada à mão que envelheça sozinha. As moedas xyz: são os mercados de acções da HIP-3,
   que a Nansen não indexa, por isso ficam de fora. */
function topCoins(n) {
  const hl = readJson(path.join(DIR, "hl-pos.json"), null);
  const out = [];
  if (hl && hl.coins) {
    for (const [sym, c] of Object.entries(hl.coins)) {
      if (sym.includes(":")) continue;
      const rows = c && c.rows;
      if (!Array.isArray(rows)) continue;
      let tot = 0;
      for (const r of rows) tot += Math.abs(Number(r[1]) || 0);
      if (tot > 0) out.push([sym, tot]);
    }
    out.sort((a, b) => b[1] - a[1]);
  }
  if (!out.length) {
    console.log("aviso: hl-pos.json ilegível, uso a lista de recurso");
    return ["BTC", "ETH", "SOL", "HYPE", "XRP"].slice(0, n);
  }
  return out.slice(0, n).map(x => x[0]);
}

/* ------------------------------------------------------------- recolhas */

async function perpPositions(symbol, perPage) {
  /* label_type "all_traders" é o padrão documentado e o que custa 5 créditos. Pedir labels
     premium aqui passa a chamada para 150 — não vale a pena para 2000/mês. */
  const j = await call("/tgm/perp-positions", {
    token_symbol: symbol,
    label_type: "all_traders",
    pagination: { page: 1, per_page: perPage },
    order_by: [{ field: "position_value_usd", direction: "DESC" }],
  });
  const rows = Array.isArray(j?.data) ? j.data : [];
  for (const r of rows) keepLabel(r.address, r.address_label);
  /* Guarda-se só o topo por moeda: é o que o painel mostra, e o ficheiro tem de ser leve
     porque o browser vai buscá-lo. */
  return rows.slice(0, 40).map(r => ({
    a: String(r.address || "").toLowerCase(),
    l: r.address_label || "",
    s: r.side,
    v: r.position_value_usd,
    lev: r.leverage,
    e: r.entry_price,
    liq: r.liquidation_price,
    u: r.upnl_usd,
  }));
}

async function leaderboard(pages, perPage, days, dir) {
  const seen = [];
  const date = dateRange(days || 7);
  for (let p = 1; p <= pages; p++) {
    const j = await call("/perp-leaderboard", {
      date,
      /* Vem a true por omissão no esquema deles, e as labels premium são exactamente o que
         dispara a sobretaxa de 150 créditos. Escrito à mão para não depender do padrão. */
      premium_labels: false,
      pagination: { page: p, per_page: perPage },
      order_by: [{ field: "total_pnl", direction: dir || "DESC" }],
    });
    const rows = Array.isArray(j?.data) ? j.data : [];
    for (const r of rows) {
      keepLabel(r.trader_address, r.trader_address_label);
      seen.push(r);
    }
    if (!rows.length || j?.pagination?.is_last_page) break;
  }
  return seen;
}

async function smartMoney() {
  const out = {};
  try {
    const j = await call("/smart-money/netflow", {
      chains: ["all"],
      filters: { include_stablecoins: false, include_native_tokens: true },
      pagination: { page: 1, per_page: 100 },
      order_by: [{ field: "net_flow_24h_usd", direction: "DESC" }],
    });
    out.netflow = (j?.data || []).map(d => ({
      s: d.token_symbol, c: d.chain,
      f1: d.net_flow_1h_usd, f24: d.net_flow_24h_usd, f7: d.net_flow_7d_usd, f30: d.net_flow_30d_usd,
      n: d.trader_count, mc: d.market_cap_usd,
    }));
  } catch (e) { stats.errors.push("netflow: " + e.message); }
  return out;
}

/* ------------------------------------------------------------------- modos */

async function run() {
  if (!KEY) throw new Error("falta a NANSEN_KEY no ambiente");
  console.log(`modo ${MODE} | mês ${budget.month} | já gastos ${budget.spent}/${CAP} | disponíveis ${remaining()}`);

  const perps = readJson(PERPS_FILE, null) || { v: 1, t: 0, coins: {} };

  if (MODE === "probe") {
    /* O mais barato que valida tudo ao mesmo tempo: autenticação, formato do corpo, forma da
       resposta e o nome do header dos créditos. 10 linhas chegam. */
    const j = await call("/perp-leaderboard", {
      date: dateRange(1),
      premium_labels: false,
      pagination: { page: 1, per_page: 10 },
      order_by: [{ field: "total_pnl", direction: "DESC" }],
    });
    const rows = j?.data || [];
    console.log(`chave válida. ${rows.length} linhas de volta.`);
    console.log("header de créditos:", creditHeaderName || "(nenhum — uso a tabela de custos)");
    for (const r of rows.slice(0, 5)) {
      keepLabel(r.trader_address, r.trader_address_label);
      console.log(`   ${r.trader_address} -> ${r.trader_address_label || "(sem nome)"} pnl ${r.total_pnl}`);
    }
  }

  else if (MODE === "sweep") {
    /* O varrimento intensivo de uma vez só. Isto é o que semeia a cache de nomes: 5 páginas de
       1000 do leaderboard e as 25 maiores moedas com o livro inteiro. Cada chamada 5 créditos. */
    /* Três varreduras com janelas e sentidos diferentes porque devolvem gente diferente, e o
       que nos interessa aqui são NOMES, não o PnL: os campeões do mês, os do dia (outra malta
       — quem faz scalping não aparece no top de 30 dias) e, ao contrário, os que mais perderam.
       Estes últimos são precisamente os que aparecem no painel perto da liquidação. */
    console.log("-- leaderboard 30d, os que mais ganharam (5 × 1000)");
    await leaderboard(5, 1000, 30, "DESC");
    console.log("-- leaderboard 30d, os que mais perderam (2 × 1000)");
    await leaderboard(2, 1000, 30, "ASC");
    console.log("-- leaderboard 1d, o movimento de hoje (3 × 1000)");
    await leaderboard(3, 1000, 1, "DESC");

    const coins = topCoins(25);
    console.log(`-- posições por moeda (${coins.length}): ${coins.join(" ")}`);
    for (const c of coins) {
      if (remaining() < 50) { console.log("paro: reserva de créditos atingida"); break; }
      try { perps.coins[c] = await perpPositions(c, 1000); }
      catch (e) { stats.errors.push(`${c}: ${e.message}`); console.log(`  ! ${c}: ${e.message}`); }
    }
    console.log("-- smart money");
    const sm = await smartMoney();
    if (sm.netflow) writeJson(SM_FILE, { v: 1, t: Date.now(), ...sm });
    perps.t = Date.now();
    writeJson(PERPS_FILE, perps);
  }

  else if (MODE === "daily") {
    /* Manutenção. Poucas chamadas, todas úteis, uma vez por dia. */
    await leaderboard(1, 1000, 7, "DESC");
    await leaderboard(1, 1000, 1, "ASC");
    const coins = topCoins(5);
    for (const c of coins) {
      if (remaining() < 100) { console.log("paro: reserva de créditos atingida"); break; }
      try { perps.coins[c] = await perpPositions(c, 500); }
      catch (e) { stats.errors.push(`${c}: ${e.message}`); }
    }
    const sm = await smartMoney();
    if (sm.netflow) writeJson(SM_FILE, { v: 1, t: Date.now(), ...sm });
    perps.t = Date.now();
    writeJson(PERPS_FILE, perps);
  }

  else throw new Error(`modo desconhecido: ${MODE}`);

  /* A cache de nomes é cumulativa e nunca é reconsultada. Se um dia crescer demais, os mais
     antigos saem primeiro — mas 20 mil nomes são ~1 MB e ainda estamos muito longe disso. */
  labelsFile.t = Date.now();
  labelsFile.n = Object.keys(labels).length;
  writeJson(LABELS_FILE, labelsFile);

  budget.runs.push({ t: Date.now(), mode: MODE, calls: stats.calls, spent: budget.spent, newLabels });
  if (budget.runs.length > 120) budget.runs = budget.runs.slice(-120);
  budget.header = creditHeaderName || null;
  writeJson(BUDGET_FILE, budget);

  console.log(`\nfeito: ${stats.calls} chamadas, ${stats.rows} linhas, ${newLabels} nomes novos ` +
    `(total ${labelsFile.n}), ${budget.spent}/${CAP} créditos gastos este mês`);
  if (stats.errors.length) {
    console.log(`${stats.errors.length} erros:`);
    stats.errors.slice(0, 10).forEach(e => console.log("  ! " + e));
  }
}

run().catch(e => {
  /* Mesmo a rebentar, o contador tem de ser gravado: créditos gastos são gastos, e perder a
     conta é a única falha aqui que não se consegue desfazer. */
  try {
    budget.runs.push({ t: Date.now(), mode: MODE, calls: stats.calls, spent: budget.spent, error: String(e.message).slice(0, 200) });
    writeJson(BUDGET_FILE, budget);
    labelsFile.t = Date.now();
    labelsFile.n = Object.keys(labels).length;
    writeJson(LABELS_FILE, labelsFile);
  } catch {}
  console.error("FALHOU: " + e.message);
  process.exit(1);
});
