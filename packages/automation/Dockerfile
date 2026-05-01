# ── Monorepo build — build context = repo root ─────────────────────────────────
# IMPORTANT: Set Railway Root Directory to / (repo root) in the Railway dashboard.
# dockerfilePath = "packages/automation/Dockerfile"

FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

RUN corepack enable && corepack prepare pnpm@8.15.9 --activate

# Copy workspace manifest + only the needed package.json files (layer caching)
COPY pnpm-workspace.yaml package.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/automation/package.json ./packages/automation/

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_SKIP_DOWNLOAD=true

RUN pnpm install --no-frozen-lockfile

# Copy full source of needed packages
COPY packages/database/ ./packages/database/
COPY packages/automation/ ./packages/automation/

# Generate Prisma client from single source of truth
RUN npx prisma generate --schema=./packages/database/prisma/schema.prisma

# Build workspace deps first, then automation
RUN pnpm --filter @kealee/database build || true
RUN pnpm --filter @kealee/automation build

# ── Runtime stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY --from=builder /app/packages/automation/dist ./dist
COPY --from=builder /app/packages/automation/package.json ./

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/automation/node_modules ./packages/automation/node_modules 2>/dev/null || true

COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/package.json ./packages/database/

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

EXPOSE 3000

CMD ["node", "dist/index.js"]
