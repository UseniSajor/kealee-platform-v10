FROM node:20-bullseye

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

COPY . .

RUN pnpm install --no-frozen-lockfile

# ✅ build only API + its dependencies
RUN pnpm --filter @kealee/api... build

EXPOSE 3000

# Set WORKDIR to the api package so that Railway's start command override
# ("node dist/index.js") resolves to /app/services/api/dist/index.js
# regardless of whether it comes from CMD, railway.toml, or the Railway UI.
WORKDIR /app/services/api

CMD ["node", "dist/index.js"]