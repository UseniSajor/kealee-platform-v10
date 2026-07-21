# Testing API Service

## Quick Test Commands

### From Root Directory

**PowerShell (Windows):**
```powershell
# Run test script
.\test-api.ps1

# Or use pnpm script
pnpm test:api

# Watch mode
pnpm test:api:watch

# With coverage
pnpm test:api:coverage
```

**Bash (Mac/Linux):**
```bash
# Make script executable (first time only)
chmod +x test-api.sh

# Run test script
./test-api.sh

# Or use pnpm script
pnpm test:api

# Watch mode
pnpm test:api:watch

# With coverage
pnpm test:api:coverage
```

### From API Directory

```bash
cd services/api

# Run tests
pnpm test

# Watch mode
pnpm test:watch

# With coverage
pnpm test:coverage
```

## What Gets Tested

- ✅ Health check endpoint
- ✅ Authentication routes (validation, auth requirements)
- ✅ Organization routes (CRUD operations)
- ✅ RBAC routes (roles & permissions)
- ✅ Module entitlements routes
- ✅ Event logging routes
- ✅ Audit logging routes

## Test Output

Tests will show:
- ✅ Passing tests
- ❌ Failing tests
- Coverage report (when using `test:coverage`)

## Troubleshooting

**If tests fail:**
1. Make sure dependencies are installed: `pnpm install`
2. Check TypeScript compilation: `pnpm build`
3. Verify database connection (if testing with real DB)
4. Check environment variables are set

**Note about DATABASE_URL:**
- Tests that hit the database will return 500 if `DATABASE_URL` is not set
- This is expected behavior - tests verify route structure and authentication
- For full integration tests, set up a test database:
  ```bash
  # In services/api/.env.local
  DATABASE_URL="postgresql://user:password@localhost:5432/kealee_test?schema=public"
  ```

**If build fails:**
- Check for TypeScript errors: `cd services/api && pnpm build`
- Fix any syntax errors
- Ensure all imports are correct

## Next Steps

After tests pass:
- Deploy to staging environment
- Set up continuous integration (CI)
- Add more comprehensive integration tests
- Set up test database for full E2E testing
