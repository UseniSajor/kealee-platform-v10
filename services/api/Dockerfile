# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/workflow-engine/package.json ./packages/workflow-engine/
COPY packages/types/package.json ./packages/types/
COPY services/api/package.json ./services/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY packages/database ./packages/database
COPY packages/workflow-engine ./packages/workflow-engine
COPY packages/types ./packages/types
COPY services/api ./services/api

# Generate Prisma client
WORKDIR /app/packages/database
RUN pnpm db:generate

# Build the API service
WORKDIR /app/services/api
RUN pnpm build

# Production stage
FROM node:20-alpine AS production

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files for production install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/database/package.json ./packages/database/
COPY packages/workflow-engine/package.json ./packages/workflow-engine/
COPY packages/types/package.json ./packages/types/
COPY services/api/package.json ./services/api/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built files
COPY --from=builder /app/packages/database/node_modules/.prisma ./packages/database/node_modules/.prisma
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/packages/workflow-engine/dist ./packages/workflow-engine/dist
COPY --from=builder /app/services/api/dist ./services/api/dist

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

WORKDIR /app/services/api

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]
