# Build stage for web-main
FROM node:20-slim AS builder

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PRISMA_CLIENT_ENGINE_TYPE=binary \
    NPM_CONFIG_PRODUCTION=false

RUN apt-get update -y && \
    apt-get install -y --no-install-recommends openssl ca-certificates python3 make gcc g++ && \
    rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@8.12.0

WORKDIR /app

# Copy root dependencies and workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy all packages (needed for shared dependencies)
COPY packages ./packages

# Copy web-main app
COPY apps/web-main ./apps/web-main

# Install dependencies
RUN pnpm install --filter web-main... --prod=false --ignore-scripts

# Build shared packages that web-main depends on
RUN pnpm --filter @kealee/database run db:generate 2>&1 || true
RUN pnpm --filter @kealee/ui run build 2>/dev/null || true
RUN pnpm --filter @kealee/intake run build 2>/dev/null || true
RUN pnpm --filter @kealee/types run build 2>/dev/null || true
RUN pnpm --filter @kealee/shared run build 2>/dev/null || true

# Build web-main
RUN pnpm --filter web-main run build 2>&1 && \
    test -d apps/web-main/.next || (echo "ERROR: web-main build failed" && exit 1)

# Production stage
FROM node:20-slim

ENV NODE_ENV=production

RUN apt-get update -y && \
    apt-get install -y --no-install-recommends openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Install pnpm for runtime
RUN npm install -g pnpm@8.12.0

WORKDIR /app

# Copy root workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy packages
COPY packages ./packages

# Copy web-main (including build output)
COPY --from=builder /app/apps/web-main ./apps/web-main

# Install production dependencies only
RUN pnpm install --filter web-main --prod --ignore-scripts

WORKDIR /app/apps/web-main

EXPOSE 3024

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3024/',(r)=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"

CMD ["pnpm", "start"]
