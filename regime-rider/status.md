# Regime Rider — estado das 3 instancias na VPS

_Gerado por `vps-bot-log.yml`. Nao editar a mao._

| campo | valor |
|---|---|
| Snapshot (UTC) | 2026-07-28 09:46:19 |
| Timer | active |
| Proxima corrida | Wed 2026-07-29 02:07:00 CEST  14h Tue 20 |
| Ultima corrida terminou | Tue 2026-07-28 11:43:30 CEST |

## Resumo

| instancia | longs | shorts | corridas | em posicao | lado | kill switch | dry_run | chaves |
|---|---|---|---|---|---|---|---|---|
| **long** | true | false | 2 | false | - | false | true | nao |
| **short** | false | true | 1 | false | - | false | true | nao |
| **both** | true | true | 1 | false | - | false | true | nao |

## long

**Ultima linha de decisao**

```
2026-07-28 11:43:25,400 [INFO] [long] Close=63720.80 SMA200=72001.63 ATR=1709.58 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62255.30 sides=L
```

**Ultima accao**

```
2026-07-28 11:43:25,599 [INFO] [long] Flat, no signal. Done.
```

**Ultimas 10 decisoes**

```
2026-07-28 10:58:21,543 [INFO] Close=63720.80 SMA200=72001.63 ATR=1709.58 regime=DOWN (prev DOWN) HH20=66522.40
2026-07-28 11:43:25,400 [INFO] [long] Close=63720.80 SMA200=72001.63 ATR=1709.58 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62255.30 sides=L
```

## short

**Ultima linha de decisao**

```
2026-07-28 11:43:27,765 [INFO] [short] Close=63720.80 SMA200=72001.63 ATR=1709.58 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62255.30 sides=S
```

**Ultima accao**

```
2026-07-28 11:43:27,766 [INFO] [short] Flat, no signal. Done.
```

**Ultimas 10 decisoes**

```
2026-07-28 11:43:27,765 [INFO] [short] Close=63720.80 SMA200=72001.63 ATR=1709.58 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62255.30 sides=S
```

## both

**Ultima linha de decisao**

```
2026-07-28 11:43:29,875 [INFO] [both] Close=63720.80 SMA200=72001.63 ATR=1709.58 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62255.30 sides=LS
```

**Ultima accao**

```
2026-07-28 11:43:29,877 [INFO] [both] Flat, no signal. Done.
```

**Ultimas 10 decisoes**

```
2026-07-28 11:43:29,875 [INFO] [both] Close=63720.80 SMA200=72001.63 ATR=1709.58 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62255.30 sides=LS
```

> Equity, quantidade, preco de entrada e stop NAO sao publicados
> aqui (o repo e publico). Estao no output do job deste workflow.
>
> `HH20`/`LL20` sao extremos de FECHOS diarios, nao de maximos
> e minimos intraday. Comparar com wicks de um grafico da uma
> fasquia diferente da que o bot usa.
