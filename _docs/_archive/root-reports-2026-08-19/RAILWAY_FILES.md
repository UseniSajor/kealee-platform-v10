# Railway Configuration Files

This document describes all Railway-related files in the project.

## Files Created

### 1. `services/api/railway.json`
Railway configuration for the API service. Specifies:
- Builder: NIXPACKS (auto-detects Node.js/pnpm)
- Start command: Runs the compiled API from `dist/index.js`
- Restart policy: Automatic restart on failure

**Note**: Build command is configured in Railway dashboard or via `nixpacks.toml`

### 2. `services/worker/railway.json`
Railway configuration for the Worker service. Specifies:
- Builder: NIXPACKS
- Start command: Runs the compiled worker from `dist/index.js`
- Restart policy: Automatic restart on failure

### 3. `nixpacks.toml` (root)
Nixpacks configuration for Railway builds. Ensures:
- Node.js 20 is used
- pnpm is available
- Proper install command with frozen lockfile

### 4. `.nvmrc` (root)
Specifies Node.js version 20 for local development and Railway builds.

### 5. `RAILWAY_SETUP.md`
Comprehensive setup guide with:
- Step-by-step deployment instructions
- Environment variables checklist
- Troubleshooting guide
- Cost optimization tips

### 6. `RAILWAY_QUICK_START.md`
Quick reference guide for:
- Fast deployment commands
- Essential environment variables
- Common troubleshooting

## How Railway Detects Your Project

1. **Monorepo Detection**: Railway detects the monorepo structure from `pnpm-workspace.yaml`
2. **Build Commands**: Configured per-service in Railway dashboard:
   - API: `pnpm install && pnpm build --filter=@kealee/api`
   - Worker: `pnpm install && pnpm build --filter=@kealee/worker`
3. **Start Commands**: Specified in `railway.json` files
4. **Node Version**: Detected from `.nvmrc` or `package.json`

## Service Configuration

Each service needs to be configured in Railway dashboard with:

### API Service
- **Root Directory**: (empty - monorepo root)
- **Build Command**: `pnpm install && pnpm build --filter=@kealee/api`
- **Start Command**: `cd services/api && node dist/index.js`
- **Watch Paths**: `services/api/**` (for auto-deploy)

### Worker Service
- **Root Directory**: (empty - monorepo root)
- **Build Command**: `pnpm install && pnpm build --filter=@kealee/worker`
- **Start Command**: `cd services/worker && node dist/index.js`
- **Watch Paths**: `services/worker/**` (for auto-deploy)

## Environment Variables

Environment variables are set per-service in Railway dashboard:
- **Project-level**: Shared variables (like `DATABASE_URL` from PostgreSQL addon)
- **Service-level**: Service-specific variables (like `SENDGRID_API_KEY` for worker)

## Next Steps

1. Read `RAILWAY_SETUP.md` for detailed instructions
2. Use `RAILWAY_QUICK_START.md` for quick reference
3. Configure services in Railway dashboard
4. Set environment variables
5. Deploy!
