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
import { deriveBuildableEnvelope } from '../src/site-plan/buildable-envelope'
import { resolvePgAtlasSite } from '../src/jurisdictions/pgatlas'
import { addFeatures, addSource } from '../src/site-plan/site-twin'
import type { SiteFeature } from '../src/site-plan/site-twin'
import { resolveCrs, createArcGisTransformer } from '../src/export/crs'
import { geocodeAddress } from '../src/gis-client'
import { buildSheetContext } from '../src/sheets/render-svg'
import { renderSheetSetPdf } from '../src/sheets/render-pdf'
import type { SheetId } from '../src/sheets/sheet-template'
import type { DividedResponsibilityBlock } from '../src/review/content-scope'
import { requiredNotesForSheet, PG_REQUIRED_PLAN_NOTES } from '../src/site-plan/required-notes'

const step = (n: number, s: string) => console.log(`\n[${n}] ${s}`)

async function main() {
  const [address, zone, outPath = 'site-plan.pdf'] = process.argv.slice(2)
  if (!address) {
    console.error('usage: tsx scripts/generate-site-plan.ts "<address>" <ZONE> [out.pdf]')
    console.error('example: tsx scripts/generate-site-plan.ts "4102 Webster St, Brentwood, MD 20722" RSF-65')
    process.exit(2)
  }

  step(1, `Resolving ${address} against PGAtlas`)
  const atlas = await resolvePgAtlasSite(address)
  let easting: number, northing: number
  let parcel: { boundary: { ring: any; provenance: string; authority: string; retrievedAt: string } | null; attributes: any; caveat: string; candidateCount: number }
  let resolvedZone = zone

  if (atlas) {
    console.log(`    matched "${atlas.address.matchedAddress}" (locator score ${atlas.address.score})`)
    easting = atlas.address.easting2248
    northing = atlas.address.northing2248
    console.log(`    E ${easting.toFixed(1)}  N ${northing.toFixed(1)} (EPSG:2248)`)

    step(2, 'Zoning from PGAtlas')
    if (atlas.zoning) {
      console.log(`    ${atlas.zoning.zoneCode} — ${atlas.zoning.groupName}`)
      if (!resolvedZone) resolvedZone = atlas.zoning.zoneCode
      else if (resolvedZone !== atlas.zoning.zoneCode) {
        console.log(`    NOTE: supplied zone ${resolvedZone} differs from PGAtlas ${atlas.zoning.zoneCode}; using PGAtlas.`)
        resolvedZone = atlas.zoning.zoneCode
      }
    } else {
      console.log('    no zoning polygon at this point')
    }

    step(3, 'Parcel from PGAtlas Property')
    parcel = atlas.parcel
      ? { boundary: { ring: atlas.parcel.ring, provenance: 'jurisdiction_gis', authority: atlas.parcel.source.authority, retrievedAt: atlas.parcel.source.retrievedAt },
          attributes: { PROP_ID: atlas.parcel.propId }, caveat: '', candidateCount: 1 }
      : { boundary: null, attributes: null, caveat: 'No parcel polygon at the geocoded point.', candidateCount: 0 }
    if (atlas.parcel) console.log(`    ${Math.round(atlas.parcel.areaSqFt).toLocaleString()} sq ft, ${atlas.parcel.ring.coordinates.length} vertices`)
    else console.log('    NO PARCEL — no rectangle will be invented.')
  } else {
    // PGAtlas could not match. Fall back rather than fabricate.
    step(1, 'PGAtlas did not match — falling back to Nominatim + MD iMAP')
    const coords = await geocodeAddress(address)
    if (!coords) throw new Error('Neither PGAtlas nor Nominatim could locate this address.')
    const tx = createArcGisTransformer()
    const [[e2, n2]] = await tx.transform([[coords.lng, coords.lat]], resolveCrs('EPSG:4326'), resolveCrs('EPSG:2248'))
    easting = e2; northing = n2
    console.log(`    E ${easting.toFixed(1)}  N ${northing.toFixed(1)}`)
    step(3, 'Parcel from MD iMAP')
    parcel = await resolveMarylandParcel(easting, northing) as any
    if (parcel.caveat) console.log(`    caveat: ${parcel.caveat.slice(0, 120)}...`)
  }

  if (!resolvedZone) throw new Error('No zone resolved and none supplied.')

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

  step(5, `Building the lot package for zone ${resolvedZone}`)
  const houseSqFt = Number(process.env.HOUSE_SQFT ?? 0)
  const storeys = Number(process.env.STOREYS ?? 1)
  const pkg = buildLotPackage(
    {
      name: address.split(',')[0],
      address,
      jurisdictionCode: 'prince_georges_md',
      zoneCode: resolvedZone,
      isResidentialSingleFamily: true,
      dwellingUnitCount: 1,
      contours: contourResult?.contours.map(c => ({
        elevationFt: c.elevationFt, path: c.path, weight: c.weight, hidden: c.hidden,
      })),
      verticalDatum: contourResult?.verticalDatum ?? null,
      contourSourceAuthority: contourResult?.source.authority,
      streetPoint: atlas?.streetPoint ?? null,
      parcelId: atlas?.parcel?.propId ?? null,
      programme: houseSqFt > 0
        ? { totalFloorAreaSqFt: houseSqFt, storeys, garage: (process.env.GARAGE as never) ?? 'none',
            hasBasement: process.env.BASEMENT === '1', coveredPorch: process.env.PORCH === '1' }
        : undefined,
    },
    parcel.boundary,
  )
  console.log(`    reliability level : ${pkg.governingLevel}`)
  console.log(`    zoning envelope   : ${pkg.envelope.found ? `${pkg.envelope.standards.length} standards, ${pkg.envelope.citation}` : 'NOT PUBLISHED for this zone'}`)
  console.log(`    permit path       : ${pkg.permitPath.summary ?? '(see report)'}`)
  console.log(`    checklist         : ${pkg.checklist.summary}`)
  console.log(`    composed sheets   : ${pkg.sheets.sheets.length} (${pkg.sheets.rationale})`)

  if (pkg.footprintEstimate) {
    const fe = pkg.footprintEstimate
    console.log(`\n    programme: ${houseSqFt.toLocaleString()} sq ft over ${storeys} storey(s)`)
    console.log(`    ${fe.basis}`)
    console.log(`    footprint estimate: ${fe.footprintSqFt.toLocaleString()} sq ft` +
      (fe.garageFootprintSqFt ? ` (incl. ${fe.garageFootprintSqFt} garage)` : '') +
      (fe.exact ? ' [exact]' : ' [estimated]'))
  }
  if (pkg.buildable) {
    const be = pkg.buildable
    console.log(`    setbacks: front ${be.setbacks.frontFt} ft, side ${be.setbacks.sideFt} ft, rear ${be.setbacks.rearFt} ft`)
    for (const c of be.constraints) {
      const lim = c.limitSqFt === null || !Number.isFinite(c.limitSqFt) ? 'n/a' : Math.round(c.limitSqFt) + ' sq ft'
      console.log(`    ${c.binding ? '>>' : '  '} ${c.name}: ${lim}`)
    }
    console.log(`    footprint drawn: ${be.footprintAreaSqFt ? Math.round(be.footprintAreaSqFt) + ' sq ft' : 'NONE'}`)
  }

  step(6, 'Rendering the sheet set to PDF')
  // SHEETS=C-100,C-400 forces a specific set instead of the composed one, which
  // is how you see a sheet the composer had no content for yet.
  const override = process.env.SHEETS?.split(',').map(x => x.trim()).filter(Boolean) as SheetId[] | undefined

  // One PDF page per COMPOSED page, not per canonical sheet. An infill lot
  // composes several canonical sheets onto one page; rendering one page each
  // would contradict the composition and pad the set.
  const pages: { primary: SheetId; covers: SheetId[] }[] = override?.length
    ? override.map(id => ({ primary: id, covers: [id] }))
    : pkg.sheets.sheets.map(s => ({ primary: s.covers[0] as SheetId, covers: s.covers as SheetId[] }))

  console.log(`    ${pages.length} page(s): ` +
    pages.map(p => p.covers.join('+')).join(' | '))

  const contexts = pages.map((pg, i) => {
    const ctx = buildSheetContext({
      sheet: pg.primary,
      twin: pkg.twin,
      projectName: pkg.lot,
      sheetIndex: i + 1,
      sheetCount: pages.length,
      status: 'PRELIMINARY',
      disclosure: pkg.disclosure,
    })
    // A composed page owes the County every note its covered sheets owe. When
    // the whole plan is one sheet, that sheet owes ALL of them — the grading
    // certificate does not disappear because the set was consolidated.
    const notes = pages.length === 1
      ? PG_REQUIRED_PLAN_NOTES
      : pg.covers.flatMap(c => requiredNotesForSheet(c))
    const seen = new Set<string>()
    return { ...ctx, requiredNotes: notes.filter(n => !seen.has(n.id) && seen.add(n.id)) }
  })

  // Responsibility is built per COMPOSED page and keyed by that page's first
  // covered sheet. A page rendered under a different primary id would find
  // nothing, so every covered sheet maps to the same block.
  const responsibility: Partial<Record<SheetId, DividedResponsibilityBlock>> = {}
  for (const r of pkg.responsibility) responsibility[r.sheet] = r
  for (const pg of pages) {
    if (responsibility[pg.primary]) continue
    const found = pg.covers.map(c => responsibility[c]).find(Boolean)
      ?? pkg.responsibility[0]
    if (found) responsibility[pg.primary] = { ...found, sheet: pg.primary }
  }

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
