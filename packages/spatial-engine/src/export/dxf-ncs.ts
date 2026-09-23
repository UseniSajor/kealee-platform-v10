/**
 * DXF export to the US National CAD Standard layer convention.
 *
 * Why this replaces the hand-written R12 writer:
 *
 * R12 carries no linetypes, no lineweights and no text. That is not a cosmetic
 * limitation. `docs/site-plan-reference/APPROVED-PLAN-ANALYSIS.md` records that
 * an approved Prince George's sheet draws EXISTING contours thin and dashed
 * against heavier proposed work — a distinction R12 cannot express, so every
 * line the engine exported arrived in the consulting engineer's CAD at the same
 * weight and the same continuous linetype. The receiving professional then has
 * to re-layer the drawing before they can work, which defeats the point of the
 * export.
 *
 * Layer names follow the NCS / AIA CAD Layer Guidelines field structure:
 *
 *     <discipline>-<major group>-<minor group>[-<status>]
 *     C-TOPO-MAJR-E   civil, topography, major contour, existing
 *     V-PROP-BNDY     survey, property, boundary
 *     C-BLDG-FTPR-N   civil, building, footprint, new
 *
 * The status field is what makes a set readable: a reviewer distinguishes what
 * is there from what is proposed by layer, not by guessing from colour.
 *
 * The previous writer's layer names are preserved where they were already
 * conformant. Where they were not — `C-LOD`, `C-SWM`, `C-DEMO`, `C-TOPO-MAJR`
 * with no status — they are corrected here and the old name is recorded in
 * `LEGACY_LAYER_ALIASES` so a diff against an older export is explainable.
 */

import { DxfWriter, point3d } from '@tarikjabiri/dxf'
import type { SiteTwin, SiteFeature, Ring } from '../site-plan/site-twin'

// ── Linetypes ───────────────────────────────────────────────────────────────
//
// Pattern elements are in drawing units (feet here). A dash pattern sized for
// millimetres disappears on a 1"=10' site plan, so these are sized for the
// scales this engine actually composes at.

interface LineTypeDef { name: string; description: string; elements: number[] }

const LINETYPES: LineTypeDef[] = [
  { name: 'CONTINUOUS', description: 'Solid line', elements: [] },
  { name: 'DASHED', description: 'Dashed __ __ __ __ __ __', elements: [4, -2] },
  { name: 'HIDDEN', description: 'Hidden __ __ __ __ __', elements: [2, -1] },
  { name: 'PHANTOM', description: 'Phantom ____ _ _ ____ _ _', elements: [8, -1, 1, -1, 1, -1] },
  { name: 'DASHDOT', description: 'Dash dot __ . __ . __ .', elements: [4, -2, 0, -2] },
]

// ── Lineweights ─────────────────────────────────────────────────────────────
//
// DXF lineweight is an integer in hundredths of a millimetre. These are the
// pen weights the approved plans use, read off the analysis document.

const LW = {
  hairline: 9,   // 0.09 mm — annotation, hatch
  thin: 13,      // 0.13 mm — existing minor contour
  light: 18,     // 0.18 mm — existing major contour, planting
  medium: 25,    // 0.25 mm — setbacks, paving, demolition
  heavy: 35,     // 0.35 mm — proposed grading, utilities
  bold: 50,      // 0.50 mm — property boundary, building footprint
} as const

export interface NcsLayer {
  /** NCS layer name. */
  name: string
  /** AutoCAD Color Index. */
  color: number
  lineType: string
  /** Hundredths of a millimetre. */
  lineWeight: number
  /** What the layer is for, printed into the DXF layer description. */
  purpose: string
}

/**
 * The layer table. One entry per `SiteFeature.kind` the twin can carry.
 *
 * Every feature the engine can produce must appear here. An unmapped kind
 * lands on `C-ANNO-NPLT` with a warning rather than silently sharing a layer
 * with unrelated geometry — a reviewer who finds a stormwater practice on the
 * property line layer has no way to tell it was a mapping gap.
 */
export const NCS_LAYERS: Record<string, NcsLayer> = {
  Parcel: {
    name: 'V-PROP-BNDY', color: 7, lineType: 'CONTINUOUS', lineWeight: LW.bold,
    purpose: 'Property boundary of record',
  },
  BoundarySegment: {
    name: 'V-PROP-BNDY', color: 7, lineType: 'CONTINUOUS', lineWeight: LW.bold,
    purpose: 'Property boundary course',
  },
  Easement: {
    name: 'V-PROP-ESMT', color: 5, lineType: 'DASHDOT', lineWeight: LW.medium,
    purpose: 'Recorded easement',
  },
  Setback: {
    // The county draws and labels this as a Building Restriction Line.
    name: 'C-PROP-BRL', color: 2, lineType: 'DASHED', lineWeight: LW.medium,
    purpose: 'Building Restriction Line (setback)',
  },
  Building: {
    name: 'C-BLDG-FTPR-N', color: 6, lineType: 'CONTINUOUS', lineWeight: LW.bold,
    purpose: 'Proposed building footprint',
  },
  DemolitionFeature: {
    name: 'C-BLDG-FTPR-D', color: 1, lineType: 'HIDDEN', lineWeight: LW.medium,
    purpose: 'Existing structure to be demolished',
  },
  Contour: {
    // Existing grade from county 2-ft contours: thin and dashed, per the
    // approved-plan analysis. Proposed grade is a different kind and layer.
    name: 'C-TOPO-MAJR-E', color: 32, lineType: 'DASHED', lineWeight: LW.light,
    purpose: 'Existing major contour (county 2-ft, NAVD88)',
  },
  // TWIN GAP: `SiteFeature` has a single `Contour` kind, so the engine cannot
  // today distinguish EXISTING county contours from PROPOSED grading. The
  // approved-plan convention needs both (existing thin/dashed against heavier
  // proposed), so the layers are declared here and the C-400 grading work will
  // add the kinds. Declaring them keeps the convention visible instead of
  // losing it in a comment.
  MinorContour: {
    name: 'C-TOPO-MINR-E', color: 33, lineType: 'DASHED', lineWeight: LW.thin,
    purpose: 'Existing minor contour — not yet emitted by the twin',
  },
  ProposedContour: {
    name: 'C-TOPO-MAJR-N', color: 3, lineType: 'CONTINUOUS', lineWeight: LW.heavy,
    purpose: 'Proposed major contour — not yet emitted by the twin',
  },
  Breakline: {
    name: 'C-TOPO-BRKL', color: 33, lineType: 'CONTINUOUS', lineWeight: LW.thin,
    purpose: 'Grading breakline',
  },
  Surface: {
    // A TIN is surface MODEL data, not a plotted line. It belongs in the DXF
    // for the receiving engineer's software and off the plotted sheet.
    name: 'C-TOPO-SURF', color: 253, lineType: 'CONTINUOUS', lineWeight: LW.hairline,
    purpose: 'Terrain surface model (TIN) — model data, not plotted',
  },
  ExistingFeature: {
    name: 'C-SITE-E', color: 251, lineType: 'CONTINUOUS', lineWeight: LW.medium,
    purpose: 'Existing site feature to remain',
  },
  Structure: {
    name: 'C-BLDG-OTLN-E', color: 251, lineType: 'CONTINUOUS', lineWeight: LW.medium,
    purpose: 'Existing structure',
  },
  ParkingSpace: {
    name: 'C-PKNG-STRP', color: 8, lineType: 'CONTINUOUS', lineWeight: LW.thin,
    purpose: 'Parking space striping',
  },
  Sidewalk: {
    name: 'C-PVMT-WALK', color: 8, lineType: 'CONTINUOUS', lineWeight: LW.medium,
    purpose: 'Sidewalk and walkway',
  },
  Floodplain: {
    name: 'C-NENV-FLDP', color: 141, lineType: 'DASHED', lineWeight: LW.medium,
    purpose: 'FEMA floodplain / floodway limit',
  },
  Woodland: {
    name: 'L-PLNT-WOOD', color: 94, lineType: 'PHANTOM', lineWeight: LW.light,
    purpose: 'Woodland conservation area',
  },
  SpotElevation: {
    name: 'C-TOPO-SPOT', color: 7, lineType: 'CONTINUOUS', lineWeight: LW.hairline,
    purpose: 'Spot elevation',
  },
  LimitOfDisturbance: {
    name: 'C-LODS', color: 30, lineType: 'PHANTOM', lineWeight: LW.heavy,
    purpose: 'Limit of disturbance',
  },
  EnvironmentalBuffer: {
    name: 'C-NENV-BUFR', color: 94, lineType: 'DASHED', lineWeight: LW.medium,
    purpose: 'Environmental buffer (stream, wetland, Critical Area)',
  },
  Utility: {
    name: 'C-UTIL', color: 4, lineType: 'DASHED', lineWeight: LW.heavy,
    purpose: 'Utility — see ASCE 38 quality level note',
  },
  StormPipe: {
    name: 'C-STRM-PIPE', color: 4, lineType: 'CONTINUOUS', lineWeight: LW.heavy,
    purpose: 'Storm drainage pipe',
  },
  SWMPractice: {
    name: 'C-SWMG', color: 92, lineType: 'CONTINUOUS', lineWeight: LW.heavy,
    purpose: 'Stormwater management practice',
  },
  DrainageArea: {
    name: 'C-STRM-AREA', color: 150, lineType: 'PHANTOM', lineWeight: LW.thin,
    purpose: 'Drainage area boundary',
  },
  // Declared ahead of the twin: the C-700 sheet needs these and the layer
  // table should not be the thing that blocks it. No feature carries these
  // kinds yet, so they will not appear in an export until one does.
  SedimentControl: {
    name: 'C-SESC', color: 11, lineType: 'DASHDOT', lineWeight: LW.medium,
    purpose: 'Sediment and erosion control measure (not yet emitted by the twin)',
  },
  Pavement: {
    name: 'C-PVMT', color: 8, lineType: 'CONTINUOUS', lineWeight: LW.medium,
    purpose: 'Paving, driveway and walk',
  },
  StreetCenterline: {
    name: 'C-ROAD-CNTR', color: 9, lineType: 'DASHDOT', lineWeight: LW.thin,
    purpose: 'Street centreline (not yet emitted by the twin)',
  },
  Tree: {
    name: 'L-PLNT-TREE', color: 90, lineType: 'CONTINUOUS', lineWeight: LW.light,
    purpose: 'Tree and planting',
  },
  ProposedFeature: {
    name: 'C-SITE-N', color: 6, lineType: 'CONTINUOUS', lineWeight: LW.heavy,
    purpose: 'Proposed site improvement',
  },
}

/** Where geometry lands when its kind has no mapping. Non-plotting by name. */
export const UNMAPPED_LAYER: NcsLayer = {
  name: 'C-ANNO-NPLT', color: 250, lineType: 'CONTINUOUS', lineWeight: LW.hairline,
  purpose: 'UNMAPPED feature kind — mapping gap, do not plot',
}

/**
 * Layer names the previous R12 writer used, kept so a diff between an old and
 * a new export is explainable rather than alarming.
 */
export const LEGACY_LAYER_ALIASES: Record<string, string> = {
  'V-PROP-LINE': 'V-PROP-BNDY',
  'V-PROP-SBCK': 'C-PROP-BRL',
  'A-BLDG-OTLN': 'C-BLDG-FTPR-N',
  'C-LOD': 'C-LODS',
  'C-SWM': 'C-SWMG',
  'C-DEMO': 'C-BLDG-FTPR-D',
  'C-DRNG-AREA': 'C-STRM-AREA',
  'C-TOPO-MAJR': 'C-TOPO-MAJR-E',
  'C-PROP': 'C-SITE-N',
  'C-MISC': 'C-ANNO-NPLT',
}

export function ncsLayerFor(kind: string): NcsLayer {
  return NCS_LAYERS[kind] ?? UNMAPPED_LAYER
}

/** Feature kinds with no layer mapping. Used by tests and by the QC report. */
export function unmappedKinds(twin: SiteTwin): string[] {
  const seen = new Set<string>()
  for (const f of twin.features) if (!NCS_LAYERS[f.kind]) seen.add(f.kind)
  return [...seen].sort()
}

// ── Writer ──────────────────────────────────────────────────────────────────

/**
 * Professional document status, stamped INTO the CAD file.
 *
 * A DXF handed to a consulting engineer travels on its own. The status cannot
 * live only in the portal that served it: the moment the file is emailed on,
 * the context is gone. No automated process may represent a drawing as sealed,
 * so the only statuses this writer can stamp are the unsealed ones.
 */
export type CadDocumentStatus =
  | 'INTERNAL_DRAFT'
  | 'REVIEW_COPY'
  | 'PRELIMINARY_NOT_FOR_CONSTRUCTION'
  | 'PROFESSIONALLY_REVIEWED_UNSEALED'

const STATUS_TEXT: Record<CadDocumentStatus, string> = {
  INTERNAL_DRAFT:
    'INTERNAL DRAFT - NOT REVIEWED - NOT FOR CONSTRUCTION OR PERMIT SUBMISSION',
  REVIEW_COPY:
    'REVIEW COPY - UNDER PROFESSIONAL REVIEW - NOT FOR CONSTRUCTION OR PERMIT SUBMISSION',
  PRELIMINARY_NOT_FOR_CONSTRUCTION:
    'PRELIMINARY - NOT SEALED - NOT FOR CONSTRUCTION OR PERMIT SUBMISSION',
  PROFESSIONALLY_REVIEWED_UNSEALED:
    'PROFESSIONALLY REVIEWED - NOT SEALED - NOT FOR CONSTRUCTION OR PERMIT SUBMISSION',
}

export interface DxfExportOptions {
  /** Defaults to PRELIMINARY. There is no SEALED option, deliberately. */
  status?: CadDocumentStatus
  /** Coordinate reference system the twin's coordinates are in, for the stamp. */
  crs?: string | null
  /** Vertical datum of any Z values, for the stamp. */
  verticalDatum?: string | null
  /** Free-text provenance line, e.g. which sources produced the geometry. */
  provenance?: string | null
}

export interface DxfExportResult {
  dxf: string
  /** Layers actually written, for the manifest and for review. */
  layers: string[]
  /** Feature kinds that had no mapping and landed on the non-plot layer. */
  unmapped: string[]
  entityCount: number
  /** The status stamped into the file. Never SEALED. */
  status: CadDocumentStatus
}

type GeometryBearing = { ring?: Ring; line?: number[][]; point?: number[] }

/**
 * Writes the twin as DXF with NCS layers, linetypes and lineweights.
 *
 * Coordinates are written in the twin's own CRS and units — EPSG:2248, US
 * survey feet for Prince George's County. The export does NOT reproject:
 * geometry of record stays on the grid the county published it on, and the
 * receiving professional is told which CRS that is rather than being handed
 * silently shifted coordinates.
 */
export function toDxfNcs(twin: SiteTwin, options: DxfExportOptions = {}): DxfExportResult {
  const dxf = new DxfWriter()
  const status = options.status ?? 'PRELIMINARY_NOT_FOR_CONSTRUCTION'

  for (const lt of LINETYPES) {
    if (lt.name === 'CONTINUOUS') continue // present by default
    dxf.addLType(lt.name, lt.description, lt.elements)
  }

  // Only declare the layers this drawing uses. A table full of empty layers is
  // noise in the recipient's layer manager.
  const used = new Map<string, NcsLayer>()
  for (const f of twin.features) {
    const l = ncsLayerFor(f.kind)
    used.set(l.name, l)
  }
  for (const l of [...used.values()].sort((a, b) => a.name.localeCompare(b.name))) {
    const layer = dxf.addLayer(l.name, l.color, l.lineType)
    // The library models lineweight as a property on the layer record.
    ;(layer as unknown as { lineWeight?: number }).lineWeight = l.lineWeight
  }

  // The status stamp lives on the non-plot annotation layer: present in the
  // file and in the recipient's layer manager, absent from a plot. The layer
  // is declared unconditionally because the stamp is unconditional.
  if (!used.has(UNMAPPED_LAYER.name)) {
    dxf.addLayer(UNMAPPED_LAYER.name, UNMAPPED_LAYER.color, UNMAPPED_LAYER.lineType)
    used.set(UNMAPPED_LAYER.name, UNMAPPED_LAYER)
  }
  const stampLines = [
    STATUS_TEXT[status],
    `GENERATED ${new Date().toISOString()} BY KEALEE SITE PLAN ENGINE`,
    options.crs ? `HORIZONTAL: ${options.crs}` : null,
    options.verticalDatum ? `VERTICAL: ${options.verticalDatum}` : null,
    options.provenance ? `SOURCES: ${options.provenance}` : null,
    'THIS FILE IS DATA FOR A LICENSED PROFESSIONAL. IT IS NOT A SEALED DRAWING.',
  ].filter((l): l is string => Boolean(l))

  // Placed below the drawing extent so the stamp never overlaps geometry.
  const ys = twin.features.flatMap(f => {
    const g = f as unknown as GeometryBearing
    const cs = g.ring?.coordinates ?? g.line ?? (g.point ? [g.point] : [])
    return cs.map(c => c[1])
  })
  const xs = twin.features.flatMap(f => {
    const g = f as unknown as GeometryBearing
    const cs = g.ring?.coordinates ?? g.line ?? (g.point ? [g.point] : [])
    return cs.map(c => c[0])
  })
  const baseX = xs.length ? Math.min(...xs) : 0
  const baseY = ys.length ? Math.min(...ys) - 20 : 0
  stampLines.forEach((line, i) => {
    dxf.addText(point3d(baseX, baseY - i * 4, 0), 2.5, line, { layerName: UNMAPPED_LAYER.name })
  })

  let entityCount = 0
  for (const f of twin.features) {
    const l = ncsLayerFor(f.kind)
    const g = f as unknown as GeometryBearing
    const coords = g.ring?.coordinates ?? g.line

    if (coords && coords.length > 1) {
      const vertices = coords.map(p => ({ point: { x: p[0], y: p[1] } }))
      dxf.addLWPolyline(vertices, {
        layerName: l.name,
        // A ring closes; an open line does not. Closing an open feature draws
        // a boundary that does not exist.
        flags: g.ring ? 1 : 0,
      })
      entityCount++
    } else if (g.point) {
      dxf.addPoint(g.point[0], g.point[1], g.point[2] ?? 0, { layerName: l.name })
      entityCount++
    }
  }

  return {
    dxf: dxf.stringify(),
    layers: [...used.keys()].sort(),
    unmapped: unmappedKinds(twin),
    entityCount,
    status,
  }
}

/**
 * Every `SiteFeature['kind']` the twin can carry.
 *
 * Kept as a value, not inferred, so the exhaustiveness test can compare the
 * layer table against it. When a kind is added to `site-twin.ts` and not here,
 * the test fails — which is the point: geometry with no layer is geometry the
 * recipient will not find.
 */
export const ALL_FEATURE_KINDS = [
  'Parcel', 'BoundarySegment', 'Easement', 'Building', 'Setback',
  'EnvironmentalBuffer', 'Floodplain', 'Woodland', 'Tree',
  'LimitOfDisturbance',
  'ExistingFeature', 'ProposedFeature', 'Surface', 'Contour', 'Breakline',
  'SpotElevation', 'Pavement', 'ParkingSpace', 'Sidewalk', 'Utility',
  'StormPipe', 'Structure', 'DrainageArea', 'SWMPractice', 'DemolitionFeature',
] as const

/** Kinds declared in the layer table that the twin cannot yet produce. */
export const FORWARD_DECLARED_LAYERS = [
  'SedimentControl', 'StreetCenterline', 'MinorContour', 'ProposedContour',
] as const
