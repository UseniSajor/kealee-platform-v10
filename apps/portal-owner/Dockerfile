# KEALEE PORTAL-OWNER - DOCKER IMAGE
# Multi-stage pnpm monorepo build for Next.js standalone deployment on Railway.

# ============================================================================
# STAGE 1: DEPENDENCIES
# ============================================================================
FROM node:20-slim AS deps

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@8.12.0

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/portal-owner/package.json ./apps/portal-owner/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY packages/auth/package.json ./packages/auth/package.json
COPY packages/database/package.json ./packages/database/package.json
COPY packages/shared/package.json ./packages/shared/package.json

RUN pnpm install --filter portal-owner... --prod=false --ignore-scripts

# ============================================================================
# STAGE 2: BUILD
# ============================================================================
FROM node:20-slim AS builder

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@8.12.0

WORKDIR /app

COPY --from=deps /app/ ./

COPY packages/database/ ./packages/database/
COPY packages/shared/ ./packages/shared/
COPY packages/ui/ ./packages/ui/
COPY packages/auth/ ./packages/auth/
COPY apps/portal-owner/ ./apps/portal-owner/

# Re-link workspace packages after COPY (pnpm symlinks break across Docker stages)
RUN pnpm install --filter portal-owner... --prod=false --frozen-lockfile --ignore-scripts 2>/dev/null || true

RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" \
    cd packages/database && npx prisma generate && pnpm run build

RUN cd packages/shared && pnpm run build 2>/dev/null || true
RUN cd packages/ui && pnpm run build
RUN cd packages/auth && pnpm run build

ENV NEXT_TELEMETRY_DISABLED=1
RUN cd apps/portal-owner && pnpm run build

# ============================================================================
# STAGE 3: PRODUCTION RUNNER
# ============================================================================
FROM node:20-slim AS runner

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs -s /bin/sh nodejs

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY --from=builder --chown=nodejs:nodejs /app/apps/portal-owner/.next/standalone ./
COPY --from=builder --chown=nodejs:nodejs /app/apps/portal-owner/.next/static ./apps/portal-owner/.next/static
COPY --from=builder --chown=nodejs:nodejs /app/apps/portal-owner/public ./apps/portal-owner/public

USER nodejs

EXPOSE 3000

CMD ["node", "apps/portal-owner/server.js"]
