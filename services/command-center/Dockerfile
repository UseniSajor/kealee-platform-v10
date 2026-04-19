# KEALEE COMMAND CENTER - DOCKER IMAGE
# Multi-stage pnpm monorepo build for the Command Center API gateway.
# This resolves workspace:* dependencies correctly from the monorepo root.

# ============================================================================
# BUILD STAGE
# ============================================================================
FROM node:20-slim AS builder

# Build tools for native modules (prisma binary, ioredis)
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
COPY packages/database/package.json ./packages/database/package.json
COPY packages/communications/package.json ./packages/communications/package.json
COPY packages/payments/package.json ./packages/payments/package.json
COPY services/command-center/package.json ./services/command-center/package.json

# ── Layer 2: Install dependencies ──
RUN pnpm install --filter @kealee/command-center... --prod=false --ignore-scripts

# ── Layer 3: Copy source code ──
COPY packages/database/ ./packages/database/
COPY packages/communications/src/ ./packages/communications/src/
COPY packages/payments/src/ ./packages/payments/src/
COPY services/command-center/ ./services/command-center/

# ── Layer 4: Generate Prisma client ──
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" \
    pnpm --filter @kealee/database run db:generate 2>&1 || true

# ── Layer 5: Build the command center ──
RUN cd services/command-center && pnpm run build && \
    test -f dist/gateway/src/server.js || \
    (echo "FATAL: dist/gateway/src/server.js missing!" && exit 1)

# ============================================================================
# PRODUCTION STAGE
# ============================================================================
FROM node:20-slim AS production

# dumb-init for proper PID 1 signal forwarding
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    dumb-init \
    wget \
  && rm -rf /var/lib/apt/lists/*

# Non-root user
RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs -s /bin/sh nodejs

WORKDIR /app

# Root node_modules (shared by all packages in pnpm monorepo)
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Command Center service
COPY --from=builder --chown=nodejs:nodejs /app/services/command-center/dist ./services/command-center/dist
COPY --from=builder --chown=nodejs:nodejs /app/services/command-center/package.json ./services/command-center/package.json

# Database package (required at runtime)
COPY --from=builder --chown=nodejs:nodejs /app/packages/database/dist ./packages/database/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/database/package.json ./packages/database/package.json
COPY --from=builder --chown=nodejs:nodejs /app/packages/database/prisma ./packages/database/prisma

# Workspace config
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

ENV NODE_ENV=production
ENV PORT=3001

USER nodejs

WORKDIR /app/services/command-center

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/gateway/src/server.js"]
