/**
 * FEMA National Flood Hazard Layer — a source family of its own.
 *
 * Flood mapping is not an ordinance and must not be modelled as one. A county
 * amends text; FEMA issues a new FIRM panel with an effective date. Hashing
 * prose is the wrong instrument here, so this family detects change the way the
 * NFIP actually works: by the identity of the effective panel set.
 *
 * ── What is and is not covered ─────────────────────────────────────────────
 *
 * COVERED — panel currency. When FEMA issues a new panel for a community, the
 * flood determination made against the old one is stale. `FIRM_PAN`, `SUFFIX`
 * and `EFF_DATE` on NFHL layer 3 make that detectable and unambiguous.
 *
 * NOT COVERED — the zone notation list itself (A, AE, AO, AH, VE, X…). It is
 * FIRM/DFIRM specification notation, not a coded-value domain and not
 * enumerated in 44 CFR 64.3 (checked: the section is retrievable and contains
 * "special flood hazard" but none of the zone letters). NFHL layer 28 carries
 * `FLD_ZONE` as a plain String with no domain attached, so there is nothing
 * authoritative to hash.
 *
 * That distinction is deliberate. Deriving the list from `returnDistinctValues`
 * would give only the zones that happen to be mapped somewhere — the identical
 * mistake already corrected once on PG zoning, where distinct values returned
 * 32 zones and the authoritative subtype domain carried 36.
 *
 * ── What a flood determination is not ──────────────────────────────────────
 *
 * A zone letter on its own is not a determination. The governing artifact is
 * the effective FIRM panel and its effective date, and even that can be revised
 * for one property by a Letter of Map Amendment or Revision without the panel
 * changing at all. Nothing here may be presented as a flood determination.
 */

import type { RegionLocator } from '../rules/source-refresh'
import type { AuthoritativeSource } from '../rules/change-detection'
import type { CertifiableRule } from '../rules/certification'
import type { SourceAuthority } from '../rules/model'

export const FEMA_PUBLISHER = 'Federal Emergency Management Agency (NFIP)'
export const FEMA_NFHL_ROOT = 'https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer'

/** Verified live 2026-08-22. */
export const FEMA_NFHL_LAYERS = {
  firmPanels: { id: 3, name: 'FIRM Panels' },
  baseFloodElevations: { id: 16, name: 'Base Flood Elevations' },
  floodHazardBoundaries: { id: 27, name: 'Flood Hazard Boundaries' },
  floodHazardZones: { id: 28, name: 'Flood Hazard Zones' },
  politicalJurisdictions: { id: 22, name: 'Political Jurisdictions' },
} as const

/** The Map Service Center, where the panels and FIRMettes are published to the public. */
export const FEMA_MSC_PORTAL = 'https://msc.fema.gov/portal/search'

/**
 * A countywide DFIRM id is the 5-digit county FIPS plus 'C'.
 * Prince George's County, MD is 24033, so 24033C.
 */
export function femaCountyDfirmId(countyFips: string): string {
  const fips = countyFips.trim()
  if (!/^\d{5}$/.test(fips)) {
    throw new Error(`County FIPS must be five digits, received "${countyFips}".`)
  }
  return `${fips}C`
}

/**
 * The panel query.
 *
 * `resultRecordCount` is set high on purpose: a truncated set produces a hash
 * that is stable and wrong, so the locator would rather see the whole set or
 * refuse. Geometry is excluded — panel identity is what matters, not shape.
 */
export function femaPanelQueryUrl(dfirmId: string, recordLimit = 4000): string {
  const params = new URLSearchParams({
    where: `DFIRM_ID='${dfirmId}'`,
    outFields: 'DFIRM_ID,FIRM_PAN,PANEL,SUFFIX,PANEL_TYP,EFF_DATE,PRE_DATE',
    returnGeometry: 'false',
    orderByFields: 'FIRM_PAN',
    resultRecordCount: String(recordLimit),
    f: 'json',
  })
  return `${FEMA_NFHL_ROOT}/${FEMA_NFHL_LAYERS.firmPanels.id}/query?${params}`
}

// ── Panels ──────────────────────────────────────────────────────────────────

export interface FirmPanel {
  dfirmId: string
  /** Full panel number, e.g. "24033C0410E". */
  firmPanel: string
  panel: string
  suffix: string
  panelType: string
  /** Effective date. A panel is not in force before it. */
  effectiveDate: string | null
  /** Preliminary date, where the panel is still pending. */
  preliminaryDate: string | null
}

export class FemaPanelSetError extends Error {
  constructor(readonly code: string, message: string) {
    super(message)
    this.name = 'FemaPanelSetError'
  }
}

/**
 * Parses an NFHL query response.
 *
 * Two failure modes matter and both arrive with HTTP 200, which is why they are
 * checked explicitly rather than trusted:
 *
 *   - ArcGIS reports errors in the body, not the status line.
 *   - `exceededTransferLimit` means the set is TRUNCATED. Hashing a partial
 *     panel set gives a value that looks stable and silently omits panels, so
 *     it is refused rather than used.
 */
export function parseFirmPanels(raw: string): FirmPanel[] {
  let j: {
    error?: { message?: string; details?: string[] }
    exceededTransferLimit?: boolean
    features?: { attributes: Record<string, unknown> }[]
  }
  try {
    j = JSON.parse(raw)
  } catch {
    throw new FemaPanelSetError('NOT_JSON', 'The NFHL endpoint did not return JSON.')
  }

  if (j.error) {
    throw new FemaPanelSetError(
      'ARCGIS_ERROR',
      `NFHL returned an error in the response body: ${j.error.message ?? 'unspecified'}. ` +
      'ArcGIS reports failures with HTTP 200, so this cannot be caught by status alone.',
    )
  }
  if (j.exceededTransferLimit) {
    throw new FemaPanelSetError(
      'TRUNCATED',
      'The panel set exceeded the transfer limit and is incomplete. A hash over a truncated set is ' +
      'stable and wrong — it would silently omit panels and report "unchanged" through a revision. ' +
      'Raise resultRecordCount or paginate.',
    )
  }

  const asDate = (v: unknown): string | null => {
    if (typeof v !== 'number' || !Number.isFinite(v)) return null
    return new Date(v).toISOString().slice(0, 10)
  }

  return (j.features ?? []).map(f => ({
    dfirmId: String(f.attributes.DFIRM_ID ?? ''),
    firmPanel: String(f.attributes.FIRM_PAN ?? ''),
    panel: String(f.attributes.PANEL ?? ''),
    suffix: String(f.attributes.SUFFIX ?? ''),
    panelType: String(f.attributes.PANEL_TYP ?? ''),
    effectiveDate: asDate(f.attributes.EFF_DATE),
    preliminaryDate: asDate(f.attributes.PRE_DATE),
  }))
}

export interface PanelEffectivity {
  effective: FirmPanel[]
  /** Issued with a future effective date — real, published, and NOT yet in force. */
  pending: FirmPanel[]
  /** No effective date recorded; cannot be placed either way. */
  undated: FirmPanel[]
}

/**
 * Splits panels by whether they are actually in force.
 *
 * FEMA publishes panels ahead of their effective date, sometimes by months. A
 * pending panel is genuine and important — it tells an owner what is coming —
 * but building to it today would be building to a map that does not govern yet.
 * Treating "published" as "effective" is the mistake this function exists to
 * prevent.
 */
export function splitPanelsByEffectivity(panels: FirmPanel[], asOf: Date = new Date()): PanelEffectivity {
  const now = asOf.getTime()
  const effective: FirmPanel[] = []
  const pending: FirmPanel[] = []
  const undated: FirmPanel[] = []

  for (const p of panels) {
    if (!p.effectiveDate) { undated.push(p); continue }
    const t = Date.parse(p.effectiveDate)
    if (!Number.isFinite(t)) { undated.push(p); continue }
    if (t > now) pending.push(p)
    else effective.push(p)
  }
  return { effective, pending, undated }
}

/**
 * A canonical identity for a panel set.
 *
 * Sorted so ArcGIS ordering cannot move the hash, and limited to the fields
 * that define which map governs. Panel type is excluded deliberately: a panel
 * flipping between "Printed" and "Not Printed" is a publication detail, not a
 * change in what the map says.
 */
export function firmPanelSetIdentity(panels: FirmPanel[]): string {
  return panels
    .map(p => `${p.firmPanel}|${p.suffix}|${p.effectiveDate ?? 'undated'}`)
    .sort()
    .join('\n')
}

/**
 * The locator: hashes the EFFECTIVE panel set only.
 *
 * A pending panel becoming effective changes the hash on the day it does, which
 * is exactly when the determination becomes stale — not months earlier when it
 * was published. That timing is the whole point of splitting them.
 */
export function femaPanelSetRegion(asOf: () => Date = () => new Date()): RegionLocator['extractRaw'] {
  return (raw: string) => {
    let panels: FirmPanel[]
    try {
      panels = parseFirmPanels(raw)
    } catch {
      // Truncated, errored or non-JSON. Returning null routes this through the
      // engine's unlocatable-region path, which downgrades the affected rules
      // and raises a maintenance item, rather than hashing something wrong.
      return null
    }
    if (panels.length === 0) return null
    const { effective } = splitPanelsByEffectivity(panels, asOf())
    if (effective.length === 0) return null
    return firmPanelSetIdentity(effective)
  }
}

// ── Caveats that must survive into any output ───────────────────────────────

export const FEMA_DETERMINATION_CAVEATS: string[] = [
  'A zone letter alone is not a flood determination. The governing artifact is the effective FIRM ' +
  'panel and its effective date.',
  'A Letter of Map Amendment or Revision (LOMA/LOMR) can revise one property without changing the ' +
  'panel, so a current panel does not settle an individual parcel.',
  'Panels published with a future effective date are not yet in force. Building to a pending panel ' +
  'is building to a map that does not govern.',
  'NFHL is a mapping service, not a determination service. An Elevation Certificate and a licensed ' +
  'professional are what place a structure relative to the base flood elevation.',
]

// ── Source bundles ──────────────────────────────────────────────────────────

export interface FemaSourceBundle {
  source: AuthoritativeSource
  locators: RegionLocator[]
  authority: SourceAuthority
  publisher: string
  /** What this source can and cannot establish. */
  scope: { covered: string[]; notCovered: string[] }
}

export interface BuildFemaSourcesInput {
  rules: CertifiableRule[]
  /** Five-digit county FIPS. Prince George's County, MD is 24033. */
  countyFips: string
  jurisdictionCode: string
  retrievedAt?: string
  asOf?: () => Date
}

/**
 * The FEMA source family for one community.
 *
 * One source: the effective FIRM panel set. It is what makes a flood
 * determination current or stale, and it is the only part of NFIP flood mapping
 * that is both authoritative and machine-retrievable.
 */
export function buildFemaSourceBundles(input: BuildFemaSourcesInput): FemaSourceBundle[] {
  const retrievedAt = input.retrievedAt ?? new Date().toISOString()
  const dfirmId = femaCountyDfirmId(input.countyFips)
  const byKey = new Map(input.rules.map(r => [r.ruleKey, r.identity]))
  const floodRule = byKey.get('flood.fema_zones')

  return [{
    publisher: FEMA_PUBLISHER,
    // Promulgated by the agency with jurisdiction and enforceable as mapped.
    authority: 'OFFICIAL_AGENCY_REGULATION' as SourceAuthority,
    scope: {
      covered: [
        'Whether the FIRM panel set for this community has been revised, and therefore whether a ' +
        'flood determination made against it is still current.',
        'The effective date of each panel, and which panels are published but not yet in force.',
      ],
      notCovered: [
        'The flood zone notation list (A, AE, VE, X…). It is FIRM/DFIRM specification notation with ' +
        'no coded-value domain published on NFHL layer 28 and no enumeration in 44 CFR 64.3.',
        'Any individual property determination. LOMAs and LOMRs revise properties without changing ' +
        'the panel.',
        'Base flood elevations, which are a separate NFHL layer and a separate question.',
      ],
    },
    locators: [{
      regionId: `firm-panels-${dfirmId}`,
      label: `FEMA effective FIRM panel set, DFIRM ${dfirmId}`,
      ruleIdentities: floodRule ? [floodRule] : [],
      extractRaw: femaPanelSetRegion(input.asOf),
      // No normalised fallback: an ArcGIS payload that will not parse must
      // surface as unlocatable, never be hashed as prose.
      extract: () => null,
    }],
    source: {
      sourceId: `fema-nfhl-firm-panels-${dfirmId}`,
      jurisdiction: input.jurisdictionCode,
      title: `FEMA National Flood Hazard Layer — effective FIRM panels, DFIRM ${dfirmId}`,
      url: femaPanelQueryUrl(dfirmId),
      documentId: null,
      documentHash: '',
      version: retrievedAt.slice(0, 10),
      retrievedAt,
      regions: [],
      history: [],
    },
  }]
}

/** Prince George's County, MD. */
export const PG_COUNTY_FIPS = '24033'

export function buildPgFemaSources(
  rules: CertifiableRule[],
  opts: { retrievedAt?: string; asOf?: () => Date } = {},
): FemaSourceBundle[] {
  return buildFemaSourceBundles({
    rules,
    countyFips: PG_COUNTY_FIPS,
    jurisdictionCode: 'prince_georges_md',
    retrievedAt: opts.retrievedAt,
    asOf: opts.asOf,
  })
}
