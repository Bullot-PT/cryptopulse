# Regime Rider — estado das 3 instancias na VPS

_Gerado por `vps-bot-log.yml`. Nao editar a mao._

| campo | valor |
|---|---|
| Snapshot (UTC) | 2026-08-13 03:02:57 |
| Timer | active |
| Proxima corrida | Fri 2026-08-14 02:07:00 CEST  21h Thu 20 |
| Ultima corrida terminou | Thu 2026-08-13 02:07:25 CEST |

## Resumo

| instancia | longs | shorts | corridas | em posicao | lado | kill switch | dry_run | chaves |
|---|---|---|---|---|---|---|---|---|
| **long** | true | false | 19 | false | - | false | true | nao |
| **short** | false | true | 18 | false | - | false | true | nao |
| **both** | true | true | 18 | false | - | false | true | nao |

## long

**Ultima linha de decisao**

```
2026-08-13 02:07:20,321 [INFO] [long] Close=63454.70 SMA200=69751.40 ATR=1379.47 regime=DOWN (prev DOWN) HH20=65375.10 LL20=62792.30 sides=L
```

**Ultima accao**

```
2026-08-13 02:07:20,325 [INFO] [long] Flat, no signal. Done.
```

**Ultimas 10 decisoes**

```
2026-08-04 02:07:19,346 [INFO] [long] Close=63497.20 SMA200=70972.49 ATR=1659.65 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62792.30 sides=L
2026-08-05 02:07:12,853 [INFO] [long] Close=64075.50 SMA200=70815.35 ATR=1628.44 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62792.30 sides=L
2026-08-06 02:07:04,392 [INFO] [long] Close=64633.90 SMA200=70662.98 ATR=1596.05 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62792.30 sides=L
2026-08-07 02:07:21,099 [INFO] [long] Close=64300.00 SMA200=70516.41 ATR=1543.53 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62792.30 sides=L
2026-08-08 02:07:19,726 [INFO] [long] Close=64885.40 SMA200=70377.89 ATR=1521.11 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62792.30 sides=L
2026-08-09 02:07:06,258 [INFO] [long] Close=64928.50 SMA200=70260.58 ATR=1439.51 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62792.30 sides=L
2026-08-10 02:07:19,984 [INFO] [long] Close=64867.80 SMA200=70137.86 ATR=1392.59 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62792.30 sides=L
2026-08-11 02:07:09,457 [INFO] [long] Close=63939.30 SMA200=70009.96 ATR=1406.38 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62792.30 sides=L
2026-08-12 02:07:12,664 [INFO] [long] Close=63572.00 SMA200=69880.03 ATR=1395.81 regime=DOWN (prev DOWN) HH20=66082.00 LL20=62792.30 sides=L
2026-08-13 02:07:20,321 [INFO] [long] Close=63454.70 SMA200=69751.40 ATR=1379.47 regime=DOWN (prev DOWN) HH20=65375.10 LL20=62792.30 sides=L
```

## short

**Ultima linha de decisao**

```
2026-08-13 02:07:22,829 [INFO] [short] Close=63454.70 SMA200=69751.40 ATR=1379.47 regime=DOWN (prev DOWN) HH20=65375.10 LL20=62792.30 sides=S
```

**Ultima accao**

```
2026-08-13 02:07:22,831 [INFO] [short] Flat, no signal. Done.
```

**Ultimas 10 decisoes**

```
2026-08-04 02:07:21,795 [INFO] [short] Close=63497.20 SMA200=70972.49 ATR=1659.65 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62792.30 sides=S
2026-08-05 02:07:15,310 [INFO] [short] Close=64075.50 SMA200=70815.35 ATR=1628.44 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62792.30 sides=S
2026-08-06 02:07:06,569 [INFO] [short] Close=64633.90 SMA200=70662.98 ATR=1596.05 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62792.30 sides=S
2026-08-07 02:07:24,141 [INFO] [short] Close=64300.00 SMA200=70516.41 ATR=1543.53 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62792.30 sides=S
2026-08-08 02:07:22,259 [INFO] [short] Close=64885.40 SMA200=70377.89 ATR=1521.11 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62792.30 sides=S
2026-08-09 02:07:08,911 [INFO] [short] Close=64928.50 SMA200=70260.58 ATR=1439.51 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62792.30 sides=S
2026-08-10 02:07:22,456 [INFO] [short] Close=64867.80 SMA200=70137.86 ATR=1392.59 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62792.30 sides=S
2026-08-11 02:07:11,931 [INFO] [short] Close=63939.30 SMA200=70009.96 ATR=1406.38 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62792.30 sides=S
2026-08-12 02:07:14,899 [INFO] [short] Close=63572.00 SMA200=69880.03 ATR=1395.81 regime=DOWN (prev DOWN) HH20=66082.00 LL20=62792.30 sides=S
2026-08-13 02:07:22,829 [INFO] [short] Close=63454.70 SMA200=69751.40 ATR=1379.47 regime=DOWN (prev DOWN) HH20=65375.10 LL20=62792.30 sides=S
```

## both

**Ultima linha de decisao**

```
2026-08-13 02:07:25,350 [INFO] [both] Close=63454.70 SMA200=69751.40 ATR=1379.47 regime=DOWN (prev DOWN) HH20=65375.10 LL20=62792.30 sides=LS
```

**Ultima accao**

```
2026-08-13 02:07:25,351 [INFO] [both] Flat, no signal. Done.
```

**Ultimas 10 decisoes**

```
2026-08-04 02:07:24,993 [INFO] [both] Close=63497.20 SMA200=70972.49 ATR=1659.65 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62792.30 sides=LS
2026-08-05 02:07:18,403 [INFO] [both] Close=64075.50 SMA200=70815.35 ATR=1628.44 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62792.30 sides=LS
2026-08-06 02:07:08,837 [INFO] [both] Close=64633.90 SMA200=70662.98 ATR=1596.05 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62792.30 sides=LS
2026-08-07 02:07:27,136 [INFO] [both] Close=64300.00 SMA200=70516.41 ATR=1543.53 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62792.30 sides=LS
2026-08-08 02:07:24,864 [INFO] [both] Close=64885.40 SMA200=70377.89 ATR=1521.11 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62792.30 sides=LS
2026-08-09 02:07:11,827 [INFO] [both] Close=64928.50 SMA200=70260.58 ATR=1439.51 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62792.30 sides=LS
2026-08-10 02:07:24,986 [INFO] [both] Close=64867.80 SMA200=70137.86 ATR=1392.59 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62792.30 sides=LS
2026-08-11 02:07:14,508 [INFO] [both] Close=63939.30 SMA200=70009.96 ATR=1406.38 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62792.30 sides=LS
2026-08-12 02:07:17,156 [INFO] [both] Close=63572.00 SMA200=69880.03 ATR=1395.81 regime=DOWN (prev DOWN) HH20=66082.00 LL20=62792.30 sides=LS
2026-08-13 02:07:25,350 [INFO] [both] Close=63454.70 SMA200=69751.40 ATR=1379.47 regime=DOWN (prev DOWN) HH20=65375.10 LL20=62792.30 sides=LS
```

> Equity, quantidade, preco de entrada e stop NAO sao publicados
> aqui (o repo e publico). Estao no output do job deste workflow.
>
> `HH20`/`LL20` sao extremos de FECHOS diarios, nao de maximos
> e minimos intraday. Comparar com wicks de um grafico da uma
> fasquia diferente da que o bot usa.
