FROM node:20-bullseye

RUN corepack enable && corepack prepare pnpm@8.15.9 --activate

WORKDIR /app

COPY . .

RUN pnpm install --no-frozen-lockfile

# ✅ build dynamically based on service name
ARG RAILWAY_SERVICE_NAME
ENV RAILWAY_SERVICE_NAME=$RAILWAY_SERVICE_NAME

RUN if [ "$RAILWAY_SERVICE_NAME" = "web-main" ]; then \
      pnpm turbo run build --filter=web-main && \
      mkdir -p apps/web-main/.next/standalone/public && \
      cp -r apps/web-main/public/. apps/web-main/.next/standalone/public/ || true && \
      mkdir -p apps/web-main/.next/standalone/.next/static && \
      cp -r apps/web-main/.next/static/. apps/web-main/.next/standalone/.next/static/ || true; \
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
      SERVER=$(find /app -path '*/.next/standalone*server.js' -print -quit) && \
      echo "Starting $SERVER" && \
      cd $(dirname $SERVER) && \
      exec node $SERVER; \
    else \
      exec node dist/index.js; \
    fi