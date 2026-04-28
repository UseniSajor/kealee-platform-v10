# E2E Testing Suite — Kealee Platform
<!-- Updated: 2026-04-27 — Added MEGA PROMPT test specs for concept intake, deliverable, and full journeys -->


Complete end-to-end testing system for Kealee Platform v20 using Playwright.

## Overview

This test suite simulates **real user journeys** across the platform:

| Test | Scenario | Status |
|---|---|---|
| **AI Concept** | User views AI-generated insights for exterior concept | ✅ |
| **Estimation** | User fills cost estimation form and views pricing | ✅ |
| **Permits** | User views permit service recommendations and applies | ✅ |
| **Checkout** | User completes order with Stripe (mocked) | ✅ |
| **Output** | User views generated project output and recommendations | ✅ |
| **Error Handling** | System gracefully handles API failures | ✅ |

---

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- Running services: `web-main` (3024), `api` (3000), PostgreSQL, Redis

### Install & Setup

```bash
# Install Playwright browsers
pnpm install

# Install Playwright browsers and dependencies
npx playwright install --with-deps
```

### Run Tests

```bash
# Run all tests (headless)
pnpm test:e2e

# Run tests with Playwright UI (interactive)
pnpm test:e2e:ui

# Run tests in headed mode (see browser)
pnpm test:e2e:headed

# Run specific test file
npx playwright test tests/e2e/ai-concept.spec.ts

# Run single test
npx playwright test tests/e2e/ai-concept.spec.ts -g "should display concept card"

# Debug mode (step through tests)
pnpm test:e2e:debug

# View test report
pnpm test:e2e:report
```

---

## Test Structure

```
tests/e2e/
├── fixtures/
│   └── mock-data.ts              # Shared mock responses & helpers
├── ai-concept.spec.ts             # AI concept flow (5 tests)
├── estimation.spec.ts             # Cost estimation flow (6 tests)
├── permits.spec.ts                # Permit service flow (8 tests)
├── checkout.spec.ts               # Stripe checkout (10 tests)
├── output.spec.ts                 # Result rendering (10 tests)
├── error.spec.ts                  # Error handling (10 tests)
└── README.md                       # This file
```

**Total: 49 comprehensive tests**

---

## Test Details

### 1. AI Concept Flow (`ai-concept.spec.ts`)

Tests the AI-powered concept insights page:

1. ✅ Load homepage and navigate to `/intake/exterior_concept`
2. ✅ Display insight card with summary, risks, recommendations
3. ✅ Navigate to next step on continue button
4. ✅ Gracefully handle missing API summary
5. ✅ Display different concepts for different project types

**Key Selectors:**
- `[data-testid="insight-card"]` — Main concept card
- `[data-testid="insight-summary"]` — AI summary text
- `[data-testid="insight-risks"]` — Risk items list
- `button:has-text("Continue")` — Continue button

---

### 2. Estimation Flow (`estimation.spec.ts`)

Tests the cost estimation form:

1. ✅ Load `/intake/cost_estimate` page
2. ✅ Display form fields (name, email, description)
3. ✅ Submit estimation form successfully
4. ✅ Display pricing information on checkout
5. ✅ Require all form fields (validation)
6. ✅ Validate email format

**Key Selectors:**
- `[data-testid="estimation-form"]` — Main form
- `input[name="name"]` — Name field
- `input[name="email"]` — Email field
- `textarea[name="description"]` — Description field
- `[data-testid="pricing-section"]` — Pricing area

---

### 3. Permit Service (`permits.spec.ts`)

Tests permit service intake:

1. ✅ Load `/intake/permit_path_only`
2. ✅ Display permit insight card
3. ✅ Show permit service CTA button
4. ✅ Navigate to permit checkout on CTA
5. ✅ Display permit service packages
6. ✅ Show pricing tiers
7. ✅ Allow package selection
8. ✅ Handle permit intake form

**Key Selectors:**
- `[data-testid="insight-card"]` — Permit recommendations
- `button:has-text(/apply|get permit/i)` — CTA button
- `[data-testid="package-card"]` — Package options
- `text=/\$[0-9]+/` — Pricing

---

### 4. Checkout (`checkout.spec.ts`)

Tests checkout flow with Stripe mocking:

1. ✅ Load checkout page
2. ✅ Display order summary
3. ✅ Show pricing tiers
4. ✅ Allow tier selection
5. ✅ **Mock Stripe checkout API** and verify payload
6. ✅ Show loading state during checkout
7. ✅ Include correct pricing in request
8. ✅ Handle checkout errors gracefully
9. ✅ Display discount/promo code option
10. ✅ Prevent duplicate submissions

**Key Mocking:**
```typescript
await page.route('**/api/**/stripe/checkout', route => {
  // Intercept and respond with mock session
  route.fulfill({ status: 200, body: JSON.stringify(mockSession) })
})
```

---

### 5. Output Rendering (`output.spec.ts`)

Tests project output page:

1. ✅ Load results page `/pre-design/results/:id`
2. ✅ Display project summary
3. ✅ Show risks in list format
4. ✅ Display recommendations
5. ✅ Show next steps
6. ✅ Display conversion CTA
7. ✅ Navigate on CTA click
8. ✅ Show budget estimate
9. ✅ Handle loading state
10. ✅ Display processing status for pending jobs

**Key Selectors:**
- `[data-testid="project-summary"]` — AI summary
- `[data-testid="risks-list"]` — Risk items
- `[data-testid="project-recommendations"]` — Recommendations
- `button:has-text(/book|schedule/i)` — CTA

---

### 6. Error Handling (`error.spec.ts`)

Tests system resilience:

1. ✅ Handle API 500 errors gracefully
2. ✅ Prevent crashes on invalid JSON responses
3. ✅ Handle network timeouts
4. ✅ Allow retry on error
5. ✅ Validate form submission errors
6. ✅ Show 404 on invalid routes
7. ✅ Handle Stripe checkout failures
8. ✅ Prevent duplicate form submissions
9. ✅ Handle missing environment variables
10. ✅ Graceful degradation on API errors

---

## Fixtures & Mocking

### Mock Data (`fixtures/mock-data.ts`)

```typescript
// Concept response
mockConceptResponse = {
  id: 'test-123',
  summary: 'Your exterior needs...',
  risks: [/* ... */],
  recommendations: [/* ... */]
}

// Project output response
mockProjectOutputResponse = {
  summary: '...',
  risks: [/* ... */],
  nextStep: 'Schedule consultation'
}

// Stripe session
mockStripeCheckoutSession = {
  id: 'cs_test_123',
  url: 'https://checkout.stripe.com/...'
}
```

### Helper Functions

```typescript
// Mock API response
await mockApiResponse(page, '**/api/path', response)

// Mock API error
await mockApiError(page, '**/api/path', 500)
```

---

## Configuration

### playwright.config.ts

```typescript
{
  testDir: './tests/e2e',
  baseURL: 'http://localhost:3024',  // web-main
  timeout: 30_000,
  retries: 2,
  workers: 1,  // Serial execution in CI
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry'
  }
}
```

---

## Running Tests Locally

### Step 1: Start Services

```bash
# Terminal 1: Start web-main
cd apps/web-main
pnpm dev

# Terminal 2: Start API
cd services/api
pnpm dev

# (PostgreSQL & Redis should be running on localhost)
```

### Step 2: Run Tests

```bash
# Headless (fast)
pnpm test:e2e

# With UI (interactive)
pnpm test:e2e:ui

# With browser visible (debug)
pnpm test:e2e:headed
```

### Step 3: View Results

```bash
# HTML report
pnpm test:e2e:report

# Videos in test-results/ folder
```

---

## CI/CD Integration

### GitHub Actions

Tests run automatically on:
- ✅ Push to `main` or `develop`
- ✅ Pull requests to `main` or `develop`

**File:** `.github/workflows/e2e-tests.yml`

### What CI Does

1. Sets up Node.js 20, pnpm
2. Installs dependencies
3. Starts PostgreSQL & Redis services
4. Builds web-main and API
5. Runs all E2E tests
6. Uploads test artifacts (reports, videos)
7. Comments on PR with results
8. **Fails build if tests fail** ❌

### Viewing CI Results

1. Go to GitHub → Actions
2. Select `E2E Tests` workflow run
3. Scroll down → Artifacts
4. Download `playwright-report` → Open `index.html` in browser

---

## Best Practices

### Writing Tests

1. ✅ Use `[data-testid]` attributes (not CSS selectors)
2. ✅ Wait for elements with `toBeVisible({ timeout: 10_000 })`
3. ✅ Mock external APIs (Stripe, AI endpoints)
4. ✅ Test real UI flow (not API only)
5. ✅ Use meaningful test descriptions
6. ✅ Clean up routes after each test

### Avoiding Flakiness

```typescript
// ❌ BAD: Hardcoded waits
await page.waitForTimeout(1000)

// ✅ GOOD: Wait for elements
await expect(page.locator('[data-testid="card"]')).toBeVisible()

// ❌ BAD: Brittle CSS selectors
page.click('.btn-primary:nth-child(2)')

// ✅ GOOD: Semantic selectors
page.click('button:has-text("Continue")')

// ❌ BAD: Race conditions
await page.goto(url)
await page.click('button')

// ✅ GOOD: Wait for navigation
await page.goto(url)
await page.waitForLoadState('networkidle')
await page.click('button')
```

---

## Troubleshooting

### Tests timing out

```bash
# Increase timeout
npx playwright test --timeout=60000

# Run single test to debug
npx playwright test tests/e2e/ai-concept.spec.ts -g "should load"
```

### Port already in use

```bash
# Kill processes on ports
lsof -i :3024  # Find process on port 3024
kill -9 <PID>

lsof -i :3000  # Find process on port 3000
kill -9 <PID>
```

### Tests passing locally but failing in CI

1. Check environment variables in `.github/workflows/e2e-tests.yml`
2. Verify database and Redis are running
3. Check for hardcoded timeouts (should use wait-for-element instead)
4. Run tests multiple times locally to check for flakiness

### Playwright browser issues

```bash
# Reinstall Playwright
npx playwright install --with-deps

# Clear Playwright cache
rm -rf ~/Library/Caches/ms-playwright
```

---

## Extending Tests

### Adding a New Test

1. Create `tests/e2e/new-flow.spec.ts`
2. Use template:

```typescript
import { test, expect } from '@playwright/test'
import { mockApiResponse } from './fixtures/mock-data'

test.describe('New Feature Flow', () => {
  test('should [action]', async ({ page }) => {
    // Arrange: Setup mocks
    await mockApiResponse(page, '**/api/**', mockData)

    // Act: Perform user action
    await page.goto('/path')
    await page.click('button')

    // Assert: Verify outcome
    await expect(page.locator('[data-testid="result"]')).toBeVisible()
  })
})
```

3. Run test: `npx playwright test tests/e2e/new-flow.spec.ts`

### Adding Mock Data

1. Add to `fixtures/mock-data.ts`:

```typescript
export const mockNewResponse = {
  // ...
}
```

2. Import and use:

```typescript
import { mockNewResponse } from './fixtures/mock-data'
await mockApiResponse(page, '**/api/**', mockNewResponse)
```

---

## Success Criteria ✅

- ✅ All 49 tests pass consistently
- ✅ <2% flakiness rate
- ✅ Tests complete in <5 minutes
- ✅ CI blocks broken deploys
- ✅ Screenshots captured on failures
- ✅ Full coverage of user journeys

---

## Resources

- **Playwright Docs:** https://playwright.dev
- **API Reference:** https://playwright.dev/docs/api/class-test
- **Best Practices:** https://playwright.dev/docs/best-practices
- **Debugging:** https://playwright.dev/docs/debug

---

## Support

For issues or questions:

1. Check this README first
2. Review test logs: `cat test-results/junit.xml`
3. Check Playwright report: `pnpm test:e2e:report`
4. Debug with: `pnpm test:e2e:debug`
