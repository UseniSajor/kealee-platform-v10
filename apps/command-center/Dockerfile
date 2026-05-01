# ── Monorepo build — build context = repo root ─────────────────────────────────
# IMPORTANT: Set Railway Root Directory to / (repo root) in the Railway dashboard.
# dockerfilePath = "apps/command-center/Dockerfile"

FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

RUN corepack enable && corepack prepare pnpm@8.15.9 --activate

# Copy workspace manifest + only the needed package.json files first (layer caching)
COPY pnpm-workspace.yaml package.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/intake/package.json ./packages/intake/
COPY packages/ai/package.json ./packages/ai/
COPY packages/auth/package.json ./packages/auth/
COPY packages/ui/package.json ./packages/ui/
COPY apps/command-center/package.json ./apps/command-center/

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_SKIP_DOWNLOAD=true

RUN pnpm install --no-frozen-lockfile

# Copy full source of needed packages + the app
COPY packages/database/ ./packages/database/
COPY packages/intake/ ./packages/intake/
COPY packages/ai/ ./packages/ai/
COPY packages/auth/ ./packages/auth/
COPY packages/ui/ ./packages/ui/
COPY apps/command-center/ ./apps/command-center/

# Generate Prisma client from single source of truth
RUN npx prisma generate --schema=./packages/database/prisma/schema.prisma

# Build workspace deps first
RUN pnpm --filter @kealee/database build || true
RUN pnpm --filter @kealee/intake build || true
RUN pnpm --filter @kealee/ai build || true
RUN pnpm --filter @kealee/auth build || true
RUN pnpm --filter @kealee/ui build || true
RUN pnpm --filter command-center build

# ── Runtime stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Next.js standalone output — server.js is at the root of the standalone dir
COPY --from=builder /app/apps/command-center/.next/standalone ./
COPY --from=builder /app/apps/command-center/.next/static ./.next/static
COPY --from=builder /app/apps/command-center/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
