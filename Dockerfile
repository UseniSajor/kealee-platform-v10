FROM node:20-bullseye AS builder

RUN corepack enable && corepack prepare pnpm@8.15.9 --activate

WORKDIR /app

# Layer 1: Copy only package.json files for dependency caching
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/*/package.json ./packages/
COPY apps/web-main/package.json ./apps/web-main/

# Layer 2: Install dependencies (cached unless lock file changes)
RUN pnpm install --frozen-lockfile

# Layer 3: Copy source code
COPY . .

# Layer 4: Generate Prisma client (required before build)
RUN cd /app/packages/database && npx prisma generate

# Layer 5: Build only web-main and its direct dependencies
# Remove --force to enable turbo cache
ARG RAILWAY_SERVICE_NAME
ENV RAILWAY_SERVICE_NAME=$RAILWAY_SERVICE_NAME

RUN set -eux; \
  APP_DIR="apps/$RAILWAY_SERVICE_NAME"; \
  if [ -n "$RAILWAY_SERVICE_NAME" ] && [ -f "$APP_DIR/next.config.js" ]; then \
      rm -rf "$APP_DIR/.next"; \
      pnpm turbo run build --filter="$RAILWAY_SERVICE_NAME"; \
      SRV=$(find "$APP_DIR/.next/standalone/apps" -name server.js -print -quit); \
      echo "server.js: $SRV"; \
      test -n "$SRV"; \
      test -f "$SRV"; \
  else \
      pnpm --filter @kealee/api... build; \
  fi

# Production stage: copy only what we need
FROM node:20-bullseye

RUN corepack enable && corepack prepare pnpm@8.15.9 --activate

WORKDIR /app

# Copy built app from builder
COPY --from=builder /app/apps ./apps
COPY --from=builder /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=builder /app/node_modules ./node_modules

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
      exec node dist/index.js; \
    fi
