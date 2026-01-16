# Railway Setup Guide for Kealee Platform

## Recommended Setup Order

### ✅ Step 1: Commit Code to Git First (Recommended)

**Why first?**
- Railway can deploy directly from your Git repository
- Ensures your code is version controlled
- Makes it easier to set up CI/CD later

**Important:** Make sure `.env.local` files are in `.gitignore` (they already are!)

```bash
# Initialize Git if not already done
git init

# Add all files (except .env.local which is in .gitignore)
git add .

# Commit
git commit -m "Initial commit - Kealee Platform V10"

# Create GitHub repository and push
# (Go to GitHub, create repo, then:)
git remote add origin https://github.com/yourusername/kealee-platform.git
git push -u origin main
```

### ✅ Step 2: Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Sign up/Login with GitHub
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Choose your repository

### ✅ Step 3: Add PostgreSQL Service

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway will automatically create a PostgreSQL database
4. **Copy the `DATABASE_URL`** from the service variables

### ✅ Step 4: Add Redis Service (Optional)

1. Click **"+ New"**
2. Select **"Database"** → **"Add Redis"**
3. **Copy the `REDIS_URL`** from the service variables

**OR** use Upstash (recommended for production):
- Go to [upstash.com](https://upstash.com)
- Create Redis database
- Copy the connection URL

### ✅ Step 5: Configure Environment Variables

In Railway, for each service (API, Worker, etc.), add environment variables:

**For API Service:**
```
PORT=3001
NODE_ENV=production
DATABASE_URL=<from Railway PostgreSQL>
SUPABASE_URL=<your Supabase URL>
SUPABASE_SERVICE_ROLE_KEY=<your service role key>
SUPABASE_ANON_KEY=<your anon key>
REDIS_HOST=<from Railway Redis or localhost>
REDIS_PORT=6379
AUDIT_SIGNING_KEY=<your generated key>
```

**For Worker Service:**
```
DATABASE_URL=<from Railway PostgreSQL>
REDIS_URL=<from Railway Redis or Upstash>
SENDGRID_API_KEY=<your key>
ANTHROPIC_API_KEY=<your key>
```

### ✅ Step 6: Deploy API Service

1. In Railway, click **"+ New"**
2. Select **"GitHub Repo"** → Choose your repo
3. Railway will detect it's a monorepo
4. Set **Root Directory** to `services/api`
5. Set **Build Command**: `pnpm install && pnpm build`
6. Set **Start Command**: `pnpm start`
7. Railway will automatically deploy

### ✅ Step 7: Run Database Migrations

After deployment, run migrations using Railway's CLI or one-off command:

**Option A: Railway CLI**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migrations
cd packages/database
railway run pnpm db:migrate
```

**Option B: Railway Dashboard**
1. Go to your API service in Railway
2. Click on **"Deployments"**
3. Click **"View Logs"**
4. Or use **"Shell"** to run commands directly

**Option C: One-off Service**
1. Create a temporary service in Railway
2. Use the same environment variables
3. Run: `pnpm db:migrate`
4. Delete the service after migrations complete

## Alternative: Local Development First

If you want to test locally before deploying:

1. **Set up local PostgreSQL** (or use Railway's database locally)
2. **Run migrations locally:**
   ```bash
   cd packages/database
   pnpm db:migrate
   ```
3. **Test everything works**
4. **Then commit to Git and deploy to Railway**

## Quick Reference: Railway Workflow

```
1. Git Commit (code only, no secrets)
   ↓
2. Create Railway Project
   ↓
3. Add PostgreSQL Service → Get DATABASE_URL
   ↓
4. Add Redis Service → Get REDIS_URL
   ↓
5. Add Environment Variables to Railway
   ↓
6. Deploy API Service
   ↓
7. Run Database Migrations
   ↓
8. Test & Verify
```

## Important Notes

### ✅ DO:
- Commit code to Git first (without `.env.local` files)
- Use Railway's PostgreSQL for production
- Store all secrets in Railway environment variables (not in code)
- Run migrations after deployment

### ❌ DON'T:
- Commit `.env.local` files to Git
- Hardcode secrets in your code
- Run migrations before database is ready
- Deploy without setting environment variables

## Troubleshooting

### "Database connection failed"
- Check `DATABASE_URL` is set correctly in Railway
- Verify PostgreSQL service is running
- Check network connectivity

### "Migrations failed"
- Ensure database is accessible
- Check Prisma schema is valid
- Verify `DATABASE_URL` format is correct

### "Service won't start"
- Check all required environment variables are set
- Verify build command completed successfully
- Check Railway logs for errors

## Next Steps After Setup

1. ✅ Verify API is accessible
2. ✅ Test authentication endpoints
3. ✅ Run health checks
4. ✅ Monitor logs in Railway dashboard
5. ✅ Set up custom domain (optional)
6. ✅ Configure CI/CD (optional)
