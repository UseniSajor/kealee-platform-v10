import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
      '@kealee/core-rules': path.resolve(__dirname, '../../packages/core-rules/src/index.ts'),
      '@kealee/kealee-agent-stack': path.resolve(__dirname, '../../packages/kealee-agent-stack/src/index.ts'),
      '@kealee/concept-engine': path.resolve(__dirname, '../../packages/concept-engine/src/index.ts'),
      '@kealee/database': path.resolve(__dirname, '../../packages/database/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./__tests__/vitest.setup.ts'],
    testTimeout: 30_000,
  },
})
