#!/usr/bin/env bash
# Avisa se o bot DEIXOU de correr. Existe por causa do historico: na maquina
# do Windows o bot esteve 5 dias sem correr e ninguem deu por isso, porque um
# bot parado nao se queixa. Este e o unico alerta que fala pela ausencia.
#
# Limite: cobre "o bot parou mas a VPS esta viva". Se a VPS morrer toda, nem
# isto corre — nesse caso o sinal e os workflows do GitHub ficarem presos na
# fila.
set -u
MAXAGE=${1:-93600}          # 26h — folga de 2h sobre a cadencia diaria
NOW=$(date +%s)
STALE=""
for V in long short both; do
  LOG=/opt/regime-rider/$V/bot.log
  if [ ! -f "$LOG" ]; then
    STALE="${STALE}
- ${V}: sem log nenhum"
    continue
  fi
  AGE=$(( NOW - $(stat -c %Y "$LOG") ))
  if [ "$AGE" -gt "$MAXAGE" ]; then
    STALE="${STALE}
- ${V}: sem corrida ha $((AGE / 3600))h"
  fi
done
if [ -n "$STALE" ]; then
  /opt/regime-rider/notify.sh "AVISO: o regime-rider deixou de correr${STALE}

Proxima corrida esperada: 00:07 UTC.
Verificar: systemctl status regime-rider.timer"
else
  echo "watchdog: as 3 instancias correram nas ultimas $((MAXAGE / 3600))h"
fi
exit 0
