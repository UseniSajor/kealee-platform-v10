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

# === COMPLETE CACHE INVALIDATION ===
# Update this timestamp for EVERY deploy to force complete rebuild
ARG FORCE_REBUILD=2026-01-17T21:00:00Z
RUN echo "=========================================" && \
    echo "FORCE REBUILD ALL LAYERS AT: $FORCE_REBUILD" && \
    echo "=========================================" && \
    echo "$FORCE_REBUILD" > /tmp/build_id.txt

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
# Copy config files - IMPORTANT: turbo.json must be copied before build
COPY turbo.json tsconfig.json ./

# === CRITICAL: FIX turbo.json first (Railway cache issue) ===
RUN echo "=== FIXING turbo.json before build ===" && \
    echo "Current directory:" && pwd && \
    echo "Checking if turbo.json exists..." && \
    if [ -f "turbo.json" ]; then \
        echo "Found turbo.json. Original content:" && \
        cat turbo.json && \
        echo "" && \
        echo "Removing _cacheBust if present..." && \
        if grep -q '_cacheBust' turbo.json; then \
            echo "Found _cacheBust. Removing it..." && \
            grep -v '_cacheBust' turbo.json > turbo.json.tmp && \
            mv turbo.json.tmp turbo.json && \
            echo "turbo.json after fix:" && \
            cat turbo.json; \
        else \
            echo "turbo.json is already clean (no _cacheBust found)"; \
        fi; \
    else \
        echo "ERROR: turbo.json not found!" && \
        ls -la && \
        exit 1; \
    fi

# ============================================================
# Layer 5: Build workspace packages (CRITICAL - must run)
# ============================================================
# Build workspace packages BEFORE API service
# These packages are required at runtime

# Build database package
RUN echo "=== STEP: Building database package ===" && \
    rm -rf packages/database/dist && \
    (pnpm build --filter=@kealee/database || \
     (echo "=== Turbo failed, building directly with tsc ===" && \
      cd packages/database && \
      pnpm exec tsc && \
      cd ../..)) && \
    echo "=== Build complete. Listing dist files ===" && \
    ls -la packages/database/dist/ 2>/dev/null || echo "WARNING: No dist directory" && \
    test -f packages/database/dist/index.js || \
    (echo "ERROR: dist/index.js missing! Trying emergency build..." && \
     cd packages/database && \
     npx tsc && \
     cd ../.. && \
     test -f packages/database/dist/index.js || \
     (echo "FATAL: Could not build database package" && ls -la packages/database/ && exit 1)) && \
    echo "=== SUCCESS: Database package built ==="

# Build workflow-engine package
RUN echo "=== STEP: Building workflow-engine package ===" && \
    rm -rf packages/workflow-engine/dist && \
    (pnpm build --filter=@kealee/workflow-engine || \
     (echo "=== Turbo failed, building directly with tsc ===" && \
      cd packages/workflow-engine && \
      pnpm exec tsc && \
      cd ../..)) && \
    echo "=== Build complete. Listing dist files ===" && \
    ls -la packages/workflow-engine/dist/ 2>/dev/null || echo "WARNING: No dist directory" && \
    test -f packages/workflow-engine/dist/index.js || \
    (echo "ERROR: dist/index.js missing!" && ls -la packages/workflow-engine/ && exit 1) && \
    echo "=== SUCCESS: Workflow-engine package built ==="

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
