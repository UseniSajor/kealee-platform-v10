// playwright.config.ts
// Playwright configuration for E2E tests

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './apps',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'm-ops-services',
      testMatch: '**/m-ops-services/**/__tests__/e2e/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'm-architect',
      testMatch: '**/m-architect/**/__tests__/e2e/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'm-permits-inspections',
      testMatch: '**/m-permits-inspections/**/__tests__/e2e/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
