#!/bin/sh
# oi-daemon.sh — coletor OI 24/7 na VPS (migração 2, 27-jul-2026).
# Substitui a corrente oi-collector/oi-standby das Actions: a cada 5 min (grelha alinhada)
# corre o collect.mjs (tecto 270 s, como no v129) e espelha no KV os ficheiros de data/
# que MUDARAM nesta passagem (+ os 3 quentes sempre) — exactamente a semântica do kv_put
# antigo. O arquivo no git passa a ser o workflow oi-archive.yml (de hora a hora, a partir
# do KV) — o KV é quem serve o site; o git é arquivo/fallback.
# Escritas KV: ≈ iguais a antes (~900-1500/dia). Env via systemd EnvironmentFile.
set -u
cd /opt/cryptomacho/oi

while : ; do
  echo "--- pass at $(date -u +%H:%M:%SZ) ---"
  # o liq-book-lighter.json é escrito pelo coletor Lighter (git/KV) — refrescar a cópia
  # local antes da passagem para o merge não usar dados velhos (na VPS não há checkout novo)
  if curl -s --max-time 20 "https://cryptomacho.io/data/liq-book-lighter.json?b=$(date +%s)" -o data/.lighter.tmp && [ -s data/.lighter.tmp ]; then
    mv data/.lighter.tmp data/liq-book-lighter.json
  fi
  rm -f data/.lighter.tmp

  touch .stamp
  timeout -k 15 270 node collect.mjs || echo "collector saiu com erro/timeout nesta passagem — continuo"

  for p in data/*.json; do
    [ -f "$p" ] || continue
    case "$p" in data/liq-book-lighter.json) continue ;; esac   # é do coletor Lighter, não nosso
    if [ "$p" -nt .stamp ] || [ "$p" = "data/oi-history.json" ] || [ "$p" = "data/hl-pos.json" ] || [ "$p" = "data/alert-log.json" ]; then
      k="${p#data/}"
      code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 30 -X PUT \
        "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESPACE_ID}/values/${k}" \
        -H "Authorization: Bearer ${CF_API_TOKEN}" --data-binary @"$p" || echo 000)
      echo "kv put ${k}: HTTP ${code}"
    fi
  done

  NOW=$(date +%s)
  sleep $(( 300 - (NOW % 300) ))
done
