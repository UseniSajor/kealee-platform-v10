# KEALEE KEACORE SERVICE — Railway Dockerfile
FROM node:20-slim AS deps
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@8.12.0
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/keacore/package.json ./services/keacore/package.json
COPY packages/core-agents/package.json ./packages/core-agents/package.json
COPY packages/core-tools/package.json ./packages/core-tools/package.json
COPY packages/database/package.json ./packages/database/package.json
RUN pnpm install --filter @kealee/keacore... --prod=false --ignore-scripts

FROM node:20-slim AS builder
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@8.12.0
WORKDIR /app
COPY --from=deps /app/ ./
COPY packages/core-agents/ ./packages/core-agents/
COPY packages/core-tools/ ./packages/core-tools/
COPY packages/database/ ./packages/database/
COPY services/keacore/ ./services/keacore/
RUN pnpm install --filter @kealee/keacore... --prod=false --frozen-lockfile --ignore-scripts
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" cd packages/database && npx prisma generate
RUN cd packages/core-agents && pnpm run build
RUN cd packages/core-tools && pnpm run build
RUN cd services/keacore && pnpm run build

FROM node:20-slim AS runner
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs -s /bin/sh nodejs
WORKDIR /app
ENV NODE_ENV=production PORT=3030
COPY --from=builder --chown=nodejs:nodejs /app/services/keacore/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/packages/core-agents/dist ./packages/core-agents/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/core-tools/dist ./packages/core-tools/dist
USER nodejs
EXPOSE 3030
CMD ["node", "dist/index.js"]
