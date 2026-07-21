/**
 * Vitest Configuration
 * Test configuration for API service
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/__tests__/**/*.test.ts', 'src/tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'disabled-features'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules',
        'dist',
        'disabled-features',
        '**/__tests__/**',
        '**/*.test.ts',
        '**/*.config.ts',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@kealee/database':       path.resolve(__dirname, '../../packages/database/src'),
      '@kealee/workflow-engine': path.resolve(__dirname, '../../packages/workflow-engine/src'),
      '@kealee/page-builder':   path.resolve(__dirname, '../../packages/page-builder/src'),
      // Phase 0 packages: created as workspace packages but pnpm install not yet run,
      // so the symlinks don't exist in node_modules. Point vitest at dist/ directly.
      '@kealee/agent-prompts':  path.resolve(__dirname, '../../packages/agent-prompts/dist/index.js'),
      '@kealee/agent-utils':    path.resolve(__dirname, '../../packages/agent-utils/dist/index.js'),
    },
  },
});
