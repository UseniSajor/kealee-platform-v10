#!/usr/bin/env node
/**
 * Provision Supabase users for Marketing Workspace (Zem) and Kealee admin viewer.
 *
 * Requires:
 *   NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Optional (set before run — never commit real passwords):
 *   ZEM_AGENCY_EMAIL          default: zem-marketing@access.kealee.com
 *   ZEM_AGENCY_PASSWORD       required for create/reset
 *   KEALEE_MARKETING_ADMIN_EMAIL  default: marketing-admin@kealee.com
 *   KEALEE_MARKETING_ADMIN_PASSWORD
 *
 * Usage:
 *   ZEM_AGENCY_PASSWORD='...' KEALEE_MARKETING_ADMIN_PASSWORD='...' \
 *     node scripts/provision-marketing-agency-users.mjs
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('[provision] Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const ACCOUNTS = [
  {
    label: 'Zem Marketing Agency',
    email: process.env.ZEM_AGENCY_EMAIL || 'zem-marketing@access.kealee.com',
    password: process.env.ZEM_AGENCY_PASSWORD,
    appRole: 'marketing_agency',
    redirect: '/marketing/workspace',
  },
  {
    label: 'Kealee Marketing Admin (viewer + approvals)',
    email: process.env.KEALEE_MARKETING_ADMIN_EMAIL || 'marketing-admin@kealee.com',
    password: process.env.KEALEE_MARKETING_ADMIN_PASSWORD,
    appRole: 'marketing_admin',
    redirect: '/admin/marketing/approvals',
  },
]

async function findUserByEmail(email) {
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (error) throw error
  return data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null
}

async function upsertAccount(account) {
  if (!account.password) {
    console.warn(`[provision] Skip ${account.email} — password env not set`)
    return { email: account.email, status: 'skipped', reason: 'no password' }
  }

  const existing = await findUserByEmail(account.email)

  if (existing) {
    const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
      password: account.password,
      email_confirm: true,
      app_metadata: { ...(existing.app_metadata ?? {}), role: account.appRole },
      user_metadata: {
        ...(existing.user_metadata ?? {}),
        display_name: account.label,
      },
    })
    if (error) throw error
    return { email: account.email, status: 'updated', id: data.user.id, role: account.appRole }
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: account.email,
    password: account.password,
    email_confirm: true,
    app_metadata: { role: account.appRole },
    user_metadata: { display_name: account.label },
  })
  if (error) throw error
  return { email: account.email, status: 'created', id: data.user.id, role: account.appRole }
}

async function seedWelcomeTask(zemUserId) {
  if (!zemUserId) return
  const { error } = await admin.from('marketing_agency_tasks').insert({
    title: 'Review brand guide and submit first concept visual',
    description: 'Open Concept Visuals tab, generate a Replicate render, and submit for Kealee approval.',
    assignee_id: zemUserId,
    campaign: 'onboarding',
    status: 'open',
    due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  })
  if (error && !/duplicate|unique/i.test(error.message)) {
    console.warn('[provision] task seed:', error.message)
  }
}

async function main() {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://kealee.com'
  const results = []

  for (const account of ACCOUNTS) {
    try {
      const r = await upsertAccount(account)
      const loginUrl =
        account.redirect === '/marketing/workspace'
          ? `${site}/marketing/login`
          : `${site}/auth/login?next=${encodeURIComponent(account.redirect)}`
      results.push({ ...r, redirect: account.redirect, loginUrl })
      console.log(`[provision] ${r.status} ${r.email} → role ${r.role ?? account.appRole}`)
    } catch (e) {
      console.error(`[provision] failed ${account.email}:`, e.message)
      results.push({ email: account.email, status: 'error', error: e.message })
    }
  }

  const zem = results.find((r) => r.email === (process.env.ZEM_AGENCY_EMAIL || 'zem-marketing@access.kealee.com'))
  if (zem?.id) await seedWelcomeTask(zem.id)

  console.log('\n=== Marketing access summary ===\n')
  for (const r of results) {
    if (r.loginUrl) {
      console.log(`${r.email}`)
      console.log(`  Role:     ${r.role}`)
      console.log(`  Login:    ${r.loginUrl}`)
      console.log(`  Workspace: ${site}${r.redirect?.replace('/admin/marketing/approvals', '/marketing/workspace') || '/marketing/workspace'}`)
      if (r.redirect?.includes('approvals')) {
        console.log(`  Approvals: ${site}/admin/marketing/approvals`)
      }
      console.log('')
    }
  }
  console.log('Store passwords securely — they are not written to disk by this script.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
