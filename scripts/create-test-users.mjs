/**
 * scripts/create-test-users.mjs
 *
 * Creates Supabase Auth users + DB role records for testing all portals.
 * Uses the anon key — no service role key required.
 *
 * BEFORE RUNNING:
 *   1. Disable email confirmation in Supabase (one-time):
 *      https://supabase.com/dashboard/project/rkreqfpkxavqpsqexbfs/auth/providers
 *      → Email provider → uncheck "Confirm email"
 *
 *   2. Run:
 *      node scripts/create-test-users.mjs
 *
 *   3. Re-enable email confirmation if desired.
 */

import { createClient } from '@supabase/supabase-js'
import pg from 'pg'

const SUPABASE_URL  = 'https://rkreqfpkxavqpsqexbfs.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrcmVxZnBreGF2cXBzcWV4YmZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MDc3NzAsImV4cCI6MjA4Mzk4Mzc3MH0.Zszenm7LrN7eRKi3-htbsQX8h4ulNvdCT_F1s-v0YJk'
const DB_URL        = 'postgresql://postgres:OAhPZZZvFbMiKcUkPWbCTKIPGsOuaOVd@ballast.proxy.rlwy.net:46074/railway'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

const TEST_USERS = [
  { email: 'admin@kealee.com',      password: 'Kealee2026!Admin', role: 'admin',      fullName: 'Admin User',       portal: 'Admin Console   → localhost:3025' },
  { email: 'pm@kealee.com',         password: 'Kealee2026!PM',    role: 'pm',          fullName: 'Operations PM',    portal: 'Command Center  → localhost:3023' },
  { email: 'owner@kealee.com',      password: 'Kealee2026!Owner', role: 'homeowner',   fullName: 'Test Homeowner',   portal: 'Owner Portal    → localhost:3020' },
  { email: 'contractor@kealee.com', password: 'Kealee2026!GC',    role: 'contractor',  fullName: 'Test Contractor',  portal: 'Contractor Portal → localhost:3021' },
  { email: 'developer@kealee.com',  password: 'Kealee2026!Dev',   role: 'developer',   fullName: 'Test Developer',   portal: 'Developer Portal  → localhost:3022' },
]

async function run() {
  const client = new pg.Client({ connectionString: DB_URL })

  console.log('Connecting to Railway DB...')
  await client.connect()
  console.log('✅  DB connected\n')

  for (const user of TEST_USERS) {
    process.stdout.write(`${user.email} ... `)

    // Sign up via anon key (works when email confirmation is disabled)
    const { data, error } = await supabase.auth.signUp({
      email:    user.email,
      password: user.password,
      options:  { data: { full_name: user.fullName, role: user.role } },
    })

    if (error) {
      // If "User already registered" — try to sign in to get the ID
      if (error.message.includes('already registered') || error.message.includes('already been registered')) {
        const { data: signInData } = await supabase.auth.signInWithPassword({
          email: user.email, password: user.password,
        })
        if (signInData?.user) {
          await upsertDbUser(client, signInData.user.id, user)
          console.log('✅  (already existed)')
          continue
        }
      }
      console.log(`❌  ${error.message}`)
      continue
    }

    if (!data.user) {
      console.log('⚠️   No user returned — email confirmation may still be enabled.')
      console.log('     Go to: https://supabase.com/dashboard/project/rkreqfpkxavqpsqexbfs/auth/providers')
      console.log('     Disable "Confirm email", then re-run this script.\n')
      continue
    }

    await upsertDbUser(client, data.user.id, user)
    console.log('✅')
  }

  await client.end()

  console.log('\n─────────────────────────────────────────────────────────')
  console.log('TEST CREDENTIALS')
  console.log('─────────────────────────────────────────────────────────')
  for (const u of TEST_USERS) {
    console.log(`\n  ${u.portal}`)
    console.log(`    email:    ${u.email}`)
    console.log(`    password: ${u.password}`)
  }
  console.log('\n─────────────────────────────────────────────────────────')
  console.log('Start portals: pnpm dev:portals')
  console.log('─────────────────────────────────────────────────────────\n')
}

async function upsertDbUser(client, id, user) {
  // Try camelCase schema (v20)
  try {
    await client.query(
      `INSERT INTO "User" (id, email, "fullName", role, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       ON CONFLICT (email) DO UPDATE SET id = $1, role = $4, "updatedAt" = NOW()`,
      [id, user.email, user.fullName, user.role]
    )
  } catch {
    // Fallback: snake_case schema
    await client.query(
      `INSERT INTO users (id, email, full_name, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       ON CONFLICT (email) DO UPDATE SET id = $1, role = $4, updated_at = NOW()`,
      [id, user.email, user.fullName, user.role]
    ).catch(e => console.warn(`\n  ⚠️  DB upsert skipped (${e.message})`))
  }
}

run().catch(e => { console.error(e); process.exit(1) })
