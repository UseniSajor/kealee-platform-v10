FROM node:20-bullseye AS deps

RUN corepack enable && corepack prepare pnpm@8.15.9 --activate

WORKDIR /app

# Populate the pnpm store from the lockfile alone (pnpm fetch needs no
# workspace manifests), so this layer stays cached until dependencies change.
# Copying per-package package.json files with a glob does NOT work here:
# `COPY packages/*/package.json ./packages/` flattens every file into one,
# which breaks `pnpm install --frozen-lockfile` (workspace/lockfile mismatch).
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
RUN pnpm fetch

# Copy sources and link dependencies from the already-populated store.
# Postinstall hooks (e.g. @kealee/database `prisma generate`) run here with
# full sources present, so no separate prisma step is needed before build.
COPY . .
RUN pnpm install --frozen-lockfile --prefer-offline

FROM deps AS builder

# Railway injects the service name as a build arg for Dockerfile deploys.
ARG RAILWAY_SERVICE_NAME
ENV RAILWAY_SERVICE_NAME=$RAILWAY_SERVICE_NAME

# NEXT_PUBLIC_* values are inlined into the client bundle at build time, so
# they must be present here (Railway passes service variables as build args
# for any ARG declared in the Dockerfile). The build still succeeds without
# them; server-side code falls back to runtime env from the start command.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

# Build the right thing for the service. Any Next.js app (apps/<name>/next.config.js)
# is built as a standalone server; the BullMQ worker (services/worker) is its own
# case since it isn't a Next app either; everything else builds the API entrypoint.
# --filter="<name>..." builds the app plus its workspace dependencies; turbo
# cache stays enabled (no --force).
RUN set -eux; \
  echo "RAILWAY_SERVICE_NAME='$RAILWAY_SERVICE_NAME'"; \
  APP_DIR="apps/$RAILWAY_SERVICE_NAME"; \
  if [ -n "$RAILWAY_SERVICE_NAME" ] && { [ -f "$APP_DIR/next.config.js" ] || [ -f "$APP_DIR/next.config.ts" ] || [ -f "$APP_DIR/next.config.mjs" ]; }; then \
      rm -rf "$APP_DIR/.next"; \
      echo "Building Next app $RAILWAY_SERVICE_NAME and dependencies..."; \
      pnpm turbo run build --filter="$RAILWAY_SERVICE_NAME..."; \
      SRV=$(find "$APP_DIR/.next/standalone/apps" -name server.js -print -quit); \
      echo "server.js: $SRV"; \
      test -n "$SRV"; \
      test -f "$SRV"; \
  elif [ "$RAILWAY_SERVICE_NAME" = "worker" ]; then \
      echo "Building @kealee/worker (BullMQ job processor)..."; \
      pnpm --filter @kealee/worker... build; \
      test -f services/worker/dist/index.js; \
  else \
      echo "No Next app for '$RAILWAY_SERVICE_NAME' — building @kealee/api"; \
      pnpm --filter @kealee/api... build; \
      test -f services/api/dist/index.js; \
  fi

# Production stage: copy only what we need
FROM node:20-bullseye

RUN corepack enable && corepack prepare pnpm@8.15.9 --activate

WORKDIR /app

COPY --from=builder /app/apps ./apps
# Non-Next services (API fallback branch) run from services/api/dist.
COPY --from=builder /app/services ./services
# Workspace packages must ship too: /app/node_modules/@kealee/* are symlinks
# into /app/packages/*, so omitting packages/ leaves dangling links and the
# API crashes with e.g. "Cannot find module '@kealee/observability'".
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules
# Needed by railway.toml's startCommand (scripts/railway-next-start.sh).
COPY --from=builder /app/scripts ./scripts

EXPOSE 3000

CMD SERVER=$(find /app/apps -path '*/.next/standalone/apps/*/server.js' -print -quit 2>/dev/null); \
    if [ -n "$SERVER" ] && [ -f "$SERVER" ]; then \
      export NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL:-$NEXT_PUBLIC_SUPABASE_URL} && \
      export NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY:-$NEXT_PUBLIC_SUPABASE_ANON_KEY} && \
      export HOSTNAME=0.0.0.0 && \
      export PORT=${PORT:-3000} && \
      SDIR=$(dirname "$SERVER") && \
      APP_DIR=$(echo "$SERVER" | sed 's#/\.next/standalone/.*##') && \
      if [ ! -d "$SDIR/.next/static/chunks" ]; then echo 'Healing static assets' && mkdir -p "$SDIR/.next/static" "$SDIR/public" && cp -r "$APP_DIR/.next/static/." "$SDIR/.next/static/" 2>/dev/null || true && cp -r "$APP_DIR/public/." "$SDIR/public/" 2>/dev/null || true; fi && \
      echo "Starting $SERVER on $PORT" && \
      cd "$SDIR" && \
      exec node "$SERVER"; \
    else \
      echo 'No Next standalone server.js found; starting API from services/api' && \
      cd /app/services/api && \
      exec node dist/index.js; \
    fi
