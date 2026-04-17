# Build stage
FROM node:20-slim AS builder

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true PRISMA_CLIENT_ENGINE_TYPE=binary NPM_CONFIG_PRODUCTION=false

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates python3 make gcc g++ && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@8.12.0

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY services ./services
COPY data ./data

RUN pnpm install --filter @kealee/api... --prod=false --ignore-scripts

RUN pnpm --filter @kealee/database run db:generate 2>&1 || true
RUN pnpm --filter @kealee/database run build 2>/dev/null || true
RUN pnpm --filter @kealee/types run build 2>/dev/null || true
RUN pnpm --filter @kealee/shared run build 2>/dev/null || true
RUN pnpm --filter @kealee/storage run build 2>/dev/null || true
RUN pnpm --filter @kealee/estimating run build 2>/dev/null || true
RUN pnpm --filter @kealee/workflow-engine run build 2>/dev/null || true
RUN pnpm --filter @kealee/ai run build 2>/dev/null || true
RUN pnpm --filter @kealee/ai-chat run build 2>/dev/null || true
RUN pnpm --filter @kealee/analytics run build 2>/dev/null || true
RUN pnpm --filter @kealee/audit run build 2>/dev/null || true
RUN pnpm --filter @kealee/observability run build 2>/dev/null || true
RUN pnpm --filter @kealee/intake run build 2>/dev/null || true
RUN pnpm --filter @kealee/redis run build 2>/dev/null || true
RUN pnpm --filter @kealee/realtime run build 2>/dev/null || true
RUN pnpm --filter @kealee/scoring run build 2>/dev/null || true
RUN pnpm --filter @kealee/page-builder run build 2>/dev/null || true
RUN pnpm --filter @kealee/core-ddts run build 2>/dev/null || true
RUN pnpm --filter @kealee/core-events run build 2>/dev/null || true
RUN pnpm --filter @kealee/core-llm run build 2>/dev/null || true
RUN pnpm --filter @kealee/concept-engine run build 2>/dev/null || true
RUN pnpm --filter @kealee/seeds run build 2>/dev/null || true
RUN pnpm --filter @kealee/core-auth run build 2>/dev/null || true

RUN pnpm --filter @kealee/api run db:generate 2>&1 || true
RUN pnpm --filter @kealee/api run build:ts 2>&1 && test -f services/api/dist/index.js || (echo "ERROR: API build failed" && exit 1)

# Production
FROM node:20-slim
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production

COPY --from=builder /app /app

WORKDIR /app/services/api
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health',(r)=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"

CMD ["node", "dist/index.js"]
# Rebuild with fixed Dockerfile (bfdc3516)
