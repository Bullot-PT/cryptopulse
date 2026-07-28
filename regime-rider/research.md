# Regime Rider — investigacao alargada (regras FIXAS, amostra maior)

_Gerado por `vps-research-regime-rider.yml` / `research.py`. Nao editar a mao._

**Gerado:** 2026-07-28 10:10 UTC

Nenhum parametro foi alterado, afinado ou pesquisado. As regras sao as do `bot.py` que decide ao vivo, importadas directamente. O que muda aqui e so a AMOSTRA: mais historia, mais activos, funding real.

## 1. A amostra grande — todos os trades, todos os activos

Trades agregados como % da equity a entrada, para que um trade de BTC e um de DOGE pesem o mesmo.

| variante | activos | trades | win rate | **PF** | **PF c/ funding real** | media/trade | mediana/trade |
|---|---|---|---|---|---|---|---|
| **long** | 8 | 219 | 39.7% | **4.839** | **4.281** | +5.851% | -1.350% |
| **short** | 8 | 206 | 32.0% | **1.1** | **1.1** | +0.167% | -1.510% |
| **both** | 8 | 390 | 37.7% | **3.009** | **2.763** | +3.356% | -1.450% |

Apenas perps (onde o funding existe de facto):

| variante | trades | win rate | PF | PF c/ funding |
|---|---|---|---|---|
| **long** | 161 | 36.6% | 4.481 | 3.785 |
| **short** | 147 | 30.6% | 0.93 | 0.928 |
| **both** | 280 | 35.0% | 2.783 | 2.462 |

## 2. Por activo e variante

| activo | variante | periodo | trades | WR | PF | PF c/ fund | net % | maxDD % | pior serie | 1 trade = % do lucro |
|---|---|---|---|---|---|---|---|---|---|---|
| BNB-perp | both | 2020-02..2026-07 | 51 | 35.3% | 1.744 | 1.674 | 206.06 | 33.75 | 7 | 36.6% |
| BNB-perp | long | 2020-02..2026-07 | 28 | 42.9% | 3.483 | 3.467 | 321.29 | 14.9 | 4 | 39.2% |
| BNB-perp | short | 2020-02..2026-07 | 28 | 21.4% | 0.53 | 0.48 | -26.02 | 33.26 | 13 | 37.2% |
| BTC-perp | both | 2019-09..2026-07 | 44 | 40.9% | 2.047 | 1.733 | 186.55 | 21.01 | 7 | 26.0% |
| BTC-perp | long | 2019-09..2026-07 | 26 | 46.2% | 3.133 | 2.395 | 197.39 | 9.83 | 4 | 32.6% |
| BTC-perp | short | 2019-09..2026-07 | 20 | 30.0% | 0.875 | 0.92 | -4.81 | 25.92 | 8 | 38.3% |
| BTC-spot | both | 2017-08..2026-07 | 56 | 42.9% | 2.345 | - | 537.46 | 21.06 | 7 | 21.6% |
| BTC-spot | long | 2017-08..2026-07 | 30 | 46.7% | 3.561 | - | 411.66 | 9.87 | 4 | 27.6% |
| BTC-spot | short | 2017-08..2026-07 | 29 | 34.5% | 1.319 | - | 18.73 | 25.82 | 8 | 26.7% |
| DOGE-perp | both | 2020-07..2026-07 | 45 | 37.8% | 1.971 | 1.828 | 90.67 | 18.23 | 6 | 27.5% |
| DOGE-perp | long | 2020-07..2026-07 | 25 | 36.0% | 2.383 | 2.124 | 86.72 | 11.73 | 4 | 38.2% |
| DOGE-perp | short | 2020-07..2026-07 | 23 | 47.8% | 1.888 | 2.016 | 17.87 | 6.78 | 5 | 28.7% |
| ETH-perp | both | 2019-11..2026-07 | 41 | 43.9% | 2.291 | 1.919 | 208.39 | 14.31 | 4 | 26.2% |
| ETH-perp | long | 2019-11..2026-07 | 22 | 50.0% | 3.511 | 2.578 | 188.3 | 11.87 | 3 | 36.8% |
| ETH-perp | short | 2019-11..2026-07 | 21 | 33.3% | 1.137 | 1.159 | 5.05 | 15.06 | 5 | 37.8% |
| ETH-spot | both | 2017-08..2026-07 | 54 | 46.3% | 2.45 | - | 413.57 | 14.11 | 4 | 22.6% |
| ETH-spot | long | 2017-08..2026-07 | 28 | 50.0% | 3.719 | - | 311.82 | 11.73 | 3 | 32.2% |
| ETH-spot | short | 2017-08..2026-07 | 30 | 36.7% | 1.471 | - | 28.11 | 14.93 | 5 | 22.5% |
| SOL-perp | both | 2020-09..2026-07 | 40 | 35.0% | 2.792 | 2.499 | 236.38 | 20.53 | 9 | 35.6% |
| SOL-perp | long | 2020-09..2026-07 | 23 | 30.4% | 3.451 | 3.055 | 192.25 | 16.69 | 4 | 43.0% |
| SOL-perp | short | 2020-09..2026-07 | 23 | 39.1% | 1.495 | 1.346 | 13.25 | 18.86 | 10 | 30.7% |
| XRP-perp | both | 2020-01..2026-07 | 59 | 22.0% | 1.533 | 1.384 | 80.4 | 51.23 | 16 | 45.9% |
| XRP-perp | long | 2020-01..2026-07 | 37 | 21.6% | 2.422 | 2.057 | 130.2 | 38.43 | 16 | 63.5% |
| XRP-perp | short | 2020-01..2026-07 | 32 | 18.8% | 0.523 | 0.541 | -24.76 | 33.81 | 11 | 44.7% |

## 3. Funding real — o custo que nunca tinha sido medido

Convencao Binance: **funding > 0 => os LONGS PAGAM aos SHORTS**. Historicamente o funding do BTC perp e positivo a maior parte do tempo, portanto e preciso medir antes de assumir que o short paga.

| activo | variante | trades | P&L funding (USDT) | P&L bruto | P&L c/ funding |
|---|---|---|---|---|---|
| BNB-perp | both | 51 | -857.59 | +10302.96 | 9445.37 |
| BNB-perp | long | 28 | -269.25 | +16064.66 | 15795.41 |
| BNB-perp | short | 28 | -161.09 | -1301.21 | -1462.3 |
| BTC-perp | both | 44 | -2593.91 | +9327.37 | 6733.46 |
| BTC-perp | long | 26 | -2877.76 | +9869.55 | 6991.79 |
| BTC-perp | short | 20 | +89.73 | -240.31 | -150.58 |
| DOGE-perp | both | 45 | -520.79 | +4533.71 | 4012.92 |
| DOGE-perp | long | 25 | -681.40 | +4335.96 | 3654.56 |
| DOGE-perp | short | 23 | +98.42 | +893.51 | 991.93 |
| ETH-perp | both | 41 | -2733.36 | +10419.69 | 7686.33 |
| ETH-perp | long | 22 | -2887.35 | +9414.77 | 6527.42 |
| ETH-perp | short | 21 | +36.93 | +252.39 | 289.32 |
| SOL-perp | both | 40 | -1681.49 | +11819.06 | 10137.57 |
| SOL-perp | long | 23 | -1244.09 | +9612.27 | 8368.18 |
| SOL-perp | short | 23 | -197.54 | +662.39 | 464.85 |
| XRP-perp | both | 59 | -1020.43 | +4019.96 | 2999.53 |
| XRP-perp | long | 37 | -1254.93 | +6509.82 | 5254.89 |
| XRP-perp | short | 32 | +73.26 | -1237.81 | -1164.55 |

## 4. Bootstrap — a distribuicao de onde o resultado unico saiu

Reamostragem dos trades com reposicao, composta. Responde: dada esta colecao de trades, quao larga e a gama de desfechos possiveis? Um percentil 5 muito negativo com mediana positiva significa que o resultado observado teve sorte na ordem.

| activo | variante | n | p05 | mediana | p95 | prob. de perder |
|---|---|---|---|---|---|---|
| BNB-perp | both | 51 | -35.6% | 179.8% | 2438.9% | 16.5% |
| BNB-perp | long | 28 | -4.6% | 275.0% | 2820.9% | 6.4% |
| BNB-perp | short | 28 | -47.4% | -27.1% | 9.1% | 90.8% |
| BTC-perp | both | 44 | -1.2% | 166.4% | 1004.6% | 5.2% |
| BTC-perp | long | 26 | 10.3% | 174.5% | 936.0% | 2.7% |
| BTC-perp | short | 20 | -31.1% | -6.1% | 36.4% | 61.4% |
| BTC-spot | both | 56 | 56.0% | 476.2% | 3056.1% | 0.7% |
| BTC-spot | long | 30 | 40.6% | 372.3% | 2236.9% | 1.3% |
| BTC-spot | short | 29 | -24.3% | 16.4% | 99.6% | 29.7% |
| DOGE-perp | both | 45 | -21.2% | 81.0% | 453.7% | 13.9% |
| DOGE-perp | long | 25 | -22.1% | 75.0% | 391.2% | 14.3% |
| DOGE-perp | short | 23 | -7.4% | 16.6% | 52.6% | 13.5% |
| ETH-perp | both | 41 | 5.3% | 189.7% | 1060.5% | 4.0% |
| ETH-perp | long | 22 | 15.2% | 170.0% | 808.6% | 1.9% |
| ETH-perp | short | 21 | -26.9% | 4.0% | 56.3% | 43.6% |
| ETH-spot | both | 54 | 53.7% | 376.7% | 2024.8% | 0.7% |
| ETH-spot | long | 28 | 42.8% | 281.4% | 1411.7% | 0.7% |
| ETH-spot | short | 30 | -21.0% | 25.9% | 115.2% | 21.1% |
| SOL-perp | both | 40 | -4.4% | 214.2% | 1489.1% | 5.8% |
| SOL-perp | long | 23 | -18.1% | 178.8% | 1079.1% | 8.8% |
| SOL-perp | short | 23 | -13.4% | 12.6% | 52.2% | 24.1% |
| XRP-perp | both | 59 | -51.3% | 62.3% | 1013.1% | 29.9% |
| XRP-perp | long | 37 | -33.2% | 107.8% | 1244.2% | 21.0% |
| XRP-perp | short | 32 | -45.2% | -25.6% | 7.7% | 90.6% |

## 5. Comportamento ano a ano (ler como sanidade, nunca como CAGR)

<details><summary>BNB-perp — both</summary>

| ano | trades | long | short | WR | P&L |
|---|---|---|---|---|---|
| 2020 | 2 | 2 | 0 | 50.0% | -132.40 |
| 2021 | 7 | 5 | 2 | 57.1% | +9714.97 |
| 2022 | 7 | 1 | 6 | 28.6% | +347.34 |
| 2023 | 10 | 4 | 6 | 40.0% | -1949.36 |
| 2024 | 10 | 7 | 3 | 30.0% | -172.74 |
| 2025 | 9 | 4 | 5 | 22.2% | +2172.44 |
| 2026 | 6 | 1 | 5 | 33.3% | +322.71 |

</details>

<details><summary>BNB-perp — long</summary>

| ano | trades | long | short | WR | P&L |
|---|---|---|---|---|---|
| 2020 | 2 | 2 | 0 | 50.0% | -132.40 |
| 2021 | 5 | 5 | 0 | 80.0% | +10800.21 |
| 2022 | 4 | 4 | 0 | 0.0% | -1251.95 |
| 2023 | 4 | 4 | 0 | 50.0% | -1082.23 |
| 2024 | 7 | 7 | 0 | 42.9% | +1877.51 |
| 2025 | 5 | 5 | 0 | 40.0% | +6197.05 |
| 2026 | 1 | 1 | 0 | 0.0% | -343.53 |

</details>

<details><summary>BNB-perp — short</summary>

| ano | trades | long | short | WR | P&L |
|---|---|---|---|---|---|
| 2021 | 2 | 0 | 2 | 0.0% | -284.04 |
| 2022 | 6 | 0 | 6 | 33.3% | +166.41 |
| 2023 | 6 | 0 | 6 | 33.3% | -292.95 |
| 2024 | 4 | 0 | 4 | 0.0% | -543.50 |
| 2025 | 5 | 0 | 5 | 0.0% | -509.01 |
| 2026 | 5 | 0 | 5 | 40.0% | +161.88 |

</details>

<details><summary>BTC-perp — both</summary>

| ano | trades | long | short | WR | P&L |
|---|---|---|---|---|---|
| 2020 | 3 | 3 | 0 | 33.3% | +128.05 |
| 2021 | 9 | 6 | 3 | 33.3% | +4166.75 |
| 2022 | 5 | 0 | 5 | 60.0% | +982.88 |
| 2023 | 6 | 4 | 2 | 50.0% | -80.60 |
| 2024 | 9 | 5 | 4 | 22.2% | +1298.27 |
| 2025 | 8 | 6 | 2 | 37.5% | +770.77 |
| 2026 | 4 | 0 | 4 | 75.0% | +2061.25 |

</details>

<details><summary>BTC-perp — long</summary>

| ano | trades | long | short | WR | P&L |
|---|---|---|---|---|---|
| 2020 | 3 | 3 | 0 | 33.3% | +128.05 |
| 2021 | 7 | 7 | 0 | 42.9% | +4417.35 |
| 2023 | 4 | 4 | 0 | 75.0% | +491.05 |
| 2024 | 5 | 5 | 0 | 40.0% | +3423.05 |
| 2025 | 7 | 7 | 0 | 42.9% | +1410.05 |

</details>

<details><summary>BTC-perp — short</summary>

| ano | trades | long | short | WR | P&L |
|---|---|---|---|---|---|
| 2021 | 3 | 0 | 3 | 0.0% | -233.36 |
| 2022 | 5 | 0 | 5 | 60.0% | +504.05 |
| 2023 | 2 | 0 | 2 | 0.0% | -297.19 |
| 2024 | 4 | 0 | 4 | 0.0% | -687.14 |
| 2025 | 2 | 0 | 2 | 0.0% | -211.44 |
| 2026 | 4 | 0 | 4 | 75.0% | +684.77 |

</details>

<details><summary>BTC-spot — both</summary>

| ano | trades | long | short | WR | P&L |
|---|---|---|---|---|---|
| 2018 | 4 | 0 | 4 | 25.0% | -74.49 |
| 2019 | 5 | 3 | 2 | 40.0% | +4313.73 |
| 2020 | 6 | 3 | 3 | 66.7% | +1415.70 |
| 2021 | 9 | 6 | 3 | 33.3% | +8996.90 |
| 2022 | 5 | 0 | 5 | 60.0% | +2208.21 |
| 2023 | 6 | 4 | 2 | 50.0% | -15.28 |
| 2024 | 9 | 5 | 4 | 22.2% | +3482.61 |
| 2025 | 8 | 6 | 2 | 37.5% | +1846.07 |
| 2026 | 4 | 0 | 4 | 75.0% | +4699.68 |

</details>

<details><summary>BTC-spot — long</summary>

| ano | trades | long | short | WR | P&L |
|---|---|---|---|---|---|
| 2019 | 3 | 3 | 0 | 33.3% | +2939.17 |
| 2020 | 4 | 4 | 0 | 50.0% | +373.68 |
| 2021 | 7 | 7 | 0 | 42.9% | +7437.41 |
| 2023 | 4 | 4 | 0 | 75.0% | +929.06 |
| 2024 | 5 | 5 | 0 | 40.0% | +6352.27 |
| 2025 | 7 | 7 | 0 | 42.9% | +2551.40 |

</details>

<details><summary>BTC-spot — short</summary>

| ano | trades | long | short | WR | P&L |
|---|---|---|---|---|---|
| 2018 | 4 | 0 | 4 | 25.0% | -74.49 |
| 2019 | 2 | 0 | 2 | 50.0% | +893.26 |
| 2020 | 3 | 0 | 3 | 66.7% | +366.54 |
| 2021 | 3 | 0 | 3 | 0.0% | -296.01 |
| 2022 | 5 | 0 | 5 | 60.0% | +661.76 |
| 2023 | 2 | 0 | 2 | 0.0% | -369.22 |
| 2024 | 4 | 0 | 4 | 0.0% | -857.84 |
| 2025 | 2 | 0 | 2 | 0.0% | -262.87 |
| 2026 | 4 | 0 | 4 | 75.0% | +875.33 |

</details>

<details><summary>DOGE-perp — both</summary>

| ano | trades | long | short | WR | P&L |
|---|---|---|---|---|---|
| 2021 | 9 | 6 | 3 | 22.2% | +1691.09 |
| 2022 | 9 | 2 | 7 | 44.4% | -43.03 |
| 2023 | 8 | 4 | 4 | 37.5% | -624.22 |
| 2024 | 9 | 7 | 2 | 33.3% | +2962.74 |
| 2025 | 7 | 3 | 4 | 28.6% | -896.48 |
| 2026 | 3 | 0 | 3 | 100.0% | +1443.61 |

</details>

<details><summary>DOGE-perp — long</summary>

| ano | trades | long | short | WR | P&L |
|---|---|---|---|---|---|
| 2021 | 7 | 7 | 0 | 42.9% | +2237.27 |
| 2022 | 3 | 3 | 0 | 33.3% | -104.88 |
| 2023 | 4 | 4 | 0 | 25.0% | -485.80 |
| 2024 | 7 | 7 | 0 | 42.9% | +3491.92 |
| 2025 | 4 | 4 | 0 | 25.0% | -802.55 |

</details>

<details><summary>DOGE-perp — short</summary>

| ano | trades | long | short | WR | P&L |
|---|---|---|---|---|---|
| 2021 | 3 | 0 | 3 | 0.0% | -196.66 |
| 2022 | 7 | 0 | 7 | 42.9% | +145.76 |
| 2023 | 4 | 0 | 4 | 50.0% | +75.46 |
| 2024 | 2 | 0 | 2 | 50.0% | +36.67 |
| 2025 | 4 | 0 | 4 | 50.0% | -60.12 |
| 2026 | 3 | 0 | 3 | 100.0% | +892.40 |

</details>

<details><summary>ETH-perp — both</summary>

| ano | trades | long | short | WR | P&L |
|---|---|---|---|---|---|
| 2020 | 2 | 2 | 0 | 50.0% | +460.83 |
| 2021 | 7 | 5 | 2 | 71.4% | +6113.74 |
| 2022 | 5 | 0 | 5 | 40.0% | +1132.89 |
| 2023 | 7 | 4 | 3 | 14.3% | -1442.61 |
| 2024 | 9 | 6 | 3 | 44.4% | +1099.65 |
| 2025 | 7 | 3 | 4 | 28.6% | +1494.95 |
| 2026 | 4 | 0 | 4 | 75.0% | +1560.24 |

</details>

<details><summary>ETH-perp — long</summary>

| ano | trades | long | short | WR | P&L |
|---|---|---|---|---|---|
| 2020 | 2 | 2 | 0 | 50.0% | +460.83 |
| 2021 | 6 | 6 | 0 | 83.3% | +6590.71 |
| 2023 | 4 | 4 | 0 | 25.0% | -385.28 |
| 2024 | 6 | 6 | 0 | 50.0% | +1833.25 |
| 2025 | 4 | 4 | 0 | 25.0% | +915.26 |

</details>

<details><summary>ETH-perp — short</summary>

| ano | trades | long | short | WR | P&L |
|---|---|---|---|---|---|
| 2021 | 2 | 0 | 2 | 0.0% | -159.14 |
| 2022 | 5 | 0 | 5 | 40.0% | +473.80 |
| 2023 | 3 | 0 | 3 | 0.0% | -447.75 |
| 2024 | 3 | 0 | 3 | 33.3% | -196.79 |
| 2025 | 4 | 0 | 4 | 25.0% | +50.81 |
| 2026 | 4 | 0 | 4 | 75.0% | +531.46 |

</details>

<details><summary>ETH-spot — both</summary>

| ano | trades | long | short | WR | P&L |
|---|---|---|---|---|---|
| 2018 | 5 | 2 | 3 | 60.0% | +1060.24 |
| 2019 | 6 | 3 | 3 | 16.7% | +642.43 |
| 2020 | 4 | 2 | 2 | 75.0% | +1932.23 |
| 2021 | 7 | 5 | 2 | 71.4% | +10001.57 |
| 2022 | 5 | 0 | 5 | 40.0% | +1936.42 |
| 2023 | 7 | 4 | 3 | 28.6% | -2134.93 |
| 2024 | 9 | 6 | 3 | 44.4% | +1971.70 |
| 2025 | 7 | 3 | 4 | 28.6% | +2571.51 |
| 2026 | 4 | 0 | 4 | 75.0% | +2697.32 |

</details>

<details><summary>ETH-spot — long</summary>

| ano | trades | long | short | WR | P&L |
|---|---|---|---|---|---|
| 2018 | 2 | 2 | 0 | 0.0% | -83.85 |
| 2019 | 4 | 4 | 0 | 25.0% | +831.25 |
| 2020 | 2 | 2 | 0 | 100.0% | +1774.14 |
| 2021 | 6 | 6 | 0 | 83.3% | +9389.94 |
| 2023 | 4 | 4 | 0 | 50.0% | -397.01 |
| 2024 | 6 | 6 | 0 | 50.0% | +2713.49 |
| 2025 | 4 | 4 | 0 | 25.0% | +1362.80 |

</details>

<details><summary>ETH-spot — short</summary>

| ano | trades | long | short | WR | P&L |
|---|---|---|---|---|---|
| 2018 | 4 | 0 | 4 | 75.0% | +1226.64 |
| 2019 | 3 | 0 | 3 | 0.0% | -444.92 |
| 2020 | 2 | 0 | 2 | 50.0% | +243.51 |
| 2021 | 2 | 0 | 2 | 0.0% | -195.11 |
| 2022 | 5 | 0 | 5 | 40.0% | +605.77 |
| 2023 | 3 | 0 | 3 | 0.0% | -529.21 |
| 2024 | 3 | 0 | 3 | 33.3% | -239.46 |
| 2025 | 4 | 0 | 4 | 25.0% | +65.39 |
| 2026 | 4 | 0 | 4 | 75.0% | +672.84 |

</details>

<details><summary>SOL-perp — both</summary>

| ano | trades | long | short | WR | P&L |
|---|---|---|---|---|---|
| 2021 | 3 | 3 | 0 | 33.3% | +3781.12 |
| 2022 | 4 | 1 | 3 | 75.0% | +1082.09 |
| 2023 | 11 | 5 | 6 | 18.2% | -1638.87 |
| 2024 | 12 | 6 | 6 | 25.0% | +6878.46 |
| 2025 | 6 | 3 | 3 | 33.3% | -264.48 |
| 2026 | 4 | 0 | 4 | 75.0% | +1980.74 |

</details>

<details><summary>SOL-perp — long</summary>

| ano | trades | long | short | WR | P&L |
|---|---|---|---|---|---|
| 2021 | 3 | 3 | 0 | 33.3% | +3781.12 |
| 2022 | 1 | 1 | 0 | 0.0% | -352.52 |
| 2023 | 6 | 6 | 0 | 16.7% | -1113.33 |
| 2024 | 10 | 10 | 0 | 40.0% | +7088.40 |
| 2025 | 3 | 3 | 0 | 33.3% | +208.60 |

</details>

<details><summary>SOL-perp — short</summary>

| ano | trades | long | short | WR | P&L |
|---|---|---|---|---|---|
| 2022 | 3 | 0 | 3 | 100.0% | +851.03 |
| 2023 | 6 | 0 | 6 | 33.3% | -91.19 |
| 2024 | 7 | 0 | 7 | 0.0% | -778.76 |
| 2025 | 3 | 0 | 3 | 33.3% | +14.46 |
| 2026 | 4 | 0 | 4 | 75.0% | +666.85 |

</details>

<details><summary>XRP-perp — both</summary>

| ano | trades | long | short | WR | P&L |
|---|---|---|---|---|---|
| 2020 | 4 | 3 | 1 | 50.0% | +1285.74 |
| 2021 | 13 | 5 | 8 | 15.4% | +188.14 |
| 2022 | 7 | 3 | 4 | 28.6% | +261.33 |
| 2023 | 12 | 8 | 4 | 8.3% | -1726.68 |
| 2024 | 12 | 6 | 6 | 8.3% | -1306.12 |
| 2025 | 7 | 5 | 2 | 28.6% | +4337.82 |
| 2026 | 4 | 0 | 4 | 75.0% | +979.73 |

</details>

<details><summary>XRP-perp — long</summary>

| ano | trades | long | short | WR | P&L |
|---|---|---|---|---|---|
| 2020 | 4 | 4 | 0 | 50.0% | +1320.52 |
| 2021 | 9 | 9 | 0 | 22.2% | +1098.44 |
| 2022 | 4 | 4 | 0 | 0.0% | -436.85 |
| 2023 | 8 | 8 | 0 | 12.5% | -1063.42 |
| 2024 | 7 | 7 | 0 | 0.0% | -1013.52 |
| 2025 | 5 | 5 | 0 | 60.0% | +6604.65 |

</details>

<details><summary>XRP-perp — short</summary>

| ano | trades | long | short | WR | P&L |
|---|---|---|---|---|---|
| 2020 | 1 | 0 | 1 | 0.0% | -78.23 |
| 2021 | 8 | 0 | 8 | 0.0% | -595.50 |
| 2022 | 6 | 0 | 6 | 33.3% | +303.14 |
| 2023 | 5 | 0 | 5 | 0.0% | -674.54 |
| 2024 | 6 | 0 | 6 | 16.7% | -390.10 |
| 2025 | 2 | 0 | 2 | 0.0% | -211.22 |
| 2026 | 4 | 0 | 4 | 75.0% | +408.64 |

</details>

## 6. Como ler isto honestamente

- **Isto continua a nao ser out-of-sample no tempo.** E out-of-sample na *seccao cruzada*: as regras foram desenhadas em BTC e aqui correm em activos que nunca as viram. E o antidoto mais forte disponivel sem esperar anos, mas nao substitui o registo forward.
- **Os activos nao sao independentes.** Cripto move-se em bloco; seis perps nao valem seis amostras independentes. O `n` agregado exagera a confianca — tratar como 2 a 3 amostras efectivas, nao 6.
- **Spot nao tem funding nem venue de short.** As linhas `-spot` existem so pela historia de 2017-2018 que os perps nunca viram; o lado short delas e teorico.
- **Slippage alem da regra de gap continua por modelar.**
- Playbook §2: nunca comecar pelo lucro. Trades, dependencia de outliers, win rate COM payoff, drawdown, e so depois o retorno.
