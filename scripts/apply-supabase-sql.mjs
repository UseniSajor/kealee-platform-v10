#!/usr/bin/env node
/**
 * Apply a Supabase SQL migration file via direct Postgres (port 5432).
 *
 * Usage:
 *   SUPABASE_DB_URL=postgresql://... node scripts/apply-supabase-sql.mjs packages/database/supabase/migrations/20260625_parcel_outreach.sql
 *
 * Or reads SUPABASE_DB_URL from Railway web-main variables when RAILWAY_TOKEN is set.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(path.join(path.dirname(fileURLToPath(import.meta.url)), '../packages/database/package.json'))
const pg = require('pg')

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')

async function resolveDbUrl() {
  if (process.env.SUPABASE_DB_URL) return toDirectUrl(process.env.SUPABASE_DB_URL)
  if (process.env.DIRECT_URL) return process.env.DIRECT_URL

  const pastePath = path.join(repoRoot, 'railway-env-paste-web-main.txt')
  if (fs.existsSync(pastePath)) {
    const text = fs.readFileSync(pastePath, 'utf8')
    const m = text.match(/DATABASE_URL=(postgresql:\/\/[^\s]+supabase[^\s]+)/i)
    if (m) return toDirectUrl(m[1])
  }

  const { execSync } = await import('node:child_process')
  try {
    const raw = execSync('railway variables --service web-main --json', {
      cwd: repoRoot,
      encoding: 'utf8',
    })
    const vars = JSON.parse(raw)
    if (vars.SUPABASE_DB_URL) return toDirectUrl(vars.SUPABASE_DB_URL)
    if (vars.DIRECT_URL) return vars.DIRECT_URL
    const url = vars.DATABASE_URL
    if (url && String(url).includes('supabase')) return toDirectUrl(url)
  } catch {
    /* railway cli optional */
  }
  throw new Error('Set SUPABASE_DB_URL or DIRECT_URL (Supabase postgres port 5432)')
}

function toDirectUrl(url) {
  return String(url)
    .replace(':6543/', ':5432/')
    .replace(/\?.*$/, '')
}

async function main() {
  const sqlFile =
    process.argv[2] ??
    'packages/database/supabase/migrations/20260625_parcel_outreach.sql'
  const fullPath = path.isAbsolute(sqlFile) ? sqlFile : path.join(repoRoot, sqlFile)
  const sql = fs.readFileSync(fullPath, 'utf8')
  const connectionString = await resolveDbUrl()

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  })
  await client.connect()
  console.log('[apply-supabase-sql] connected')
  await client.query(sql)
  console.log('[apply-supabase-sql] applied', path.basename(fullPath))
  await client.end()
}

main().catch((e) => {
  console.error('[apply-supabase-sql]', e.message)
  process.exit(1)
})
