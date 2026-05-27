/**
 * Server-side intake ↔ user linking for web-main auth routes.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

function mergeLinkedUserId(
  existing: Record<string, unknown> | null | undefined,
  userId: string,
): Record<string, unknown> {
  return { ...(existing ?? {}), linkedUserId: userId, linkedUserAt: new Date().toISOString() }
}

async function linkIntakesToUser(
  admin: SupabaseClient,
  userId: string,
  email: string,
): Promise<void> {
  const normalized = email.trim().toLowerCase()
  const { data: rows } = await admin
    .from('public_intake_leads')
    .select('id, metadata, form_data')
    .ilike('contact_email', normalized)

  for (const row of rows ?? []) {
    const meta = (row.metadata as Record<string, unknown> | null) ?? {}
    if (meta.linkedUserId === userId) continue
    const form = (row.form_data as Record<string, unknown> | null) ?? {}
    await admin
      .from('public_intake_leads')
      .update({
        metadata: mergeLinkedUserId(meta, userId),
        form_data: mergeLinkedUserId(form, userId),
      })
      .eq('id', row.id)
  }
}

export function getSupabaseAdminForLinking() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function linkUserToIntakesAfterAuth(
  userId: string,
  email: string,
  intakeId?: string,
): Promise<void> {
  const admin = getSupabaseAdminForLinking()
  if (!admin) return

  if (intakeId) {
    const { data: row } = await admin
      .from('public_intake_leads')
      .select('metadata, form_data')
      .eq('id', intakeId)
      .single()
    if (row) {
      const meta = (row.metadata as Record<string, unknown> | null) ?? {}
      const form = (row.form_data as Record<string, unknown> | null) ?? {}
      await admin.from('public_intake_leads').update({
        contact_email: email.trim().toLowerCase(),
        metadata: mergeLinkedUserId(meta, userId),
        form_data: mergeLinkedUserId(form, userId),
      }).eq('id', intakeId)
    }
  }

  await linkIntakesToUser(admin, userId, email)

  await admin
    .from('public_intake_leads')
    .update({ user_id: userId })
    .eq('metadata->>linkedUserId', userId)
    .then(({ error }) => {
      if (error && !/column|user_id/i.test(error.message)) {
        console.warn('[link-user-intakes]', error.message)
      }
    })
}
