#!/usr/bin/env bash
# Envia uma mensagem para o Telegram do Bullot.
# Credenciais em /opt/regime-rider/telegram.env (chmod 600), escritas pelo
# workflow de deploy a partir dos GitHub Secrets. NUNCA impressas.
# Falha em silencio se nao houver credenciais — um alerta que nao sai nunca
# pode partir o bot.
set -u
ENVF=/opt/regime-rider/telegram.env
[ -f "$ENVF" ] || { echo "notify: sem telegram.env — ignorado"; exit 0; }
# shellcheck disable=SC1090
. "$ENVF"
if [ -z "${TELEGRAM_TOKEN:-}" ] || [ -z "${TELEGRAM_CHAT:-}" ]; then
  echo "notify: credenciais vazias — ignorado"; exit 0
fi
TEXT="${1:-}"
[ -n "$TEXT" ] || exit 0
curl -s -o /dev/null -w "telegram: HTTP %{http_code}\n" --max-time 20 \
  -X POST "https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage" \
  --data-urlencode "chat_id=${TELEGRAM_CHAT}" \
  --data-urlencode "text=${TEXT}" \
  --data-urlencode "disable_web_page_preview=true"
exit 0
