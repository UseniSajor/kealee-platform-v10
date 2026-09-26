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
 * NEVER BLOCKS AN ORDER. No jurisdiction is refused, and an address the
 * geocoder cannot place is stored as undetermined with the reason; the engine
 * determines it again when the order is processed. A customer is never turned
 * away, or held on a spinner, because a federal geocoder was slow.
 */

import { Jurisdiction } from '@kealee/pascal-agents/engine'

export type JurisdictionDetermination = Jurisdiction.JurisdictionDetermination

/** Determines the jurisdiction for an intake address. Never throws; bounded by `timeoutMs`. */
export async function determineIntakeJurisdiction(
  address: string, timeoutMs = 6000,
): Promise<JurisdictionDetermination | null> {
  if (!address || !address.trim()) return null
  try {
    return await Promise.race([
      Jurisdiction.determineJurisdiction(address, { timeoutMs }),
      new Promise<null>(resolve => setTimeout(() => resolve(null), timeoutMs + 500)),
    ])
  } catch (e) {
    console.warn('[jurisdiction] determination failed:', e instanceof Error ? e.message : e)
    return null
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
