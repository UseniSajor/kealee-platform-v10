FROM node:20

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm@8.15.9

# Copy everything
COPY . .

# Install dependencies (pnpm workspace-aware)
RUN pnpm install --no-frozen-lockfile

# Build all apps
RUN pnpm build

# Default (overridden per service)
CMD ["node", "dist/index.js"]
