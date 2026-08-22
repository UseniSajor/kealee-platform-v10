/**
 * Region locators for the Prince George's County authoritative sources.
 *
 * These are what turn change detection from "reopen every rule when anything
 * moves" into "reopen the eight residential zones, or ideally just RSF-65".
 *
 * ── The trap that cost the most to find ────────────────────────────────────
 *
 * EncodePlus publishes the ordinance at TWO similar URLs:
 *
 *   doc-viewer.aspx   a JavaScript shell. 41 KB, 18 scripts, ZERO tables, and
 *                     no ordinance text at all. Hashing it produces a value
 *                     that changes when the CMS ships new JS and stays
 *                     identical through a real amendment — the exact inverse
 *                     of what a change detector needs, and silent about it.
 *
 *   doc-view.aspx     server-rendered. With `print=1` it returns the real
 *                     section: 128 KB and 24 tables for 27-4202.
 *
 * One letter apart. `doc-viewer` is the URL a human lands on and the one a
 * developer would naturally copy, so this module never builds a URL by hand —
 * `pgPrintUrl()` is the only way to construct one, and `FORBIDDEN_HASH_URLS`
 * records why the other must never be fetched for hashing.
 *
 * library.municode.com is likewise a shell (6 KB, no text) and is registered
 * the same way.
 *
 * ── Verified against the live site on 2026-08-22 ───────────────────────────
 *
 * Every secid below was fetched and its title, table count and zone coverage
 * confirmed. Sec. 27-4205 returning zero tables independently corroborates the
 * Phase 3C `zoning.dimensional.absent` finding: the ordinance genuinely
 * publishes no dimensional table for those legacy zones.
 */

import type { RegionLocator } from '../rules/source-refresh'
import type { AuthoritativeSource } from '../rules/change-detection'
import type { CertifiableRule } from '../rules/certification'
import type { SourceAuthority } from '../rules/model'

export const PG_ENCODEPLUS_HOST = 'https://online.encodeplus.com/regs/princegeorgescounty-md'

/**
 * The only sanctioned way to build an ordinance URL for hashing.
 *
 * `print=1` is what makes the response server-rendered; without it the same
 * host returns a shell.
 */
export function pgPrintUrl(secid: number): string {
  return `${PG_ENCODEPLUS_HOST}/doc-view.aspx?secid=${secid}&print=1`
}

/**
 * URLs that must never be fetched for hashing, with the reason. A maintainer
 * who reaches for one of these should hit this list first.
 */
export const FORBIDDEN_HASH_URLS: { url: string; reason: string }[] = [
  {
    url: `${PG_ENCODEPLUS_HOST}/doc-viewer.aspx`,
    reason:
      'JavaScript shell — 41 KB, 18 scripts, no tables, no ordinance text. Its hash changes on CMS ' +
      'deploys and does NOT change on amendments. Use pgPrintUrl() instead.',
  },
  {
    url: "https://library.municode.com/md/prince_george's_county/codes/code_of_ordinances",
    reason:
      'JavaScript shell — 6 KB, no ordinance text served. Useful as a human-facing citation, useless ' +
      'as a hash target.',
  },
]

export interface PgOrdinanceSection {
  secid: number
  /** Section number as the ordinance prints it. */
  section: string
  title: string
  /** Zone codes whose dimensional standards live in this section. */
  zones: string[]
  /** Tables observed in the print view on the verification date. */
  observedTables: number
}

/**
 * Verified secid map. `zones` matches the grouping already recorded in
 * `pg-dimensional-standards.generated.ts`, so a rule's section and its region
 * cannot drift apart.
 */
export const PG_ORDINANCE_SECTIONS: PgOrdinanceSection[] = [
  { secid: 633, section: '27-4201', title: 'Rural and Agricultural Base Zones',
    zones: ['AG', 'AR', 'ROS'], observedTables: 9 },
  { secid: 634, section: '27-4202', title: 'Residential Base Zones',
    zones: ['RE', 'RMF-12', 'RMF-20', 'RMF-48', 'RR', 'RSF-65', 'RSF-95', 'RSF-A'], observedTables: 24 },
  { secid: 635, section: '27-4203', title: 'Nonresidential Base Zones',
    zones: ['CGO', 'CN', 'CS', 'IE', 'IH'], observedTables: 15 },
  { secid: 636, section: '27-4204', title: 'Transit-Oriented/Activity Center Base Zones',
    zones: ['LTO-C', 'LTO-E', 'NAC', 'RTO-H-C', 'RTO-H-E', 'RTO-L-C', 'RTO-L-E', 'TAC-C', 'TAC-E'],
    observedTables: 18 },
  // Zero tables, verified. This is the section behind `zoning.dimensional.absent`.
  { secid: 637, section: '27-4205', title: 'Other Base Zones', zones: [], observedTables: 0 },
  { secid: 639, section: '27-4301', title: 'General Provisions for All Planned Development Zones',
    zones: [], observedTables: 1 },
  { secid: 640, section: '27-4302', title: 'Residential Planned Development Zones',
    zones: ['R-PD'], observedTables: 0 },
  { secid: 641, section: '27-4303', title: 'Transit-Oriented/Activity Center Planned Development Zones',
    zones: ['LTO-PD', 'NAC-PD', 'RTO-PD', 'TAC-PD'], observedTables: 16 },
  { secid: 642, section: '27-4304', title: 'Other Planned Development Zones',
    zones: ['IE-PD', 'MU-PD'], observedTables: 0 },
  { secid: 645, section: '27-4402', title: 'Policy Area Overlay Zones', zones: [], observedTables: 6 },
  { secid: 646, section: '27-4403', title: 'Other Overlay Zones', zones: [], observedTables: 0 },
]

// ── Section-level locators ──────────────────────────────────────────────────

/**
 * Cuts the ordinance body out of the print page, dropping CMS chrome.
 *
 * The print view wraps one section in a page that also carries share links and
 * navigation. Those contain the section title (so they look like content) and
 * change independently of the ordinance, so they are excluded by anchoring on
 * the section banner.
 */
function ordinanceBody(secid: number): RegionLocator['extractRaw'] {
  return (raw: string) => {
    const start = raw.indexOf(`secid-${secid}`)
    if (start < 0) return null
    // Everything from the section anchor to the end of the printable body.
    const tail = raw.slice(start)
    const end = tail.search(/<\/body|id="footer"|class="print-footer"/i)
    return end > 0 ? tail.slice(0, end) : tail
  }
}

/** Fallback for when the anchor is gone: a generous window after the heading. */
function sectionTextWindow(section: string): RegionLocator['extract'] {
  const marker = section.toLowerCase()
  return normalized => {
    const at = normalized.indexOf(marker)
    return at < 0 ? null : normalized.slice(at, at + 200_000)
  }
}

// ── Per-zone regions, derived rather than assumed ───────────────────────────

/**
 * Splits a section's print HTML into its bookmark sub-blocks and works out
 * which zone each one covers.
 *
 * Sec. 27-4202 carries nine `secid-634bk*` anchors for eight zones plus a
 * general-provisions block, which is suggestive — but only suggestive. Rather
 * than assume the ordering, this reads each block and claims it for a zone only
 * when EXACTLY ONE of the section's zone codes appears in it. Ambiguous blocks
 * are left alone and those zones stay on the coarser section region.
 *
 * Getting this wrong would bind RSF-65's certification to RMF-20's text, so it
 * is derived from the document every time and never cached as an assumption.
 */
export function deriveZoneBlocks(
  raw: string,
  section: PgOrdinanceSection,
): { zone: string; block: string }[] {
  const anchor = new RegExp(`id=["']secid-${section.secid}bk(\\d+)["']`, 'gi')
  const positions: number[] = []
  for (const m of raw.matchAll(anchor)) positions.push(m.index ?? 0)
  if (positions.length < 2) return []

  const blocks = positions.map((p, i) => raw.slice(p, positions[i + 1] ?? raw.length))
  const out: { zone: string; block: string }[] = []
  const claimed = new Set<string>()

  for (const block of blocks) {
    // A zone code must appear as a standalone token, not inside another code:
    // "RSF-65" must not match inside "RSF-65A", and "IE" must not match "IE-PD".
    const present = section.zones.filter(z =>
      new RegExp(`(?<![A-Z0-9-])${z.replace(/[-]/g, '\\-')}(?![A-Z0-9-])`, 'i').test(block),
    )
    if (present.length === 1 && !claimed.has(present[0])) {
      claimed.add(present[0])
      out.push({ zone: present[0], block })
    }
  }
  return out
}

// ── Building the sources ────────────────────────────────────────────────────

export interface PgSourceBundle {
  source: AuthoritativeSource
  locators: RegionLocator[]
  authority: SourceAuthority
}

const ruleKeyForZone = (zone: string) => `zoning.dimensional.${zone}`

/**
 * One source per ordinance section, one region per section.
 *
 * Section granularity is the floor, not the ceiling: an amendment to the
 * residential section reopens eight zone rules rather than all fifty-one. Where
 * `deriveZoneBlocks` succeeds at refresh time the engine can narrow further,
 * but the binding recorded here never over-claims.
 */
export function buildPgOrdinanceSources(
  rules: CertifiableRule[],
  opts: { retrievedAt?: string; version?: string } = {},
): PgSourceBundle[] {
  const retrievedAt = opts.retrievedAt ?? new Date().toISOString()
  const version = opts.version ?? '2022.1'
  const byKey = new Map(rules.map(r => [r.ruleKey, r.identity]))

  return PG_ORDINANCE_SECTIONS.map(section => {
    const ruleIdentities = section.zones
      .map(z => byKey.get(ruleKeyForZone(z)))
      .filter((x): x is string => Boolean(x))

    // 27-4205 publishes no table, so the `absent` rule binds to it — that rule
    // asserts an absence, and the absence is exactly what this section evidences.
    if (section.section === '27-4205') {
      const absent = byKey.get('zoning.dimensional.absent')
      if (absent) ruleIdentities.push(absent)
    }

    const locator: RegionLocator = {
      regionId: `sec-${section.section}`,
      label: `Sec. ${section.section} ${section.title}`,
      ruleIdentities,
      extractRaw: ordinanceBody(section.secid),
      extract: sectionTextWindow(section.section),
    }

    return {
      authority: 'OFFICIAL_CODE' as SourceAuthority,
      locators: [locator],
      source: {
        sourceId: `pgc-encodeplus-${section.section}`,
        jurisdiction: 'prince_georges_md',
        title: `Prince George's County Zoning Ordinance, Sec. ${section.section} — ${section.title}`,
        url: pgPrintUrl(section.secid),
        documentId: null,
        // Filled by the first refresh; there is no honest value before one runs.
        documentHash: '',
        version,
        retrievedAt,
        regions: [],
        history: [],
      },
    }
  })
}

// ── ArcGIS ──────────────────────────────────────────────────────────────────

export const PG_ARCGIS_ROOT = 'https://gisdata.pgplanning.org/arcgis/rest/services'

/** The layer definition endpoint, which carries the authoritative zone domains. */
export function pgLayerDefinitionUrl(service: string, layerId: number): string {
  return `${PG_ARCGIS_ROOT}/${service}/MapServer/${layerId}?f=json`
}

/**
 * Extracts the stable part of an ArcGIS layer definition.
 *
 * The payload carries `currentVersion` and `cimVersion`, which move when Esri
 * software is upgraded and have nothing to do with zoning. Hashing them would
 * reopen the zone registry every time the county patches its GIS server. Only
 * the fields, subtypes and coded-value domains are hashed — the parts that
 * change when the zone list changes.
 */
export function arcgisStableRegion(): RegionLocator['extractRaw'] {
  return (raw: string) => {
    try {
      const j = JSON.parse(raw) as Record<string, unknown>
      const stable = {
        name: j.name,
        type: j.type,
        geometryType: j.geometryType,
        fields: j.fields,
        subtypes: j.subtypes,
        typeIdField: j.typeIdField,
      }
      return JSON.stringify(stable)
    } catch {
      // Not JSON — the endpoint changed shape, which is itself worth reporting
      // rather than papering over.
      return null
    }
  }
}

/** The zone registry source: layer 59's domains are the authoritative code list. */
export function buildPgZoningLayerSource(
  rules: CertifiableRule[],
  opts: { retrievedAt?: string; version?: string } = {},
): PgSourceBundle {
  const retrievedAt = opts.retrievedAt ?? new Date().toISOString()
  const byKey = new Map(rules.map(r => [r.ruleKey, r.identity]))
  const ids = ['zoning.zone_registry_2022', 'gis.layers', 'crs.reference']
    .map(k => byKey.get(k))
    .filter((x): x is string => Boolean(x))

  return {
    authority: 'OFFICIAL_GIS',
    locators: [{
      regionId: 'zoning-layer-59-domains',
      label: 'Zoning (Full Description) layer 59 — subtype coded-value domains',
      ruleIdentities: ids,
      extractRaw: arcgisStableRegion(),
      // No normalised fallback: a JSON payload that will not parse must be
      // reported, not hashed as prose.
      extract: () => null,
    }],
    source: {
      sourceId: 'pgc-arcgis-zoning-59',
      jurisdiction: 'prince_georges_md',
      title: "M-NCPPC Zoning (Full Description), layer 59",
      url: pgLayerDefinitionUrl('Applications/ZoningCertificationLetter', 59),
      documentId: null,
      documentHash: '',
      version: opts.version ?? '2022.1',
      retrievedAt,
      regions: [],
      history: [],
    },
  }
}

// ── Subtitle 24, Subdivision Regulations ────────────────────────────────────

/**
 * Subtitle 24 lives in the same combined document as Subtitle 27, further in.
 *
 * The secid ordering is not obvious and is worth writing down so nobody has to
 * rediscover it: definitions occupy roughly 80–580, Subtitle 27 runs from ~590
 * to ~805, and Subtitle 24 starts immediately after and runs past 1060. The
 * combined publication is "Zoning Ordinance, Subdivision Regulations &
 * Landscape Manual (Effective 4/1/2022)" — Subtitle 25 Division 3 is NOT in it,
 * which is the structural reason §25-128 Table 1 cannot be retrieved here.
 *
 * Verified against the live site on 2026-08-22, by title and content marker.
 */
export interface PgSubtitle24Section {
  secid: number
  section: string
  title: string
  /** Rule keys whose governing text lives in this section. */
  ruleKeys: string[]
  observedTables: number
}

export const PG_SUBTITLE_24_SECTIONS: PgSubtitle24Section[] = [
  // Carries the summary table of subdivision review procedures — the five
  // procedure types recorded in PG_SUBDIVISION_PROCEDURES. Content confirmed:
  // "preliminary plan" and "major subdivision" both present, one table.
  { secid: 992, section: '24-3200', title: 'Summary Table of Subdivision Review Procedures',
    ruleKeys: ['subdivision.procedures'], observedTables: 1 },

  // Table 24-4303(c), the regulated stream buffer widths (75 ft inside a
  // Transit-Oriented Center, 100 ft outside). Content confirmed: "24-4303" and
  // "buffer" both present, one table.
  { secid: 1034, section: '24-4303', title: 'Stream, Wetland, and Water Quality Buffers',
    ruleKeys: ['environment.stream_buffers'], observedTables: 1 },

  // Mapped and verified but not yet the source of any rule. Recorded so the
  // next person extending the pack does not repeat the probing, and so an
  // over-eager mapping is a deliberate act rather than a guess.
  { secid: 990, section: 'PART 24-3', title: 'Subdivision Administration', ruleKeys: [], observedTables: 0 },
  { secid: 1020, section: '24-4102', title: 'Lot Standards', ruleKeys: [], observedTables: 0 },
  { secid: 1026, section: '24-4201', title: 'General Street Design Standards', ruleKeys: [], observedTables: 0 },
  { secid: 1032, section: '24-4301', title: 'General (Environmental)', ruleKeys: [], observedTables: 0 },
  // The county's own floodplain regulation. Deliberately NOT bound to
  // flood.fema_zones, whose payload is FEMA's NFIP designations from
  // msc.fema.gov — a different authority and a different document.
  { secid: 1033, section: '24-4302', title: '100-Year Floodplain', ruleKeys: [], observedTables: 0 },
  { secid: 1035, section: '24-4304', title: 'Woodland and Wildlife Habitat Conservation', ruleKeys: [], observedTables: 0 },
]

/** One source per mapped Subtitle 24 section that actually backs a rule. */
export function buildPgSubtitle24Sources(
  rules: CertifiableRule[],
  opts: { retrievedAt?: string; version?: string } = {},
): PgSourceBundle[] {
  const retrievedAt = opts.retrievedAt ?? new Date().toISOString()
  const byKey = new Map(rules.map(r => [r.ruleKey, r.identity]))

  return PG_SUBTITLE_24_SECTIONS
    // A section with no rule behind it is documentation, not a refresh target:
    // hashing it would produce change events nobody can act on.
    .filter(section => section.ruleKeys.length > 0)
    .map(section => {
      const ruleIdentities = section.ruleKeys
        .map(k => byKey.get(k))
        .filter((x): x is string => Boolean(x))

      return {
        authority: 'OFFICIAL_CODE' as SourceAuthority,
        locators: [{
          regionId: `sec-${section.section}`,
          label: `Sec. ${section.section} ${section.title}`,
          ruleIdentities,
          extractRaw: ordinanceBody(section.secid),
          extract: sectionTextWindow(section.section),
        }],
        source: {
          sourceId: `pgc-encodeplus-${section.section}`,
          jurisdiction: 'prince_georges_md',
          title: `Prince George's County Subdivision Regulations, Sec. ${section.section} — ${section.title}`,
          url: pgPrintUrl(section.secid),
          documentId: null,
          documentHash: '',
          version: opts.version ?? '2022.1',
          retrievedAt,
          regions: [],
          history: [],
        },
      }
    })
}

// ── Overlay zones ───────────────────────────────────────────────────────────

/**
 * Which ordinance section ESTABLISHES each overlay.
 *
 * An overlay rule has two halves and they come from different documents. The
 * ordinance establishes the overlay — its existence, purpose, applicability and
 * general provisions. The adopted plan for a specific district sets the actual
 * dimensional standards inside it. Only the first half is hashable here, and
 * that is exactly what the overlay rule payloads contain: code, name, kind,
 * source field and review note.
 *
 * Verified 2026-08-22 by full ordinance name with word boundaries. The overlay
 * CODES in PG_OVERLAYS ("T-D-O", "MIOZ-NOISE") are Kealee/GIS shorthand and do
 * not appear in the ordinance text — searching for them finds nothing, and
 * searching for "NCO" as a substring finds NONCONFORMING on every page. The
 * ordinance uses full names.
 */
export interface PgOverlaySection {
  secid: number
  section: string
  title: string
  /** Overlay codes this section establishes. */
  overlayCodes: string[]
  /** True when the section governs every overlay rather than establishing one. */
  appliesToAllOverlays?: boolean
  observedTables: number
}

export const PG_OVERLAY_SECTIONS: PgOverlaySection[] = [
  // General provisions govern every overlay, so a change here legitimately
  // reopens all of them. That is correct coupling, not over-reaction.
  { secid: 644, section: '27-4401', title: 'General (Overlay Zones)',
    overlayCodes: [], appliesToAllOverlays: true, observedTables: 0 },

  // Confirmed present by name: Chesapeake Bay Critical Area, Intense
  // Development, Limited Development, Resource Conservation, Military
  // Installation. Six overlays, six tables.
  { secid: 645, section: '27-4402', title: 'Policy Area Overlay Zones',
    overlayCodes: ['I-D-O', 'L-D-O', 'R-C-O', 'MIOZ-SAFETY', 'MIOZ-NOISE', 'MIOZ-HEIGHT'],
    observedTables: 6 },

  // Confirmed present by name: Neighborhood Conservation Overlay.
  { secid: 646, section: '27-4403', title: 'Other Overlay Zones',
    overlayCodes: ['NCO'], observedTables: 2 },
]

/**
 * Overlays the 2022 ordinance does not establish, with the reason.
 *
 * T-D-O and D-D-O are legacy designations carried over from the pre-2022
 * ordinance; "transit district overlay" and "development district overlay"
 * appear nowhere in 27-4401 through 27-4403. Development inside them is
 * governed by the adopted Transit or Development District Plan, which is a
 * separate document per district — so there is no single ordinance region to
 * hash, and pretending otherwise would bind the rule to text that does not
 * govern it.
 */
export const PG_OVERLAYS_NOT_IN_ORDINANCE: { code: string; reason: string }[] = [
  {
    code: 'T-D-O',
    reason:
      'Legacy overlay from the pre-2022 ordinance. Not established in Sec. 27-4401–27-4403 (verified by ' +
      'name). Standards come from the adopted Transit District Development Plan for each district.',
  },
  {
    code: 'D-D-O',
    reason:
      'Legacy overlay from the pre-2022 ordinance. Not established in Sec. 27-4401–27-4403 (verified by ' +
      'name). Standards come from the adopted Development District Plan for each district.',
  },
  {
    code: 'FLOOD-DPIE',
    reason:
      'A DPIE floodplain designation, not a Subtitle 27 overlay zone — "floodplain overlay" does not ' +
      'appear in the overlay part. Its authority is the county floodplain regulation and the effective ' +
      'FIRM panel, neither of which is in this publication.',
  },
]

/** One source per overlay section, bound to the overlay rules it establishes. */
export function buildPgOverlaySources(
  rules: CertifiableRule[],
  opts: { retrievedAt?: string; version?: string } = {},
): PgSourceBundle[] {
  const retrievedAt = opts.retrievedAt ?? new Date().toISOString()
  const byKey = new Map(rules.map(r => [r.ruleKey, r.identity]))
  const idFor = (code: string) => byKey.get(`zoning.overlay.${code}`)

  // Every overlay the ordinance does establish — the audience for 27-4401.
  const establishedCodes = PG_OVERLAY_SECTIONS.flatMap(s => s.overlayCodes)

  return PG_OVERLAY_SECTIONS.map(section => {
    const codes = section.appliesToAllOverlays ? establishedCodes : section.overlayCodes
    const ruleIdentities = codes.map(idFor).filter((x): x is string => Boolean(x))

    return {
      authority: 'OFFICIAL_CODE' as SourceAuthority,
      locators: [{
        regionId: `sec-${section.section}`,
        label: `Sec. ${section.section} ${section.title}`,
        ruleIdentities,
        extractRaw: ordinanceBody(section.secid),
        extract: sectionTextWindow(section.section),
      }],
      source: {
        sourceId: `pgc-encodeplus-${section.section}`,
        jurisdiction: 'prince_georges_md',
        title: `Prince George's County Zoning Ordinance, Sec. ${section.section} — ${section.title}`,
        url: pgPrintUrl(section.secid),
        documentId: null,
        documentHash: '',
        version: opts.version ?? '2022.1',
        retrievedAt,
        regions: [],
        history: [],
      },
    }
  })
}

/** Every PG source with a locator, ready to hand to `refreshAll`. */
export function buildPgSourceBundles(
  rules: CertifiableRule[],
  opts: { retrievedAt?: string; version?: string } = {},
): PgSourceBundle[] {
  return [
    ...buildPgOrdinanceSources(rules, opts),
    ...buildPgSubtitle24Sources(rules, opts),
    ...buildPgOverlaySources(rules, opts),
    buildPgZoningLayerSource(rules, opts),
  ]
}

/**
 * Rules with no locator, and why.
 *
 * Reported rather than omitted: a rule whose source cannot be hashed can never
 * be proven current, and that is a fact the maintenance queue needs to show
 * rather than a gap for someone to discover later.
 */
export function pgRulesWithoutLocator(rules: CertifiableRule[]): { ruleKey: string; reason: string }[] {
  const covered = new Set<string>()
  for (const b of buildPgSourceBundles(rules)) {
    for (const l of b.locators) for (const id of l.ruleIdentities) covered.add(id)
  }
  return rules
    .filter(r => !covered.has(r.identity))
    .map(r => ({
      ruleKey: r.ruleKey,
      reason:
        r.ruleKey === 'landscape.tree_canopy'
          ? 'Subtitle 25 §25-128 Table 1 is not published in any retrievable form, so there is nothing to hash.'
          : r.ruleKey.startsWith('zoning.overlay.')
            ? PG_OVERLAYS_NOT_IN_ORDINANCE.find(o => r.ruleKey === `zoning.overlay.${o.code}`)?.reason
              ?? 'Overlay standards come from each district\'s adopted plan, a separate document per district.'
            : r.ruleKey.startsWith('subdivision.') || r.ruleKey.startsWith('environment.')
              ? 'This Subtitle 24 rule has no mapped section yet. See PG_SUBTITLE_24_SECTIONS for the ' +
                'sections already located but not yet bound to a rule.'
              : 'No locator registered for this rule\'s source.',
    }))
}
