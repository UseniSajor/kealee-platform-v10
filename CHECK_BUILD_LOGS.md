# How to Check Build Logs on Railway

## Steps to Find Build Logs

1. **Go to Railway Dashboard** → Your Project
2. **Click on "Kealee Platform" service** (or whatever you named it)
3. **Click "Deployments" tab** (at the top)
4. **Click on the most recent deployment** (the one that just failed)
5. **Scroll down to "Build Logs" section** (NOT "Runtime Logs")

## What to Look For

Look for these messages in the BUILD LOGS:

### ✅ Success Indicators:
- `Building database package...`
- `Build complete. Verifying output...`
- `Database package build verified successfully`
- `[14/14] RUN pnpm build --filter=@kealee/database`

### ❌ Failure Indicators:
- `ERROR: dist/index.js missing`
- `ERROR: dist/client.js missing`
- `ERROR: package.json main field incorrect`
- Build step exits with error code

## What We Need

Please share the BUILD LOGS section that shows:
1. The Docker build steps (should show `[1/14]`, `[2/14]`, etc.)
2. The database package build step (around step `[14/14]` or Layer 5)
3. Any error messages during the build phase

**Note:** Runtime logs (what you just shared) show errors AFTER the container starts. Build logs show what happens DURING the Docker image build process.




