/**
 * The Prince George's County rule pack, expressed as versioned rule rows.
 *
 * Every rule carries the URL it came from, the ordinance section, the effective
 * date and when Kealee last verified it. `humanReviewRequired` is true wherever
 * the value was machine-extracted rather than confirmed by a person — which is
 * most of the dimensional standards, and saying so is the point.
 *
 * A number in a plan set that nobody can trace to a section of the ordinance is
 * a liability. This is how the trace is stored.
 */

import type { RuleVersionRow } from './store'
import {
  PG_ZONES_2022, PG_ZONE_NOT_ASSIGNED, PG_ZONING_ORDINANCE_2022_EFFECTIVE,
  PG_CRS, PG_HORIZONTAL_DATUM, PG_LINEAR_UNIT, PG_LAYERS, PG_GIS_ROOT,
} from '../jurisdictions/prince-georges-md'
import {
  PG_OVERLAYS, PG_FEMA_FLOOD_ZONES, PG_ORDINANCE_SOURCES, SITE_PLAN_REVIEW_MODEL,
} from '../jurisdictions/pg-overlays-and-dimensions'
import { PG_ZONE_DIMENSIONAL_TABLES } from '../jurisdictions/pg-dimensional-standards.generated'
import {
  PG_SUBDIVISION_SOURCE, PG_REGULATED_STREAM_BUFFERS, PG_SUBDIVISION_PROCEDURES,
  PG_TREE_CANOPY_COVERAGE,
} from '../jurisdictions/pg-subdivision-and-landscape'

export const PG_JURISDICTION_CODE = 'prince_georges_md'
export const PG_AGENCY = "Prince George's County DPIE / M-NCPPC"

/** Bump when the shape of what is stored changes, not when a value changes. */
export const PG_RULE_PACK_VERSION = 1

function row(input: {
  ruleKey: string
  kind: RuleVersionRow['kind']
  sourceUrl: string | null
  section: string | null
  effectiveDate?: string | null
  confidence: number
  humanReviewRequired: boolean
  payload: unknown
  version?: number
}): RuleVersionRow {
  const version = input.version ?? PG_RULE_PACK_VERSION
  return {
    id: `${PG_JURISDICTION_CODE}:${input.ruleKey}:v${version}`,
    jurisdictionCode: PG_JURISDICTION_CODE,
    agency: PG_AGENCY,
    ruleKey: input.ruleKey,
    version,
    kind: input.kind,
    sourceUrl: input.sourceUrl,
    section: input.section,
    effectiveDate: input.effectiveDate ?? PG_ZONING_ORDINANCE_2022_EFFECTIVE,
    lastVerifiedAt: null,
    confidence: input.confidence,
    humanReviewRequired: input.humanReviewRequired,
    payload: input.payload,
  }
}

/**
 * Builds the full rule pack.
 *
 * `verifiedAt` is stamped on every row, so "when did we last check this against
 * the county?" is answerable per rule rather than per deployment.
 */
export function buildPgRulePack(opts: { verifiedAt?: string } = {}): RuleVersionRow[] {
  const verifiedAt = opts.verifiedAt ?? null
  const rows: RuleVersionRow[] = []

  // ── Coordinate reference and the GIS source registry ──────────────────────
  rows.push(row({
    ruleKey: 'crs.reference',
    kind: 'SOURCE_REGISTRY',
    sourceUrl: PG_GIS_ROOT,
    section: null,
    confidence: 1,
    humanReviewRequired: false,
    payload: {
      crs: PG_CRS,
      horizontalDatum: PG_HORIZONTAL_DATUM,
      linearUnit: PG_LINEAR_UNIT,
      note:
        'County services publish in EPSG:2248 and do not honour inSR=4326. Queries are submitted in ' +
        '2248 and reprojection goes through PROJ or an authoritative geometry service — never hand-rolled datum maths.',
    },
  }))

  rows.push(row({
    ruleKey: 'gis.layers',
    kind: 'SOURCE_REGISTRY',
    sourceUrl: PG_GIS_ROOT,
    section: null,
    confidence: 1,
    humanReviewRequired: false,
    payload: PG_LAYERS,
  }))

  // ── Zone registry ─────────────────────────────────────────────────────────
  rows.push(row({
    ruleKey: 'zoning.zone_registry_2022',
    kind: 'INPUT_SCHEMA',
    sourceUrl: PG_ORDINANCE_SOURCES.councilZoningPortal,
    section: 'Subtitle 27 — Zoning Ordinance',
    confidence: 1,
    humanReviewRequired: false,
    payload: {
      zones: PG_ZONES_2022,
      count: PG_ZONES_2022.length,
      notAssignedSentinel: PG_ZONE_NOT_ASSIGNED,
      note:
        'Enumerated from the layer\'s subtype coded-value DOMAINS, which is the authoritative legal list. ' +
        'Distinct values from the data return only zones currently mapped and omit adopted-but-unapplied ' +
        `zones. "${PG_ZONE_NOT_ASSIGNED}" is not a zone — it means the county has no answer for that ` +
        'polygon and must route to review rather than read as unzoned.',
    },
  }))

  // ── Dimensional standards, one rule per zone ──────────────────────────────
  for (const [zone, table] of Object.entries(PG_ZONE_DIMENSIONAL_TABLES)) {
    rows.push(row({
      ruleKey: `zoning.dimensional.${zone}`,
      kind: 'CHECK',
      sourceUrl: table.source.url,
      section: table.section,
      effectiveDate: table.source.effectiveDate,
      // Machine extraction from a colspan/rowspan HTML table is reliable enough
      // to draft from and not reliable enough to certify from.
      confidence: table.source.verifiedBy ? 1 : 0.75,
      humanReviewRequired: table.source.verifiedBy == null,
      payload: {
        ...table,
        applicationNote:
          'Standards vary BY USE TYPE within a zone: `values` is positional against `useColumns`. ' +
          'Footnote markers such as "(4)" are retained inside the value string on purpose — "45 (4)" ' +
          'is not the number 45. Parse with parsePgStandardValue(); never coerce blindly.',
      },
    }))
  }

  // Zones the ordinance publishes no dimensional table for — recorded as an
  // explicit absence so a later reader does not read silence as "no standard".
  const missing = PG_ZONES_2022
    .map(z => z.code)
    .filter(code => !(code in PG_ZONE_DIMENSIONAL_TABLES))
  if (missing.length) {
    rows.push(row({
      ruleKey: 'zoning.dimensional.absent',
      kind: 'CHECK',
      sourceUrl: PG_ORDINANCE_SOURCES.councilZoningPortal,
      section: 'Sec. 27-4205',
      confidence: 1,
      humanReviewRequired: true,
      payload: {
        zones: missing,
        reason:
          'Sec. 27-4205 publishes no dimensional table for these zones. Legacy comprehensive-design ' +
          'zones are governed by their prior approved plans, so the envelope must come from the approval, ' +
          'not from a table. This is an absence of a standard, not an absence of a requirement.',
      },
    }))
  }

  // ── Overlays ──────────────────────────────────────────────────────────────
  for (const overlay of PG_OVERLAYS) {
    rows.push(row({
      ruleKey: `zoning.overlay.${overlay.code}`,
      kind: 'CHECK',
      sourceUrl: PG_ORDINANCE_SOURCES.councilZoningPortal,
      section: 'Subtitle 27 — Overlay Zones',
      confidence: 0.9,
      humanReviewRequired: true,
      payload: overlay,
    }))
  }

  // ── Floodplain ────────────────────────────────────────────────────────────
  rows.push(row({
    ruleKey: 'flood.fema_zones',
    kind: 'INPUT_SCHEMA',
    sourceUrl: 'https://msc.fema.gov/portal/home',
    section: 'NFIP flood zone designations',
    effectiveDate: null,
    confidence: 1,
    humanReviewRequired: false,
    payload: {
      zones: PG_FEMA_FLOOD_ZONES,
      note:
        'The effective FIRM panel and its date govern. A zone letter without its panel and effective ' +
        'date is not a floodplain determination.',
    },
  }))

  // ── Subdivision ───────────────────────────────────────────────────────────
  rows.push(row({
    ruleKey: 'subdivision.procedures',
    kind: 'CHECK',
    sourceUrl: PG_SUBDIVISION_SOURCE.subdivisionUrl,
    section: 'Subtitle 24 — Subdivision Regulations',
    confidence: 0.9,
    humanReviewRequired: true,
    payload: { procedures: PG_SUBDIVISION_PROCEDURES, source: PG_SUBDIVISION_SOURCE },
  }))

  rows.push(row({
    ruleKey: 'environment.stream_buffers',
    kind: 'CHECK',
    sourceUrl: PG_SUBDIVISION_SOURCE.subdivisionUrl,
    section: 'Table 24-4303(c)',
    confidence: 0.95,
    humanReviewRequired: true,
    payload: {
      ...PG_REGULATED_STREAM_BUFFERS,
      note:
        'The buffer is measured from the stream feature as delineated in the field, not from a GIS ' +
        'centreline. A buffer plotted off GIS is preliminary.',
    },
  }))

  // ── Tree canopy ───────────────────────────────────────────────────────────
  rows.push(row({
    ruleKey: 'landscape.tree_canopy',
    kind: 'CHECK',
    sourceUrl: PG_SUBDIVISION_SOURCE.landscapeManualUrl,
    section: 'Subtitle 25, Sec. 25-128',
    confidence: 0.4,
    // The percentages in Table 1 could not be retrieved from any published
    // source. The requirement is recorded; the numbers are not invented.
    humanReviewRequired: true,
    payload: PG_TREE_CANOPY_COVERAGE,
  }))

  // ── Review model ──────────────────────────────────────────────────────────
  rows.push(row({
    ruleKey: 'process.review_model',
    kind: 'COMPILED',
    sourceUrl: PG_ORDINANCE_SOURCES.planningDepartment,
    section: null,
    confidence: 1,
    humanReviewRequired: false,
    payload: SITE_PLAN_REVIEW_MODEL,
  }))

  return verifiedAt ? rows.map(r => ({ ...r, lastVerifiedAt: verifiedAt })) : rows
}

export interface RulePackSummary {
  jurisdictionCode: string
  version: number
  ruleCount: number
  requiringHumanReview: number
  /** Rules with no source URL — there should be none. */
  untraceable: string[]
  meanConfidence: number
}

export function summarisePgRulePack(rows: RuleVersionRow[]): RulePackSummary {
  const untraceable = rows.filter(r => !r.sourceUrl).map(r => r.ruleKey)
  return {
    jurisdictionCode: PG_JURISDICTION_CODE,
    version: PG_RULE_PACK_VERSION,
    ruleCount: rows.length,
    requiringHumanReview: rows.filter(r => r.humanReviewRequired).length,
    untraceable,
    meanConfidence: rows.length
      ? rows.reduce((s, r) => s + r.confidence, 0) / rows.length
      : 0,
  }
}

/** Writes the rule pack through any `SitePlanStore`. */
export async function persistPgRulePack(
  store: { upsertRuleVersions(rows: RuleVersionRow[]): Promise<void> },
  opts: { verifiedAt?: string } = {},
): Promise<RulePackSummary> {
  const rows = buildPgRulePack(opts)
  await store.upsertRuleVersions(rows)
  return summarisePgRulePack(rows)
}
