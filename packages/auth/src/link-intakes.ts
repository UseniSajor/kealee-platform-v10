/**
 * Link public_intake_leads rows to Supabase auth users (Phase 1 universal auth).
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export interface LinkIntakeResult {
  linked: number
  intakeIds: string[]
}

function mergeLinkedUserId(
  existing: Record<string, unknown> | null | undefined,
  userId: string,
): Record<string, unknown> {
  return { ...(existing ?? {}), linkedUserId: userId, linkedUserAt: new Date().toISOString() }
}

/**
 * Attach all intakes matching email to the authenticated user.
 * Writes linkedUserId to metadata + form_data (works before DB column migration).
 */
export async function linkIntakesToUser(
  admin: SupabaseClient,
  userId: string,
  email: string,
): Promise<LinkIntakeResult> {
  const normalized = email.trim().toLowerCase()
  if (!normalized || !userId) return { linked: 0, intakeIds: [] }

  const { data: rows, error } = await admin
    .from('public_intake_leads')
    .select('id, metadata, form_data, contact_email')
    .ilike('contact_email', normalized)

  if (error || !rows?.length) {
    if (error) console.warn('[link-intakes]', error.message)
    return { linked: 0, intakeIds: [] }
  }

  const intakeIds: string[] = []

  for (const row of rows) {
    const meta = (row.metadata as Record<string, unknown> | null) ?? {}
    if (meta.linkedUserId === userId) continue

    const form = (row.form_data as Record<string, unknown> | null) ?? {}
    const patch = {
      metadata: mergeLinkedUserId(meta, userId),
      form_data: mergeLinkedUserId(form, userId),
    }

    const { error: updErr } = await admin
      .from('public_intake_leads')
      .update(patch)
      .eq('id', row.id)

    if (!updErr) {
      intakeIds.push(row.id as string)
    } else {
      console.warn('[link-intakes] update failed', row.id, updErr.message)
    }
  }

  return { linked: intakeIds.length, intakeIds }
}

/** Link a single intake after claim / magic-link session. */
export async function linkIntakeToUser(
  admin: SupabaseClient,
  intakeId: string,
  userId: string,
  email: string,
): Promise<boolean> {
  const { data: row, error } = await admin
    .from('public_intake_leads')
    .select('id, metadata, form_data, contact_email')
    .eq('id', intakeId)
    .single()

  if (error || !row) return false

  const meta = (row.metadata as Record<string, unknown> | null) ?? {}
  const form = (row.form_data as Record<string, unknown> | null) ?? {}

  const { error: updErr } = await admin
    .from('public_intake_leads')
    .update({
      contact_email: email.trim().toLowerCase(),
      metadata: mergeLinkedUserId(meta, userId),
      form_data: mergeLinkedUserId(form, userId),
    })
    .eq('id', intakeId)

  if (updErr) {
    console.warn('[link-intake]', intakeId, updErr.message)
    return false
  }
  return true
}
