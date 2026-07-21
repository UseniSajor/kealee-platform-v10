#!/usr/bin/env node
/**
 * Ensures @kealee/seeds and @kealee/core-llm dist/ exist before API/KeaCore dev.
 * Skips when outputs are already present (fast re-starts).
 */
import { existsSync } from 'fs';
import { spawnSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED = [
  { filter: '@kealee/seeds', dist: 'packages/seeds/dist/index.js' },
  { filter: '@kealee/core-llm', dist: 'packages/core-llm/dist/index.js' },
];

function runBuild(filter) {
  console.log(`[deps] Building ${filter}...`);
  const result = spawnSync('pnpm', ['--filter', filter, 'build'], {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

for (const pkg of REQUIRED) {
  const distPath = join(root, pkg.dist);
  if (!existsSync(distPath)) {
    runBuild(pkg.filter);
  }
}
