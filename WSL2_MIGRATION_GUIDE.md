# WSL2 Migration Guide — Kealee Platform v10

## Why WSL2?

Running the platform on WSL2 (Linux) instead of directly on the Windows filesystem provides significantly better I/O performance for Node.js, faster `pnpm install`, and avoids Windows path length issues. The API server and all frontend apps start faster and hot-reload more responsively.

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| WSL2 | Ubuntu 22.04+ | `wsl --install -d Ubuntu` |
| Node.js | 20.x | `nvm install 20` |
| pnpm | 8.15.9 | `npm install -g pnpm@8.15.9` |
| Docker Desktop | Latest | Enable WSL2 backend in settings |

---

## Step 1 — Clone to Linux Filesystem

**Important:** Clone to the Linux filesystem (`~/`), not the Windows mount (`/mnt/c/`). The Windows mount has ~10x slower I/O.

```bash
cd ~
git clone <repo-url> kealee-platform-v10
cd kealee-platform-v10
git checkout main
```

If you already have the repo on Windows, you can copy it:

```bash
cp -r "/mnt/c/Kealee-Platform v10" ~/kealee-platform-v10
cd ~/kealee-platform-v10
git remote set-url origin <repo-url>
```

---

## Step 2 — Install Dependencies

```bash
cd ~/kealee-platform-v10
pnpm install
```

The repo uses pnpm workspaces with these config files:

- `.npmrc` — Hoisting config for Next.js and ESLint packages
- `.pnpmrc` — `shamefully-hoist=true`, `node-linker=hoisted`, `auto-install-peers=true`

**If using npm instead of pnpm** (not recommended): You may encounter version resolution issues, especially with Next.js. The `m-estimation` app uses Next.js 15 while other apps use 14.2.35 — pnpm isolates these correctly, but npm may not.

---

## Step 3 — Environment Variables

### Database (choose one)

**Option A — Docker (local PostgreSQL + Redis):**

```bash
docker-compose up -d
```

This starts:
- PostgreSQL 15 on port 5432 (user: `kealee`, password: `kealee_dev`, db: `kealee`)
- Redis 7 on port 6379

```env
# packages/database/.env.local
DATABASE_URL="postgresql://kealee:kealee_dev@localhost:5432/kealee?schema=public"
```

**Option B — Supabase (remote PostgreSQL):**

```env
# packages/database/.env.local
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
```

### API Server

Create `services/api/.env` (or copy from `.env.example`):

```env
PORT=3001
APP_ENV=development
DATABASE_URL="postgresql://kealee:kealee_dev@localhost:5432/kealee?schema=public"
REDIS_URL="redis://localhost:6379"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://[project-ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# AI (for CTC parser and AI features)
ANTHROPIC_API_KEY="sk-ant-..."

# Optional
STRIPE_SECRET_KEY=""
EMAIL_PROVIDER="console"
```

**Critical:** The API requires `APP_ENV` to be set and will refuse to start without it.

### Frontend Apps

Each app needs a `.env.local` with at minimum:

```env
NEXT_PUBLIC_SUPABASE_URL="https://[project-ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

Apps that need `.env.local`:
- `apps/m-estimation/.env.local`
- `apps/m-ops-services/.env.local`
- `apps/m-project-owner/.env.local`
- `apps/os-admin/.env.local`

You can copy from the Windows repo:

```bash
for app in m-estimation m-ops-services m-project-owner os-admin; do
  cp "/mnt/c/Kealee-Platform v10/apps/$app/.env.local" ~/kealee-platform-v10/apps/$app/.env.local 2>/dev/null
done
cp "/mnt/c/Kealee-Platform v10/packages/database/.env.local" ~/kealee-platform-v10/packages/database/.env.local 2>/dev/null
```

---

## Step 4 — Build Packages

Several shared packages must be compiled before the apps can import them:

```bash
cd ~/kealee-platform-v10

# Build all packages in dependency order
pnpm build
```

Or build individually in order:

```bash
# 1. Database (Prisma generate + TypeScript)
cd packages/database && pnpm build && cd ../..

# 2. Shared utilities
cd packages/shared && pnpm build && cd ../..

# 3. Auth (REQUIRED — apps import @kealee/auth/client from dist/)
cd packages/auth && pnpm build && cd ../..

# 4. Storage
cd packages/storage && pnpm build && cd ../..

# 5. Estimating
cd packages/estimating && pnpm build && cd ../..

# 6. Workflow Engine
cd packages/workflow-engine && pnpm build && cd ../..
```

**Note:** `@kealee/ui` exports source `.tsx` files directly and does not need building — apps use `transpilePackages` in their Next.js config.

**Note:** `@kealee/auth` is critical — it exports `./client` mapped to `./dist/client.js`. If dist/ doesn't exist, all apps will fail with `Can't resolve '@kealee/auth/client'`.

---

## Step 5 — Database Setup

```bash
cd ~/kealee-platform-v10

# Run migrations
pnpm db:migrate

# Or push schema directly (for development)
pnpm db:push

# Generate Prisma client
cd packages/database && npx prisma generate
```

If migrating against a non-empty database (e.g., Supabase with existing data), you may need to baseline:

```bash
cd packages/database
for migration in $(ls prisma/migrations/); do
  npx prisma migrate resolve --applied "$migration"
done
```

---

## Step 6 — Start Services

### API Server (port 3001)

```bash
cd ~/kealee-platform-v10/services/api
pnpm dev
# or: npx tsx watch src/index.ts
```

### Frontend Apps

Each app runs in its own terminal:

| App | Command | Port | URL |
|-----|---------|------|-----|
| m-project-owner | `cd apps/m-project-owner && npx next dev` | 3000 | http://localhost:3000 |
| os-admin | `cd apps/os-admin && npx next dev -p 3002` | 3002 | http://localhost:3002 |
| m-ops-services | `cd apps/m-ops-services && npx next dev -p 3005` | 3005 | http://localhost:3005 |
| m-estimation | `cd apps/m-estimation && npx next dev --port 3009` | 3009 | http://localhost:3009 |

**Login pages:**
- Project Owner: http://localhost:3000/login
- Operations Portal: http://localhost:3005/login
- Estimation Portal: http://localhost:3009/login
- Admin: http://localhost:3002/login

---

## Troubleshooting

### `Can't resolve '@kealee/auth/client'`

The `@kealee/auth` package hasn't been built. Run:

```bash
cd ~/kealee-platform-v10/packages/auth && npm run build
```

Then restart the affected Next.js dev server.

### `EADDRINUSE: address already in use`

Kill the process holding the port:

```bash
fuser -k 3001/tcp   # or whichever port
```

### Next.js `createClientModuleProxy` error (m-estimation only)

This happens when two different Next.js versions are installed (15.x local + 14.x root). Fix:

```bash
rm -rf apps/m-estimation/node_modules/next apps/m-estimation/.next
# Restart the dev server — it will use the root Next.js 14
```

### Prisma P3005 (non-empty database)

When running `prisma migrate deploy` against a database with existing data:

```bash
cd packages/database
for migration in $(ls prisma/migrations/); do
  npx prisma migrate resolve --applied "$migration"
done
```

### Slow filesystem performance

Make sure you're running from the Linux filesystem (`~/`), not `/mnt/c/`. The Windows mount has ~10x slower I/O due to the 9P protocol.

### Port conflicts between apps

Several apps default to port 3000 (m-project-owner, m-architect, m-marketplace). Only run one at a time, or specify different ports:

```bash
cd apps/m-project-owner && npx next dev -p 3000
cd apps/m-architect && npx next dev -p 3003
```

---

## Workspace Structure

```
kealee-platform-v10/
├── apps/
│   ├── m-estimation/        # Internal estimation tool (port 3009)
│   ├── m-ops-services/      # GC/contractor portal (port 3005)
│   ├── m-project-owner/     # Project owner portal (port 3000)
│   ├── os-admin/            # PM admin portal (port 3002)
│   ├── m-architect/         # Architect portal
│   ├── m-engineer/          # Engineer portal (port 3008)
│   ├── m-finance-trust/     # Finance portal
│   ├── m-marketplace/       # Marketplace
│   └── m-permits-inspections/ # Permits (port 5173)
├── packages/
│   ├── auth/                # Supabase auth helpers (MUST BUILD)
│   ├── database/            # Prisma schema + client
│   ├── estimating/          # CTC seed script, estimation utils
│   ├── events/              # Event types for CLAWS
│   ├── shared/              # Shared utilities
│   ├── storage/             # File storage (S3/R2)
│   ├── ui/                  # Shared React components (no build needed)
│   └── workflow-engine/     # State machine engine
├── services/
│   ├── api/                 # Fastify API server (port 3001)
│   └── command-center/      # CLAWS event handlers
│       └── claws/
│           ├── acquisition-precon/
│           └── budget-cost/
├── docker-compose.yml       # PostgreSQL 15 + Redis 7
├── pnpm-workspace.yaml
└── turbo.json
```
