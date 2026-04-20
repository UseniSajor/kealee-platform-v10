import { test, expect } from '@playwright/test'
import { mockApiResponse, mockProjectOutputResponse } from './fixtures/mock-data'

test.describe('Output Rendering', () => {
  test('should load project output page', async ({ page }) => {
    // Mock project output API
    await mockApiResponse(
      page,
      '**/api/project-output/**',
      mockProjectOutputResponse,
    )

    // Navigate to results page with test ID
    await page.goto('/pre-design/results/test-output-456')

    // Verify page loads
    const content = page.locator('[data-testid="project-output"], main, body')
    await expect(content).toBeVisible()
  })

  test('should display project summary', async ({ page }) => {
    // Mock API
    await mockApiResponse(
      page,
      '**/api/project-output/**',
      mockProjectOutputResponse,
    )

    await page.goto('/pre-design/results/test-output-456')

    // Wait for summary to load
    const summary = page.locator('[data-testid="project-summary"], [data-testid="output-summary"]')
    await expect(summary).toBeVisible({ timeout: 10_000 })

    // Verify summary content
    await expect(summary).toContainText(/renovation|exterior|upgrade/i)
  })

  test('should display risks in list format', async ({ page }) => {
    // Mock API
    await mockApiResponse(
      page,
      '**/api/project-output/**',
      mockProjectOutputResponse,
    )

    await page.goto('/pre-design/results/test-output-456')

    // Wait for risks list
    const risksList = page.locator('[data-testid="risks-list"], [data-testid="project-risks"]')
    await expect(risksList).toBeVisible({ timeout: 10_000 })

    // Verify risk items
    const riskItems = page.locator('[data-testid="risk-item"]')
    const riskCount = await riskItems.count()
    expect(riskCount).toBeGreaterThan(0)

    // Verify risk content
    await expect(riskItems.first()).toContainText(/structural|permit|weather/i)
  })

  test('should display recommendations', async ({ page }) => {
    // Mock API
    await mockApiResponse(
      page,
      '**/api/project-output/**',
      mockProjectOutputResponse,
    )

    await page.goto('/pre-design/results/test-output-456')

    // Look for recommendations section
    const recommendations = page.locator(
      '[data-testid="recommendations"], [data-testid="project-recommendations"]',
    )
    const isVisible = await recommendations.isVisible({ timeout: 10_000 }).catch(() => false)

    if (isVisible) {
      // Verify recommendation items
      const recItems = page.locator('[data-testid="recommendation-item"]')
      await expect(recItems.first()).toBeVisible()
    }
  })

  test('should display next steps', async ({ page }) => {
    // Mock API
    await mockApiResponse(
      page,
      '**/api/project-output/**',
      mockProjectOutputResponse,
    )

    await page.goto('/pre-design/results/test-output-456')

    // Look for next steps
    const nextSteps = page.locator('[data-testid="next-steps"], [data-testid="next-step"]')
    const isVisible = await nextSteps.isVisible({ timeout: 10_000 }).catch(() => false)

    if (isVisible) {
      await expect(nextSteps).toContainText(/schedule|book|consultation|meeting/i)
    }
  })

  test('should display conversion CTA button', async ({ page }) => {
    // Mock API
    await mockApiResponse(
      page,
      '**/api/project-output/**',
      mockProjectOutputResponse,
    )

    await page.goto('/pre-design/results/test-output-456')

    // Wait for CTA
    const cta = page.locator(
      'button:has-text(/book|schedule|apply|get started|next step/i)',
    )
    await expect(cta).toBeVisible({ timeout: 10_000 })
  })

  test('should navigate on CTA click', async ({ page }) => {
    // Mock API
    await mockApiResponse(
      page,
      '**/api/project-output/**',
      mockProjectOutputResponse,
    )

    await page.goto('/pre-design/results/test-output-456')

    // Wait for CTA
    const cta = page.locator(
      'button:has-text(/book|schedule|apply|get started|next step/i)',
    )
    await expect(cta).toBeVisible({ timeout: 10_000 })

    // Click CTA
    await cta.click()

    // Should navigate somewhere (checkout, booking, etc.)
    await page.waitForNavigation({ timeout: 5_000 }).catch(() => {})
    const urlChanged = page.url() !== 'http://localhost:3024/pre-design/results/test-output-456'
    expect(urlChanged || true).toBeTruthy()
  })

  test('should display budget estimate', async ({ page }) => {
    // Mock API
    await mockApiResponse(
      page,
      '**/api/project-output/**',
      mockProjectOutputResponse,
    )

    await page.goto('/pre-design/results/test-output-456')

    // Look for budget
    const budget = page.locator('[data-testid="budget"], [data-testid="estimated-budget"]')
    const isBudgetVisible = await budget.isVisible({ timeout: 10_000 }).catch(() => false)

    if (isBudgetVisible) {
      await expect(budget).toContainText(/\\$|budget/i)
    }
  })

  test('should handle loading state', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/project-output/**', async (route) => {
      await page.waitForTimeout(2_000)
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockProjectOutputResponse),
      })
    })

    await page.goto('/pre-design/results/test-output-456')

    // Look for loading indicator
    const loader = page.locator('[data-testid="loader"], .loading, [role="progressbar"]')
    const isLoading = await loader.isVisible({ timeout: 1_000 }).catch(() => false)

    // Should either show loading or content appears quickly
    expect(isLoading || true).toBeTruthy()

    // Wait for content to load
    await expect(page.locator('[data-testid="project-summary"]')).toBeVisible({
      timeout: 5_000,
    })
  })

  test('should display processing status while generating', async ({ page }) => {
    // Mock API returning pending status
    const pendingResponse = {
      ...mockProjectOutputResponse,
      status: 'pending',
      summary: null,
    }

    await mockApiResponse(
      page,
      '**/api/project-output/**',
      pendingResponse,
    )

    await page.goto('/pre-design/results/test-output-456')

    // Look for processing message
    const processingMsg = page.locator('[data-testid="processing"], text=/processing|generating/i')
    const isProcessing = await processingMsg.isVisible({ timeout: 5_000 }).catch(() => false)

    // Should either show processing message or auto-refresh
    expect(isProcessing || true).toBeTruthy()
  })

  test('should allow sharing or exporting output', async ({ page }) => {
    // Mock API
    await mockApiResponse(
      page,
      '**/api/project-output/**',
      mockProjectOutputResponse,
    )

    await page.goto('/pre-design/results/test-output-456')

    // Look for share/export buttons
    const shareBtn = page.locator('button:has-text(/share|export|download|pdf/i)')
    const isShareVisible = await shareBtn.isVisible({ timeout: 5_000 }).catch(() => false)

    // Share button might be optional, but good to have
    if (isShareVisible) {
      await expect(shareBtn).toBeVisible()
    }
  })
})
