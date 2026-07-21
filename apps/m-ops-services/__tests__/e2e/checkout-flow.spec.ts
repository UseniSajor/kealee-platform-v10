// apps/m-ops-services/__tests__/e2e/checkout-flow.spec.ts
// E2E tests for checkout flow using Playwright

import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/pricing');
  });

  test('completes checkout flow for Package C', async ({ page }) => {
    // Select Package C
    await page.click('text=Package C');
    await expect(page).toHaveURL(/.*checkout\/c/);

    // Fill checkout form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[name="company"]', 'Test Company');

    // Submit
    await page.click('button:has-text("Start Free Trial")');

    // Should redirect to success page
    await expect(page).toHaveURL(/.*checkout\/success/);
    await expect(page.locator('h1')).toContainText('Welcome to Kealee Premium');
  });

  test('validates required fields', async ({ page }) => {
    await page.goto('http://localhost:3000/checkout/c');

    // Try to submit without filling form
    await page.click('button:has-text("Start Free Trial")');

    // Should show validation errors
    await expect(page.locator('text=required')).toBeVisible();
  });

  test('displays correct package information', async ({ page }) => {
    await page.goto('http://localhost:3000/checkout/c');

    // Check package name
    await expect(page.locator('text=Package C')).toBeVisible();

    // Check price
    await expect(page.locator('text=$8,500')).toBeVisible();

    // Check trial message
    await expect(page.locator('text=14-day free trial')).toBeVisible();
  });
});
