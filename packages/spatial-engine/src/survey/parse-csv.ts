/**
 * CSV / point-file survey import.
 *
 * The workhorse format: P,N,E,Z,D — point number, northing, easting, elevation,
 * description. Column order varies by data collector, so the header is used
 * where present and the classic PNEZD order assumed only when it is not, with
 * that assumption recorded as a warning.
 *
 * Nothing about the coordinate system is inferred silently. Magnitude analysis
 * can SUGGEST a CRS, and that suggestion is stored as `candidateCrs` for a human
 * to confirm.
 */

import {
  PARSER_VERSION, assessReliability, checksumOf, classifyDescription,
  type SurveyImportRecord, type SurveyPoint, type SurveyorIdentity, type SealStatus,
  type BenchmarkRecord,
} from './import-record'

export interface CsvParseOptions {
  originalFilename: string
  /** Supplied by the uploader or a prior confirmation step. Never guessed. */
  crs?: string | null
  horizontalDatum?: string | null
  verticalDatum?: string | null
  coordinateUnit?: 'usSurveyFoot' | 'foot' | 'metre' | null
  surveyDate?: string | null
  surveyor?: SurveyorIdentity | null
  seal?: SealStatus
  /** Explicit column mapping, when the file has no usable header. */
  columns?: { point?: number; northing: number; easting: number; elevation?: number; description?: number }
}

export interface CsvParseResult {
  record: SurveyImportRecord
  points: SurveyPoint[]
  benchmarks: BenchmarkRecord[]
}

const HEADER_ALIASES: Record<string, string> = {
  p: 'point', pt: 'point', point: 'point', 'point#': 'point', no: 'point', num: 'point', id: 'point',
  n: 'northing', north: 'northing', northing: 'northing', y: 'northing', lat: 'northing', latitude: 'northing',
  e: 'easting', east: 'easting', easting: 'easting', x: 'easting', lon: 'easting', long: 'easting', longitude: 'easting',
  z: 'elevation', elev: 'elevation', elevation: 'elevation', ht: 'elevation', height: 'elevation',
  d: 'description', desc: 'description', description: 'description', code: 'description', note: 'description',
}

/**
 * Suggests a CRS from coordinate magnitude. Returns a CANDIDATE only.
 *
 * Maryland State Plane feet northings run roughly 400k–800k and eastings
 * 700k–1.4M. Degrees are within ±180/±90. These ranges overlap other state
 * planes, which is exactly why this can never be authoritative.
 */
export function suggestCrs(points: { northing: number; easting: number }[]): {
  candidate: string | null
  reason: string
} {
  if (points.length === 0) return { candidate: null, reason: 'No points to analyse.' }
  const n = points.map(p => p.northing)
  const e = points.map(p => p.easting)
  const inRange = (v: number[], lo: number, hi: number) => v.every(x => x >= lo && x <= hi)

  if (inRange(e, -180, 180) && inRange(n, -90, 90)) {
    return {
      candidate: 'EPSG:4326',
      reason: 'All coordinates fall within geographic degree bounds. Note the column order may be ' +
        'lon/lat rather than lat/lon — confirm before use.',
    }
  }
  if (inRange(e, 700_000, 1_500_000) && inRange(n, 300_000, 900_000)) {
    return {
      candidate: 'EPSG:2248',
      reason: 'Coordinate magnitudes are consistent with Maryland State Plane in US survey feet, ' +
        'but they overlap several other state-plane zones. Confirmation required.',
    }
  }
  if (inRange(e, 200_000, 500_000) && inRange(n, 100_000, 300_000)) {
    return {
      candidate: 'EPSG:26985',
      reason: 'Coordinate magnitudes are consistent with Maryland State Plane in metres. Confirmation required.',
    }
  }
  return {
    candidate: null,
    reason: `Coordinate magnitudes (N ${Math.min(...n).toFixed(0)}–${Math.max(...n).toFixed(0)}, ` +
      `E ${Math.min(...e).toFixed(0)}–${Math.max(...e).toFixed(0)}) do not match a known local system.`,
  }
}

/**
 * Detects a probable feet/metres mismatch by comparing the declared unit with
 * the coordinate magnitude. A Maryland site in metres has coordinates roughly a
 * third the size of the same site in feet, so a declared unit that disagrees
 * with the magnitude is very likely wrong.
 */
export function detectUnitMismatch(
  points: { northing: number; easting: number }[],
  declaredUnit: string | null | undefined,
): string | null {
  if (!declaredUnit || points.length === 0) return null
  const maxE = Math.max(...points.map(p => p.easting))
  if ((declaredUnit === 'metre') && maxE > 600_000) {
    return `Unit is declared as metres but eastings reach ${maxE.toFixed(0)}, which is the magnitude ` +
      'of US survey feet in Maryland State Plane. A unit error would scale the site by 3.28.'
  }
  if ((declaredUnit === 'usSurveyFoot' || declaredUnit === 'foot') && maxE > 0 && maxE < 600_000) {
    return `Unit is declared as feet but eastings reach only ${maxE.toFixed(0)}, which is the ` +
      'magnitude of metres in Maryland State Plane. A unit error would shrink the site by 3.28.'
  }
  return null
}

export async function parseSurveyCsv(
  content: string,
  options: CsvParseOptions,
): Promise<CsvParseResult> {
  const warnings: string[] = []
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('#'))
  if (lines.length === 0) throw new Error('CSV contains no data rows.')

  const split = (l: string) => l.split(/[,\t;]/).map(c => c.trim())

  // Header detection
  let headerMap: Record<string, number> | null = null
  const firstCells = split(lines[0])
  const looksLikeHeader = firstCells.some(c => /[a-z]/i.test(c) && HEADER_ALIASES[c.toLowerCase()])
  let startRow = 0
  if (looksLikeHeader) {
    headerMap = {}
    firstCells.forEach((c, i) => {
      const key = HEADER_ALIASES[c.toLowerCase()]
      if (key && headerMap![key] === undefined) headerMap![key] = i
    })
    startRow = 1
  }

  let cols: { point?: number; northing: number; easting: number; elevation?: number; description?: number }
  if (options.columns) {
    cols = options.columns
  } else if (headerMap && headerMap.northing !== undefined && headerMap.easting !== undefined) {
    cols = {
      point: headerMap.point, northing: headerMap.northing, easting: headerMap.easting,
      elevation: headerMap.elevation, description: headerMap.description,
    }
  } else {
    cols = { point: 0, northing: 1, easting: 2, elevation: 3, description: 4 }
    warnings.push(
      'No usable header found. Assumed the classic PNEZD column order ' +
        '(point, northing, easting, elevation, description). Confirm before certification.',
    )
  }

  const points: SurveyPoint[] = []
  const benchmarks: BenchmarkRecord[] = []
  const invalid: string[] = []
  const seen = new Set<string>()
  let duplicates = 0

  for (let i = startRow; i < lines.length; i++) {
    const c = split(lines[i])
    const northing = Number(c[cols.northing])
    const easting = Number(c[cols.easting])
    if (!Number.isFinite(northing) || !Number.isFinite(easting)) {
      invalid.push(`row ${i + 1}`)
      continue
    }
    const rawZ = cols.elevation !== undefined ? c[cols.elevation] : undefined
    const elevation = rawZ !== undefined && rawZ !== '' && Number.isFinite(Number(rawZ)) ? Number(rawZ) : null
    const description = (cols.description !== undefined ? c[cols.description] : '') ?? ''
    const pointId = (cols.point !== undefined ? c[cols.point] : String(i)) || String(i)

    const key = `${northing.toFixed(4)}|${easting.toFixed(4)}`
    if (seen.has(key)) duplicates++
    seen.add(key)

    const classification = classifyDescription(description)
    points.push({ pointId, northing, easting, elevation, description, classification })

    if (classification === 'benchmark' && elevation != null) {
      benchmarks.push({
        id: pointId,
        description,
        elevation,
        datum: options.verticalDatum ?? 'NOT ESTABLISHED',
        northing,
        easting,
      })
    }
  }

  if (invalid.length) warnings.push(`${invalid.length} row(s) had non-numeric coordinates and were skipped: ${invalid.slice(0, 5).join(', ')}.`)
  if (duplicates) warnings.push(`${duplicates} duplicate coordinate(s) detected.`)

  const suggestion = suggestCrs(points)
  const candidateCrs = options.crs ? null : suggestion.candidate
  if (!options.crs) warnings.push(`CRS not supplied. ${suggestion.reason}`)

  const unitMismatch = detectUnitMismatch(points, options.coordinateUnit)
  if (unitMismatch) warnings.push(unitMismatch)

  if (!options.verticalDatum && points.some(p => p.elevation != null)) {
    warnings.push('Elevations are present but no vertical datum was supplied. Elevations are relative until a datum is established.')
  }
  if (benchmarks.length === 0 && points.some(p => p.elevation != null)) {
    warnings.push('No benchmark point was identified in the file.')
  }

  const seal: SealStatus = options.seal ?? { sealed: false, evidence: 'none' }
  const assessment = assessReliability({
    crs: options.crs ?? null,
    candidateCrs,
    horizontalDatum: options.horizontalDatum ?? null,
    surveyor: options.surveyor ?? null,
    seal,
    format: 'csv',
    hasGeometry: points.length > 0,
  })

  const record: SurveyImportRecord = {
    importId: `imp-${await checksumOf(options.originalFilename + content.length)}`.slice(0, 24),
    originalFilename: options.originalFilename,
    checksum: await checksumOf(content),
    format: 'csv',
    uploadedAt: new Date().toISOString(),
    surveyDate: options.surveyDate ?? null,
    surveyor: options.surveyor ?? null,
    seal,
    crs: options.crs ?? null,
    candidateCrs,
    horizontalDatum: options.horizontalDatum ?? null,
    verticalDatum: options.verticalDatum ?? null,
    coordinateUnit: options.coordinateUnit ?? null,
    benchmark: benchmarks[0] ?? null,
    transformationPipeline: [],
    parserVersion: PARSER_VERSION,
    sourceGeometryCount: lines.length - startRow,
    normalizedGeometryCount: points.length,
    confidence: points.length > 0 ? (options.crs ? 0.9 : 0.55) : 0,
    verificationStatus: assessment.status,
    reliabilityLevel: assessment.level,
    levelRationale: assessment.rationale,
    warnings,
  }

  return { record, points, benchmarks }
}
