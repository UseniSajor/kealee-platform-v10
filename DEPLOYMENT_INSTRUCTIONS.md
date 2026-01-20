# Kealee Platform - Deployment Instructions

Complete guide for deploying the Kealee Platform to Railway and Vercel.

---

## 🚀 Quick Start

### Option 1: Automated Script (Recommended)

```bash
# Push to git
./scripts/git-push-all.sh

# Deploy all apps
./scripts/deploy-all.sh
```

### Option 2: Manual Steps

Follow the detailed instructions below.

---

## 📤 Step 1: Push to Git

### Initialize Git (if needed)

```bash
# Initialize repository
git init
git branch -M main

# Add all files
git add .
git commit -m "Deploy: Complete Kealee Platform v10 - All 77 TODOs completed"
```

### Add Remotes

```bash
# Main repository
git remote add origin <your-git-repo-url>

# Railway (if using Railway Git)
git remote add railway <railway-git-url>

# Vercel (if using Vercel Git)
git remote add vercel <vercel-git-url>
```

### Push to All Remotes

```bash
# Push to origin
git push -u origin main

# Push to Railway
git push railway main

# Push to Vercel
git push vercel main
```

**Or use the automated script:**
```bash
./scripts/git-push-all.sh
```

---

## 🎯 Step 2: Deploy to Vercel

### Prerequisites

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login
```

### Link Projects

For each application:

```bash
# m-project-owner
cd apps/m-project-owner
vercel link
cd ../..

# m-permits-inspections
cd apps/m-permits-inspections
vercel link
cd ../..

# m-ops-services
cd apps/m-ops-services
vercel link
cd ../..

# m-architect
cd apps/m-architect
vercel link
cd ../..

# os-admin
cd apps/os-admin
vercel link
cd ../..
```

### Set Environment Variables

```bash
# Use the automated script
./scripts/setup-env-all.sh production

# Or manually for each app
cd apps/m-project-owner
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
# ... add all required variables
cd ../..
```

### Deploy

```bash
# Deploy to staging
./scripts/deploy-staging.sh

# Deploy to production (after testing)
./scripts/deploy-production.sh
```

---

## 🚂 Step 3: Deploy to Railway (API)

### Prerequisites

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login
```

### Link Project

```bash
cd services/api
railway link
```

### Set Environment Variables

```bash
# Set variables
railway variables set DATABASE_URL="postgresql://..."
railway variables set STRIPE_SECRET_KEY="sk_..."
railway variables set AWS_ACCESS_KEY_ID="..."
railway variables set AWS_SECRET_ACCESS_KEY="..."
# ... add all required variables
```

### Deploy

```bash
# Deploy
railway up

# Or deploy from git
git push railway main
```

---

## 📊 Step 4: Verify Deployments

### Check Vercel Deployments

```bash
# List deployments
vercel ls

# View logs
vercel logs <app-name>

# Check status
vercel inspect <deployment-url>
```

### Check Railway Deployment

```bash
# View logs
railway logs

# Check status
railway status
```

### Health Checks

```bash
# Test each application
curl https://m-project-owner.vercel.app/api/health
curl https://m-permits-inspections.vercel.app/api/health
curl https://m-ops-services.vercel.app/api/health
curl https://m-architect.vercel.app/api/health
curl https://os-admin.vercel.app/api/health
```

---

## 🔧 Step 5: Post-Deployment Setup

### Database Migrations

```bash
# Run production migrations
npm run db:migrate:prod

# Verify
npm run db:status
```

### Monitoring Setup

```bash
# Sentry
./scripts/setup-sentry.sh --env=production

# Datadog
./scripts/setup-datadog.sh

# Uptime monitoring
./scripts/setup-uptime-monitoring.sh
```

### DNS & SSL

```bash
# DNS setup
./scripts/setup-dns.sh

# SSL setup
./scripts/setup-ssl.sh
```

---

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] All code committed
- [ ] Tests passing
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Third-party services configured

### Deployment
- [ ] Git pushed to all remotes
- [ ] Vercel projects linked
- [ ] Railway project linked
- [ ] Environment variables set
- [ ] Deployments successful

### Post-Deployment
- [ ] Health checks passing
- [ ] Database migrations run
- [ ] Monitoring active
- [ ] DNS configured
- [ ] SSL certificates active
- [ ] Smoke tests passing

---

## 🆘 Troubleshooting

### Deployment Fails

1. Check logs:
   ```bash
   vercel logs <app-name>
   railway logs
   ```

2. Verify environment variables:
   ```bash
   vercel env ls <app-name>
   railway variables
   ```

3. Check build errors:
   ```bash
   npm run build
   ```

### Database Connection Issues

1. Verify DATABASE_URL:
   ```bash
   echo $DATABASE_URL
   ```

2. Test connection:
   ```bash
   psql $DATABASE_URL -c "SELECT 1;"
   ```

3. Check migrations:
   ```bash
   npm run db:status
   ```

### See Full Troubleshooting Guide

```bash
cat docs/TROUBLESHOOTING_GUIDE.md
cat docs/deployment/troubleshooting.md
```

---

## 📞 Support

- **Documentation:** `docs/` directory
- **Deployment Guides:** `docs/deployment/`
- **Troubleshooting:** `docs/TROUBLESHOOTING_GUIDE.md`
- **Runbook:** `docs/deployment/runbook.md`

---

**Last Updated:** $(date)
