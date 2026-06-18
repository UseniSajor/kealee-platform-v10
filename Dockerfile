FROM node:20-bullseye

RUN corepack enable && corepack prepare pnpm@8.15.9 --activate

WORKDIR /app

COPY . .

RUN pnpm install --no-frozen-lockfile

# ✅ build dynamically based on service name
ARG RAILWAY_SERVICE_NAME
RUN if [ "$RAILWAY_SERVICE_NAME" = "web-main" ]; then \
      pnpm turbo run build --filter=web-main && \
      mkdir -p apps/web-main/.next/standalone/apps/web-main/public && \
      cp -r apps/web-main/public/. apps/web-main/.next/standalone/apps/web-main/public/ || true && \
      mkdir -p apps/web-main/.next/standalone/apps/web-main/.next/static && \
      cp -r apps/web-main/.next/static/. apps/web-main/.next/standalone/apps/web-main/.next/static/ || true; \
    else \
      pnpm --filter @kealee/api... build; \
    fi

EXPOSE 3000

# Set WORKDIR to the api package so that Railway's start command override
# ("node dist/index.js") resolves to /app/services/api/dist/index.js
# regardless of whether it comes from CMD, railway.toml, or the Railway UI.
WORKDIR /app/services/api

CMD ["node", "dist/index.js"]