# Vercel Deployment Fix for os-admin

## Issue

**Error:** "This deployment can not be redeployed. Please try again from a fresh commit."

This error typically occurs when:
1. Vercel configuration is incorrect for monorepo setup
2. Build command paths are incorrect
3. Output directory is misconfigured

## Solution

### ✅ Fixed Configuration

Updated `vercel.json` with correct monorepo settings:

```json
{
  "buildCommand": "cd ../.. && pnpm turbo run build --filter=os-admin",
  "outputDirectory": ".next",
  "installCommand": "cd ../.. && pnpm install --network-timeout=60000 --fetch-retries=5",
  "framework": "nextjs",
  "rootDirectory": "apps/os-admin"
}
```

**Key Changes:**
- ✅ `buildCommand`: Now navigates to root before running turbo
- ✅ `outputDirectory`: Changed from `apps/os-admin/.next` to `.next` (relative to rootDirectory)
- ✅ `rootDirectory`: Explicitly set to `apps/os-admin`
- ✅ `installCommand`: Navigates to root before installing

### ✅ Created .vercelignore

Added `.vercelignore` to exclude unnecessary files from deployment.

## Steps to Fix Deployment

### Option 1: Fresh Commit (Recommended)

1. **Make a small change to trigger new deployment:**
   ```bash
   # Add a comment or update a file
   echo "# Deployment fix" >> apps/os-admin/README.md
   ```

2. **Commit and push:**
   ```bash
   git add apps/os-admin/vercel.json apps/os-admin/.vercelignore
   git commit -m "fix(os-admin): Update Vercel config for monorepo deployment"
   git push origin main
   ```

3. **Vercel will automatically deploy** from the new commit

### Option 2: Manual Redeploy via Vercel Dashboard

1. Go to Vercel Dashboard → os-admin project
2. Go to Deployments tab
3. Find the failed deployment
4. Click "..." → "Redeploy" (if available)
5. Or create a new deployment from the latest commit

### Option 3: Force New Deployment via CLI

```bash
cd apps/os-admin
vercel --force
```

## Verify Configuration

### Check Vercel Project Settings

1. Go to Vercel Dashboard → os-admin → Settings
2. Verify:
   - **Root Directory:** `apps/os-admin`
   - **Build Command:** `cd ../.. && pnpm turbo run build --filter=os-admin`
   - **Output Directory:** `.next`
   - **Install Command:** `cd ../.. && pnpm install --network-timeout=60000 --fetch-retries=5`

### Environment Variables

Ensure these are set in Vercel:
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NODE_ENV=production`

## Alternative: Vercel Monorepo Detection

If the above doesn't work, you can let Vercel auto-detect:

1. **Remove `vercel.json`** (or rename to `vercel.json.backup`)
2. **Configure in Vercel Dashboard:**
   - Settings → General
   - Set Root Directory to `apps/os-admin`
   - Framework Preset: Next.js
   - Build Command: (auto-detected)
   - Output Directory: `.next` (auto-detected)

## Testing Locally

Before deploying, test the build:

```bash
# From root directory
cd "C:\Kealee-Platform v10"
pnpm install

# Build os-admin
pnpm turbo run build --filter=os-admin

# Or from app directory
cd apps/os-admin
pnpm build
```

## Common Issues

### Issue: "Cannot find module 'next'"

**Solution:** Ensure dependencies are installed from root:
```bash
cd "C:\Kealee-Platform v10"
pnpm install
```

### Issue: "Build command failed"

**Solution:** Check turbo.json exists and has os-admin in pipeline:
```bash
# Verify turbo.json
cat turbo.json
```

### Issue: "Output directory not found"

**Solution:** The output directory should be `.next` relative to `apps/os-admin`, not absolute path.

## Next Steps

1. ✅ Update `vercel.json` (done)
2. ✅ Create `.vercelignore` (done)
3. ⏳ Make a fresh commit
4. ⏳ Push to trigger new deployment
5. ⏳ Verify deployment succeeds
6. ⏳ Test deployed application

## Status

- ✅ Configuration fixed
- ✅ .vercelignore created
- ⏳ Awaiting fresh commit to trigger new deployment

---

**Last Updated:** January 2026

