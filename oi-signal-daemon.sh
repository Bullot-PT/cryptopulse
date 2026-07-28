#!/bin/sh
# oi-signal-daemon.sh — estágio 2: o sinal ao vivo, na VPS, na grelha dos 5 min.
# Corre o oi-signal.mjs logo a seguir ao minuto múltiplo de 5 (a Binance fecha a barra 5m nesse
# instante; esperar 20 s garante que a barra já está fechada e o OI já foi publicado).
# Env pelo EnvironmentFile do systemd: TELEGRAM_TOKEN, TELEGRAM_CHAT, CF_*.
set -u
cd /opt/cryptomacho/signal

while : ; do
  NOW=$(date +%s)
  sleep $(( 300 - (NOW % 300) + 20 ))
  echo "--- pass at $(date -u +%H:%M:%SZ) ---"
  timeout -k 15 200 node oi-signal.mjs || echo "sinal: passagem falhou — continuo na próxima"
  # posicionamento agregado das 6 bolsas — script separado de propósito: se uma bolsa se portar
  # mal, o sinal (que é o que manda Telegram) não fica refém disso.
  timeout -k 15 220 node market-ls.mjs || echo "market-ls: passagem falhou — continuo na próxima"
done
