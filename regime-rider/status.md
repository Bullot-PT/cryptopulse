# Regime Rider — estado das 3 instancias na VPS

_Gerado por `vps-bot-log.yml`. Nao editar a mao._

| campo | valor |
|---|---|
| Snapshot (UTC) | 2026-08-03 04:01:22 |
| Timer | active |
| Proxima corrida | Tue 2026-08-04 02:07:00 CEST  20h Mon 20 |
| Ultima corrida terminou | Mon 2026-08-03 02:07:21 CEST |

## Resumo

| instancia | longs | shorts | corridas | em posicao | lado | kill switch | dry_run | chaves |
|---|---|---|---|---|---|---|---|---|
| **long** | true | false | 9 | false | - | false | true | nao |
| **short** | false | true | 8 | false | - | false | true | nao |
| **both** | true | true | 8 | false | - | false | true | nao |

## long

**Ultima linha de decisao**

```
2026-08-03 02:07:14,956 [INFO] [long] Close=63550.00 SMA200=71132.84 ATR=1649.58 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62307.00 sides=L
```

**Ultima accao**

```
2026-08-03 02:07:14,956 [INFO] [long] Flat, no signal. Done.
```

**Ultimas 10 decisoes**

```
2026-07-28 10:58:21,543 [INFO] Close=63720.80 SMA200=72001.63 ATR=1709.58 regime=DOWN (prev DOWN) HH20=66522.40
2026-07-28 11:43:25,400 [INFO] [long] Close=63720.80 SMA200=72001.63 ATR=1709.58 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62255.30 sides=L
2026-07-28 12:37:13,750 [INFO] [long] Close=63720.80 SMA200=72001.63 ATR=1709.58 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62255.30 sides=L
2026-07-29 02:07:19,823 [INFO] [long] Close=63903.60 SMA200=71868.13 ATR=1689.21 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62255.30 sides=L
2026-07-30 02:07:19,289 [INFO] [long] Close=63958.90 SMA200=71735.58 ATR=1674.40 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62307.00 sides=L
2026-07-31 02:07:03,579 [INFO] [long] Close=64750.00 SMA200=71604.51 ATR=1667.70 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62307.00 sides=L
2026-08-01 02:07:07,839 [INFO] [long] Close=62859.90 SMA200=71462.54 ATR=1761.49 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62307.00 sides=L
2026-08-02 02:07:12,710 [INFO] [long] Close=62792.30 SMA200=71299.63 ATR=1699.80 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62307.00 sides=L
2026-08-03 02:07:14,956 [INFO] [long] Close=63550.00 SMA200=71132.84 ATR=1649.58 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62307.00 sides=L
```

## short

**Ultima linha de decisao**

```
2026-08-03 02:07:18,246 [INFO] [short] Close=63550.00 SMA200=71132.84 ATR=1649.58 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62307.00 sides=S
```

**Ultima accao**

```
2026-08-03 02:07:18,246 [INFO] [short] Flat, no signal. Done.
```

**Ultimas 10 decisoes**

```
2026-07-28 11:43:27,765 [INFO] [short] Close=63720.80 SMA200=72001.63 ATR=1709.58 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62255.30 sides=S
2026-07-28 12:37:16,199 [INFO] [short] Close=63720.80 SMA200=72001.63 ATR=1709.58 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62255.30 sides=S
2026-07-29 02:07:22,391 [INFO] [short] Close=63903.60 SMA200=71868.13 ATR=1689.21 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62255.30 sides=S
2026-07-30 02:07:21,825 [INFO] [short] Close=63958.90 SMA200=71735.58 ATR=1674.40 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62307.00 sides=S
2026-07-31 02:07:05,922 [INFO] [short] Close=64750.00 SMA200=71604.51 ATR=1667.70 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62307.00 sides=S
2026-08-01 02:07:10,487 [INFO] [short] Close=62859.90 SMA200=71462.54 ATR=1761.49 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62307.00 sides=S
2026-08-02 02:07:17,324 [INFO] [short] Close=62792.30 SMA200=71299.63 ATR=1699.80 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62307.00 sides=S
2026-08-03 02:07:18,246 [INFO] [short] Close=63550.00 SMA200=71132.84 ATR=1649.58 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62307.00 sides=S
```

## both

**Ultima linha de decisao**

```
2026-08-03 02:07:20,706 [INFO] [both] Close=63550.00 SMA200=71132.84 ATR=1649.58 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62307.00 sides=LS
```

**Ultima accao**

```
2026-08-03 02:07:20,707 [INFO] [both] Flat, no signal. Done.
```

**Ultimas 10 decisoes**

```
2026-07-28 11:43:29,875 [INFO] [both] Close=63720.80 SMA200=72001.63 ATR=1709.58 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62255.30 sides=LS
2026-07-28 12:37:18,599 [INFO] [both] Close=63720.80 SMA200=72001.63 ATR=1709.58 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62255.30 sides=LS
2026-07-29 02:07:24,999 [INFO] [both] Close=63903.60 SMA200=71868.13 ATR=1689.21 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62255.30 sides=LS
2026-07-30 02:07:24,336 [INFO] [both] Close=63958.90 SMA200=71735.58 ATR=1674.40 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62307.00 sides=LS
2026-07-31 02:07:08,387 [INFO] [both] Close=64750.00 SMA200=71604.51 ATR=1667.70 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62307.00 sides=LS
2026-08-01 02:07:14,056 [INFO] [both] Close=62859.90 SMA200=71462.54 ATR=1761.49 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62307.00 sides=LS
2026-08-02 02:07:19,325 [INFO] [both] Close=62792.30 SMA200=71299.63 ATR=1699.80 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62307.00 sides=LS
2026-08-03 02:07:20,706 [INFO] [both] Close=63550.00 SMA200=71132.84 ATR=1649.58 regime=DOWN (prev DOWN) HH20=66522.40 LL20=62307.00 sides=LS
```

> Equity, quantidade, preco de entrada e stop NAO sao publicados
> aqui (o repo e publico). Estao no output do job deste workflow.
>
> `HH20`/`LL20` sao extremos de FECHOS diarios, nao de maximos
> e minimos intraday. Comparar com wicks de um grafico da uma
> fasquia diferente da que o bot usa.
