/**
 * Generate a site plan PDF from an address, end to end, with no database.
 *
 *   pnpm tsx scripts/generate-site-plan.ts "<address>" <ZONE> [out.pdf]
 *
 * Every step is live: OSM Nominatim geocodes, the ArcGIS geometry service
 * reprojects to EPSG:2248, and MD iMAP supplies the parcel ring. Nothing is
 * fabricated — if the parcel does not resolve, the run says so and the drawing
 * is produced from whatever else is known rather than from an invented
 * rectangle.
 *
 * The output is Level 1 (jurisdiction GIS) and is NOT permit-grade. A survey is
 * what makes it sealable; it is not what makes it exist.
 */

import { writeFileSync } from 'node:fs'
import { resolveMarylandParcel, buildLotPackage } from '../src/self-perform/lot-package'
import { fetchPgContours, contourRelief, contoursOnLot, PG_CONTOUR_VERTICAL_DATUM } from '../src/jurisdictions/pg-elevation'
import { addFeatures, addSource } from '../src/site-plan/site-twin'
import type { SiteFeature } from '../src/site-plan/site-twin'
import { resolveCrs, createArcGisTransformer } from '../src/export/crs'
import { geocodeAddress } from '../src/gis-client'
import { buildSheetContext } from '../src/sheets/render-svg'
import { renderSheetSetPdf } from '../src/sheets/render-pdf'
import type { SheetId } from '../src/sheets/sheet-template'
import type { DividedResponsibilityBlock } from '../src/review/content-scope'

const step = (n: number, s: string) => console.log(`\n[${n}] ${s}`)

async function main() {
  const [address, zone, outPath = 'site-plan.pdf'] = process.argv.slice(2)
  if (!address || !zone) {
    console.error('usage: tsx scripts/generate-site-plan.ts "<address>" <ZONE> [out.pdf]')
    console.error('example: tsx scripts/generate-site-plan.ts "4102 Webster St, Brentwood, MD 20722" RSF-65')
    process.exit(2)
  }

  step(1, `Geocoding ${address}`)
  const coords = await geocodeAddress(address)
  if (!coords) throw new Error('Geocoding returned nothing. Cannot place the site.')
  console.log(`    ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)} (EPSG:4326)`)

  step(2, 'Reprojecting to EPSG:2248 (NAD83 Maryland State Plane, US survey feet)')
  const tx = createArcGisTransformer()
  const [[easting, northing]] = await tx.transform(
    [[coords.lng, coords.lat]], resolveCrs('EPSG:4326'), resolveCrs('EPSG:2248'))
  console.log(`    E ${easting.toFixed(1)}  N ${northing.toFixed(1)}`)

  step(3, 'Resolving the parcel from MD iMAP')
  const parcel = await resolveMarylandParcel(easting, northing)
  if (parcel.boundary) {
    console.log(`    ring with ${parcel.boundary.ring.coordinates.length} vertices`)
    console.log(`    authority: ${parcel.boundary.authority}`)
    const a = parcel.attributes as Record<string, unknown> | null
    if (a) console.log(`    ${a.ADDRESS ?? a.address ?? '(no address attribute)'}`)
  } else {
    console.log('    NO PARCEL RESOLVED — no rectangle will be invented.')
  }
  console.log(`    candidates considered: ${parcel.candidateCount}`)
  if (parcel.caveat) console.log(`    caveat: ${parcel.caveat}`)

  step(4, 'Fetching 2-ft contours from PGAtlas')
  let contourResult = null as Awaited<ReturnType<typeof fetchPgContours>> | null
  try {
    contourResult = await fetchPgContours(easting, northing, { radiusFt: 150 })
    const relief = contourRelief(contourResult)
    console.log(`    ${contourResult.contours.length} contour lines, ${contourResult.elevationsFt.length} distinct elevations`)
    console.log(`    range ${relief.minFt}–${relief.maxFt} ft, relief ${relief.reliefFt} ft, interval ${contourResult.intervalFt} ft`)
    console.log(`    vertical datum: ${contourResult.verticalDatum}`)
    if (contourResult.truncated) console.log('    *** TRUNCATED — contour set incomplete')
  } catch (e) {
    console.log(`    contour fetch failed: ${(e as Error).message}`)
  }

  step(5, `Building the lot package for zone ${zone}`)
  const pkg = buildLotPackage(
    {
      name: address.split(',')[0],
      address,
      jurisdictionCode: 'prince_georges_md',
      zoneCode: zone,
      isResidentialSingleFamily: true,
      dwellingUnitCount: 1,
    },
    parcel.boundary,
  )
  console.log(`    reliability level : ${pkg.governingLevel}`)
  console.log(`    zoning envelope   : ${pkg.envelope.found ? `${pkg.envelope.standards.length} standards, ${pkg.envelope.citation}` : 'NOT PUBLISHED for this zone'}`)
  console.log(`    permit path       : ${pkg.permitPath.summary ?? '(see report)'}`)
  console.log(`    checklist         : ${pkg.checklist.summary}`)
  console.log(`    composed sheets   : ${pkg.sheets.sheets.length} (${pkg.sheets.rationale})`)

  // Put the terrain into the model. Contours are what let C-400 show existing
  // grade, and the vertical datum stops reading NOT ESTABLISHED.
  if (contourResult && contourResult.contours.length) {
    const onLot = parcel.boundary ? contoursOnLot(contourResult, parcel.boundary.ring) : contourResult.contours
    const use = onLot.length ? onLot : contourResult.contours
    let t = addSource(pkg.twin, {
      sourceId: 'pgatlas-contour-2ft',
      authority: contourResult.source.authority,
      dataset: contourResult.source.layer,
      url: contourResult.source.endpoint,
      crs: 'EPSG:2248',
      horizontalDatum: 'NAD83',
      retrievedAt: contourResult.source.retrievedAt,
      verticalDatum: PG_CONTOUR_VERTICAL_DATUM,
      accuracyClass: 'mapping_grade',
      reliabilityLevel: 1,
    })
    t = { ...t, verticalDatum: PG_CONTOUR_VERTICAL_DATUM }
    t = addFeatures(t, use.map((c, i) => ({
      kind: 'Contour', id: `ct-${i}`,
      line: c.path.map(([x, y]) => [x, y, c.elevationFt]),
      attributes: { elevationFt: c.elevationFt, weight: c.weight, hidden: c.hidden, depression: c.depression },
      sourceId: 'pgatlas-contour-2ft', reliabilityLevel: 1, crs: 'EPSG:2248', revision: t.revision,
    })) as unknown as SiteFeature[])
    pkg.twin = t
    console.log(`    contours added to model: ${use.length} (${onLot.length} on the lot)`)
    console.log(`    vertical datum now: ${t.verticalDatum}`)
  }
  if (pkg.beforeSeal.length) {
    console.log('    before a professional will seal this:')
    for (const b of pkg.beforeSeal) console.log(`      - ${b}`)
  }

  step(6, 'Rendering the sheet set to PDF')
  // SHEETS=C-100,C-400 forces a specific set instead of the composed one, which
  // is how you see a sheet the composer had no content for yet.
  const override = process.env.SHEETS?.split(',').map(s => s.trim()).filter(Boolean) as SheetId[] | undefined
  const sheetIds: SheetId[] = override?.length ? override : pkg.sheets.sheets.flatMap(s => s.covers)
  if (override?.length) console.log(`    sheet override: ${sheetIds.join(', ')}`)
  const contexts = sheetIds.map((id, i) =>
    buildSheetContext({
      sheet: id,
      twin: pkg.twin,
      projectName: pkg.lot,
      sheetIndex: i + 1,
      sheetCount: sheetIds.length,
      status: 'PRELIMINARY',
      disclosure: pkg.disclosure,
    }))

  const responsibility: Partial<Record<SheetId, DividedResponsibilityBlock>> = {}
  for (const r of pkg.responsibility) responsibility[r.sheet] = r

  const pdf = await renderSheetSetPdf({
    sheets: contexts,
    responsibility,
    sourceNotes: pkg.twin.sources.map(s => `${s.dataset} — ${s.authority} — level ${s.reliabilityLevel}`),
  })

  writeFileSync(outPath, pdf.buffer)
  console.log(`    ${outPath}  ${(pdf.buffer.length / 1024).toFixed(0)} KB  ${pdf.pageCount} pages`)
  if (pdf.frameFailures.length) {
    console.log('    FRAME FAILURES (issuance blockers):')
    for (const f of pdf.frameFailures) console.log(`      ${f.sheet}: ${f.missing.join(', ')}`)
  } else {
    console.log('    every sheet carries a complete frame')
  }

  console.log(`\n${pkg.summary}\n`)
}

main().catch(e => { console.error('\nFAILED:', e.message); process.exit(1) })
