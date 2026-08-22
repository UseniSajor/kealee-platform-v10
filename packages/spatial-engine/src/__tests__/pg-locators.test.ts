/**
 * PG region locators.
 *
 * The failure this guards against is the quiet one: hashing something that
 * isn't the ordinance. A hash over a JavaScript shell, or over an ArcGIS
 * payload's server version, produces a detector that fires on CMS deploys and
 * stays silent through amendments. Every test here is about the hash tracking
 * the regulatory text and nothing else.
 */

import {
  PG_ORDINANCE_SECTIONS, FORBIDDEN_HASH_URLS, pgPrintUrl, pgLayerDefinitionUrl,
  buildPgOrdinanceSources, buildPgZoningLayerSource, buildPgSourceBundles,
  buildPgSubtitle24Sources, PG_SUBTITLE_24_SECTIONS,
  buildPgOverlaySources, PG_OVERLAY_SECTIONS, PG_OVERLAYS_NOT_IN_ORDINANCE,
  deriveZoneBlocks, arcgisStableRegion, pgRulesWithoutLocator,
} from '../jurisdictions/pg-source-locators'
import { PG_ZONE_DIMENSIONAL_TABLES } from '../jurisdictions/pg-dimensional-standards.generated'
import { buildPgCertifiableRules } from '../rules/pg-certifiable'
import { refreshSource, type FetchResult } from '../rules/source-refresh'
import { hashSourceContent } from '../rules/change-detection'

const RULES = buildPgCertifiableRules({ retrievedAt: '2026-08-22T09:00:00Z' })

/** A print page shaped like the real one: anchored section, tables, CMS chrome. */
function printPage(secid: number, section: string, zones: string[], values: Record<string, string> = {}) {
  const blocks = zones.map((z, i) => `
    <div id="secid-${secid}bk${i + 1}">
      <h3>${z}</h3>
      <table><tr><td>Front yard depth</td><td>${values[z] ?? '25'} ft</td></tr></table>
    </div>`).join('')
  return `<html><head><title>${section}</title></head><body>
    <a href="https://www.facebook.com/sharer/sharer.php?p[title]=${section}&session=RANDOM${Math.random()}">share</a>
    <div id="secid-${secid}"><h1>${section}</h1>${blocks}</div>
    <div id="footer">printed ${new Date().toISOString()}</div>
  </body></html>`
}

const stub = (body: string | null, error?: string) => async (): Promise<FetchResult> => ({
  ok: body != null, status: body != null ? 200 : 503, body,
  error: error ?? null, fetchedAt: '2026-08-22T10:00:00Z',
  bytes: body ? Buffer.byteLength(body) : 0,
})

// ── The URL trap ────────────────────────────────────────────────────────────

describe('the doc-viewer / doc-view trap', () => {
  it('only ever builds the server-rendered print URL', () => {
    const url = pgPrintUrl(634)
    expect(url).toContain('doc-view.aspx')
    expect(url).toContain('print=1')
    // One letter apart, and the wrong one serves no ordinance text.
    expect(url).not.toContain('doc-viewer.aspx')
  })

  it('records the shells that must never be hashed, with reasons', () => {
    expect(FORBIDDEN_HASH_URLS.length).toBeGreaterThanOrEqual(2)
    const viewer = FORBIDDEN_HASH_URLS.find(f => f.url.includes('doc-viewer'))
    expect(viewer?.reason).toMatch(/does NOT change on amendments/i)
    expect(FORBIDDEN_HASH_URLS.some(f => f.url.includes('municode'))).toBe(true)
  })

  it('never points a source at a forbidden URL', () => {
    for (const bundle of buildPgSourceBundles(RULES)) {
      for (const forbidden of FORBIDDEN_HASH_URLS) {
        expect(bundle.source.url).not.toBe(forbidden.url)
      }
      expect(bundle.source.url).not.toMatch(/doc-viewer\.aspx/)
    }
  })
})

// ── The verified map ────────────────────────────────────────────────────────

describe('the verified secid map', () => {
  it('covers every zone that has a published dimensional table', () => {
    const mapped = new Set(PG_ORDINANCE_SECTIONS.flatMap(s => s.zones))
    const tabled = Object.keys(PG_ZONE_DIMENSIONAL_TABLES)
    const missing = tabled.filter(z => !mapped.has(z))
    expect(missing).toEqual([])
  })

  it('assigns each zone to exactly one section', () => {
    const seen = new Map<string, string>()
    for (const s of PG_ORDINANCE_SECTIONS) {
      for (const z of s.zones) {
        expect(seen.has(z)).toBe(false)
        seen.set(z, s.section)
      }
    }
  })

  it('records 27-4205 as publishing no table, matching the absent rule', () => {
    const s = PG_ORDINANCE_SECTIONS.find(x => x.section === '27-4205')!
    expect(s.observedTables).toBe(0)
    expect(s.zones).toEqual([])

    const absent = RULES.find(r => r.ruleKey === 'zoning.dimensional.absent')!
    const bundle = buildPgOrdinanceSources(RULES).find(b => b.source.url?.includes('secid=637'))!
    expect(bundle.locators[0].ruleIdentities).toContain(absent.identity)
  })

  it('binds each section region to the rules for its own zones only', () => {
    const residential = buildPgOrdinanceSources(RULES)
      .find(b => b.source.url?.includes('secid=634'))!
    const ids = residential.locators[0].ruleIdentities
    const rsf65 = RULES.find(r => r.ruleKey === 'zoning.dimensional.RSF-65')!
    const cn = RULES.find(r => r.ruleKey === 'zoning.dimensional.CN')!
    expect(ids).toContain(rsf65.identity)
    expect(ids).not.toContain(cn.identity)
  })
})

// ── Hashing behaviour ───────────────────────────────────────────────────────

describe('what moves the hash', () => {
  const section = PG_ORDINANCE_SECTIONS.find(s => s.section === '27-4202')!

  it('ignores CMS chrome and reflowed markup', async () => {
    const bundle = buildPgOrdinanceSources(RULES).find(b => b.source.url?.includes('secid=634'))!
    const a = printPage(634, '27-4202', section.zones)
    const b = printPage(634, '27-4202', section.zones).replace(/>\s*</g, '>\n   <')

    const extract = bundle.locators[0].extractRaw!
    const ha = await hashSourceContent(extract(a) as string)
    const hb = await hashSourceContent(extract(b) as string)
    // Different share-link nonce and different indentation, same ordinance.
    expect(ha).toBe(hb)
  })

  it('moves when a requirement changes', async () => {
    const bundle = buildPgOrdinanceSources(RULES).find(b => b.source.url?.includes('secid=634'))!
    const extract = bundle.locators[0].extractRaw!
    const before = await hashSourceContent(extract(printPage(634, '27-4202', section.zones)) as string)
    const after = await hashSourceContent(
      extract(printPage(634, '27-4202', section.zones, { 'RSF-65': '30' })) as string,
    )
    expect(before).not.toBe(after)
  })

  it('falls back to a text window when the anchor is gone rather than giving up', async () => {
    const bundle = buildPgOrdinanceSources(RULES).find(b => b.source.url?.includes('secid=634'))!
    const noAnchor = printPage(634, '27-4202', section.zones).replace(/id="secid-634[^"]*"/g, '')
    expect(bundle.locators[0].extractRaw!(noAnchor)).toBeNull()
    // The normalised fallback still finds the section text.
    const { normalizeSourceContent } = await import('../rules/change-detection')
    expect(bundle.locators[0].extract(normalizeSourceContent(noAnchor))).not.toBeNull()
  })
})

// ── ArcGIS ──────────────────────────────────────────────────────────────────

describe('ArcGIS layer definitions', () => {
  const payload = (currentVersion: number, zones: string[]) => JSON.stringify({
    currentVersion, cimVersion: '3.5.0', id: 59, name: 'Zoning (Full Description)',
    type: 'Feature Layer', geometryType: 'esriGeometryPolygon',
    fields: [{ name: 'CLASS', domain: { codedValues: zones.map(z => ({ code: z, name: z })) } }],
    subtypes: zones.map(z => ({ code: z })), typeIdField: 'CLASS',
  })

  it('does not move when only the Esri server version changes', async () => {
    const extract = arcgisStableRegion()!
    const a = await hashSourceContent(extract(payload(11.5, ['RSF-65', 'RMF-20'])) as string)
    const b = await hashSourceContent(extract(payload(11.6, ['RSF-65', 'RMF-20'])) as string)
    expect(a).toBe(b)
  })

  it('moves when the zone list changes', async () => {
    const extract = arcgisStableRegion()!
    const a = await hashSourceContent(extract(payload(11.5, ['RSF-65', 'RMF-20'])) as string)
    const b = await hashSourceContent(extract(payload(11.5, ['RSF-65', 'RMF-20', 'RSF-95'])) as string)
    expect(a).not.toBe(b)
  })

  it('reports rather than hashes when the endpoint stops returning JSON', () => {
    expect(arcgisStableRegion()!('<html>maintenance</html>')).toBeNull()
    const bundle = buildPgZoningLayerSource(RULES)
    // No prose fallback: a broken JSON endpoint must surface, not be hashed as text.
    expect(bundle.locators[0].extract('anything at all')).toBeNull()
  })

  it('points at the layer definition endpoint', () => {
    expect(pgLayerDefinitionUrl('Applications/ZoningCertificationLetter', 59))
      .toBe('https://gisdata.pgplanning.org/arcgis/rest/services/Applications/ZoningCertificationLetter/MapServer/59?f=json')
  })
})

// ── Per-zone derivation ─────────────────────────────────────────────────────

describe('per-zone blocks are derived, never assumed', () => {
  const section = PG_ORDINANCE_SECTIONS.find(s => s.section === '27-4202')!

  it('claims a block for a zone only when exactly one zone code appears in it', () => {
    const blocks = deriveZoneBlocks(printPage(634, '27-4202', section.zones), section)
    expect(blocks.length).toBe(section.zones.length)
    expect(blocks.map(b => b.zone).sort()).toEqual([...section.zones].sort())
  })

  it('leaves ambiguous blocks unclaimed rather than guessing', () => {
    const ambiguous = `
      <div id="secid-634bk1">RSF-65 and RMF-20 share this provision</div>
      <div id="secid-634bk2">RE only</div>`
    const blocks = deriveZoneBlocks(ambiguous, section)
    expect(blocks.map(b => b.zone)).toEqual(['RE'])
  })

  it('does not let one zone code match inside another', () => {
    const s = { ...section, zones: ['IE', 'IE-PD'] }
    const blocks = deriveZoneBlocks(
      `<div id="secid-634bk1">IE-PD standards</div><div id="secid-634bk2">IE standards</div>`, s,
    )
    // "IE" must not be found inside "IE-PD".
    expect(blocks.find(b => b.block.includes('IE-PD'))?.zone).toBe('IE-PD')
    expect(blocks.find(b => !b.block.includes('IE-PD'))?.zone).toBe('IE')
  })

  it('returns nothing when the document has no bookmark anchors', () => {
    expect(deriveZoneBlocks('<div>no anchors here</div>', section)).toEqual([])
  })
})

// ── End to end through the refresh ──────────────────────────────────────────

describe('refresh through a PG locator', () => {
  const section = PG_ORDINANCE_SECTIONS.find(s => s.section === '27-4202')!

  async function bundleWithHash() {
    const bundle = buildPgOrdinanceSources(RULES).find(b => b.source.url?.includes('secid=634'))!
    const page = printPage(634, '27-4202', section.zones)
    const slice = bundle.locators[0].extractRaw!(page) as string
    const { normalizeSourceContent } = await import('../rules/change-detection')
    return {
      bundle, page,
      source: {
        ...bundle.source,
        documentHash: await hashSourceContent(page),
        regions: [{
          regionId: bundle.locators[0].regionId,
          label: bundle.locators[0].label,
          hash: await hashSourceContent(normalizeSourceContent(slice), { stripHtml: false }),
          ruleIdentities: bundle.locators[0].ruleIdentities,
        }],
      },
    }
  }

  it('reports no change when the ordinance is untouched', async () => {
    const { bundle, page, source } = await bundleWithHash()
    const rules = RULES.filter(r => bundle.locators[0].ruleIdentities.includes(r.identity))
    const out = await refreshSource({
      source, locators: bundle.locators, rules, fetchOptions: { fetchImpl: stub(page) },
    })
    expect(out.unlocatableRegions).toEqual([])
    expect(out.change?.affectedRuleIdentities).toEqual([])
    expect(out.downgraded).toHaveLength(0)
  })

  it('affects only that section when its text changes', async () => {
    const { bundle, source } = await bundleWithHash()
    const rules = RULES.filter(r => bundle.locators[0].ruleIdentities.includes(r.identity))
    const amended = printPage(634, '27-4202', section.zones, { 'RSF-65': '30' })
    const out = await refreshSource({
      source, locators: bundle.locators, rules, fetchOptions: { fetchImpl: stub(amended) },
    })
    expect(out.change?.changed).toBe(true)
    expect(out.change?.affectedRuleIdentities.length).toBe(rules.length)
    // 8 residential zones, not all 51 rules.
    expect(rules.length).toBeLessThan(RULES.length / 2)
  })
})

// ── Honest gaps ─────────────────────────────────────────────────────────────

describe('rules with no locator are reported, not hidden', () => {
  it('names §25-128 and explains there is nothing to hash', () => {
    const gaps = pgRulesWithoutLocator(RULES)
    const canopy = gaps.find(g => g.ruleKey === 'landscape.tree_canopy')
    expect(canopy?.reason).toMatch(/not published in any retrievable form/i)
  })

  it('explains per overlay why it has no single document', () => {
    const gaps = pgRulesWithoutLocator(RULES)
    const overlay = gaps.filter(g => g.ruleKey.startsWith('zoning.overlay.'))
    // Only the three the ordinance does not establish remain unmapped, and each
    // names the document that does govern it rather than giving one blanket reason.
    expect(overlay).toHaveLength(3)
    for (const g of overlay) expect(g.reason).toMatch(/adopted .*Plan|FIRM panel/i)
  })

  it('every gap carries a reason', () => {
    for (const g of pgRulesWithoutLocator(RULES)) {
      expect(g.reason.length).toBeGreaterThan(20)
    }
  })
})

// ── Subtitle 24 ─────────────────────────────────────────────────────────────

describe('Subtitle 24 sections', () => {
  it('binds the stream buffer rule to 24-4303, where Table 24-4303(c) lives', () => {
    const bundles = buildPgSubtitle24Sources(RULES)
    const buffers = bundles.find(b => b.source.url?.includes('secid=1034'))
    expect(buffers).toBeDefined()
    expect(buffers!.source.title).toMatch(/24-4303/)

    const rule = RULES.find(r => r.ruleKey === 'environment.stream_buffers')!
    expect(buffers!.locators[0].ruleIdentities).toContain(rule.identity)
  })

  it('binds the subdivision procedures rule to the 24-3200 summary table', () => {
    const bundles = buildPgSubtitle24Sources(RULES)
    const procedures = bundles.find(b => b.source.url?.includes('secid=992'))
    expect(procedures).toBeDefined()

    const rule = RULES.find(r => r.ruleKey === 'subdivision.procedures')!
    expect(procedures!.locators[0].ruleIdentities).toContain(rule.identity)
  })

  it('does not create a refresh target for a section that backs no rule', () => {
    const documented = PG_SUBTITLE_24_SECTIONS.filter(s => s.ruleKeys.length === 0)
    expect(documented.length).toBeGreaterThan(0)

    const bundles = buildPgSubtitle24Sources(RULES)
    for (const s of documented) {
      // Mapped for the next maintainer, but hashing it would emit change
      // events nobody could act on.
      expect(bundles.some(b => b.source.url?.includes(`secid=${s.secid}`))).toBe(false)
    }
  })

  it('leaves the county floodplain section unbound to the FEMA rule', () => {
    const floodplain = PG_SUBTITLE_24_SECTIONS.find(s => s.section === '24-4302')!
    // Different authority, different document — FEMA's NFIP designations are
    // not the county's floodplain regulation.
    expect(floodplain.ruleKeys).toEqual([])
  })

  it('uses the print URL for Subtitle 24 too', () => {
    for (const b of buildPgSubtitle24Sources(RULES)) {
      expect(b.source.url).toContain('doc-view.aspx')
      expect(b.source.url).toContain('print=1')
      expect(b.source.url).not.toMatch(/doc-viewer/)
    }
  })

  it('closes the Subtitle 24 gap in locator coverage', () => {
    const gaps = pgRulesWithoutLocator(RULES).map(g => g.ruleKey)
    expect(gaps).not.toContain('environment.stream_buffers')
    expect(gaps).not.toContain('subdivision.procedures')
  })
})

// ── Overlay zones ───────────────────────────────────────────────────────────

describe('overlay zones', () => {
  const overlayId = (code: string) =>
    RULES.find(r => r.ruleKey === `zoning.overlay.${code}`)!.identity

  it('binds the Chesapeake Bay and Military Installation overlays to 27-4402', () => {
    const s = buildPgOverlaySources(RULES).find(b => b.source.url?.includes('secid=645'))!
    const ids = s.locators[0].ruleIdentities
    for (const code of ['I-D-O', 'L-D-O', 'R-C-O', 'MIOZ-SAFETY', 'MIOZ-NOISE', 'MIOZ-HEIGHT']) {
      expect(ids).toContain(overlayId(code))
    }
    expect(ids).not.toContain(overlayId('NCO'))
  })

  it('binds the Neighborhood Conservation overlay to 27-4403', () => {
    const s = buildPgOverlaySources(RULES).find(b => b.source.url?.includes('secid=646'))!
    expect(s.locators[0].ruleIdentities).toEqual([overlayId('NCO')])
  })

  it('makes general provisions reopen every established overlay', () => {
    const general = buildPgOverlaySources(RULES).find(b => b.source.url?.includes('secid=644'))!
    const established = PG_OVERLAY_SECTIONS.flatMap(x => x.overlayCodes)
    expect(established).toHaveLength(7)
    for (const code of established) {
      expect(general.locators[0].ruleIdentities).toContain(overlayId(code))
    }
    // and only those — a legacy overlay is not governed by this section
    expect(general.locators[0].ruleIdentities).not.toContain(overlayId('T-D-O'))
  })

  it('leaves the legacy and DPIE overlays unmapped, with evidence', () => {
    const codes = PG_OVERLAYS_NOT_IN_ORDINANCE.map(o => o.code)
    expect(codes.sort()).toEqual(['D-D-O', 'FLOOD-DPIE', 'T-D-O'])

    const gaps = pgRulesWithoutLocator(RULES)
    const tdo = gaps.find(g => g.ruleKey === 'zoning.overlay.T-D-O')
    expect(tdo?.reason).toMatch(/verified by name/i)
    expect(tdo?.reason).toMatch(/Transit District Development Plan/i)

    const flood = gaps.find(g => g.ruleKey === 'zoning.overlay.FLOOD-DPIE')
    expect(flood?.reason).toMatch(/not a Subtitle 27 overlay zone/i)
  })

  it('does not bind a legacy overlay to a section that never mentions it', () => {
    for (const b of buildPgOverlaySources(RULES)) {
      for (const code of ['T-D-O', 'D-D-O', 'FLOOD-DPIE']) {
        expect(b.locators[0].ruleIdentities).not.toContain(overlayId(code))
      }
    }
  })

  it('covers 7 of the 10 overlays', () => {
    const covered = new Set(buildPgOverlaySources(RULES).flatMap(b => b.locators[0].ruleIdentities))
    const overlayRules = RULES.filter(r => r.ruleKey.startsWith('zoning.overlay.'))
    expect(overlayRules).toHaveLength(10)
    expect([...covered].filter(id => overlayRules.some(r => r.identity === id))).toHaveLength(7)
  })
})
