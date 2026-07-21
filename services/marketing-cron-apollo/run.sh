#!/bin/sh
set -eu
: "${CRON_SECRET:?CRON_SECRET is required}"
: "${APP_URL:?APP_URL is required}"
curl -fsS -H "Authorization: Bearer ${CRON_SECRET}" "${APP_URL}/api/cron/apollo-import"
echo ""
echo "[marketing-cron-apollo] ok $(date -u +%Y-%m-%dT%H:%M:%SZ)"
