# KEALEE WORKER — Railway Dockerfile
FROM node:20-slim AS builder
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates python3 make gcc g++ && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@8.12.0
ENV PRISMA_CLIENT_ENGINE_TYPE=binary
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/worker/package.json                 ./services/worker/package.json
COPY packages/database/package.json               ./packages/database/package.json
COPY packages/concept-engine/package.json         ./packages/concept-engine/package.json
COPY packages/core/package.json                   ./packages/core/package.json
COPY packages/observability/package.json          ./packages/observability/package.json
COPY packages/storage/package.json                ./packages/storage/package.json
RUN pnpm install --filter @kealee/worker... --prod=false --ignore-scripts

COPY packages/database/      ./packages/database/
COPY packages/concept-engine/ ./packages/concept-engine/
COPY packages/core/          ./packages/core/
COPY packages/observability/ ./packages/observability/
COPY packages/storage/       ./packages/storage/
COPY services/worker/        ./services/worker/

RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" pnpm --filter @kealee/database db:generate 2>/dev/null || cd packages/database && npx prisma generate
RUN pnpm --filter @kealee/concept-engine run build 2>/dev/null || true
RUN pnpm --filter @kealee/core run build 2>/dev/null || true
RUN pnpm --filter @kealee/observability run build 2>/dev/null || true
RUN pnpm --filter @kealee/storage run build 2>/dev/null || true
RUN cd services/worker && pnpm run build 2>/dev/null || cd services/worker && npx tsc --incremental false

FROM node:20-slim AS production
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates dumb-init wget && rm -rf /var/lib/apt/lists/*
RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs -s /bin/sh nodejs
WORKDIR /app
COPY --from=builder --chown=nodejs:nodejs /app/node_modules                 ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/services/worker/dist         ./services/worker/dist
COPY --from=builder --chown=nodejs:nodejs /app/services/worker/package.json ./services/worker/package.json
COPY --from=builder --chown=nodejs:nodejs /app/packages/database/package.json ./packages/database/package.json
COPY --from=builder --chown=nodejs:nodejs /app/packages/database/prisma     ./packages/database/prisma
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
ENV NODE_ENV=production
USER nodejs
WORKDIR /app/services/worker
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD pgrep -f "node dist/index.js" || exit 1
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
