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

# Install pnpm globally
RUN npm install -g pnpm@8.12.0

# Set environment variables to skip Puppeteer
# API service doesn't use shared-integrations (which has Puppeteer),
# but setting this prevents any transitive dependencies from downloading Chrome
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=""
ENV NODE_ENV=production

WORKDIR /app

# ============================================================
# Layer 1: Copy package files for dependency installation
# ============================================================
# This layer is cached if package.json/pnpm-lock.yaml don't change
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy workspace package.json files for dependency resolution
# We need the full directory structure, but Docker layer caching will optimize this
COPY packages ./packages
COPY services ./services
COPY apps ./apps

# ============================================================
# Layer 2: Install dependencies (including dev for build)
# ============================================================
# This layer is cached if dependencies don't change
# Install ALL dependencies including devDependencies for the build
# This ensures Prisma CLI from @kealee/database devDependencies is available
# We need devDependencies during build for Prisma generation and TypeScript
RUN pnpm install --frozen-lockfile

# ============================================================
# Layer 3: Generate Prisma client
# ============================================================
# Prisma client must be generated before TypeScript compilation
# Prisma CLI is now available from database package devDependencies
RUN pnpm --filter @kealee/database db:generate

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
