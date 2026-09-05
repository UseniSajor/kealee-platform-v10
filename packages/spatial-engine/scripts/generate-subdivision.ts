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
  triangleRearAsSide?: boolean
  frontSetbackFt?: number
  frontFaceToCurbFt?: number
  curbOffsetFt?: number
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
  const swept = await fetchPgAtlasAdjacentParcels(c0[0], c0[1], {
    radiusFt: radiusFt + 200,
    excludePropId: site.parcel?.parcelId ?? null,
  })
  // ONLY THE ABUTTERS. A radius sweep over a subdivision returns the
  // neighbourhood — forty parcels here — and a plat shows the properties that
  // actually touch the boundary, eight of them, each lettered with its owner or
  // lot and its record reference. Forty outlines is not more information than
  // eight; it is the same drawing with the adjoiners no longer legible.
  const ABUT_TOLERANCE_FT = 3
  const adjacentParcels = swept.filter(pcl =>
    (pcl.ring.coordinates as Position[]).some(c =>
      outerRing.some((o, i) => {
        const n = outerRing[(i + 1) % outerRing.length]
        const vx = n[0] - o[0], vy = n[1] - o[1]
        const t = Math.max(0, Math.min(1,
          ((c[0] - o[0]) * vx + (c[1] - o[1]) * vy) / (vx * vx + vy * vy || 1)))
        return Math.hypot(c[0] - (o[0] + t * vx), c[1] - (o[1] + t * vy)) <= ABUT_TOLERANCE_FT
      })))
  console.log(`    adjoining lots  ${adjacentParcels.length} abutting `
    + `(${swept.length} within the sweep, the rest are not neighbours)`)

  const platRecordPath = outerPath.replace(/\.plat\.json$/, '.plat-record.json')
  let platRecord: {
    reference: string; notes: string[]; legend?: string[]
    adjoiners?: { boundary: string; label: string; reference: string }[]
    platEasements?: { type: string; widthFt: number; along: string; note: string }[]
    dedicationWidthFt?: number
    existingPavement?: { label: string; note: string }
    approvalsOfRecord?: { kind: string; number: string; confirmedBy: string; status: string }[]
    monuments?: { id: string; label: string; easting: number; northing: number; note: string }[]
    monumentNote?: string
    frontageSection?: { sidewalkWidthFt: number; plantingStripWidthFt: number; totalFt: number; note: string }
  } | undefined
  try { platRecord = JSON.parse(readFileSync(platRecordPath, 'utf8')) } catch { platRecord = undefined }
  console.log(`    plat record     ${platRecord ? 'transcribed text attached' : 'none found'}`)
  if (platRecord?.adjoiners?.length) {
    // The plat letters each adjoiner against the boundary it touches. That is
    // the information a reviewer uses; a GIS outline with no name on it is not.
    platRecord = {
      ...platRecord,
      notes: [
        ...platRecord.notes,
        'ADJOINING PROPERTIES, per the recorded plat: '
          + platRecord.adjoiners.map(a => `${a.label} (${a.reference}) — ${a.boundary}`).join('; ')
          + '.',
      ],
    }
    console.log(`    adjoiners       ${platRecord.adjoiners.length} lettered from the plat`)
  }

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
        triangleRearAsSide: spec.triangleRearAsSide,
        // PLAT FIRST. The dedication width and the frontage easement are
        // dimensioned on the recorded instrument; PGAtlas supplies the layers
        // the plat does not carry — contours, zoning, streets.
        frontSetbackFt: spec.frontSetbackFt ?? null,
        frontFaceToCurbFt: spec.frontFaceToCurbFt ?? null,
        curbOffsetFt: spec.curbOffsetFt ?? null,
        dedicationWidthFt: platRecord?.dedicationWidthFt ?? null,
        platFrontageEasementFt: platRecord?.platEasements?.find(
          e => e.along === 'frontage')?.widthFt ?? null,
        // Each lot's own package must know it was drawn from a plat, or its
        // missing-information report falls back to the GIS wording and the set
        // tells a reviewer the boundary is compiled when it is transcribed.
        platRecord,
        easements,
        adjacentParcels,
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
      + `  ·  ${easements?.length ?? 0} GIS + `
      + `${platRecord?.platEasements?.filter(e => e.along === 'frontage').length ?? 0} plat easement(s)`)
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

  // ONE CONTINUOUS SIDEWALK AND VERGE ACROSS THE WHOLE FRONTAGE.
  //
  // Each lot derived its own, so the walk was built in per-lot pieces that
  // stopped at every internal lot line — and a sidewalk that stops at a
  // property line is not a sidewalk. It runs the full frontage of the outer
  // boundary of record, corner to corner, which is also how it will be built:
  // the street construction permit covers the frontage, not the parcels.
  const frontageEdges: [Position, Position][] = []
  for (let i = 0; i < outerRing.length - 1; i++) {
    const a2 = outerRing[i], b2 = outerRing[i + 1]
    const mid: Position = [(a2[0] + b2[0]) / 2, (a2[1] + b2[1]) / 2]
    let d = Infinity
    for (const st of site.streets ?? []) {
      for (const path of st.paths) {
        for (let j = 0; j < path.length - 1; j++) {
          const p0 = path[j], p1 = path[j + 1]
          const vx = p1[0] - p0[0], vy = p1[1] - p0[1]
          const t = Math.max(0, Math.min(1,
            ((mid[0] - p0[0]) * vx + (mid[1] - p0[1]) * vy) / (vx * vx + vy * vy || 1)))
          d = Math.min(d, Math.hypot(mid[0] - (p0[0] + t * vx), mid[1] - (p0[1] + t * vy)))
        }
      }
    }
    if (d <= 60) frontageEdges.push([a2, b2])
  }

  const centreSegs: [Position, Position][] = (site.streets ?? [])
    .flatMap(st => st.paths)
    .flatMap(path => path.slice(0, -1).map((p, k) => [p, path[k + 1]] as [Position, Position]))
  const frontageFeats: SiteFeature[] = []
  const SW_W = platRecord?.frontageSection?.sidewalkWidthFt ?? 3
  const VERGE_W = platRecord?.frontageSection?.plantingStripWidthFt ?? 4
  frontageEdges.forEach(([a2, b2], i) => {
    const ex = b2[0] - a2[0], ey = b2[1] - a2[1]
    const el = Math.hypot(ex, ey) || 1
    // THE OUTWARD NORMAL IS MEASURED, NOT ASSUMED.
    //
    // Its sign depends on the ring's winding, and getting it backwards put the
    // walk and the kerb on the far side of the frontage — out at the street
    // centreline instead of in the right-of-way. Both candidates are tested
    // against the centreline and the one that moves TOWARD it is outward.
    const distTo = (q: Position) => {
      let d = Infinity
      for (const [p0, p1] of centreSegs) {
        const vx = p1[0] - p0[0], vy = p1[1] - p0[1]
        const tt = Math.max(0, Math.min(1,
          ((q[0] - p0[0]) * vx + (q[1] - p0[1]) * vy) / (vx * vx + vy * vy || 1)))
        d = Math.min(d, Math.hypot(q[0] - (p0[0] + tt * vx), q[1] - (p0[1] + tt * vy)))
      }
      return d
    }
    const mid: Position = [(a2[0] + b2[0]) / 2, (a2[1] + b2[1]) / 2]
    const cand: Position = [ey / el, -ex / el]
    const probe: Position = [mid[0] + cand[0] * 5, mid[1] + cand[1] * 5]
    const sign = distTo(probe) < distTo(mid) ? 1 : -1
    const nx = cand[0] * sign, ny = cand[1] * sign
    const toCentre = distTo(mid)

    const band = (from: number, width: number, id: string, kind: string, label: string) => {
      const ring: Ring = { coordinates: [
        [a2[0] + nx * from, a2[1] + ny * from],
        [b2[0] + nx * from, b2[1] + ny * from],
        [b2[0] + nx * (from + width), b2[1] + ny * (from + width)],
        [a2[0] + nx * (from + width), a2[1] + ny * (from + width)],
        [a2[0] + nx * from, a2[1] + ny * from],
      ] }
      frontageFeats.push({
        kind: kind as never, id: `${id}-${i}`, ring,
        attributes: { label, improvement: id.replace('frontage-', '') },
      } as never)
    }

    // THE SECTION IS MEASURED FROM THE LOTS' FRONT LINE, NOT THIS EDGE.
    //
    // This edge belongs to the OUTER boundary, which still contains the 20 ft
    // dedicated strip — the outer figure is 21,825 sq ft against the lots'
    // 17,606. So it is the FAR side of the dedication, hard against the street,
    // and every band measured outward from it landed in the travelled way: the
    // walk and the kerb came out at the centreline.
    //
    // Stepping back by the dedication width puts the origin on the lots' front
    // property line, which is what the section is dimensioned from.
    const dedicationFt = platRecord?.dedicationWidthFt ?? 20
    const o: Position = [a2[0] - nx * dedicationFt, a2[1] - ny * dedicationFt]
    const o2: Position = [b2[0] - nx * dedicationFt, b2[1] - ny * dedicationFt]
    const bandFrom = (from: number, width: number, id: string, kind: string, label: string,
                      p0: Position = o, p1: Position = o2) => {
      const ring: Ring = { coordinates: [
        [p0[0] + nx * from, p0[1] + ny * from],
        [p1[0] + nx * from, p1[1] + ny * from],
        [p1[0] + nx * (from + width), p1[1] + ny * (from + width)],
        [p0[0] + nx * (from + width), p0[1] + ny * (from + width)],
        [p0[0] + nx * from, p0[1] + ny * from],
      ] }
      frontageFeats.push({
        kind: kind as never, id: `${id}-${i}`, ring,
        attributes: { label, improvement: id.replace('frontage-', '') },
      } as never)
    }
    bandFrom(0, SW_W, 'frontage-sidewalk', 'Pavement', `CONCRETE SIDEWALK  ${SW_W}' WIDE`)
    bandFrom(SW_W, VERGE_W, 'frontage-verge', 'Surface',
      `PLANTING STRIP  ${VERGE_W}' WIDE  (STREET TREES)`)

    // CURB AND GUTTER, INTERRUPTED AT EVERY APRON.
    //
    // A continuous kerb drawn straight through a driveway entrance is wrong on
    // its face: the apron is where the kerb is depressed for a car to cross.
    // The gaps are taken from the aprons themselves, projected onto this edge,
    // so they cannot drift out of step with where the driveways actually are.
    const ux2 = (o2[0] - o[0]) / (Math.hypot(o2[0] - o[0], o2[1] - o[1]) || 1)
    const uy2 = (o2[1] - o[1]) / (Math.hypot(o2[0] - o[0], o2[1] - o[1]) || 1)
    const edgeLen = Math.hypot(o2[0] - o[0], o2[1] - o[1])
    const alongOf = (q: Position) => (q[0] - o[0]) * ux2 + (q[1] - o[1]) * uy2
    const gaps: [number, number][] = []
    for (const f of merged) {
      if (!/-apron$/.test(String(f.id))) continue
      const r = (f as { ring?: Ring }).ring?.coordinates as Position[] | undefined
      if (!r?.length) continue
      const proj = r.map(alongOf)
      gaps.push([Math.min(...proj) - 1, Math.max(...proj) + 1])
    }
    gaps.sort((g, h) => g[0] - h[0])
    let cursor = 0
    const curbSegs: [number, number][] = []
    for (const [g0, g1] of gaps) {
      if (g0 > cursor) curbSegs.push([cursor, Math.min(g0, edgeLen)])
      cursor = Math.max(cursor, g1)
    }
    if (cursor < edgeLen) curbSegs.push([cursor, edgeLen])
    curbSegs.forEach(([s0, s1], k) => {
      if (s1 - s0 < 0.5) return
      const p0: Position = [o[0] + ux2 * s0, o[1] + uy2 * s0]
      const p1: Position = [o[0] + ux2 * s1, o[1] + uy2 * s1]
      bandFrom(SW_W + VERGE_W, 1.5, `frontage-curb-${k}`, 'Pavement', 'CURB AND GUTTER', p0, p1)
    })
    console.log(`    frontage run    ${edgeLen.toFixed(2)} ft along the lots' front line `
      + `(lot frontages sum to ${lots.reduce((n, l) => n + (l.pkg.buildable?.frontage?.providedFt ?? 0), 0).toFixed(2)} ft)`)
    console.log(`    curb            ${curbSegs.length} run(s), `
      + `${gaps.length} apron depression(s)`)
    // The far right-of-way line, mirrored across the measured centreline.
    const far = toCentre * 2 + dedicationFt
    frontageFeats.push({
      kind: 'ExistingFeature', id: `row-far-${i}`,
      line: [[o[0] + nx * far, o[1] + ny * far], [o2[0] + nx * far, o2[1] + ny * far]],
      attributes: {
        label: `FAR RIGHT-OF-WAY LINE (DERIVED — ${toCentre.toFixed(1)} ft each side)`,
      },
    } as never)
    console.log(`    frontage        ${SW_W} ft walk, ${VERGE_W} ft strip, curb at `
      + `${SW_W + VERGE_W} ft out from the LOTS' front line; centreline `
      + `${(toCentre + dedicationFt).toFixed(1)} ft out, `
      + `R/W to R/W ${far.toFixed(1)} ft`)
  })
  // MONUMENTS OF RECORD. The plat publishes corner coordinates to four decimals
  // and letters IPF at them. On the drawing they give the field the positions to
  // recover — which is where a certification starts. Carrying them does not make
  // this a survey and the sheet does not say it does.
  for (const mon of platRecord?.monuments ?? []) {
    frontageFeats.push({
      kind: 'SpotElevation', id: `mon-${mon.id}`,
      point: [mon.easting, mon.northing] as Position,
      attributes: { label: `${mon.label} (${mon.id})`, note: mon.note, monument: true },
    } as never)
  }
  if (platRecord?.monuments?.length) {
    console.log(`    monuments       ${platRecord.monuments.length} of record, from the plat`)
  }

  // The per-lot pieces are replaced by the continuous run.
  const withoutPerLot = merged.filter(f =>
    !/(^|-)(sidewalk|verge)$/.test(String(f.id)))
  merged.length = 0
  merged.push(...withoutPerLot, ...frontageFeats)

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
