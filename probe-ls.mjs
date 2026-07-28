/* probe-ls.mjs — sonda: que bolsas públicas dão rácio long/short e open interest, e em que formato.
   Corre na VPS (IP limpo). Não escreve nada em lado nenhum — só imprime o que cada API responde,
   para eu escrever o agregador com base no que EXISTE e não no que julgo que existe. */
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function get(url) {
  const t0 = Date.now();
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { "User-Agent": "cryptomacho-probe/1" } });
    const txt = await r.text();
    let j = null; try { j = JSON.parse(txt); } catch (e) {}
    return { ok: r.ok, status: r.status, ms: Date.now() - t0, body: j || txt.slice(0, 300) };
  } catch (e) { return { ok: false, status: 0, ms: Date.now() - t0, body: "ERRO " + e.message }; }
}
const short = v => JSON.stringify(v).slice(0, 420);

const TESTS = [
  ["binance ratio (global accounts)", "https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=BTCUSDT&period=5m&limit=1"],
  ["binance ratio (top positions)", "https://fapi.binance.com/futures/data/topLongShortPositionRatio?symbol=BTCUSDT&period=5m&limit=1"],
  ["binance OI (todos)", "https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=BTCUSDT"],
  ["binance OI valor", "https://fapi.binance.com/futures/data/openInterestHist?symbol=BTCUSDT&period=5m&limit=1"],

  ["bybit ratio", "https://api.bybit.com/v5/market/account-ratio?category=linear&symbol=BTCUSDT&period=5min&limit=1"],
  ["bybit tickers (OI em USD)", "https://api.bybit.com/v5/market/tickers?category=linear&symbol=BTCUSDT"],

  ["okx ratio por ccy", "https://www.okx.com/api/v5/rubik/stat/contracts/long-short-account-ratio?ccy=BTC&period=5m"],
  ["okx ratio por contrato", "https://www.okx.com/api/v5/rubik/stat/contracts/long-short-account-ratio-contract?instId=BTC-USDT-SWAP&period=5m"],
  ["okx OI", "https://www.okx.com/api/v5/public/open-interest?instType=SWAP&instId=BTC-USDT-SWAP"],

  ["gate contract_stats", "https://api.gateio.ws/api/v4/futures/usdt/contract_stats?contract=BTC_USDT&limit=1"],

  ["htx elite account ratio", "https://api.hbdm.com/linear-swap-api/v1/swap_elite_account_ratio?contract_code=BTC-USDT&period=5min"],
  ["htx OI", "https://api.hbdm.com/linear-swap-api/v1/swap_open_interest?contract_code=BTC-USDT"],

  ["bitget account long/short", "https://api.bitget.com/api/v2/mix/market/account-long-short?symbol=BTCUSDT&period=5m&productType=USDT-FUTURES"],
  ["bitget tickers", "https://api.bitget.com/api/v2/mix/market/ticker?symbol=BTCUSDT&productType=USDT-FUTURES"],

  ["kucoin OI/ticker", "https://api-futures.kucoin.com/api/v1/contracts/XBTUSDTM"],

  ["coinalyze (sem chave?)", "https://api.coinalyze.net/v1/long-short-ratio-history?symbols=BTCUSD_PERP.A&interval=5min&from=1&to=2"],

  ["hyperliquid meta (nosso, já usado)", "https://api.hyperliquid.xyz/info"]
];

for (const [name, url] of TESTS) {
  const r = await get(url);
  console.log("\n### " + name + "  [" + r.status + ", " + r.ms + "ms]");
  console.log(short(r.body));
  await sleep(250);
}

/* quantos símbolos é que cada bolsa cobre — importa para saber se dá para agregar "todo o mercado" */
console.log("\n\n=== cobertura de símbolos por bolsa ===");
const COV = [
  ["binance", "https://fapi.binance.com/fapi/v1/exchangeInfo", j => (j.symbols || []).filter(s => s.contractType === "PERPETUAL" && s.quoteAsset === "USDT" && s.status === "TRADING").length],
  ["bybit", "https://api.bybit.com/v5/market/tickers?category=linear", j => ((j.result || {}).list || []).filter(x => /USDT$/.test(x.symbol)).length],
  ["okx", "https://www.okx.com/api/v5/public/instruments?instType=SWAP", j => (j.data || []).filter(x => /USDT-SWAP$/.test(x.instId)).length],
  ["gate", "https://api.gateio.ws/api/v4/futures/usdt/contracts", j => (Array.isArray(j) ? j.length : 0)],
  ["bitget", "https://api.bitget.com/api/v2/mix/market/tickers?productType=USDT-FUTURES", j => ((j.data) || []).length],
  ["htx", "https://api.hbdm.com/linear-swap-api/v1/swap_contract_info", j => ((j.data) || []).length]
];
for (const [name, url, count] of COV) {
  const r = await get(url);
  let n = "—";
  try { n = r.body && typeof r.body === "object" ? count(r.body) : "não-JSON"; } catch (e) { n = "erro " + e.message; }
  console.log(name + ": HTTP " + r.status + " · " + n + " pares perp USDT");
  await sleep(250);
}
process.exit(0);
