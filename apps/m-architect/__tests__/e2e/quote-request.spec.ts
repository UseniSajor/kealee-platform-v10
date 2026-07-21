// apps/m-architect/__tests__/e2e/quote-request.spec.ts
// E2E tests for quote request flow

import { test, expect } from '@playwright/test';

test.describe('Quote Request Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/quote');
  });

  test('submits quote request successfully', async ({ page }) => {
    // Fill contact information
    await page.fill('input[name="name"]', 'Jane Smith');
    await page.fill('input[name="email"]', 'jane@example.com');
    await page.fill('input[name="phone"]', '555-5678');

    // Select project type
    await page.click('button:has-text("Residential")');

    // Fill project scope
    await page.fill('textarea[name="scope"]', 'Need design for kitchen renovation');

    // Select budget
    await page.click('button:has-text("$10K-$20K")');

    // Select timeline
    await page.selectOption('select[name="timeline"]', 'soon');

    // Submit
    await page.click('button:has-text("Request Quote")');

    // Should redirect to success page
    await expect(page).toHaveURL(/.*quote\/success/);
    await expect(page.locator('h1')).toContainText('Quote Request Received');
  });

  test('validates required fields', async ({ page }) => {
    // Try to submit without filling required fields
    await page.click('button:has-text("Request Quote")');

    // Should show validation errors
    await expect(page.locator('text=required')).toBeVisible();
  });

  test('allows file upload', async ({ page }) => {
    // Fill required fields first
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.click('button:has-text("Residential")');
    await page.fill('textarea[name="scope"]', 'Test project');

    // Upload file
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-plan.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('test content'),
    });

    // Check file is selected
    await expect(page.locator('text=file(s) selected')).toBeVisible();
  });

  test('completes in under 60 seconds', async ({ page }) => {
    const startTime = Date.now();

    // Fill form quickly
    await page.fill('input[name="name"]', 'Quick Test');
    await page.fill('input[name="email"]', 'quick@test.com');
    await page.click('button:has-text("Commercial")');
    await page.fill('textarea[name="scope"]', 'Quick project');
    await page.click('button:has-text("Request Quote")');

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    expect(duration).toBeLessThan(60);
  });
});
