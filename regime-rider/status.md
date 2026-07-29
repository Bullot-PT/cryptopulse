# Regime Rider — estado das 3 instancias na VPS

_Gerado por `vps-bot-log.yml`. Nao editar a mao._

| campo | valor |
|---|---|
| Snapshot (UTC) | 2026-07-29 03:45:47 |
| Timer | active |
| Proxima corrida | Thu 2026-07-30 02:07:00 CEST  20h Wed 20 |
| Ultima corrida terminou | Wed 2026-07-29 02:07:25 CEST |

## Resumo

| instancia | longs | shorts | corridas | em posicao | lado | kill switch | dry_run | chaves |
|---|---|---|---|---|---|---|---|---|
| **long** | true | false | 4 | false | - | false | true | nao |
| **short** | false | true | 3 | false | - | false | true | nao |
| **both** | true | true | 3 | false | - | false | true | nao |

## long

**Ultima linha de decisao**

```
2026-07-29 02:07:19,823 [INFO] [long] Close=63903.60 SMA200=71868.13 ATR=1689.21 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62255.30 sides=L
```

**Ultima accao**

```
2026-07-29 02:07:19,823 [INFO] [long] Flat, no signal. Done.
```

**Ultimas 10 decisoes**

```
2026-07-28 10:58:21,543 [INFO] Close=63720.80 SMA200=72001.63 ATR=1709.58 regime=DOWN (prev DOWN) HH20=66522.40
2026-07-28 11:43:25,400 [INFO] [long] Close=63720.80 SMA200=72001.63 ATR=1709.58 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62255.30 sides=L
2026-07-28 12:37:13,750 [INFO] [long] Close=63720.80 SMA200=72001.63 ATR=1709.58 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62255.30 sides=L
2026-07-29 02:07:19,823 [INFO] [long] Close=63903.60 SMA200=71868.13 ATR=1689.21 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62255.30 sides=L
```

## short

**Ultima linha de decisao**

```
2026-07-29 02:07:22,391 [INFO] [short] Close=63903.60 SMA200=71868.13 ATR=1689.21 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62255.30 sides=S
```

**Ultima accao**

```
2026-07-29 02:07:22,392 [INFO] [short] Flat, no signal. Done.
```

**Ultimas 10 decisoes**

```
2026-07-28 11:43:27,765 [INFO] [short] Close=63720.80 SMA200=72001.63 ATR=1709.58 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62255.30 sides=S
2026-07-28 12:37:16,199 [INFO] [short] Close=63720.80 SMA200=72001.63 ATR=1709.58 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62255.30 sides=S
2026-07-29 02:07:22,391 [INFO] [short] Close=63903.60 SMA200=71868.13 ATR=1689.21 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62255.30 sides=S
```

## both

**Ultima linha de decisao**

```
2026-07-29 02:07:24,999 [INFO] [both] Close=63903.60 SMA200=71868.13 ATR=1689.21 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62255.30 sides=LS
```

**Ultima accao**

```
2026-07-29 02:07:24,999 [INFO] [both] Flat, no signal. Done.
```

**Ultimas 10 decisoes**

```
2026-07-28 11:43:29,875 [INFO] [both] Close=63720.80 SMA200=72001.63 ATR=1709.58 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62255.30 sides=LS
2026-07-28 12:37:18,599 [INFO] [both] Close=63720.80 SMA200=72001.63 ATR=1709.58 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62255.30 sides=LS
2026-07-29 02:07:24,999 [INFO] [both] Close=63903.60 SMA200=71868.13 ATR=1689.21 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62255.30 sides=LS
```

> Equity, quantidade, preco de entrada e stop NAO sao publicados
> aqui (o repo e publico). Estao no output do job deste workflow.
>
> `HH20`/`LL20` sao extremos de FECHOS diarios, nao de maximos
> e minimos intraday. Comparar com wicks de um grafico da uma
> fasquia diferente da que o bot usa.
