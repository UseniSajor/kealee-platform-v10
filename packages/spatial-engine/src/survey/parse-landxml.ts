/**
 * LandXML survey import — surfaces, breaklines, parcels and control.
 *
 * LandXML is the richest civil interchange format and carries structure the CSV
 * path cannot: TIN surfaces with faces, breaklines, parcel calls with bearings
 * and distances, and coordinate-system metadata. That metadata is READ, not
 * trusted blindly — a `<CoordinateSystem>` element with a name Kealee does not
 * recognise becomes a candidate, not a confirmation.
 */

import {
  PARSER_VERSION, assessReliability, checksumOf,
  type SurveyImportRecord, type SurveyPoint, type SurveyorIdentity, type SealStatus,
  type BenchmarkRecord,
} from './import-record'

export interface LandXmlSurface {
  name: string
  points: { id: string; northing: number; easting: number; elevation: number }[]
  faces: [number, number, number][]
  breaklines: { name: string; coordinates: [number, number, number][] }[]
}

export interface LandXmlParcelCall {
  parcelName: string
  /** Bearing as written in the file, e.g. "N 45-30-00 E". */
  bearing: string
  distanceFt: number
  monument?: string
}

export interface LandXmlParseResult {
  record: SurveyImportRecord
  points: SurveyPoint[]
  benchmarks: BenchmarkRecord[]
  surfaces: LandXmlSurface[]
  parcelRings: { name: string; coordinates: [number, number][] }[]
  calls: LandXmlParcelCall[]
}

export interface LandXmlParseOptions {
  originalFilename: string
  /** Confirms a CRS the file declares. Without it, the file's value is a candidate. */
  confirmCrs?: boolean
  crsOverride?: string | null
  surveyDate?: string | null
  surveyor?: SurveyorIdentity | null
  seal?: SealStatus
}

const tag = (xml: string, name: string) =>
  [...xml.matchAll(new RegExp(`<${name}\\b([^>]*)>([\\s\\S]*?)</${name}>`, 'g'))]
const selfOrOpen = (xml: string, name: string) =>
  [...xml.matchAll(new RegExp(`<${name}\\b([^>]*?)/?>`, 'g'))]
const attr = (attrs: string, name: string) =>
  attrs.match(new RegExp(`${name}="([^"]*)"`))?.[1]

/** LandXML orders point text as "northing easting elevation". */
function triple(text: string): [number, number, number] | null {
  const n = text.trim().split(/\s+/).map(Number)
  if (n.length < 2 || n.some(v => !Number.isFinite(v))) return null
  return [n[0], n[1], n[2] ?? 0]
}

export async function parseLandXml(
  content: string,
  options: LandXmlParseOptions,
): Promise<LandXmlParseResult> {
  const warnings: string[] = []

  // Units and coordinate system as DECLARED by the file.
  const imperial = selfOrOpen(content, 'Imperial')[0]
  const metric = selfOrOpen(content, 'Metric')[0]
  const linearUnit = imperial ? attr(imperial[1], 'linearUnit') : metric ? attr(metric[1], 'linearUnit') : undefined
  const coordinateUnit =
    linearUnit === 'USSurveyFoot' ? 'usSurveyFoot'
    : linearUnit === 'foot' ? 'foot'
    : linearUnit === 'meter' || linearUnit === 'metre' ? 'metre'
    : null
  if (!coordinateUnit) warnings.push('LandXML did not declare a recognised linear unit.')

  const csEl = selfOrOpen(content, 'CoordinateSystem')[0]
  const declaredCrs = csEl ? (attr(csEl[1], 'epsgCode') ? `EPSG:${attr(csEl[1], 'epsgCode')}` : attr(csEl[1], 'desc') ?? null) : null
  const declaredHDatum = csEl ? attr(csEl[1], 'horizontalDatum') ?? null : null
  const declaredVDatum = csEl ? attr(csEl[1], 'verticalDatum') ?? null : null

  // A CRS declared inside the file is still only a claim until confirmed.
  const crs = options.crsOverride ?? (options.confirmCrs ? declaredCrs : null)
  const candidateCrs = crs ? null : declaredCrs
  if (!crs && declaredCrs) {
    warnings.push(
      `LandXML declares coordinate system "${declaredCrs}". Held as a candidate pending confirmation — ` +
        'a file-declared CRS is the exporter\'s assertion, not verification.',
    )
  } else if (!crs) {
    warnings.push('LandXML declares no coordinate system.')
  }

  // CgPoints
  const points: SurveyPoint[] = []
  const benchmarks: BenchmarkRecord[] = []
  for (const [, attrs, body] of tag(content, 'CgPoint')) {
    const t = triple(body)
    if (!t) continue
    const name = attr(attrs, 'name') ?? attr(attrs, 'pntRef') ?? String(points.length + 1)
    const desc = attr(attrs, 'desc') ?? attr(attrs, 'code') ?? ''
    const { classifyDescription } = await import('./import-record')
    const classification = classifyDescription(desc)
    points.push({ pointId: name, northing: t[0], easting: t[1], elevation: t[2] || null, description: desc, classification })
    if (classification === 'benchmark') {
      benchmarks.push({ id: name, description: desc, elevation: t[2], datum: declaredVDatum ?? 'NOT ESTABLISHED', northing: t[0], easting: t[1] })
    }
  }

  // Surfaces — TIN points, faces and breaklines kept as structure, not linework.
  const surfaces: LandXmlSurface[] = []
  for (const [, sAttrs, sBody] of tag(content, 'Surface')) {
    const name = attr(sAttrs, 'name') ?? `surface-${surfaces.length + 1}`
    const sp: LandXmlSurface['points'] = []
    for (const [, pAttrs, pBody] of tag(sBody, 'P')) {
      const t = triple(pBody)
      if (t) sp.push({ id: attr(pAttrs, 'id') ?? String(sp.length + 1), northing: t[0], easting: t[1], elevation: t[2] })
    }
    const faces: [number, number, number][] = []
    for (const [, , fBody] of tag(sBody, 'F')) {
      const idx = fBody.trim().split(/\s+/).map(Number)
      if (idx.length >= 3 && idx.every(Number.isFinite)) faces.push([idx[0], idx[1], idx[2]])
    }
    const breaklines: LandXmlSurface['breaklines'] = []
    for (const [, bAttrs, bBody] of tag(sBody, 'Breakline')) {
      const coords: [number, number, number][] = []
      for (const [, , pntBody] of tag(bBody, 'PntList3D')) {
        const nums = pntBody.trim().split(/\s+/).map(Number)
        for (let i = 0; i + 2 < nums.length; i += 3) coords.push([nums[i], nums[i + 1], nums[i + 2]])
      }
      if (coords.length) breaklines.push({ name: attr(bAttrs, 'name') ?? `breakline-${breaklines.length + 1}`, coordinates: coords })
    }
    surfaces.push({ name, points: sp, faces, breaklines })
  }

  // Parcels — rings and the boundary calls.
  const parcelRings: LandXmlParseResult['parcelRings'] = []
  const calls: LandXmlParcelCall[] = []
  for (const [, pAttrs, pBody] of tag(content, 'Parcel')) {
    const name = attr(pAttrs, 'name') ?? `parcel-${parcelRings.length + 1}`
    const coords: [number, number][] = []
    for (const [, , listBody] of tag(pBody, 'PntList2D')) {
      const nums = listBody.trim().split(/\s+/).map(Number)
      for (let i = 0; i + 1 < nums.length; i += 2) coords.push([nums[i], nums[i + 1]])
    }
    // Most exporters write the ring as a CoordGeom of Line elements with
    // explicit Start/End points rather than a PntList2D. Both are valid
    // LandXML, and a parcel that only carries the Line form must not come
    // through as no boundary at all.
    if (coords.length === 0) {
      for (const [, , lineBody] of tag(pBody, 'Line')) {
        for (const tagName of ['Start', 'End'] as const) {
          for (const [, , ptBody] of tag(lineBody, tagName)) {
            const t = triple(ptBody)
            if (!t) continue
            const last = coords[coords.length - 1]
            // Consecutive segments share a vertex; keep it once.
            if (!last || last[0] !== t[0] || last[1] !== t[1]) coords.push([t[0], t[1]])
          }
        }
      }
    }
    if (coords.length) parcelRings.push({ name, coordinates: coords })
    for (const [, lAttrs] of selfOrOpen(pBody, 'Line')) {
      const dir = attr(lAttrs, 'dir')
      const len = Number(attr(lAttrs, 'length'))
      if (dir && Number.isFinite(len)) calls.push({ parcelName: name, bearing: dir, distanceFt: len })
    }
  }

  const seal: SealStatus = options.seal ?? { sealed: false, evidence: 'none' }
  const hasGeometry = points.length > 0 || surfaces.length > 0 || parcelRings.length > 0
  const assessment = assessReliability({
    crs, candidateCrs, horizontalDatum: declaredHDatum,
    surveyor: options.surveyor ?? null, seal, format: 'landxml', hasGeometry,
  })

  const record: SurveyImportRecord = {
    importId: `imp-${await checksumOf(options.originalFilename + content.length)}`.slice(0, 24),
    originalFilename: options.originalFilename,
    checksum: await checksumOf(content),
    format: 'landxml',
    uploadedAt: new Date().toISOString(),
    surveyDate: options.surveyDate ?? null,
    surveyor: options.surveyor ?? null,
    seal,
    crs,
    candidateCrs,
    horizontalDatum: declaredHDatum,
    verticalDatum: declaredVDatum,
    coordinateUnit,
    benchmark: benchmarks[0] ?? null,
    transformationPipeline: [],
    parserVersion: PARSER_VERSION,
    sourceGeometryCount: points.length + surfaces.length + parcelRings.length,
    normalizedGeometryCount: points.length + surfaces.reduce((s, x) => s + x.points.length, 0) + parcelRings.length,
    confidence: hasGeometry ? (crs ? 0.92 : 0.6) : 0,
    verificationStatus: assessment.status,
    reliabilityLevel: assessment.level,
    levelRationale: assessment.rationale,
    warnings,
  }

  return { record, points, benchmarks, surfaces, parcelRings, calls }
}
