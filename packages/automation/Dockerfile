# ============================================================
# Kealee Command Center Workers - Docker Image
# ============================================================
# Multi-stage build for the automation worker process.
# This runs all 15 BullMQ workers + EventBus + cron scheduler.
# It is NOT an HTTP server — no EXPOSE / HEALTHCHECK needed.
# ============================================================

# ──────────────────────────────────────────────────────────────
# STAGE 1 — Builder
# ──────────────────────────────────────────────────────────────
FROM node:20-slim AS builder

# Build tools for native modules (ioredis, prisma binary)
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    python3 \
    make \
    gcc \
    g++ \
  && rm -rf /var/lib/apt/lists/*

# Install pnpm (match monorepo version)
RUN npm install -g pnpm@8.12.0

# Prisma config
ENV PRISMA_CLIENT_ENGINE_TYPE=binary
ENV PRISMA_HIDE_UPDATE_MESSAGE=true

WORKDIR /app

# ── Layer 1: Copy workspace manifests for dependency resolution ──
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy all workspace package.json files (pnpm needs them for resolution)
COPY packages ./packages
COPY services ./services
COPY apps ./apps

# ── Layer 2: Install dependencies (dev included for build) ──
ENV PNPM_CONFIG_PRODUCTION=false

# Only install @kealee/automation and its workspace dependencies
RUN pnpm install --filter @kealee/automation... --prod=false --ignore-scripts

# ── Layer 3: Generate Prisma client ──
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" \
    pnpm --filter @kealee/database db:generate

# ── Layer 4: Build the database package ──
COPY turbo.json tsconfig.json ./

RUN pnpm --filter @kealee/database run build && \
    test -f packages/database/dist/index.js || \
    (echo "FATAL: packages/database/dist/index.js missing!" && exit 1)

# ── Layer 5: Build the automation package ──
RUN pnpm --filter @kealee/automation run build && \
    test -f packages/automation/dist/workers/index.js || \
    (echo "FATAL: packages/automation/dist/workers/index.js missing!" && exit 1)

# ──────────────────────────────────────────────────────────────
# STAGE 2 — Production
# ──────────────────────────────────────────────────────────────
FROM node:20-slim AS production

# dumb-init for proper PID 1 signal forwarding (SIGTERM to workers)
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    dumb-init \
  && rm -rf /var/lib/apt/lists/*

# Non-root user
RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs -s /bin/sh nodejs

WORKDIR /app

# Copy built output and production dependencies
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/packages/database/dist ./packages/database/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/database/package.json ./packages/database/package.json
COPY --from=builder --chown=nodejs:nodejs /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=builder --chown=nodejs:nodejs /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder --chown=nodejs:nodejs /app/packages/automation/dist ./packages/automation/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/automation/package.json ./packages/automation/package.json
COPY --from=builder --chown=nodejs:nodejs /app/packages/automation/node_modules ./packages/automation/node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

ENV NODE_ENV=production

# Runtime verification
RUN test -f /app/packages/database/dist/index.js && \
    test -f /app/packages/automation/dist/workers/index.js && \
    echo "Runtime check: all dist files verified"

USER nodejs

WORKDIR /app/packages/automation

# dumb-init ensures SIGTERM reaches the Node process for graceful shutdown
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/workers/index.js"]
