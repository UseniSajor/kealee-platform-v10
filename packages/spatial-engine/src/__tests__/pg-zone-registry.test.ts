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
  PG_LAYERS,
  PG_GIS_ROOT,
  isCurrentPgZoneClass,
  pgZoneCategory,
} from '../jurisdictions/prince-georges-md'

const describeNetwork = process.env.SKIP_NETWORK_TESTS ? describe.skip : describe

describe('PG County 2022 zone registry (offline)', () => {
  it('accepts current 2022 zone classes', () => {
    for (const zone of ['RSF-65', 'RMF-20', 'CGO', 'NAC', 'LMUTC', 'AG', 'IE']) {
      expect(isCurrentPgZoneClass(zone)).toBe(true)
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

  it('matches the classes published by the live M-NCPPC layer', async () => {
    const layer = PG_LAYERS.zoningCurrent
    const params = new URLSearchParams({
      where: '1=1',
      outFields: 'CLASS',
      returnDistinctValues: 'true',
      returnGeometry: 'false',
      f: 'json',
    })
    const res = await fetch(
      `${PG_GIS_ROOT}/${layer.service}/MapServer/${layer.layerId}/query?${params}`,
    )
    expect(res.ok).toBe(true)

    const payload = (await res.json()) as {
      features?: { attributes?: { CLASS?: string | null } }[]
    }
    const live = new Set(
      (payload.features ?? [])
        .map(f => f.attributes?.CLASS)
        .filter((c): c is string => typeof c === 'string' && c.trim() !== '')
        .map(c => c.trim()),
    )

    const registered = new Set(PG_ALL_ZONE_CLASSES_2022)
    const missing = [...live].filter(c => !registered.has(c))
    const retired = [...registered].filter(c => !live.has(c))

    expect({ missing, retired }).toEqual({ missing: [], retired: [] })
  })
})
