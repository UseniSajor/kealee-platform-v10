#!/bin/sh
# Build web-main standalone output — monorepo root or apps/web-main service root.
set -eu

copy_standalone_assets() {
  base="$1"
  mkdir -p "$base/.next/standalone/public"
  cp -r "$base/public/." "$base/.next/standalone/public/" 2>/dev/null || true
  mkdir -p "$base/.next/standalone/.next/static"
  cp -r "$base/.next/static/." "$base/.next/standalone/.next/static/" 2>/dev/null || true
}

if [ -f "../../pnpm-workspace.yaml" ] || [ -f "../pnpm-workspace.yaml" ]; then
  # Railway root directory = apps/web-main
  cd ../..
  corepack enable 2>/dev/null || true
  corepack prepare pnpm@8.15.9 --activate 2>/dev/null || true
  pnpm install --no-frozen-lockfile
  pnpm turbo run build --filter=web-main
  copy_standalone_assets "apps/web-main"
elif [ -f "pnpm-workspace.yaml" ]; then
  # Railway root directory = repo root
  corepack enable 2>/dev/null || true
  corepack prepare pnpm@8.15.9 --activate 2>/dev/null || true
  pnpm install --no-frozen-lockfile
  pnpm turbo run build --filter=web-main
  copy_standalone_assets "apps/web-main"
elif [ -f "package.json" ] && [ -f "next.config.js" ]; then
  # Isolated app directory only
  pnpm install --no-frozen-lockfile 2>/dev/null || npm install
  pnpm run build 2>/dev/null || npm run build
  copy_standalone_assets "."
else
  echo "ERROR: cannot locate web-main build context" >&2
  exit 1
fi
