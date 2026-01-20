# os-admin Deployment Guide

## Prerequisites

Before deploying, ensure:
1. ✅ All dependencies are installed (`pnpm install` from root)
2. ✅ Environment variables are configured in Vercel
3. ✅ Vercel CLI is installed and authenticated
4. ✅ Build passes locally

## Deployment Steps

### Step 1: Install Dependencies

From the root directory:
```bash
pnpm install
```

If you encounter lockfile issues:
```bash
# Remove lockfile and reinstall
rm pnpm-lock.yaml
pnpm install
```

### Step 2: Run Linting

```bash
cd apps/os-admin
pnpm lint
```

**Note:** There are currently linting warnings (mostly `any` types) that are non-blocking. These should be fixed in a future update.

### Step 3: Build Application

From the root directory (using turbo):
```bash
pnpm turbo build --filter=os-admin
```

Or from the app directory:
```bash
cd apps/os-admin
pnpm build
```

### Step 4: Deploy to Vercel Staging

**Option A: Using Vercel CLI**
```bash
cd apps/os-admin
vercel --scope=kealee
```

**Option B: Using Git (Recommended)**
1. Commit your changes
2. Push to your staging branch
3. Vercel will automatically deploy

**Option C: Using Deployment Script**
```bash
./scripts/deploy-os-admin-staging.sh
```

### Step 5: Verify Deployment

1. Check Vercel Dashboard: https://vercel.com/kealee/os-admin
2. Visit the deployment URL
3. Check build logs for errors
4. Verify environment variables are set

### Step 6: Test Functionality

#### Authentication
- [ ] Login page loads
- [ ] Can authenticate with Supabase
- [ ] Session persists after refresh
- [ ] Logout works correctly

#### User Management
- [ ] Users page loads
- [ ] Can search users
- [ ] Can view user details
- [ ] Can update user status
- [ ] Can delete users (with confirmation)
- [ ] Pagination works

#### Other Features
- [ ] Dashboard loads
- [ ] Organizations page works
- [ ] RBAC page works
- [ ] Audit logs page works
- [ ] Settings page works

## Environment Variables Required

Ensure these are set in Vercel (staging environment):

```env
# API
NEXT_PUBLIC_API_URL=https://api.kealee.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# App
NODE_ENV=production
APP_NAME=os-admin
APP_ENV=staging
```

## Troubleshooting

### Build Fails: Module Not Found

**Issue:** `Cannot find module 'next'` or similar

**Solution:**
```bash
# From root directory
pnpm install
cd apps/os-admin
pnpm build
```

### Build Fails: Import Errors

**Issue:** `Cannot resolve '@kealee/ui'` or `Cannot resolve 'sonner'`

**Solution:**
- ✅ ErrorBoundary: Fixed - now uses local component
- ✅ sonner: Added to package.json - run `pnpm install`
- ✅ admin-client: Fixed - now uses Supabase instead of next-auth

### Deployment Fails: Environment Variables

**Issue:** App builds but fails at runtime

**Solution:**
1. Check Vercel Dashboard → Settings → Environment Variables
2. Ensure all required variables are set for staging environment
3. Redeploy after adding variables

### Authentication Issues

**Issue:** Can't login or session doesn't persist

**Solution:**
1. Verify Supabase credentials are correct
2. Check Supabase project settings
3. Verify CORS settings in Supabase
4. Check browser console for errors

## Current Issues to Fix

### Before Production Deployment

1. **Linting Warnings:**
   - Replace `any` types with proper TypeScript types
   - Fix unused variables
   - Fix React Hook dependency warnings

2. **Dependencies:**
   - Ensure all packages are properly installed
   - Remove unused dependencies
   - Update outdated packages

3. **Error Handling:**
   - Add proper error boundaries
   - Improve error messages
   - Add loading states

## Deployment Checklist

- [ ] Dependencies installed
- [ ] Linting passes (or warnings documented)
- [ ] Build succeeds locally
- [ ] Environment variables configured in Vercel
- [ ] Deployed to staging
- [ ] Deployment URL verified
- [ ] Authentication tested
- [ ] User management tested
- [ ] All critical features tested
- [ ] Error monitoring configured (Sentry)
- [ ] Performance monitoring enabled

## Next Steps After Staging Deployment

1. Monitor error logs in Vercel
2. Test all user flows
3. Check performance metrics
4. Fix any issues found
5. Deploy to production when ready

## Support

For deployment issues:
1. Check Vercel Dashboard logs
2. Review build output
3. Check environment variables
4. Verify Supabase configuration
