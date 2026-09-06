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

import { renderAsciiPlan } from '../src/sheets/render-ascii'
import { toDxf, toLandXml } from '../src/export/exporters'
import { readFileSync, writeFileSync } from 'fs'
import { buildRecordedPlatBoundary } from '../src/survey/recorded-plat'
import { resolvePgAtlasSite, fetchPgAtlasEasements } from '../src/jurisdictions/pgatlas'
import { fetchPgContours } from '../src/jurisdictions/pg-elevation'
import { buildLotPackage } from '../src/self-perform/lot-package'
import { renderSheetSetPdf } from '../src/sheets/render-pdf'
import { buildSheetContext } from '../src/sheets/render-svg'
import { SHEET_TITLES, type SheetId } from '../src/sheets/sheet-template'

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
    recordedAreaSqFt?: number
    platNotes?: string[]
    triangleRearAsSide?: boolean
    dedicationWidthFt?: number
    frontSetbackFt?: number
  frontFaceToCurbFt?: number
  curbOffsetFt?: number
    frontFaceToCurbFt?: number
    curbOffsetFt?: number
    platFrontageEasementFt?: number
    pointOfBeginning?: [number, number]
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
  // Contours from PGAtlas Elevation/MapServer/1 — 2 ft, NAVD88 — centred on THE
  // PLAT, not on the geocoded address point.
  //
  // This queried the locator's point with a fixed 150 ft radius. The locator
  // returns an address point, which sits wherever the county put it, and Lot 1
  // is 176 ft deep: the window did not span the boundary it was drawing, so the
  // far end of the lot had no ground under it. The plat is the basis and PGAtlas
  // adds the layer, so the layer is fetched over the plat's own extent with a
  // margin for the contours that close just outside it.
  const platCentroid = plat.ring.coordinates.reduce(
    (a, c) => [a[0] + c[0] / plat.ring.coordinates.length, a[1] + c[1] / plat.ring.coordinates.length],
    [0, 0] as [number, number])
  const platRadiusFt = Math.ceil(Math.max(...plat.ring.coordinates.map(
    c => Math.hypot(c[0] - platCentroid[0], c[1] - platCentroid[1]))) + 100)
  const contours = await fetchPgContours(platCentroid[0], platCentroid[1],
    { radiusFt: platRadiusFt }).catch(() => null)
  if (!contours || !contours.contours.length) {
    console.log(`    contours        NONE RETURNED — C-300 has no existing ground`)
  } else {
    const els = contours.contours.map(c => c.elevationFt)
    console.log(`    contours        ${contours.contours.length} within ${platRadiusFt} ft`
      + ` · ${Math.min(...els).toFixed(0)}–${Math.max(...els).toFixed(0)} ft ${contours.verticalDatum ?? 'datum not stated'}`)
  }

  // Recorded easements. The lot's OWN plat carries a public utility easement —
  // PGAtlas returns it keyed to record plat 231-050, this plat — and the
  // drawing showed nothing, so a footprint could be placed across it and every
  // sheet would look correct.
  //
  // Anything the county publishes within reach is fetched, then kept only if it
  // actually touches THIS boundary: a 300 ft window over a subdivision picks up
  // the neighbours' easements too, and a neighbour's easement drawn on this lot
  // is a defect of the same kind as a missing one.
  const nearby = await fetchPgAtlasEasements(platCentroid[0], platCentroid[1], { radiusFt: 300 })
  const easements = nearby === null ? undefined : nearby
    .filter(e => e.ring.coordinates.some(c => inRing(c, plat.ring.coordinates)))
    .map(e => ({
      ring: e.ring,
      easementType: String(e.attributes.EASEMENT_TYPE ?? e.category),
      beneficiary: e.attributes.NAME != null ? String(e.attributes.NAME) : undefined,
      recordReference: e.attributes.RECORD_PLAT != null
        ? `Record plat ${String(e.attributes.RECORD_PLAT)}`
        : undefined,
    }))
  console.log(`    easements       ${nearby === null ? 'LAYER UNAVAILABLE — not asked'
    : `${easements?.length ?? 0} on the lot, ${nearby.length} within 300 ft`}`)

  const pkg = buildLotPackage(
    {
      name: spec.address, address: spec.address,
      jurisdictionCode: 'prince_georges_md',
      zoneCode: site.zoning?.zoneCode ?? '',
      isResidentialSingleFamily: true, dwellingUnitCount: 1,
      streetPoint: site.streetPoint, parcelId: site.parcel?.parcelId ?? null,
      streets: site.streets,
      triangleRearAsSide: spec.triangleRearAsSide,
      // PLAT FIRST for anything the recorded instrument carries; PGAtlas
      // supplies only the layers it does not — contours, zoning, streets.
      frontSetbackFt: spec.frontSetbackFt ?? null,
      frontFaceToCurbFt: spec.frontFaceToCurbFt ?? null,
      curbOffsetFt: spec.curbOffsetFt ?? null,
      dedicationWidthFt: spec.dedicationWidthFt ?? null,
      platFrontageEasementFt: spec.platFrontageEasementFt ?? null,
      easements,
      // Cite the instrument the boundary came FROM. The drawing was built on a
      // recorded plat and said so nowhere on the sheet: the plat-record block
      // reads `twin.platRecord`, this never set it, and a reviewer holding the
      // sheet had no reference to check the geometry against.
      platRecord: {
        reference: `${spec.reference.subdivisionName ?? ''}, Plat Book `
          + `${spec.reference.liber ?? ''} p.${spec.reference.folio ?? ''}`.trim(),
        notes: [
          `BASIS OF BEARINGS: ${spec.basisOfBearings ?? 'Maryland State Plane (NAD 83)'}.`,
          `BOUNDARY OF RECORD transcribed from the recorded plat; traverse closes `
            + `1:${plat.traverse.precisionDenominator?.toFixed(0) ?? '—'}`
            + `${spec.recordedAreaSqFt ? `, ${plat.computedAreaSqFt?.toFixed(0)} SF computed against `
              + `${spec.recordedAreaSqFt.toLocaleString()} SF recorded` : ''}.`,
          'A transcription is not a field survey. Monumentation is not verified here.',
          ...(spec.platNotes ?? []),
        ],
      },
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

  // SHEETS=C-000,C-100,… forces the full canonical set. The composer otherwise
  // emits only sheets that carry content, which is right for a quick look and
  // wrong for a submission: a permit set is expected to arrive complete, with
  // the sheets that have nothing yet present and saying so, rather than absent
  // and leaving the reviewer to wonder whether they were forgotten.
  const override = process.env.SHEETS?.split(',').map(x => x.trim()).filter(Boolean) as SheetId[] | undefined
  const sheetIds: SheetId[] = override ?? pkg.sheets.sheets.map(s => s.covers[0] as SheetId)
  const sheets = sheetIds.map((sheetId, i) => buildSheetContext({
    sheet: sheetId, twin: pkg.twin, projectName: spec.address,
    status: 'PRELIMINARY', sheetIndex: i + 1, sheetCount: sheetIds.length, sheetIds,
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

  // Same standing rule as the other generator: the drawing is always shown —
  // and EVERY sheet is, not just the plan.
  //
  // One rendered sheet cannot tell you the other ten carry the right content.
  // The set was split by discipline precisely because a reviewer signs the
  // sheet for their scope, and the last time these went unlooked-at, all five
  // pages were pixel-identical and the PDF reported success either way.
  //
  // ASCII_SHEETS=C-400 narrows it when only one is being worked on.
  const only = process.env.ASCII_SHEETS?.split(',').map(x => x.trim()).filter(Boolean)
  const toDraw = only?.length ? sheetIds.filter(id => only.includes(id)) : sheetIds
  for (const sheetId of toDraw) {
    console.log('')
    console.log(renderAsciiPlan({
      twin: pkg.twin,
      sheet: sheetId,
      envelope: pkg.buildable?.ring ?? null,
      footprint: pkg.buildable?.footprint ?? null,
      title: `${sheetId}  ${SHEET_TITLES[sheetId]}`,
      subtitle: `${spec.address.toUpperCase()} — ${spec.reference.subdivisionName ?? ''} `
        + `LOT ${spec.reference.lot ?? ''} · ${plat.computedAreaSqFt?.toFixed(0)} SF of record`,
    }))
  }
  console.log(`\n[3] ${outPath}`)
  console.log(`    ${out.pageCount} sheet(s): ${sheetIds.join(' | ')}`)
  console.log(`    setbacks ${pkg.buildable?.setbacks.frontFt}' / ${pkg.buildable?.setbacks.sideFt}' / ${pkg.buildable?.setbacks.rearFt}'`)
  console.log(`    envelope ${Math.round(pkg.buildable?.envelopeAreaSqFt ?? 0).toLocaleString()} sq ft`)
  console.log(`    footprint ${Math.round(pkg.buildable?.footprintAreaSqFt ?? 0).toLocaleString()} sq ft`)
  console.log(`\n    ${pkg.beforeSeal.length} item(s) outstanding before a seal:`)
  for (const item of pkg.beforeSeal) console.log(`      · ${item}`)
}

main().catch(e => { console.error(e instanceof Error ? e.message : String(e)); process.exit(1) })

/** Even-odd point-in-ring. Coordinates are EPSG:2248 feet, so no projection. */
function inRing(p: readonly number[], ring: readonly (readonly number[])[]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j]
    if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}
