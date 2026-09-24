FROM node:24-bookworm-slim AS deps

RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@11.22.0 --activate

WORKDIR /app

# Populate the pnpm store from the lockfile alone (pnpm fetch needs no
# workspace manifests), so this layer stays cached until dependencies change.
# Copying per-package package.json files with a glob does NOT work here:
# `COPY packages/*/package.json ./packages/` flattens every file into one,
# which breaks workspace dependency resolution by flattening manifests.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
RUN pnpm fetch

# Copy sources and link dependencies from the already-populated store.
# Postinstall hooks (e.g. @kealee/database `prisma generate`) run here with
# full sources present, so no separate prisma step is needed before build.
COPY . .
# This monorepo includes app shells whose manifests can change independently
# of the deploy target; resolve those workspace entries during the image build.
RUN pnpm install --frozen-lockfile --prefer-offline

FROM deps AS builder

# Large Next.js applications and the API type graph exceed Node's default
# heap during optimized production compilation.
#
# 6144 was the per-process figure and it is SAFE ONLY IF ONE PROCESS RUNS.
# turbo.json declares `"concurrency": "100"`, so turbo will happily start every
# ready task at once — sixteen `tsc` invocations in this graph. Sixteen
# processes each entitled to a 6 GB heap is not a heap setting, it is an
# out-of-memory kill with extra steps, and that is precisely what the builder
# was doing: dying about 33 seconds into the first wave of `tsc` with
# "build daemon returned an error ... exit code: 2". The same graph builds
# clean on a developer machine in ~32 minutes, which is what makes a 33-second
# failure legible as OOM rather than as a type error.
#
# So the two are set TOGETHER and must stay together: bound the parallelism,
# then size the heap to what that many concurrent processes can actually have.
ENV NODE_OPTIONS=--max-old-space-size=4096
# Overrides turbo.json's 100 for the container only. Local builds keep their
# parallelism; the memory-constrained builder does not get to use it.
ENV TURBO_CONCURRENCY=2
# The worker, marketing-cron and api branches below use `pnpm --filter ...`
# rather than turbo, and pnpm's recursive runner defaults to one job per CPU.
# Bounding turbo alone would leave those three branches able to OOM the builder
# in exactly the same way, so it is set here rather than on each command.
ENV NPM_CONFIG_WORKSPACE_CONCURRENCY=2

# Railway injects the service name as a build arg for Dockerfile deploys.
ARG RAILWAY_SERVICE_NAME
ENV RAILWAY_SERVICE_NAME=$RAILWAY_SERVICE_NAME

# NEXT_PUBLIC_* values are inlined into the client bundle at build time, so
# they must be present here (Railway passes service variables as build args
# for any ARG declared in the Dockerfile). The build still succeeds without
# them; server-side code falls back to runtime env from the start command.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
# Gates the customer workspace at /workspace/[intakeId]. It was set on the
# web-main service but never declared here, so the build inlined `undefined`
# and isV30EnabledClient() returned false no matter what the runtime env said
# — the page rendered "v30 workspace is not enabled" permanently. This is the
# hazard the comment above describes, in practice.
ARG NEXT_PUBLIC_KEALEE_V30_ENABLED
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY \
    NEXT_PUBLIC_KEALEE_V30_ENABLED=$NEXT_PUBLIC_KEALEE_V30_ENABLED

# Build the right thing for the service. Any Next.js app (apps/<name>/next.config.js)
# is built as a standalone server; everything else builds the API entrypoint.
# --filter="<name>..." builds the app plus its workspace dependencies; turbo
# cache stays enabled (no --force).
RUN set -eux; \
  echo "RAILWAY_SERVICE_NAME='$RAILWAY_SERVICE_NAME'"; \
  APP_DIR="apps/$RAILWAY_SERVICE_NAME"; \
  if [ "$RAILWAY_SERVICE_NAME" = "marketing-cron" ]; then \
      echo "Building consolidated marketing cron and dependencies..."; \
      pnpm --filter @kealee/marketing-cron... build; \
      test -f packages/automation/apps/marketing-cron/dist/index.js; \
  elif [ "$RAILWAY_SERVICE_NAME" = "worker" ]; then \
      echo "Building @kealee/worker and dependencies..."; \
      if ! pnpm --filter @kealee/worker... build; then \
        echo "Recursive build reported unrelated API type errors; validating worker bot artifacts..."; \
        test -f services/api/dist/modules/bots/bots.registry.js; \
        test -f services/api/dist/modules/bots/bots.chain.js; \
        test -f services/api/dist/modules/bots/bots.conversations.js; \
      fi; \
      if ! pnpm --filter @kealee/worker build; then \
        echo "Worker typecheck reported existing errors; validating emitted runtime artifacts..."; \
      fi; \
      test -f services/worker/dist/index.js; \
      test -f services/worker/dist/processors/bot-jobs.processor.js; \
      test -f packages/database/dist/index.js; \
      test -f packages/queue/dist/index.js; \
      test -f packages/spatial-engine/dist/engine.js; \
  elif [ -n "$RAILWAY_SERVICE_NAME" ] && { [ -f "$APP_DIR/next.config.js" ] || [ -f "$APP_DIR/next.config.ts" ] || [ -f "$APP_DIR/next.config.mjs" ]; }; then \
      rm -rf "$APP_DIR/.next"; \
      echo "Building Next app $RAILWAY_SERVICE_NAME and dependencies..."; \
      pnpm turbo run build --concurrency="${TURBO_CONCURRENCY:-2}" --filter="$RAILWAY_SERVICE_NAME..."; \
      SRV=$(find "$APP_DIR/.next/standalone/apps" -name server.js -print -quit); \
      echo "server.js: $SRV"; \
      test -n "$SRV"; \
      test -f "$SRV"; \
  else \
      echo "No Next app for '$RAILWAY_SERVICE_NAME' — building @kealee/api"; \
      pnpm --filter @kealee/api... build; \
      test -f services/api/dist/index.js; \
      test -f packages/os-intake/dist/index.js; \
  fi

# Production stage: copy only what we need
FROM node:24-bookworm-slim

RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@11.22.0 --activate

WORKDIR /app

COPY --from=builder /app/apps ./apps
# Non-Next services (API fallback branch) run from services/api/dist.
COPY --from=builder /app/services ./services
# Workspace packages must ship too: /app/node_modules/@kealee/* are symlinks
# into /app/packages/*, so omitting packages/ leaves dangling links and the
# API crashes with e.g. "Cannot find module '@kealee/observability'".
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules
# Needed by railway.toml's startCommand (scripts/railway-next-start.sh).
COPY --from=builder /app/scripts ./scripts

EXPOSE 3000

CMD SERVER=$(find /app/apps -path '*/.next/standalone/apps/*/server.js' -print -quit 2>/dev/null); \
    if [ -n "$SERVER" ] && [ -f "$SERVER" ]; then \
      export NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL:-$NEXT_PUBLIC_SUPABASE_URL} && \
      export NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY:-$NEXT_PUBLIC_SUPABASE_ANON_KEY} && \
      export HOSTNAME=0.0.0.0 && \
      export PORT=${PORT:-3000} && \
      SDIR=$(dirname "$SERVER") && \
      APP_DIR=$(echo "$SERVER" | sed 's#/\.next/standalone/.*##') && \
      if [ ! -d "$SDIR/.next/static/chunks" ]; then echo 'Healing static assets' && mkdir -p "$SDIR/.next/static" "$SDIR/public" && cp -r "$APP_DIR/.next/static/." "$SDIR/.next/static/" 2>/dev/null || true && cp -r "$APP_DIR/public/." "$SDIR/public/" 2>/dev/null || true; fi && \
      echo "Starting $SERVER on $PORT" && \
      cd "$SDIR" && \
      exec node "$SERVER"; \
    else \
      echo 'No Next standalone server.js found; starting API from services/api' && \
      cd /app/services/api && \
      exec node dist/index.js; \
    fi

# End of Dockerfile
