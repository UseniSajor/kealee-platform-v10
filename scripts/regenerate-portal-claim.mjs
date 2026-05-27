#!/usr/bin/env node
/**
 * Regenerate a one-click portal claim URL for an intake.
 * Usage: node scripts/regenerate-portal-claim.mjs <intakeId> [email]
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

function loadEnvFile(filePath, override = false) {
  if (!fs.existsSync(filePath)) return
  for (const raw of fs.readFileSync(filePath, 'utf-8').split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq < 0) continue
    const key = line.slice(0, eq).trim()
    let val = line.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1)
    val = val.replace(/\r/g, '')
    if (override || !process.env[key]) process.env[key] = val
  }
}

const ROOT = process.cwd()
loadEnvFile(path.join(ROOT, 'apps', 'web-main', '.env.test-pull'), true)

function resolveSupabaseUrl() {
  const candidates = [process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_URL].filter(Boolean)
  for (const raw of candidates) {
    const url = raw.replace(/\/$/, '')
    if (!url.includes('placeholder.supabase.co')) return url
  }
  return (candidates[0] ?? '').replace(/\/$/, '')
}

const supabaseUrl = resolveSupabaseUrl()
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const portalUrl = (
  process.env.NEXT_PUBLIC_OWNER_PORTAL_URL ??
  process.env.OWNER_PORTAL_URL ??
  'https://owner.kealee.com'
).replace(/\/$/, '')

const intakeId = process.argv[2]
if (!intakeId) {
  console.error('Usage: node scripts/regenerate-portal-claim.mjs <intakeId> [email]')
  process.exit(1)
}
if (!supabaseUrl || !serviceKey) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data: intake, error } = await supabase
  .from('public_intake_leads')
  .select('id, contact_email, metadata, form_data, status')
  .eq('id', intakeId)
  .maybeSingle()

if (error || !intake) {
  console.error('Intake not found:', error?.message ?? intakeId, '| db:', supabaseUrl)
  process.exit(1)
}

const email = (process.argv[3] ?? intake.contact_email ?? '').trim().toLowerCase()
if (!email) {
  console.error('No email — pass as second argument')
  process.exit(1)
}

const token = randomUUID()
const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
const nextPath = `/deliverables/${intakeId}`
const metadata = (intake.metadata ?? {}) 
const formData = (intake.form_data ?? {})
const portalFields = {
  portalToken: token,
  portalTokenExpiresAt: expiresAt,
  portalNextPath: nextPath,
  portalEmail: email,
  portalTokenIssuedAt: new Date().toISOString(),
}

const { error: updateError } = await supabase
  .from('public_intake_leads')
  .update({
    contact_email: email,
    metadata: { ...metadata, ...portalFields },
    form_data: { ...formData, ...portalFields },
    updated_at: new Date().toISOString(),
  })
  .eq('id', intakeId)

if (updateError) {
  console.error('Update failed:', updateError.message)
  process.exit(1)
}

const claimUrl = `${portalUrl}/auth/claim?t=${token}&i=${encodeURIComponent(intakeId)}`
console.log('Intake:', intakeId, '| status:', intake.status)
console.log('Email:', email)
console.log('Claim URL:', claimUrl)
console.log('Deliverables:', `${portalUrl}${nextPath}`)
