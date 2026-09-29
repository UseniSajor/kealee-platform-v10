import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
      '@kealee/core-rules': path.resolve(__dirname, '../../packages/core-rules/src/index.ts'),
      '@kealee/kealee-agent-stack': path.resolve(__dirname, '../../packages/kealee-agent-stack/src/index.ts'),
      '@kealee/concept-engine': path.resolve(__dirname, '../../packages/concept-engine/src/index.ts'),
      // Keep the exported subpath ahead of the package-root alias. Vite treats
      // string aliases as prefixes, so the root entry otherwise rewrites this
      // to the impossible path `src/index.ts/v30-pricing-config` and no test
      // importing the agent stack can even collect.
      '@kealee/database/v30-pricing-config': path.resolve(
        __dirname,
        '../../packages/database/src/v30-pricing-config.ts',
      ),
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
