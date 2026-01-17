# ============================================================
# Railway Deployment Dockerfile - Optimized for pnpm Monorepo
# ============================================================
# Optimizations:
# - Skip Puppeteer Chrome download (saves 5-8 minutes)
# - Layer caching for faster rebuilds  
# - Generate Prisma client before build
# - Production-only dependencies in final image
# ============================================================

FROM node:20-slim

# Ensure OpenSSL is available for Prisma engines
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Install pnpm globally
RUN npm install -g pnpm@8.12.0

# Set environment variables to skip Puppeteer
# API service doesn't use shared-integrations (which has Puppeteer),
# but setting this prevents any transitive dependencies from downloading Chrome
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=""

WORKDIR /app

# ============================================================
# Layer 1: Copy package files for dependency installation
# ============================================================
# This layer is cached if package.json/pnpm-lock.yaml don't change
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy workspace package.json files for dependency resolution
# pnpm workspace needs package.json files from all workspace packages
# but --filter will only install @kealee/api and its dependencies
COPY packages ./packages
COPY services ./services
COPY apps ./apps

# ============================================================
# Layer 2: Install dependencies (including dev for build)
# ============================================================
# This layer is cached if dependencies don't change
# Only install API service and its workspace dependencies (not all apps)
# This significantly reduces install time by skipping unused app dependencies
ENV PNPM_CONFIG_PRODUCTION=false
# Set PUPPETEER env vars at ENV level AND in RUN command for maximum compatibility
# Some packages ignore ENV vars, so set in both places
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=""
# Use --filter to only install @kealee/api and its workspace dependencies
# The '...' syntax means "this package and all its dependencies"
# Use --ignore-scripts to skip ALL postinstall scripts (including Puppeteer Chrome download)
# Prisma postinstall will run during db:generate, so we don't need to run it here
RUN PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true PUPPETEER_EXECUTABLE_PATH="" \
    pnpm install --frozen-lockfile --filter @kealee/api... --prod=false --ignore-scripts

# ============================================================
# Layer 3: Generate Prisma client
# ============================================================
# Prisma client must be generated before TypeScript compilation
# Prisma CLI is now available from database package devDependencies
RUN pnpm --filter @kealee/database exec prisma --version
# Prisma requires DATABASE_URL to be set even for `prisma generate`.
# In local dev this comes from `.env`, but `.env*` is intentionally excluded from the Docker build context.
# Provide a safe placeholder at build-time; Railway will override DATABASE_URL at runtime.
RUN DATABASE_URL="postgresql://kealee:kealee_dev@localhost:5432/kealee?schema=public" pnpm --filter @kealee/database db:generate

# ============================================================
# Layer 4: Copy config files
# ============================================================
# Copy config files - add comment to invalidate cache if needed
# Cache bust: Added database build step 2026-01-17
COPY turbo.json tsconfig.json ./

# ============================================================
# Layer 5: Build database package (CRITICAL - must run)
# ============================================================
# Build database package BEFORE API service
# This step MUST NOT be cached - database dist is required at runtime
RUN echo "=== STEP: Building database package ===" && \
    rm -rf packages/database/dist && \
    cd packages/database && \
    pnpm exec tsc && \
    cd /app && \
    echo "=== Build complete. Listing dist files ===" && \
    ls -la packages/database/dist/ && \
    echo "=== Verifying required files exist ===" && \
    test -f packages/database/dist/index.js || (echo "ERROR: dist/index.js missing!" && ls -la packages/database/ && exit 1) && \
    test -f packages/database/dist/client.js || (echo "ERROR: dist/client.js missing!" && ls -la packages/database/dist/ && exit 1) && \
    echo "=== Verifying package.json main field ===" && \
    grep -q '"main": "./dist/index.js"' packages/database/package.json || (echo "ERROR: package.json main field wrong!" && cat packages/database/package.json && exit 1) && \
    echo "=== SUCCESS: Database package built and verified ==="

# ============================================================
# Layer 6: Build the API service
# ============================================================
# Source code is already copied in Layer 1, so we can build directly
# This layer invalidates when source code changes
RUN pnpm build --filter=@kealee/api

# Set production mode after build tooling is done
ENV NODE_ENV=production

# ============================================================
# Expose port and set working directory
# ============================================================
EXPOSE 3001

WORKDIR /app/services/api

# Runtime verification: Check database package dist exists before starting
# This will fail fast if the build didn't work
RUN test -f /app/packages/database/dist/index.js || (echo "RUNTIME ERROR: /app/packages/database/dist/index.js missing!" && ls -la /app/packages/database/ && exit 1) && \
    test -f /app/packages/database/dist/client.js || (echo "RUNTIME ERROR: /app/packages/database/dist/client.js missing!" && ls -la /app/packages/database/dist/ && exit 1) && \
    echo "Runtime check: Database dist files verified"

# Health check (optional - Railway also supports healthcheckPath in railway.json)
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3001) + '/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)}).on('error', () => process.exit(1))" || exit 1

# Start the API service
CMD ["node", "dist/index.js"]
