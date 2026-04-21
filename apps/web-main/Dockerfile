FROM node:20-alpine AS builder
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true PRISMA_CLIENT_ENGINE_TYPE=binary NPM_CONFIG_PRODUCTION=false NODE_ENV=production
RUN apk add --no-cache python3 make gcc g++ openssl ca-certificates && npm install -g pnpm@8.12.0
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json .npmrc .pnpmrc ./
COPY packages ./packages
COPY apps/web-main ./apps/web-main
RUN pnpm install --prod=false --ignore-scripts && \
    pnpm --filter '@kealee/shared' run build 2>&1 | tail -10 || true && \
    pnpm --filter '@kealee/intake' run build 2>&1 | tail -10 || true && \
    pnpm --filter '@kealee/ui' run build 2>&1 | tail -10 || true && \
    cd /app/apps/web-main && pnpm run build 2>&1 | tail -20

FROM node:20-slim
ENV NODE_ENV=production PORT=3024 HOSTNAME=0.0.0.0
RUN apt-get update -qq && apt-get install -qq -y ca-certificates openssl > /dev/null 2>&1 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /app/apps/web-main/.next/standalone ./
COPY --from=builder /app/apps/web-main/.next/static ./apps/web-main/.next/static
COPY --from=builder /app/apps/web-main/public ./apps/web-main/public
EXPOSE 3024
CMD ["node", "apps/web-main/server.js"]
