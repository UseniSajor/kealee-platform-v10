FROM node:20-bullseye

RUN corepack enable && corepack prepare pnpm@8.15.9 --activate

WORKDIR /app

COPY . .

RUN pnpm install --no-frozen-lockfile

# ✅ build dynamically based on service name
ARG RAILWAY_SERVICE_NAME
ENV RAILWAY_SERVICE_NAME=$RAILWAY_SERVICE_NAME

RUN set -eux; \
  case "$RAILWAY_SERVICE_NAME" in \
    web-main|portal-owner) \
      APP_DIR="apps/$RAILWAY_SERVICE_NAME"; \
      rm -rf "$APP_DIR/.next"; \
      pnpm turbo run build --filter="$RAILWAY_SERVICE_NAME" --force; \
      SRV=$(find "$APP_DIR/.next/standalone/apps" -name server.js -print -quit); \
      echo "server.js: $SRV"; \
      test -n "$SRV"; \
      test -f "$SRV"; \
      SDIR=$(dirname "$SRV"); \
      mkdir -p "$SDIR/public" "$SDIR/.next/static"; \
      cp -r "$APP_DIR/public/." "$SDIR/public/" 2>/dev/null || true; \
      cp -r "$APP_DIR/.next/static/." "$SDIR/.next/static/"; \
      ;; \
    *) \
      pnpm --filter @kealee/api... build; \
      ;; \
  esac

EXPOSE 3000

# Set WORKDIR to the api package as default
WORKDIR /app/services/api

# Detect the built app from the filesystem rather than relying on
# $RAILWAY_SERVICE_NAME at runtime (not always present for Dockerfile deploys).
# A Next standalone build (web-main / portal-owner) produces a server.js under
# apps/*/.next/standalone; everything else runs the API entrypoint.
CMD SERVER=$(find /app/apps -path '*/.next/standalone/apps/*/server.js' -print -quit 2>/dev/null); \
    if [ -n "$SERVER" ] && [ -f "$SERVER" ]; then \
      export NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL && \
      export NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY && \
      export HOSTNAME=0.0.0.0 && \
      export PORT=${PORT:-3000} && \
      SDIR=$(dirname "$SERVER") && \
      APP_DIR=$(echo "$SERVER" | sed 's#/\.next/standalone/.*##') && \
      if [ ! -d "$SDIR/.next/static/chunks" ]; then echo 'Healing static assets' && mkdir -p "$SDIR/.next/static" "$SDIR/public" && cp -r "$APP_DIR/.next/static/." "$SDIR/.next/static/" 2>/dev/null || true && cp -r "$APP_DIR/public/." "$SDIR/public/" 2>/dev/null || true; fi && \
      echo "Starting $SERVER on $PORT" && \
      cd "$SDIR" && \
      exec node "$SERVER"; \
    else \
      exec node dist/index.js; \
    fi