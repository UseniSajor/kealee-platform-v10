# Vercel Build and Deployment Settings - Verification Guide

## ✅ Correct Settings for All Apps

### Required Settings (Must Match for All Apps):

1. **Root Directory**: `apps/{app-name}`
   - Example: `apps/m-architect`, `apps/os-admin`, etc.
   - ✅ Correct in screenshot

2. **Build Command**: `cd ../.. && pnpm build --filter={app-name}`
   - Example: `cd ../.. && pnpm build --filter=m-architect`
   - ✅ Correct in screenshot
   - ✅ Matches vercel.json

3. **Output Directory**: `.next`
   - ✅ Correct in screenshot
   - This is relative to the root directory

4. **Install Command**: `cd ../.. && pnpm install`
   - ⚠️ **ISSUE FOUND**: Screenshot shows default (not overridden)
   - Should be overridden with: `cd ../.. && pnpm install`
   - ✅ Matches vercel.json (but dashboard doesn't reflect it)

5. **"Include files outside the root directory in the Build Step"**: **ENABLED**
   - ✅ Correct in screenshot
   - **Critical for monorepo** - allows access to root package.json, pnpm-workspace.yaml, etc.

6. **Development Command**: Default (`next`)
   - ✅ Correct (not overridden)
   - Not used in production builds

---

## 🔧 Fix Required: Install Command

### Current State (from screenshot):
- Install Command: **Default** (not overridden)
- Override toggle: **OFF**

### Should Be:
- Install Command: `cd ../.. && pnpm install`
- Override toggle: **ON**

### Why This Matters:
- Without override, Vercel may try to install from `apps/m-architect/` directory
- This will fail because `package.json` and `pnpm-workspace.yaml` are in the root
- The `cd ../..` ensures installation happens at monorepo root where dependencies are defined

---

## 📋 Verification Checklist for All Apps

For each app (`m-architect`, `os-admin`, `m-marketplace`, `m-project-owner`, `m-permits-inspections`, `m-ops-services`, `os-pm`):

- [ ] Root Directory: `apps/{app-name}`
- [ ] Build Command: `cd ../.. && pnpm build --filter={app-name}` (Override: ON)
- [ ] Output Directory: `.next` (Override: ON)
- [ ] Install Command: `cd ../.. && pnpm install` (Override: ON) ⚠️ **FIX THIS**
- [ ] "Include files outside the root directory": **ENABLED**
- [ ] Framework Preset: Next.js

---

## 🚀 How to Fix Install Command

### For Each App in Vercel Dashboard:

1. Go to: **Settings** → **Build and Deployment**
2. Find: **Install Command** section
3. Click: **Override** toggle to **ON**
4. Enter: `cd ../.. && pnpm install`
5. Click: **Save**

### Or Use Vercel CLI (from repo root):

```bash
# This should sync vercel.json settings to dashboard
vercel pull --yes --environment=preview
```

---

## 📊 Current Configuration Status

| Setting | Screenshot | vercel.json | Status |
|---------|-----------|-------------|--------|
| Root Directory | `apps/m-architect` | N/A (dashboard only) | ✅ Correct |
| Build Command | `cd ../.. && pnpm build --filter=m-architect` | ✅ Matches | ✅ Correct |
| Output Directory | `.next` | N/A (default) | ✅ Correct |
| Install Command | Default (not overridden) | `cd ../.. && pnpm install` | ⚠️ **Mismatch** |
| Include Outside Files | Enabled | N/A (dashboard only) | ✅ Correct |

---

## ✅ Summary

**What's Working:**
- Root directory configuration ✅
- Build command matches vercel.json ✅
- Output directory is correct ✅
- Monorepo file inclusion is enabled ✅

**What Needs Fixing:**
- Install Command override needs to be enabled
- Install Command should be: `cd ../.. && pnpm install`

**Action Required:**
Enable Install Command override in Vercel dashboard for all 7 apps with the command: `cd ../.. && pnpm install`

---

## 🔍 Verification After Fix

After updating Install Command:
1. Trigger a new deployment
2. Check build logs in Vercel
3. Verify installation happens at root (should see `pnpm-workspace.yaml` detected)
4. Verify build completes successfully

---

**Last Updated:** 2026-01-21
**Status:** Install Command override needs to be enabled for all apps

