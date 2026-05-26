/**
 * Load env for os-admin local build and dev.
 * Order: apps/os-admin/.env.local → .env → repo web-main env (shared Supabase project).
 */
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const appRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = join(appRoot, '../..')

const FILES = [
  join(appRoot, '.env.local'),
  join(appRoot, '.env'),
  join(repoRoot, 'apps/web-main/.env.local'),
  join(repoRoot, 'apps/web-main/.env.vercel.production'),
  join(repoRoot, 'apps/web-main/.env.production'),
  join(repoRoot, 'apps/web-main/.env'),
]

function loadFile(filePath) {
  if (!existsSync(filePath)) return
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 1) continue
    const key = trimmed.slice(0, eq).trim()
    // Never inherit NODE_ENV from Vercel pull — breaks Next production build on Windows.
    if (key === 'NODE_ENV') continue
    let val = trimmed.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
}

for (const file of FILES) loadFile(file)

function stripNodeEnvFromEnvLocal() {
  const p = join(appRoot, '.env.local')
  if (!existsSync(p)) return
  const raw = readFileSync(p, 'utf8')
  const lines = raw.split(/\r?\n/)
  const filtered = lines.filter((line) => !/^NODE_ENV\s*=/.test(line.trim()))
  if (filtered.length !== lines.length) {
    writeFileSync(p, filtered.join('\n').replace(/\n?$/, '\n'), 'utf8')
    console.log('[os-admin load-env] Stripped NODE_ENV from .env.local for production build')
  }
}

if (process.env.npm_lifecycle_event === 'build') {
  stripNodeEnvFromEnvLocal()
  process.env.NODE_ENV = 'production'
}

const required = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']
const missing = required.filter((k) => !process.env[k]?.trim())

if (missing.length) {
  console.warn(
    `[os-admin load-env] Missing: ${missing.join(', ')}. Run: cd apps/os-admin && vercel env pull .env.local`,
  )
  process.exitCode = 1
} else {
  console.log('[os-admin load-env] Supabase + API env loaded')
}
