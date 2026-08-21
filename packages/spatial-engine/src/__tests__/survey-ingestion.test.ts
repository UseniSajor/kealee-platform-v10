/**
 * Phase 3B — survey ingestion, reconciliation and regeneration.
 *
 * The behaviours under test are the ones where being wrong is invisible: a
 * guessed CRS, a unit error, an approval that clears a block with no evidence
 * behind it, or certified geometry quietly nudged to agree with a tax map.
 */

import { parseSurveyCsv, suggestCrs, detectUnitMismatch } from '../survey/parse-csv'
import { parseLandXml } from '../survey/parse-landxml'
import { parseDxf, classifyDxfLayer, suggestCrsFromExtents, planDwgConversion } from '../survey/parse-dxf'
import { parseLas, parseLasHeader, buildGroundExtractionPipeline } from '../survey/parse-las'
import { parseSurveyPdf, extractSurveyFindings } from '../survey/parse-pdf'
import { assessReliability, PARSER_VERSION, type SurveyImportRecord } from '../survey/import-record'
import { normalizeSurvey, applyToTwin, NormalizationRefused } from '../survey/normalize'
import { reconcileSurvey, DEFAULT_TOLERANCES, bearingToDegrees } from '../survey/reconcile'
import { evaluatePromotion, applyPromotion, planRegeneration, SHEET_DEPENDENCIES } from '../survey/promotion'
import { regenerateAfterSurvey, recheckEasements, recheckZoning } from '../survey/regenerate'
import {
  evaluateSurveyCertification, evaluateVerticalDatum, applyEvidenceGate,
  type EvidenceLedger,
} from '../review/evidence'
import {
  buildResponsibilityBlock, shouldSplitSheetForSeals, seedScopedApprovals,
  summariseScopedReview, subjectForFeature, SUBJECT_AUTHORITY, type ScopedApproval,
} from '../review/content-scope'
import { composeSheets, blocksFromFeatures, fitsOnOneSheet, LEGIBLE_FLOOR_FT_PER_IN } from '../sheets/composer'
import { ARCH_D } from '../sheets/viewport'
import { createSiteTwin, addFeatures, addSource, featuresOfKind } from '../site-plan/site-twin'
import { gisSourceRecord } from '../site-plan/reliability'
import { toGeoJson } from '../export/exporters'
import type { CrsTransformer, Point2D } from '../export/crs'
import type { SheetId, SheetStatus } from '../sheets/sheet-template'

// ── Fixtures ────────────────────────────────────────────────────────────────

/** Brentwood, MD. EPSG:2248, NAD83 Maryland State Plane, US survey feet. */
const X = 1326382.7, Y = 464763.1

const MD_SURVEYOR = { name: 'A. Reyes', licenceNumber: '21456', state: 'MD' }
const REVIEWED_SEAL = { sealed: true, evidence: 'document_reviewed' as const }

const CSV_STATE_PLANE = [
  'Point,Northing,Easting,Elevation,Description',
  `1,${Y},${X},112.40,IPF`,
  `2,${Y},${X + 65},112.10,IPF`,
  `3,${Y + 100},${X + 65},113.80,IPF`,
  `4,${Y + 100},${X},114.20,IPF`,
  `10,${Y + 20},${X + 20},112.55,BM TBM#1`,
  `11,${Y + 40},${X + 30},112.90,EOP`,
  `12,${Y + 55},${X + 44},113.10,TREE24`,
  `13,${Y + 60},${X + 10},113.30,MH SAN`,
].join('\n')

const CSV_WGS84 = [
  'Point,Latitude,Longitude,Elevation,Description',
  '1,38.942830,-76.950606,34.2,IPF',
  '2,38.942830,-76.950380,34.1,IPF',
  '3,38.943105,-76.950380,34.6,IPF',
  '4,38.943105,-76.950606,34.7,IPF',
].join('\n')

const CSV_NO_HEADER_LOCAL = [
  '1,5000.00,5000.00,100.00,IPF',
  '2,5000.00,5065.00,100.10,IPF',
  '3,5100.00,5065.00,100.40,IPF',
  '4,5100.00,5000.00,100.30,IPF',
].join('\n')

/** Same site expressed in metres — the classic unit error. */
const CSV_METRES = [
  'Point,Northing,Easting,Elevation,Description',
  `1,${(Y * 0.3048006).toFixed(3)},${(X * 0.3048006).toFixed(3)},34.26,IPF`,
  `2,${(Y * 0.3048006).toFixed(3)},${((X + 65) * 0.3048006).toFixed(3)},34.17,IPF`,
  `3,${((Y + 100) * 0.3048006).toFixed(3)},${((X + 65) * 0.3048006).toFixed(3)},34.68,IPF`,
].join('\n')

const LANDXML = `<?xml version="1.0"?>
<LandXML version="1.2">
  <Units><Imperial linearUnit="USSurveyFoot" areaUnit="squareFoot" volumeUnit="cubicFeet"/></Units>
  <CoordinateSystem epsgCode="2248" horizontalDatum="NAD83" verticalDatum="NAVD88" desc="MD State Plane"/>
  <CgPoints>
    <CgPoint name="1" desc="IPF">${Y} ${X} 112.40</CgPoint>
    <CgPoint name="2" desc="IPF">${Y} ${X + 65} 112.10</CgPoint>
    <CgPoint name="10" desc="BM">${Y + 20} ${X + 20} 112.55</CgPoint>
  </CgPoints>
  <Surfaces>
    <Surface name="EG">
      <Definition surfType="TIN">
        <Pnts>
          <P id="1">${Y} ${X} 112.40</P>
          <P id="2">${Y} ${X + 65} 112.10</P>
          <P id="3">${Y + 100} ${X + 65} 113.80</P>
          <P id="4">${Y + 100} ${X} 114.20</P>
        </Pnts>
        <Faces>
          <F>1 2 3</F>
          <F>1 3 4</F>
        </Faces>
      </Definition>
      <SourceData>
        <Breaklines>
          <Breakline name="TOP OF BANK" brkType="standard">
            <PntList3D>${Y + 10} ${X + 5} 112.5 ${Y + 90} ${X + 5} 113.9</PntList3D>
          </Breakline>
          <Breakline name="SWALE" brkType="standard">
            <PntList3D>${Y + 50} ${X} 111.0 ${Y + 50} ${X + 65} 111.4</PntList3D>
          </Breakline>
        </Breaklines>
      </SourceData>
    </Surface>
  </Surfaces>
  <Parcels>
    <Parcel name="LOT 12" area="6500">
      <CoordGeom>
        <Line dir="90.0000" length="65.00"><Start>${Y} ${X}</Start><End>${Y} ${X + 65}</End></Line>
        <Line dir="0.0000" length="100.00"><Start>${Y} ${X + 65}</Start><End>${Y + 100} ${X + 65}</End></Line>
        <Line dir="270.0000" length="65.00"><Start>${Y + 100} ${X + 65}</Start><End>${Y + 100} ${X}</End></Line>
        <Line dir="180.0000" length="100.00"><Start>${Y + 100} ${X}</Start><End>${Y} ${X}</End></Line>
      </CoordGeom>
    </Parcel>
  </Parcels>
</LandXML>`

function dxfPair(code: number, value: string | number): string {
  return `${code}\n${value}\n`
}

const DXF = (() => {
  let s = ''
  s += dxfPair(0, 'SECTION') + dxfPair(2, 'HEADER')
  s += dxfPair(9, '$INSUNITS') + dxfPair(70, 2)
  s += dxfPair(0, 'ENDSEC')
  s += dxfPair(0, 'SECTION') + dxfPair(2, 'ENTITIES')
  // Boundary polyline on an NCS boundary layer.
  s += dxfPair(0, 'LWPOLYLINE') + dxfPair(8, 'V-PROP-BNDY') + dxfPair(70, 1)
  for (const [x, y] of [[X, Y], [X + 65, Y], [X + 65, Y + 100], [X, Y + 100]]) {
    s += dxfPair(10, x) + dxfPair(20, y)
  }
  // Contour.
  s += dxfPair(0, 'LWPOLYLINE') + dxfPair(8, 'C-TOPO-MAJR') + dxfPair(70, 0)
  s += dxfPair(10, X) + dxfPair(20, Y) + dxfPair(30, 112)
  s += dxfPair(10, X + 65) + dxfPair(20, Y + 10) + dxfPair(30, 112)
  // Monument point.
  s += dxfPair(0, 'POINT') + dxfPair(8, 'V-MON') + dxfPair(10, X) + dxfPair(20, Y) + dxfPair(30, 112.4)
  // Annotation that must not become a physical feature.
  s += dxfPair(0, 'TEXT') + dxfPair(8, 'V-ANNO-TEXT') + dxfPair(10, X + 5) + dxfPair(20, Y + 5) + dxfPair(1, 'LOT 12')
  // A layer no convention covers.
  s += dxfPair(0, 'LINE') + dxfPair(8, 'ZZ_TEMP_JOB4471') + dxfPair(10, X) + dxfPair(20, Y)
  s += dxfPair(11, X + 10) + dxfPair(21, Y + 10)
  s += dxfPair(0, 'ENDSEC') + dxfPair(0, 'EOF')
  return s
})()

/** Minimal but structurally valid LAS 1.2 public header plus one projection VLR. */
function buildLasBuffer(opts: {
  epsg?: number
  vertical?: number
  points?: number
  compressed?: boolean
  bounds?: [number, number, number, number]
} = {}): Buffer {
  const headerSize = 227
  const numKeys = (opts.epsg ? 1 : 0) + (opts.vertical ? 1 : 0)
  const vlrDataLen = numKeys > 0 ? 8 + numKeys * 8 : 0
  const vlrCount = numKeys > 0 ? 1 : 0
  const buf = Buffer.alloc(headerSize + (vlrCount ? 54 + vlrDataLen : 0))

  buf.write('LASF', 0, 'latin1')
  buf.writeUInt16LE(0, 6)                       // global encoding, GeoTIFF keys
  buf.writeUInt8(1, 24); buf.writeUInt8(2, 25)  // version 1.2
  buf.write('KEALEE TEST', 26, 'latin1')
  buf.write('kealee-test-writer', 58, 'latin1')
  buf.writeUInt16LE(200, 90)                    // day of year
  buf.writeUInt16LE(2024, 92)
  buf.writeUInt16LE(headerSize, 94)
  buf.writeUInt32LE(buf.length, 96)
  buf.writeUInt32LE(vlrCount, 100)
  buf.writeUInt8(opts.compressed ? 1 | 0x80 : 1, 104)
  buf.writeUInt16LE(28, 105)
  buf.writeUInt32LE(opts.points ?? 250_000, 107)
  buf.writeDoubleLE(0.01, 131); buf.writeDoubleLE(0.01, 139); buf.writeDoubleLE(0.01, 147)
  buf.writeDoubleLE(0, 155); buf.writeDoubleLE(0, 163); buf.writeDoubleLE(0, 171)
  const [minX, minY, maxX, maxY] = opts.bounds ?? [X, Y, X + 65, Y + 100]
  buf.writeDoubleLE(maxX, 179); buf.writeDoubleLE(minX, 187)
  buf.writeDoubleLE(maxY, 195); buf.writeDoubleLE(minY, 203)
  buf.writeDoubleLE(120, 211); buf.writeDoubleLE(110, 219)

  if (vlrCount) {
    let p = headerSize
    buf.writeUInt16LE(0, p)
    buf.write('LASF_Projection', p + 2, 'latin1')
    buf.writeUInt16LE(34735, p + 18)
    buf.writeUInt16LE(vlrDataLen, p + 20)
    buf.write('GeoKeyDirectoryTag', p + 22, 'latin1')
    p += 54
    buf.writeUInt16LE(1, p); buf.writeUInt16LE(1, p + 2)
    buf.writeUInt16LE(0, p + 4); buf.writeUInt16LE(numKeys, p + 6)
    let k = p + 8
    if (opts.epsg) {
      buf.writeUInt16LE(3072, k); buf.writeUInt16LE(0, k + 2)
      buf.writeUInt16LE(1, k + 4); buf.writeUInt16LE(opts.epsg, k + 6)
      k += 8
    }
    if (opts.vertical) {
      buf.writeUInt16LE(4096, k); buf.writeUInt16LE(0, k + 2)
      buf.writeUInt16LE(1, k + 4); buf.writeUInt16LE(opts.vertical, k + 6)
    }
  }
  return buf
}

const PDF_PAGES = [{
  pageNumber: 1,
  ocr: false,
  text: [
    'BOUNDARY SURVEY — LOT 12, BLOCK C',
    'SCALE: 1" = 20\'',
    'N 90°00\'00" E  65.00\'',
    'N 00°00\'00" E  100.00\'',
    'AREA = 6,500 SQ FT',
    'LIBER 41892 FOLIO 233',
    'ELEVATIONS BASED ON NAVD 88',
    'TBM: TOP OF FIRE HYDRANT, ELEV 112.55',
    'A. REYES, P.L.S. No. 21456',
    'STATE OF MARYLAND — PROFESSIONAL LAND SURVEYOR',
    'DATE OF SURVEY: 03/14/2026',
  ].join('\n'),
}]

function baseTwin(opts: { verticalDatum?: string | null } = {}) {
  // GIS parcel deliberately offset ~4 ft from the surveyed position.
  const gx = X + 4.2, gy = Y + 1.1
  const ring = {
    coordinates: [[gx, gy], [gx + 65, gy], [gx + 65, gy + 100], [gx, gy + 100], [gx, gy]] as [number, number][],
  }
  let t = createSiteTwin({
    siteId: 's', projectId: 'p', organizationId: 'o',
    address: '4500 Rhode Island Ave', jurisdictionCode: 'prince_georges_md',
    crs: 'EPSG:2248', horizontalDatum: 'NAD83', verticalDatum: opts.verticalDatum ?? null,
  })
  t = addSource(t, gisSourceRecord({
    sourceId: 'gis1', authority: 'M-NCPPC', dataset: 'PGAtlas parcels',
    crs: 'EPSG:2248', horizontalDatum: 'NAD83',
  }))
  t = { ...t, zoneCode: 'RSF-65' }
  const b = { sourceId: 'gis1', reliabilityLevel: 1 as const, crs: 'EPSG:2248', revision: 1 }
  return addFeatures(t, [
    { kind: 'Parcel', id: 'gis-parcel', parcelId: '17-2345678', ring, areaSqFt: 6500, ...b } as never,
  ])
}

async function certifiedCsvImport() {
  return parseSurveyCsv(CSV_STATE_PLANE, {
    originalFilename: 'lot12-boundary.csv',
    crs: 'EPSG:2248', horizontalDatum: 'NAD83', verticalDatum: 'NAVD88',
    coordinateUnit: 'usSurveyFoot', surveyDate: '2026-03-14',
    surveyor: MD_SURVEYOR, seal: REVIEWED_SEAL,
  })
}

// ── 1. Valid CSV in Maryland State Plane feet ───────────────────────────────

describe('fixture 1 — valid CSV in Maryland State Plane feet', () => {
  it('parses points, classifies descriptions and preserves every provenance field', async () => {
    const r = await certifiedCsvImport()
    expect(r.points).toHaveLength(8)
    expect(r.points[0].classification).toBe('boundary_monument')
    expect(r.points.find(p => p.description.startsWith('TREE'))?.classification).toBe('tree')
    expect(r.points.find(p => p.description.startsWith('MH'))?.classification).toBe('utility_structure')

    const rec = r.record
    expect(rec.originalFilename).toBe('lot12-boundary.csv')
    expect(rec.checksum).toMatch(/^[0-9a-f]{16,}$/)
    expect(rec.format).toBe('csv')
    expect(rec.surveyDate).toBe('2026-03-14')
    expect(rec.surveyor?.licenceNumber).toBe('21456')
    expect(rec.seal.evidence).toBe('document_reviewed')
    expect(rec.crs).toBe('EPSG:2248')
    expect(rec.horizontalDatum).toBe('NAD83')
    expect(rec.verticalDatum).toBe('NAVD88')
    expect(rec.coordinateUnit).toBe('usSurveyFoot')
    expect(rec.parserVersion).toBe(PARSER_VERSION)
    expect(rec.sourceGeometryCount).toBeGreaterThan(0)
    expect(rec.candidateCrs).toBeNull()
  })

  it('records the benchmark it found rather than inventing one', async () => {
    const r = await certifiedCsvImport()
    expect(r.benchmarks).toHaveLength(1)
    expect(r.benchmarks[0].datum).toBe('NAVD88')
    expect(r.benchmarks[0].elevation).toBeCloseTo(112.55, 2)
  })

  it('reaches Level 2 only with confirmed CRS, datum, licence and reviewed seal', async () => {
    const r = await certifiedCsvImport()
    const a = assessReliability({
      crs: r.record.crs, candidateCrs: r.record.candidateCrs,
      horizontalDatum: r.record.horizontalDatum, surveyor: r.record.surveyor,
      seal: r.record.seal, format: 'csv', hasGeometry: true,
    })
    expect(a.level).toBe(2)
    expect(a.status).toBe('professionally_certified')
  })
})

// ── 2. WGS84 CSV ────────────────────────────────────────────────────────────

describe('fixture 2 — WGS84 CSV', () => {
  it('parses degrees and suggests EPSG:4326 as a candidate only', async () => {
    const r = await parseSurveyCsv(CSV_WGS84, { originalFilename: 'lot12-wgs84.csv' })
    expect(r.points).toHaveLength(4)
    expect(r.record.crs).toBeNull()
    expect(r.record.candidateCrs).toBe('EPSG:4326')
    expect(r.record.verificationStatus).toBe('candidate_crs_pending_confirmation')
  })

  it('a degree-magnitude suggestion never becomes the confirmed CRS on its own', () => {
    const s = suggestCrs([{ northing: 38.9428, easting: -76.9506 }])
    expect(s.candidate).toBe('EPSG:4326')
    expect(s.reason).toMatch(/candidate|confirm|overlap/i)
  })
})

// ── 3. Missing CRS ──────────────────────────────────────────────────────────

describe('fixture 3 — missing CRS', () => {
  it('leaves crs null and refuses to normalise into the twin', async () => {
    const r = await parseSurveyCsv(CSV_NO_HEADER_LOCAL, { originalFilename: 'local-grid.csv' })
    expect(r.record.crs).toBeNull()

    expect(() => normalizeSurvey({ record: r.record, points: r.points }))
      .toThrow(NormalizationRefused)
    try {
      normalizeSurvey({ record: r.record, points: r.points })
    } catch (e) {
      expect((e as NormalizationRefused).code).toBe('CRS_UNCONFIRMED')
      expect((e as NormalizationRefused).remediation).toMatch(/confirm the crs/i)
    }
  })

  it('an assumed local grid produces no candidate at all', () => {
    const s = suggestCrsFromExtents(5000, 5000, 5100, 5065)
    expect(s.candidateCrs).toBeNull()
    expect(s.rationale).toMatch(/local grid/i)
  })

  it('holds at Level 0 when nothing can be inferred', () => {
    const a = assessReliability({
      crs: null, candidateCrs: null, horizontalDatum: null,
      surveyor: MD_SURVEYOR, seal: REVIEWED_SEAL, format: 'csv', hasGeometry: true,
    })
    expect(a.level).toBe(0)
  })
})

// ── 4. Feet / metres mismatch ───────────────────────────────────────────────

describe('fixture 4 — feet and metres mismatch', () => {
  it('flags metre-magnitude coordinates declared as feet', async () => {
    const r = await parseSurveyCsv(CSV_METRES, {
      originalFilename: 'metres-as-feet.csv',
      crs: 'EPSG:2248', horizontalDatum: 'NAD83', coordinateUnit: 'usSurveyFoot',
    })
    expect(r.record.warnings.join(' ')).toMatch(/3\.28|metres/i)
  })

  it('detectUnitMismatch catches both directions', () => {
    expect(detectUnitMismatch([{ northing: Y, easting: X }], 'metre')).toMatch(/3\.28/)
    expect(detectUnitMismatch([{ northing: 141_665, easting: 404_282 }], 'usSurveyFoot')).toMatch(/3\.28/)
    expect(detectUnitMismatch([{ northing: Y, easting: X }], 'usSurveyFoot')).toBeNull()
  })

  it('reconciliation raises a blocking UNIT_ERROR against the recorded acreage', () => {
    const metreRing = {
      coordinates: [
        [Y * 0.3048006, X * 0.3048006],
        [Y * 0.3048006, (X + 65) * 0.3048006],
        [(Y + 100) * 0.3048006, (X + 65) * 0.3048006],
        [(Y + 100) * 0.3048006, X * 0.3048006],
        [Y * 0.3048006, X * 0.3048006],
      ] as [number, number][],
    }
    const report = reconcileSurvey({
      surveyPoints: [], twin: baseTwin(), surveyBoundary: metreRing,
      recordAcreage: 6500 / 43560, coordinateUnit: 'metre',
    })
    const unit = report.discrepancies.find(d => d.code === 'UNIT_ERROR')
    expect(unit?.severity).toBe('blocking')
    expect(unit?.resolution).toMatch(/not rescaled automatically/i)
  })
})

// ── 5. LandXML surface and breaklines ───────────────────────────────────────

describe('fixture 5 — LandXML surface and breaklines', () => {
  it('preserves TIN faces and breaklines as distinct structures', async () => {
    const r = await parseLandXml(LANDXML, { originalFilename: 'lot12.xml', confirmCrs: true })
    expect(r.surfaces).toHaveLength(1)
    expect(r.surfaces[0].points).toHaveLength(4)
    expect(r.surfaces[0].faces).toHaveLength(2)
    expect(r.surfaces[0].breaklines).toHaveLength(2)
    expect(r.parcelRings).toHaveLength(1)
    expect(r.calls.length).toBeGreaterThanOrEqual(4)
    expect(r.record.coordinateUnit).toBe('usSurveyFoot')
  })

  it('holds a file-declared CRS as a candidate until confirmed', async () => {
    const unconfirmed = await parseLandXml(LANDXML, { originalFilename: 'lot12.xml' })
    expect(unconfirmed.record.crs).toBeNull()
    expect(unconfirmed.record.candidateCrs).toBe('EPSG:2248')

    const confirmed = await parseLandXml(LANDXML, { originalFilename: 'lot12.xml', confirmCrs: true })
    expect(confirmed.record.crs).toBe('EPSG:2248')
  })

  it('normalises breaklines as Breakline objects, not generic linework', async () => {
    const r = await parseLandXml(LANDXML, {
      originalFilename: 'lot12.xml', confirmCrs: true,
      surveyor: MD_SURVEYOR, seal: REVIEWED_SEAL, surveyDate: '2026-03-14',
    })
    const n = normalizeSurvey({
      record: { ...r.record, horizontalDatum: 'NAD83' },
      points: r.points, surfaces: r.surfaces, parcelRings: r.parcelRings, calls: r.calls,
    })
    expect(n.features.filter(f => f.kind === 'Breakline')).toHaveLength(2)
    expect(n.features.filter(f => f.kind === 'Surface')).toHaveLength(1)
    expect(n.features.filter(f => f.kind === 'Parcel')).toHaveLength(1)
    expect(n.features.some(f => f.kind === 'BoundarySegment')).toBe(true)
  })

  it('reports crossing breaklines that disagree in elevation as blocking', async () => {
    const r = await parseLandXml(LANDXML, { originalFilename: 'lot12.xml', confirmCrs: true })
    const report = reconcileSurvey({
      surveyPoints: r.points, twin: baseTwin(), surfaces: r.surfaces, coordinateUnit: 'usSurveyFoot',
    })
    const crossing = report.discrepancies.find(d => d.code === 'BREAKLINE_CROSSING')
    expect(crossing?.severity).toBe('blocking')
    expect(crossing?.resolution).toMatch(/does not pick a winner/i)
  })
})

// ── 6. LAS / LAZ terrain ingestion ──────────────────────────────────────────

describe('fixture 6 — LAS/LAZ terrain ingestion', () => {
  it('reads the public header and the projection VLR', () => {
    const buf = buildLasBuffer({ epsg: 2248, vertical: 5703 })
    const r = parseLas(buf, { filename: 'site.las', checksum: 'a'.repeat(64), uploadedAt: '2026-08-20' })
    expect(r.header.versionMajor).toBe(1)
    expect(r.header.numberOfPointRecords).toBe(250_000)
    expect(r.crsFinding.candidateCrs).toBe('EPSG:2248')
    expect(r.crsFinding.verticalDatum).toBe('NAVD88')
  })

  it('is capped at Level 1 — a point cloud is not a survey', () => {
    const r = parseLas(buildLasBuffer({ epsg: 2248, vertical: 5703 }), {
      filename: 'site.las', checksum: 'a'.repeat(64), uploadedAt: '2026-08-20',
    })
    expect(r.record.reliabilityLevel).toBe(1)
    expect(r.record.levelRationale).toMatch(/never promoted to Level 2/i)
  })

  it('detects LAZ compression and says point data was not decoded', () => {
    const r = parseLas(buildLasBuffer({ epsg: 2248, compressed: true }), {
      filename: 'site.laz', checksum: 'b'.repeat(64), uploadedAt: '2026-08-20',
    })
    expect(r.record.format).toBe('laz')
    expect(r.warnings.join(' ')).toMatch(/PDAL/)
  })

  it('warns when no vertical datum is declared', () => {
    const r = parseLas(buildLasBuffer({ epsg: 2248 }), {
      filename: 'site.las', checksum: 'c'.repeat(64), uploadedAt: '2026-08-20',
    })
    expect(r.warnings.join(' ')).toMatch(/vertical datum/i)
  })

  it('rejects a file that is not LAS at all', () => {
    expect(() => parseLasHeader(Buffer.alloc(300))).toThrow(/LASF/)
  })

  it('refuses to build a reprojection pipeline without a confirmed source CRS', () => {
    const p = buildGroundExtractionPipeline({
      inputPath: 'a.las', outputPath: 'a.tif', resolution: 2, targetCrs: 'EPSG:4326',
    })
    expect(p.error).toMatch(/confirmed source CRS/i)
    expect(p.pipeline).toHaveLength(0)
  })

  it('builds an SMRF ground-classification pipeline when the CRS is known', () => {
    const p = buildGroundExtractionPipeline({
      inputPath: 'a.las', outputPath: 'a.tif', resolution: 2,
      sourceCrs: 'EPSG:2248', targetCrs: 'EPSG:2248',
    })
    expect(p.error).toBeUndefined()
    const types = (p.pipeline as { type: string }[]).map(s => s.type)
    expect(types).toContain('filters.smrf')
    expect(types).toContain('writers.gdal')
  })
})

// ── 7. DXF layer mapping ────────────────────────────────────────────────────

describe('fixture 7 — DXF layer mapping', () => {
  it('maps NCS layer names to twin object roles', () => {
    expect(classifyDxfLayer('V-PROP-BNDY').role).toBe('boundary')
    expect(classifyDxfLayer('C-TOPO-MAJR').role).toBe('contour_major')
    expect(classifyDxfLayer('C-STM-PIPE').role).toBe('storm')
    expect(classifyDxfLayer('V-ESMT').role).toBe('easement')
    expect(classifyDxfLayer('ZZ_TEMP_JOB4471').role).toBe('unclassified')
  })

  it('parses entities, layers and units without claiming a CRS', () => {
    const r = parseDxf(DXF, {
      filename: 'lot12.dxf', checksum: 'd'.repeat(64), uploadedAt: '2026-08-20',
    })
    expect(r.header.$INSUNITS).toBe('2')
    expect(r.record.coordinateUnit).toBe('foot')
    expect(r.record.crs).toBeNull()
    expect(r.record.candidateCrs).toBe('EPSG:2248')
    expect(r.record.warnings.join(' ')).toMatch(/carry no coordinate reference system/i)
    expect(r.layers.map(l => l.name)).toContain('V-PROP-BNDY')
    expect(r.points.some(p => p.classification === 'boundary_monument')).toBe(true)
  })

  it('surfaces unclassified layers rather than guessing at them', () => {
    const r = parseDxf(DXF, { filename: 'lot12.dxf', checksum: 'd'.repeat(64), uploadedAt: '2026-08-20' })
    const unknown = r.layers.find(l => l.name === 'ZZ_TEMP_JOB4471')
    expect(unknown?.mappedTo).toBe('unclassified')
    expect(unknown?.rationale).toMatch(/not guessed at/i)
  })

  it('normalises typed objects and keeps annotation out of the physical model', () => {
    const r = parseDxf(DXF, {
      filename: 'lot12.dxf', checksum: 'd'.repeat(64), uploadedAt: '2026-08-20',
      surveyDate: '2026-03-14', surveyor: MD_SURVEYOR, seal: REVIEWED_SEAL,
      confirmCrs: { crs: 'EPSG:2248', horizontalDatum: 'NAD83', confirmedBy: 'A. Reyes PLS 21456' },
    })
    const n = normalizeSurvey({ record: r.record, points: r.points, dxfEntities: r.entities })
    expect(n.features.some(f => f.kind === 'Contour')).toBe(true)
    expect(n.features.some(f => f.kind === 'BoundarySegment')).toBe(true)
    expect(n.unmapped.some(u => u.description.includes('V-ANNO-TEXT'))).toBe(true)
    expect(n.unmapped.some(u => u.description.includes('ZZ_TEMP_JOB4471'))).toBe(true)
  })

  it('does not parse DWG directly and says what to do instead', () => {
    const plan = planDwgConversion({ inputPath: '/tmp/a.dwg', outputDir: '/tmp', converterPath: undefined })
    if (!process.env.ODA_FILE_CONVERTER_PATH) {
      expect(plan.ok).toBe(false)
      expect(plan.remediation).toMatch(/ODA File Converter|LandXML/i)
    }
    const configured = planDwgConversion({
      inputPath: '/tmp/a.dwg', outputDir: '/out', converterPath: '/opt/oda/ODAFileConverter',
    })
    expect(configured.ok).toBe(true)
    expect(configured.dxfPath).toBe('/out/a.dxf')
  })
})

// ── 8. PDF treated as nonauthoritative unless verified ──────────────────────

describe('fixture 8 — PDF is nonauthoritative', () => {
  it('extracts calls, scale, licence and datum from the text', () => {
    const f = extractSurveyFindings(PDF_PAGES)
    expect(f.scaleDenominator).toBe(20)
    expect(f.licenceNumber).toBe('21456')
    expect(f.licenceState).toBe('MD')
    expect(f.areaSqFt).toBe(6500)
    expect(f.liber).toBe('41892')
    expect(f.datumText.join(' ')).toMatch(/NAVD/i)
    expect(f.calls.length).toBeGreaterThanOrEqual(2)
    expect(f.calls[0].distanceFt).toBe(65)
  })

  it('stays Level 0 with no CRS and no geometry regardless of what the text says', () => {
    const r = parseSurveyPdf(PDF_PAGES, {
      filename: 'lot12-survey.pdf', checksum: 'e'.repeat(64), uploadedAt: '2026-08-20',
    })
    expect(r.record.reliabilityLevel).toBe(0)
    expect(r.record.crs).toBeNull()
    expect(r.record.normalizedGeometryCount).toBe(0)
    expect(r.record.seal.sealed).toBe(false)
    expect(r.requiresConfirmation.join(' ')).toMatch(/coordinate reference system/i)
  })

  it('does not treat seal-like text as a seal', () => {
    const r = parseSurveyPdf(PDF_PAGES, {
      filename: 'lot12-survey.pdf', checksum: 'e'.repeat(64), uploadedAt: '2026-08-20',
    })
    expect(r.findings.sealCues.length).toBeGreaterThan(0)
    expect(r.warnings.join(' ')).toMatch(/not by keyword matching/i)
  })

  it('cannot reach Level 2 even with a reviewed seal', () => {
    const a = assessReliability({
      crs: 'EPSG:2248', candidateCrs: null, horizontalDatum: 'NAD83',
      surveyor: MD_SURVEYOR, seal: REVIEWED_SEAL, format: 'pdf', hasGeometry: true,
    })
    expect(a.level).toBe(1)
    expect(a.rationale).toMatch(/not authoritative/i)
  })
})

// ── 9. Parcel discrepancy ───────────────────────────────────────────────────

describe('fixture 9 — parcel discrepancy', () => {
  it('reports displacement between the survey and the GIS parcel', () => {
    const surveyBoundary = {
      coordinates: [[X, Y], [X + 65, Y], [X + 65, Y + 100], [X, Y + 100], [X, Y]] as [number, number][],
    }
    const report = reconcileSurvey({
      surveyPoints: [], twin: baseTwin(), surveyBoundary, coordinateUnit: 'usSurveyFoot',
    })
    const d = report.discrepancies.find(x => x.code === 'BOUNDARY_DISPLACEMENT')
    expect(d).toBeDefined()
    expect(d?.interpretation).toMatch(/compiled, not surveyed/i)
    expect(d?.resolution).toMatch(/NOT adjusted to match GIS/i)
  })

  it('honours a configurable tolerance', () => {
    const surveyBoundary = {
      coordinates: [[X, Y], [X + 65, Y], [X + 65, Y + 100], [X, Y + 100], [X, Y]] as [number, number][],
    }
    const loose = reconcileSurvey({
      surveyPoints: [], twin: baseTwin(), surveyBoundary,
      tolerances: { boundaryDisplacementFt: 25 }, coordinateUnit: 'usSurveyFoot',
    })
    expect(loose.discrepancies.some(x => x.code === 'BOUNDARY_DISPLACEMENT')).toBe(false)
    expect(loose.tolerances.boundaryDisplacementFt).toBe(25)
    expect(loose.tolerances.elevationFt).toBe(DEFAULT_TOLERANCES.elevationFt)
  })

  it('compares surveyed calls against the recorded plat', () => {
    const report = reconcileSurvey({
      surveyPoints: [], twin: baseTwin(), coordinateUnit: 'usSurveyFoot',
      surveyCalls: [{ bearing: 'N 90-00-00 E', distanceFt: 65.42 }],
      platCalls: [{ bearing: 'N 90-00-00 E', distanceFt: 65.00 }],
    })
    expect(report.discrepancies.some(d => d.code === 'CALL_DISTANCE_MISMATCH')).toBe(true)
  })

  it('flags an unclosed traverse as blocking', () => {
    const open = { coordinates: [[X, Y], [X + 65, Y], [X + 65, Y + 100], [X, Y + 99.2]] as [number, number][] }
    const report = reconcileSurvey({
      surveyPoints: [], twin: baseTwin(), surveyBoundary: open, coordinateUnit: 'usSurveyFoot',
    })
    const d = report.discrepancies.find(x => x.code === 'UNCLOSED_BOUNDARY')
    expect(d?.severity).toBe('blocking')
    expect(d?.resolution).toMatch(/does not close it automatically/i)
  })

  it('parses bearings for comparison without rewriting them', () => {
    expect(bearingToDegrees('N 45-30-00 E')).toBeCloseTo(45.5, 4)
    expect(bearingToDegrees('S 45-30-00 W')).toBeCloseTo(225.5, 4)
    expect(bearingToDegrees('nonsense')).toBeNull()
  })
})

// ── 10. LiDAR elevation discrepancy ─────────────────────────────────────────

describe('fixture 10 — LiDAR elevation discrepancy', () => {
  it('reports surveyed elevations that disagree with LiDAR', async () => {
    const csv = await certifiedCsvImport()
    const report = reconcileSurvey({
      surveyPoints: csv.points, twin: baseTwin({ verticalDatum: 'NAVD88' }),
      lidarElevationAt: () => 108.0, coordinateUnit: 'usSurveyFoot',
      surveyVerticalDatum: 'NAVD88', gisVerticalDatum: 'NAVD88',
    })
    const d = report.discrepancies.find(x => x.code === 'ELEVATION_DISCREPANCY')
    expect(d).toBeDefined()
    expect(d?.interpretation).toMatch(/LiDAR is mapping grade/i)
  })

  it('attributes a large gap plus improvement changes to site change, not survey error', async () => {
    const csv = await certifiedCsvImport()
    const report = reconcileSurvey({
      surveyPoints: csv.points, twin: baseTwin({ verticalDatum: 'NAVD88' }),
      lidarElevationAt: () => 108.0, coordinateUnit: 'usSurveyFoot',
      gisCaptureDate: '2019-04-01', surveyDate: '2026-03-14',
    })
    const d = report.discrepancies.find(x => x.code === 'SITE_CHANGED_SINCE_GIS')
    expect(d?.severity).toBe('informational')
    expect(d?.resolution).toMatch(/Adopt the survey/i)
  })
})

// ── 11. Unknown vertical datum ──────────────────────────────────────────────

describe('fixture 11 — unknown vertical datum', () => {
  it('raises a blocking datum conflict rather than converting silently', () => {
    const report = reconcileSurvey({
      surveyPoints: [], twin: baseTwin(), coordinateUnit: 'usSurveyFoot',
      surveyVerticalDatum: 'NAVD88', gisVerticalDatum: 'NGVD29',
    })
    const d = report.discrepancies.find(x => x.code === 'VERTICAL_DATUM_CONFLICT')
    expect(d?.severity).toBe('blocking')
    expect(d?.resolution).toMatch(/Never convert silently/i)
  })

  it('MISSING_VERTICAL_DATUM does not clear without a datum, benchmark, unit and transform check', async () => {
    const csv = await parseSurveyCsv(CSV_STATE_PLANE, {
      originalFilename: 'no-vdatum.csv', crs: 'EPSG:2248', horizontalDatum: 'NAD83',
      coordinateUnit: 'usSurveyFoot', surveyor: MD_SURVEYOR, seal: REVIEWED_SEAL,
    })
    const e = evaluateVerticalDatum({
      twin: baseTwin({ verticalDatum: null }),
      ledger: { items: [] }, imports: [csv.record], promotions: [], approvals: [],
    })
    expect(e.cleared).toBe(false)
    expect(e.outstanding.join(' ')).toMatch(/vertical datum/i)
    expect(e.retainedLevelExplanation).toMatch(/cannot be certified until the site/i)
  })

  it('elevation-dependent objects are excluded from promotion when no vertical datum exists', async () => {
    const csv = await parseSurveyCsv(CSV_STATE_PLANE, {
      originalFilename: 'no-vdatum.csv', crs: 'EPSG:2248', horizontalDatum: 'NAD83',
      coordinateUnit: 'usSurveyFoot', surveyDate: '2026-03-14',
      surveyor: { ...MD_SURVEYOR, licenceVerifiedAt: '2026-08-01' }, seal: REVIEWED_SEAL,
    })
    const decision = evaluatePromotion({
      record: csv.record,
      discrepancies: reconcileSurvey({ surveyPoints: [], twin: baseTwin(), coordinateUnit: 'usSurveyFoot' }),
      scope: ['Parcel', 'BoundarySegment', 'Contour', 'Surface'],
    })
    expect(decision.promoted).toBe(true)
    expect(decision.promotedScope).toContain('Parcel')
    expect(decision.promotedScope).not.toContain('Contour')
    expect(decision.promotedScope).not.toContain('Surface')
    expect(decision.rationale).toMatch(/no vertical datum is stated/i)
  })
})

// ── 12. Professional approval without evidence ──────────────────────────────

describe('fixture 12 — professional approval without evidence', () => {
  const approvedBoundary: ScopedApproval[] = [{
    id: 'a1', discipline: 'surveyor', subject: 'boundary_determination',
    appearsOn: ['C-100'], objectIds: ['p1'], decision: 'APPROVED',
    decidedBy: 'A. Reyes', licenceNumber: '21456',
  }]

  it('does not clear MISSING_SURVEY_CERTIFICATION on approval alone', () => {
    const e = evaluateSurveyCertification({
      twin: baseTwin(), ledger: { items: [] }, imports: [], promotions: [],
      approvals: approvedBoundary,
    })
    expect(e.cleared).toBe(false)
    expect(e.retainedLevelExplanation).toMatch(/Approval alone does\s+not promote geometry/i)
  })

  it('does not promote to Level 2 without licence verification and seal evidence', async () => {
    const csv = await parseSurveyCsv(CSV_STATE_PLANE, {
      originalFilename: 'unsealed.csv', crs: 'EPSG:2248', horizontalDatum: 'NAD83',
      verticalDatum: 'NAVD88', coordinateUnit: 'usSurveyFoot', surveyDate: '2026-03-14',
      surveyor: MD_SURVEYOR, seal: { sealed: true, evidence: 'declared_by_uploader' },
    })
    const decision = evaluatePromotion({
      record: csv.record,
      discrepancies: reconcileSurvey({ surveyPoints: [], twin: baseTwin(), coordinateUnit: 'usSurveyFoot' }),
      scope: ['Parcel'],
    })
    expect(decision.promoted).toBe(false)
    expect(decision.promotedScope).toHaveLength(0)
    expect(decision.blockers.join(' ')).toMatch(/not evidence|not verified/i)
  })

  it('applyPromotion is a no-op on a refused decision', async () => {
    const twin = baseTwin()
    const csv = await parseSurveyCsv(CSV_STATE_PLANE, { originalFilename: 'x.csv' })
    const refused = evaluatePromotion({
      record: csv.record,
      discrepancies: reconcileSurvey({ surveyPoints: [], twin, coordinateUnit: 'usSurveyFoot' }),
      scope: ['Parcel'],
    })
    expect(applyPromotion(twin, refused, 'gis1')).toBe(twin)
  })
})

// ── 13. Evidence plus approval clears the correct blocks ────────────────────

describe('fixture 13 — evidence plus approval clears the correct blocks', () => {
  const fullLedger: EvidenceLedger = {
    items: [
      { id: 'e1', kind: 'certified_survey_file', reference: 'lot12-boundary-sealed.pdf', attachedAt: '2026-08-20', attachedBy: 'ops' },
      { id: 'e2', kind: 'surveyor_licence_verification', reference: 'MD DLLR register lookup 2026-08-20', attachedAt: '2026-08-20', attachedBy: 'ops' },
      { id: 'e3', kind: 'seal_document_review', reference: 'Seal reviewed on page 1', attachedAt: '2026-08-20', attachedBy: 'T. Chamberlain' },
      { id: 'e4', kind: 'benchmark_record', reference: 'TBM#1 top of hydrant, elev 112.55 NAVD88', attachedAt: '2026-08-20', attachedBy: 'ops' },
      { id: 'e5', kind: 'vertical_datum_statement', reference: 'NAVD88 stated on the sealed survey', attachedAt: '2026-08-20', attachedBy: 'ops' },
      { id: 'e6', kind: 'unit_check', reference: 'US survey feet confirmed against recorded acreage', attachedAt: '2026-08-20', attachedBy: 'ops' },
    ],
  }

  const approvals: ScopedApproval[] = [{
    id: 'a1', discipline: 'surveyor', subject: 'boundary_determination',
    appearsOn: ['C-100'], objectIds: ['p1'], decision: 'APPROVED',
    decidedBy: 'A. Reyes', licenceNumber: '21456',
  }]

  it('clears MISSING_SURVEY_CERTIFICATION when evidence and approval are both present', async () => {
    const csv = await certifiedCsvImport()
    const e = evaluateSurveyCertification({
      twin: baseTwin({ verticalDatum: 'NAVD88' }), ledger: fullLedger,
      imports: [csv.record], promotions: [], approvals,
    })
    expect(e.cleared).toBe(true)
    expect(e.outstanding).toHaveLength(0)
  })

  it('clears MISSING_VERTICAL_DATUM on the same evidence', async () => {
    const csv = await certifiedCsvImport()
    const e = evaluateVerticalDatum({
      twin: baseTwin({ verticalDatum: 'NAVD88' }), ledger: fullLedger,
      imports: [csv.record], promotions: [], approvals,
    })
    expect(e.cleared).toBe(true)
  })

  it('leaves unrelated findings untouched', async () => {
    const csv = await certifiedCsvImport()
    const qc = {
      findings: [
        { code: 'MISSING_SURVEY_CERTIFICATION', severity: 'blocking' as const, message: 'x', remedy: 'y' },
        { code: 'MISSING_EASEMENT', severity: 'warning' as const, message: 'x', remedy: 'y' },
        { code: 'FOOTPRINT_MISMATCH', severity: 'warning' as const, message: 'x', remedy: 'y' },
      ],
      blocking: [{ code: 'MISSING_SURVEY_CERTIFICATION', severity: 'blocking' as const, message: 'x', remedy: 'y' }],
      issuable: false,
      summary: '',
    }
    const gated = applyEvidenceGate(qc, {
      twin: baseTwin({ verticalDatum: 'NAVD88' }), ledger: fullLedger,
      imports: [csv.record], promotions: [], approvals,
    })
    expect(gated.findings.map(f => f.code)).toEqual(['MISSING_EASEMENT', 'FOOTPRINT_MISMATCH'])
    expect(gated.issuable).toBe(true)
    expect(gated.clearedByEvidence.map(c => c.code)).toContain('MISSING_SURVEY_CERTIFICATION')
  })

  it('annotates an uncleared block with exactly what is missing', async () => {
    const csv = await certifiedCsvImport()
    const gated = applyEvidenceGate(
      {
        findings: [{ code: 'MISSING_SURVEY_CERTIFICATION', severity: 'blocking', message: 'x', remedy: 'Obtain a certified survey.' }],
        blocking: [{ code: 'MISSING_SURVEY_CERTIFICATION', severity: 'blocking', message: 'x', remedy: 'Obtain a certified survey.' }],
        issuable: false, summary: '',
      },
      { twin: baseTwin(), ledger: { items: [] }, imports: [csv.record], promotions: [], approvals: [] },
    )
    expect(gated.issuable).toBe(false)
    expect(gated.findings[0].remedy).toMatch(/Outstanding:/)
    expect(gated.unclearedEvaluations).toHaveLength(1)
  })
})

// ── 14. Certified geometry is never altered automatically ───────────────────

describe('fixture 14 — certified geometry is never altered automatically', () => {
  it('reconciliation reports differences and states that nothing was moved', async () => {
    const csv = await certifiedCsvImport()
    const before = csv.points.map(p => ({ ...p }))
    const surveyBoundary = {
      coordinates: [[X, Y], [X + 65, Y], [X + 65, Y + 100], [X, Y + 100], [X, Y]] as [number, number][],
    }
    const ringBefore = JSON.stringify(surveyBoundary)

    const report = reconcileSurvey({
      surveyPoints: csv.points, twin: baseTwin({ verticalDatum: 'NAVD88' }),
      surveyBoundary, lidarElevationAt: () => 105, platAreaSqFt: 6300,
      coordinateUnit: 'usSurveyFoot',
    })

    expect(report.geometryAltered).toBe(false)
    expect(report.summary).toMatch(/NOT moved, rotated, scaled or rubber-sheeted/i)
    expect(csv.points).toEqual(before)
    expect(JSON.stringify(surveyBoundary)).toBe(ringBefore)
  })

  it('applyToTwin retains superseded GIS geometry instead of deleting it', async () => {
    const landxml = await parseLandXml(LANDXML, {
      originalFilename: 'lot12.xml', confirmCrs: true,
      surveyor: MD_SURVEYOR, seal: REVIEWED_SEAL, surveyDate: '2026-03-14',
    })
    const n = normalizeSurvey({
      record: { ...landxml.record, horizontalDatum: 'NAD83' },
      points: landxml.points, surfaces: landxml.surfaces,
      parcelRings: landxml.parcelRings, calls: landxml.calls,
    })
    const twin = baseTwin({ verticalDatum: 'NAVD88' })
    const { twin: after, supersededIds } = applyToTwin(twin, n, {
      kinds: ['Parcel'], reason: 'Replaced by certified boundary survey.',
    })

    expect(supersededIds).toContain('gis-parcel')
    const retained = after.features.find(f => f.id === 'gis-parcel')
    expect(retained).toBeDefined()
    expect(retained?.notes).toMatch(/SUPERSEDED/)
    expect(featuresOfKind(after, 'Parcel').length).toBeGreaterThan(1)

    // The original GIS ring is unchanged, not rubber-sheeted onto the survey.
    const original = twin.features.find(f => f.id === 'gis-parcel')
    expect(JSON.stringify((retained as { ring: unknown }).ring))
      .toBe(JSON.stringify((original as { ring: unknown }).ring))
  })
})

// ── 15. EPSG:4326 GeoJSON export ────────────────────────────────────────────

describe('fixture 15 — GeoJSON export is EPSG:4326', () => {
  const transformer: CrsTransformer = {
    name: 'stub',
    async transform(points) {
      // A real transform; the stub keeps the test deterministic.
      return points.map(() => [-76.950606, 38.94283] as Point2D)
    },
  }

  it('emits WGS84 longitude-first coordinates and no crs member', async () => {
    const twin = baseTwin({ verticalDatum: 'NAVD88' })
    const text = await toGeoJson(twin, transformer)
    const gj = JSON.parse(text) as {
      type: string
      crs?: unknown
      features: { geometry: { coordinates: number[][][] }; properties: Record<string, unknown> }[]
    }
    expect(gj.type).toBe('FeatureCollection')
    expect(gj.crs).toBeUndefined()

    const coords = gj.features[0].geometry.coordinates[0]
    for (const [lon, lat] of coords) {
      expect(Math.abs(lon)).toBeLessThanOrEqual(180)
      expect(Math.abs(lat)).toBeLessThanOrEqual(90)
      expect(lon).toBeLessThan(0)   // western hemisphere
      expect(lat).toBeGreaterThan(0)
    }

    // State Plane appears only under engineeringGeometry, never as GeoJSON coordinates.
    const eng = gj.features[0].properties.engineeringGeometry as {
      crs: string; coordinates: number[][]
    }
    expect(eng.crs).toBe('EPSG:2248')
    expect(eng.coordinates[0][0]).toBeGreaterThan(1_000_000)
    expect(JSON.stringify(gj.features[0].geometry)).not.toContain('1326')
  })

  it('retains the engineering coordinates separately from the GeoJSON', async () => {
    const twin = baseTwin({ verticalDatum: 'NAVD88' })
    await toGeoJson(twin, transformer)
    const parcel = featuresOfKind(twin, 'Parcel')[0]
    expect(parcel.ring.coordinates[0][0]).toBeGreaterThan(1_000_000)
    expect(parcel.crs).toBe('EPSG:2248')
  })
})

// ── 16. Deterministic sheet regeneration ────────────────────────────────────

describe('fixture 16 — deterministic sheet regeneration', () => {
  const currentSheets: { sheet: SheetId; status: SheetStatus; revisions: never[] }[] = [
    { sheet: 'C-000', status: 'PRELIMINARY', revisions: [] },
    { sheet: 'C-100', status: 'PRELIMINARY', revisions: [] },
    { sheet: 'C-200', status: 'PRELIMINARY', revisions: [] },
    { sheet: 'C-400', status: 'PRELIMINARY', revisions: [] },
    { sheet: 'L-100', status: 'PRELIMINARY', revisions: [] },
  ]

  it('regenerates exactly the sheets that depend on the changed object kinds', () => {
    const plan = planRegeneration({
      changedKinds: ['Parcel', 'BoundarySegment'],
      currentSheets, newGoverningLevel: 1, previousGoverningLevel: 1,
      description: 'Survey applied', by: 'engine',
    })
    expect(plan.affectedSheets).toContain('C-100')
    expect(plan.affectedSheets).toContain('C-200')
    expect(plan.affectedSheets).toContain('C-000')
    expect(plan.affectedSheets).not.toContain('C-500')
    expect(plan.unaffectedSheets).toContain('C-500')
  })

  it('is deterministic — the same change produces the same plan', () => {
    const args = {
      changedKinds: ['Parcel' as const, 'Contour' as const],
      currentSheets, newGoverningLevel: 2 as const, previousGoverningLevel: 1 as const,
      description: 'Survey applied', by: 'engine', date: '2026-08-21',
    }
    expect(JSON.stringify(planRegeneration(args))).toBe(JSON.stringify(planRegeneration(args)))
  })

  it('drops the preliminary disclosure and moves sheets to FOR_REVIEW, never to PERMIT_SET', () => {
    const plan = planRegeneration({
      changedKinds: ['Parcel'], currentSheets,
      newGoverningLevel: 2, previousGoverningLevel: 1,
      description: 'Certified survey applied', by: 'engine',
    })
    expect(plan.disclosure).toBeNull()
    expect(plan.statusChanges.every(c => c.to === 'FOR_REVIEW')).toBe(true)
    expect(plan.statusChanges.some(c => c.reason.match(/not PERMIT_SET/))).toBe(true)
    expect(plan.supersededHandling).toMatch(/retained in the model marked superseded/i)
  })

  it('every sheet declares its dependencies so the graph is complete', () => {
    for (const [sheet, kinds] of Object.entries(SHEET_DEPENDENCIES)) {
      expect(Array.isArray(kinds)).toBe(true)
      if (sheet !== 'C-900') expect(kinds.length).toBeGreaterThan(0)
    }
  })

  it('runs the full cascade and reports the consequence of each change', async () => {
    const before = baseTwin({ verticalDatum: 'NAVD88' })
    const landxml = await parseLandXml(LANDXML, {
      originalFilename: 'lot12.xml', confirmCrs: true,
      surveyor: MD_SURVEYOR, seal: REVIEWED_SEAL, surveyDate: '2026-03-14',
    })
    const n = normalizeSurvey({
      record: { ...landxml.record, horizontalDatum: 'NAD83' },
      points: landxml.points, surfaces: landxml.surfaces,
      parcelRings: landxml.parcelRings, calls: landxml.calls,
    })
    const { twin: after, supersededIds } = applyToTwin(before, n, {
      kinds: ['Parcel'], reason: 'Certified survey.',
    })

    const outcome = regenerateAfterSurvey({
      before, after, supersededObjectIds: supersededIds,
      discrepancies: reconcileSurvey({ surveyPoints: landxml.points, twin: before, coordinateUnit: 'usSurveyFoot' }),
      disturbanceBefore: {
        buildingFootprintSqFt: 1596, drivewaySqFt: 700, gradingSqFt: 1500, utilityTrenchesSqFt: 200,
        stormwaterFacilitiesSqFt: 250, stockpilesSqFt: 40, constructionAccessSqFt: 60,
        offsiteWorkSqFt: 0, demolitionSqFt: 0, stagingAreasSqFt: 54,
      },
      disturbanceAfter: {
        buildingFootprintSqFt: 1596, drivewaySqFt: 700, gradingSqFt: 2800, utilityTrenchesSqFt: 200,
        stormwaterFacilitiesSqFt: 250, stockpilesSqFt: 40, constructionAccessSqFt: 60,
        offsiteWorkSqFt: 0, demolitionSqFt: 0, stagingAreasSqFt: 54,
      },
      setbacksBefore: [{ side: 'front', requiredFt: 25, providedFt: 25.4, citation: '§27-4202' }],
      setbacks: [{ side: 'front', requiredFt: 25, providedFt: 24.1, citation: '§27-4202' }],
      currentSheets, revisionBy: 'engine',
    })

    expect(outcome.disturbance.thresholdFlipped).toBe(true)
    expect(outcome.comparison.changes.some(c => c.subject === 'Limit of disturbance')).toBe(true)
    expect(outcome.comparison.changes.find(c => c.subject === 'Limit of disturbance')?.consequence)
      .toMatch(/changes the permit path/i)
    expect(outcome.zoning.changedByResurvey.join(' ')).toMatch(/front setback changed/i)
    expect(outcome.comparison.supersededObjectIds).toContain('gis-parcel')
    expect(outcome.easements.unmappedWarning).toMatch(/not evidence that the parcel is unencumbered/i)
  })
})

// ── Content-scoped responsibility (routing correction) ──────────────────────

describe('divided responsibility — a sheet is not owned by one profession', () => {
  it('assigns each subject to the discipline authorised to certify it', () => {
    expect(SUBJECT_AUTHORITY.boundary_determination.certifiedBy).toBe('surveyor')
    expect(SUBJECT_AUTHORITY.stormwater_design.certifiedBy).toBe('professional_engineer')
    expect(SUBJECT_AUTHORITY.tree_conservation.certifiedBy).toBe('environmental_professional')
    expect(SUBJECT_AUTHORITY.boundary_determination.mayReview).toContain('professional_engineer')
  })

  it('a combined infill sheet carries several disciplines with divided scope', () => {
    const b = { sourceId: 'gis1', reliabilityLevel: 1 as const, crs: 'EPSG:2248', revision: 1 }
    const features = [
      { kind: 'Parcel', id: 'p1', parcelId: 'x', ring: { coordinates: [[X, Y], [X + 65, Y], [X + 65, Y + 100], [X, Y]] }, areaSqFt: 6500, ...b },
      { kind: 'Setback', id: 's1', side: 'front', distanceFt: 25, citation: '§27-4202', ...b },
      { kind: 'SWMPractice', id: 'w1', ...b },
      { kind: 'Tree', id: 't1', ...b },
    ] as never[]

    const block = buildResponsibilityBlock({ sheet: 'C-100', features })
    const disciplines = block.rows.map(r => r.discipline)
    expect(disciplines).toContain('surveyor')
    expect(disciplines).toContain('professional_engineer')
    expect(disciplines).toContain('environmental_professional')
    expect(block.divisionNote).toMatch(/only to the subjects listed beside it/i)

    const surveyorRow = block.rows.find(r => r.discipline === 'surveyor')
    expect(surveyorRow?.objectIds).toEqual(['p1'])
    expect(surveyorRow?.excludes).toContain('stormwater_design')
  })

  it('never splits a sheet just to separate seals', () => {
    const b = { sourceId: 'gis1', reliabilityLevel: 1 as const, crs: 'EPSG:2248', revision: 1 }
    const block = buildResponsibilityBlock({
      sheet: 'C-100',
      features: [
        { kind: 'Parcel', id: 'p1', parcelId: 'x', ring: { coordinates: [[X, Y]] }, areaSqFt: 1, ...b },
        { kind: 'SWMPractice', id: 'w1', ...b },
      ] as never[],
    })
    const split = shouldSplitSheetForSeals(block)
    expect(split.split).toBe(false)
    expect(split.reason).toMatch(/drift apart/i)
  })

  it('a professional signs a subject once, not once per sheet it appears on', () => {
    const b = { sourceId: 'gis1', reliabilityLevel: 1 as const, crs: 'EPSG:2248', revision: 1 }
    const parcel = { kind: 'Parcel', id: 'p1', parcelId: 'x', ring: { coordinates: [[X, Y]] }, areaSqFt: 1, ...b } as never
    const approvals = seedScopedApprovals({
      twin: baseTwin(),
      sheetFeatures: [
        { sheet: 'C-100', features: [parcel] },
        { sheet: 'C-200', features: [parcel] },
      ],
    })
    const boundary = approvals.filter(a => a.subject === 'boundary_determination')
    expect(boundary).toHaveLength(1)
    expect(boundary[0].appearsOn).toEqual(['C-100', 'C-200'])
  })

  it('summarises what still needs certification by subject', () => {
    const approvals: ScopedApproval[] = [
      { id: '1', discipline: 'surveyor', subject: 'boundary_determination', appearsOn: ['C-100'], objectIds: [], decision: 'APPROVED' },
      { id: '2', discipline: 'professional_engineer', subject: 'stormwater_design', appearsOn: ['C-600'], objectIds: [], decision: 'PENDING' },
      { id: '3', discipline: 'landscape_architect', subject: 'planting_design', appearsOn: ['L-100'], objectIds: [], decision: 'PENDING' },
    ]
    const s = summariseScopedReview(approvals)
    expect(s.submissionReady).toBe(false)
    expect(s.blockingSubjects).toEqual(['stormwater_design'])
    expect(s.summary).not.toMatch(/planting/i)
  })

  it('routes a proposed contour to the engineer and an existing one to the surveyor', () => {
    const b = { sourceId: 's', reliabilityLevel: 2 as const, crs: 'EPSG:2248', revision: 1 }
    const existing = { kind: 'Contour', id: 'c1', line: [], ...b } as never
    const proposed = { kind: 'Contour', id: 'c2', line: [], attributes: { proposed: true }, ...b } as never
    expect(subjectForFeature(existing)).toBe('topographic_survey')
    expect(subjectForFeature(proposed)).toBe('grading_design')
  })
})

// ── Dynamic sheet composition ───────────────────────────────────────────────

describe('dynamic sheet composition', () => {
  const b = { sourceId: 'gis1', reliabilityLevel: 1 as const, crs: 'EPSG:2248', revision: 1 }
  const lotFeatures = [
    { kind: 'Parcel', id: 'p1', parcelId: 'x', ring: { coordinates: [[X, Y], [X + 65, Y], [X + 65, Y + 100], [X, Y + 100], [X, Y]] }, areaSqFt: 6500, ...b },
    { kind: 'Setback', id: 's1', side: 'front', distanceFt: 25, citation: '§27-4202', ring: { coordinates: [[X, Y], [X + 65, Y], [X + 65, Y + 25], [X, Y]] }, ...b },
    { kind: 'SWMPractice', id: 'w1', ring: { coordinates: [[X + 10, Y + 10], [X + 20, Y + 10], [X + 20, Y + 20], [X + 10, Y + 10]] }, ...b },
    { kind: 'Tree', id: 't1', ...b },
  ] as never[]

  it('puts a small infill lot on one or two sheets rather than the full canonical set', () => {
    const blocks = blocksFromFeatures(lotFeatures)
    const result = composeSheets({ blocks })
    expect(result.sheets.length).toBeLessThanOrEqual(2)
    expect(result.sheets[0].scaleFtPerIn).toBeLessThanOrEqual(LEGIBLE_FLOOR_FT_PER_IN)
    expect(result.rationale).toMatch(/Separate pages are not required/i)
    expect(result.sheets[0].covers.length).toBeGreaterThan(1)
  })

  it('still produces the full set when it is explicitly requested', () => {
    const blocks = blocksFromFeatures(lotFeatures)
    const result = composeSheets({ blocks, forceFullSet: true })
    expect(result.sheets).toHaveLength(blocks.length)
    expect(result.rationale).toMatch(/requested explicitly/i)
  })

  it('refuses to merge when the result would fall below the legible scale floor', () => {
    const huge = [{
      kind: 'Parcel', id: 'big', parcelId: 'x', areaSqFt: 1,
      ring: { coordinates: [[X, Y], [X + 8000, Y], [X + 8000, Y + 6000], [X, Y]] }, ...b,
    }] as never[]
    const fit = fitsOnOneSheet(blocksFromFeatures(huge), ARCH_D, 20)
    expect(fit.fits).toBe(false)
    expect(fit.reason).toMatch(/legible floor|below the/i)
  })
})
