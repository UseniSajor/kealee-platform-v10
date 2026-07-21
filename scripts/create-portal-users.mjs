#!/usr/bin/env node
/**
 * scripts/create-portal-users.mjs
 *
 * Creates 4 Supabase Auth users + matching DB rows (via pg) for:
 *   admin, owner, contractor, developer
 *
 * Usage:
 *   node scripts/create-portal-users.mjs
 *
 * Requires:
 *   SUPABASE_URL        (or falls back to hardcoded project URL)
 *   SUPABASE_SERVICE_ROLE_KEY
 *   DATABASE_URL        (Railway Postgres)
 */

import { Client } from 'pg'

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rkreqfpkxavqpsqexbfs.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrcmVxZnBreGF2cXBzcWV4YmZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQwNzc3MCwiZXhwIjoyMDgzOTgzNzcwfQ.Q5KvqmDYy4yvLqDTTZxccFOpRcz3RivkS61XwD3w5GU'
const DATABASE_URL = process.env.DATABASE_URL ||
  'postgresql://postgres:OAhPZZZvFbMiKcUkPWbCTKIPGsOuaOVd@ballast.proxy.rlwy.net:46074/railway'

const USERS = [
  {
    email: 'admin@kealee.com',
    password: 'KeaAdmin2026!',
    name: 'System Administrator',
    role: 'admin',
    portal: 'os-admin / command-center',
  },
  {
    email: 'owner@kealee.com',
    password: 'KeaOwner2026!',
    name: 'Demo Owner',
    role: 'homeowner',
    portal: 'portal-owner',
  },
  {
    email: 'contractor@kealee.com',
    password: 'KeaContractor2026!',
    name: 'Demo Contractor',
    role: 'contractor',
    portal: 'portal-contractor',
  },
  {
    email: 'developer@kealee.com',
    password: 'KeaDeveloper2026!',
    name: 'Demo Developer',
    role: 'developer',
    portal: 'portal-developer',
  },
]

// ── Supabase Admin API ────────────────────────────────────────────────────────

async function createSupabaseUser(email, password, name) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    }),
  })

  const body = await res.json()

  if (!res.ok) {
    // 422 = user already exists → look it up
    if (res.status === 422 && body.msg?.includes('already')) {
      return await getSupabaseUser(email)
    }
    throw new Error(`Supabase error ${res.status}: ${JSON.stringify(body)}`)
  }

  return body
}

async function getSupabaseUser(email) {
  // List users and find by email (Supabase Admin API)
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=1000`, {
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
  })
  const body = await res.json()
  const users = body.users || body
  return users.find((u) => u.email === email) ?? null
}

// ── DB upsert ─────────────────────────────────────────────────────────────────

async function upsertDbUser(pg, supabaseId, email, name) {
  const { rows } = await pg.query(
    `INSERT INTO users (id, email, name, status, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, 'ACTIVE', NOW(), NOW())
     ON CONFLICT (email) DO UPDATE SET
       name = EXCLUDED.name,
       status = 'ACTIVE',
       "updatedAt" = NOW()
     RETURNING id`,
    [supabaseId, email, name]
  )
  return rows[0].id
}

// ── Main ──────────────────────────────────────────────────────────────────────

const pg = new Client({ connectionString: DATABASE_URL })
await pg.connect()

console.log('\n🔐 Kealee Portal User Setup\n' + '─'.repeat(50))

const created = []

for (const user of USERS) {
  process.stdout.write(`  ${user.email} (${user.role}) ... `)

  try {
    const sbUser = await createSupabaseUser(user.email, user.password, user.name)
    const supabaseId = sbUser?.id

    if (!supabaseId) {
      console.log('⚠️  Could not get Supabase user ID — skipping DB upsert')
      continue
    }

    await upsertDbUser(pg, supabaseId, user.email, user.name)
    console.log('✅')
    created.push(user)
  } catch (err) {
    console.log(`❌  ${err.message}`)
  }
}

await pg.end()

// ── Summary ───────────────────────────────────────────────────────────────────

console.log('\n' + '─'.repeat(50))
console.log('📋  Login Credentials\n')

const PORTALS = {
  'os-admin / command-center': 'OS Admin + Command Center',
  'portal-owner':              'Portal Owner',
  'portal-contractor':         'Portal Contractor',
  'portal-developer':          'Portal Developer',
}

for (const u of created) {
  console.log(`  Portal:   ${u.portal}`)
  console.log(`  Email:    ${u.email}`)
  console.log(`  Password: ${u.password}`)
  console.log()
}

console.log('⚠️  Change passwords after first login.')
console.log('✅  Done.\n')
