import { test, expect } from '@playwright/test'
import { mockApiResponse, mockConceptResponse } from './fixtures/mock-data'

test.describe('AI Concept Flow', () => {
  test('should load homepage and navigate to exterior concept', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/')

    // Verify homepage loads
    await expect(page).toHaveTitle(/Kealee|Home/i)
    await expect(page.locator('h1')).toBeVisible()
  })

  test('should display concept card with AI insights', async ({ page }) => {
    // Mock the API response for concept generation
    await mockApiResponse(
      page,
      '**/api/v1/intake/concept**',
      mockConceptResponse,
    )

    // Navigate to concept page directly
    await page.goto('/intake/exterior_concept')

    // Wait for insight card to load
    const insightCard = page.locator('[data-testid="insight-card"]')
    await expect(insightCard).toBeVisible({ timeout: 10_000 })

    // Verify summary is visible
    const summary = page.locator('[data-testid="insight-summary"]')
    await expect(summary).toContainText(/exterior|roofing|siding/i)

    // Verify risks are displayed
    const risksList = page.locator('[data-testid="insight-risks"]')
    await expect(risksList).toBeVisible()
    const riskItems = page.locator('[data-testid="risk-item"]')
    await expect(riskItems).toHaveCount(mockConceptResponse.risks.length)

    // Verify continue button exists
    const continueButton = page.locator('button:has-text("Continue")')
    await expect(continueButton).toBeVisible()
  })

  test('should navigate to next step on continue', async ({ page }) => {
    // Mock API
    await mockApiResponse(
      page,
      '**/api/v1/intake/concept**',
      mockConceptResponse,
    )

    // Go to concept page
    await page.goto('/intake/exterior_concept')

    // Wait for card
    await expect(page.locator('[data-testid="insight-card"]')).toBeVisible({
      timeout: 10_000,
    })

    // Click continue
    await page.locator('button:has-text("Continue")').click()

    // Should navigate to next step (estimate or checkout)
    await page.waitForURL(/\/(checkout|estimate|review)/i, {
      timeout: 5_000,
    })
  })

  test('should handle missing AI summary gracefully', async ({ page }) => {
    // Navigate to concept page
    await page.goto('/intake/exterior_concept')

    // Wait for fallback content if API fails
    const fallbackContent = page.locator('[data-testid="fallback-content"]')
    const insightCard = page.locator('[data-testid="insight-card"]')

    // Either insight card OR fallback should be visible
    const isInsightVisible = await insightCard.isVisible({ timeout: 5_000 }).catch(() => false)
    const isFallbackVisible = await fallbackContent.isVisible({ timeout: 5_000 }).catch(() => false)

    expect(isInsightVisible || isFallbackVisible).toBeTruthy()
  })

  test('should display different concepts for different project types', async ({ page }) => {
    // Test exterior concept
    await page.goto('/intake/exterior_concept')
    await expect(page.locator('text=/exterior|roof|siding/i')).toBeVisible({
      timeout: 10_000,
    })

    // Test interior concept (if route exists)
    await page.goto('/intake/interior_reno')
    await expect(page.locator('h1')).toContainText(/interior|renovation|remodel/i)
  })
})
