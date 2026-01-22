# Testing Guide

## Overview

This document provides comprehensive guidance for testing the Kealee Platform finance module, including unit tests, integration tests, and end-to-end tests.

## Test Structure

```
services/api/src/tests/
├── setup.ts                      # Global test setup
├── unit/                         # Unit tests
│   ├── escrow.service.test.ts
│   ├── deposit.service.test.ts
│   ├── journal-entry.service.test.ts
│   └── account.service.test.ts
├── integration/                  # API integration tests
│   ├── deposit.api.test.ts
│   ├── escrow.api.test.ts
│   ├── analytics.api.test.ts
│   └── compliance.api.test.ts
└── e2e/                          # End-to-end tests
    ├── escrow-lifecycle.test.ts
    ├── dispute-resolution.test.ts
    └── payment-release.test.ts
```

## Setup

### 1. Database Setup

Create a test database:

```bash
# Create test database
createdb kealee_test

# Run migrations
cd packages/database
pnpm db:migrate:deploy
```

### 2. Environment Variables

Copy `.env.test.example` to `.env.test`:

```bash
cp services/api/.env.test.example services/api/.env.test
```

Edit `.env.test` with your test database credentials.

### 3. Install Dependencies

```bash
pnpm install
```

## Running Tests

### Run All Tests

```bash
# From project root
pnpm test

# From API service
cd services/api
pnpm test
```

### Run Specific Test Suite

```bash
# Unit tests only
pnpm test:unit

# Integration tests only
pnpm test:integration

# E2E tests only
pnpm test:e2e
```

### Run Specific Test File

```bash
pnpm test src/tests/unit/escrow.service.test.ts
```

### Watch Mode (Development)

```bash
pnpm test --watch
```

### Coverage Report

```bash
pnpm test:coverage
```

View coverage report at `coverage/index.html`.

## Test Categories

### Unit Tests

Test individual service methods in isolation.

**Example: Escrow Service**

```typescript
describe('EscrowService', () => {
  describe('recordDeposit', () => {
    it('should record deposit and update balance', async () => {
      const transaction = await escrowService.recordDeposit(
        escrowId,
        new Decimal(1000),
        userId,
        'payment_ref_123'
      );

      expect(transaction.type).toBe('DEPOSIT');
      expect(transaction.amount).toEqual(new Decimal(1000));
    });
  });
});
```

### Integration Tests

Test API endpoints with real HTTP requests.

**Example: Deposit API**

```typescript
describe('POST /api/deposits', () => {
  it('should create deposit request', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/deposits',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        escrowId: 'esc_123',
        amount: 1000,
        paymentMethodId: 'pm_123',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().data.amount).toBe(1000);
  });
});
```

### E2E Tests

Test complete business flows from start to finish.

**Example: Complete Escrow Lifecycle**

```typescript
it('should complete full escrow lifecycle', async () => {
  // 1. Create escrow
  const escrow = await escrowService.createEscrowAgreement(contractId, userId);

  // 2. Make initial deposit
  const deposit = await depositService.createDeposit({ ... });
  await depositService.handleSuccessfulPayment(deposit.stripePaymentIntentId, 'ch_123');

  // 3. Place hold (dispute)
  const hold = await escrowService.placeHold(escrowId, new Decimal(1000), 'DISPUTE', userId);

  // 4. Release hold
  await escrowService.releaseHold(hold.id, userId);

  // 5. Release payments
  const payment1 = await escrowService.releasePayment(escrowId, 'milestone_1', new Decimal(2000), userId);
  await escrowService.completeEscrowTransaction(payment1.id, 'po_123');

  // 6. Close escrow
  await testPrisma.escrowAgreement.update({
    where: { id: escrowId },
    data: { status: 'CLOSED' },
  });

  // 7. Verify balances
  const balances = await escrowService.calculateBalances(escrowId);
  expect(balances.discrepancy).toEqual(new Decimal(0));
});
```

## Writing Tests

### Best Practices

1. **Arrange-Act-Assert Pattern**

```typescript
it('should do something', async () => {
  // Arrange: Set up test data
  const testData = await seedTestData();

  // Act: Perform action
  const result = await someService.doSomething(testData.id);

  // Assert: Verify results
  expect(result).toBeDefined();
  expect(result.status).toBe('SUCCESS');
});
```

2. **Use Descriptive Test Names**

```typescript
// ❌ Bad
it('test 1', () => { ... });

// ✅ Good
it('should throw error when deposit amount is negative', () => { ... });
```

3. **Test Error Cases**

```typescript
it('should throw InsufficientBalanceError when balance is insufficient', async () => {
  await expect(
    escrowService.releasePayment(escrowId, 'milestone_1', new Decimal(100000), userId)
  ).rejects.toThrow(InsufficientBalanceError);
});
```

4. **Clean Up After Tests**

```typescript
afterEach(async () => {
  await clearDatabase();
});
```

5. **Use Test Fixtures**

```typescript
const testFixtures = {
  user: {
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  },
  contract: {
    totalAmount: 10000,
    status: 'ACTIVE',
  },
};
```

### Testing Async Operations

```typescript
it('should process deposit asynchronously', async () => {
  const deposit = await depositService.createDeposit({ ... });

  // Wait for processing
  await new Promise(resolve => setTimeout(resolve, 1000));

  const processed = await depositService.getDeposit(deposit.id);
  expect(processed.status).toBe('PROCESSING');
});
```

### Testing Database Transactions

```typescript
it('should rollback on error', async () => {
  await expect(
    escrowService.recordDeposit(
      'invalid_escrow_id',
      new Decimal(1000),
      userId,
      'ref_123'
    )
  ).rejects.toThrow();

  // Verify no partial data was saved
  const transactions = await testPrisma.escrowTransaction.findMany();
  expect(transactions).toHaveLength(0);
});
```

### Mocking External Services

```typescript
import { vi } from 'vitest';

// Mock Stripe
vi.mock('stripe', () => ({
  default: vi.fn().mockImplementation(() => ({
    paymentIntents: {
      create: vi.fn().mockResolvedValue({
        id: 'pi_test_123',
        status: 'succeeded',
      }),
    },
  })),
}));
```

## Coverage Goals

- **Unit Tests**: 90%+ coverage
- **Integration Tests**: 80%+ coverage
- **E2E Tests**: Critical flows covered

### Current Coverage

```
File                           | % Stmts | % Branch | % Funcs | % Lines
-------------------------------|---------|----------|---------|--------
escrow.service.ts              |   92.5  |   87.3   |   95.0  |   93.1
deposit.service.ts             |   88.7  |   82.5   |   90.2  |   89.4
journal-entry.service.ts       |   91.3  |   85.1   |   93.7  |   92.0
account.service.ts             |   89.2  |   80.7   |   88.9  |   90.1
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: kealee_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install pnpm
        run: npm install -g pnpm
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run migrations
        run: pnpm db:migrate:deploy
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/kealee_test
      
      - name: Run tests
        run: pnpm test:coverage
        env:
          TEST_DATABASE_URL: postgresql://test:test@localhost:5432/kealee_test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## Troubleshooting

### Common Issues

**1. Database Connection Errors**

```bash
# Ensure PostgreSQL is running
pg_isready

# Check DATABASE_URL in .env.test
echo $TEST_DATABASE_URL
```

**2. Port Conflicts**

```bash
# Change test server port in vitest.config.ts
export default defineConfig({
  test: {
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
});
```

**3. Timeout Errors**

```typescript
// Increase timeout for slow tests
it('should process large dataset', async () => {
  // Test code
}, 60000); // 60 seconds
```

**4. Flaky Tests**

- Use `singleThread: true` in vitest.config.ts
- Clear database before each test
- Avoid time-dependent assertions
- Use `waitFor` utilities

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://testingjavascript.com/)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
- [Fastify Testing Guide](https://www.fastify.io/docs/latest/Guides/Testing/)

## Support

For questions or issues with testing:
- Check existing test files for examples
- Review this documentation
- Ask in team Slack channel: #testing
- Open issue on GitHub with `testing` label

