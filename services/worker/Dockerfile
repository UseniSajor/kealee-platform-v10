# KEALEE WORKER — Railway Dockerfile
FROM node:20-slim AS builder
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates python3 make gcc g++ && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@8.12.0
ENV PRISMA_CLIENT_ENGINE_TYPE=binary
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/worker/package.json ./services/worker/package.json
COPY packages/database/package.json ./packages/database/package.json
RUN pnpm install --filter @kealee/worker... --prod=false --ignore-scripts

COPY packages/database/ ./packages/database/
COPY services/worker/ ./services/worker/
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" && \
    cd packages/database && npx prisma generate
RUN cd services/worker && pnpm run build

FROM node:20-slim AS runner
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates dumb-init && rm -rf /var/lib/apt/lists/*
RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs -s /bin/sh nodejs
WORKDIR /app
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/services/worker/dist ./services/worker/dist
COPY --from=builder --chown=nodejs:nodejs /app/services/worker/package.json ./services/worker/package.json
COPY --from=builder --chown=nodejs:nodejs /app/packages/database/package.json ./packages/database/package.json
COPY --from=builder --chown=nodejs:nodejs /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
ENV NODE_ENV=production PORT=3001
USER nodejs
WORKDIR /app/services/worker
EXPOSE 3001
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
