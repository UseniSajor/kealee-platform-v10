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

FROM node:20-alpine
ENV NODE_ENV=production PORT=3024
RUN apk add --no-cache openssl ca-certificates
WORKDIR /app/apps/web-main
COPY --from=builder /app/apps/web-main/.next ./.next
COPY --from=builder /app/apps/web-main/public ./public
COPY --from=builder /app/apps/web-main/package.json ./
COPY --from=builder /app/apps/web-main/node_modules ./node_modules
EXPOSE 3024
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=5 CMD node -e "require('http').get('http://localhost:3024/', r => process.exit(r.statusCode===200 ? 0:1))"
CMD ["node", "/app/apps/web-main/node_modules/.next/standalone/server.js"]
