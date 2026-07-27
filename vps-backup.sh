#!/bin/sh
# vps-backup.sh — backup do SQLite (book_frames, história p/ backtests 14-ago) para o R2, 4×/dia.
# Chave book-<diaSemana>-<hora>.db.gz → rotação semanal automática (máx. 28 objectos, sem deletes,
# sem listagens — Class A ops mínimas). .backup do sqlite3 = cópia consistente com o daemon a escrever.
# Env (R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / CF_ACCOUNT_ID) via systemd EnvironmentFile.
set -eu
DB=/opt/cryptomacho/data.db
OUT=/tmp/cryptomacho-backup.db
[ -f "$DB" ] || { echo "sem base de dados em $DB — nada para copiar"; exit 0; }
sqlite3 "$DB" ".backup '$OUT'"
gzip -f "$OUT"
KEY="book-$(date -u +%u-%H).db.gz"
export RCLONE_CONFIG_R2_TYPE=s3
export RCLONE_CONFIG_R2_PROVIDER=Cloudflare
export RCLONE_CONFIG_R2_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID"
export RCLONE_CONFIG_R2_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY"
export RCLONE_CONFIG_R2_ENDPOINT="https://${CF_ACCOUNT_ID}.r2.cloudflarestorage.com"
rclone copyto --s3-no-check-bucket "$OUT.gz" "r2:cryptomacho-backups/$KEY"
echo "backup ok: $KEY ($(du -h "$OUT.gz" | cut -f1))"
rm -f "$OUT.gz"
