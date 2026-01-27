# KEALEE COMMAND CENTER - DOCKER IMAGE
# Multi-stage build for optimized production image

# ============================================================================
# BUILD STAGE
# ============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --include=dev

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Prune dev dependencies
RUN npm prune --production

# ============================================================================
# PRODUCTION STAGE
# ============================================================================
FROM node:20-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built files and production dependencies
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

# Set environment
ENV NODE_ENV=production
ENV PORT=3001

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start with dumb-init
ENTRYPOINT ["dumb-init", "--"]

# Default command (gateway)
CMD ["node", "dist/gateway/src/server.js"]
