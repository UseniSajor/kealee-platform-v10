# ── Monorepo build — build context = repo root ─────────────────────────────────
# IMPORTANT: Set Railway Root Directory to / (repo root) in the Railway dashboard.
# dockerfilePath = "services/os-pm/Dockerfile"

FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

RUN corepack enable && corepack prepare pnpm@8.15.9 --activate

# Copy workspace manifest + only the needed package.json files (layer caching)
COPY pnpm-workspace.yaml package.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/core-events/package.json ./packages/core-events/
COPY packages/core-ddts/package.json ./packages/core-ddts/
COPY packages/shared/package.json ./packages/shared/
COPY services/os-pm/package.json ./services/os-pm/

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_SKIP_DOWNLOAD=true

RUN pnpm install --no-frozen-lockfile

# Copy full source of needed packages + the service
COPY packages/database/ ./packages/database/
COPY packages/core-events/ ./packages/core-events/
COPY packages/core-ddts/ ./packages/core-ddts/
COPY packages/shared/ ./packages/shared/
COPY services/os-pm/ ./services/os-pm/

# Generate Prisma client from single source of truth
RUN npx prisma generate --schema=./packages/database/prisma/schema.prisma

# Build workspace deps first, then service
RUN pnpm --filter @kealee/database build || true
RUN pnpm --filter @kealee/core-events build || true
RUN pnpm --filter @kealee/core-ddts build || true
RUN pnpm --filter @kealee/shared build || true
RUN pnpm --filter @kealee/os-pm build

# ── Runtime stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY --from=builder /app/services/os-pm/dist ./dist
COPY --from=builder /app/services/os-pm/package.json ./

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/os-pm/node_modules ./services/os-pm/node_modules 2>/dev/null || true

COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/package.json ./packages/database/
COPY --from=builder /app/packages/core-events/dist ./packages/core-events/dist
COPY --from=builder /app/packages/core-events/package.json ./packages/core-events/
COPY --from=builder /app/packages/core-ddts/dist ./packages/core-ddts/dist
COPY --from=builder /app/packages/core-ddts/package.json ./packages/core-ddts/
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

EXPOSE 3000

CMD ["node", "dist/index.js"]
