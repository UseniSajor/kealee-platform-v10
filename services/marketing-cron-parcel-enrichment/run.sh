#!/bin/sh
set -eu
: "${CRON_SECRET:?CRON_SECRET is required}"
: "${APP_URL:?APP_URL is required (e.g. https://kealee.com)}"
curl -fsS -X POST -H "Authorization: Bearer ${CRON_SECRET}" "${APP_URL}/api/cron/parcel-enrichment"
echo ""
echo "[marketing-cron-parcel-enrichment] ok $(date -u +%Y-%m-%dT%H:%M:%SZ)"
