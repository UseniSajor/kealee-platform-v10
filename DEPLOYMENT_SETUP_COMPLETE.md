# 🚀 Kealee Platform - Complete Git & Deployment Setup

## ✅ Implementation Complete

All deployment infrastructure has been set up for the Kealee Platform v10.

## 📁 Files Created/Updated

### 1. Git Configuration
- ✅ `.gitignore` - Comprehensive ignore patterns for monorepo

### 2. Deployment Scripts
- ✅ `scripts/deploy-all.sh` - Master deployment script
- ✅ `scripts/deploy-api.sh` - Railway API deployment
- ✅ `scripts/deploy-frontend.sh` - Vercel frontend deployment
- ✅ `scripts/setup-vercel.sh` - Vercel initial setup
- ✅ `scripts/setup-railway.sh` - Railway initial setup
- ✅ `scripts/verify-deployments.sh` - Deployment verification

### 3. Package Configuration
- ✅ `package.json` - Updated with deployment scripts

### 4. GitHub Actions
- ✅ `.github/workflows/deploy-production.yml` - Production deployment workflow
- ✅ `.github/workflows/test.yml` - Test workflow

### 5. Vercel Configuration
- ✅ `apps/m-marketplace/vercel.json` - Updated with security headers
- ✅ `apps/m-project-owner/vercel.json` - Updated with security headers
- ✅ `apps/m-permits-inspections/vercel.json` - Updated with security headers
- ✅ `apps/m-ops-services/vercel.json` - Updated with security headers
- ✅ `apps/m-architect/vercel.json` - Updated with security headers
- ✅ `apps/os-pm/vercel.json` - Updated with security headers
- ✅ `apps/os-admin/vercel.json` - Updated with security headers

### 6. Railway Configuration
- ✅ `services/api/railway.json` - Updated Railway config
- ✅ `nixpacks.toml` - Updated build configuration

## 🎯 Quick Start Commands

### First-Time Setup

```bash
# Install CLI tools globally
npm install -g vercel @railway/cli

# Setup Vercel for all apps
pnpm setup:vercel

# Setup Railway for API
pnpm setup:railway
```

### Deploy Everything

```bash
# Deploy all apps and API (with Git commit)
pnpm deploy

# Or deploy individually:
pnpm deploy:api              # Deploy API to Railway
pnpm deploy:frontend all     # Deploy all frontend apps
pnpm deploy:frontend m-marketplace  # Deploy single app
```

### Verify Deployments

```bash
# Check all deployment endpoints
pnpm verify
```

### Database Operations

```bash
pnpm db:push      # Push schema changes
pnpm db:seed      # Seed database
pnpm db:migrate   # Run migrations
pnpm db:studio    # Open Prisma Studio
```

## 📋 Deployment Checklist

### Before First Deployment

1. ✅ **Git Repository**
   ```bash
   git init
   git add .
   git commit -m "feat: complete Kealee Platform v10 implementation"
   git remote add origin https://github.com/yourusername/kealee-platform.git
   git push -u origin main
   ```

2. ✅ **Install CLI Tools**
   ```bash
   npm install -g vercel @railway/cli
   ```

3. ✅ **Setup Vercel**
   - Run `pnpm setup:vercel`
   - Add domains in Vercel dashboard
   - Configure environment variables for each app

4. ✅ **Setup Railway**
   - Run `pnpm setup:railway`
   - Add environment variables in Railway dashboard
   - Configure custom domain (api.kealee.com)

5. ✅ **Environment Variables**
   
   **Railway (API Service):**
   - `DATABASE_URL`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `S3_ACCESS_KEY_ID`
   - `S3_SECRET_ACCESS_KEY`
   - `S3_BUCKET`
   - `S3_ENDPOINT`
   - `ANTHROPIC_API_KEY`
   - `RESEND_API_KEY`
   - `GOOGLE_MAPS_API_KEY`
   - `CORS_ORIGINS`
   - `JWT_SECRET`

   **Vercel (Each App):**
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - App-specific variables

6. ✅ **DNS Configuration**
   - Add CNAME records in NameBright
   - Wait for SSL certificates

### GitHub Actions Secrets

Add these secrets in GitHub repository settings:

- `RAILWAY_TOKEN` - Railway deployment token
- `VERCEL_TOKEN` - Vercel deployment token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID_MARKETPLACE` - Vercel project IDs for each app
- `VERCEL_PROJECT_ID_PROJECT_OWNER`
- `VERCEL_PROJECT_ID_PERMITS`
- `VERCEL_PROJECT_ID_OPS_SERVICES`
- `VERCEL_PROJECT_ID_ARCHITECT`
- `VERCEL_PROJECT_ID_PM`
- `VERCEL_PROJECT_ID_ADMIN`

## 🌐 Application URLs

After deployment, your applications will be available at:

- **Marketplace:** https://kealee.com
- **Project Owner:** https://app.kealee.com
- **Permits:** https://permits.kealee.com
- **Ops Services:** https://ops.kealee.com
- **Architect:** https://architect.kealee.com
- **PM Workspace:** https://pm.kealee.com
- **Admin:** https://admin.kealee.com
- **API:** https://api.kealee.com

## 🔧 Script Details

### `deploy-all.sh`
Master script that:
1. Installs dependencies
2. Builds packages
3. Commits to Git
4. Pushes to GitHub
5. Deploys API to Railway
6. Deploys all apps to Vercel

### `deploy-api.sh`
Deploys the API service to Railway with health checks.

### `deploy-frontend.sh`
Deploys frontend apps to Vercel. Usage:
```bash
./scripts/deploy-frontend.sh m-marketplace    # Single app
./scripts/deploy-frontend.sh all              # All apps
./scripts/deploy-frontend.sh all prod         # All apps to production
```

### `setup-vercel.sh`
Interactive setup for linking all apps to Vercel projects.

### `setup-railway.sh`
Interactive setup for Railway API deployment.

### `verify-deployments.sh`
Checks all deployment endpoints and reports status.

## 📝 Manual Deployment Steps

If scripts don't work, follow these manual steps:

### 1. Git Setup
```bash
git init
git add .
git commit -m "feat: initial commit - Kealee Platform v10"
git remote add origin https://github.com/YOUR_USERNAME/kealee-platform.git
git push -u origin main
```

### 2. Install CLIs
```bash
npm install -g vercel @railway/cli
```

### 3. Deploy API
```bash
cd services/api
railway login
railway link
railway up
cd ../..
```

### 4. Deploy Each Vercel App
```bash
cd apps/m-marketplace
vercel --prod
cd ../..

cd apps/m-project-owner
vercel --prod
cd ../..

# ... repeat for all apps
```

## 🚨 Troubleshooting

### Scripts Not Executable (Linux/Mac)
```bash
chmod +x scripts/*.sh
```

### Railway CLI Not Found
```bash
npm install -g @railway/cli
railway login
```

### Vercel CLI Not Found
```bash
npm install -g vercel
vercel login
```

### Git Remote Not Configured
```bash
git remote add origin https://github.com/yourusername/kealee-platform.git
```

### Build Failures
- Check environment variables are set
- Verify dependencies are installed
- Check build logs in Vercel/Railway dashboards

## ✅ Next Steps

1. **Initialize Git Repository**
   ```bash
   git init
   git add .
   git commit -m "feat: complete Kealee Platform v10 implementation"
   ```

2. **Create GitHub Repository**
   - Go to GitHub and create a new repository
   - Add remote: `git remote add origin <repo-url>`
   - Push: `git push -u origin main`

3. **Run Setup Scripts**
   ```bash
   pnpm setup:vercel
   pnpm setup:railway
   ```

4. **Configure Environment Variables**
   - Add all required variables in Vercel and Railway dashboards

5. **Deploy**
   ```bash
   pnpm deploy
   ```

6. **Verify**
   ```bash
   pnpm verify
   ```

## 📊 Status

✅ All deployment infrastructure implemented
✅ Scripts created and configured
✅ GitHub Actions workflows ready
✅ Vercel configurations updated
✅ Railway configurations updated
✅ Package.json scripts added

**Ready for deployment!** 🎉


