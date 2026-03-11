# KEALEE WEB-MAIN (MARKETING) - DOCKER IMAGE
FROM node:20-slim AS deps
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@8.12.0
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web-main/package.json ./apps/web-main/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY packages/database/package.json ./packages/database/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN pnpm install --filter web-main... --prod=false --ignore-scripts

FROM node:20-slim AS builder
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@8.12.0
WORKDIR /app
COPY --from=deps /app/ ./
COPY packages/database/ ./packages/database/
COPY packages/shared/ ./packages/shared/
COPY packages/ui/ ./packages/ui/
COPY apps/web-main/ ./apps/web-main/
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" \
    cd packages/database && npx prisma generate && pnpm run build
RUN cd packages/shared && pnpm run build 2>/dev/null || true
RUN cd packages/ui && pnpm run build
ENV NEXT_TELEMETRY_DISABLED=1
RUN cd apps/web-main && pnpm run build

FROM node:20-slim AS runner
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs -s /bin/sh nodejs
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
COPY --from=builder --chown=nodejs:nodejs /app/apps/web-main/.next/standalone ./
COPY --from=builder --chown=nodejs:nodejs /app/apps/web-main/.next/static ./apps/web-main/.next/static
COPY --from=builder --chown=nodejs:nodejs /app/apps/web-main/public ./apps/web-main/public
USER nodejs
EXPOSE 3000
CMD ["node", "apps/web-main/server.js"]
