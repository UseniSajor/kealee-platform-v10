#!/bin/sh
# Start Next.js standalone — works from apps/web-main root OR monorepo root.
set -eu

export NEXT_PUBLIC_SUPABASE_URL="${SUPABASE_URL:-}"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-}"
export HOSTNAME="${HOSTNAME:-0.0.0.0}"

if [ -f ".next/standalone/server.js" ]; then
  exec node .next/standalone/server.js
fi

if [ -f "apps/web-main/.next/standalone/server.js" ]; then
  exec node apps/web-main/.next/standalone/server.js
fi

echo "ERROR: Next.js standalone server.js not found" >&2
ls -la .next/standalone 2>/dev/null || true
ls -la apps/web-main/.next/standalone 2>/dev/null || true
exit 1
