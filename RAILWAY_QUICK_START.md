# Railway Quick Start Guide

Quick reference for deploying to Railway.

## Prerequisites Checklist

- [ ] Railway account created
- [ ] GitHub repository connected
- [ ] Environment variables documented
- [ ] **Important**: `.env.local` files are for local dev only - you must add variables to Railway dashboard manually

## ⚠️ Environment Variables Note

**`.env.local` files do NOT automatically sync to Railway!**

- Railway doesn't read `.env.local` files
- You must manually add each variable in Railway dashboard
- See `RAILWAY_ENV_VARS.md` for full explanation

## Quick Deploy Commands

### 1. Install Railway CLI
```bash
npm i -g @railway/cli
railway login
```

### 2. Initialize Project
```bash
cd "c:\Kealee-Platform v10"
railway init
```

### 3. Add PostgreSQL
In Railway dashboard: **New** → **Database** → **PostgreSQL**

### 4. Add Redis
In Railway dashboard: **New** → **Database** → **Redis**
OR use Upstash and add `REDIS_URL` manually

### 5. Deploy API Service

**Via Dashboard:**
1. **New Service** → **GitHub Repo**
2. **Settings** → **Source**:
   - Root Directory: (empty/root)
   - Build Command: `pnpm install && pnpm build --filter=@kealee/api`
   - Start Command: `cd services/api && node dist/index.js`

**Via CLI:**
```bash
railway service create api
railway up --service api
```

### 6. Deploy Worker Service

**Via Dashboard:**
1. **New Service** → **GitHub Repo**
2. **Settings** → **Source**:
   - Root Directory: (empty/root)
   - Build Command: `pnpm install && pnpm build --filter=@kealee/worker`
   - Start Command: `cd services/worker && node dist/index.js`

**Via CLI:**
```bash
railway service create worker
railway up --service worker
```

## Required Environment Variables

### API Service
```bash
PORT=3001  # Auto-set by Railway
NODE_ENV=production
DATABASE_URL=  # Auto-set by PostgreSQL addon
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=  # ⚠️ REQUIRED for API keys, webhooks, security audit
REDIS_URL=
API_URL=  # Set after deployment
```

### Worker Service
```bash
REDIS_URL=
DATABASE_URL=  # Same as API
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=noreply@kealee.com
ANTHROPIC_API_KEY=
TEST_EMAIL=false
TEST_WEBHOOK=false
TEST_ML=false
```

## Useful Commands

```bash
# View logs
railway logs --service api
railway logs --service worker

# Open in browser
railway open --service api

# View variables
railway variables --service api

# Deploy
railway up --service api
```

## Troubleshooting

**Build fails?**
- Check Node version (should be 20)
- Verify pnpm is available
- Check build command runs from root

**Service won't start?**
- Verify PORT is set (Railway auto-sets this)
- Check DATABASE_URL is correct
- Verify all required env vars are set

**Worker not processing?**
- Check REDIS_URL is correct
- Verify Redis is accessible
- Check worker logs for errors

## Next Steps

1. ✅ Deploy API
2. ✅ Deploy Worker
3. ✅ Test endpoints
4. ✅ Set up custom domain
5. ✅ Configure monitoring

See `RAILWAY_SETUP.md` for detailed instructions.
