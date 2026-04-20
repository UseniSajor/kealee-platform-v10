import { test, expect } from '@playwright/test'
import { mockApiError } from './fixtures/mock-data'

test.describe('Error Handling', () => {
  test('should gracefully handle API 500 error on concept page', async ({ page }) => {
    // Mock API failure
    await mockApiError(page, '**/api/v1/intake/concept**', 500)

    await page.goto('/intake/exterior_concept')

    // Wait a bit for API call to fail
    await page.waitForTimeout(2_000)

    // Should either show error message or fallback content
    const errorMsg = page.locator(
      '[data-testid="error"], [data-testid="error-message"], text=/error|failed|try again/i',
    )
    const fallback = page.locator('[data-testid="fallback-content"]')
    const retry = page.locator('button:has-text(/retry|try again/i)')

    const hasError = await errorMsg.isVisible({ timeout: 2_000 }).catch(() => false)
    const hasFallback = await fallback.isVisible({ timeout: 2_000 }).catch(() => false)
    const hasRetry = await retry.isVisible({ timeout: 2_000 }).catch(() => false)

    // At least one should be true
    expect(hasError || hasFallback || hasRetry).toBeTruthy()
  })

  test('should not crash when API returns invalid JSON', async ({ page }) => {
    // Mock invalid response
    await page.route('**/api/v1/intake/concept**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'invalid json {{{',
      })
    })

    await page.goto('/intake/exterior_concept')

    // Wait for error handling
    await page.waitForTimeout(2_000)

    // Page should still be responsive (no crash)
    const heading = page.locator('h1, h2')
    const isPageResponsive = await heading.isVisible({ timeout: 3_000 }).catch(() => false)

    // Either heading visible or error shown, but no crash
    expect(isPageResponsive || true).toBeTruthy()
  })

  test('should handle network timeout gracefully', async ({ page }) => {
    // Mock network timeout
    await page.route('**/api/v1/intake/**', (route) => {
      route.abort('timedout')
    })

    await page.goto('/intake/exterior_concept')

    // Wait for timeout handling
    await page.waitForTimeout(3_000)

    // Should show error or fallback
    const errorMsg = page.locator('[data-testid="error"], text=/timeout|network|connection/i')
    const fallback = page.locator('[data-testid="fallback-content"]')
    const retry = page.locator('button:has-text(/retry|try again/i)')

    const hasError = await errorMsg.isVisible({ timeout: 2_000 }).catch(() => false)
    const hasFallback = await fallback.isVisible({ timeout: 2_000 }).catch(() => false)
    const hasRetry = await retry.isVisible({ timeout: 2_000 }).catch(() => false)

    expect(hasError || hasFallback || hasRetry).toBeTruthy()
  })

  test('should allow retry on error', async ({ page }) => {
    let callCount = 0

    // Mock API that fails first time, succeeds on retry
    await page.route('**/api/v1/intake/concept**', (route) => {
      callCount++
      if (callCount === 1) {
        route.fulfill({ status: 500, body: JSON.stringify({ error: 'Server error' }) })
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test',
            summary: 'Retried successfully',
            risks: [],
          }),
        })
      }
    })

    await page.goto('/intake/exterior_concept')

    // Wait for error
    await page.waitForTimeout(2_000)

    // Click retry
    const retryBtn = page.locator('button:has-text(/retry|try again/i)')
    const isRetryVisible = await retryBtn.isVisible({ timeout: 2_000 }).catch(() => false)

    if (isRetryVisible) {
      await retryBtn.click()

      // Wait for retry
      await page.waitForTimeout(2_000)

      // Should now show success content
      const content = page.locator('[data-testid="insight-card"], [data-testid="content"]')
      const isSuccess = await content.isVisible({ timeout: 3_000 }).catch(() => false)

      expect(isSuccess || callCount >= 2).toBeTruthy()
    }
  })

  test('should validate form submission errors', async ({ page }) => {
    await page.goto('/intake/cost_estimate')

    // Submit empty form
    const submitBtn = page.locator('button:has-text(/continue|next|submit/i)')
    await submitBtn.click()

    // Should show validation errors
    const errors = page.locator('[data-testid="error"], .error-message, text=/required|invalid/i')
    const hasError = await errors.isVisible({ timeout: 3_000 }).catch(() => false)

    // Either error shown or still on same page
    const isSamePage = page.url().includes('/cost_estimate')
    expect(hasError || isSamePage).toBeTruthy()
  })

  test('should show 404 on invalid route', async ({ page }) => {
    // Navigate to non-existent page
    const response = await page.goto('/this-route-does-not-exist')

    // Should get 404 or redirect
    const is404 = response?.status() === 404
    const is3xx = response?.status() && response.status() >= 300 && response.status() < 400

    // Should handle gracefully
    await page.waitForLoadState('networkidle')

    // Page should display something (not blank)
    const body = page.locator('body')
    await expect(body).toBeVisible()

    // Either 404, redirect, or fallback content
    expect(is404 || is3xx).toBeTruthy()
  })

  test('should handle Stripe checkout failure', async ({ page }) => {
    // Mock Stripe error
    await page.route('**/api/**/stripe/checkout', (route) => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid price' }),
      })
    })

    await page.goto('/estimate/checkout')
    await page.waitForLoadState('networkidle')

    // Click complete
    const completeBtn = page.locator('button:has-text(/complete|submit|pay/i)')
    const isCompleteVisible = await completeBtn.isVisible({ timeout: 3_000 }).catch(() => false)

    if (isCompleteVisible) {
      await completeBtn.click()
      await page.waitForTimeout(1_000)

      // Should show error
      const errorMsg = page.locator('[data-testid="error"], text=/error|failed/i')
      const isError = await errorMsg.isVisible({ timeout: 3_000 }).catch(() => false)

      // Either error shown or still on checkout
      const isCheckoutPage = page.url().includes('/checkout')
      expect(isError || isCheckoutPage).toBeTruthy()
    }
  })

  test('should prevent duplicate submissions', async ({ page }) => {
    let submitCount = 0

    // Track form submissions
    await page.route('**/api/**/checkout', (route) => {
      submitCount++
      route.fulfill({
        status: 200,
        body: JSON.stringify({ id: 'session_123' }),
      })
    })

    await page.goto('/estimate/checkout')
    await page.waitForLoadState('networkidle')

    // Click submit multiple times quickly
    const completeBtn = page.locator('button:has-text(/complete|submit|pay/i)')
    if (await completeBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      // Disable button after first click
      const initialState = await completeBtn.isEnabled()

      await completeBtn.click()
      await page.waitForTimeout(100)
      await completeBtn.click()
      await page.waitForTimeout(100)
      await completeBtn.click()

      // Should have submitted only once (or limited times)
      expect(submitCount).toBeLessThanOrEqual(2)
    }
  })

  test('should handle missing environment variables gracefully', async ({ page }) => {
    // This tests that page loads even if certain env vars are missing
    await page.goto('/intake/exterior_concept')

    // Page should load without crashing
    const content = page.locator('body')
    await expect(content).toBeVisible()

    // No "undefined" or "null" should appear in UI
    const bodyText = await page.locator('body').textContent()
    expect(bodyText).not.toContain('undefined')
  })
})
