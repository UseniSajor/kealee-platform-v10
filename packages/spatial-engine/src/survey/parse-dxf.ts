/**
 * DXF ingestion, and the DWG adapter path.
 *
 * A DXF from a surveyor is the second-best import after a coordinate file: it
 * carries linework and layer semantics, but it carries NO coordinate reference
 * system. AutoCAD stores bare numbers. So this parser never claims to know the
 * CRS — at most it reports a candidate inferred from coordinate magnitude, and
 * the import stays unconfirmed until a human states the CRS.
 *
 * Layers are the survey's own classification and are preserved verbatim. They
 * are mapped to twin object types, not flattened into generic linework.
 */

import {
  PARSER_VERSION,
  type SurveyImportRecord,
  type SurveyPoint,
  type SurveyPointClass,
  type SurveyFormat,
} from './import-record'

export interface DxfEntity {
  type: string
  layer: string
  /** Vertices in file coordinates, x=easting-like, y=northing-like. */
  vertices: [number, number, number | null][]
  closed: boolean
  text?: string
  /** Every group code seen on the entity, so nothing is silently discarded. */
  raw: Record<number, string[]>
}

export interface DxfParseResult {
  record: SurveyImportRecord
  entities: DxfEntity[]
  points: SurveyPoint[]
  layers: DxfLayerSummary[]
  header: Record<string, string>
}

export interface DxfLayerSummary {
  name: string
  entityCount: number
  mappedTo: DxfLayerRole
  /** Why the layer was mapped as it was — shown in the import report. */
  rationale: string
}

export type DxfLayerRole =
  | 'boundary'
  | 'right_of_way'
  | 'easement'
  | 'building'
  | 'pavement'
  | 'contour_major'
  | 'contour_minor'
  | 'spot_elevation'
  | 'breakline'
  | 'utility'
  | 'storm'
  | 'sanitary'
  | 'water'
  | 'tree'
  | 'monument'
  | 'text_annotation'
  | 'unclassified'

/**
 * Layer-name patterns. AIA/NCS layer names (V-PROP-BNDY, C-TOPO-MAJR) are the
 * common case; surveyors also ship idiosyncratic names, which fall through to
 * `unclassified` rather than being guessed at.
 */
const LAYER_PATTERNS: { re: RegExp; role: DxfLayerRole; why: string }[] = [
  { re: /^(V-)?(PROP-)?(BNDY|BOUND|BOUNDARY|PL|PROPLINE)/i, role: 'boundary', why: 'NCS V-PROP-BNDY boundary layer' },
  { re: /\b(ROW|R-O-W|RIGHT.?OF.?WAY)\b/i, role: 'right_of_way', why: 'right-of-way layer name' },
  { re: /\b(ESMT|EASE|EASEMENT)\b/i, role: 'easement', why: 'easement layer name' },
  { re: /^(A-)?(BLDG|BUILDING|STRUCT)/i, role: 'building', why: 'building/structure layer' },
  { re: /\b(EOP|PAVE|PAVEMENT|CURB|DRIVE|ASPH|CONC)\b/i, role: 'pavement', why: 'pavement/edge-of-pavement layer' },
  // NCS writes contours as C-TOPO-MAJR / C-TOPO-MINR; other offices write CONT.
  { re: /\b(TOPO|CONT(OUR)?)\b.*\b(MAJR|MAJOR|INDEX)\b|\b(MAJR|MAJOR|INDEX)\b.*\b(TOPO|CONT(OUR)?)\b/i,
    role: 'contour_major', why: 'index contour layer' },
  { re: /\b(TOPO|CONT(OUR)?)\b.*\b(MINR|MINOR|INTM|INTERMEDIATE)\b|\b(MINR|MINOR|INTM)\b.*\b(TOPO|CONT(OUR)?)\b/i,
    role: 'contour_minor', why: 'intermediate contour layer' },
  { re: /\b(CONT(OUR)?|TOPO)\b/i, role: 'contour_minor', why: 'contour layer, interval not stated in the layer name' },
  { re: /\b(SPOT|SPTEL|ELEV|GRD|GRADE)\b/i, role: 'spot_elevation', why: 'spot-elevation layer' },
  { re: /\b(BRKLN|BREAK|BREAKLINE)\b/i, role: 'breakline', why: 'breakline layer' },
  { re: /\b(STM|STORM|SD)\b/i, role: 'storm', why: 'storm drainage layer' },
  { re: /\b(SAN|SEWER|SS)\b/i, role: 'sanitary', why: 'sanitary sewer layer' },
  { re: /\b(WAT|WTR|WATER|WM)\b/i, role: 'water', why: 'water main layer' },
  { re: /\b(UTIL|UTILITY|GAS|ELEC|TELE|COMM)\b/i, role: 'utility', why: 'utility layer' },
  { re: /\b(TREE|VEG|LAND(SCAPE)?)\b/i, role: 'tree', why: 'vegetation layer' },
  { re: /\b(MON|MONU|IPF|IRF|IRON|CONTROL|CTRL)\b/i, role: 'monument', why: 'monument/control layer' },
  { re: /\b(TEXT|ANNO|LABEL|NOTE|DIM)\b/i, role: 'text_annotation', why: 'annotation layer' },
]

export function classifyDxfLayer(name: string): { role: DxfLayerRole; rationale: string } {
  for (const p of LAYER_PATTERNS) {
    if (p.re.test(name)) return { role: p.role, rationale: p.why }
  }
  return {
    role: 'unclassified',
    rationale: 'Layer name matched no known convention. Retained verbatim for manual mapping — not guessed at.',
  }
}

const ROLE_TO_POINT_CLASS: Partial<Record<DxfLayerRole, SurveyPointClass>> = {
  monument: 'boundary_monument',
  spot_elevation: 'spot_elevation',
  tree: 'tree',
  utility: 'utility_structure',
  storm: 'drainage_structure',
  sanitary: 'utility_structure',
  water: 'utility_structure',
  building: 'building_corner',
  pavement: 'pavement',
}

/** Group-code pairs. DXF is strictly two lines per record: code, then value. */
interface Pair { code: number; value: string }

export function tokenizeDxf(text: string): Pair[] {
  const lines = text.split(/\r\n|\r|\n/)
  const out: Pair[] = []
  for (let i = 0; i + 1 < lines.length; i += 2) {
    const code = Number(lines[i].trim())
    if (!Number.isFinite(code)) {
      // Misaligned file — resync by scanning forward for a plausible code line.
      let j = i
      while (j < lines.length && !/^\s*\d+\s*$/.test(lines[j])) j++
      if (j >= lines.length - 1) break
      i = j - 2
      continue
    }
    out.push({ code, value: lines[i + 1] })
  }
  return out
}

/** Coordinate magnitude heuristic. Reported as a CANDIDATE only, never as CRS. */
export function suggestCrsFromExtents(
  minX: number, minY: number, maxX: number, maxY: number,
): { candidateCrs: string | null; rationale: string } {
  const spanX = maxX - minX, spanY = maxY - minY
  if (!Number.isFinite(spanX) || !Number.isFinite(spanY)) {
    return { candidateCrs: null, rationale: 'No usable coordinate extents.' }
  }
  // Maryland State Plane, US survey feet: easting ~1.2M-1.4M, northing ~400k-800k.
  if (minX > 1_100_000 && maxX < 1_500_000 && minY > 350_000 && maxY < 900_000) {
    return {
      candidateCrs: 'EPSG:2248',
      rationale:
        'Coordinate magnitudes are consistent with NAD83 Maryland State Plane (US survey feet). ' +
        'This is a magnitude heuristic only and must be confirmed by the surveyor — several ' +
        'state plane zones share this range.',
    }
  }
  if (Math.abs(minX) <= 180 && Math.abs(maxX) <= 180 && Math.abs(minY) <= 90 && Math.abs(maxY) <= 90) {
    return {
      candidateCrs: 'EPSG:4326',
      rationale: 'Coordinates are within geographic degree bounds. Axis order in DXF is ambiguous; confirm before use.',
    }
  }
  if (maxX < 100_000 && maxY < 100_000 && minX > -100_000 && minY > -100_000) {
    return {
      candidateCrs: null,
      rationale:
        'Coordinates are small and consistent with an assumed local grid (a common surveyor practice). ' +
        'No CRS can be inferred; the surveyor must supply the tie to a published system.',
    }
  }
  return { candidateCrs: null, rationale: 'Coordinate magnitudes match no recognised system.' }
}

const INSUNITS: Record<string, SurveyImportRecord['coordinateUnit']> = {
  '1': 'foot', '2': 'foot', '6': 'metre', '21': 'usSurveyFoot',
}

export interface ParseDxfOptions {
  filename: string
  checksum: string
  uploadedAt: string
  /** Format label — 'dwg' when the file arrived as DWG and was converted. */
  format?: SurveyFormat
  /** Conversion step to record when the source was DWG. */
  conversion?: { tool: string; version: string }
  surveyDate?: string | null
  surveyor?: SurveyImportRecord['surveyor']
  seal?: SurveyImportRecord['seal']
  /** Human-confirmed CRS. Absent means the import stays unconfirmed. */
  confirmCrs?: { crs: string; horizontalDatum: string; verticalDatum?: string | null; confirmedBy: string }
}

export function parseDxf(text: string, opts: ParseDxfOptions): DxfParseResult {
  const pairs = tokenizeDxf(text)
  const warnings: string[] = []
  const header: Record<string, string> = {}
  const entities: DxfEntity[] = []

  // ── HEADER variables ──────────────────────────────────────────────────────
  for (let i = 0; i < pairs.length; i++) {
    if (pairs[i].code === 9) {
      const name = pairs[i].value.trim()
      const next = pairs[i + 1]
      if (next) header[name] = next.value.trim()
    }
    if (pairs[i].code === 0 && pairs[i].value.trim() === 'ENDSEC' && header.$INSUNITS !== undefined) break
  }

  // ── ENTITIES section ──────────────────────────────────────────────────────
  let inEntities = false
  let current: DxfEntity | null = null
  // POLYLINE accumulates its vertices from following VERTEX entities.
  let polylineOpen: DxfEntity | null = null

  // Coordinates are resolved from the raw group codes in a second pass, so an
  // entity is kept here whenever it carried ANY content. Testing `vertices`
  // at this point would discard every entity in the file.
  const push = (e: DxfEntity | null) => {
    if (!e) return
    if (Object.keys(e.raw).length > 0 || e.text !== undefined) entities.push(e)
  }

  for (let i = 0; i < pairs.length; i++) {
    const { code, value } = pairs[i]
    if (code === 0) {
      const kind = value.trim()
      if (kind === 'SECTION') {
        // The section name is the very next pair: (0, SECTION) then (2, NAME).
        const secName = pairs[i + 1]?.value?.trim()
        inEntities = secName === 'ENTITIES'
        continue
      }
      if (kind === 'ENDSEC') {
        if (inEntities) { push(current); current = null; polylineOpen = null }
        inEntities = false
        continue
      }
      if (!inEntities) continue

      if (kind === 'VERTEX' && polylineOpen) {
        // Vertex coordinates land on the open POLYLINE, not a separate entity.
        current = { type: 'VERTEX', layer: polylineOpen.layer, vertices: [], closed: false, raw: {} }
        continue
      }
      if (kind === 'SEQEND') {
        if (current?.type === 'VERTEX' && polylineOpen && current.vertices.length) {
          polylineOpen.vertices.push(...current.vertices)
        }
        push(polylineOpen)
        polylineOpen = null
        current = null
        continue
      }
      // Flush whatever we were building.
      if (current?.type === 'VERTEX' && polylineOpen && current.vertices.length) {
        polylineOpen.vertices.push(...current.vertices)
        current = null
        continue
      }
      push(current)
      current = { type: kind, layer: '0', vertices: [], closed: false, raw: {} }
      if (kind === 'POLYLINE') { polylineOpen = current; }
      continue
    }
    if (!inEntities || !current) continue

    ;(current.raw[code] ||= []).push(value)

    switch (code) {
      case 8: current.layer = value.trim(); if (polylineOpen === current) polylineOpen.layer = current.layer; break
      case 1: current.text = (current.text ?? '') + value; break
      case 70: if (current.type === 'LWPOLYLINE' || current.type === 'POLYLINE') {
        current.closed = (Number(value) & 1) === 1
      } break
    }
  }
  push(current)

  // ── Resolve coordinates per entity from its raw group codes ───────────────
  for (const e of entities) {
    const xs = (e.raw[10] ?? []).map(Number)
    const ys = (e.raw[20] ?? []).map(Number)
    const zs = (e.raw[30] ?? []).map(Number)
    for (let k = 0; k < Math.max(xs.length, ys.length); k++) {
      const x = xs[k], y = ys[k]
      if (Number.isFinite(x) && Number.isFinite(y)) {
        e.vertices.push([x, y, Number.isFinite(zs[k]) ? zs[k] : null])
      }
    }
    // LINE endpoints use 11/21/31.
    const x1 = Number((e.raw[11] ?? [])[0]), y1 = Number((e.raw[21] ?? [])[0])
    const z1 = Number((e.raw[31] ?? [])[0])
    if (Number.isFinite(x1) && Number.isFinite(y1)) {
      e.vertices.push([x1, y1, Number.isFinite(z1) ? z1 : null])
    }
  }

  const drawn = entities.filter(e => e.vertices.length > 0)
  if (drawn.length === 0) {
    warnings.push('No drawable geometry was found in the ENTITIES section.')
  }

  // ── Extents and the CRS candidate ─────────────────────────────────────────
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const e of drawn) for (const v of e.vertices) {
    if (v[0] < minX) minX = v[0]; if (v[0] > maxX) maxX = v[0]
    if (v[1] < minY) minY = v[1]; if (v[1] > maxY) maxY = v[1]
  }
  const suggestion = drawn.length
    ? suggestCrsFromExtents(minX, minY, maxX, maxY)
    : { candidateCrs: null, rationale: 'No geometry from which to infer extents.' }

  // ── Layer summary ─────────────────────────────────────────────────────────
  const byLayer = new Map<string, number>()
  for (const e of entities) byLayer.set(e.layer, (byLayer.get(e.layer) ?? 0) + 1)
  const layers: DxfLayerSummary[] = [...byLayer.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, entityCount]) => {
      const c = classifyDxfLayer(name)
      return { name, entityCount, mappedTo: c.role, rationale: c.rationale }
    })
  const unclassified = layers.filter(l => l.mappedTo === 'unclassified')
  if (unclassified.length) {
    warnings.push(
      `${unclassified.length} layer(s) could not be classified from their names ` +
      `(${unclassified.slice(0, 5).map(l => l.name).join(', ')}${unclassified.length > 5 ? ', …' : ''}). ` +
      'They are retained verbatim and require manual mapping.',
    )
  }

  // ── POINT entities become survey points ───────────────────────────────────
  const points: SurveyPoint[] = []
  let n = 0
  for (const e of entities) {
    if (e.type !== 'POINT' || e.vertices.length === 0) continue
    const [x, y, z] = e.vertices[0]
    const role = classifyDxfLayer(e.layer).role
    points.push({
      pointId: (e.raw[5] ?? [])[0] ?? `DXF-${++n}`,
      easting: x,
      northing: y,
      elevation: z,
      description: e.layer,
      classification: ROLE_TO_POINT_CLASS[role] ?? 'unclassified',
    })
  }

  // ── Units ─────────────────────────────────────────────────────────────────
  const unit = INSUNITS[header.$INSUNITS ?? ''] ?? null
  if (!unit) {
    warnings.push(
      '$INSUNITS is absent or unitless. Linear units cannot be established from the file ' +
      'and must be confirmed. Feet and metres differ by a factor of 3.28 — this is not a safe guess.',
    )
  }

  const pipeline: SurveyImportRecord['transformationPipeline'] = []
  if (opts.conversion) {
    pipeline.push({
      operation: 'DWG to DXF conversion',
      from: 'DWG',
      to: 'DXF',
      method: `${opts.conversion.tool} ${opts.conversion.version}`,
      performedBy: 'kealee-survey-import',
    })
  }

  const confirmed = opts.confirmCrs
  if (confirmed) {
    pipeline.push({
      operation: 'CRS confirmation',
      from: suggestion.candidateCrs ?? 'unknown',
      to: confirmed.crs,
      method: 'human confirmation',
      performedBy: confirmed.confirmedBy,
    })
  } else {
    warnings.push(
      'DXF files carry no coordinate reference system. ' +
      (suggestion.candidateCrs
        ? `A candidate of ${suggestion.candidateCrs} was inferred from coordinate magnitude and is recorded as a CANDIDATE ONLY. `
        : '') +
      'Export and reconciliation are blocked until the CRS is confirmed.',
    )
  }

  const record: SurveyImportRecord = {
    importId: `imp_${opts.checksum.slice(0, 16)}`,
    originalFilename: opts.filename,
    checksum: opts.checksum,
    format: opts.format ?? 'dxf',
    uploadedAt: opts.uploadedAt,
    surveyDate: opts.surveyDate ?? null,
    surveyor: opts.surveyor ?? null,
    seal: opts.seal ?? { sealed: false, evidence: 'none' },
    crs: confirmed?.crs ?? null,
    candidateCrs: confirmed ? null : suggestion.candidateCrs,
    horizontalDatum: confirmed?.horizontalDatum ?? null,
    verticalDatum: confirmed?.verticalDatum ?? null,
    coordinateUnit: unit,
    benchmark: null,
    transformationPipeline: pipeline,
    parserVersion: PARSER_VERSION,
    sourceGeometryCount: entities.length,
    normalizedGeometryCount: drawn.length,
    confidence: confirmed ? 0.8 : 0.45,
    verificationStatus: confirmed ? 'confirmed' : 'candidate_crs_pending_confirmation',
    reliabilityLevel: 0,
    levelRationale: 'Set by assessReliability() once surveyor, seal and CRS are established.',
    warnings: [...warnings, suggestion.rationale],
  }

  return { record, entities, points, layers, header }
}

// ── DWG ─────────────────────────────────────────────────────────────────────

export interface DwgConversionRequest {
  inputPath: string
  outputDir: string
  /** Path to the ODA File Converter binary, from configuration. */
  converterPath?: string
}

export interface DwgConversionResult {
  ok: boolean
  dxfPath?: string
  tool?: string
  version?: string
  error?: string
  /** What the operator should do when conversion is unavailable. */
  remediation?: string
}

/**
 * DWG is a closed format. There is no correct way to parse it in-process, and
 * guessing at its binary layout would silently corrupt certified geometry. The
 * platform converts through the ODA File Converter when it is configured, and
 * otherwise says plainly that it cannot read the file.
 */
export function planDwgConversion(req: DwgConversionRequest): DwgConversionResult {
  const converter = req.converterPath ?? process.env.ODA_FILE_CONVERTER_PATH
  if (!converter) {
    return {
      ok: false,
      error: 'DWG conversion is not configured.',
      remediation:
        'Set ODA_FILE_CONVERTER_PATH to the ODA File Converter binary, or ask the surveyor for a DXF ' +
        'or LandXML export. DWG is not parsed directly — reverse-engineering the binary format risks ' +
        'silently misreading certified geometry.',
    }
  }
  return {
    ok: true,
    dxfPath: `${req.outputDir}/${req.inputPath.replace(/^.*[\\/]/, '').replace(/\.dwg$/i, '.dxf')}`,
    tool: 'ODA File Converter',
    version: process.env.ODA_FILE_CONVERTER_VERSION ?? 'unknown',
  }
}
