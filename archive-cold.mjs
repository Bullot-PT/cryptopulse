/* archive-cold.mjs — ARQUIVO FRIO. Guarda para sempre o que os coletores deitam fora.
   (18-ago-2026)

   O problema que isto resolve: o collect.mjs corta o data/oi-history.json aos 8 dias
   (`filter(s => s.t > now - 8*86400*1000)`), o radar-history aos 60 e o liq-totals aos 7.
   Ou seja: recolhe-se OI de 5 em 5 minutos para 60 moedas e deita-se fora ao fim de uma
   semana. Todos os backtests que quisermos fazer a estas estratégias dependem, por isso,
   da profundidade que a API da Bybit calhar dar — não dos nossos próprios dados.

   O que faz: um ficheiro por DIA, escrito uma vez e nunca reescrito (nada de churn no git).
   A janela de 8 dias da fonte é a rede de segurança: se este job falhar uma semana inteira,
   a corrida seguinte recupera tudo o que faltar.

   Custo medido nos dados reais de 18-ago: 0,24 MB/dia comprimido -> ~87 MB/ano.
   Sem chaves, sem segredos: lê o que o site já serve publicamente. */
import fs from "fs";
import path from "path";
import zlib from "zlib";

const SRC = "https://cryptomacho.io/data/";
const DAY = 86400_000;
const today = Math.floor(Date.now() / DAY);          /* dia UTC de hoje, em índice */

async function get(name) {
  const r = await fetch(SRC + name + "?b=" + Date.now(), { signal: AbortSignal.timeout(120000) });
  if (!r.ok) throw new Error("HTTP " + r.status);
  return await r.json();
}
function writeDay(dir, dayIdx, lines) {
  const d = new Date(dayIdx * DAY).toISOString().slice(0, 10);
  const p = path.join(dir, d + ".jsonl.gz");
  if (fs.existsSync(p)) return null;                  /* já arquivado — nunca reescrever */
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(p, zlib.gzipSync(Buffer.from(lines.join("\n") + "\n"), { level: 9 }));
  return { p, n: lines.length, kb: Math.round(fs.statSync(p).size / 1024) };
}
/* fontes com {samples:[{t,...}]} — uma linha por amostra */
async function archiveSamples(file, dir) {
  let j;
  try { j = await get(file); } catch (e) { console.log(`${file}: ${e.message} — salto`); return []; }
  const s = (j && j.samples) || [];
  if (!s.length) { console.log(`${file}: sem amostras — salto`); return []; }
  const by = new Map();
  for (const x of s) {
    if (!x || typeof x.t !== "number") continue;
    const d = Math.floor(x.t / DAY);
    if (d >= today) continue;                          /* o dia de hoje ainda não fechou */
    (by.get(d) || by.set(d, []).get(d)).push(JSON.stringify(x));
  }
  const done = [];
  for (const [d, lines] of [...by.entries()].sort((a, b) => a[0] - b[0])) {
    const r = writeDay(dir, d, lines);
    if (r) { done.push(r); console.log(`  ${r.p}: ${r.n} amostras, ${r.kb} kB`); }
  }
  const oldest = new Date(Math.min(...s.map(x => x.t)) ).toISOString().slice(0, 10);
  console.log(`${file}: ${s.length} amostras na fonte (desde ${oldest}), ${done.length} dias novos arquivados`);
  return done;
}
/* registo de sinais: {rows:[{t,...}]} — uma linha por sinal */
async function archiveRows(file, dir) {
  let j;
  try { j = await get(file); } catch (e) { console.log(`${file}: ${e.message} — salto`); return []; }
  const s = (j && j.rows) || [];
  if (!s.length) { console.log(`${file}: sem linhas — salto`); return []; }
  const by = new Map();
  for (const x of s) {
    if (!x || typeof x.t !== "number") continue;
    const d = Math.floor(x.t / DAY);
    if (d >= today) continue;
    (by.get(d) || by.set(d, []).get(d)).push(JSON.stringify(x));
  }
  const done = [];
  for (const [d, lines] of [...by.entries()].sort((a, b) => a[0] - b[0])) {
    const r = writeDay(dir, d, lines);
    if (r) { done.push(r); console.log(`  ${r.p}: ${r.n} sinais, ${r.kb} kB`); }
  }
  console.log(`${file}: ${s.length} linhas na fonte, ${done.length} dias novos arquivados`);
  return done;
}
/* liq-totals: mapas {unix_seconds: valor} — uma linha por bucket horário */
async function archiveLiq() {
  let j;
  try { j = await get("liq-totals.json"); } catch (e) { console.log("liq-totals.json: " + e.message + " — salto"); return []; }
  const agg = (j && j.agg) || {}, coins = (j && j.coins) || {};
  const by = new Map();
  for (const [ts, v] of Object.entries(agg)) {
    const t = +ts * 1000, d = Math.floor(t / DAY);
    if (d >= today) continue;
    const row = { t, agg: v, coins: {} };
    for (const [c, m] of Object.entries(coins)) if (m[ts]) row.coins[c] = m[ts];
    (by.get(d) || by.set(d, []).get(d)).push(JSON.stringify(row));
  }
  const done = [];
  for (const [d, lines] of [...by.entries()].sort((a, b) => a[0] - b[0])) {
    const r = writeDay("archive/liq-1h", d, lines);
    if (r) { done.push(r); console.log(`  ${r.p}: ${r.n} horas, ${r.kb} kB`); }
  }
  console.log(`liq-totals.json: ${Object.keys(agg).length} buckets na fonte, ${done.length} dias novos arquivados`);
  return done;
}

const out = [];
out.push(...await archiveSamples("oi-history.json", "archive/oi-5m"));
out.push(...await archiveSamples("radar-history.json", "archive/radar-1h"));
out.push(...await archiveRows("oi-signal-log.json", "archive/signals"));
out.push(...await archiveLiq());

/* índice legível, para saber de olho o que existe sem clonar o repo todo */
const idx = { t: Date.now(), v: 1, dirs: {} };
for (const dir of ["archive/oi-5m", "archive/radar-1h", "archive/signals", "archive/liq-1h"]) {
  if (!fs.existsSync(dir)) continue;
  const fl = fs.readdirSync(dir).filter(f => f.endsWith(".jsonl.gz")).sort();
  if (!fl.length) continue;
  idx.dirs[dir] = { dias: fl.length, de: fl[0].slice(0, 10), a: fl[fl.length - 1].slice(0, 10),
    mb: +(fl.reduce((s, f) => s + fs.statSync(path.join(dir, f)).size, 0) / 1e6).toFixed(2) };
}
fs.mkdirSync("archive", { recursive: true });
fs.writeFileSync("archive/INDEX.json", JSON.stringify(idx, null, 1));
console.log("\nindice:", JSON.stringify(idx.dirs));
console.log(out.length ? `${out.length} ficheiros novos` : "nada novo — arquivo já em dia");
