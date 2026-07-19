#!/bin/sh
set -eu
: "${CRON_SECRET:?CRON_SECRET is required}"
: "${APP_URL:?APP_URL is required (e.g. https://kealee.com)}"
curl -fsS -H "Authorization: Bearer ${CRON_SECRET}" "${APP_URL}/api/cron/facebook"
echo ""
echo "[marketing-cron-facebook] ok $(date -u +%Y-%m-%dT%H:%M:%SZ)"
