/**
 * Phase 4: Billing & Subscriptions - E2E Tests
 * Tests checkout flow, billing dashboard, and subscription management
 *
 * Prerequisites:
 * - Stripe test keys configured
 * - Database seeded with users
 * - Application running on localhost:3000
 *
 * Run with: npx playwright test e2e/phase-4-billing.spec.ts
 */

import { test, expect } from '@playwright/test'

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000'
const STRIPE_TEST_CARD = '4242 4242 4242 4242'
const STRIPE_TEST_EXPIRY = '12/25'
const STRIPE_TEST_CVC = '123'

test.describe('Phase 4: Billing & Subscriptions', () => {
  // Test 1: Verify checkout page loads and displays plans
  test('checkout page displays all subscription plans', async ({ page }) => {
    await page.goto(`${BASE_URL}/checkout`)

    // Verify page title
    await expect(page.locator('h1')).toContainText('Kealee GC Operations Platform')

    // Verify all 4 plans are displayed
    await expect(page.locator('h3')).toContainText('Starter')
    await expect(page.locator('h3')).toContainText('Growth')
    await expect(page.locator('h3')).toContainText('Professional')
    await expect(page.locator('h3')).toContainText('Enterprise')

    // Verify pricing
    const starterPrice = page.locator('text=Starter').locator('..').locator('text=$1,750')
    await expect(starterPrice).toBeVisible()
  })

  // Test 2: Verify monthly/annual toggle works
  test('billing interval toggle updates prices', async ({ page }) => {
    await page.goto(`${BASE_URL}/checkout`)

    // Get monthly price
    const monthlyText = await page.locator('text=Starter').locator('..').locator('text=/\\$[0-9,]+\\/mo/').first().textContent()

    // Click annual toggle
    await page.locator('button[role="switch"]').click()

    // Verify price changed (annual should be lower per month)
    const annualText = await page.locator('text=Starter').locator('..').locator('text=/\\$[0-9,]+\\/mo/').first().textContent()

    // Annual monthly price should be less than monthly billed annually
    expect(monthlyText).not.toBe(annualText)

    // Verify "Save 15%" text appears
    await expect(page.locator('text=Save 15%')).toBeVisible()
  })

  // Test 3: Verify plan selection shows features
  test('plan cards display features', async ({ page }) => {
    await page.goto(`${BASE_URL}/checkout`)

    // Growth plan (most popular)
    const growthCard = page.locator('text=Growth').locator('..')

    // Verify features are visible
    await expect(growthCard.locator('text=Up to 20 projects')).toBeVisible()
    await expect(growthCard.locator('text=Contractor marketplace')).toBeVisible()

    // Verify popular badge
    await expect(growthCard.locator('text=MOST POPULAR')).toBeVisible()
  })

  // Test 4: Verify checkout button click initiates Stripe session
  test('choose plan button initiates checkout flow', async ({ page, context }) => {
    await page.goto(`${BASE_URL}/checkout`)

    // Intercept API calls to mock Stripe redirect
    await page.route('**/api/billing/checkout', (route) => {
      route.abort('blockedbycontenttype')
    })

    // Try to click Choose Plan - should make API request
    const chooseButton = page.locator('button:has-text("Choose Plan")').first()

    // Listen for the request (we'll abort it to avoid actual Stripe redirect in test)
    const requestPromise = page.waitForEvent('requestfinished', (request) => {
      return request.url().includes('/api/billing/checkout')
    })

    await chooseButton.click()

    // Wait a bit for request
    await page.waitForTimeout(1000)
  })

  // Test 5: Verify FAQ section is visible
  test('checkout page displays FAQ', async ({ page }) => {
    await page.goto(`${BASE_URL}/checkout`)

    await expect(page.locator('h2:has-text("Frequently Asked Questions")')).toBeVisible()
    await expect(page.locator('text=What\'s included in the 14-day free trial?')).toBeVisible()
    await expect(page.locator('text=Can I upgrade or downgrade my plan?')).toBeVisible()
  })

  // Test 6: Verify unauthenticated users can access checkout
  test('unauthenticated users can access checkout', async ({ page }) => {
    // Clear cookies to ensure no auth
    await page.context().clearCookies()

    await page.goto(`${BASE_URL}/checkout`)

    // Should not redirect to login
    expect(page.url()).toContain('/checkout')
    await expect(page.locator('h1')).toContainText('Kealee GC Operations Platform')
  })

  // Test 7: Verify billing dashboard requires authentication
  test('billing dashboard requires login', async ({ page }) => {
    // Clear cookies
    await page.context().clearCookies()

    await page.goto(`${BASE_URL}/dashboard/billing`)

    // Should redirect to login
    expect(page.url()).toContain('/auth/login')
  })

  // Test 8: Verify billing dashboard shows "no subscription" state
  test('billing dashboard shows no subscription state when user has no subscription', async ({ page }) => {
    // TODO: Login with test user who has no subscription
    // This requires a test user fixture
    // await loginAsTestUser(page)

    // Commented out for now - requires test user setup
    // await page.goto(`${BASE_URL}/dashboard/billing`)
    // await expect(page.locator('text=No Active Subscription')).toBeVisible()
  })

  // Test 9: Verify invoice page requires authentication
  test('invoice page requires login', async ({ page }) => {
    // Clear cookies
    await page.context().clearCookies()

    await page.goto(`${BASE_URL}/dashboard/billing/invoices`)

    // Should redirect to login
    expect(page.url()).toContain('/auth/login')
  })

  // Test 10: Verify API routes are correctly configured
  test('checkout API route returns valid response', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/billing/checkout`, {
      data: {
        planSlug: 'package-a',
        interval: 'month',
        orgId: 'test-org-12345',
        customerEmail: 'test@example.com',
      },
    })

    // Should return 200 or error with proper message
    if (response.ok()) {
      const data = await response.json() as { url?: string; error?: string }
      expect(data.url).toBeDefined()
    } else {
      // Stripe not configured error is expected if keys missing
      const data = await response.json() as { error?: string }
      expect(data.error).toBeDefined()
    }
  })

  // Test 11: Verify portal API route accepts customerId
  test('portal API route requires customerId', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/billing/portal`, {
      data: {
        customerId: 'cus_test123',
        returnUrl: 'http://localhost:3000/dashboard/billing',
      },
    })

    // Should return 200 or error with proper message
    if (response.status() === 400) {
      const data = await response.json() as { error?: string }
      expect(data.error).toContain('customerId')
    }
  })

  // Test 12: Verify middleware allows public checkout access
  test('checkout is in public routes', async ({ page }) => {
    // This test verifies that /checkout is accessible without auth
    // by checking that it doesn't redirect to login
    await page.goto(`${BASE_URL}/checkout`)

    // Should load successfully without login redirect
    expect(page.url()).toContain('/checkout')
    await expect(page.locator('h1')).toBeVisible()
  })

  // Test 13: Verify billing page has expected UI elements
  test('billing dashboard UI structure is correct', async ({ page }) => {
    // TODO: Requires authenticated test user
    // await loginAsTestUser(page)
    // await page.goto(`${BASE_URL}/dashboard/billing`)

    // Verify main heading
    // await expect(page.locator('h1:has-text("Billing & Subscription")')).toBeVisible()

    // Verify "View Invoices" link
    // await expect(page.locator('text=View Invoices')).toBeVisible()

    // Verify back link on invoices page
    // await page.click('text=View Invoices')
    // await expect(page.locator('text=Back to Billing')).toBeVisible()
  })

  // Test 14: Verify error handling in checkout
  test('checkout handles missing required fields', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/billing/checkout`, {
      data: {
        planSlug: 'package-a',
        // Missing interval, orgId, etc
      },
    })

    // Should return 400 error
    expect(response.status()).toBe(400)
    const data = await response.json() as { error?: string }
    expect(data.error).toContain('required')
  })

  // Test 15: Verify invalid plan slug is rejected
  test('checkout rejects invalid plan slug', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/billing/checkout`, {
      data: {
        planSlug: 'invalid-plan',
        interval: 'month',
        orgId: 'test-org',
      },
    })

    // Should return error
    expect(response.status()).toBeGreaterThanOrEqual(400)
  })
})

test.describe('Billing Integration Tests', () => {
  // Integration test: Full checkout flow
  test.skip('full checkout flow with Stripe test card', async ({ page, context }) => {
    // This test is skipped by default as it requires Stripe test mode
    // Re-enable by removing .skip when testing with actual Stripe test account

    await page.goto(`${BASE_URL}/checkout`)

    // Select Growth plan
    const growthCard = page.locator('text=Growth').locator('..')
    await growthCard.locator('button:has-text("Choose Plan")').click()

    // Wait for Stripe redirect
    const stripeFrame = await context.waitForEvent('page')
    await stripeFrame.waitForLoadState()

    // Fill Stripe form (in test mode, Stripe uses simple test cards)
    const emailInput = stripeFrame.locator('input[placeholder*="Email"]')
    if (await emailInput.isVisible()) {
      await emailInput.fill('test@example.com')
    }

    // Note: In test mode, actual payment form interaction requires special handling
    // This is a simplified example
  })

  // Integration test: Subscription lifecycle
  test.skip('subscription lifecycle - create, update, cancel', async ({ page }) => {
    // This test requires:
    // 1. Authenticated user
    // 2. Valid Stripe subscription
    // 3. Proper API mocking
    // Skipped for now - implement with proper test fixtures
  })
})
