# Integration Testing Strategy

**Status:** Framework proposal for implementation
**Goal:** Validate service boundaries and API contracts

## Testing Pyramid

```
                    ▲
                   / \
                  /   \ E2E Tests (UI + API + DB)
                 /_____\
                /       \
               / API     \ Integration Tests (Service ↔ Service)
              /_________\
             /           \
            / Unit Tests  \ Unit Tests (In-process)
           /______________\
```

## Service Boundaries to Test

### 1. API ↔ Services Communication
**Test:** `services/api/` calls to worker, command-center, external services
**Tools:** Supertest, MSW (Mock Service Worker)
**Location:** `services/api/__tests__/integration/`

```typescript
describe('API → Worker Integration', () => {
  it('should queue job and receive status updates', async () => {
    const jobId = await api.post('/jobs').send({ type: 'generate-concept' });
    const status = await worker.getJobStatus(jobId);
    expect(status).toBe('processing');
  });
});
```

### 2. Database ↔ Services
**Test:** Prisma schema contracts with consumers
**Tools:** Prisma test client, Docker test database
**Location:** `packages/database/__tests__/integration/`

```typescript
describe('Database Schema Contracts', () => {
  it('should support concurrent reads', async () => {
    const results = await Promise.all([
      db.concept.findMany({ where: { intakeId } }),
      db.intake.findUnique({ where: { id: intakeId } }),
    ]);
    expect(results[0].length).toBeGreaterThan(0);
  });
});
```

### 3. Package Contracts
**Test:** Package API boundaries (@kealee/* exports)
**Tools:** TypeScript type tests, runtime checks
**Location:** `packages/*/__tests__/integration/`

```typescript
describe('@kealee/core-llm exports', () => {
  it('should export all required AI providers', async () => {
    const llm = await import('@kealee/core-llm');
    expect(llm.AnthropicProvider).toBeDefined();
    expect(llm.OpenAIProvider).toBeDefined();
  });

  it('should route requests to correct provider', async () => {
    const provider = llm.createRouter({ default: 'anthropic' });
    const response = await provider.generate({ /* ... */ });
    expect(response).toHaveProperty('content');
  });
});
```

## CI Integration

### Pre-build Phase
```bash
# 1. Dependency validation
pnpm run check:health

# 2. Type checking
pnpm run type-check

# 3. Unit tests
pnpm run test:unit
```

### Post-build Phase
```bash
# 4. Integration tests (with services running)
pnpm run test:integration

# 5. E2E smoke tests
pnpm run test:smoke
```

## Priority Test Cases

### High Priority (Implement First)
- [ ] API webhook contract (Stripe, external services)
- [ ] Database migration safety (Prisma)
- [ ] Auth flow (Supabase ↔ Portal)
- [ ] Job queue (BullMQ ↔ Worker)

### Medium Priority (Q2 2026)
- [ ] Package export contracts
- [ ] Service-to-service API calls
- [ ] Caching layer (Redis)

### Low Priority (Ongoing)
- [ ] Performance benchmarks
- [ ] Load testing
- [ ] Chaos engineering (fault injection)

## Test Database Setup

```bash
# Start test database
docker run --rm -e POSTGRES_PASSWORD=password postgres:15

# Create test schema
pnpm exec prisma migrate deploy

# Run integration tests
pnpm test:integration --coverage
```

## Mock Strategy

### Use Real Services When:
- Testing critical paths (payment, auth)
- Database schema validation needed
- Performance matters (benchmarks)

### Use Mocks When:
- External APIs (Stripe, SendGrid)
- Expensive operations (AI generation)
- Unavailable in test environment

### MSW Example
```typescript
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const server = setupServer(
  http.post('https://api.stripe.com/v1/*', () => {
    return HttpResponse.json({ id: 'evt_test' });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
```

## CI Pipeline Integration

```yaml
# .github/workflows/test.yml
test:
  runs-on: ubuntu-latest
  services:
    postgres:
      image: postgres:15
      env:
        POSTGRES_PASSWORD: password
  steps:
    - uses: actions/checkout@v3
    - uses: pnpm/action-setup@v2
    - run: pnpm install --frozen-lockfile
    - run: pnpm run test:unit
    - run: pnpm run test:integration
    - run: pnpm run test:smoke
```

## Reporting & Analysis

### Coverage Goals
- Unit tests: >80%
- Integration tests: >60%
- Overall: >70%

### Flaky Test Detection
```bash
# Run tests 5x to detect flakiness
pnpm test --runs=5 --reporter=json > test-results.json
```

### Performance Tracking
```bash
# Measure test execution time
pnpm test --reporter=dot --timeout=10000
```

## Next Steps

1. **Phase 1:** Set up test database infrastructure
2. **Phase 2:** Write high-priority integration tests
3. **Phase 3:** Integrate into CI pipeline
4. **Phase 4:** Add coverage reporting dashboard
