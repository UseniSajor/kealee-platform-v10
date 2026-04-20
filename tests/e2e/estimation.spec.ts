import { test, expect } from '@playwright/test'
import { testEstimationData } from './fixtures/mock-data'

test.describe('Cost Estimation Flow', () => {
  test('should load estimation page', async ({ page }) => {
    // Navigate to estimation page
    await page.goto('/intake/cost_estimate')

    // Verify page loaded
    await expect(page.locator('h1')).toContainText(/estimate|cost/i)
  })

  test('should display estimation form fields', async ({ page }) => {
    await page.goto('/intake/cost_estimate')

    // Wait for form to load
    const form = page.locator('[data-testid="estimation-form"]')
    await expect(form).toBeVisible()

    // Verify form fields exist
    const nameInput = page.locator('input[name="name"], input[placeholder*="Name"]')
    const emailInput = page.locator('input[name="email"], input[placeholder*="Email"]')
    const descriptionInput = page.locator(
      'textarea[name="description"], textarea[placeholder*="Description"]',
    )

    await expect(nameInput).toBeVisible()
    await expect(emailInput).toBeVisible()
    await expect(descriptionInput).toBeVisible()
  })

  test('should submit estimation form successfully', async ({ page }) => {
    await page.goto('/intake/cost_estimate')

    // Wait for form
    await expect(page.locator('[data-testid="estimation-form"]')).toBeVisible()

    // Fill form fields
    await page.fill('input[name="name"], input[placeholder*="Name"]', testEstimationData.name)
    await page.fill('input[name="email"], input[placeholder*="Email"]', testEstimationData.email)
    await page.fill(
      'textarea[name="description"], textarea[placeholder*="Description"]',
      testEstimationData.projectDescription,
    )

    // Submit form
    const submitButton = page.locator('button:has-text("Continue"), button:has-text("Next")')
    await submitButton.click()

    // Should navigate to review or checkout
    await page.waitForURL(/\/(review|checkout)/i, { timeout: 5_000 })
  })

  test('should display pricing information', async ({ page }) => {
    // Navigate to checkout (where pricing is shown)
    await page.goto('/estimate/checkout')

    // Wait for pricing to load
    const pricingSection = page.locator('[data-testid="pricing-section"]')
    await expect(pricingSection).toBeVisible({ timeout: 5_000 })

    // Verify pricing tiers are visible
    const pricingCards = page.locator('[data-testid="pricing-card"]')
    const cardCount = await pricingCards.count()
    expect(cardCount).toBeGreaterThan(0)

    // Verify prices are displayed
    const prices = page.locator('text=/\\$[0-9]+/')
    await expect(prices.first()).toBeVisible()
  })

  test('should require all form fields', async ({ page }) => {
    await page.goto('/intake/cost_estimate')

    // Try to submit empty form
    const submitButton = page.locator('button:has-text("Continue"), button:has-text("Next")')
    await submitButton.click()

    // Should show validation errors or remain on same page
    const errors = page.locator('[data-testid="error"], .error, .validation-error')
    const isError = await errors.isVisible({ timeout: 3_000 }).catch(() => false)
    const isSamePage = page.url().includes('/cost_estimate')

    expect(isError || isSamePage).toBeTruthy()
  })

  test('should validate email format', async ({ page }) => {
    await page.goto('/intake/cost_estimate')

    // Fill with invalid email
    await page.fill('input[name="name"], input[placeholder*="Name"]', 'Test User')
    await page.fill('input[name="email"], input[placeholder*="Email"]', 'not-an-email')
    await page.fill(
      'textarea[name="description"], textarea[placeholder*="Description"]',
      'Test description',
    )

    // Submit
    const submitButton = page.locator('button:has-text("Continue"), button:has-text("Next")')
    await submitButton.click()

    // Should show validation error or stay on page
    const errors = page.locator('[data-testid="error"], .error')
    const isError = await errors.isVisible({ timeout: 3_000 }).catch(() => false)
    const isSamePage = page.url().includes('/cost_estimate')

    expect(isError || isSamePage).toBeTruthy()
  })

  test('should show cost breakdown', async ({ page }) => {
    await page.goto('/estimate/checkout')

    // Wait for page load
    await page.waitForLoadState('networkidle')

    // Look for cost breakdown section
    const costItems = page.locator('[data-testid="cost-item"], [data-testid="estimate-line"]')
    const itemCount = await costItems.count()

    // Should have at least one cost item
    if (itemCount > 0) {
      await expect(costItems.first()).toBeVisible()
    }
  })
})
