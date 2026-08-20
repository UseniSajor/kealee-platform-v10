/**
 * Drift test for the Prince George's County 2022 zone registry.
 *
 * The registry is a transcription of a live county layer. If the county adopts a
 * zoning map amendment that introduces or retires a base zone, this fails loudly
 * instead of letting the platform validate projects against a stale list.
 *
 * Network-dependent by design — that is the point. Skipped when SKIP_NETWORK_TESTS
 * is set so it cannot break an offline CI run.
 */

import {
  PG_ALL_ZONE_CLASSES_2022,
  PG_ZONE_NOT_ASSIGNED,
  PG_LAYERS,
  PG_GIS_ROOT,
  isCurrentPgZoneClass,
  isPgZoneNotAssigned,
  pgZone,
  pgZoneCategory,
} from '../jurisdictions/prince-georges-md'

const describeNetwork = process.env.SKIP_NETWORK_TESTS ? describe.skip : describe

describe('PG County 2022 zone registry (offline)', () => {
  it('accepts current 2022 zone classes', () => {
    for (const zone of ['RSF-65', 'RMF-20', 'CGO', 'NAC', 'LMUTC', 'AG', 'IE']) {
      expect(isCurrentPgZoneClass(zone)).toBe(true)
    }
  })

  it('includes Planned Development zones that are not yet mapped anywhere', () => {
    // These exist in the ordinance but appear on no parcel today, so enumerating
    // the code list from observed data omitted them. Regression guard.
    for (const zone of ['TAC-PD', 'LTO-PD', 'MU-PD', 'IE-PD']) {
      expect(isCurrentPgZoneClass(zone)).toBe(true)
      expect(pgZoneCategory(zone)).toBe('planned_development')
    }
  })

  it('treats "Not Assigned" and blanks as unknown, never as unzoned', () => {
    expect(isPgZoneNotAssigned(PG_ZONE_NOT_ASSIGNED)).toBe(true)
    expect(isPgZoneNotAssigned(null)).toBe(true)
    expect(isPgZoneNotAssigned('')).toBe(true)
    expect(isCurrentPgZoneClass(PG_ZONE_NOT_ASSIGNED)).toBe(false)
    expect(isPgZoneNotAssigned('RSF-65')).toBe(false)
  })

  it('carries the county long name for every zone', () => {
    for (const code of PG_ALL_ZONE_CLASSES_2022) {
      expect(pgZone(code)?.name?.length ?? 0).toBeGreaterThan(3)
    }
  })

  it('rejects superseded pre-2022 zone classes', () => {
    // These are the codes the legacy "Plan 2035 Zoning" layer still serves.
    // Accepting one would mean validating against a repealed ordinance.
    for (const zone of ['R-55', 'C-M', 'U-L-I', 'M-U-I', 'R-10', 'O-S']) {
      expect(isCurrentPgZoneClass(zone)).toBe(false)
      expect(pgZoneCategory(zone)).toBeNull()
    }
  })

  it('assigns every registered class to exactly one category', () => {
    for (const zone of PG_ALL_ZONE_CLASSES_2022) {
      expect(pgZoneCategory(zone)).not.toBeNull()
    }
    expect(new Set(PG_ALL_ZONE_CLASSES_2022).size).toBe(PG_ALL_ZONE_CLASSES_2022.length)
  })
})

describeNetwork('PG County 2022 zone registry (live drift check)', () => {
  jest.setTimeout(60_000)

  /**
   * Compares against the layer's SUBTYPE CODED-VALUE DOMAINS — the authoritative
   * legal list — not against `returnDistinctValues`, which only reports zones that
   * are currently mapped and therefore silently omits adopted-but-unapplied zones.
   * That distinction is the whole point of this test.
   */
  it('matches the coded-value domains published by the live M-NCPPC layer', async () => {
    const layer = PG_LAYERS.zoningCurrent
    const res = await fetch(
      `${PG_GIS_ROOT}/${layer.service}/MapServer/${layer.layerId}?f=json`,
    )
    expect(res.ok).toBe(true)

    const meta = (await res.json()) as {
      fields?: { name: string; domain?: { codedValues?: { code: string }[] } }[]
      subtypes?: { domains?: Record<string, { codedValues?: { code: string }[] }> }[]
    }

    const live = new Set<string>()
    for (const field of meta.fields ?? []) {
      if (field.name !== 'CLASS') continue
      for (const cv of field.domain?.codedValues ?? []) live.add(String(cv.code).trim())
    }
    for (const subtype of meta.subtypes ?? []) {
      for (const cv of subtype.domains?.CLASS?.codedValues ?? []) {
        live.add(String(cv.code).trim())
      }
    }
    // The sentinel is not a zone.
    live.delete(PG_ZONE_NOT_ASSIGNED)

    expect(live.size).toBeGreaterThan(0)

    const registered = new Set(PG_ALL_ZONE_CLASSES_2022)
    const missing = [...live].filter(c => !registered.has(c)).sort()
    const retired = [...registered].filter(c => !live.has(c)).sort()

    expect({ missing, retired }).toEqual({ missing: [], retired: [] })
  })
})
