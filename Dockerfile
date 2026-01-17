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
# Then manually run Prisma postinstall which we need
RUN PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true PUPPETEER_EXECUTABLE_PATH="" \
    pnpm install --frozen-lockfile --filter @kealee/api... --prod=false --ignore-scripts && \
    pnpm --filter @kealee/database exec node node_modules/@prisma/engines/postinstall.js || true

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
# These change less frequently than source code
COPY turbo.json tsconfig.json ./

# ============================================================
# Layer 5: Build the API service
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

# Health check (optional - Railway also supports healthcheckPath in railway.json)
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3001) + '/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)}).on('error', () => process.exit(1))" || exit 1

# Start the API service
CMD ["node", "dist/index.js"]
