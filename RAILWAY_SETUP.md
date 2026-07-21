# Railway Deployment Setup Guide

This guide will help you deploy the Kealee Platform V10 to Railway.

## Prerequisites

- Railway account ([sign up here](https://railway.app))
- GitHub repository connected to Railway
- Environment variables ready (see below)

## Architecture Overview

The Kealee Platform consists of:
- **API Service** (`services/api`) - Fastify-based REST API
- **Worker Service** (`services/worker`) - BullMQ worker for background jobs
- **PostgreSQL** - Database (via Railway addon)
- **Redis** - Queue/cache (via Railway addon or Upstash)

## Step 1: Install Railway CLI (Optional but Recommended)

```bash
npm i -g @railway/cli
railway login
```

## Step 2: Create Railway Project

### Option A: Via Railway Dashboard

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Select branch: `main` (or `master` if that's your default)

### Option B: Via CLI

```bash
cd "c:\Kealee-Platform v10"
railway init
```

## ⚠️ Troubleshooting: Main Branch Disconnected

If your main branch shows as "disconnected" in Railway:

### Quick Fix:

1. **Go to Railway Dashboard** → Your Project → **Settings** → **Source**
2. **Check connection status:**
   - If shows "Disconnected", click **"Connect GitHub"** or **"Reconnect"**
   - If connected but wrong branch, update **Branch** to `main` (or `master`)
3. **Verify repository:**
   - Ensure correct repository is selected
   - Check if repository was renamed/moved
4. **Reconnect if needed:**
   - Click **"Disconnect"** then **"Connect GitHub"**
   - Select repository and branch again

### Common Causes:
- GitHub token expired → Reconnect GitHub
- Repository renamed → Update repository in Railway
- Branch name mismatch → Update branch to `main` or `master`
- Permissions changed → Re-authorize Railway in GitHub

**See `RAILWAY_TROUBLESHOOTING.md` for detailed troubleshooting steps.**

## Step 3: Add PostgreSQL Database

1. In Railway dashboard, click "New" → "Database" → "PostgreSQL"
2. Railway will automatically create a `DATABASE_URL` environment variable
3. Note the connection string for later use

## Step 4: Add Redis

### Option A: Railway Redis (Recommended for simplicity)

1. In Railway dashboard, click "New" → "Database" → "Redis"
2. Railway will automatically create a `REDIS_URL` environment variable

### Option B: Upstash Redis (Recommended for production)

1. Sign up at [Upstash](https://upstash.com)
2. Create a Redis database
3. Copy the connection URL
4. Add it as `REDIS_URL` environment variable in Railway

## Important: Environment Variables

**`.env.local` files do NOT connect to Railway!**

- `.env.local` files are for **local development only** (gitignored)
- Railway uses **environment variables set in the Railway dashboard**
- You must **manually add** each variable from `.env.local` to Railway
- See `RAILWAY_ENV_VARS.md` for detailed explanation

## Step 5: Deploy API Service

### Via Dashboard:

1. In your Railway project, click "New Service"
2. Select "GitHub Repo" and choose your repository
3. Railway will auto-detect the project
4. Configure the service:
   - **Root Directory**: Leave empty (monorepo root)
   - **Build Command**: `pnpm install && pnpm build --filter=@kealee/api`
   - **Start Command**: `cd services/api && node dist/index.js`
   - **Watch Paths**: `services/api/**`

### Via CLI:

```bash
cd "c:\Kealee-Platform v10"
railway link  # Link to your project
railway service create api
railway up --service api
```

### Environment Variables for API Service:

Add these in Railway dashboard under the API service's "Variables" tab:

```env
# Server
PORT=3001
NODE_ENV=production

# Database (automatically set by Railway PostgreSQL addon)
# DATABASE_URL=postgresql://...

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# API URL (set after deployment)
API_URL=https://your-api-service.railway.app

# Logging
LOG_LEVEL=info

# Redis (for BullMQ queues)
REDIS_URL=your_redis_url

# Stripe (if using billing)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# DocuSign (if using)
DOCUSIGN_INTEGRATION_KEY=your_docusign_key
DOCUSIGN_USER_ID=your_docusign_user_id
DOCUSIGN_ACCOUNT_ID=your_docusign_account_id
DOCUSIGN_RSA_PRIVATE_KEY=your_docusign_private_key
DOCUSIGN_BASE_PATH=https://demo.docusign.net/restapi

# CORS (adjust for your frontend domains)
CORS_ORIGIN=https://your-frontend-domain.com
```

## Step 6: Deploy Next.js Apps (Optional)

If you have Next.js frontend apps, deploy them as separate services:

### Example: Deploy m-architect App

1. In Railway dashboard, click "New Service"
2. Select "GitHub Repo" and choose your repository
3. Configure the service:
   - **Root Directory**: Leave empty (monorepo root)
   - **Build Command**: `pnpm install && pnpm build --filter=@kealee/m-architect`
   - **Start Command**: `cd apps/m-architect && pnpm start`
   - **Watch Paths**: `apps/m-architect/**`

### Environment Variables for Next.js Apps:

```env
# Next.js
NODE_ENV=production

# API URL (your Railway API service URL)
NEXT_PUBLIC_API_URL=https://your-api-service.railway.app

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Port (Railway sets this automatically, but Next.js may need it)
PORT=3000
```

**Note**: Railway automatically sets `PORT`. Next.js apps should use `process.env.PORT` or configure Next.js to use the Railway-provided port.

## Step 7: Deploy Worker Service

### Via Dashboard:

1. In your Railway project, click "New Service"
2. Select "GitHub Repo" and choose your repository
3. Configure the service:
   - **Root Directory**: Leave empty (monorepo root)
   - **Build Command**: `pnpm install && pnpm build --filter=@kealee/worker`
   - **Start Command**: `cd services/worker && node dist/index.js`
   - **Watch Paths**: `services/worker/**`

### Via CLI:

```bash
railway service create worker
railway up --service worker
```

### Environment Variables for Worker Service:

```env
# Redis (for BullMQ queues)
REDIS_URL=your_redis_url

# Database (same as API service)
DATABASE_URL=postgresql://...

# SendGrid (for email queue)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@kealee.com
SENDGRID_FROM_NAME=Kealee Platform

# Anthropic (for ML queue)
ANTHROPIC_API_KEY=your_anthropic_api_key

# Webhook (optional)
WEBHOOK_SECRET=your_webhook_secret

# Reports (optional)
REPORTS_DIR=/app/reports
REPORTS_URL_PREFIX=/reports

# Disable test jobs in production
TEST_EMAIL=false
TEST_WEBHOOK=false
TEST_ML=false
```

## Step 8: Configure Monorepo Build

Railway needs to understand this is a monorepo. The `railway.json` files in each service directory handle this, but you may need to configure:

1. **Root Directory**: Keep as root (empty)
2. **Build Command**: Uses Turbo to build only the specific service
3. **Install Command**: `pnpm install` (runs at root, installs all workspace dependencies)

## Step 9: Set Up Health Checks

Railway automatically monitors your services. Ensure your services have health endpoints:

- **API**: `GET /health` (should return 200 OK)
- **Worker**: Checks Redis connection on startup

## Step 10: Configure Custom Domains (Optional)

1. In Railway dashboard, go to your service
2. Click "Settings" → "Networking"
3. Add your custom domain
4. Railway will provide DNS records to configure

## Step 11: Set Up Environment Variables Sharing

For variables shared between services (like `DATABASE_URL`):

1. Go to Project Settings → "Variables"
2. Add shared variables (they'll be available to all services)
3. Service-specific variables go in each service's "Variables" tab

## Step 12: Deploy and Monitor

1. Push your code to GitHub
2. Railway will automatically deploy on push (if auto-deploy is enabled)
3. Monitor deployments in the Railway dashboard
4. Check logs: `railway logs --service api` or via dashboard

## Troubleshooting

### Build Fails

- **Issue**: `pnpm: command not found`
  - **Solution**: Railway should auto-detect pnpm. If not, add `NIXPACKS_PKG_MANAGER=pnpm` environment variable

- **Issue**: Workspace dependencies not found
  - **Solution**: Ensure build command runs from root: `cd ../.. && pnpm install`

### Service Won't Start

- **Issue**: Port binding error
  - **Solution**: Railway sets `PORT` automatically. Ensure your code uses `process.env.PORT`

- **Issue**: Database connection fails
  - **Solution**: Verify `DATABASE_URL` is set correctly. Railway PostgreSQL addon sets this automatically.

### Worker Not Processing Jobs

- **Issue**: Redis connection fails
  - **Solution**: Verify `REDIS_URL` is correct. Test connection: `redis-cli -u $REDIS_URL ping`

## Environment Variables Checklist

### API Service ✅
- [ ] `PORT` (auto-set by Railway)
- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL` (from PostgreSQL addon)
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_ANON_KEY`
- [ ] `REDIS_URL`
- [ ] `API_URL` (set after first deployment)
- [ ] `STRIPE_SECRET_KEY` (if using)
- [ ] `STRIPE_WEBHOOK_SECRET` (if using)

### Worker Service ✅
- [ ] `REDIS_URL`
- [ ] `DATABASE_URL`
- [ ] `SENDGRID_API_KEY`
- [ ] `SENDGRID_FROM_EMAIL`
- [ ] `ANTHROPIC_API_KEY`
- [ ] `TEST_EMAIL=false`
- [ ] `TEST_WEBHOOK=false`
- [ ] `TEST_ML=false`

## Next Steps

1. ✅ Deploy API service
2. ✅ Deploy Worker service
3. ✅ Set up PostgreSQL
4. ✅ Set up Redis
5. ✅ Configure environment variables
6. ✅ Test API endpoints
7. ✅ Monitor logs and metrics
8. ✅ Set up custom domains
9. ✅ Configure CI/CD (optional)
10. ✅ Set up monitoring/alerts (optional)

## Useful Railway Commands

```bash
# View logs
railway logs --service api
railway logs --service worker

# Open service in browser
railway open --service api

# View environment variables
railway variables --service api

# Run commands in service
railway run --service api pnpm test

# Deploy specific service
railway up --service api
```

## Cost Optimization Tips

1. **Use Railway's free tier** for development/staging
2. **Scale down** services when not in use (Railway supports sleep)
3. **Use Upstash Redis** (free tier available) instead of Railway Redis for production
4. **Monitor usage** in Railway dashboard
5. **Set up usage alerts** to avoid surprises

## Support

- [Railway Documentation](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
- [Railway Status](https://status.railway.app)
