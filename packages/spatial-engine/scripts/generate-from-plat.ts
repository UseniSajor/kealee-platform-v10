/**
 * Generate a permit set on the BOUNDARY OF RECORD.
 *
 * The other generator fits the lot from county GIS, which is compiled from
 * plats and tax maps rather than surveyed — good enough to draw and site a
 * building, and measured 4.3 ft off a surveyed line in this engine's own
 * testing, which was enough to flip a front setback from compliant to
 * non-compliant. A recorded plat is the instrument the county actually holds.
 *
 * Calls arrive ALREADY TRANSCRIBED, and that is deliberate rather than a
 * shortcut. Every recorded plat this platform has seen is a scan with no text
 * layer; a misread bearing puts a corner in the wrong place while every
 * downstream check still passes. Transcription is a human act. The arithmetic
 * after it is not, and this script does that part — closure, precision, area
 * against the recorded area, and a comparison against county GIS that moves
 * neither figure.
 *
 * Usage:
 *   pnpm tsx scripts/generate-from-plat.ts <plat.json> <out.pdf>
 *
 * The JSON, one object per lot:
 *   {
 *     "address": "1005 Rollins Ave",
 *     "reference": { "liber": "PM 231", "folio": "50",
 *                    "subdivisionName": "Porter Subdivision", "lot": "1" },
 *     "basisOfBearings": "Maryland State Plane Coordinate System (NAD 83)",
 *     "pointOfBeginning": [1340254.7066, 440194.1578],
 *     "recordedAreaSqFt": 9598,
 *     "programme": { "totalFloorAreaSqFt": 2400, "storeys": 2,
 *                    "garage": "attached_2_car" },
 *     "calls": [
 *       { "kind": "line", "bearing": "N 79-29-14 E", "distanceFt": 70.64,
 *         "label": "north line" }
 *     ]
 *   }
 */

import { toDxf, toLandXml } from '../src/export/exporters'
import { readFileSync, writeFileSync } from 'fs'
import { buildRecordedPlatBoundary } from '../src/survey/recorded-plat'
import { resolvePgAtlasSite } from '../src/jurisdictions/pgatlas'
import { fetchPgContours } from '../src/jurisdictions/pg-elevation'
import { buildLotPackage } from '../src/self-perform/lot-package'
import { renderSheetSetPdf } from '../src/sheets/render-pdf'
import { buildSheetContext } from '../src/sheets/render-svg'
import type { SheetId } from '../src/sheets/sheet-template'

async function main(): Promise<void> {
  const [specPath, outPath] = process.argv.slice(2)
  if (!specPath || !outPath) {
    console.error('usage: generate-from-plat.ts <plat.json> <out.pdf>')
    process.exit(1)
  }
  const spec = JSON.parse(readFileSync(specPath, 'utf8')) as {
    address: string
    reference: Record<string, string>
    basisOfBearings?: string
    pointOfBeginning?: [number, number]
    recordedAreaSqFt?: number
    programme?: Record<string, unknown>
    calls: unknown[]
  }

  // ── 1. The county's own record of where the lot is ────────────────────────
  console.log(`\n=== ${spec.address} — boundary of record ===\n`)
  const site = await resolvePgAtlasSite(spec.address, {})
  if (!site) throw new Error(`The county locator did not match "${spec.address}" at or above the minimum score.`)

  // ── 2. The plat figure, from the transcribed calls ────────────────────────
  const plat = buildRecordedPlatBoundary({
    calls: spec.calls as never,
    reference: spec.reference as never,
    basisOfBearings: spec.basisOfBearings ?? null,
    pointOfBeginning: spec.pointOfBeginning ?? null,
    crs: 'EPSG:2248',
    horizontalDatum: 'NAD83',
    recordedAreaSqFt: spec.recordedAreaSqFt ?? null,
    referenceParcel: site.parcel ? { coordinates: site.parcel.ring.coordinates } : null,
  })

  console.log('[1] transcription check')
  console.log(`    computed area   ${plat.computedAreaSqFt?.toFixed(0) ?? '—'} sq ft`
    + (spec.recordedAreaSqFt ? `  (recorded ${spec.recordedAreaSqFt.toLocaleString()})` : ''))
  console.log(`    misclosure      ${plat.traverse.closureDistanceFt?.toFixed(3) ?? '—'} ft`)
  console.log(`    precision       1:${plat.traverse.precisionDenominator?.toFixed(0) ?? '—'}`)
  console.log(`    position from   ${plat.georeference.positionSource}`)
  for (const p of plat.problems) console.log(`    PROBLEM  ${p}`)

  // A traverse that does not close is a transcription error, not a boundary.
  // Drawing it would produce a plan that looks exactly like a correct one.
  if (!plat.certifiable) {
    console.error('\n    HALTED. The traverse does not close well enough to draw.')
    console.error('    Re-read the calls against the plat; a single digit is usually the cause.')
    process.exit(2)
  }

  // ── 3. What the county GIS says, for comparison only ──────────────────────
  if (site.parcel) {
    const gis = site.parcel.areaSqFt
    const diff = plat.computedAreaSqFt ? plat.computedAreaSqFt - gis : null
    console.log('\n[2] against county GIS — neither figure is moved')
    console.log(`    GIS area        ${Math.round(gis).toLocaleString()} sq ft`)
    if (diff !== null) console.log(`    difference      ${diff > 0 ? '+' : ''}${diff.toFixed(0)} sq ft`)
    if (plat.georeference.maxResidualFt != null) {
      console.log(`    max corner gap  ${plat.georeference.maxResidualFt.toFixed(2)} ft`)
    }
  }

  // ── 4. Draw it ────────────────────────────────────────────────────────────
  const contours = await fetchPgContours(site.address.easting2248, site.address.northing2248,
    { radiusFt: 150 }).catch(() => null)

  const pkg = buildLotPackage(
    {
      name: spec.address, address: spec.address,
      jurisdictionCode: 'prince_georges_md',
      zoneCode: site.zoning?.zoneCode ?? '',
      isResidentialSingleFamily: true, dwellingUnitCount: 1,
      streetPoint: site.streetPoint, parcelId: site.parcel?.parcelId ?? null,
      streets: site.streets,
      contours: contours?.contours, verticalDatum: contours?.verticalDatum ?? null,
      programme: spec.programme as never,
    },
    {
      ring: plat.ring,
      // 'survey' — this is the recorded instrument, not a compiled tax map.
      provenance: 'survey',
      authority: `Recorded plat ${spec.reference.subdivisionName ?? ''} `
        + `${spec.reference.liber ?? ''} f.${spec.reference.folio ?? ''}, lot ${spec.reference.lot ?? ''}`.trim(),
      retrievedAt: new Date().toISOString(),
    },
  )

  const sheets = pkg.sheets.sheets.map((s, i) => buildSheetContext({
    sheet: s.covers[0] as SheetId, twin: pkg.twin, projectName: spec.address,
    status: 'PRELIMINARY', sheetIndex: i + 1, sheetCount: pkg.sheets.sheets.length,
  }))
  const out = await renderSheetSetPdf({ sheets, responsibility: undefined })
  writeFileSync(outPath, out.buffer)

  // CAD alongside the PDF, always.
  //
  // A PDF is a picture of a drawing; a professional receiving this work
  // needs the geometry itself. DXF opens in every CAD package and LandXML
  // carries the survey semantics — parcels, coordinates, the datum — that
  // a DXF flattens away. Emitting both at generation time means a handoff
  // never depends on someone remembering to export.
  const dxfPath = outPath.replace(/\.pdf$/i, '.dxf')
  const xmlPath = outPath.replace(/\.pdf$/i, '.landxml.xml')
  writeFileSync(dxfPath, toDxf(pkg.twin))
  writeFileSync(xmlPath, toLandXml(pkg.twin))
  console.log(`    CAD: ${dxfPath}`)
  console.log(`         ${xmlPath}`)

  console.log(`\n[3] ${outPath}`)
  console.log(`    ${out.pageCount} sheet(s): ${pkg.sheets.sheets.map(s => s.covers[0]).join(' | ')}`)
  console.log(`    setbacks ${pkg.buildable?.setbacks.frontFt}' / ${pkg.buildable?.setbacks.sideFt}' / ${pkg.buildable?.setbacks.rearFt}'`)
  console.log(`    envelope ${Math.round(pkg.buildable?.envelopeAreaSqFt ?? 0).toLocaleString()} sq ft`)
  console.log(`    footprint ${Math.round(pkg.buildable?.footprintAreaSqFt ?? 0).toLocaleString()} sq ft`)
  console.log(`\n    ${pkg.beforeSeal.length} item(s) outstanding before a seal.`)
}

main().catch(e => { console.error(e instanceof Error ? e.message : String(e)); process.exit(1) })
