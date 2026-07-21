# KEALEE MARKETING — Railway Dockerfile
FROM node:20-slim AS deps
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@8.12.0
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/marketing/package.json ./apps/marketing/package.json
RUN pnpm install --filter @kealee/marketing... --prod=false --ignore-scripts

FROM node:20-slim AS builder
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@8.12.0
WORKDIR /app
COPY --from=deps /app/ ./
COPY apps/marketing/ ./apps/marketing/
ENV NEXT_TELEMETRY_DISABLED=1
RUN cd apps/marketing && pnpm run build

FROM node:20-slim AS runner
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs -s /bin/sh nodejs
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME="0.0.0.0"
COPY --from=builder --chown=nodejs:nodejs /app/apps/marketing/.next/standalone ./
COPY --from=builder --chown=nodejs:nodejs /app/apps/marketing/.next/static ./apps/marketing/.next/static
USER nodejs
EXPOSE 3000
CMD ["node", "apps/marketing/server.js"]
