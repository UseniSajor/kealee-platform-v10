# Deploy All Apps - Deployment Trigger

**Date:** 2026-01-21
**Status:** 🚀 Triggering deployment for all 7 apps

## Apps Being Deployed

1. ✅ m-marketplace
2. ✅ m-project-owner
3. ✅ m-permits-inspections
4. ✅ m-ops-services
5. ✅ m-architect
6. ✅ os-pm
7. ✅ os-admin

## Deployment Process

All apps will deploy in parallel via GitHub Actions workflow:
- **Workflow:** `.github/workflows/deploy-preview.yml`
- **Trigger:** Push to `preview` branch
- **Status:** Real-time monitoring in GitHub Actions

## Vercel Settings Verified

All apps have been configured in Vercel dashboard with:
- ✅ Root Directory: `apps/{app-name}`
- ✅ Build Command: `cd ../.. && pnpm build --filter={app-name}` (Override: ON)
- ✅ Output Directory: `.next` (Override: ON)
- ✅ Install Command: `cd ../.. && pnpm install` (Override: ON)
- ✅ "Include files outside root directory": Enabled

## Monitoring

- **GitHub Actions:** https://github.com/{org}/{repo}/actions
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Build Logs:** Available in real-time in both locations

---

**Deployment initiated:** $(date)

