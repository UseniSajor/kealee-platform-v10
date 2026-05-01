# ── Monorepo build — build context = repo root ─────────────────────────────────
# IMPORTANT: Set Railway Root Directory to / (repo root) in the Railway dashboard.
# dockerfilePath = "services/keacore/Dockerfile"

FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

RUN corepack enable && corepack prepare pnpm@8.15.9 --activate

# Copy workspace manifest + only the needed package.json files (layer caching)
COPY pnpm-workspace.yaml package.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/seeds/package.json ./packages/seeds/
COPY packages/core/package.json ./packages/core/
COPY packages/core-agents/package.json ./packages/core-agents/
COPY packages/core-llm/package.json ./packages/core-llm/
COPY packages/core-ai-gateway/package.json ./packages/core-ai-gateway/
COPY packages/core-tools/package.json ./packages/core-tools/
COPY services/keacore/package.json ./services/keacore/

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_SKIP_DOWNLOAD=true

RUN pnpm install --no-frozen-lockfile

# Copy full source of needed packages + the service
COPY packages/database/ ./packages/database/
COPY packages/seeds/ ./packages/seeds/
COPY packages/core/ ./packages/core/
COPY packages/core-agents/ ./packages/core-agents/
COPY packages/core-llm/ ./packages/core-llm/
COPY packages/core-ai-gateway/ ./packages/core-ai-gateway/
COPY packages/core-tools/ ./packages/core-tools/
COPY services/keacore/ ./services/keacore/

# Generate Prisma client from single source of truth
RUN npx prisma generate --schema=./packages/database/prisma/schema.prisma

# Build workspace deps in dependency order, then service
RUN pnpm --filter @kealee/database build || true
RUN pnpm --filter @kealee/seeds build || true
RUN pnpm --filter @kealee/core build || true
RUN pnpm --filter @kealee/core-agents build || true
RUN pnpm --filter @kealee/core-llm build || true
RUN pnpm --filter @kealee/core-ai-gateway build || true
RUN pnpm --filter @kealee/core-tools build || true
RUN pnpm --filter @kealee/keacore build

# ── Runtime stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY --from=builder /app/services/keacore/dist ./dist
COPY --from=builder /app/services/keacore/package.json ./

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/keacore/node_modules ./services/keacore/node_modules 2>/dev/null || true

COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/package.json ./packages/database/
COPY --from=builder /app/packages/seeds/dist ./packages/seeds/dist
COPY --from=builder /app/packages/seeds/package.json ./packages/seeds/
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/packages/core/package.json ./packages/core/
COPY --from=builder /app/packages/core-agents/dist ./packages/core-agents/dist
COPY --from=builder /app/packages/core-agents/package.json ./packages/core-agents/
COPY --from=builder /app/packages/core-llm/dist ./packages/core-llm/dist
COPY --from=builder /app/packages/core-llm/package.json ./packages/core-llm/
COPY --from=builder /app/packages/core-ai-gateway/dist ./packages/core-ai-gateway/dist
COPY --from=builder /app/packages/core-ai-gateway/package.json ./packages/core-ai-gateway/
COPY --from=builder /app/packages/core-tools/dist ./packages/core-tools/dist
COPY --from=builder /app/packages/core-tools/package.json ./packages/core-tools/

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

EXPOSE 3000

CMD ["node", "dist/index.js"]
