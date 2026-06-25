FROM node:20-bullseye

RUN corepack enable && corepack prepare pnpm@8.15.9 --activate

WORKDIR /app

COPY . .

RUN pnpm install --no-frozen-lockfile

# ✅ build dynamically based on service name
ARG RAILWAY_SERVICE_NAME
ENV RAILWAY_SERVICE_NAME=$RAILWAY_SERVICE_NAME

RUN if [ "$RAILWAY_SERVICE_NAME" = "web-main" ]; then \
      rm -rf apps/web-main/.next && \
      pnpm turbo run build --filter=web-main --force && \
      SRV=$(find apps/web-main/.next/standalone -name server.js -print -quit) && \
      echo "server.js: $SRV" && \
      if [ -z "$SRV" ]; then echo 'ERROR: standalone server.js not produced'; exit 1; fi && \
      SDIR=$(dirname "$SRV") && \
      mkdir -p "$SDIR/public" "$SDIR/.next/static" && \
      cp -r apps/web-main/public/. "$SDIR/public/" 2>/dev/null || true && \
      cp -r apps/web-main/.next/static/. "$SDIR/.next/static/" 2>/dev/null || true; \
    else \
      pnpm --filter @kealee/api... build; \
    fi

EXPOSE 3000

# Set WORKDIR to the api package as default
WORKDIR /app/services/api

CMD if [ "$RAILWAY_SERVICE_NAME" = "web-main" ]; then \
      export NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL && \
      export NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY && \
      export HOSTNAME=0.0.0.0 && \
      export PORT=${PORT:-3000} && \
      SERVER=/app/apps/web-main/.next/standalone/apps/web-main/server.js && \
      if [ ! -f "$SERVER" ]; then SERVER=$(find /app/apps/web-main/.next/standalone -name server.js -print -quit); fi && \
      if [ -z "$SERVER" ] || [ ! -f "$SERVER" ]; then echo 'standalone server.js not found' && exit 1; fi && \
      echo "Starting $SERVER" && \
      cd $(dirname "$SERVER") && \
      exec node "$SERVER"; \
    else \
      exec node dist/index.js; \
    fi