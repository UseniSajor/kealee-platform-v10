#!/usr/bin/env node
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(path.join(repoRoot, 'packages/database/package.json'))
const { Client } = require('pg')

function directUrl(url) {
  return String(url).replace(':6543/', ':5432/').replace(/\?.*$/, '')
}

function productionDatabaseUrl() {
  if (process.env.SUPABASE_DB_URL) return directUrl(process.env.SUPABASE_DB_URL)
  const raw = execFileSync('railway', ['variables', '--service', 'web-main', '--json'], {
    cwd: repoRoot,
    encoding: 'utf8',
  })
  const variables = JSON.parse(raw)
  const url = variables.SUPABASE_DB_URL || variables.DIRECT_URL || variables.DATABASE_URL
  if (!url || !String(url).includes('supabase')) {
    throw new Error('Web Main does not expose a Supabase Postgres URL')
  }
  return directUrl(url)
}

const client = new Client({
  connectionString: productionDatabaseUrl(),
  ssl: { rejectUnauthorized: false },
})

try {
  await client.connect()
  const indexResult = await client.query(`
    SELECT i.indisvalid AS valid, i.indisready AS ready,
           pg_get_indexdef(i.indexrelid) AS definition
    FROM pg_index i
    JOIN pg_class c ON c.oid = i.indexrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'ux_public_intake_leads_stripe_session_id'
  `)
  const duplicateResult = await client.query(`
    SELECT stripe_session_id, count(*)::int AS count
    FROM public.public_intake_leads
    WHERE stripe_session_id IS NOT NULL
    GROUP BY stripe_session_id
    HAVING count(*) > 1
    LIMIT 1
  `)

  const index = indexResult.rows[0]
  if (!index) throw new Error('paid-order unique index is missing')
  if (!index.valid || !index.ready) throw new Error('paid-order unique index is not valid and ready')
  if (duplicateResult.rowCount) throw new Error('duplicate Stripe Checkout Session IDs exist')

  console.log('[paid-order-ledger] index exists, valid=true, ready=true')
  console.log('[paid-order-ledger] duplicate Stripe session IDs=0')
} finally {
  await client.end().catch(() => undefined)
}
