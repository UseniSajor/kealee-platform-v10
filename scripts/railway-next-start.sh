#!/bin/sh
set -e

# Start a Next.js standalone app for Railway monorepo services.
# Uses RAILWAY_SERVICE_NAME when no argument is passed (root railway.toml).
# Falls back to the API entrypoint for non-Next services.

APP_NAME="${1:-$RAILWAY_SERVICE_NAME}"
if [ -z "$APP_NAME" ]; then
  echo "railway-next-start: app name required (arg or RAILWAY_SERVICE_NAME)"
  exit 1
fi

# portal-owner is the legacy Railway service name; project-owner is canonical.
if [ "$APP_NAME" = "portal-owner" ]; then APP_NAME="project-owner"; fi

export NEXT_PUBLIC_SUPABASE_URL="${SUPABASE_URL:-$NEXT_PUBLIC_SUPABASE_URL}"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-$NEXT_PUBLIC_SUPABASE_ANON_KEY}"
export HOSTNAME=0.0.0.0
export PORT="${PORT:-3000}"

if [ "$APP_NAME" = "worker" ]; then
  echo "Starting @kealee/worker (BullMQ job processor)"
  cd /app/services/worker
  exec node dist/index.js
fi

if [ "$APP_NAME" = "engineering-worker" ]; then
  echo "Starting @kealee/engineering-worker (isolated GIS/BIM processor)"
  cd /app
  exec node services/engineering-worker/dist/index.js
fi

APP_DIR="/app/apps/${APP_NAME}"
SERVER="${APP_DIR}/.next/standalone/apps/${APP_NAME}/server.js"

if [ ! -f "$SERVER" ]; then
  SERVER=$(find "${APP_DIR}/.next/standalone/apps" -name server.js -print -quit 2>/dev/null || true)
fi

if [ -z "$SERVER" ] || [ ! -f "$SERVER" ]; then
  # Not a Next standalone build — try any Next app in the image, then API.
  SERVER=$(find /app/apps -path '*/.next/standalone/apps/*/server.js' -print -quit 2>/dev/null || true)
fi

if [ -n "$SERVER" ] && [ -f "$SERVER" ]; then
  SDIR=$(dirname "$SERVER")
  APP_DIR=$(echo "$SERVER" | sed 's#/\.next/standalone/.*##')
  if [ ! -d "${SDIR}/.next/static/chunks" ]; then
    echo "Healing static assets for ${APP_NAME}"
    mkdir -p "${SDIR}/.next/static" "${SDIR}/public"
    cp -r "${APP_DIR}/.next/static/." "${SDIR}/.next/static/" 2>/dev/null || true
    cp -r "${APP_DIR}/public/." "${SDIR}/public/" 2>/dev/null || true
  fi
  echo "Starting ${SERVER} on port ${PORT} (service=${APP_NAME})"
  cd "$SDIR"
  exec node "$SERVER"
fi

echo "No Next standalone server.js for ${APP_NAME}; starting API"
cd /app/services/api
exec node dist/index.js
