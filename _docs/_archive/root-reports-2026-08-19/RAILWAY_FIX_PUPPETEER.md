# Fix: Railway Build Stuck on Puppeteer Download

## Problem

Your Railway build is stuck downloading Puppeteer's Chrome browser (~200MB), which takes 15+ minutes and may timeout.

**Root Cause:** Puppeteer is a dependency in `packages/shared-integrations`, but you're deploying the API service which doesn't need it.

## Quick Fix: Skip Puppeteer Installation

### Option 1: Set Environment Variable (Recommended)

In Railway Dashboard → Your Service → **Settings** → **Variables**, add:

```
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
```

This tells Puppeteer to skip downloading Chrome during installation.

**Note:** If you later need Puppeteer functionality, you'll need to install Chrome separately or remove this variable.

### Option 2: Optimize Build Command

Update your build command in Railway to only install what's needed:

**Current build command:**
```
pnpm install && pnpm build --filter=@kealee/api
```

**Optimized build command:**
```
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true pnpm install --filter=@kealee/api... && pnpm build --filter=@kealee/api
```

Or simpler:
```
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true pnpm install --frozen-lockfile && pnpm build --filter=@kealee/api
```

### Option 3: Make Puppeteer Optional

If Puppeteer isn't critical for your API service, you can:

1. Move Puppeteer to `optionalDependencies` in `packages/shared-integrations/package.json`
2. Or use `--ignore-scripts` flag (but this may break other postinstall scripts)

## Step-by-Step Fix

### Immediate Fix (Do This Now):

1. **Cancel the current build** (if possible) or wait for it to finish/fail
2. **Go to Railway Dashboard** → Your Service → **Settings** → **Variables**
3. **Add new variable:**
   - Name: `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD`
   - Value: `true`
4. **Update Build Command** (Settings → Source):
   ```
   PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true pnpm install --frozen-lockfile && pnpm build --filter=@kealee/api
   ```
5. **Save and redeploy**

### Alternative: Use pnpm Filter More Aggressively

If the above doesn't work, try installing only production dependencies for the API:

**Build Command:**
```
pnpm install --frozen-lockfile --filter=@kealee/api... --prod && pnpm build --filter=@kealee/api
```

This installs only the API service and its dependencies, skipping dev dependencies from other packages.

## Why This Happens

- **Monorepo structure:** Railway installs ALL packages in the monorepo
- **Puppeteer dependency:** `packages/shared-integrations` has Puppeteer
- **Chrome download:** Puppeteer downloads Chrome (~200MB) during `pnpm install`
- **Slow network:** Railway's build environment may have slow download speeds

## Verification

After applying the fix:

1. **New build should:**
   - Skip Puppeteer Chrome download
   - Complete in 2-5 minutes instead of 15+
   - Show: `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true` in logs

2. **Check build logs for:**
   - ✅ No "downloading Chrome" messages
   - ✅ Faster installation
   - ✅ Build completes successfully

## If You Need Puppeteer Later

If you need Puppeteer functionality in production:

1. Remove `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD` variable
2. Or install Chrome separately in your build:
   ```bash
   apt-get update && apt-get install -y chromium-browser
   ```
3. Set `PUPPETEER_EXECUTABLE_PATH` to point to installed Chrome

## Long-Term Solution

Consider:

1. **Separate Puppeteer package:** Move Puppeteer to a separate optional package
2. **Conditional installation:** Only install Puppeteer when needed
3. **Use Playwright instead:** Playwright has better Railway support
4. **External service:** Use a headless browser service instead of self-hosting

## Quick Reference

**Environment Variable to Add:**
```
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
```

**Updated Build Command:**
```
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true pnpm install --frozen-lockfile && pnpm build --filter=@kealee/api
```

**Expected Build Time:** 2-5 minutes (instead of 15+)
