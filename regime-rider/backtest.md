# Regime Rider — replay historico das 3 variantes

_Gerado por `vps-backtest-regime-rider.yml`. Nao editar a mao._

**Periodo:** 2019-09-08 .. 2026-07-27  (2515 candles, 6.88y)
**Gerado:** 2026-07-28 09:46 UTC

## Ordem de leitura do Playbook §2 — nunca comecar pelo lucro

| # | metrica | long-only | short-only | long+short |
|---|---|---|---|---|
| 1 | Trades | 26 | 20 | 44 |
|  | &nbsp;&nbsp;dos quais long | 26 | 0 | 24 |
|  | &nbsp;&nbsp;dos quais short | 0 | 20 | 20 |
| 2 | Win rate % | 46.2 | 30.0 | 40.9 |
| 3 | Payoff (avgWin/avgLoss) | 3.66 | 2.04 | 2.96 |
|  | Avg win | 1208.03 | 280.33 | 1012.95 |
|  | Avg loss | 330.49 | 137.31 | 342.53 |
| 4 | **Profit factor** | 3.133 | 0.875 | 2.047 |
| 5 | Net return % | 197.39 | -4.81 | 186.55 |
|  | CAGR % | 17.16 | -0.71 | 16.53 |
| 6 | **Max drawdown %** | 9.83 | 25.92 | 21.01 |
| 7 | Maior perda | -649.51 | -200.19 | -559.05 |
|  | Maior ganho | 4732.17 | 644.27 | 4732.17 |
| 8 | Pior serie de perdas | 4 | 8 | 7 |
| 9 | Buy & hold % | 513.19 | 513.19 | 513.19 |
|  | Buy & hold drawdown % | 76.67 | 76.67 | 76.67 |

### Profit factor isolado por lado (dentro de cada variante)

| variante | PF long | PF short |
|---|---|---|
| long | 3.133 | - |
| short | - | 0.875 |
| both | 3.368 | 0.887 |

## Como ler isto honestamente

- **Funding nao esta modelado.** Nenhuma destas colunas paga
  funding. No lado short isso e material: e um custo real que
  o simulador nao ve. Tratar o lado favoravel como **tecto**.
- **Nao e out-of-sample.** As regras foram desenhadas sobre
  esta mesma historia. O replay verifica a implementacao e da
  forensica ao nivel do trade — nao prova que funciona.
- **Trades < 30 => conclusao fragil** (Playbook §2.1).
- **Drawdown baixo por pouca exposicao nao e controlo de
  risco.** Perguntar sempre porque e que e baixo.
- O registo que decide de facto a questao dos shorts e o
  **forward**, das tres instancias em dry-run na VPS.

## Saida completa do replay

<details><summary>long</summary>

```

========================================================================
  BACKTEST bt-long  —  2019-09-08 .. 2026-07-27  (2515 candles, 6.88y)
========================================================================
  sides: longs=True shorts=False  risk=4%  caps L2.0x/S1.0x  fee=0.040%/side

   1. Trades ................ 26   (long 26, short 0)
   2. Win rate .............. 46.2%
   3. Avg win / avg loss .... 1208.03 / 330.49   payoff 3.66
   4. Profit factor ......... 3.133
   5. Net return ............ 197.39%   (CAGR 17.16%)
   6. Max drawdown .......... 9.83%
   7. Largest loss / win .... -649.51 / 4732.17
   8. Worst losing streak ... 4
   9. Buy & hold ............ 513.19% (drawdown 76.67%)
  10. Long side ............. {'trades': 26, 'win_rate_pct': 46.2, 'net_pnl': 9869.55, 'profit_factor': 3.133}
      Short side ........... {'trades': 0}

  Funding is NOT modelled. On the short side especially, treat
  these numbers as a CEILING (Playbook 5).

```

</details>

<details><summary>short</summary>

```

========================================================================
  BACKTEST bt-short  —  2019-09-08 .. 2026-07-27  (2515 candles, 6.88y)
========================================================================
  sides: longs=False shorts=True  risk=4%  caps L2.0x/S1.0x  fee=0.040%/side

   1. Trades ................ 20   (long 0, short 20)
   2. Win rate .............. 30.0%
   3. Avg win / avg loss .... 280.33 / 137.31   payoff 2.04
   4. Profit factor ......... 0.875
   5. Net return ............ -4.81%   (CAGR -0.71%)
   6. Max drawdown .......... 25.92%
   7. Largest loss / win .... -200.19 / 644.27
   8. Worst losing streak ... 8
   9. Buy & hold ............ 513.19% (drawdown 76.67%)
  10. Long side ............. {'trades': 0}
      Short side ........... {'trades': 20, 'win_rate_pct': 30.0, 'net_pnl': -240.31, 'profit_factor': 0.875}

  Funding is NOT modelled. On the short side especially, treat
  these numbers as a CEILING (Playbook 5).

```

</details>

<details><summary>both</summary>

```

========================================================================
  BACKTEST bt-both  —  2019-09-08 .. 2026-07-27  (2515 candles, 6.88y)
========================================================================
  sides: longs=True shorts=True  risk=4%  caps L2.0x/S1.0x  fee=0.040%/side

   1. Trades ................ 44   (long 24, short 20)
   2. Win rate .............. 40.9%
   3. Avg win / avg loss .... 1012.95 / 342.53   payoff 2.96
   4. Profit factor ......... 2.047
   5. Net return ............ 186.55%   (CAGR 16.53%)
   6. Max drawdown .......... 21.01%
   7. Largest loss / win .... -559.05 / 4732.17
   8. Worst losing streak ... 7
   9. Buy & hold ............ 513.19% (drawdown 76.67%)
  10. Long side ............. {'trades': 24, 'win_rate_pct': 50.0, 'net_pnl': 9864.6, 'profit_factor': 3.368}
      Short side ........... {'trades': 20, 'win_rate_pct': 30.0, 'net_pnl': -537.23, 'profit_factor': 0.887}

  Funding is NOT modelled. On the short side especially, treat
  these numbers as a CEILING (Playbook 5).

```

</details>

Listas de trades completas: `backtest-long.csv`,
`backtest-short.csv`, `backtest-both.csv`.
