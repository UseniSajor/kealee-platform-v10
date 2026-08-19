# Vercel JSON Schema Validation Error - Fix Guide

## ❌ Error Message

```
The `vercel.json` schema validation failed with the following message: 
should NOT have additional property `_comment`
```

## 🔍 Root Cause

Vercel's `vercel.json` schema does not allow custom properties like `_comment`, `_notes`, or any properties not in the official schema.

## ✅ Valid Properties

Only these properties are allowed in `vercel.json`:

### Build & Deployment
- `buildCommand` - Custom build command
- `installCommand` - Custom install command
- `outputDirectory` - Output directory path
- `framework` - Framework preset (e.g., "nextjs")
- `devCommand` - Development command

### Routing
- `rewrites` - URL rewrites
- `redirects` - URL redirects
- `headers` - HTTP headers
- `routes` - Custom routes
- `cleanUrls` - Clean URL configuration
- `trailingSlash` - Trailing slash behavior

### Configuration
- `env` - Environment variables (deprecated, use dashboard)
- `regions` - Deployment regions
- `github` - GitHub integration settings
- `public` - Public/private project setting
- `builds` - Build configuration (legacy)

## 🚫 Invalid Properties

These properties are **NOT allowed**:
- `_comment` ❌
- `_notes` ❌
- `_description` ❌
- `comment` ❌
- Any custom property not in the official schema ❌

## 🔧 How to Fix

### Step 1: Check for Invalid Properties

Run the validation script:
```bash
bash scripts/validate-vercel-config.sh
```

Or manually check each vercel.json:
```bash
# Check all apps
grep -r "_comment" apps/*/vercel.json
```

### Step 2: Remove Invalid Properties

If `_comment` is found, remove it:

**Before:**
```json
{
  "_comment": "This is a comment",
  "buildCommand": "cd ../.. && pnpm build --filter=os-admin",
  "framework": "nextjs"
}
```

**After:**
```json
{
  "buildCommand": "cd ../.. && pnpm build --filter=os-admin",
  "framework": "nextjs"
}
```

### Step 3: Verify JSON Syntax

```bash
# Validate JSON syntax
python3 -m json.tool apps/os-admin/vercel.json
```

### Step 4: Test Deployment

After fixing, commit and push:
```bash
git add apps/*/vercel.json
git commit -m "fix: Remove invalid _comment properties from vercel.json"
git push origin preview
```

## 📋 Current vercel.json Structure

All apps should have this structure:

```json
{
  "buildCommand": "cd ../.. && pnpm build --filter={app-name}",
  "installCommand": "cd ../.. && pnpm install",
  "framework": "nextjs",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/$1"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

## 🔍 Validation in Workflow

The GitHub Actions workflow now includes:
1. ✅ Pre-deployment validation of vercel.json
2. ✅ Detection of `_comment` and other invalid properties
3. ✅ JSON syntax validation
4. ✅ Detailed error messages with fix instructions

## 📊 Apps to Check

Verify these apps don't have invalid properties:
- [ ] m-marketplace
- [ ] m-project-owner
- [ ] m-permits-inspections
- [ ] m-ops-services
- [ ] m-architect
- [ ] os-pm
- [ ] os-admin

## 🚀 After Fixing

1. **Commit changes:**
   ```bash
   git add apps/*/vercel.json
   git commit -m "fix: Remove invalid properties from vercel.json files"
   git push origin preview
   ```

2. **Monitor deployment:**
   - Check GitHub Actions for validation results
   - Verify all apps deploy successfully
   - Check Vercel dashboard for build logs

## 📚 References

- [Vercel vercel.json Documentation](https://vercel.com/docs/projects/project-configuration)
- [Vercel JSON Schema](https://vercel.com/docs/projects/project-configuration#vercel.json)

---

**Last Updated:** 2026-01-21
**Status:** ⚠️ Fix required - Remove `_comment` properties

