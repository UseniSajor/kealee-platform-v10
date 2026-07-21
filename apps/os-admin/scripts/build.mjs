/**
 * Production build with env loaded and NODE_ENV=production (Windows-safe).
 */
import { spawnSync } from 'child_process'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const appRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

function run(cmd, args) {
  const res = spawnSync(cmd, args, {
    cwd: appRoot,
    stdio: 'inherit',
    shell: true,
    env: process.env,
  })
  if (res.status !== 0) process.exit(res.status ?? 1)
}

run('node', ['./scripts/load-env.mjs'])
run('node', ['./pre-build.js'])

const res = spawnSync('npx', ['next', 'build'], {
  cwd: appRoot,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NODE_ENV: 'production' },
})

process.exit(res.status ?? 1)
