# ✅ Marketplace Vercel Setup - Quick Start

## Automated Setup Script

Run this PowerShell script to add the marketplace to Vercel:

```powershell
cd apps/m-marketplace
.\add-to-vercel.ps1
```

The script will:
1. ✅ Check Vercel CLI installation
2. ✅ Guide you through login (if needed)
3. ✅ Create the Vercel project
4. ✅ Deploy to production
5. ✅ Provide next steps

## Manual Setup (Alternative)

If you prefer to do it manually:

### 1. Login to Vercel
```bash
cd apps/m-marketplace
vercel login
```

### 2. Create and Deploy Project
```bash
vercel
```
When prompted:
- Link to existing project? → **No**
- Project name: `kealee-marketplace`
- Directory: `apps/m-marketplace`
- Override settings? → **No**

### 3. Deploy to Production
```bash
vercel --prod --yes
```

## Vercel Dashboard Method

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Select repository: `kealee-platform-v10`
4. Configure:
   - **Project Name:** `kealee-marketplace`
   - **Root Directory:** `apps/m-marketplace`
   - **Framework:** Next.js
   - **Build Command:** `turbo run build --filter=m-marketplace`
   - **Output Directory:** `apps/m-marketplace/.next`
5. Click **"Deploy"**

## After Deployment

1. **Add Custom Domains:**
   - Go to Settings → Domains
   - Add `kealee.com`
   - Add `www.kealee.com`

2. **Configure DNS:**
   - Follow instructions in `VERCEL_DEPLOY_STEPS.md`
   - Add DNS records in NameBright

3. **Verify:**
   - Wait for DNS propagation (5-60 minutes)
   - Test `https://kealee.com`
   - Test `https://www.kealee.com` (should redirect)

## Configuration Files

All configuration is in place:
- ✅ `vercel.json` - Deployment configuration
- ✅ `package.json` - Dependencies and scripts
- ✅ `next.config.ts` - Next.js configuration
- ✅ `tailwind.config.ts` - Styling configuration
- ✅ `.vercelignore` - Files to exclude

## Troubleshooting

See `ADD_TO_VERCEL.md` for detailed troubleshooting guide.
