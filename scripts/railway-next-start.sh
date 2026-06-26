#!/bin/sh
set -e

# Start a Next.js standalone app built under apps/<name>/.next/standalone/apps/<name>/server.js
# Usage: railway-next-start.sh <app-name>  (e.g. web-main, portal-owner)

APP_NAME="${1:?app name required}"
APP_DIR="/app/apps/${APP_NAME}"

export NEXT_PUBLIC_SUPABASE_URL="${SUPABASE_URL:-$NEXT_PUBLIC_SUPABASE_URL}"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-$NEXT_PUBLIC_SUPABASE_ANON_KEY}"
export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export PORT="${PORT:-3000}"

SERVER="${APP_DIR}/.next/standalone/apps/${APP_NAME}/server.js"
if [ ! -f "$SERVER" ]; then
  SERVER=$(find "${APP_DIR}/.next/standalone/apps" -name server.js -print -quit 2>/dev/null || true)
fi

if [ -z "$SERVER" ] || [ ! -f "$SERVER" ]; then
  echo "standalone server.js not found for ${APP_NAME}"
  find /app/apps -path '*/.next/standalone/apps/*/server.js' 2>/dev/null || true
  exit 1
fi

SDIR=$(dirname "$SERVER")
if [ ! -d "${SDIR}/.next/static/chunks" ]; then
  echo "Healing static assets for ${APP_NAME}"
  mkdir -p "${SDIR}/.next/static" "${SDIR}/public"
  cp -r "${APP_DIR}/.next/static/." "${SDIR}/.next/static/" 2>/dev/null || true
  cp -r "${APP_DIR}/public/." "${SDIR}/public/" 2>/dev/null || true
fi

echo "Starting ${SERVER} on port ${PORT}"
cd "$SDIR"
exec node "$SERVER"
