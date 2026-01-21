# OS-Admin Deployment Implementation

## ✅ Current Status

**Deployment Status:** ✅ Configured and Ready

### Configuration Files

1. **vercel.json** ✅
   - Build Command: `cd ../.. && pnpm build --filter=os-admin`
   - Install Command: `cd ../.. && pnpm install`
   - Framework: Next.js
   - Headers and security configured

2. **GitHub Actions Workflow** ✅
   - Included in `.github/workflows/deploy-preview.yml`
   - Matrix entry: `os-admin` with project ID secret
   - Deploys on PR and preview branch pushes

3. **Vercel Project** ✅
   - Project ID: Set via `VERCEL_PROJECT_ID_OS_ADMIN` secret
   - Root Directory: `apps/os-admin`
   - Framework: Next.js

---

## 🚀 Deployment Process

### Automatic Deployment (via GitHub Actions)

**Triggers:**
- Pull requests to `main` or `staging`
- Pushes to `preview` or `preview-*` branches

**Process:**
1. Workflow checks out code
2. Installs dependencies from monorepo root
3. Links Vercel project
4. Deploys to Vercel Preview
5. Build logs stream in real-time
6. Deployment URL provided in PR comments

### Manual Deployment (via Vercel CLI)

```bash
# From repo root
cd "C:\Kealee-Platform v10"

# Navigate to os-admin
cd apps/os-admin

# Deploy to preview
vercel deploy --yes

# Or deploy to production
vercel deploy --prod --yes
```

---

## 📋 Vercel Dashboard Settings

### Required Settings (Verify in Dashboard)

1. **Root Directory:** `apps/os-admin`
2. **Build Command:** `cd ../.. && pnpm build --filter=os-admin` (Override: ON)
3. **Output Directory:** `.next` (Override: ON)
4. **Install Command:** `cd ../.. && pnpm install` (Override: ON) ⚠️ **IMPORTANT**
5. **Framework Preset:** Next.js
6. **"Include files outside the root directory"**: **ENABLED** ✅

### Environment Variables

Required in Vercel Dashboard → Settings → Environment Variables:

**Preview Environment:**
- `NEXT_PUBLIC_API_URL` - API endpoint URL
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `NODE_ENV=production`

**Production Environment:**
- Same as above, but with production URLs

---

## 🔍 Verification Steps

### 1. Check Workflow Configuration

```bash
# Verify os-admin is in workflow
grep -A 1 "os-admin" .github/workflows/deploy-preview.yml
```

**Expected Output:**
```yaml
- name: os-admin
  project-id: ${{ secrets.VERCEL_PROJECT_ID_OS_ADMIN }}
```

### 2. Verify vercel.json

```bash
cat apps/os-admin/vercel.json
```

**Should contain:**
- `buildCommand`: `cd ../.. && pnpm build --filter=os-admin`
- `installCommand`: `cd ../.. && pnpm install`
- `framework`: `nextjs`

### 3. Test Local Build

```bash
# From repo root
cd "C:\Kealee-Platform v10"
pnpm install
pnpm build --filter=os-admin
```

**Expected:** Build completes without errors

### 4. Check Vercel Project

1. Go to: https://vercel.com/dashboard
2. Find project: `os-admin` (or your project name)
3. Verify settings match above requirements
4. Check recent deployments

---

## 🐛 Troubleshooting

### Issue: Deployment Fails Immediately

**Possible Causes:**
1. Install Command not overridden in Vercel dashboard
2. Project ID secret not set in GitHub
3. Root directory misconfigured

**Solution:**
1. Verify Install Command override is ON in Vercel dashboard
2. Check `VERCEL_PROJECT_ID_OS_ADMIN` secret exists in GitHub
3. Verify Root Directory is `apps/os-admin`

### Issue: Build Command Fails

**Error:** "Cannot find module" or "pnpm: command not found"

**Solution:**
- Ensure Install Command is: `cd ../.. && pnpm install`
- Verify "Include files outside root directory" is enabled
- Check that pnpm-workspace.yaml exists in repo root

### Issue: Output Directory Not Found

**Error:** "Output directory .next not found"

**Solution:**
- Verify Output Directory is `.next` (not `apps/os-admin/.next`)
- Ensure build completes successfully
- Check that Next.js build generates `.next` folder

---

## 📊 Deployment Monitoring

### GitHub Actions

1. Go to: https://github.com/{org}/{repo}/actions
2. Find workflow: "Deploy Preview to Vercel"
3. Check os-admin job status
4. View real-time build logs

### Vercel Dashboard

1. Go to: https://vercel.com/dashboard
2. Select: `os-admin` project
3. View: Deployments tab
4. Check: Build logs for each deployment

### Build Logs Access

**Direct Link Format:**
```
https://vercel.com/{ORG_ID}/{PROJECT_ID}/{DEPLOYMENT_ID}
```

**From GitHub Actions:**
- Links provided in deployment summary
- Click on deployment job to see logs

---

## ✅ Deployment Checklist

Before deploying, verify:

- [ ] `vercel.json` exists and is correct
- [ ] `.vercelignore` exists (if needed)
- [ ] GitHub secret `VERCEL_PROJECT_ID_OS_ADMIN` is set
- [ ] Vercel dashboard settings match requirements
- [ ] Environment variables are configured
- [ ] Local build succeeds: `pnpm build --filter=os-admin`
- [ ] Workflow includes os-admin in matrix

---

## 🎯 Next Steps

1. **Trigger Deployment:**
   ```bash
   # Make a small change
   echo "# Deployment test" >> apps/os-admin/README.md
   git add apps/os-admin/README.md
   git commit -m "test: Trigger os-admin deployment"
   git push origin preview
   ```

2. **Monitor Deployment:**
   - Check GitHub Actions for workflow run
   - Watch build logs in real-time
   - Verify deployment succeeds

3. **Test Deployed App:**
   - Visit preview URL from deployment
   - Test login functionality
   - Verify API connections work

---

## 📝 Notes

- **Monorepo Setup:** os-admin is part of a monorepo, so all commands must run from root
- **Build Process:** Uses Turborepo filter to build only os-admin and dependencies
- **Preview Deployments:** All deployments from preview branch are preview deployments
- **Production:** Merge to `main` branch for production deployment

---

**Last Updated:** 2026-01-21
**Status:** ✅ Ready for Deployment

