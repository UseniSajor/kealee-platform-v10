# Dockerfile for Railway deployment
FROM node:20-slim

# Install pnpm globally
RUN npm install -g pnpm@8.12.0

# Set Puppeteer to skip Chromium download (we don't need it for API service)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV NODE_ENV=production

WORKDIR /app

# Copy package files for better Docker layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy workspace packages (needed for install)
COPY packages packages/
COPY services services/
COPY apps apps/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN pnpm --filter @kealee/database db:generate

# Build the API service
RUN pnpm build --filter=@kealee/api

# Start the API service
WORKDIR /app/services/api
CMD ["node", "dist/index.js"]
