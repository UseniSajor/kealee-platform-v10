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

# Copy all packages and apps (needed for turbo dependency graph)
COPY packages ./packages
COPY apps/web-main ./apps/web-main

# Install all dependencies
RUN pnpm install --prod=false --ignore-scripts

# Generate Prisma client
RUN pnpm --filter @kealee/database run db:generate 2>&1 || true

# Use turbo to build web-main and all its dependencies
RUN pnpm turbo build --filter=./apps/web-main 2>&1 && \
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

# Use shell form to ensure proper command execution
SHELL ["/bin/sh", "-c"]
CMD pnpm start
