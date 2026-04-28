# ── Monorepo build — build context = repo root ─────────────────────────────────
# IMPORTANT: Set Railway Root Directory to / (repo root) in the Railway dashboard.
# This Dockerfile is referenced as dockerfilePath = "services/command-center/Dockerfile".
#
# Advantages over self-contained approach:
#   - schema.prisma is NOT duplicated — generated from packages/database/prisma/schema.prisma
#   - Uses real @kealee/* workspace packages (not local stubs)
#   - Schema stays in sync automatically on every build

FROM node:20-alpine AS builder

WORKDIR /app

# Prisma query engine requires openssl on Alpine
RUN apk add --no-cache openssl

RUN corepack enable && corepack prepare pnpm@8.15.9 --activate

# Copy workspace manifest + only the needed package.json files first (layer caching)
COPY pnpm-workspace.yaml package.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/observability/package.json ./packages/observability/
COPY packages/scoring/package.json ./packages/scoring/
COPY services/command-center/package.json ./services/command-center/

# Skip Chromium download (puppeteer); Prisma binary postinstall still runs
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_SKIP_DOWNLOAD=true

RUN pnpm install --no-frozen-lockfile

# Copy full source of needed packages + the service
COPY packages/database/ ./packages/database/
COPY packages/observability/ ./packages/observability/
COPY packages/scoring/ ./packages/scoring/
COPY services/command-center/ ./services/command-center/

# Generate Prisma client from the single source of truth
RUN npx prisma generate --schema=./packages/database/prisma/schema.prisma

# Build workspace deps first, then command-center
RUN pnpm --filter @kealee/database build || true
RUN pnpm --filter @kealee/observability build || true
RUN pnpm --filter @kealee/scoring build || true
RUN pnpm --filter @kealee/command-center build

# ── Runtime stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

# Command-center built output
COPY --from=builder /app/services/command-center/dist ./dist
COPY --from=builder /app/services/command-center/package.json ./

# Root node_modules: shared deps + workspace symlinks (@kealee/* → packages/*)
COPY --from=builder /app/node_modules ./node_modules

# Service-level node_modules (pnpm may place some overrides here)
COPY --from=builder /app/services/command-center/node_modules ./services/command-center/node_modules

# Built workspace packages — required because node_modules/@kealee/* symlinks point here
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/package.json ./packages/database/
COPY --from=builder /app/packages/observability/dist ./packages/observability/dist
COPY --from=builder /app/packages/observability/package.json ./packages/observability/
COPY --from=builder /app/packages/scoring/dist ./packages/scoring/dist
COPY --from=builder /app/packages/scoring/package.json ./packages/scoring/

ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

EXPOSE 3001

CMD ["node", "dist/gateway/src/server.js"]
