# KEALEE OS-PAY — Railway Dockerfile
FROM node:20-slim AS builder
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates python3 make gcc g++ && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@8.12.0
ENV PRISMA_CLIENT_ENGINE_TYPE=binary
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/os-pay/package.json             ./services/os-pay/package.json
COPY packages/database/package.json          ./packages/database/package.json
COPY packages/shared/package.json            ./packages/shared/package.json
COPY packages/core-events/package.json       ./packages/core-events/package.json
COPY packages/core-ddts/package.json         ./packages/core-ddts/package.json
RUN pnpm install --filter @kealee/os-pay... --prod=false --ignore-scripts

COPY packages/database/ ./packages/database/
COPY packages/shared/   ./packages/shared/
COPY packages/core-events/ ./packages/core-events/
COPY packages/core-ddts/   ./packages/core-ddts/
COPY services/os-pay/    ./services/os-pay/

RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"     pnpm --filter @kealee/database db:generate 2>/dev/null || cd packages/database && npx prisma generate
RUN pnpm --filter @kealee/shared run build 2>/dev/null || true
RUN pnpm --filter @kealee/core-events run build 2>/dev/null || true
RUN pnpm --filter @kealee/core-ddts run build 2>/dev/null || true
RUN cd services/os-pay && pnpm run build:ts 2>/dev/null || cd services/os-pay && npx tsc --incremental false

FROM node:20-slim AS production
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates dumb-init wget && rm -rf /var/lib/apt/lists/*
RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs -s /bin/sh nodejs
WORKDIR /app
COPY --from=builder --chown=nodejs:nodejs /app/node_modules                    ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/services/os-pay/dist              ./services/os-pay/dist
COPY --from=builder --chown=nodejs:nodejs /app/services/os-pay/package.json      ./services/os-pay/package.json
COPY --from=builder --chown=nodejs:nodejs /app/services/os-pay/node_modules      ./services/os-pay/node_modules
COPY --from=builder --chown=nodejs:nodejs /app/packages/database/node_modules  ./packages/database/node_modules
COPY --from=builder --chown=nodejs:nodejs /app/packages/database/package.json  ./packages/database/package.json
COPY --from=builder --chown=nodejs:nodejs /app/packages/database/prisma        ./packages/database/prisma
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
ENV NODE_ENV=production PORT=3000
USER nodejs
WORKDIR /app/services/os-pay
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
