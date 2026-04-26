FROM node:20-bullseye

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

COPY . .

RUN pnpm install --no-frozen-lockfile

# ✅ build only API + its dependencies
RUN pnpm --filter @kealee/api... build

EXPOSE 3000

CMD ["pnpm", "--filter", "@kealee/api", "start"]