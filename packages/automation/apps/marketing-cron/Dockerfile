FROM node:20-alpine

WORKDIR /app

# Copy pnpm lock and package files
COPY pnpm-lock.yaml ./
COPY package.json ./

# Install dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source code
COPY packages ./packages
COPY tsconfig.base.json ./
COPY turbo.json ./

# Build marketing-cron service
RUN cd packages/automation/apps/marketing-cron && pnpm run build

# Start the service
CMD ["node", "packages/automation/apps/marketing-cron/dist/index.js"]
