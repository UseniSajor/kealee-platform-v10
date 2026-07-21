# Deployment Error Fix Guide - _comment Property Issue

## ❌ Current Error

```
The `vercel.json` schema validation failed with the following message: 
should NOT have additional property `_comment`
```

## 🔍 Root Cause

The `_comment` property is **NOT allowed** in Vercel's `vercel.json` schema. This property may be:
1. In the `vercel.json` file itself (though not found in repo)
2. **In Vercel Dashboard settings** (most likely)
3. In cached configuration

## ✅ Fix Steps

### Step 1: Check Vercel Dashboard Settings

For **EACH** of the 7 apps, go to:

1. **Vercel Dashboard** → Select project
2. **Settings** → **Build and Deployment**
3. Look for any fields with `_comment` or custom properties
4. **Remove them immediately**

**Apps to check:**
- [ ] m-marketplace
- [ ] m-project-owner
- [ ] m-permits-inspections
- [ ] m-ops-services
- [ ] m-architect
- [ ] os-pm
- [ ] os-admin ⚠️ **Not deploying - check this one first!**

### Step 2: Verify vercel.json Files

All `vercel.json` files should **ONLY** contain these properties:

```json
{
  "buildCommand": "cd ../.. && pnpm build --filter={app-name}",
  "installCommand": "cd ../.. && pnpm install",
  "framework": "nextjs",
  "rewrites": [...],
  "headers": [...]
}
```

**Invalid properties to remove:**
- ❌ `_comment`
- ❌ `_notes`
- ❌ `_description`
- ❌ Any custom property not in Vercel schema

### Step 3: OS-Admin Specific Fix

**Issue:** os-admin is not deploying

**Checklist:**
1. ✅ os-admin is in workflow matrix (line 42-43) - **VERIFIED**
2. ⚠️ Check GitHub secret: `VERCEL_PROJECT_ID_OS_ADMIN` exists
3. ⚠️ Verify project exists in Vercel dashboard
4. ⚠️ Check Vercel dashboard settings for `_comment` fields
5. ⚠️ Ensure Root Directory is: `apps/os-admin`

**Direct Links for os-admin:**
- Project: https://vercel.com/{ORG_ID}/{PROJECT_ID}
- Build Settings: https://vercel.com/{ORG_ID}/{PROJECT_ID}/settings/build-and-deployment
- Deployments: https://vercel.com/{ORG_ID}/{PROJECT_ID}/deployments

## 🔧 Enhanced Error Handling

The workflow now includes:

### ✅ Pre-Deployment Validation
- Validates `vercel.json` schema before deployment
- Catches `_comment` errors early
- Shows exact file and line number

### ✅ Enhanced Error Output
- Full error output displayed
- Specific error detection for `_comment` property
- Troubleshooting tips provided
- Project IDs and configuration shown
- Direct links to Vercel dashboard

### ✅ OS-Admin Specific Checks
- Special troubleshooting section for os-admin
- Verification checklist
- Direct dashboard links

## 📊 Error Output Format

When deployment fails, you'll now see:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ DEPLOYMENT FAILED: {app-name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Exit Code: {code}
App: {app-name}
Project ID: {project-id}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 FULL ERROR OUTPUT:
[Complete error log]

🚨 DETECTED: vercel.json Schema Validation Error
[Specific error details]

💡 Root Cause:
[Explanation]

🔧 Fix Steps:
[Step-by-step instructions]

🔗 Vercel Dashboard Links:
[Direct links to fix the issue]
```

## 🚀 After Fixing

1. **Remove `_comment` from Vercel dashboard** for all apps
2. **Verify os-admin project exists** and is configured
3. **Commit and push** to trigger new deployment:
   ```bash
   git add .
   git commit -m "fix: Remove _comment properties from Vercel settings"
   git push origin preview
   ```

4. **Monitor deployment:**
   - GitHub Actions: Real-time logs
   - Vercel Dashboard: Build logs
   - Check os-admin specifically

## 📋 Verification

After fixing, verify:

- [ ] All 7 apps deploy successfully
- [ ] os-admin appears in deployment list
- [ ] No `_comment` errors in logs
- [ ] Build logs are accessible
- [ ] Preview URLs are generated

---

**Last Updated:** 2026-01-21
**Status:** ⚠️ Fix required - Remove `_comment` from Vercel dashboard settings

