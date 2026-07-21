# Next Steps After Railway Deployment is Active

## ✅ Your Service is Live! What's Next?

Once your Railway deployment shows as "Active" or "Running", follow these steps:

## Step 1: Verify Your Service is Working

### Check Service Status

1. **In Railway Dashboard:**
   - Go to your service
   - Check the **"Metrics"** tab
   - Should show: ✅ **Active** or **Running**
   - CPU/Memory usage should be visible

2. **Check Logs:**
   - Go to **"Logs"** tab
   - Look for: `🚀 API server running on port...`
   - No error messages should appear

### Test Your API

1. **Get Your Service URL:**
   - Railway Dashboard → Your Service → **Settings** → **Networking**
   - Copy the **Public Domain** (e.g., `your-service.railway.app`)

2. **Test Health Endpoint:**
   ```bash
   # In browser or terminal:
   curl https://your-service.railway.app/health
   
   # Should return: {"status":"ok"} or similar
   ```

3. **Test API Endpoint:**
   ```bash
   # Test a simple endpoint
   curl https://your-service.railway.app/api/health
   ```

## Step 2: Set Up Environment Variables

### Required Environment Variables

Go to Railway Dashboard → Your Service → **Settings** → **Variables**

Add these variables:

#### For API Service:

```env
# Server
PORT=3001  # Railway sets this automatically, but good to have
NODE_ENV=production

# Database (if using Railway PostgreSQL addon, this is auto-set)
DATABASE_URL=postgresql://...

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Redis
REDIS_URL=your_redis_url

# API URL (set this to your Railway service URL)
API_URL=https://your-service.railway.app

# Logging
LOG_LEVEL=info
```

#### For Worker Service:

```env
# Redis
REDIS_URL=your_redis_url

# Database
DATABASE_URL=postgresql://...

# SendGrid
SENDGRID_API_KEY=your_sendgrid_key
SENDGRID_FROM_EMAIL=noreply@kealee.com

# Anthropic
ANTHROPIC_API_KEY=your_anthropic_key

# Disable test jobs in production
TEST_EMAIL=false
TEST_WEBHOOK=false
TEST_ML=false
```

### How to Add Variables

1. Railway Dashboard → Service → **Settings** → **Variables**
2. Click **"New Variable"**
3. Enter **Name** and **Value**
4. Click **"Add"**
5. Service will automatically redeploy with new variables

## Step 3: Set Up Database (If Not Done)

### Option A: Railway PostgreSQL (Easiest)

1. Railway Dashboard → Your Project
2. Click **"New"** → **"Database"** → **"PostgreSQL"**
3. Railway automatically creates `DATABASE_URL` variable
4. **Important:** This variable is shared with all services in the project

### Option B: External Database

1. Use your existing PostgreSQL connection string
2. Add as `DATABASE_URL` variable in Railway

### Run Migrations

After database is set up:

```bash
# Using Railway CLI
railway run --service api pnpm prisma migrate deploy

# Or via Railway dashboard:
# Service → Deployments → Redeploy (after setting DATABASE_URL)
```

## Step 4: Set Up Redis (If Not Done)

### Option A: Railway Redis

1. Railway Dashboard → **"New"** → **"Database"** → **"Redis"**
2. Railway automatically creates `REDIS_URL` variable

### Option B: Upstash Redis (Recommended for Production)

1. Sign up at [Upstash](https://upstash.com)
2. Create Redis database
3. Copy connection URL
4. Add as `REDIS_URL` variable in Railway

## Step 5: Configure Custom Domain (Optional)

1. Railway Dashboard → Service → **Settings** → **Networking**
2. Click **"Custom Domain"**
3. Enter your domain (e.g., `api.yourdomain.com`)
4. Railway will provide DNS records
5. Add DNS records to your domain provider
6. Wait for DNS propagation (5-30 minutes)

## Step 6: Set Up Monitoring & Alerts

### Railway Built-in Monitoring

1. Go to **"Metrics"** tab
2. Monitor:
   - CPU usage
   - Memory usage
   - Request count
   - Error rate

### Set Up Alerts (Optional)

1. Railway Dashboard → Project → **Settings** → **Notifications**
2. Configure alerts for:
   - Deployment failures
   - High resource usage
   - Service downtime

## Step 7: Test Full Workflow

### Test API Endpoints

```bash
# Health check
curl https://your-service.railway.app/health

# Test authentication (if implemented)
curl -X POST https://your-service.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Test protected endpoint
curl https://your-service.railway.app/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Worker Service (If Deployed)

1. Check worker logs for:
   - ✅ Redis connection successful
   - ✅ Queues initialized
   - ✅ Workers started

2. Send a test job (via API or directly)

## Step 8: Set Up CI/CD (Optional but Recommended)

### Enable Auto-Deploy

1. Railway Dashboard → Service → **Settings** → **Source**
2. Ensure **"Auto Deploy"** is enabled
3. Select branch: `main`
4. Now every push to `main` will auto-deploy

### GitHub Actions (Advanced)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Railway
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: bervProject/railway-deploy@v0.2.4
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
```

## Step 9: Security Checklist

- [ ] All environment variables are set
- [ ] No secrets committed to git
- [ ] Service role keys are secure
- [ ] CORS is configured correctly
- [ ] Rate limiting is enabled
- [ ] HTTPS is enabled (Railway does this automatically)
- [ ] Database is not publicly accessible
- [ ] API keys are rotated regularly

## Step 10: Performance Optimization

### Monitor Performance

1. Check **Metrics** tab regularly
2. Watch for:
   - High CPU usage
   - Memory leaks
   - Slow response times

### Optimize if Needed

- Enable caching (Redis)
- Optimize database queries
- Add CDN for static assets
- Scale resources if needed

## Step 11: Documentation

### Update Your Documentation

1. Document your API endpoints
2. Update deployment instructions
3. Document environment variables
4. Create API documentation (Swagger/OpenAPI)

### Share Access

- Add team members to Railway project
- Share service URLs
- Document how to access logs

## Step 12: Set Up Additional Services

### Deploy Worker Service

1. Create new service in Railway
2. Configure build/start commands (see `RAILWAY_DASHBOARD_SETUP.md`)
3. Set environment variables
4. Deploy

### Deploy Next.js Apps (If Needed)

1. Create new service
2. Build: `pnpm install && pnpm build --filter=@kealee/your-app`
3. Start: `cd apps/your-app && pnpm start`
4. Set environment variables

## Troubleshooting Common Issues

### Service Won't Start

1. Check logs for errors
2. Verify environment variables are set
3. Check build succeeded
4. Verify database/Redis connections

### 500 Errors

1. Check service logs
2. Verify database connection
3. Check environment variables
4. Verify dependencies installed

### Slow Performance

1. Check metrics (CPU/Memory)
2. Review database queries
3. Check Redis connection
4. Consider scaling resources

## Quick Reference Commands

```bash
# View logs
railway logs --service api

# View variables
railway variables --service api

# Set variable
railway variables set KEY=value --service api

# Open service in browser
railway open --service api

# Redeploy
railway up --service api
```

## Success Checklist

- [ ] Service is active and running
- [ ] Health endpoint responds
- [ ] Environment variables configured
- [ ] Database connected
- [ ] Redis connected (if using)
- [ ] API endpoints working
- [ ] Logs show no errors
- [ ] Custom domain configured (optional)
- [ ] Monitoring set up
- [ ] Team has access
- [ ] Documentation updated

## Next: Production Readiness

Once everything is working:

1. ✅ Set up staging environment
2. ✅ Implement proper error handling
3. ✅ Set up backup strategy
4. ✅ Configure monitoring/alerting
5. ✅ Load testing
6. ✅ Security audit
7. ✅ Performance optimization
8. ✅ Documentation complete

## Getting Help

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Railway Status: https://status.railway.app
- Check service logs for specific errors

---

**Congratulations! Your service is live on Railway! 🚀**
