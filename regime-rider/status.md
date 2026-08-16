# Regime Rider — estado das 3 instancias na VPS

_Gerado por `vps-bot-log.yml`. Nao editar a mao._

| campo | valor |
|---|---|
| Snapshot (UTC) | 2026-08-16 02:00:02 |
| Timer | active |
| Proxima corrida | Mon 2026-08-17 02:07:00 CEST  22h Sun 20 |
| Ultima corrida terminou | Sun 2026-08-16 02:07:14 CEST |

## Resumo

| instancia | longs | shorts | corridas | em posicao | lado | kill switch | dry_run | chaves |
|---|---|---|---|---|---|---|---|---|
| **long** | true | false | 22 | false | - | false | true | nao |
| **short** | false | true | 21 | false | - | false | true | nao |
| **both** | true | true | 21 | false | - | false | true | nao |

## long

**Ultima linha de decisao**

```
2026-08-16 02:07:07,847 [INFO] [long] Close=63053.90 SMA200=69378.39 ATR=1271.48 regime=DOWN (prev DOWN) HH20=65375.10 LL20=62792.30 sides=L
```

**Ultima accao**

```
2026-08-16 02:07:07,847 [INFO] [long] Flat, no signal. Done.
```

**Ultimas 10 decisoes**

```
2026-08-07 02:07:21,099 [INFO] [long] Close=64300.00 SMA200=70516.41 ATR=1543.53 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62792.30 sides=L
2026-08-08 02:07:19,726 [INFO] [long] Close=64885.40 SMA200=70377.89 ATR=1521.11 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62792.30 sides=L
2026-08-09 02:07:06,258 [INFO] [long] Close=64928.50 SMA200=70260.58 ATR=1439.51 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62792.30 sides=L
2026-08-10 02:07:19,984 [INFO] [long] Close=64867.80 SMA200=70137.86 ATR=1392.59 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62792.30 sides=L
2026-08-11 02:07:09,457 [INFO] [long] Close=63939.30 SMA200=70009.96 ATR=1406.38 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62792.30 sides=L
2026-08-12 02:07:12,664 [INFO] [long] Close=63572.00 SMA200=69880.03 ATR=1395.81 regime=DOWN (prev DOWN) HH20=66082.00 LL20=62792.30 sides=L
2026-08-13 02:07:20,321 [INFO] [long] Close=63454.70 SMA200=69751.40 ATR=1379.47 regime=DOWN (prev DOWN) HH20=65375.10 LL20=62792.30 sides=L
2026-08-14 02:07:11,921 [INFO] [long] Close=63456.70 SMA200=69635.54 ATR=1365.98 regime=DOWN (prev DOWN) HH20=65375.10 LL20=62792.30 sides=L
2026-08-15 02:07:08,219 [INFO] [long] Close=63015.00 SMA200=69509.11 ATR=1347.76 regime=DOWN (prev DOWN) HH20=65375.10 LL20=62792.30 sides=L
2026-08-16 02:07:07,847 [INFO] [long] Close=63053.90 SMA200=69378.39 ATR=1271.48 regime=DOWN (prev DOWN) HH20=65375.10 LL20=62792.30 sides=L
```

## short

**Ultima linha de decisao**

```
2026-08-16 02:07:10,900 [INFO] [short] Close=63053.90 SMA200=69378.39 ATR=1271.48 regime=DOWN (prev DOWN) HH20=65375.10 LL20=62792.30 sides=S
```

**Ultima accao**

```
2026-08-16 02:07:10,908 [INFO] [short] Flat, no signal. Done.
```

**Ultimas 10 decisoes**

```
2026-08-07 02:07:24,141 [INFO] [short] Close=64300.00 SMA200=70516.41 ATR=1543.53 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62792.30 sides=S
2026-08-08 02:07:22,259 [INFO] [short] Close=64885.40 SMA200=70377.89 ATR=1521.11 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62792.30 sides=S
2026-08-09 02:07:08,911 [INFO] [short] Close=64928.50 SMA200=70260.58 ATR=1439.51 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62792.30 sides=S
2026-08-10 02:07:22,456 [INFO] [short] Close=64867.80 SMA200=70137.86 ATR=1392.59 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62792.30 sides=S
2026-08-11 02:07:11,931 [INFO] [short] Close=63939.30 SMA200=70009.96 ATR=1406.38 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62792.30 sides=S
2026-08-12 02:07:14,899 [INFO] [short] Close=63572.00 SMA200=69880.03 ATR=1395.81 regime=DOWN (prev DOWN) HH20=66082.00 LL20=62792.30 sides=S
2026-08-13 02:07:22,829 [INFO] [short] Close=63454.70 SMA200=69751.40 ATR=1379.47 regime=DOWN (prev DOWN) HH20=65375.10 LL20=62792.30 sides=S
2026-08-14 02:07:15,295 [INFO] [short] Close=63456.70 SMA200=69635.54 ATR=1365.98 regime=DOWN (prev DOWN) HH20=65375.10 LL20=62792.30 sides=S
2026-08-15 02:07:11,431 [INFO] [short] Close=63015.00 SMA200=69509.11 ATR=1347.76 regime=DOWN (prev DOWN) HH20=65375.10 LL20=62792.30 sides=S
2026-08-16 02:07:10,900 [INFO] [short] Close=63053.90 SMA200=69378.39 ATR=1271.48 regime=DOWN (prev DOWN) HH20=65375.10 LL20=62792.30 sides=S
```

## both

**Ultima linha de decisao**

```
2026-08-16 02:07:13,748 [INFO] [both] Close=63053.90 SMA200=69378.39 ATR=1271.48 regime=DOWN (prev DOWN) HH20=65375.10 LL20=62792.30 sides=LS
```

**Ultima accao**

```
2026-08-16 02:07:13,748 [INFO] [both] Flat, no signal. Done.
```

**Ultimas 10 decisoes**

```
2026-08-07 02:07:27,136 [INFO] [both] Close=64300.00 SMA200=70516.41 ATR=1543.53 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62792.30 sides=LS
2026-08-08 02:07:24,864 [INFO] [both] Close=64885.40 SMA200=70377.89 ATR=1521.11 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62792.30 sides=LS
2026-08-09 02:07:11,827 [INFO] [both] Close=64928.50 SMA200=70260.58 ATR=1439.51 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62792.30 sides=LS
2026-08-10 02:07:24,986 [INFO] [both] Close=64867.80 SMA200=70137.86 ATR=1392.59 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62792.30 sides=LS
2026-08-11 02:07:14,508 [INFO] [both] Close=63939.30 SMA200=70009.96 ATR=1406.38 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62792.30 sides=LS
2026-08-12 02:07:17,156 [INFO] [both] Close=63572.00 SMA200=69880.03 ATR=1395.81 regime=DOWN (prev DOWN) HH20=66082.00 LL20=62792.30 sides=LS
2026-08-13 02:07:25,350 [INFO] [both] Close=63454.70 SMA200=69751.40 ATR=1379.47 regime=DOWN (prev DOWN) HH20=65375.10 LL20=62792.30 sides=LS
2026-08-14 02:07:18,029 [INFO] [both] Close=63456.70 SMA200=69635.54 ATR=1365.98 regime=DOWN (prev DOWN) HH20=65375.10 LL20=62792.30 sides=LS
2026-08-15 02:07:14,826 [INFO] [both] Close=63015.00 SMA200=69509.11 ATR=1347.76 regime=DOWN (prev DOWN) HH20=65375.10 LL20=62792.30 sides=LS
2026-08-16 02:07:13,748 [INFO] [both] Close=63053.90 SMA200=69378.39 ATR=1271.48 regime=DOWN (prev DOWN) HH20=65375.10 LL20=62792.30 sides=LS
```

> Equity, quantidade, preco de entrada e stop NAO sao publicados
> aqui (o repo e publico). Estao no output do job deste workflow.
>
> `HH20`/`LL20` sao extremos de FECHOS diarios, nao de maximos
> e minimos intraday. Comparar com wicks de um grafico da uma
> fasquia diferente da que o bot usa.
