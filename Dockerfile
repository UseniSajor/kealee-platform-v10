FROM node:20-bullseye

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# Copy entire monorepo
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build only API
RUN pnpm --filter @kealee/api build

# Expose port
EXPOSE 3000

# Start API
CMD ["pnpm", "--filter", "@kealee/api", "start"]