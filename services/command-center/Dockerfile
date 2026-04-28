FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.9 --activate

# Copy workspace manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY services/command-center/package.json ./services/command-center/

# Install deps
RUN pnpm install --frozen-lockfile --filter @kealee/command-center...

# Copy source
COPY services/command-center ./services/command-center

# Build
WORKDIR /app/services/command-center
RUN pnpm run build

# ── Runtime ────────────────────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app/services/command-center

COPY --from=builder /app/services/command-center/dist ./dist
COPY --from=builder /app/services/command-center/package.json ./
COPY --from=builder /app/node_modules /app/node_modules

ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

EXPOSE 3001

CMD ["node", "dist/gateway/src/server.js"]
