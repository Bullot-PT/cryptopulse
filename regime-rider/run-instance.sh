#!/usr/bin/env bash
# Corre UMA instancia do bot e avisa no Telegram so quando algo acontece.
#
# O que gera alerta: entrada, saida, stop atingido, kill switch, posicao
# desconhecida na exchange, erro/traceback, ou o proprio bot a falhar.
# O que NAO gera alerta: dias normais sem sinal, e o arrasto rotineiro do
# stop — senao uma tendencia longa enchia o Telegram e o alerta que importa
# passava despercebido.
set -u
V="${1:?uso: run-instance.sh <long|short|both>}"
DIR=/opt/regime-rider/$V
LOG=$DIR/bot.log
PY=/opt/regime-rider/venv/bin/python
BOT=/opt/regime-rider/bot.py
NOTIFY=/opt/regime-rider/notify.sh

BEFORE=0
[ -f "$LOG" ] && BEFORE=$(wc -l < "$LOG")

set +e
"$PY" "$BOT" --dir "$DIR" --tag "$V"
RC=$?
set -e

NEW=""
[ -f "$LOG" ] && NEW=$(tail -n +$((BEFORE + 1)) "$LOG" 2>/dev/null)

if [ "$RC" -ne 0 ]; then
  "$NOTIFY" "$(printf 'FALHA regime-rider [%s] — exit %s\n\n%s' \
      "$V" "$RC" "$(printf '%s' "$NEW" | tail -15)")"
  exit 0
fi

EVENTS=$(printf '%s' "$NEW" | grep -E \
  'ENTRY signal|opened\.|regime_flip|stop was hit|Simulated stop hit|KILL SWITCH|Refusing to act|Traceback|\[ERROR\]' || true)

if [ -n "$EVENTS" ]; then
  DEC=$(printf '%s' "$NEW" | grep -E 'Close=' | tail -1)
  "$NOTIFY" "$(printf 'regime-rider [%s]\n\n%s\n\n%s\n\nEstado: %s' \
      "$V" "$DEC" "$EVENTS" "$(cat "$DIR/state.json" 2>/dev/null | tr -d '\n ')")"
fi
exit 0
