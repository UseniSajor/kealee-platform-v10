# REBUILD TRIGGER

# ============================================================
# Railway Deployment Dockerfile — Kealee Platform
# Production build for API service
# ============================================================

# Build stage
FROM node:20-slim AS builder

# Prevent package installation of Playwright/Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PRISMA_CLIENT_ENGINE_TYPE=binary
ENV NPM_CONFIG_PRODUCTION=false

# Install build dependencies only
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    python3 \
    make \
    gcc \
    g++ \
  && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm@8.12.0

WORKDIR /app

# Copy monorepo structure
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY services ./services
COPY apps ./apps
COPY data ./data

# Install ALL dependencies (we'll build what we need)
# The --ignore-scripts prevents Playwright from downloading Chromium
RUN pnpm install \
    --prod=false \
    --ignore-scripts \
    --no-frozen-lockfile

# Build database packages
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" \
    pnpm --filter @kealee/database run db:generate 2>&1 || true

# Build supporting packages
RUN pnpm --filter @kealee/database run build 2>/dev/null || true
RUN pnpm --filter @kealee/types run build 2>/dev/null || true
RUN pnpm --filter @kealee/shared run build 2>/dev/null || true
RUN pnpm --filter @kealee/storage run build 2>/dev/null || true
RUN pnpm --filter @kealee/estimating run build 2>/dev/null || true
RUN pnpm --filter @kealee/workflow-engine run build 2>/dev/null || true
RUN pnpm --filter @kealee/ai run build 2>/dev/null || true
RUN pnpm --filter @kealee/ai-chat run build 2>/dev/null || true
RUN pnpm --filter @kealee/analytics run build 2>/dev/null || true
RUN pnpm --filter @kealee/audit run build 2>/dev/null || true
RUN pnpm --filter @kealee/observability run build 2>/dev/null || true
RUN pnpm --filter @kealee/intake run build 2>/dev/null || true
RUN pnpm --filter @kealee/redis run build 2>/dev/null || true
RUN pnpm --filter @kealee/realtime run build 2>/dev/null || true
RUN pnpm --filter @kealee/scoring run build 2>/dev/null || true
RUN pnpm --filter @kealee/page-builder run build 2>/dev/null || true
RUN pnpm --filter @kealee/core-ddts run build 2>/dev/null || true
RUN pnpm --filter @kealee/core-events run build 2>/dev/null || true
RUN pnpm --filter @kealee/core-llm run build 2>/dev/null || true
RUN pnpm --filter @kealee/concept-engine run build 2>/dev/null || true
RUN pnpm --filter @kealee/seeds run build 2>/dev/null || true
RUN pnpm --filter @kealee/core-auth run build 2>/dev/null || true

# Build API service (MUST succeed for production)
RUN pnpm --filter @kealee/api run db:generate 2>&1 || true
RUN pnpm --filter @kealee/api run build:ts 2>&1 && \
    test -f services/api/dist/index.js || \
    (echo "ERROR: API build failed - dist/index.js not found" && exit 1)

# Production deployment stage
FROM node:20-slim

# Install only runtime dependencies
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm@8.12.0

ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PRISMA_CLIENT_ENGINE_TYPE=binary

# Copy entire monorepo from builder (includes all built packages and node_modules)
COPY --from=builder /app /app

# Copy node_modules from builder to ensure all workspace packages are available
# This includes all pnpm-resolved dependencies and workspace symlinks
COPY --from=builder /app/node_modules /app/node_modules

WORKDIR /app/services/api

EXPOSE 3000

# Health check for API service
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://localhost:'+(process.env.PORT||3000)+'/health',(r)=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"

CMD ["node", "dist/index.js"]

# Build triggered: 2026-04-17T21:11:19.763Z
