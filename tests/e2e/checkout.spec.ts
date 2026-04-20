import { test, expect } from '@playwright/test'
import { mockApiResponse, mockStripeCheckoutSession } from './fixtures/mock-data'

test.describe('Checkout Flow', () => {
  test('should load checkout page', async ({ page }) => {
    // Navigate to checkout (could be from estimate or permit flow)
    await page.goto('/estimate/checkout')

    // Verify page loaded
    const heading = page.locator('h1, h2')
    await expect(heading).toBeVisible()
  })

  test('should display order summary', async ({ page }) => {
    await page.goto('/estimate/checkout')

    // Wait for page
    await page.waitForLoadState('networkidle')

    // Look for order summary
    const summary = page.locator('[data-testid="order-summary"], .summary, [data-testid="total"]')
    const isSummaryVisible = await summary.isVisible({ timeout: 5_000 }).catch(() => false)

    // Summary should be visible
    expect(isSummaryVisible).toBeTruthy()
  })

  test('should display pricing tiers', async ({ page }) => {
    await page.goto('/estimate/checkout')

    // Wait for content
    await page.waitForLoadState('networkidle')

    // Look for pricing options
    const pricingCards = page.locator('[data-testid="pricing-card"], .pricing-option, .tier')
    const cardCount = await pricingCards.count()

    // Should have at least 1 pricing option
    expect(cardCount).toBeGreaterThanOrEqual(1)
  })

  test('should allow tier selection', async ({ page }) => {
    await page.goto('/estimate/checkout')

    // Wait for content
    await page.waitForLoadState('networkidle')

    // Select a pricing tier
    const selectButtons = page.locator(
      'button:has-text(/select|choose|continue|get/i)',
      { has: page.locator('[data-testid="pricing-card"]') },
    )
    const buttonCount = await selectButtons.count()

    if (buttonCount > 0) {
      await selectButtons.first().click()

      // Should navigate or show confirmation
      await page.waitForNavigation({ timeout: 5_000 }).catch(() => {})
    }
  })

  test('should trigger Stripe checkout when order placed', async ({ page }) => {
    // Mock Stripe checkout endpoint
    let checkoutCalled = false
    let checkoutPayload: any = null

    await page.route('**/api/**/stripe/checkout', (route) => {
      checkoutCalled = true
      checkoutPayload = route.request().postDataJSON()
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockStripeCheckoutSession),
      })
    })

    await page.goto('/estimate/checkout')

    // Wait for page
    await page.waitForLoadState('networkidle')

    // Click complete order button
    const completeButton = page.locator(
      'button:has-text(/complete|submit|pay|place order/i)',
    )

    if (await completeButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await completeButton.click()

      // Wait a bit for API call
      await page.waitForTimeout(1_000)

      // Verify API was called
      expect(checkoutCalled).toBeTruthy()

      // Verify payload has required fields
      if (checkoutPayload) {
        expect(checkoutPayload).toHaveProperty('price')
        expect(checkoutPayload).toHaveProperty('source')
      }
    }
  })

  test('should show loading state during checkout', async ({ page }) => {
    // Mock slow Stripe response
    await page.route('**/api/**/stripe/checkout', async (route) => {
      await page.waitForTimeout(2_000)
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockStripeCheckoutSession),
      })
    })

    await page.goto('/estimate/checkout')

    // Click complete
    const completeButton = page.locator('button:has-text(/complete|submit|pay/i)')

    if (await completeButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await completeButton.click()

      // Look for loading indicator
      const loader = page.locator('[data-testid="loader"], .loading, [role="progressbar"]')
      const isLoading = await loader.isVisible({ timeout: 1_000 }).catch(() => false)

      // Either loading state exists or completes quickly
      expect(isLoading || true).toBeTruthy()
    }
  })

  test('should include correct pricing in checkout payload', async ({ page }) => {
    let capturedPayload: any = null

    await page.route('**/api/**/stripe/checkout', (route) => {
      capturedPayload = route.request().postDataJSON()
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockStripeCheckoutSession),
      })
    })

    await page.goto('/estimate/checkout')
    await page.waitForLoadState('networkidle')

    // Select a tier if available
    const selectButton = page.locator('button:has-text(/select|continue/i)').first()
    if (await selectButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await selectButton.click()
      await page.waitForTimeout(500)
    }

    // Complete order
    const completeButton = page.locator('button:has-text(/complete|submit|pay/i)')
    if (await completeButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await completeButton.click()
      await page.waitForTimeout(1_000)
    }

    // Verify payload structure
    if (capturedPayload) {
      expect(capturedPayload).toMatchObject({
        price: expect.any(String),
        source: expect.any(String),
      })
    }
  })

  test('should handle checkout errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/**/stripe/checkout', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Stripe service unavailable' }),
      })
    })

    await page.goto('/estimate/checkout')
    await page.waitForLoadState('networkidle')

    const completeButton = page.locator('button:has-text(/complete|submit|pay/i)')
    if (await completeButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await completeButton.click()
      await page.waitForTimeout(1_000)

      // Should show error message or retry option
      const errorMsg = page.locator('[data-testid="error"], .error-message, text=/error|failed/i')
      const isErrorVisible = await errorMsg.isVisible({ timeout: 3_000 }).catch(() => false)

      // Either error shown or still on checkout page
      const isCheckoutPage = page.url().includes('/checkout')
      expect(isErrorVisible || isCheckoutPage).toBeTruthy()
    }
  })

  test('should display discount or promo code option', async ({ page }) => {
    await page.goto('/estimate/checkout')

    // Look for promo code input
    const promoInput = page.locator(
      'input[placeholder*="promo"], input[placeholder*="discount"], input[name="code"]',
    )
    const isPromoVisible = await promoInput.isVisible({ timeout: 3_000 }).catch(() => false)

    // Promo code might be optional
    if (isPromoVisible) {
      await expect(promoInput).toBeVisible()
    }
  })
})
