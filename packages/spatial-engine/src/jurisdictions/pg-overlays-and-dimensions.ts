/**
 * Prince George's County — overlay zones and dimensional standards.
 *
 * Two very different provenance stories live here, and the difference matters:
 *
 *   OVERLAYS      enumerated from the live county layers (observed values).
 *   DIMENSIONS    NOT AVAILABLE from any machine-readable county source.
 *
 * Overlays stack on top of a base zone (see prince-georges-md.ts) and can change
 * what is permitted, so a zoning answer that reports only the base zone is
 * incomplete.
 */

import type { PgZoneCategory } from './prince-georges-md'

// ── Overlay zones ───────────────────────────────────────────────────────────
//
// PROVENANCE CAVEAT: unlike the base-zone list, these layers publish NO
// coded-value domains — every value is free text. So this list is enumerated
// from distinct values actually present in the county's data, which means an
// overlay that has been adopted but not yet mapped would not appear here.
// That is a weaker guarantee than the base-zone registry and is stated
// deliberately rather than papered over.
//
// Verified live 2026-08-20.

export type PgOverlayKind =
  | 'transit_district'
  | 'development_district'
  | 'neighborhood_conservation'
  | 'chesapeake_bay_critical_area'
  | 'military_installation'
  | 'floodplain'

export interface PgOverlay {
  code: string
  name: string
  kind: PgOverlayKind
  /** Layer key in PG_LAYERS, where one is wired. */
  sourceField: string
  /** What a reviewer must check when this overlay applies. */
  reviewNote: string
}

export const PG_OVERLAYS: readonly PgOverlay[] = [
  {
    code: 'T-D-O',
    name: 'Transit District Overlay',
    kind: 'transit_district',
    sourceField: 'OVERLAY_ZONE',
    reviewNote:
      'Development is governed by the adopted Transit District Development Plan, which supersedes underlying base-zone standards. Identify the specific plan and its resolution.',
  },
  {
    code: 'D-D-O',
    name: 'Development District Overlay',
    kind: 'development_district',
    sourceField: 'OVERLAY_ZONE',
    reviewNote:
      'Governed by the adopted Development District Standards in the applicable sector or master plan. Identify the plan, resolution, and adoption date.',
  },
  {
    code: 'NCO',
    name: 'Neighborhood Conservation Overlay',
    kind: 'neighborhood_conservation',
    sourceField: 'OVERLAY_ZONE',
    reviewNote:
      'Adds neighborhood-specific design and compatibility standards on top of the base zone.',
  },
  {
    code: 'I-D-O',
    name: 'Chesapeake Bay Critical Area — Intense Development Overlay',
    kind: 'chesapeake_bay_critical_area',
    sourceField: 'DESIGNATION_TYPE',
    reviewNote:
      'Critical Area law applies: impervious-area limits, 100-ft buffer, and mitigation. Requires Chesapeake Bay Conservation Plan review.',
  },
  {
    code: 'L-D-O',
    name: 'Chesapeake Bay Critical Area — Limited Development Overlay',
    kind: 'chesapeake_bay_critical_area',
    sourceField: 'DESIGNATION_TYPE',
    reviewNote:
      'Critical Area law applies: stricter impervious and woodland-clearing limits than I-D-O. Requires Chesapeake Bay Conservation Plan review.',
  },
  {
    code: 'R-C-O',
    name: 'Chesapeake Bay Critical Area — Resource Conservation Overlay',
    kind: 'chesapeake_bay_critical_area',
    sourceField: 'DESIGNATION_TYPE',
    reviewNote:
      'Most restrictive Critical Area designation — density is severely limited. Requires Chesapeake Bay Conservation Plan review.',
  },
  {
    code: 'MIOZ-SAFETY',
    name: 'Military Installation Overlay — Safety (Accident Potential)',
    kind: 'military_installation',
    sourceField: 'TYPE_CODE',
    reviewNote:
      'Joint Base Andrews accident-potential zone. Use restrictions and density limits apply; coordinate with the installation.',
  },
  {
    code: 'MIOZ-NOISE',
    name: 'Military Installation Overlay — Noise',
    kind: 'military_installation',
    sourceField: 'NOISE_INTENSITY_ZONE',
    reviewNote:
      'Noise Intensity Zone or High Noise Intensity Zone. Sound-attenuation construction standards and use restrictions apply.',
  },
  {
    code: 'MIOZ-HEIGHT',
    name: 'Military Installation Overlay — Height (Imaginary Surfaces)',
    kind: 'military_installation',
    sourceField: 'ZONE_USE',
    reviewNote:
      'Airspace imaginary surfaces (primary, transitional 7:1, conical 20:1, approach/departure 50:1, inner horizontal). Building height is limited by the controlling surface, not by the base zone.',
  },
  {
    code: 'FLOOD-DPIE',
    name: 'Floodplain (DPIE)',
    kind: 'floodplain',
    sourceField: 'FLOOD',
    reviewNote:
      'County-mapped floodplain. Triggers floodplain review and may prohibit development in the floodway.',
  },
]

/**
 * FEMA flood zone designations present in the county layer. These are FEMA
 * national standards, not county-defined.
 */
export const PG_FEMA_FLOOD_ZONES: Record<string, string> = {
  A: 'Special Flood Hazard Area, 1% annual chance, no base flood elevation determined',
  AE: 'Special Flood Hazard Area, 1% annual chance, base flood elevation determined',
  AH: 'Special Flood Hazard Area, shallow ponding, 1–3 ft',
  AO: 'Special Flood Hazard Area, sheet flow, 1–3 ft',
  VE: 'Coastal high hazard area with wave action, base flood elevation determined',
  X: 'Outside the 0.2% annual chance floodplain, or reduced risk due to levee',
  'OPEN WATER': 'Open water',
}

/** True for FEMA zones inside the Special Flood Hazard Area. */
export function isSpecialFloodHazardArea(fldZone: string | null | undefined): boolean {
  if (!fldZone) return false
  return ['A', 'AE', 'AH', 'AO', 'VE'].includes(fldZone.trim().toUpperCase())
}

export function pgOverlay(code: string): PgOverlay | null {
  const target = code.trim().toUpperCase()
  return PG_OVERLAYS.find(o => o.code.toUpperCase() === target) ?? null
}

// ── Dimensional standards ───────────────────────────────────────────────────

/**
 * Minimum lot area, width, setbacks, height, coverage and density per zone.
 *
 * INTENTIONALLY EMPTY.
 *
 * These values are law. They live in Subtitle 27 of the Prince George's County
 * Code (Zoning Ordinance, effective 2022-04-01) and are published only as legal
 * text — the county's GIS services carry zone geometry and classification, not
 * dimensional standards, and the "Visual Guide to Zoning Categories" is a
 * graphical overview brochure that contains none of these tables.
 *
 * They must therefore be transcribed from the ordinance with a section citation
 * and signed off by a reviewer before the platform quotes them. Populating this
 * map from memory or from a model's recollection would fabricate a regulatory
 * value — the single thing this engine must never do. A wrong setback produces a
 * site plan that gets rejected at permit review, or worse, a building sited
 * illegally.
 *
 * Until an entry exists, `getPgDimensionalStandards()` returns null and callers
 * must degrade to "requires manual verification against Subtitle 27" rather than
 * emit a dimensional compliance finding.
 */
export interface PgDimensionalStandards {
  zoneCode: string
  category: PgZoneCategory
  minLotAreaSqFt: number | null
  minLotWidthFt: number | null
  minFrontSetbackFt: number | null
  minSideSetbackFt: number | null
  minRearSetbackFt: number | null
  maxHeightFt: number | null
  maxLotCoveragePercent: number | null
  maxDensityUnitsPerAcre: number | null
  /** Required provenance — no entry may exist without all of these. */
  source: {
    /** e.g. "Prince George's County Code, Subtitle 27, § 27-4202" */
    citation: string
    documentUrl: string
    effectiveDate: string
    /** Who transcribed and verified it. */
    verifiedBy: string
    verifiedAt: string
  }
}

/** Populated only by reviewed transcription. Empty is the correct current state. */
export const PG_DIMENSIONAL_STANDARDS: Readonly<Record<string, PgDimensionalStandards>> = {}

export interface PgDimensionalLookup {
  standards: PgDimensionalStandards | null
  /** Present whenever standards are unavailable. */
  unavailableReason?: string
  requiresManualVerification: boolean
}

/**
 * Look up dimensional standards for a zone. Fails closed: an unknown zone and a
 * not-yet-transcribed zone both return `requiresManualVerification: true` rather
 * than a guess.
 */
export function getPgDimensionalStandards(zoneCode: string): PgDimensionalLookup {
  const standards = PG_DIMENSIONAL_STANDARDS[zoneCode.trim().toUpperCase()]
  if (standards) return { standards, requiresManualVerification: false }
  return {
    standards: null,
    requiresManualVerification: true,
    unavailableReason:
      `Dimensional standards for ${zoneCode} have not been transcribed from Subtitle 27 ` +
      'of the Prince George\'s County Code and verified by a reviewer. Kealee does not ' +
      'publish setback, lot, height, coverage or density values it has not sourced. ' +
      'A qualified reviewer must confirm these against the adopted Zoning Ordinance.',
  }
}

/** Where a reviewer should go to transcribe the standards. */
export const PG_ORDINANCE_SOURCES = {
  codeOfOrdinances:
    "https://library.municode.com/md/prince_george's_county/codes/code_of_ordinances",
  councilZoningPortal: 'https://pgccouncil.us/589/Zoning-Ordinance-Portal',
  visualGuideToZoningCategories:
    'https://pgccouncil.us/DocumentCenter/View/4056/Visual-Guide-to-Zoning-Categories-',
  planningDepartment: 'https://www.pgplanning.org/focus-areas/land-use-zoning/',
  subtitle: 'Subtitle 27 — Zoning Ordinance (effective 2022-04-01)',
} as const
