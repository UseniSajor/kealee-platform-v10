/**
 * Normalisation of a parsed survey into the digital site twin.
 *
 * The rule that governs this file: survey content becomes TYPED twin objects.
 * A boundary monument becomes a BoundarySegment endpoint with its monument
 * recorded; a TIN becomes a Surface with its faces and breaklines; a stream
 * shot becomes an environmental feature. Nothing is flattened into anonymous
 * linework, because a plan drawn from anonymous linework cannot be checked
 * against an ordinance.
 *
 * Normalisation is refused outright when the CRS is unconfirmed. Placing
 * geometry in the twin under a guessed CRS is worse than having no geometry.
 */

import type { SurveyImportRecord, SurveyPoint, BenchmarkRecord, SurveyPointClass } from './import-record'
import type { LandXmlSurface, LandXmlParcelCall } from './parse-landxml'
import type { DxfEntity, DxfLayerRole } from './parse-dxf'
import { classifyDxfLayer } from './parse-dxf'
import type { SourceRecord, AccuracyClass } from '../site-plan/reliability'
import type { SiteFeature, SiteTwin, Position, Ring, BoundarySegment } from '../site-plan/site-twin'
import { addFeatures, addSource, ringAreaSqFt } from '../site-plan/site-twin'

export interface NormalizeInput {
  record: SurveyImportRecord
  points?: SurveyPoint[]
  benchmarks?: BenchmarkRecord[]
  surfaces?: LandXmlSurface[]
  parcelRings?: { name: string; coordinates: [number, number][] }[]
  calls?: LandXmlParcelCall[]
  dxfEntities?: DxfEntity[]
}

export interface NormalizeResult {
  features: SiteFeature[]
  source: SourceRecord
  /** Objects that could not be typed, listed rather than silently dropped. */
  unmapped: { description: string; count: number; reason: string }[]
  warnings: string[]
}

export class NormalizationRefused extends Error {
  constructor(readonly code: string, message: string, readonly remediation: string) {
    super(message)
    this.name = 'NormalizationRefused'
  }
}

const ACCURACY_BY_FORMAT: Record<string, AccuracyClass> = {
  csv: 'survey_grade',
  landxml: 'survey_grade',
  dxf: 'survey_grade',
  dwg: 'survey_grade',
  las: 'mapping_grade',
  laz: 'mapping_grade',
  pdf: 'approximate',
  geojson: 'mapping_grade',
  shapefile: 'mapping_grade',
}

/** Which twin object type a surveyed point belongs to. */
const POINT_TO_KIND: Record<SurveyPointClass, SiteFeature['kind']> = {
  boundary_monument: 'BoundarySegment',
  control: 'ExistingFeature',
  benchmark: 'SpotElevation',
  spot_elevation: 'SpotElevation',
  building_corner: 'Building',
  pavement: 'Pavement',
  curb: 'Pavement',
  sidewalk: 'Sidewalk',
  wall: 'Structure',
  fence: 'ExistingFeature',
  tree: 'Tree',
  utility_structure: 'Utility',
  drainage_structure: 'Structure',
  pipe_invert: 'StormPipe',
  stream: 'EnvironmentalBuffer',
  unclassified: 'ExistingFeature',
}

const DXF_ROLE_TO_KIND: Record<DxfLayerRole, SiteFeature['kind'] | null> = {
  boundary: 'BoundarySegment',
  right_of_way: 'ExistingFeature',
  easement: 'Easement',
  building: 'Building',
  pavement: 'Pavement',
  contour_major: 'Contour',
  contour_minor: 'Contour',
  spot_elevation: 'SpotElevation',
  breakline: 'Breakline',
  utility: 'Utility',
  storm: 'StormPipe',
  sanitary: 'Utility',
  water: 'Utility',
  tree: 'Tree',
  monument: 'BoundarySegment',
  text_annotation: null,
  unclassified: null,
}

function buildSource(record: SurveyImportRecord): SourceRecord {
  return {
    sourceId: record.importId,
    authority: record.surveyor
      ? `${record.surveyor.name} (${record.surveyor.state} PLS ${record.surveyor.licenceNumber})`
      : 'Uploaded survey file — no licensed professional identified',
    dataset: `${record.originalFilename} (${record.format.toUpperCase()})`,
    effectiveDate: record.surveyDate ?? undefined,
    retrievedAt: record.uploadedAt,
    crs: record.crs,
    horizontalDatum: record.horizontalDatum,
    verticalDatum: record.verticalDatum,
    accuracyClass: ACCURACY_BY_FORMAT[record.format] ?? 'unknown',
    reliabilityLevel: record.reliabilityLevel,
    responsibleProfessional: record.surveyor
      ? {
          name: record.surveyor.name,
          licenseNumber: record.surveyor.licenceNumber,
          discipline: 'Professional Land Surveyor',
          state: record.surveyor.state,
        }
      : undefined,
    revision: 1,
    notes:
      `Parser ${record.parserVersion}; checksum ${record.checksum.slice(0, 12)}…; ` +
      `${record.levelRationale}`,
  }
}

let seq = 0
const fid = (prefix: string) => `${prefix}_${(++seq).toString(36)}_${Date.now().toString(36)}`

export function normalizeSurvey(input: NormalizeInput): NormalizeResult {
  const { record } = input

  if (!record.crs) {
    throw new NormalizationRefused(
      'CRS_UNCONFIRMED',
      record.candidateCrs
        ? `The coordinate reference system is unconfirmed. ${record.candidateCrs} was inferred from ` +
          'coordinate magnitude but has not been confirmed by the surveyor.'
        : 'The coordinate reference system is unknown and could not be inferred.',
      'Confirm the CRS with the responsible surveyor, then re-run the import. Geometry is not placed ' +
      'in the site model under a guessed CRS.',
    )
  }
  if (!record.horizontalDatum) {
    throw new NormalizationRefused(
      'DATUM_UNCONFIRMED',
      'The horizontal datum is not established.',
      'NAD83(1986), NAD83(2011) and NAD27 differ by metres in Maryland. Confirm the datum realisation with the surveyor.',
    )
  }

  const source = buildSource(record)
  const features: SiteFeature[] = []
  const unmapped: NormalizeResult['unmapped'] = []
  const warnings: string[] = []
  const base = {
    sourceId: source.sourceId,
    reliabilityLevel: record.reliabilityLevel,
    crs: record.crs,
    revision: 1,
  }

  // ── Parcel boundary from LandXML rings ────────────────────────────────────
  for (const ring of input.parcelRings ?? []) {
    const coords: Position[] = ring.coordinates.map(([n, e]) => [n, e] as Position)
    if (coords.length < 3) {
      unmapped.push({ description: `Parcel ring "${ring.name}"`, count: 1, reason: 'Fewer than three vertices.' })
      continue
    }
    const closed: Ring = { coordinates: coords }
    const first = coords[0], last = coords[coords.length - 1]
    if (first[0] !== last[0] || first[1] !== last[1]) {
      closed.coordinates = [...coords, first]
      warnings.push(
        `Parcel ring "${ring.name}" was not explicitly closed in the file. The closing vertex is a ` +
        'repeat of the first for GeoJSON validity; no coordinate was moved.',
      )
    }
    features.push({
      ...base,
      id: fid('parcel'),
      kind: 'Parcel',
      parcelId: ring.name || null,
      ring: closed,
      areaSqFt: ringAreaSqFt(closed),
      notes: 'Surveyed boundary. Supersedes any GIS parcel geometry for this site.',
    })
  }

  // ── Boundary calls become typed BoundarySegments ──────────────────────────
  const monumentPoints = (input.points ?? []).filter(p => p.classification === 'boundary_monument')
  const calls = input.calls ?? []
  if (calls.length > 0) {
    // Where monuments were also shot, pair each call with its endpoints in order.
    for (let i = 0; i < calls.length; i++) {
      const c = calls[i]
      const from = monumentPoints[i]
      const to = monumentPoints[i + 1] ?? monumentPoints[0]
      const seg: BoundarySegment = {
        ...base,
        id: fid('bseg'),
        kind: 'BoundarySegment',
        from: from ? [from.northing, from.easting] : [NaN, NaN],
        to: to ? [to.northing, to.easting] : [NaN, NaN],
        bearing: c.bearing,
        distanceFt: c.distanceFt,
        monument: c.monument ?? from?.description,
        notes: `Parcel "${c.parcelName}", call ${i + 1} of ${calls.length}.`,
      }
      if (!from || !to) {
        seg.notes += ' Endpoint coordinates were not present in the file; the call is retained as recorded.'
      }
      features.push(seg)
    }
  } else if (monumentPoints.length >= 2) {
    for (let i = 0; i < monumentPoints.length; i++) {
      const a = monumentPoints[i], b = monumentPoints[(i + 1) % monumentPoints.length]
      features.push({
        ...base,
        id: fid('bseg'),
        kind: 'BoundarySegment',
        from: [a.northing, a.easting],
        to: [b.northing, b.easting],
        distanceFt: Math.hypot(b.northing - a.northing, b.easting - a.easting),
        monument: a.description,
        notes:
          'Segment inferred by connecting surveyed monuments in file order. The bearing is computed, ' +
          'not recorded — confirm against the plat before it is used as a legal description.',
      })
    }
    warnings.push(
      `${monumentPoints.length} boundary monuments were surveyed but no metes-and-bounds calls were ` +
      'present. Segments were connected in file order, which is not guaranteed to be the boundary order.',
    )
  }

  // ── Points, typed by classification ───────────────────────────────────────
  const byClass = new Map<SurveyPointClass, SurveyPoint[]>()
  for (const p of input.points ?? []) {
    if (p.classification === 'boundary_monument') continue // already consumed above
    const list = byClass.get(p.classification) ?? []
    list.push(p)
    byClass.set(p.classification, list)
  }
  for (const [cls, pts] of byClass) {
    const kind = POINT_TO_KIND[cls]
    if (cls === 'unclassified') {
      unmapped.push({
        description: 'Points with unrecognised description codes',
        count: pts.length,
        reason:
          'The description code matched no known convention. Raw descriptions are preserved on each ' +
          'feature so a surveyor can map them without re-importing.',
      })
    }
    for (const p of pts) {
      const point: Position = p.elevation != null
        ? [p.northing, p.easting, p.elevation]
        : [p.northing, p.easting]
      if (kind === 'EnvironmentalBuffer') {
        features.push({
          ...base, id: fid('env'), kind: 'EnvironmentalBuffer',
          designation: `Surveyed stream feature (${p.description})`,
          notes: `Survey point ${p.pointId}. Buffer width is set by ordinance, not by this observation.`,
        })
        continue
      }
      if (kind === 'Tree') {
        const dbh = p.description.match(/(\d{1,3})/)
        features.push({
          ...base, id: fid('tree'), kind: 'Tree',
          designation: p.description,
          notes: dbh ? `Surveyed tree, DBH read from code as ${dbh[1]} in.` : 'Surveyed tree.',
        })
        continue
      }
      if (kind === 'Building') {
        // Corners are kept as points; the footprint is assembled only when a
        // closed polygon exists in the file. Four corners do not imply a rectangle.
        features.push({
          ...base, id: fid('bcorner'), kind: 'ExistingFeature',
          point,
          attributes: { role: 'building_corner', pointId: p.pointId, description: p.description },
          notes: 'Surveyed building corner. Footprint not assembled — corner order is not implied by the file.',
        })
        continue
      }
      features.push({
        ...base,
        id: fid('pt'),
        kind: kind as Exclude<SiteFeature['kind'], 'Parcel' | 'BoundarySegment' | 'Easement' | 'Setback' | 'LimitOfDisturbance' | 'EnvironmentalBuffer' | 'Floodplain' | 'Woodland' | 'Tree' | 'Building'>,
        point,
        attributes: { pointId: p.pointId, description: p.description, classification: cls },
      })
    }
  }

  // ── Benchmarks ────────────────────────────────────────────────────────────
  for (const b of input.benchmarks ?? []) {
    features.push({
      ...base,
      id: fid('bm'),
      kind: 'SpotElevation',
      point: b.northing != null && b.easting != null
        ? [b.northing, b.easting, b.elevation]
        : undefined,
      attributes: {
        role: 'benchmark',
        benchmarkId: b.id,
        description: b.description,
        elevation: b.elevation,
        datum: b.datum,
      },
      notes: `Benchmark ${b.id}: elevation ${b.elevation} on ${b.datum}.`,
    })
  }

  // ── Surfaces: TIN, faces and breaklines preserved separately ──────────────
  for (const s of input.surfaces ?? []) {
    features.push({
      ...base,
      id: fid('surf'),
      kind: 'Surface',
      attributes: {
        name: s.name,
        pointCount: s.points.length,
        faceCount: s.faces.length,
        breaklineCount: s.breaklines.length,
        points: s.points,
        faces: s.faces,
      },
      notes: `Surveyed TIN "${s.name}". Triangulation is preserved as delivered and is not re-computed.`,
    })
    for (const bl of s.breaklines) {
      features.push({
        ...base,
        id: fid('brk'),
        kind: 'Breakline',
        line: bl.coordinates.map(([n, e, z]) => [n, e, z] as Position),
        attributes: { surface: s.name, name: bl.name },
        notes: 'Surveyed breakline. Retained as a distinct object — a breakline is not a contour.',
      })
    }
    if (s.faces.length === 0 && s.points.length > 0) {
      warnings.push(
        `Surface "${s.name}" has ${s.points.length} points but no triangulation. A surface cannot be ` +
        'derived without re-triangulating, which would produce a different surface from the surveyor\'s.',
      )
    }
  }

  // ── DXF entities, typed by layer ──────────────────────────────────────────
  const unmappedLayers = new Map<string, number>()
  for (const e of input.dxfEntities ?? []) {
    if (e.vertices.length === 0) continue
    const role = classifyDxfLayer(e.layer).role
    const kind = DXF_ROLE_TO_KIND[role]
    if (!kind) {
      unmappedLayers.set(e.layer, (unmappedLayers.get(e.layer) ?? 0) + 1)
      continue
    }
    const verts: Position[] = e.vertices.map(([x, y, z]) =>
      (z != null ? [y, x, z] : [y, x]) as Position)  // DXF is x=easting, y=northing

    if (kind === 'Easement' && e.closed && verts.length >= 3) {
      features.push({
        ...base, id: fid('esmt'), kind: 'Easement',
        easementType: e.layer,
        ring: { coordinates: verts },
        notes: `From DXF layer "${e.layer}". Beneficiary and recording reference are not in the drawing and must come from title.`,
      })
      continue
    }
    if (kind === 'Building' && e.closed && verts.length >= 3) {
      features.push({
        ...base, id: fid('bldg'), kind: 'Building',
        ring: { coordinates: verts }, existing: true,
        notes: `From DXF layer "${e.layer}".`,
      })
      continue
    }
    if (kind === 'BoundarySegment') {
      for (let i = 0; i + 1 < verts.length; i++) {
        features.push({
          ...base, id: fid('bseg'), kind: 'BoundarySegment',
          from: verts[i], to: verts[i + 1],
          distanceFt: Math.hypot(verts[i + 1][0] - verts[i][0], verts[i + 1][1] - verts[i][1]),
          notes: `From DXF layer "${e.layer}". Bearings are computed from coordinates, not recorded calls.`,
        })
      }
      continue
    }
    if (kind === 'Contour') {
      const elevation = e.vertices[0][2]
      features.push({
        ...base, id: fid('cont'), kind: 'Contour',
        line: verts,
        attributes: {
          layer: e.layer,
          elevation,
          interval: role === 'contour_major' ? 'index' : 'intermediate',
        },
        notes: elevation == null
          ? `From DXF layer "${e.layer}". The polyline carries no elevation — the contour value must come from its label.`
          : `From DXF layer "${e.layer}".`,
      })
      continue
    }
    features.push({
      ...base,
      id: fid('dxf'),
      kind: kind as 'ExistingFeature',
      ...(e.closed && verts.length >= 3 ? { ring: { coordinates: verts } } : { line: verts }),
      attributes: { layer: e.layer, dxfType: e.type, role },
      notes: `From DXF layer "${e.layer}".`,
    })
  }
  for (const [layer, count] of unmappedLayers) {
    unmapped.push({
      description: `DXF layer "${layer}"`,
      count,
      reason:
        'The layer is annotation or could not be classified. Its entities are not placed in the site ' +
        'model as physical features — they are retained in the import for manual mapping.',
    })
  }

  if (record.reliabilityLevel < 2) {
    warnings.push(
      `Objects from this import carry reliability level ${record.reliabilityLevel}. ` +
      'Level 2 requires a confirmed CRS and datum plus a reviewed seal from a licensed surveyor.',
    )
  }

  return { features, source, unmapped, warnings }
}

/**
 * Applies a normalised import to the twin.
 *
 * Superseded features are RETAINED, not deleted. When a survey replaces GIS
 * geometry, the GIS object stays in the model marked superseded so that a sheet
 * issued last month can still be explained.
 */
export function applyToTwin(
  twin: SiteTwin,
  result: NormalizeResult,
  supersedes?: { kinds: SiteFeature['kind'][]; reason: string },
): { twin: SiteTwin; supersededIds: string[] } {
  let next = addSource(twin, result.source)
  const supersededIds: string[] = []

  if (supersedes) {
    next = {
      ...next,
      features: next.features.map(f => {
        if (!supersedes.kinds.includes(f.kind)) return f
        if (f.sourceId === result.source.sourceId) return f
        supersededIds.push(f.id)
        return {
          ...f,
          notes: [
            f.notes,
            `SUPERSEDED ${new Date().toISOString().slice(0, 10)} by ${result.source.dataset}. ${supersedes.reason}`,
          ].filter(Boolean).join(' '),
          attributes: 'attributes' in f
            ? { ...(f.attributes ?? {}), superseded: true, supersededBy: result.source.sourceId }
            : undefined,
        } as SiteFeature
      }),
    }
  }

  next = addFeatures(next, result.features)
  return { twin: next, supersededIds }
}
