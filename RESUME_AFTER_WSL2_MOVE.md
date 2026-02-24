# Resume After WSL2 Move

Instructions for continuing CTC integration work after moving the project to native WSL2 filesystem.

---

## Step 1: Clone or Move the Repo

```bash
# Option A: Clone fresh from GitHub
cd ~/projects
git clone git@github.com:UseniSajor/kealee-platform-v10.git
cd kealee-platform-v10

# Option B: Copy from Windows mount (slower but preserves unstaged changes)
cp -r "/mnt/c/Kealee-Platform v10" ~/projects/kealee-platform-v10
cd ~/projects/kealee-platform-v10
```

The CTC integration commit (`daf48308`) is already on `origin/main`.

## Step 2: Install Dependencies

```bash
# Install pnpm if not already available
npm install -g pnpm

# Install all monorepo dependencies
pnpm install

# Generate Prisma client
cd packages/database
npx prisma generate
```

## Step 3: Run Prisma Migration

```bash
cd packages/database

# Make sure DATABASE_URL is set in .env
# Example: DATABASE_URL="postgresql://user:pass@localhost:5432/kealee?schema=public"

npx prisma migrate dev --name add-ctc-fields
```

This adds:
- `ctcTaskNumber`, `ctcModifierOf`, `sourceDatabase` fields to Assembly
- `TakeoffJob` model with `TakeoffJobStatus` enum

## Step 4: Seed CTC Data

```bash
# Seed the 45 sample CTC tasks for development
cd packages/estimating
npx tsx src/seed-ctc.ts
```

## Step 5: Start Services

```bash
# Terminal 1: Start the API server
cd services/api
pnpm dev

# Terminal 2: Start Redis (for BullMQ)
redis-server

# Terminal 3: Start the estimation app
cd apps/m-estimation
pnpm dev
```

## Step 6: Test CTC Features

### Browse CTC Tasks
- Open `http://localhost:3000/cost-database/ctc`
- Select a CSI division or search

### Import CTC PDF (admin only)
- Open `http://localhost:3000/cost-database/import`
- Switch to "CTC" mode
- Upload the Gordian CTC PDF (`_docs/Construction Task Catalog® - Distribution.pdf`)
- Monitor progress (30-60 min for full 3500-page PDF)

### Create Estimate with CTC Tasks
- Open `http://localhost:3000/estimates/new`
- In "Build Estimate" step, click "Browse CTC Tasks"
- Search and add tasks to the estimate

### AI Takeoff
- Open `http://localhost:3000/estimates/new`
- In "Scope Analysis" step, click "Upload Plans for AI Takeoff"
- Upload architectural plans (PDF/PNG/DWG)

### Project Wizard (PM Portal)
- Open the PM portal at `http://localhost:3002/projects/new`
- Toggle "Include AI-powered CTC estimate"
- Complete the wizard

## Step 7: Full Build Verification

```bash
# From repo root
turbo build

# Or build individual packages in order:
cd packages/database && pnpm build
cd packages/estimating && pnpm build
cd services/api && pnpm build
cd services/command-center && pnpm build
cd apps/m-estimation && pnpm build
```

---

## Environment Variables Needed

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/kealee?schema=public

# Redis (for BullMQ queues)
REDIS_URL=redis://localhost:6379

# Anthropic (for CTC parser + AI takeoff)
ANTHROPIC_API_KEY=sk-ant-...

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Key Directories

```
packages/database/prisma/schema.prisma    # 303 models, CTC fields on Assembly
packages/estimating/src/                  # seed-ctc.ts, ctc-crosswalk.ts
services/api/src/services/               # ctc-parser.service.ts, ai-takeoff.service.ts
services/api/src/modules/estimation/     # CTC routes, project wizard
services/command-center/claws/           # acquisition-precon, budget-cost
apps/m-estimation/                       # CTC browser, import, wizard steps
apps/m-project-owner/                    # Project wizard with CTC toggle
```

## Remaining Work

1. **Process full CTC PDF** - The 27MB Gordian PDF needs to be run through the parser
2. **Build verification** - Run `turbo build` to catch any TypeScript issues
3. **Integration testing** - End-to-end flow from CTC import through budget seeding
4. **Review CTC parsing accuracy** - Spot-check extracted tasks against PDF source
5. **Production deployment** - Railway/Vercel with proper env vars
