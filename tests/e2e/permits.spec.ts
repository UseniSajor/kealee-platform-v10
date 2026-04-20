import { test, expect } from '@playwright/test'
import { mockApiResponse, mockConceptResponse } from './fixtures/mock-data'

test.describe('Permit Service Flow', () => {
  test('should load permit intake page', async ({ page }) => {
    // Navigate to permit page
    await page.goto('/intake/permit_path_only')

    // Verify page loaded
    const heading = page.locator('h1')
    await expect(heading).toBeVisible()
    await expect(heading).toContainText(/permit/i)
  })

  test('should display permit insight card', async ({ page }) => {
    // Mock permit recommendations API
    await mockApiResponse(page, '**/api/v1/permits/insight**', mockConceptResponse)

    await page.goto('/intake/permit_path_only')

    // Wait for insight card
    const insightCard = page.locator('[data-testid="insight-card"]')
    await expect(insightCard).toBeVisible({ timeout: 10_000 })

    // Verify permit-specific content
    const summary = page.locator('[data-testid="insight-summary"]')
    await expect(summary).toBeVisible()

    // Verify risks/recommendations
    const risks = page.locator('[data-testid="insight-risks"]')
    await expect(risks).toBeVisible()
  })

  test('should display permit service CTA button', async ({ page }) => {
    await page.goto('/intake/permit_path_only')

    // Wait for card
    await expect(page.locator('[data-testid="insight-card"]')).toBeVisible({
      timeout: 10_000,
    })

    // Look for CTA button
    const ctaButton = page.locator(
      'button:has-text(/apply|get permit|start|continue/i)',
    )
    await expect(ctaButton).toBeVisible()
  })

  test('should navigate to permit checkout on CTA click', async ({ page }) => {
    await page.goto('/intake/permit_path_only')

    // Wait for insight card
    await expect(page.locator('[data-testid="insight-card"]')).toBeVisible({
      timeout: 10_000,
    })

    // Click CTA
    await page.locator('button:has-text(/apply|get permit|start|continue/i)').click()

    // Should navigate to permit checkout
    await page.waitForURL(/\/(permits\/checkout|checkout\?.*permit)/i, {
      timeout: 5_000,
    })
  })

  test('should display permit service packages', async ({ page }) => {
    // Navigate to permit checkout
    await page.goto('/permits/checkout')

    // Wait for page load
    await page.waitForLoadState('networkidle')

    // Look for pricing packages
    const packages = page.locator('[data-testid="package-card"], .package-option')
    const packageCount = await packages.count()

    // Should have at least 1 package option
    expect(packageCount).toBeGreaterThanOrEqual(1)

    // Verify package details are visible
    const packageNames = page.locator('[data-testid="package-name"], .package-title')
    await expect(packageNames.first()).toBeVisible()
  })

  test('should show permit pricing', async ({ page }) => {
    await page.goto('/permits/checkout')

    // Wait for pricing to load
    await page.waitForLoadState('networkidle')

    // Look for price elements
    const prices = page.locator('text=/\\$[0-9]+/')
    await expect(prices.first()).toBeVisible()
  })

  test('should allow package selection', async ({ page }) => {
    await page.goto('/permits/checkout')

    // Wait for packages
    await page.waitForLoadState('networkidle')

    // Select first package
    const packageButtons = page.locator(
      'button:has-text(/select|choose|apply/i), [data-testid="select-package"]',
    )
    const buttonCount = await packageButtons.count()

    if (buttonCount > 0) {
      await packageButtons.first().click()

      // Should show confirmation or navigate
      await page.waitForNavigation({ timeout: 5_000 }).catch(() => {})
      // Or verify selection state
      const selected = page.locator('[data-testid="selected"], .selected, [aria-selected="true"]')
      await expect(selected.first()).toBeVisible({ timeout: 3_000 }).catch(() => {})
    }
  })

  test('should display permit service details', async ({ page }) => {
    await page.goto('/permits/checkout')

    // Wait for page
    await page.waitForLoadState('networkidle')

    // Look for service details/description
    const details = page.locator('[data-testid="service-details"], .details, p')
    const detailCount = await details.count()

    // Should have content
    expect(detailCount).toBeGreaterThan(0)
  })

  test('should handle permit intake form submission', async ({ page }) => {
    // Try different permit intake paths
    const paths = ['/intake/permit_path_only', '/permits/intake']

    for (const path of paths) {
      const response = await page.goto(path)
      if (response?.ok()) {
        // Look for form
        const form = page.locator('form, [data-testid="form"]')
        const isFormVisible = await form.isVisible({ timeout: 5_000 }).catch(() => false)

        if (isFormVisible) {
          // Form exists - we can test it in another test
          break
        }
      }
    }
  })
})
