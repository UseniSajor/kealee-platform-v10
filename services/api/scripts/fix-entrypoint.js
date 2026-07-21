/**
 * fix-entrypoint.js
 *
 * Post-build script: creates dist/index.js → dist/api/src/index.js shim.
 *
 * When tsc compiles services/api without a `rootDir` constraint (allowing
 * cross-service imports from ../ai-orchestrator/src), the effective rootDir
 * becomes `services/` — so the compiled entry point lands at:
 *
 *   dist/api/src/index.js  (relative to services/api/)
 *
 * Railway's startCommand and the Dockerfile check both expect:
 *
 *   dist/index.js
 *
 * This script creates a one-line shim that forwards to the real entry point.
 * All relative require() paths inside dist/api/src/index.js remain correct
 * because Node resolves them relative to that file's location, not the shim's.
 */

const fs   = require('fs')
const path = require('path')

const shimPath   = path.join(__dirname, '..', 'dist', 'index.js')
const realPath   = path.join(__dirname, '..', 'dist', 'api', 'src', 'index.js')
const shimContent = "'use strict';\nrequire('./api/src/index.js');\n"

if (fs.existsSync(shimPath)) {
  console.log('[entrypoint] dist/index.js already exists — skipping shim creation')
  process.exit(0)
}

if (!fs.existsSync(realPath)) {
  console.log('[entrypoint] dist/api/src/index.js not found — no shim needed (rootDir output)')
  process.exit(0)
}

fs.mkdirSync(path.dirname(shimPath), { recursive: true })
fs.writeFileSync(shimPath, shimContent)
console.log('[entrypoint] Created dist/index.js → dist/api/src/index.js shim')
