# KEALEE M-PROJECT-OWNER — Railway Dockerfile
FROM node:20-slim AS deps
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@8.12.0
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/m-project-owner/package.json ./apps/m-project-owner/package.json
COPY packages/intake/package.json ./packages/intake/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY packages/auth/package.json ./packages/auth/package.json
COPY packages/database/package.json ./packages/database/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN pnpm install --filter m-project-owner... --prod=false --ignore-scripts

FROM node:20-slim AS builder
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@8.12.0
WORKDIR /app
COPY --from=deps /app/ ./
COPY packages/database/ ./packages/database/
COPY packages/shared/ ./packages/shared/
COPY packages/intake/ ./packages/intake/
COPY packages/ui/ ./packages/ui/
COPY packages/auth/ ./packages/auth/
COPY apps/m-project-owner/ ./apps/m-project-owner/
# Re-link workspace packages after COPY (pnpm symlinks break across Docker stages)
RUN pnpm install --filter m-project-owner... --prod=false --frozen-lockfile --ignore-scripts 2>/dev/null || true
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" cd packages/database && npx prisma generate
RUN cd packages/shared && pnpm run build 2>/dev/null || true
RUN cd packages/intake && pnpm run build 2>/dev/null || true
RUN cd packages/ui && pnpm run build
RUN cd packages/auth && pnpm run build
ENV NEXT_TELEMETRY_DISABLED=1
RUN cd apps/m-project-owner && pnpm run build

FROM node:20-slim AS runner
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs -s /bin/sh nodejs
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME="0.0.0.0"
COPY --from=builder --chown=nodejs:nodejs /app/apps/m-project-owner/.next/standalone ./
COPY --from=builder --chown=nodejs:nodejs /app/apps/m-project-owner/.next/static ./apps/m-project-owner/.next/static
COPY --from=builder --chown=nodejs:nodejs /app/apps/m-project-owner/public ./apps/m-project-owner/public
USER nodejs
EXPOSE 3000
CMD ["node", "apps/m-project-owner/server.js"]
