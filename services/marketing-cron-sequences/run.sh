#!/bin/sh
set -eu
: "${CRON_SECRET:?CRON_SECRET is required}"
: "${APP_URL:?APP_URL is required (e.g. https://kealee.com)}"
curl -fsS -H "Authorization: Bearer ${CRON_SECRET}" "${APP_URL}/api/cron/sequences"
echo ""
echo "[marketing-cron-sequences] sequences ok $(date -u +%Y-%m-%dT%H:%M:%SZ)"

# Apollo has its own durable six-hour interval, lease, and daily cap. Calling it
# from this existing scheduler avoids a dedicated paid Railway service.
if curl -fsS -H "Authorization: Bearer ${CRON_SECRET}" "${APP_URL}/api/cron/apollo-import"; then
  echo ""
  echo "[marketing-cron-sequences] apollo trigger ok $(date -u +%Y-%m-%dT%H:%M:%SZ)"
else
  echo "[marketing-cron-sequences] apollo trigger failed; see cursor health metrics" >&2
fi
