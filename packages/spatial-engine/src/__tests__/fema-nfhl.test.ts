/**
 * FEMA NFHL source family.
 *
 * Flood mapping fails differently from an ordinance. The dangerous outcomes
 * here are a truncated panel set that hashes stably while omitting panels, a
 * pending panel treated as in force, and an ArcGIS error arriving with HTTP 200
 * and being hashed as if it were data.
 */

import {
  femaCountyDfirmId, femaPanelQueryUrl, parseFirmPanels, splitPanelsByEffectivity,
  firmPanelSetIdentity, femaPanelSetRegion, buildFemaSourceBundles, buildPgFemaSources,
  FemaPanelSetError, FEMA_NFHL_LAYERS, FEMA_DETERMINATION_CAVEATS, PG_COUNTY_FIPS,
  type FirmPanel,
} from '../jurisdictions/fema-nfhl'
import { buildPgCertifiableRules } from '../rules/pg-certifiable'
import { refreshSource, type FetchResult } from '../rules/source-refresh'
import { hashSourceContent } from '../rules/change-detection'

const RULES = buildPgCertifiableRules({ retrievedAt: '2026-08-22T09:00:00Z' })
const FLOOD_RULE = RULES.find(r => r.ruleKey === 'flood.fema_zones')!

const day = (iso: string) => Date.parse(iso)

/** Shaped like a real NFHL layer-3 response. */
function panelResponse(
  panels: { pan: string; suffix: string; eff: string | null; type?: string }[],
  extra: Record<string, unknown> = {},
) {
  return JSON.stringify({
    ...extra,
    features: panels.map(p => ({
      attributes: {
        DFIRM_ID: '24033C', FIRM_PAN: p.pan, PANEL: p.pan.slice(5, 9), SUFFIX: p.suffix,
        PANEL_TYP: p.type ?? 'Countywide, Panel Printed',
        EFF_DATE: p.eff ? day(p.eff) : null, PRE_DATE: null,
      },
    })),
  })
}

const REAL = [
  { pan: '24033C0410E', suffix: 'E', eff: '2016-09-16' },
  { pan: '24033C0315E', suffix: 'E', eff: '2016-09-16', type: 'Countywide, Not Printed' },
  { pan: '24033C0305E', suffix: 'E', eff: '2016-09-16' },
]

const stub = (body: string | null, error?: string) => async (): Promise<FetchResult> => ({
  ok: body != null, status: body != null ? 200 : 503, body,
  error: error ?? null, fetchedAt: '2026-08-22T10:00:00Z',
  bytes: body ? Buffer.byteLength(body) : 0,
})

// ── Identity and endpoint ───────────────────────────────────────────────────

describe('the FEMA endpoint', () => {
  it('builds a countywide DFIRM id from county FIPS', () => {
    expect(femaCountyDfirmId('24033')).toBe('24033C')
    expect(PG_COUNTY_FIPS).toBe('24033')
  })

  it('refuses a FIPS that is not five digits', () => {
    expect(() => femaCountyDfirmId('2403')).toThrow(/five digits/i)
    expect(() => femaCountyDfirmId('MD')).toThrow(/five digits/i)
  })

  it('queries the FIRM panel layer without geometry and with a high record cap', () => {
    const url = femaPanelQueryUrl('24033C')
    expect(url).toContain(`/${FEMA_NFHL_LAYERS.firmPanels.id}/query`)
    expect(url).toContain('returnGeometry=false')
    expect(url).toContain('EFF_DATE')
    expect(url).toContain('resultRecordCount=4000')
    expect(decodeURIComponent(url)).toContain("DFIRM_ID='24033C'")
  })
})

// ── Parsing failures that arrive as HTTP 200 ────────────────────────────────

describe('failures the status line does not reveal', () => {
  it('refuses a truncated panel set rather than hashing part of it', () => {
    const raw = panelResponse(REAL, { exceededTransferLimit: true })
    expect(() => parseFirmPanels(raw)).toThrow(FemaPanelSetError)
    try { parseFirmPanels(raw) } catch (e) {
      expect((e as FemaPanelSetError).code).toBe('TRUNCATED')
      expect((e as Error).message).toMatch(/stable and wrong/i)
    }
  })

  it('detects an ArcGIS error carried in the body', () => {
    const raw = JSON.stringify({ error: { message: 'Invalid where clause' } })
    try { parseFirmPanels(raw); throw new Error('should have thrown') } catch (e) {
      expect((e as FemaPanelSetError).code).toBe('ARCGIS_ERROR')
      expect((e as Error).message).toMatch(/HTTP 200/)
    }
  })

  it('refuses a non-JSON body', () => {
    try { parseFirmPanels('<html>maintenance</html>'); throw new Error('should have thrown') } catch (e) {
      expect((e as FemaPanelSetError).code).toBe('NOT_JSON')
    }
  })

  it('parses a real-shaped response', () => {
    const panels = parseFirmPanels(panelResponse(REAL))
    expect(panels).toHaveLength(3)
    expect(panels[0].firmPanel).toBe('24033C0410E')
    expect(panels[0].suffix).toBe('E')
    expect(panels[0].effectiveDate).toBe('2016-09-16')
  })
})

// ── Effective dates ─────────────────────────────────────────────────────────

describe('a published panel is not necessarily an effective one', () => {
  const panels: FirmPanel[] = parseFirmPanels(panelResponse([
    { pan: '24033C0410E', suffix: 'E', eff: '2016-09-16' },
    { pan: '24033C0411F', suffix: 'F', eff: '2027-03-01' },   // published, future
    { pan: '24033C0412E', suffix: 'E', eff: null },           // no date recorded
  ]))

  it('holds a future effective date as pending, not in force', () => {
    const split = splitPanelsByEffectivity(panels, new Date('2026-08-22'))
    expect(split.effective.map(p => p.firmPanel)).toEqual(['24033C0410E'])
    expect(split.pending.map(p => p.firmPanel)).toEqual(['24033C0411F'])
    expect(split.undated.map(p => p.firmPanel)).toEqual(['24033C0412E'])
  })

  it('moves a pending panel into force on its effective date, not before', () => {
    const before = splitPanelsByEffectivity(panels, new Date('2027-02-28'))
    const after = splitPanelsByEffectivity(panels, new Date('2027-03-02'))
    expect(before.pending).toHaveLength(1)
    expect(after.pending).toHaveLength(0)
    expect(after.effective.map(p => p.firmPanel)).toContain('24033C0411F')
  })

  it('does not silently place an undated panel either way', () => {
    const split = splitPanelsByEffectivity(panels, new Date('2026-08-22'))
    expect(split.effective.map(p => p.firmPanel)).not.toContain('24033C0412E')
    expect(split.pending.map(p => p.firmPanel)).not.toContain('24033C0412E')
  })
})

// ── Panel-set identity ──────────────────────────────────────────────────────

describe('panel-set identity', () => {
  it('is stable against the order the service returns rows in', () => {
    const a = firmPanelSetIdentity(parseFirmPanels(panelResponse(REAL)))
    const b = firmPanelSetIdentity(parseFirmPanels(panelResponse([...REAL].reverse())))
    expect(a).toBe(b)
  })

  it('ignores a panel flipping between printed and not printed', () => {
    const a = firmPanelSetIdentity(parseFirmPanels(panelResponse(REAL)))
    const b = firmPanelSetIdentity(parseFirmPanels(panelResponse(
      REAL.map(p => ({ ...p, type: 'Countywide, Not Printed' })),
    )))
    // A publication detail, not a change in what the map says.
    expect(a).toBe(b)
  })

  it('moves when a panel is revised to a new suffix', () => {
    const a = firmPanelSetIdentity(parseFirmPanels(panelResponse(REAL)))
    const b = firmPanelSetIdentity(parseFirmPanels(panelResponse(
      REAL.map(p => p.pan === '24033C0410E' ? { pan: '24033C0410F', suffix: 'F', eff: '2027-01-05' } : p),
    )))
    expect(a).not.toBe(b)
  })

  it('moves when an effective date changes', () => {
    const a = firmPanelSetIdentity(parseFirmPanels(panelResponse(REAL)))
    const b = firmPanelSetIdentity(parseFirmPanels(panelResponse(
      REAL.map(p => ({ ...p, eff: '2018-01-01' })),
    )))
    expect(a).not.toBe(b)
  })
})

// ── The locator ─────────────────────────────────────────────────────────────

describe('the panel-set locator', () => {
  const at = (iso: string) => () => new Date(iso)

  it('hashes only the panels actually in force', async () => {
    const extract = femaPanelSetRegion(at('2026-08-22'))!
    const withPending = panelResponse([...REAL, { pan: '24033C0411F', suffix: 'F', eff: '2027-03-01' }])
    // A panel published for the future does not disturb today's hash.
    expect(await hashSourceContent(extract(withPending) as string))
      .toBe(await hashSourceContent(extract(panelResponse(REAL)) as string))
  })

  it('changes on the day a pending panel takes effect', async () => {
    const raw = panelResponse([...REAL, { pan: '24033C0411F', suffix: 'F', eff: '2027-03-01' }])
    const before = await hashSourceContent(femaPanelSetRegion(at('2027-02-28'))!(raw) as string)
    const after = await hashSourceContent(femaPanelSetRegion(at('2027-03-02'))!(raw) as string)
    expect(before).not.toBe(after)
  })

  it('returns null rather than hashing a truncated, errored or empty set', () => {
    const extract = femaPanelSetRegion(at('2026-08-22'))!
    expect(extract(panelResponse(REAL, { exceededTransferLimit: true }))).toBeNull()
    expect(extract(JSON.stringify({ error: { message: 'boom' } }))).toBeNull()
    expect(extract('<html/>')).toBeNull()
    expect(extract(panelResponse([]))).toBeNull()
    // Nothing in force yet is also not something to hash.
    expect(extract(panelResponse([{ pan: '24033C0411F', suffix: 'F', eff: '2027-03-01' }]))).toBeNull()
  })
})

// ── The bundle ──────────────────────────────────────────────────────────────

describe('the FEMA source bundle', () => {
  it('is its own publisher, not a county code section', () => {
    const [b] = buildPgFemaSources(RULES)
    expect(b.publisher).toMatch(/Federal Emergency Management Agency/i)
    expect(b.authority).toBe('OFFICIAL_AGENCY_REGULATION')
    expect(b.source.url).toContain('hazards.fema.gov')
    // Never routed through the county ordinance viewer.
    expect(b.source.url).not.toContain('encodeplus')
    expect(b.source.sourceId).toMatch(/^fema-nfhl-firm-panels-24033C$/)
  })

  it('binds the flood rule to the panel set', () => {
    const [b] = buildPgFemaSources(RULES)
    expect(b.locators[0].ruleIdentities).toEqual([FLOOD_RULE.identity])
  })

  it('states plainly what it cannot establish', () => {
    const [b] = buildPgFemaSources(RULES)
    expect(b.scope.covered.join(' ')).toMatch(/still current/i)
    expect(b.scope.notCovered.join(' ')).toMatch(/no coded-value domain/i)
    expect(b.scope.notCovered.join(' ')).toMatch(/LOMA|LOMR/i)
  })

  it('carries the caveats that must not be lost downstream', () => {
    expect(FEMA_DETERMINATION_CAVEATS.join(' ')).toMatch(/zone letter alone is not a flood determination/i)
    expect(FEMA_DETERMINATION_CAVEATS.join(' ')).toMatch(/without changing the\s+panel/i)
    expect(FEMA_DETERMINATION_CAVEATS.join(' ')).toMatch(/not yet in force/i)
  })

  it('works for any community, not just Prince George\'s County', () => {
    const [b] = buildFemaSourceBundles({
      rules: RULES, countyFips: '24031', jurisdictionCode: 'montgomery_md',
    })
    expect(b.source.sourceId).toContain('24031C')
    expect(b.source.jurisdiction).toBe('montgomery_md')
  })
})

// ── Through the refresh engine ──────────────────────────────────────────────

describe('refresh behaviour', () => {
  async function seeded() {
    const [b] = buildPgFemaSources(RULES, { asOf: () => new Date('2026-08-22') })
    const raw = panelResponse(REAL)
    const slice = b.locators[0].extractRaw!(raw) as string
    return {
      bundle: b, raw,
      source: {
        ...b.source,
        documentHash: await hashSourceContent(raw),
        regions: [{
          regionId: b.locators[0].regionId,
          label: b.locators[0].label,
          hash: await hashSourceContent(slice, { stripHtml: false }),
          ruleIdentities: b.locators[0].ruleIdentities,
        }],
      },
    }
  }

  it('reports no change when the panel set is unchanged', async () => {
    const { bundle, raw, source } = await seeded()
    const out = await refreshSource({
      source, locators: bundle.locators, rules: [FLOOD_RULE],
      fetchOptions: { fetchImpl: stub(raw) },
    })
    expect(out.unlocatableRegions).toEqual([])
    expect(out.change?.affectedRuleIdentities).toEqual([])
  })

  it('affects the flood rule when a new panel becomes effective', async () => {
    const { bundle, source } = await seeded()
    const revised = panelResponse([
      { pan: '24033C0410F', suffix: 'F', eff: '2026-01-05' },
      ...REAL.slice(1),
    ])
    const out = await refreshSource({
      source, locators: bundle.locators, rules: [FLOOD_RULE],
      fetchOptions: { fetchImpl: stub(revised) },
    })
    expect(out.change?.changed).toBe(true)
    expect(out.change?.affectedRuleIdentities).toContain(FLOOD_RULE.identity)
  })

  it('treats an NFHL outage as an outage, not a map revision', async () => {
    const { bundle, source } = await seeded()
    const out = await refreshSource({
      source, locators: bundle.locators, rules: [FLOOD_RULE],
      fetchOptions: { fetchImpl: stub(null, 'HTTP 503 from hazards.fema.gov') },
    })
    expect(out.downgraded).toHaveLength(0)
    expect(out.maintenanceItems[0].code).toBe('SOURCE_UNAVAILABLE')
    expect(out.maintenanceItems[0].detail).toMatch(/an outage is not an amendment/i)
  })

  it('raises a maintenance item rather than trusting a truncated response', async () => {
    const { bundle, source } = await seeded()
    const out = await refreshSource({
      source, locators: bundle.locators, rules: [FLOOD_RULE],
      fetchOptions: { fetchImpl: stub(panelResponse(REAL, { exceededTransferLimit: true })) },
    })
    expect(out.unlocatableRegions).toHaveLength(1)
    expect(out.maintenanceItems.some(m => m.code === 'REGION_LOCATOR_FAILED')).toBe(true)
    // The rule is reconsidered rather than left looking current.
    expect(out.rules[0].humanReviewRequired).toBe(true)
  })
})
