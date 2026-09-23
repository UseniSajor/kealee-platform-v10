import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // County GIS calls are live in a few suites; give them room without
    // letting a hung socket stall the whole run.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
})
