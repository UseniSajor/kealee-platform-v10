# Test Pipeline Bug Fixes

## ✅ Bugs Fixed

### Bug 1: Unit Tests Workspace Dependency Resolution
**Issue:** The `unit_tests` job was installing dependencies only in the app subdirectory (`./apps/${{ matrix.app }}`), but pnpm workspaces require root-level installation first to resolve workspace dependencies like `@kealee/auth`, `@kealee/ui`.

**Fix:** Changed the install step to run at the root level:
```yaml
# Before (BROKEN):
- name: Install dependencies
  working-directory: ./apps/${{ matrix.app }}
  run: pnpm install --frozen-lockfile

# After (FIXED):
- name: Install dependencies
  run: pnpm install
```

**Impact:** Unit tests will now correctly resolve workspace dependencies.

### Bug 2: Frozen Lockfile Flag
**Issue:** The workflow used `pnpm install --frozen-lockfile` in 6 places, but `.railway-build-marker` explicitly documents that this flag was removed as a critical fix to resolve repeated build failures caused by aggressive Docker caching. The flag prevents pnpm from resolving version mismatches during builds.

**Fix:** Removed `--frozen-lockfile` flag from all `pnpm install` commands:
- Line 38: `unit_tests` job
- Line 94: `integration_tests` job  
- Line 163: `e2e_tests` job
- Line 202: `performance_tests` job
- Line 236: `security_scans` job

Also removed the redundant `pnpm install --frozen-lockfile` in the database setup step (line 101).

**Impact:** Builds will now allow pnpm to resolve version mismatches, preventing cache-related failures.

## Additional Fix

### TypeScript Configuration
**Issue:** TypeScript errors about missing type definitions for 'node' and 'vitest/globals'.

**Fix:** Removed the restrictive `typeRoots` configuration in `services/api/tsconfig.json` to allow TypeScript to automatically discover type definitions from node_modules.

## Verification

All fixes have been applied and verified:
- ✅ Root-level dependency installation for unit tests
- ✅ All `--frozen-lockfile` flags removed from test-pipeline.yml
- ✅ TypeScript configuration updated

## Related Files

- `.github/workflows/test-pipeline.yml` - Main test pipeline workflow
- `.railway-build-marker` - Documents the frozen-lockfile removal rationale
- `services/api/tsconfig.json` - TypeScript configuration

