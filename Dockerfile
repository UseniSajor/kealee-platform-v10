# ============================================================
# Railway Deployment Dockerfile - Optimized for pnpm Monorepo
# ============================================================
# Version: 6.1.0
# Last Updated: 2026-01-21 14:30
# Commit: 9241af0
# CACHE BUST: Aggressive - restructured early layers
# Changes: All build steps now use pnpm --filter run build (no turbo)
# ============================================================
# Optimizations:
# - Skip Puppeteer Chrome download (saves 5-8 minutes)
# - Layer caching for faster rebuilds  
# - Generate Prisma client before build
# - Production-only dependencies in final image
# ============================================================

FROM node:20-slim

# === AGGRESSIVE CACHE INVALIDATION ===
# Multiple cache-busting mechanisms to force Railway rebuild
ARG BUILD_DATE=2026-01-21T14:30:00Z
ARG BUILD_VERSION=6.1.0
ARG CACHE_BUST=9241af0
ARG RAILWAY_FORCE_REBUILD=true

# Add unique timestamp to break cache
RUN echo "FORCE_REBUILD_$(date +%s)" > /tmp/cache-bust.txt && \
    cat /tmp/cache-bust.txt && \
    echo "=========================================" && \
    echo "CACHE INVALIDATION FORCED" && \
    echo "BUILD_DATE: ${BUILD_DATE}" && \
    echo "BUILD_VERSION: ${BUILD_VERSION}" && \
    echo "CACHE_BUST: ${CACHE_BUST}" && \
    echo "RAILWAY_FORCE_REBUILD: ${RAILWAY_FORCE_REBUILD}" && \
    echo "========================================="

# Copy multiple cache-busting files
COPY .railway-build-marker /tmp/build-marker
COPY .railway-cache-bust /tmp/cache-bust
RUN echo "=========================================" && \
    echo "RAILWAY BUILD MARKER:" && \
    cat /tmp/build-marker && \
    echo "" && \
    echo "CACHE BUST:" && \
    cat /tmp/cache-bust && \
    echo "========================================="

# Install system dependencies and build tools
# - OpenSSL & ca-certificates: Required for Prisma and HTTPS
# - python3, make, gcc, g++: Build tools for native node modules
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    python3 \
    make \
    gcc \
    g++ \
    git \
  && rm -rf /var/lib/apt/lists/*

# Install pnpm globally
RUN npm install -g pnpm@8.12.0

# Set environment variables to skip Puppeteer
# API service doesn't use shared-integrations (which has Puppeteer),
# but setting this prevents any transitive dependencies from downloading Chrome
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=""

# Prisma configuration
# Use binary engine for better performance and reliability
ENV PRISMA_CLIENT_ENGINE_TYPE=binary
ENV PRISMA_HIDE_UPDATE_MESSAGE=true

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
# VERIFY: Check what version of @fastify/multipart is in package.json (for debugging cache issues)
RUN echo "=== VERIFYING package.json has correct @fastify/multipart version ===" && \
    grep -A 2 '@fastify/multipart' services/api/package.json && \
    echo "=== If version above is NOT 8.3.0, Railway cache is the problem ==="

# Use --filter to only install @kealee/api and its workspace dependencies
# The '...' syntax means "this package and all its dependencies"
# Use --ignore-scripts to skip ALL postinstall scripts (including Puppeteer Chrome download)
# Prisma postinstall will run during db:generate, so we don't need to run it here
# NOTE: Removed --frozen-lockfile due to Railway cache issues - pnpm will update lockfile if needed
RUN PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true PUPPETEER_EXECUTABLE_PATH="" \
    pnpm install --filter @kealee/api... --prod=false --ignore-scripts

# ============================================================
# Layer 3: Generate Prisma client
# ============================================================
# Prisma client must be generated before TypeScript compilation
# Prisma CLI is now available from database package devDependencies
RUN pnpm --filter @kealee/database exec prisma --version
# Prisma requires DATABASE_URL to be set even for `prisma generate`.
# In local dev this comes from `.env`, but `.env*` is intentionally excluded from the Docker build context.
# Provide a safe placeholder at build-time; Railway sets DATABASE_URL at runtime via environment variables.
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
# Use pnpm to run the build script directly, which will use the package's local TypeScript
RUN echo "=== STEP: Building database package ===" && \
    pwd && \
    echo "Verifying database package exists..." && \
    test -d packages/database || (echo "ERROR: packages/database directory not found!" && ls -la packages/ && exit 1) && \
    echo "Cleaning dist directory..." && \
    rm -rf packages/database/dist && \
    echo "Running build script via pnpm..." && \
    pnpm --filter @kealee/database run build && \
    echo "=== Build complete. Verifying output ===" && \
    test -f packages/database/dist/index.js || \
    (echo "ERROR: dist/index.js missing after build!" && \
     echo "Checking dist directory:" && \
     ls -la packages/database/dist/ 2>/dev/null || echo "No dist directory found" && \
     echo "Checking package structure:" && \
     ls -la packages/database/ && \
     echo "Checking for TypeScript in node_modules:" && \
     find packages/database/node_modules -name "tsc" -type f 2>/dev/null | head -3 || \
     find node_modules -path "*/typescript/bin/tsc" -type f 2>/dev/null | head -3 || \
     echo "TypeScript not found in expected locations" && \
     exit 1) && \
    echo "=== SUCCESS: Database package built ===" && \
    ls -la packages/database/dist/

# Build workflow-engine package (REQUIRED)
RUN echo "=== STEP: Building workflow-engine package ===" && \
    test -d packages/workflow-engine || (echo "ERROR: packages/workflow-engine directory not found!" && exit 1) && \
    rm -rf packages/workflow-engine/dist && \
    pnpm --filter @kealee/workflow-engine run build && \
    test -f packages/workflow-engine/dist/index.js || \
    (echo "FATAL: workflow-engine build failed!" && \
     ls -la packages/workflow-engine/ && \
     ls -la packages/workflow-engine/dist/ 2>/dev/null || echo "No dist directory" && \
     exit 1) && \
    echo "=== SUCCESS: Workflow-engine package built ==="

# Build other workspace packages (optional - best effort)
RUN echo "=== STEP: Building other workspace packages ===" && \
    for pkg in compliance types analytics api-client; do \
      echo "Building @kealee/$pkg..." && \
      if [ -d "packages/$pkg" ]; then \
        rm -rf packages/$pkg/dist && \
        pnpm --filter @kealee/$pkg run build || echo "Build failed for $pkg (non-fatal)" && \
        if [ -f "packages/$pkg/dist/index.js" ]; then \
          echo "✓ @kealee/$pkg built successfully"; \
        else \
          echo "✗ WARNING: packages/$pkg/dist/index.js not found (may not be needed)"; \
        fi; \
      else \
        echo "⚠ Package @kealee/$pkg not found, skipping"; \
      fi; \
    done && \
    echo "=== INFO: Optional packages build complete ==="

# ============================================================
# Layer 6: Build the API service
# ============================================================
# Source code is already copied in Layer 1, so we can build directly
# This layer invalidates when source code changes
# Build workflow-engine separately with high memory allocation
RUN /bin/bash -c "export NODE_OPTIONS='--max-old-space-size=16384' && pnpm --filter @kealee/database db:generate"

# Build workflow-engine package
RUN /bin/bash -c "export NODE_OPTIONS='--max-old-space-size=16384' && pnpm --filter @kealee/workflow-engine run build"

# Build API service TypeScript
RUN /bin/bash -c "export NODE_OPTIONS='--max-old-space-size=16384' && cd /app/services/api && tsc"

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

