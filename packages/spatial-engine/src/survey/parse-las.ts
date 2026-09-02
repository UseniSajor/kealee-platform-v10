/**
 * LAS / LAZ point-cloud ingestion.
 *
 * The public header block and the projection VLRs are read directly here,
 * because they are a documented, fixed-offset binary layout and they carry the
 * three things that decide whether the file is usable at all: the CRS, the
 * scale/offset, and the bounding box.
 *
 * Point records are NOT decoded here. LAZ is compressed, LAS 1.4 has ten point
 * formats, and a hand-rolled decoder is exactly the kind of thing that produces
 * a terrain surface that is subtly wrong. Extraction, ground classification and
 * gridding run through PDAL, and this module builds the pipeline for it.
 *
 * LiDAR is Level 1 — mapping grade. A point cloud is not a survey and is never
 * promoted to Level 2 by this path, however dense it is.
 */

import {
  PARSER_VERSION,
  type SurveyImportRecord,
} from './import-record'

export interface LasHeader {
  signature: string
  versionMajor: number
  versionMinor: number
  systemIdentifier: string
  generatingSoftware: string
  fileCreationYear: number
  fileCreationDayOfYear: number
  headerSize: number
  offsetToPointData: number
  numberOfVariableLengthRecords: number
  pointDataRecordFormat: number
  pointDataRecordLength: number
  numberOfPointRecords: number
  scale: { x: number; y: number; z: number }
  offset: { x: number; y: number; z: number }
  bounds: { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number }
  /** Global encoding bit 4: coordinates are referenced by a WKT VLR, not GeoTIFF keys. */
  wktCrsFlag: boolean
  /** LAZ files set the high bit of the point format. */
  compressed: boolean
}

export interface LasVlr {
  userId: string
  recordId: number
  description: string
  data: Uint8Array
}

export interface LasCrsFinding {
  candidateCrs: string | null
  horizontalDatum: string | null
  verticalDatum: string | null
  /** Raw WKT or GeoTIFF key summary, retained verbatim. */
  rawDefinition: string | null
  source: 'wkt_vlr' | 'geotiff_keys' | 'none'
  rationale: string
}

export interface LasParseResult {
  record: SurveyImportRecord
  header: LasHeader
  vlrs: LasVlr[]
  crsFinding: LasCrsFinding
  /** Density in points per square unit of the file's own CRS. */
  pointDensity: number | null
  warnings: string[]
}

function readString(buf: Buffer, offset: number, length: number): string {
  return buf.subarray(offset, offset + length).toString('latin1').replace(/\0.*$/, '').trim()
}

export function parseLasHeader(buf: Buffer): LasHeader {
  const signature = readString(buf, 0, 4)
  if (signature !== 'LASF') {
    throw new Error(`Not a LAS/LAZ file: expected signature "LASF", found "${signature}".`)
  }
  const globalEncoding = buf.readUInt16LE(6)
  const versionMajor = buf.readUInt8(24)
  const versionMinor = buf.readUInt8(25)
  const rawFormat = buf.readUInt8(104)
  const headerSize = buf.readUInt16LE(94)

  // LAS 1.4 moved the point count to a 64-bit field and left the legacy u32 at 107,
  // which is zero for clouds over 4.29 billion points.
  let numberOfPointRecords = buf.readUInt32LE(107)
  if (versionMajor === 1 && versionMinor >= 4 && headerSize >= 375) {
    const big = buf.readBigUInt64LE(247)
    // BigInt(0) rather than the 0n literal: web-main compiles this package at
    // an ES2017 target, where a BigInt literal is a syntax-level error.
    if (big > BigInt(0)) numberOfPointRecords = Number(big)
  }

  return {
    signature,
    versionMajor,
    versionMinor,
    systemIdentifier: readString(buf, 26, 32),
    generatingSoftware: readString(buf, 58, 32),
    fileCreationDayOfYear: buf.readUInt16LE(90),
    fileCreationYear: buf.readUInt16LE(92),
    headerSize,
    offsetToPointData: buf.readUInt32LE(96),
    numberOfVariableLengthRecords: buf.readUInt32LE(100),
    pointDataRecordFormat: rawFormat & 0x3f,
    pointDataRecordLength: buf.readUInt16LE(105),
    numberOfPointRecords,
    scale: { x: buf.readDoubleLE(131), y: buf.readDoubleLE(139), z: buf.readDoubleLE(147) },
    offset: { x: buf.readDoubleLE(155), y: buf.readDoubleLE(163), z: buf.readDoubleLE(171) },
    bounds: {
      maxX: buf.readDoubleLE(179), minX: buf.readDoubleLE(187),
      maxY: buf.readDoubleLE(195), minY: buf.readDoubleLE(203),
      maxZ: buf.readDoubleLE(211), minZ: buf.readDoubleLE(219),
    },
    wktCrsFlag: (globalEncoding & 0x10) !== 0,
    compressed: (rawFormat & 0x80) !== 0,
  }
}

const VLR_HEADER_BYTES = 54

export function parseLasVlrs(buf: Buffer, header: LasHeader): LasVlr[] {
  const vlrs: LasVlr[] = []
  let p = header.headerSize
  for (let i = 0; i < header.numberOfVariableLengthRecords; i++) {
    if (p + VLR_HEADER_BYTES > buf.length) break
    const userId = readString(buf, p + 2, 16)
    const recordId = buf.readUInt16LE(p + 18)
    const length = buf.readUInt16LE(p + 20)
    const description = readString(buf, p + 22, 32)
    const start = p + VLR_HEADER_BYTES
    vlrs.push({ userId, recordId, description, data: buf.subarray(start, start + length) })
    p = start + length
  }
  return vlrs
}

/** EPSG codes carried in GeoTIFF keys. 3072 = ProjectedCSTypeGeoKey, 4096 = VerticalCSTypeGeoKey. */
const GEOKEY_PROJECTED = 3072
const GEOKEY_GEOGRAPHIC = 2048
const GEOKEY_VERTICAL = 4096

const VERTICAL_EPSG: Record<number, string> = {
  5703: 'NAVD88',
  5702: 'NGVD29',
  5701: 'ODN',
  5714: 'MSL',
}

export function extractLasCrs(vlrs: LasVlr[]): LasCrsFinding {
  const wkt = vlrs.find(v => v.userId === 'LASF_Projection' && (v.recordId === 2112 || v.recordId === 2111))
  if (wkt) {
    const text = Buffer.from(wkt.data).toString('latin1').replace(/\0+$/, '')
    const authority = text.match(/AUTHORITY\s*\[\s*"EPSG"\s*,\s*"(\d+)"\s*\]\s*\]?\s*$/i)
    const datum = text.match(/DATUM\s*\[\s*"([^"]+)"/i)
    const vertical = text.match(/VERT_(?:CS|DATUM)\s*\[\s*"([^"]+)"/i)
    return {
      candidateCrs: authority ? `EPSG:${authority[1]}` : null,
      horizontalDatum: datum ? datum[1] : null,
      verticalDatum: vertical ? vertical[1] : null,
      rawDefinition: text,
      source: 'wkt_vlr',
      rationale: authority
        ? 'CRS read from the OGC WKT projection VLR. Treated as a candidate until confirmed, because the ' +
          'flight CRS and the survey CRS are frequently different.'
        : 'A WKT projection VLR is present but declares no EPSG authority code. The WKT is retained verbatim ' +
          'and must be resolved manually.',
    }
  }

  const geo = vlrs.find(v => v.userId === 'LASF_Projection' && v.recordId === 34735)
  if (geo) {
    const d = Buffer.from(geo.data)
    // GeoKeyDirectory: 4 u16 header, then NumberOfKeys × 4 u16 entries.
    const numKeys = d.length >= 8 ? d.readUInt16LE(6) : 0
    const keys = new Map<number, number>()
    for (let i = 0; i < numKeys; i++) {
      const o = 8 + i * 8
      if (o + 8 > d.length) break
      const keyId = d.readUInt16LE(o)
      const tiffTagLocation = d.readUInt16LE(o + 2)
      const value = d.readUInt16LE(o + 6)
      // tiffTagLocation 0 means the value is stored inline, which is the only
      // case where reading it as an EPSG code is meaningful.
      if (tiffTagLocation === 0) keys.set(keyId, value)
    }
    const projected = keys.get(GEOKEY_PROJECTED)
    const geographic = keys.get(GEOKEY_GEOGRAPHIC)
    const verticalCode = keys.get(GEOKEY_VERTICAL)
    const epsg = projected ?? geographic
    return {
      candidateCrs: epsg && epsg !== 32767 ? `EPSG:${epsg}` : null,
      horizontalDatum: geographic === 4269 ? 'NAD83' : geographic === 4326 ? 'WGS84' : null,
      verticalDatum: verticalCode ? VERTICAL_EPSG[verticalCode] ?? `EPSG:${verticalCode}` : null,
      rawDefinition: `GeoTIFF keys: ${[...keys.entries()].map(([k, v]) => `${k}=${v}`).join(', ')}`,
      source: 'geotiff_keys',
      rationale:
        epsg === 32767
          ? 'The GeoTIFF key declares a user-defined CRS (32767), which carries no resolvable definition. Manual resolution required.'
          : 'CRS read from GeoTIFF projection keys. Candidate only until confirmed.',
    }
  }

  return {
    candidateCrs: null,
    horizontalDatum: null,
    verticalDatum: null,
    rawDefinition: null,
    source: 'none',
    rationale:
      'The file declares no projection VLR. A point cloud with no CRS cannot be positioned on the site ' +
      'and must not be assumed to share the parcel CRS.',
  }
}

export interface ParseLasOptions {
  filename: string
  checksum: string
  uploadedAt: string
  /** Acquisition date, e.g. the LiDAR flight date. Never inferred from upload date. */
  surveyDate?: string | null
  confirmCrs?: { crs: string; horizontalDatum: string; verticalDatum?: string | null; confirmedBy: string }
}

export function parseLas(buf: Buffer, opts: ParseLasOptions): LasParseResult {
  const header = parseLasHeader(buf)
  const vlrs = parseLasVlrs(buf, header)
  const crsFinding = extractLasCrs(vlrs)
  const warnings: string[] = []

  if (header.compressed) {
    warnings.push(
      'This is a LAZ (compressed) file. The header is readable, but point extraction requires ' +
      'laszip via PDAL. No point data was decoded here.',
    )
  }
  if (header.numberOfPointRecords === 0) {
    warnings.push('The header declares zero point records.')
  }
  if (header.scale.x <= 0 || header.scale.y <= 0 || header.scale.z <= 0) {
    warnings.push('A scale factor is zero or negative, which would collapse the cloud. The header is malformed.')
  }
  if (!crsFinding.verticalDatum) {
    warnings.push(
      'No vertical datum is declared. Elevations from this cloud cannot be combined with surveyed ' +
      'elevations until the datum is established — NAVD88 and NGVD29 differ by roughly a foot in Maryland.',
    )
  }
  const fileDate = header.fileCreationYear > 0
    ? new Date(Date.UTC(header.fileCreationYear, 0, 1) + (header.fileCreationDayOfYear - 1) * 86400000)
        .toISOString().slice(0, 10)
    : null
  if (!opts.surveyDate && fileDate) {
    warnings.push(
      `The file creation date is ${fileDate}. This is when the file was written, not necessarily when ` +
      'the site was flown. The acquisition date must be supplied separately.',
    )
  }

  const areaSq = (header.bounds.maxX - header.bounds.minX) * (header.bounds.maxY - header.bounds.minY)
  const pointDensity = areaSq > 0 ? header.numberOfPointRecords / areaSq : null
  if (pointDensity != null && pointDensity < 1) {
    warnings.push(
      `Point density is approximately ${pointDensity.toFixed(2)} points per square unit. ` +
      'Sparse coverage of this kind supports general terrain shape only, not spot elevations or grading design.',
    )
  }

  const confirmed = opts.confirmCrs
  const pipeline: SurveyImportRecord['transformationPipeline'] = []
  if (confirmed) {
    pipeline.push({
      operation: 'CRS confirmation',
      from: crsFinding.candidateCrs ?? 'undeclared',
      to: confirmed.crs,
      method: 'human confirmation',
      performedBy: confirmed.confirmedBy,
    })
  }

  const record: SurveyImportRecord = {
    importId: `imp_${opts.checksum.slice(0, 16)}`,
    originalFilename: opts.filename,
    checksum: opts.checksum,
    format: header.compressed ? 'laz' : 'las',
    uploadedAt: opts.uploadedAt,
    surveyDate: opts.surveyDate ?? null,
    surveyor: null,
    seal: { sealed: false, evidence: 'none' },
    crs: confirmed?.crs ?? null,
    candidateCrs: confirmed ? null : crsFinding.candidateCrs,
    horizontalDatum: confirmed?.horizontalDatum ?? crsFinding.horizontalDatum,
    verticalDatum: confirmed?.verticalDatum ?? crsFinding.verticalDatum,
    coordinateUnit: null,
    benchmark: null,
    transformationPipeline: pipeline,
    parserVersion: PARSER_VERSION,
    sourceGeometryCount: header.numberOfPointRecords,
    normalizedGeometryCount: 0,
    confidence: crsFinding.candidateCrs ? 0.6 : 0.3,
    verificationStatus: confirmed ? 'confirmed' : 'candidate_crs_pending_confirmation',
    reliabilityLevel: 1,
    levelRationale:
      'LiDAR is mapping grade. It supports preliminary terrain and general site context, and is never ' +
      'promoted to Level 2 — a point cloud is not a boundary or topographic survey.',
    warnings: [...warnings, crsFinding.rationale],
  }

  return { record, header, vlrs, crsFinding, pointDensity, warnings }
}

// ── PDAL ────────────────────────────────────────────────────────────────────

export interface PdalGroundOptions {
  inputPath: string
  outputPath: string
  /** Grid resolution in the file's own linear unit. */
  resolution: number
  /** Clip to the site, in the file's own CRS. */
  boundsWkt?: string
  /** Reproject on the way out. Only permitted once the source CRS is confirmed. */
  targetCrs?: string
  sourceCrs?: string
}

/**
 * PDAL pipeline for bare-earth extraction: clip to site, keep ground returns,
 * remove outliers, write a DEM.
 *
 * SMRF is used rather than PMF — it handles the mixed slope and vegetation of a
 * typical Prince George's County infill lot better.
 */
export function buildGroundExtractionPipeline(o: PdalGroundOptions): { pipeline: unknown[]; error?: string } {
  if (o.targetCrs && !o.sourceCrs) {
    return {
      pipeline: [],
      error:
        'Reprojection was requested without a confirmed source CRS. PDAL would assume the file header, ' +
        'which is exactly the assumption that puts a site in the wrong place. Confirm the source CRS first.',
    }
  }
  const stages: unknown[] = [{ type: 'readers.las', filename: o.inputPath }]
  if (o.boundsWkt) stages.push({ type: 'filters.crop', polygon: o.boundsWkt })
  stages.push(
    { type: 'filters.assign', assignment: 'Classification[:]=0' },
    { type: 'filters.elm' },
    { type: 'filters.outlier', method: 'statistical', mean_k: 8, multiplier: 2.5 },
    { type: 'filters.smrf', ignore: 'Classification[7:7]', slope: 0.2, window: 16, threshold: 0.45, scalar: 1.2 },
    { type: 'filters.range', limits: 'Classification[2:2]' },
  )
  if (o.targetCrs && o.sourceCrs) {
    stages.push({ type: 'filters.reprojection', in_srs: o.sourceCrs, out_srs: o.targetCrs })
  }
  stages.push({
    type: 'writers.gdal',
    filename: o.outputPath,
    resolution: o.resolution,
    output_type: 'idw',
    gdaldriver: 'GTiff',
  })
  return { pipeline: stages }
}

/** Contour generation is a GDAL step over the DEM the pipeline above produces. */
export function buildContourCommand(demPath: string, outPath: string, intervalFt: number): string[] {
  return ['gdal_contour', '-a', 'elevation', '-i', String(intervalFt), demPath, outPath]
}
