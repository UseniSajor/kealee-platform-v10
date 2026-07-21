# API Testing Guide

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## Test Structure

- `src/__tests__/` - Test files
  - `health.test.ts` - Health check endpoint tests
  - `integration.test.ts` - Integration tests for all routes

## Test Coverage

Current tests cover:
- ✅ Health check endpoint
- ✅ Auth routes (validation, authentication)
- ✅ Org routes (authentication, public endpoints)
- ✅ RBAC routes (public endpoints)
- ✅ Event routes (authentication, public endpoints)
- ✅ Audit routes (authentication, public endpoints)
- ✅ **E2E: Complete project lifecycle (Prompt 3.9)**
  - Project creation → Readiness → Contracts → Milestones → Payments → Closeout → Handoff
- ✅ **E2E: Performance testing (Prompt 3.9)**
  - Concurrent project creation (50+)
  - Concurrent queries (100+)
  - Response time benchmarks
- ✅ **E2E: Integration points (Prompt 3.9)**
  - Finance (escrow, payments)
  - Permits (compliance)
  - Marketplace (contractors)
  - Disputes (resolution)

## Adding New Tests

1. Create test file in `src/__tests__/`
2. Import necessary modules
3. Set up Fastify instance with routes
4. Write test cases using Vitest

Example:
```typescript
import { describe, it, expect } from 'vitest'
import Fastify from 'fastify'
import { yourRoutes } from '../modules/your-module/your.routes'

describe('Your Module', () => {
  it('should do something', async () => {
    const fastify = Fastify()
    await fastify.register(yourRoutes, { prefix: '/your-prefix' })
    await fastify.ready()

    const response = await fastify.inject({
      method: 'GET',
      url: '/your-prefix/endpoint',
    })

    expect(response.statusCode).toBe(200)
    await fastify.close()
  })
})
```

## Notes

- Tests use Fastify's `inject()` method for testing without starting a server
- Authentication is mocked/not required for public endpoints
- Database operations would require a test database (not yet configured)
- E2E tests include comprehensive lifecycle testing (see `E2E_TESTING.md` for details)