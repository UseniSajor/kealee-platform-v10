# KEALEE M-ESTIMATION — Railway Dockerfile
FROM node:20-slim AS deps
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@8.12.0
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/m-estimation/package.json ./apps/m-estimation/package.json
COPY packages/auth/package.json ./packages/auth/package.json
COPY packages/database/package.json ./packages/database/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN pnpm install --filter m-estimation... --prod=false --ignore-scripts

FROM node:20-slim AS builder
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@8.12.0
WORKDIR /app
COPY --from=deps /app/ ./
COPY packages/database/ ./packages/database/
COPY packages/shared/ ./packages/shared/
COPY packages/auth/ ./packages/auth/
COPY apps/m-estimation/ ./apps/m-estimation/
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" cd packages/database && npx prisma generate
RUN cd packages/shared && pnpm run build 2>/dev/null || true
RUN cd packages/auth && pnpm run build
ENV NEXT_TELEMETRY_DISABLED=1
RUN cd apps/m-estimation && pnpm run build

FROM node:20-slim AS runner
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs -s /bin/sh nodejs
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME="0.0.0.0"
COPY --from=builder --chown=nodejs:nodejs /app/apps/m-estimation/.next/standalone ./
COPY --from=builder --chown=nodejs:nodejs /app/apps/m-estimation/.next/static ./apps/m-estimation/.next/static
COPY --from=builder --chown=nodejs:nodejs /app/apps/m-estimation/public ./apps/m-estimation/public
USER nodejs
EXPOSE 3000
CMD ["node", "apps/m-estimation/server.js"]
