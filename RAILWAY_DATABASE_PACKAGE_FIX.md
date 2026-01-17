# Railway Database Package Build Fix

## Issue
Railway deployment fails with:
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/app/packages/database/src/client' imported from /app/packages/database/src/index.ts
```

Node.js is trying to load TypeScript source files (`src/index.ts`) instead of the compiled JavaScript files (`dist/index.js`).

## Root Cause
The `@kealee/database` package needs to be compiled before the API service can use it. The `package.json` `main` field points to `dist/index.js`, but if the `dist` folder doesn't exist, Node.js can't find the module.

## Fixes Applied

### 1. Added `build` script to `packages/database/package.json`
```json
{
  "scripts": {
    "build": "tsc"
  }
}
```

### 2. Updated Dockerfile to build database package
```dockerfile
# Layer 5: Build database package before API service
RUN pnpm build --filter=@kealee/database

# Verify build output exists
RUN test -f packages/database/dist/index.js || exit 1
RUN test -f packages/database/dist/client.js || exit 1
```

### 3. Added `exports` field to `packages/database/package.json`
```json
{
  "main": "./dist/index.js",
  "exports": {
    ".": {
      "require": "./dist/index.js",
      "import": "./dist/index.js",
      "types": "./src/index.ts"
    }
  }
}
```

## Verification

After redeploying, check Railway build logs for:
1. `RUN pnpm build --filter=@kealee/database` - should succeed
2. Verification steps - should pass (no errors about missing files)

## Next Steps

1. **Redeploy on Railway** - The new Dockerfile will build the database package
2. **Check build logs** - Verify the database package build step completes
3. **Check runtime logs** - Should no longer see `ERR_MODULE_NOT_FOUND` for `src/client`

## Expected Behavior

- Build: Database package compiles TypeScript → `dist/index.js`, `dist/client.js`
- Runtime: Node.js resolves `@kealee/database` → `packages/database/dist/index.js` → loads compiled JavaScript
