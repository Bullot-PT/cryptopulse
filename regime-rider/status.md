# Regime Rider — estado das 3 instancias na VPS

_Gerado por `vps-bot-log.yml`. Nao editar a mao._

| campo | valor |
|---|---|
| Snapshot (UTC) | 2026-08-21 02:01:26 |
| Timer | active |
| Proxima corrida | Sat 2026-08-22 02:07:00 CEST  22h Fri 20 |
| Ultima corrida terminou | Fri 2026-08-21 02:07:27 CEST |

## Resumo

| instancia | longs | shorts | corridas | em posicao | lado | kill switch | dry_run | chaves |
|---|---|---|---|---|---|---|---|---|
| **long** | true | false | 27 | true | long | false | true | nao |
| **short** | false | true | 26 | false | - | false | true | nao |
| **both** | true | true | 26 | true | long | false | true | nao |

## long

**Ultima linha de decisao**

```
2026-08-21 02:07:20,886 [INFO] [long] Close=72998.70 SMA200=68981.72 ATR=1829.92 regime=UP (prev DOWN) HH20=69310.00 LL20=62792.30 sides=L
```

**Ultima accao**

```
2026-08-21 02:07:20,888 [INFO] [long] Long opened. Initial stop 68737.79 (6.2% away).
```

**Ultimas 10 decisoes**

```
2026-08-12 02:07:12,664 [INFO] [long] Close=63572.00 SMA200=69880.03 ATR=1395.81 regime=DOWN (prev DOWN) HH20=66082.00 LL20=62792.30 sides=L
2026-08-13 02:07:20,321 [INFO] [long] Close=63454.70 SMA200=69751.40 ATR=1379.47 regime=DOWN (prev DOWN) HH20=65375.10 LL20=62792.30 sides=L
2026-08-14 02:07:11,921 [INFO] [long] Close=63456.70 SMA200=69635.54 ATR=1365.98 regime=DOWN (prev DOWN) HH20=65375.10 LL20=62792.30 sides=L
2026-08-15 02:07:08,219 [INFO] [long] Close=63015.00 SMA200=69509.11 ATR=1347.76 regime=DOWN (prev DOWN) HH20=65375.10 LL20=62792.30 sides=L
2026-08-16 02:07:07,847 [INFO] [long] Close=63053.90 SMA200=69378.39 ATR=1271.48 regime=DOWN (prev DOWN) HH20=65375.10 LL20=62792.30 sides=L
2026-08-17 02:07:18,418 [INFO] [long] Close=62876.00 SMA200=69246.46 ATR=1229.87 regime=DOWN (prev DOWN) HH20=64928.50 LL20=62792.30 sides=L
2026-08-18 02:07:20,103 [INFO] [long] Close=64504.10 SMA200=69145.96 ATR=1276.08 regime=DOWN (prev DOWN) HH20=64928.50 LL20=62792.30 sides=L
2026-08-19 02:07:04,427 [INFO] [long] Close=64694.00 SMA200=69048.37 ATR=1261.99 regime=DOWN (prev DOWN) HH20=64928.50 LL20=62792.30 sides=L
2026-08-20 02:07:21,382 [INFO] [long] Close=69310.00 SMA200=69001.39 ATR=1623.18 regime=DOWN (prev DOWN) HH20=64928.50 LL20=62792.30 sides=L
2026-08-21 02:07:20,886 [INFO] [long] Close=72998.70 SMA200=68981.72 ATR=1829.92 regime=UP (prev DOWN) HH20=69310.00 LL20=62792.30 sides=L
```

## short

**Ultima linha de decisao**

```
2026-08-21 02:07:24,373 [INFO] [short] Close=72998.70 SMA200=68981.72 ATR=1829.92 regime=UP (prev DOWN) HH20=69310.00 LL20=62792.30 sides=S
```

**Ultima accao**

```
2026-08-21 02:07:24,374 [INFO] [short] Flat, no signal. Done.
```

**Ultimas 10 decisoes**

```
2026-08-12 02:07:14,899 [INFO] [short] Close=63572.00 SMA200=69880.03 ATR=1395.81 regime=DOWN (prev DOWN) HH20=66082.00 LL20=62792.30 sides=S
2026-08-13 02:07:22,829 [INFO] [short] Close=63454.70 SMA200=69751.40 ATR=1379.47 regime=DOWN (prev DOWN) HH20=65375.10 LL20=62792.30 sides=S
2026-08-14 02:07:15,295 [INFO] [short] Close=63456.70 SMA200=69635.54 ATR=1365.98 regime=DOWN (prev DOWN) HH20=65375.10 LL20=62792.30 sides=S
2026-08-15 02:07:11,431 [INFO] [short] Close=63015.00 SMA200=69509.11 ATR=1347.76 regime=DOWN (prev DOWN) HH20=65375.10 LL20=62792.30 sides=S
2026-08-16 02:07:10,900 [INFO] [short] Close=63053.90 SMA200=69378.39 ATR=1271.48 regime=DOWN (prev DOWN) HH20=65375.10 LL20=62792.30 sides=S
2026-08-17 02:07:20,989 [INFO] [short] Close=62876.00 SMA200=69246.46 ATR=1229.87 regime=DOWN (prev DOWN) HH20=64928.50 LL20=62792.30 sides=S
2026-08-18 02:07:22,209 [INFO] [short] Close=64504.10 SMA200=69145.96 ATR=1276.08 regime=DOWN (prev DOWN) HH20=64928.50 LL20=62792.30 sides=S
2026-08-19 02:07:07,241 [INFO] [short] Close=64694.00 SMA200=69048.37 ATR=1261.99 regime=DOWN (prev DOWN) HH20=64928.50 LL20=62792.30 sides=S
2026-08-20 02:07:24,216 [INFO] [short] Close=69310.00 SMA200=69001.39 ATR=1623.18 regime=DOWN (prev DOWN) HH20=64928.50 LL20=62792.30 sides=S
2026-08-21 02:07:24,373 [INFO] [short] Close=72998.70 SMA200=68981.72 ATR=1829.92 regime=UP (prev DOWN) HH20=69310.00 LL20=62792.30 sides=S
```

## both

**Ultima linha de decisao**

```
2026-08-21 02:07:26,515 [INFO] [both] Close=72998.70 SMA200=68981.72 ATR=1829.92 regime=UP (prev DOWN) HH20=69310.00 LL20=62792.30 sides=LS
```

**Ultima accao**

```
2026-08-21 02:07:26,521 [INFO] [both] Long opened. Initial stop 68763.89 (6.2% away).
```

**Ultimas 10 decisoes**

```
2026-08-12 02:07:17,156 [INFO] [both] Close=63572.00 SMA200=69880.03 ATR=1395.81 regime=DOWN (prev DOWN) HH20=66082.00 LL20=62792.30 sides=LS
2026-08-13 02:07:25,350 [INFO] [both] Close=63454.70 SMA200=69751.40 ATR=1379.47 regime=DOWN (prev DOWN) HH20=65375.10 LL20=62792.30 sides=LS
2026-08-14 02:07:18,029 [INFO] [both] Close=63456.70 SMA200=69635.54 ATR=1365.98 regime=DOWN (prev DOWN) HH20=65375.10 LL20=62792.30 sides=LS
2026-08-15 02:07:14,826 [INFO] [both] Close=63015.00 SMA200=69509.11 ATR=1347.76 regime=DOWN (prev DOWN) HH20=65375.10 LL20=62792.30 sides=LS
2026-08-16 02:07:13,748 [INFO] [both] Close=63053.90 SMA200=69378.39 ATR=1271.48 regime=DOWN (prev DOWN) HH20=65375.10 LL20=62792.30 sides=LS
2026-08-17 02:07:24,282 [INFO] [both] Close=62876.00 SMA200=69246.46 ATR=1229.87 regime=DOWN (prev DOWN) HH20=64928.50 LL20=62792.30 sides=LS
2026-08-18 02:07:25,500 [INFO] [both] Close=64504.10 SMA200=69145.96 ATR=1276.08 regime=DOWN (prev DOWN) HH20=64928.50 LL20=62792.30 sides=LS
2026-08-19 02:07:10,484 [INFO] [both] Close=64694.00 SMA200=69048.37 ATR=1261.99 regime=DOWN (prev DOWN) HH20=64928.50 LL20=62792.30 sides=LS
2026-08-20 02:07:26,943 [INFO] [both] Close=69310.00 SMA200=69001.39 ATR=1623.18 regime=DOWN (prev DOWN) HH20=64928.50 LL20=62792.30 sides=LS
2026-08-21 02:07:26,515 [INFO] [both] Close=72998.70 SMA200=68981.72 ATR=1829.92 regime=UP (prev DOWN) HH20=69310.00 LL20=62792.30 sides=LS
```

> Equity, quantidade, preco de entrada e stop NAO sao publicados
> aqui (o repo e publico). Estao no output do job deste workflow.
>
> `HH20`/`LL20` sao extremos de FECHOS diarios, nao de maximos
> e minimos intraday. Comparar com wicks de um grafico da uma
> fasquia diferente da que o bot usa.
