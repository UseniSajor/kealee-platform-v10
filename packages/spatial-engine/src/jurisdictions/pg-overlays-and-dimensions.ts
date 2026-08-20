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
import {
  PG_ZONE_DIMENSIONAL_TABLES,
  PG_ZONES_REQUIRING_MANUAL_TRANSCRIPTION,
  type PgZoneDimensionalTable,
} from './pg-dimensional-standards.generated'

export { PG_ZONE_DIMENSIONAL_TABLES, PG_ZONES_REQUIRING_MANUAL_TRANSCRIPTION }
export type { PgZoneDimensionalTable }

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
 * Dimensional standards per zone, sourced from the adopted Zoning Ordinance.
 *
 * These values are law. They live in Subtitle 27 (effective 2022-04-01) and are
 * published by the county at online.encodeplus.com. They are machine-extracted
 * into `pg-dimensional-standards.generated.ts` and re-exported here.
 *
 * Extraction is a strong starting point, not a signature. Every table reports
 * `verifiedBy: null` until a qualified reviewer signs off, and the lookup keeps
 * returning `requiresProfessionalVerification: true` until then.
 *
 * The county says "yard depth", not "setback". Values retain footnote markers
 * because those carry legal conditions that change the number — use
 * `parsePgStandardValue()` rather than coercing a string to a number.
 */
export interface PgDimensionalLookup {
  /** The ordinance table, when one has been extracted for this zone. */
  table: PgZoneDimensionalTable | null
  /**
   * True until a qualified reviewer signs off. Extraction is machine-made from
   * the county's published ordinance, which is a strong starting point but is
   * not a substitute for professional verification.
   */
  requiresProfessionalVerification: boolean
  unavailableReason?: string
}

/**
 * Look up the dimensional standards table for a zone.
 *
 * Fails closed in both directions: a zone with no extracted table returns null
 * with a reason, and a zone WITH a table still reports
 * `requiresProfessionalVerification` until someone signs off. Callers must not
 * present these as final compliance findings on that basis alone.
 */
export function getPgDimensionalStandards(zoneCode: string): PgDimensionalLookup {
  const code = zoneCode.trim().toUpperCase()
  const table = PG_ZONE_DIMENSIONAL_TABLES[code]

  if (table) {
    return {
      table,
      requiresProfessionalVerification: table.source.verifiedBy == null,
    }
  }

  if (PG_ZONES_REQUIRING_MANUAL_TRANSCRIPTION.includes(code)) {
    return {
      table: null,
      requiresProfessionalVerification: true,
      unavailableReason:
        `${code} publishes its standards in a table with nested Core/Edge column ` +
        'headers (or, for the legacy comprehensive-design zones, no table at all — ' +
        'those are governed by their prior approved plans). Automated extraction ' +
        'would mis-assign columns and produce a wrong buildable envelope, so it has ' +
        'been excluded pending manual transcription against Subtitle 27.',
    }
  }

  return {
    table: null,
    requiresProfessionalVerification: true,
    unavailableReason:
      `No dimensional standards are on file for "${zoneCode}". Confirm the zone ` +
      'code against the current Zoning Ordinance before relying on any envelope.',
  }
}

/**
 * Footnote markers such as "(4)" carry legal conditions that change the number,
 * so values are kept as strings. This parses the bare numeric part and reports
 * whether a footnote applies — it never discards that fact.
 */
export function parsePgStandardValue(value: string): {
  numeric: number | null
  footnotes: string[]
  raw: string
  hasCondition: boolean
} {
  const raw = value.trim()
  const footnotes = [...raw.matchAll(/\((\d+)\)/g)].map(m => m[1])
  const bare = raw.replace(/\(\d+\)/g, '').replace(/,/g, '').trim()
  const numeric = /^-?\d+(\.\d+)?$/.test(bare) ? Number(bare) : null
  return { numeric, footnotes, raw, hasCondition: footnotes.length > 0 }
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
