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
  timeout -k 15 240 node oi-signal.mjs || echo "passagem falhou — continuo na próxima"
done
