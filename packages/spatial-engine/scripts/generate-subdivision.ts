/**
 * The whole subdivision on one set of sheets — both lots, as the plat shows it.
 *
 * `generate-from-plat.ts` draws ONE lot. A recorded plat does not: it shows the
 * outer boundary, the internal division, and the area dedicated to public use,
 * all on one sheet, because those three things only make sense against each
 * other. A reviewer checking that the lots close against the outer boundary,
 * or that the dedication is what the plat says, cannot do it from two separate
 * drawings.
 *
 * So this builds each lot exactly as the single-lot generator does — same
 * setbacks, same envelope, same footprint placement, same county layers — and
 * composes them onto one boundary of record.
 *
 *   pnpm tsx scripts/generate-subdivision.ts \
 *     ../../output/site-plans/porter-subdivision.plat.json \
 *     ../../output/site-plans/porter-lot1.plat.json \
 *     ../../output/site-plans/porter-lot2.plat.json \
 *     ../../output/site-plans/porter-subdivision-permit-set.pdf
 *
 * SHEETS=... overrides the sheet list. ASCII_SHEETS=... narrows the terminal
 * render. The full canonical set is the default here: this output is meant for
 * submission, and a submission arrives complete.
 */

import { readFileSync, writeFileSync } from 'fs'
import { renderAsciiPlan } from '../src/sheets/render-ascii'
import { toDxf, toLandXml } from '../src/export/exporters'
import { buildRecordedPlatBoundary } from '../src/survey/recorded-plat'
import { resolvePgAtlasSite, fetchPgAtlasEasements, fetchPgAtlasAdjacentParcels } from '../src/jurisdictions/pgatlas'
import { fetchPgContours } from '../src/jurisdictions/pg-elevation'
import { buildLotPackage } from '../src/self-perform/lot-package'
import { renderSheetSetPdf } from '../src/sheets/render-pdf'
import { buildSheetContext } from '../src/sheets/render-svg'
import { SHEET_TITLES, type SheetId } from '../src/sheets/sheet-template'
import type { Position, SiteFeature, SiteTwin } from '../src/site-plan/site-twin'

const FULL_SET: SheetId[] = [
  'C-000', 'C-100', 'C-200', 'C-300', 'C-400',
  'C-500', 'C-600', 'C-700', 'C-800', 'C-900', 'L-100',
]

type PlatSpec = {
  address: string
  reference: Record<string, string>
  basisOfBearings?: string
  pointOfBeginning?: [number, number]
  recordedAreaSqFt?: number
  programme?: Record<string, unknown>
  calls: unknown[]
}

/** Even-odd point-in-ring. EPSG:2248 feet, no projection. */
function inRing(p: readonly number[], ring: readonly (readonly number[])[]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j]
    if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function centroidOf(ring: Position[]): [number, number] {
  return ring.reduce((a, c) => [a[0] + c[0] / ring.length, a[1] + c[1] / ring.length], [0, 0] as [number, number])
}

async function main(): Promise<void> {
  const [outerPath, ...rest] = process.argv.slice(2)
  const outPath = rest.pop()
  const lotPaths = rest
  if (!outerPath || !lotPaths.length || !outPath) {
    console.error('usage: generate-subdivision.ts <outer.plat.json> <lot.plat.json...> <out.pdf>')
    process.exit(1)
  }

  const outerSpec = JSON.parse(readFileSync(outerPath, 'utf8')) as PlatSpec
  const subdivisionName = outerSpec.reference.subdivisionName ?? 'Subdivision'
  console.log(`\n=== ${subdivisionName} — permit set, ${lotPaths.length} lots on one boundary ===\n`)

  const site = await resolvePgAtlasSite(outerSpec.address, {})
  if (!site) throw new Error(`The county locator did not match "${outerSpec.address}".`)

  // ── The outer boundary of record ──────────────────────────────────────────
  const outer = buildRecordedPlatBoundary({
    calls: outerSpec.calls as never,
    reference: outerSpec.reference as never,
    basisOfBearings: outerSpec.basisOfBearings ?? null,
    pointOfBeginning: outerSpec.pointOfBeginning ?? null,
    crs: 'EPSG:2248', horizontalDatum: 'NAD83',
    recordedAreaSqFt: outerSpec.recordedAreaSqFt ?? null,
    referenceParcel: site.parcel ? { coordinates: site.parcel.ring.coordinates } : null,
  })
  const outerRing = outer.ring.coordinates as Position[]
  console.log('[1] outer boundary')
  console.log(`    computed area   ${outer.computedAreaSqFt?.toFixed(0) ?? '—'} sq ft`
    + (outerSpec.recordedAreaSqFt ? `  (recorded ${outerSpec.recordedAreaSqFt.toLocaleString()})` : ''))
  console.log(`    precision       1:${outer.traverse.precisionDenominator?.toFixed(0) ?? '—'}`)

  // ── County layers, once, over the whole subdivision ───────────────────────
  const c0 = centroidOf(outerRing)
  const radiusFt = Math.ceil(Math.max(...outerRing.map(c => Math.hypot(c[0] - c0[0], c[1] - c0[1]))) + 100)
  const contours = await fetchPgContours(c0[0], c0[1], { radiusFt }).catch(() => null)
  const nearbyEasements = await fetchPgAtlasEasements(c0[0], c0[1], { radiusFt: radiusFt + 150 })
  console.log(`    contours        ${contours?.contours.length ?? 0} within ${radiusFt} ft`
    + (contours ? ` · ${contours.verticalDatum ?? 'datum not stated'}` : ' — NONE RETURNED'))

  // The adjoining lots, as the plat shows them. A boundary of record is read
  // against what it abuts; the subject parcel is excluded so it is not drawn
  // twice, once as the subject and once as its own neighbour.
  const adjacentParcels = await fetchPgAtlasAdjacentParcels(c0[0], c0[1], {
    radiusFt: radiusFt + 200,
    excludePropId: site.parcel?.parcelId ?? null,
  })
  console.log(`    adjoining lots  ${adjacentParcels.length}`)

  const platRecordPath = outerPath.replace(/\.plat\.json$/, '.plat-record.json')
  let platRecord: { reference: string; notes: string[]; legend?: string[] } | undefined
  try { platRecord = JSON.parse(readFileSync(platRecordPath, 'utf8')) } catch { platRecord = undefined }
  console.log(`    plat record     ${platRecord ? 'transcribed text attached' : 'none found'}`)

  // ── Each lot, built exactly as the single-lot generator builds it ─────────
  const lots = []
  for (const lotPath of lotPaths) {
    const spec = JSON.parse(readFileSync(lotPath, 'utf8')) as PlatSpec
    const plat = buildRecordedPlatBoundary({
      calls: spec.calls as never,
      reference: spec.reference as never,
      basisOfBearings: spec.basisOfBearings ?? null,
      pointOfBeginning: spec.pointOfBeginning ?? null,
      crs: 'EPSG:2248', horizontalDatum: 'NAD83',
      recordedAreaSqFt: spec.recordedAreaSqFt ?? null,
      referenceParcel: null,
    })
    const lotRing = plat.ring.coordinates as Position[]
    const easements = nearbyEasements === null ? undefined : nearbyEasements
      .filter(e => e.ring.coordinates.some(c => inRing(c, lotRing)))
      .map(e => ({
        ring: e.ring,
        easementType: String(e.attributes.EASEMENT_TYPE ?? e.category),
        beneficiary: e.attributes.NAME != null ? String(e.attributes.NAME) : undefined,
        recordReference: e.attributes.RECORD_PLAT != null ? `Record plat ${String(e.attributes.RECORD_PLAT)}` : undefined,
      }))
    const pkg = buildLotPackage(
      {
        name: spec.address, address: spec.address,
        jurisdictionCode: 'prince_georges_md',
        zoneCode: site.zoning?.zoneCode ?? '',
        isResidentialSingleFamily: true, dwellingUnitCount: 1,
        streetPoint: site.streetPoint, parcelId: site.parcel?.parcelId ?? null,
        streets: site.streets,
        easements,
        adjacentParcels,
        // Each lot's own package must know it was drawn from a plat, or its
        // missing-information report falls back to the GIS wording and the set
        // tells a reviewer the boundary is compiled when it is transcribed.
        platRecord,
        contours: contours?.contours, verticalDatum: contours?.verticalDatum ?? null,
        programme: spec.programme as never,
      },
      {
        ring: plat.ring,
        provenance: 'survey',
        authority: `Recorded plat ${subdivisionName} ${spec.reference.liber ?? ''} `
          + `f.${spec.reference.folio ?? ''}, lot ${spec.reference.lot ?? ''}`.trim(),
        retrievedAt: new Date().toISOString(),
      },
    )
    lots.push({ spec, plat, pkg, label: `LOT ${spec.reference.lot ?? '?'}` })
    console.log(`    ${`lot ${spec.reference.lot}`.padEnd(15)} ${plat.computedAreaSqFt?.toFixed(0)} sq ft`
      + `  (recorded ${spec.recordedAreaSqFt?.toLocaleString()})`
      + `  ·  ${Math.round(pkg.buildable?.footprintAreaSqFt ?? 0).toLocaleString()} sq ft footprint`
      + `  ·  ${easements?.length ?? 0} easement(s)`)
  }

  // ── Compose one twin ──────────────────────────────────────────────────────
  //
  // The first lot's twin carries the sources, datum, streets and zoning already
  // resolved, so it is the base. Its own Parcel becomes a lot line and the
  // OUTER boundary takes the Parcel slot at the front, where the renderers look
  // for the extents. Every other lot's features follow, re-identified so two
  // lots cannot collide on a feature id.
  const base = lots[0].pkg.twin
  const outerParcel: SiteFeature = {
    kind: 'Parcel', id: 'subdivision-outer',
    ring: outer.ring,
    parcelId: site.parcel?.parcelId ?? null,
    areaSqFt: outer.computedAreaSqFt ?? null,
  } as never

  const merged: SiteFeature[] = [outerParcel]
  lots.forEach((l, i) => {
    for (const f of l.pkg.twin.features) {
      // Contours and easements are identical across lots — the layers were
      // fetched once for the whole subdivision — so only the first lot
      // contributes them. Drawing them twice thickens every line.
      if (i > 0 && (f.kind === 'Contour' || f.kind === 'Easement')) continue
      merged.push({ ...f, id: `l${i + 1}-${f.id}` } as SiteFeature)
    }
  })

  let twin: SiteTwin = { ...base, features: merged, revision: base.revision + 1 }
  if (platRecord) twin = { ...twin, platRecord } as typeof twin

  // ── Sheets ────────────────────────────────────────────────────────────────
  const override = process.env.SHEETS?.split(',').map(x => x.trim()).filter(Boolean) as SheetId[] | undefined
  const sheetIds: SheetId[] = override ?? FULL_SET
  const projectName = `${subdivisionName} — ${lots.map(l => l.label).join(' & ')}`
  const sheets = sheetIds.map((sheet, i) => buildSheetContext({
    sheet, twin, projectName,
    status: 'PRELIMINARY', sheetIndex: i + 1, sheetCount: sheetIds.length,
  }))
  const out = await renderSheetSetPdf({ sheets, responsibility: undefined })
  writeFileSync(outPath, out.buffer)

  const dxfPath = outPath.replace(/\.pdf$/, '.dxf')
  const xmlPath = outPath.replace(/\.pdf$/, '.landxml.xml')
  writeFileSync(dxfPath, toDxf(twin))
  writeFileSync(xmlPath, toLandXml(twin))

  // ── Terminal review, every sheet ──────────────────────────────────────────
  const only = process.env.ASCII_SHEETS?.split(',').map(x => x.trim()).filter(Boolean)
  const toDraw = only?.length ? sheetIds.filter(id => only.includes(id)) : sheetIds
  const lotAreas = lots.map(l => `${l.label} ${l.plat.computedAreaSqFt?.toFixed(0)} SF`).join(' · ')
  for (const sheetId of toDraw) {
    console.log('')
    console.log(renderAsciiPlan({
      twin, sheet: sheetId,
      envelope: null, footprint: null,
      title: `${sheetId}  ${SHEET_TITLES[sheetId]}`,
      subtitle: `${subdivisionName.toUpperCase()} · ${lotAreas} · `
        + `${outer.computedAreaSqFt?.toFixed(0)} SF outer boundary of record`,
    }))
  }

  console.log(`\n[2] ${outPath}`)
  console.log(`    ${out.pageCount} sheet(s): ${sheetIds.join(' | ')}`)
  console.log(`    CAD: ${dxfPath}`)
  console.log(`         ${xmlPath}`)

  // ── What still gates a submission ─────────────────────────────────────────
  //
  // Merged and de-duplicated across lots: an item raised once per lot is one
  // item, and a reader who sees the same sentence twice stops reading them.
  const beforeSeal = [...new Set(lots.flatMap(l => l.pkg.beforeSeal))]
  console.log(`\n    ${beforeSeal.length} item(s) outstanding before a seal:`)
  for (const item of beforeSeal) console.log(`      · ${item}`)
}

main().catch(e => { console.error(e); process.exit(1) })
