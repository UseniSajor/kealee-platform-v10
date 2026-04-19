# KEALEE API — Railway Dockerfile
# Multi-stage pnpm monorepo build for the primary API service.

# ============================================================================
# BUILD STAGE
# ============================================================================
FROM node:20-slim AS builder

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    python3 \
    make \
    gcc \
    g++ \
  && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@8.12.0

ENV PRISMA_CLIENT_ENGINE_TYPE=binary
ENV PRISMA_HIDE_UPDATE_MESSAGE=true

WORKDIR /app

# ── Layer 1: workspace manifests ──
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/api/package.json                   ./services/api/package.json
COPY packages/database/package.json              ./packages/database/package.json
COPY packages/shared/package.json                ./packages/shared/package.json
COPY packages/storage/package.json               ./packages/storage/package.json
COPY packages/estimating/package.json            ./packages/estimating/package.json
COPY packages/workflow-engine/package.json       ./packages/workflow-engine/package.json
COPY packages/ai/package.json                    ./packages/ai/package.json
COPY packages/ai-chat/package.json               ./packages/ai-chat/package.json
COPY packages/analytics/package.json             ./packages/analytics/package.json
COPY packages/audit/package.json                 ./packages/audit/package.json
COPY packages/observability/package.json         ./packages/observability/package.json
COPY packages/realtime/package.json              ./packages/realtime/package.json
COPY packages/scoring/package.json               ./packages/scoring/package.json
COPY packages/page-builder/package.json          ./packages/page-builder/package.json
COPY packages/concept-engine/package.json        ./packages/concept-engine/package.json
COPY packages/core-ddts/package.json             ./packages/core-ddts/package.json
COPY packages/core-events/package.json           ./packages/core-events/package.json
COPY packages/types/package.json                 ./packages/types/package.json
COPY packages/core-llm/package.json              ./packages/core-llm/package.json
COPY packages/seeds/package.json                 ./packages/seeds/package.json

# ── Layer 2: install dependencies ──
# Install entire workspace (not just api's filter) to ensure all packages are available
# This ensures @kealee/seeds, @kealee/core-llm, and all other packages are in node_modules
RUN pnpm install --prod=false --ignore-scripts

# ── Layer 3: copy source ──
COPY packages/database/       ./packages/database/
COPY packages/shared/         ./packages/shared/
COPY packages/storage/        ./packages/storage/
COPY packages/estimating/     ./packages/estimating/
COPY packages/workflow-engine/ ./packages/workflow-engine/
COPY packages/ai/             ./packages/ai/
COPY packages/ai-chat/        ./packages/ai-chat/
COPY packages/analytics/      ./packages/analytics/
COPY packages/audit/          ./packages/audit/
COPY packages/observability/  ./packages/observability/
COPY packages/realtime/       ./packages/realtime/
COPY packages/scoring/        ./packages/scoring/
COPY packages/page-builder/   ./packages/page-builder/
COPY packages/concept-engine/ ./packages/concept-engine/
COPY packages/core-ddts/      ./packages/core-ddts/
COPY packages/core-events/    ./packages/core-events/
COPY packages/types/          ./packages/types/
COPY packages/core-llm/       ./packages/core-llm/
COPY packages/seeds/          ./packages/seeds/
COPY services/api/            ./services/api/

# ── Layer 4: generate Prisma client + compile database package ──
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" \
    pnpm --filter @kealee/database run db:generate 2>&1 || true
RUN pnpm --filter @kealee/database run build 2>/dev/null || true

# ── Layer 5: build workspace packages ──
RUN pnpm --filter @kealee/shared run build 2>/dev/null || true
RUN pnpm --filter @kealee/storage run build 2>/dev/null || true
RUN pnpm --filter @kealee/estimating run build 2>/dev/null || true
RUN pnpm --filter @kealee/workflow-engine run build 2>/dev/null || true
RUN pnpm --filter @kealee/ai run build 2>/dev/null || true
RUN pnpm --filter @kealee/ai-chat run build 2>/dev/null || true
RUN pnpm --filter @kealee/analytics run build 2>/dev/null || true
RUN pnpm --filter @kealee/audit run build 2>/dev/null || true
RUN pnpm --filter @kealee/observability run build 2>/dev/null || true
RUN pnpm --filter @kealee/realtime run build 2>/dev/null || true
RUN pnpm --filter @kealee/scoring run build 2>/dev/null || true
RUN pnpm --filter @kealee/page-builder run build 2>/dev/null || true
RUN pnpm --filter @kealee/types run build 2>/dev/null || true
RUN pnpm --filter @kealee/core-events run build 2>/dev/null || true
RUN pnpm --filter @kealee/core-ddts run build 2>/dev/null || true
RUN pnpm --filter @kealee/concept-engine run build 2>/dev/null || true
RUN pnpm --filter @kealee/core-llm run build 2>/dev/null || true
RUN pnpm --filter @kealee/seeds run build 2>/dev/null || true

# ── Layer 6: build the API ──
RUN cd services/api && (pnpm run build:ts; true) && \
    test -f dist/index.js || \
    (echo "FATAL: dist/index.js missing!" && exit 1)

# ============================================================================
# PRODUCTION STAGE
# ============================================================================
FROM node:20-slim AS production

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    dumb-init \
    wget \
  && rm -rf /var/lib/apt/lists/*

RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs -s /bin/sh nodejs

WORKDIR /app

COPY --from=builder --chown=nodejs:nodejs /app/node_modules                   ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/services/api/dist              ./services/api/dist
COPY --from=builder --chown=nodejs:nodejs /app/services/api/package.json      ./services/api/package.json
COPY --from=builder --chown=nodejs:nodejs /app/services/api/node_modules      ./services/api/node_modules
COPY --from=builder --chown=nodejs:nodejs /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=builder --chown=nodejs:nodejs /app/packages/database/dist         ./packages/database/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/database/package.json ./packages/database/package.json
COPY --from=builder --chown=nodejs:nodejs /app/packages/database/prisma       ./packages/database/prisma
COPY --from=builder --chown=nodejs:nodejs /app/packages/core-llm/node_modules ./packages/core-llm/node_modules
COPY --from=builder --chown=nodejs:nodejs /app/packages/core-llm/dist         ./packages/core-llm/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/core-llm/package.json ./packages/core-llm/package.json
COPY --from=builder --chown=nodejs:nodejs /app/packages/seeds/node_modules    ./packages/seeds/node_modules
COPY --from=builder --chown=nodejs:nodejs /app/packages/seeds/dist            ./packages/seeds/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/seeds/package.json    ./packages/seeds/package.json
COPY --from=builder --chown=nodejs:nodejs /app/package.json                   ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/pnpm-workspace.yaml            ./pnpm-workspace.yaml

ENV NODE_ENV=production
ENV PORT=3000

USER nodejs

WORKDIR /app/services/api

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
