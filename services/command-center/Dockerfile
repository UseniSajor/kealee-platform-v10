# ── Build stage ────────────────────────────────────────────────────────────────
# Build context: services/command-center/ (Railway root directory for this service)
# Workspace deps replaced with local/*/  file: references — no monorepo root needed.
FROM node:20-alpine AS builder

WORKDIR /app

# Prisma query engine requires openssl on Alpine
RUN apk add --no-cache openssl

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.9 --activate

# Copy manifests first for layer caching
COPY package.json ./
COPY local/ ./local/

# Skip Chromium download (puppeteer is used for PDF screenshots; not needed at build time)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_SKIP_DOWNLOAD=true

# Install all deps (file: references resolve to ./local/*)
RUN pnpm install --no-frozen-lockfile

# Generate Prisma client from local schema copy
RUN npx prisma generate --schema=./local/database/schema.prisma

# Copy source and build
COPY . .
RUN pnpm run build

# ── Runtime stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Prisma query engine requires openssl at runtime too
RUN apk add --no-cache openssl

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/local ./local

ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

EXPOSE 3001

CMD ["node", "dist/gateway/src/server.js"]
