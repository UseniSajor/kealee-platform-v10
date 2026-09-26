/**
 * Who zones the land at the address the customer typed — decided once, at
 * intake, from geometry, and stored on the order.
 *
 * Everything downstream reads what is stored here. The Stripe webhook used to
 * regex the intake text for Prince George's town names, and the engine asked
 * Prince George's first when the text was silent; both were guesses, and both
 * are gone. The determination (`@kealee/pascal-agents/engine` →
 * `Jurisdiction.determineJurisdiction`) asks the U.S. Census geocoder which
 * state, county and incorporated government the address falls in, and maps
 * that to the body that zones the land — Prince George's County for a lot in
 * College Park, the City of Rockville for one in Rockville.
 *
 * NEVER BLOCKS AN ORDER, AND NEVER MAKES ONE WAIT. No jurisdiction is refused,
 * and no request waits on the geocoder:
 *
 *   1. INSTANT — the address check the customer's browser runs while they type
 *      (`/api/site-intelligence/resolve`) already makes the determination, and
 *      it is remembered here for an hour. At submit it is attached to the order
 *      with no network call (`instantJurisdiction`).
 *   2. BACKGROUND — otherwise the order is saved first and the determination
 *      runs after the response (`scheduleJurisdiction`), with a longer timeout
 *      and a retry, because nobody is waiting on it. web-main is one long-lived
 *      Node server (Railway standalone), so the work outlives the response.
 *   3. ENGINE — an order that still has none is determined when it is
 *      processed, and verified again at the located parcel either way. An
 *      address the geocoder cannot place is stored as undetermined with the
 *      reason, never defaulted.
 */

import { Jurisdiction } from '@kealee/pascal-agents/engine'

export type JurisdictionDetermination = Jurisdiction.JurisdictionDetermination

/** Determines the jurisdiction for an intake address. Never throws; bounded by `timeoutMs`. */
export async function determineIntakeJurisdiction(
  address: string, timeoutMs = 6000,
): Promise<JurisdictionDetermination | null> {
  if (!address || !address.trim()) return null
  try {
    const det = await Promise.race([
      Jurisdiction.determineJurisdiction(address, { timeoutMs }),
      new Promise<null>(resolve => setTimeout(() => resolve(null), timeoutMs + 500)),
    ])
    rememberDetermination(address, det)
    return det
  } catch (e) {
    console.warn('[jurisdiction] determination failed:', e instanceof Error ? e.message : e)
    return null
  }
}

// ── Instant: the determination made while the customer typed ──────────────

const CACHE_TTL_MS = 60 * 60 * 1000
const CACHE_MAX = 5000
const cache = new Map<string, { det: JurisdictionDetermination; at: number }>()

/** One key for the ways the same address is typed: case, spacing, punctuation. */
export function addressKey(address: string): string {
  return address.toUpperCase().replace(/[.,#]/g, ' ').replace(/\s+/g, ' ').trim()
}

/** Remembers a determination. Only a real one: a miss is retried, not cached. */
export function rememberDetermination(address: string, det: JurisdictionDetermination | null): void {
  if (!address || !det?.determined || !det.code) return
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }
  cache.set(addressKey(address), { det, at: Date.now() })
}

/** The determination already made for this address, if any. Synchronous: never waits. */
export function instantJurisdiction(address: string): JurisdictionDetermination | null {
  if (!address) return null
  const hit = cache.get(addressKey(address))
  if (!hit) return null
  if (Date.now() - hit.at > CACHE_TTL_MS) { cache.delete(addressKey(address)); return null }
  return hit.det
}

// ── Background: after the order is saved ──────────────────────────────────

/**
 * Determines the jurisdiction for a saved order WITHOUT holding the request.
 * Returns immediately. Writes the columns, then adds the determination to
 * `form_data` only if it is still absent there — nothing else in the row is
 * touched. Every failure is logged and left for the engine, which determines
 * it at processing time.
 */
export function scheduleJurisdiction(
  supabase: { from: (t: string) => any }, intakeId: string, address: string,
): void {
  if (!intakeId || !address?.trim()) return
  void (async () => {
    let det: JurisdictionDetermination | null = null
    for (let attempt = 0; attempt < 2 && !det?.determined; attempt++) {
      det = await determineIntakeJurisdiction(address, 10_000)
    }
    if (!det) return
    await persistJurisdictionColumns(supabase, intakeId, det)
    try {
      const { data } = await supabase.from('public_intake_leads').select('form_data').eq('id', intakeId).single()
      const fd = (data?.form_data as Record<string, unknown>) ?? {}
      if (hasDetermination(fd)) return
      await supabase.from('public_intake_leads')
        .update({ form_data: { ...fd, ...jurisdictionFormData(det) } })
        .eq('id', intakeId)
    } catch (e) {
      console.warn('[jurisdiction] background form_data write skipped:', e instanceof Error ? e.message : e)
    }
  })().catch(e => console.warn('[jurisdiction] background determination failed:', e instanceof Error ? e.message : e))
}

/**
 * The intake-time answer: the remembered determination, attached now, or a
 * background determination once the order has an id. Never awaits the network.
 */
export function attachJurisdiction(
  formData: Record<string, unknown>, address: string,
): { det: JurisdictionDetermination | null; afterSave: (supabase: { from: (t: string) => any }, intakeId: string) => void } {
  const det = instantJurisdiction(address)
  Object.assign(formData, jurisdictionFormData(det))
  return {
    det,
    afterSave: (supabase, intakeId) => {
      if (det) void persistJurisdictionColumns(supabase, intakeId, det)
      else scheduleJurisdiction(supabase, intakeId, address)
    },
  }
}

/** The determination as it is stored in `form_data`. */
export function jurisdictionFormData(det: JurisdictionDetermination | null): Record<string, unknown> {
  if (!det) return {}
  return {
    jurisdiction: det,
    // The flat code is what the rule report, the ops queue and the engine key on.
    ...(det.determined && det.code ? { jurisdictionCode: det.code } : {}),
  }
}

/** Already determined on this order — nothing to do. */
export function hasDetermination(formData: Record<string, unknown> | null | undefined): boolean {
  return Jurisdiction.determinationFrom(formData?.jurisdiction) !== null
}

/**
 * Writes the determination to the order's own columns. Best effort: the
 * columns arrive with migration 20260925_intake_jurisdiction.sql, and an
 * environment without them keeps the determination in `form_data`, which is
 * what every reader uses first.
 */
export async function persistJurisdictionColumns(
  supabase: { from: (t: string) => any },
  intakeId: string,
  det: JurisdictionDetermination | null,
): Promise<void> {
  if (!det || !intakeId) return
  try {
    const { error } = await supabase
      .from('public_intake_leads')
      .update({
        jurisdiction_code: det.determined ? det.code : null,
        jurisdiction: det,
      })
      .eq('id', intakeId)
    if (error) console.warn('[jurisdiction] column write skipped:', error.message)
  } catch (e) {
    console.warn('[jurisdiction] column write skipped:', e instanceof Error ? e.message : e)
  }
}
