#!/bin/sh
set -eu
: "${CRON_SECRET:?CRON_SECRET is required}"
: "${APP_URL:?APP_URL is required (e.g. https://www.kealee.com)}"
curl -fsS -H "Authorization: Bearer ${CRON_SECRET}" "${APP_URL}/api/cron/reddit"
echo ""
echo "[marketing-cron-reddit] ok $(date -u +%Y-%m-%dT%H:%M:%SZ)"
