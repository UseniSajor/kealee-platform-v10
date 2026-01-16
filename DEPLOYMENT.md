# 🚀 Deployment Guide - One-Click Promote to Production

## Quick Start

### Option 1: GitHub Actions (Recommended)
1. Go to **Actions** tab in GitHub
2. Click **"Deploy to Railway"** workflow
3. Click **"Run workflow"**
4. Select environment: `staging` or `production`
5. Click **"Run workflow"** button

### Option 2: Command Line Script
```bash
# Deploy to staging
./scripts/deploy.sh staging

# Deploy to production
./scripts/deploy.sh production

# Promote staging to production (one-click!)
./scripts/deploy.sh promote
```

### Option 3: Node.js Script
```bash
# One-click promote to production
node scripts/promote-to-prod.js
```

---

## 🏗️ Railway Setup

### 1. Create Two Services

**Staging Service:**
- Name: `api-staging`
- Branch: `staging`
- Environment: `staging`

**Production Service:**
- Name: `api-production`
- Branch: `main`
- Environment: `production`

### 2. Configure Services

Both services should use:
- **Build Command:** `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true pnpm install --frozen-lockfile && pnpm build --filter=@kealee/api`
- **Start Command:** `cd services/api && node dist/index.js`
- **Health Check:** `/health`

### 3. Environment Variables

Set these in Railway dashboard for each service:

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `NODE_ENV` - `production` or `staging`
- `PORT` - `3001` (or Railway's assigned port)

**Optional:**
- `REDIS_URL` - Redis connection (for queues)
- `SENDGRID_API_KEY` - Email sending
- `STRIPE_SECRET_KEY` - Payments
- `ANTHROPIC_API_KEY` - AI features

---

## 🔄 Deployment Workflow

### Standard Flow:
```
1. Push to `staging` branch
   ↓
2. Auto-deploy to staging environment
   ↓
3. Test in staging
   ↓
4. Merge `staging` → `main`
   ↓
5. Auto-deploy to production
```

### One-Click Promote Flow:
```
1. Deploy to staging (via push or manual)
   ↓
2. Test in staging
   ↓
3. Run: ./scripts/deploy.sh promote
   ↓
4. Staging deployment promoted to production
```

---

## ⚡ Build Optimization

### To Prevent Timeouts:

1. **Use Build Caching:**
   - Railway caches `node_modules` between builds
   - Turborepo caches build outputs

2. **Optimize Build Command:**
   ```bash
   # Skip Puppeteer download (saves ~2-3 minutes)
   PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true pnpm install --frozen-lockfile
   
   # Build only what's needed
   pnpm build --filter=@kealee/api
   ```

3. **Use Railway Build Cache:**
   - Railway automatically caches dependencies
   - Set `RAILWAY_BUILD_CACHE=true` in environment

4. **Increase Build Timeout:**
   - Railway default: 15 minutes
   - Can be increased in Railway dashboard

---

## 🐛 Troubleshooting

### Build Timeout
**Solution:**
1. Check build logs for slow steps
2. Optimize dependencies (remove unused packages)
3. Use build caching
4. Split build into multiple steps if needed

### Deployment Fails
**Solution:**
1. Check Railway logs: `railway logs --service api-production`
2. Verify environment variables are set
3. Check health endpoint: `curl https://your-api.railway.app/health`
4. Verify database connection

### Promote Fails
**Solution:**
1. Ensure staging deployment is successful first
2. Check both services exist in Railway
3. Verify Railway CLI is logged in: `railway whoami`
4. Check service names match: `api-staging` and `api-production`

---

## 📊 Monitoring

### Check Deployment Status:
```bash
# Staging
railway status --service api-staging

# Production
railway status --service api-production
```

### View Logs:
```bash
# Staging logs
railway logs --service api-staging

# Production logs
railway logs --service api-production --follow
```

### Health Check:
```bash
# Staging
curl https://api-staging.railway.app/health

# Production
curl https://api-production.railway.app/health
```

---

## 🔐 Security Best Practices

1. **Never commit secrets** - Use Railway environment variables
2. **Use different keys** for staging and production
3. **Enable Railway's built-in security** features
4. **Monitor deployments** for unauthorized changes
5. **Use branch protection** on `main` branch

---

## 📝 GitHub Actions Setup

1. Add Railway token to GitHub Secrets:
   - Go to: Settings → Secrets and variables → Actions
   - Add: `RAILWAY_TOKEN` (get from Railway dashboard)

2. Enable workflow:
   - Go to: Actions tab
   - Enable "Deploy to Railway" workflow

3. Workflow will run on:
   - Push to `main` → Deploy to production
   - Push to `staging` → Deploy to staging
   - Manual trigger → Choose environment

---

## 🎯 Quick Reference

| Command | Action |
|---------|--------|
| `./scripts/deploy.sh staging` | Deploy to staging |
| `./scripts/deploy.sh production` | Deploy to production |
| `./scripts/deploy.sh promote` | Promote staging → production |
| `railway status` | Check deployment status |
| `railway logs --follow` | Follow logs in real-time |
| `railway open` | Open Railway dashboard |

---

## ✅ Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Build completes successfully locally
- [ ] Health check endpoint working
- [ ] Staging deployment tested
- [ ] Backup production database (if promoting)

---

**Need Help?** Check Railway docs: https://docs.railway.app
