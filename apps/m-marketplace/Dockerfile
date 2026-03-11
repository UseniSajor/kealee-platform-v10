# KEALEE MARKETPLACE - DOCKER IMAGE
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

# Copy workspace manifests for dependency resolution
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/m-marketplace/package.json ./apps/m-marketplace/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY packages/auth/package.json ./packages/auth/package.json
COPY packages/funnel-session/package.json ./packages/funnel-session/package.json
COPY packages/shared-ai/package.json ./packages/shared-ai/package.json
COPY packages/database/package.json ./packages/database/package.json
COPY packages/shared/package.json ./packages/shared/package.json

# Install all dependencies (including devDependencies for build)
RUN pnpm install --filter m-marketplace... --prod=false --ignore-scripts

# ============================================================================
# STAGE 2: BUILD
# ============================================================================
FROM node:20-slim AS builder

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@8.12.0

WORKDIR /app

# Copy installed node_modules from deps stage
COPY --from=deps /app/ ./

# Copy source code for workspace packages
COPY packages/database/ ./packages/database/
COPY packages/shared/ ./packages/shared/
COPY packages/ui/ ./packages/ui/
COPY packages/auth/ ./packages/auth/
COPY packages/funnel-session/ ./packages/funnel-session/
COPY packages/shared-ai/ ./packages/shared-ai/
COPY apps/m-marketplace/ ./apps/m-marketplace/

# Re-link workspace packages after COPY (pnpm symlinks break across Docker stages)
RUN pnpm install --filter m-marketplace... --prod=false --ignore-scripts

# Generate Prisma client and build database package (needed by auth and others)
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN cd packages/database && npx prisma generate && pnpm run build

# Build workspace packages that m-marketplace depends on (order matters)
RUN cd packages/shared && pnpm run build 2>/dev/null || true
RUN cd packages/ui && pnpm run build
RUN cd packages/auth && pnpm run build
RUN cd packages/funnel-session && pnpm run build

# Build the marketplace app
ENV NEXT_TELEMETRY_DISABLED=1
# Provide dummy Supabase vars so prerendering doesn't crash (runtime vars override)
ENV NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co"
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY="placeholder-anon-key"
RUN cd apps/m-marketplace && pnpm run build

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

# Copy standalone build output
COPY --from=builder --chown=nodejs:nodejs /app/apps/m-marketplace/.next/standalone ./
COPY --from=builder --chown=nodejs:nodejs /app/apps/m-marketplace/.next/static ./apps/m-marketplace/.next/static
COPY --from=builder --chown=nodejs:nodejs /app/apps/m-marketplace/public ./apps/m-marketplace/public

USER nodejs

EXPOSE 3000

CMD ["node", "apps/m-marketplace/server.js"]
