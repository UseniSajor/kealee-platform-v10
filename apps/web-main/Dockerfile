# Multi-stage build for web-main
FROM node:20-alpine AS builder

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PRISMA_CLIENT_ENGINE_TYPE=binary \
    NPM_CONFIG_PRODUCTION=false \
    NODE_ENV=production

RUN apk add --no-cache python3 make gcc g++ openssl ca-certificates

RUN npm install -g pnpm@8.12.0

WORKDIR /app

# Copy monorepo workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json .npmrc .pnpmrc ./

# Copy packages needed for build
COPY packages ./packages
COPY apps/web-main ./apps/web-main

# Install dependencies
RUN pnpm install --prod=false --ignore-scripts 2>&1 | head -100

# Build dependencies
RUN pnpm --filter '@kealee/shared' run build 2>&1 | tail -20 || true
RUN pnpm --filter '@kealee/intake' run build 2>&1 | tail -20 || true
RUN pnpm --filter '@kealee/ui' run build 2>&1 | tail -20 || true

# Build Next.js app
RUN cd /app/apps/web-main && pnpm run build 2>&1 | tail -50

#Production stage
FROM node:20-alpine

ENV NODE_ENV=production

RUN apk add --no-cache openssl ca-certificates

WORKDIR /app/apps/web-main

# Copy built .next directory from builder
COPY --from=builder /app/apps/web-main/.next ./.next
COPY --from=builder /app/apps/web-main/public ./public
COPY --from=builder /app/apps/web-main/package.json ./package.json

# Copy only production node_modules for standalone
COPY --from=builder /app/apps/web-main/node_modules ./node_modules

EXPOSE 3024

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3024/', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))" || exit 1

# Run directly with no shell
ENTRYPOINT ["node", "node_modules/.next/standalone/server.js"]
