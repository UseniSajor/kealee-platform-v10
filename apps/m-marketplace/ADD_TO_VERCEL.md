# Adding Marketplace App to Vercel

The marketplace app needs to be added as a new project in Vercel. Here are two ways to do it:

---

## Option 1: Add via Vercel Dashboard (Recommended)

### Step 1: Go to Vercel Dashboard
1. Visit [vercel.com/dashboard](https://vercel.com/dashboard)
2. Make sure you're logged in

### Step 2: Add New Project
1. Click **"Add New Project"** or **"Import Project"** button
2. Select your GitHub repository: `kealee-platform-v10`
3. If you see multiple projects, click **"Import"** for the repository

### Step 3: Configure Marketplace Project

**Project Settings:**
- **Project Name:** `kealee-marketplace` (or `m-marketplace`)
- **Framework Preset:** Next.js (should auto-detect)
- **Root Directory:** Click **"Edit"** and set to: `apps/m-marketplace`
- **Build Command:** `turbo run build --filter=m-marketplace`
- **Output Directory:** `apps/m-marketplace/.next`
- **Install Command:** `pnpm install --network-timeout=60000 --fetch-retries=5`

**Note:** The `vercel.json` file should auto-configure these settings, but verify them.

### Step 4: Environment Variables (if needed)
If your app needs any environment variables, add them here:
- `NEXT_PUBLIC_API_URL` (if API calls are needed)
- `NEXT_PUBLIC_MARKETPLACE_URL` (if self-referencing)

### Step 5: Deploy
1. Click **"Deploy"**
2. Wait for the build to complete

### Step 6: Add Custom Domains
After deployment:
1. Go to **Settings** → **Domains**
2. Add `kealee.com`
3. Add `www.kealee.com`
4. Follow DNS configuration instructions (see VERCEL_DEPLOY_STEPS.md)

---

## Option 2: Deploy via Vercel CLI

### Step 1: Login to Vercel
```bash
cd apps/m-marketplace
vercel login
```
This will open your browser to authenticate.

### Step 2: Deploy
```bash
vercel
```

**First-time prompts:**
- Link to existing project? → **No** (create new project)
- Project name: `kealee-marketplace`
- Directory: `apps/m-marketplace` (should auto-detect)
- Override settings? → **No** (vercel.json is configured)

### Step 3: Deploy to Production
```bash
vercel --prod --yes
```

### Step 4: Add Domains (via Dashboard)
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your `kealee-marketplace` project
3. Go to **Settings** → **Domains**
4. Add `kealee.com` and `www.kealee.com`

---

## Troubleshooting

### Issue: "Root Directory not found"
**Solution:** Make sure you're using the correct path: `apps/m-marketplace`

### Issue: Build fails with Turborepo
**Solution:** 
- Ensure `turbo.json` is in the root
- Verify build command: `turbo run build --filter=m-marketplace`
- Check that `@kealee/m-marketplace` is in the workspace

### Issue: Build fails with "Cannot find module"
**Solution:**
- Make sure install command runs from root: `pnpm install`
- The build command should handle workspace dependencies

### Issue: Domain already in use
**Solution:** The domain might be connected to another project. Check your other Vercel projects or contact Vercel support.

---

## Verification Checklist

After adding to Vercel:

- [ ] Project appears in Vercel dashboard
- [ ] Initial deployment succeeds
- [ ] Build logs show successful compilation
- [ ] App is accessible at auto-generated URL (e.g., `kealee-marketplace.vercel.app`)
- [ ] Ready to add custom domains

---

## Next Steps

Once the app is in Vercel:
1. Add custom domains (`kealee.com` and `www.kealee.com`)
2. Configure DNS in NameBright
3. Wait for SSL certificate provisioning
4. Test the deployed app

See `VERCEL_DEPLOY_STEPS.md` for detailed domain configuration steps.
