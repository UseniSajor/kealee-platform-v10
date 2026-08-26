/**
 * Renders a site plan to the terminal.
 *
 * Calls the same lot package the PDF path uses, then draws the geometry with
 * block characters instead of vectors. Same numbers, same source — a different
 * output device. It exists because a PDF is a poor way to check a plan while
 * iterating, not because the terminal is a delivery target.
 */

import { resolvePgAtlasSite } from '../src/jurisdictions/pgatlas'
import { fetchPgContours } from '../src/jurisdictions/pg-elevation'
import { buildLotPackage } from '../src/self-perform/lot-package'
import type { Position } from '../src/site-plan/site-twin'

const W = 96, H = 40

type Cell = { ch: string; z: number }

function blank(): Cell[][] {
  return Array.from({ length: H }, () => Array.from({ length: W }, () => ({ ch: ' ', z: -1 })))
}

function makeProjector(pts: Position[]) {
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1])
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const spanX = Math.max(1, maxX - minX), spanY = Math.max(1, maxY - minY)
  // Terminal cells are ~2x taller than wide, so X gets double resolution.
  const pad = 2
  return (p: Position): [number, number] => {
    const col = Math.round(((p[0] - minX) / spanX) * (W - 1 - pad * 2)) + pad
    // Y is flipped: northing increases upward, rows increase downward.
    const row = Math.round((1 - (p[1] - minY) / spanY) * (H - 1 - pad)) + 1
    return [Math.max(0, Math.min(W - 1, col)), Math.max(0, Math.min(H - 1, row))]
  }
}

function plot(g: Cell[][], c: number, r: number, ch: string, z: number) {
  if (r < 0 || r >= H || c < 0 || c >= W) return
  if (g[r][c].z <= z) g[r][c] = { ch, z }
}

function line(g: Cell[][], a: [number, number], b: [number, number], ch: string, z: number) {
  const steps = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]), 1)
  for (let i = 0; i <= steps; i++) {
    plot(g, Math.round(a[0] + ((b[0] - a[0]) * i) / steps),
            Math.round(a[1] + ((b[1] - a[1]) * i) / steps), ch, z)
  }
}

function ring(g: Cell[][], pts: Position[], P: (p: Position) => [number, number], ch: string, z: number) {
  for (let i = 0; i < pts.length - 1; i++) line(g, P(pts[i]), P(pts[i + 1]), ch, z)
}

/** True when the point is inside the polygon. Ray casting. */
function inside(pt: [number, number], poly: [number, number][]): boolean {
  let hit = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j]
    if ((yi > pt[1]) !== (yj > pt[1])
        && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi || 1e-9) + xi) hit = !hit
  }
  return hit
}

/**
 * Fills the POLYGON, not its bounding box.
 *
 * The footprint is rotated to the front lot line, so a bbox fill covers ground
 * the building does not occupy — on a 9,596 sq ft lot it made a 1,700 sq ft
 * house look like full coverage. Wrong in a way a reader would believe.
 */
function fill(g: Cell[][], pts: Position[], P: (p: Position) => [number, number], ch: string, z: number) {
  const proj = pts.map(P)
  const minC = Math.min(...proj.map(p => p[0])), maxC = Math.max(...proj.map(p => p[0]))
  const minR = Math.min(...proj.map(p => p[1])), maxR = Math.max(...proj.map(p => p[1]))
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      if (inside([c, r], proj)) plot(g, c, r, ch, z)
    }
  }
}

async function main() {
  const address = process.argv[2] ?? '1005 Rollins Ave'
  const houseSqFt = Number(process.env.HOUSE_SQFT ?? 2400)
  const storeys = Number(process.env.STOREYS ?? 2)

  const atlas = await resolvePgAtlasSite(address)
  if (!atlas?.parcel) { console.error('No parcel resolved for', address); process.exit(1) }

  let contours
  try {
    contours = await fetchPgContours(atlas.address.easting2248, atlas.address.northing2248, { radiusFt: 150 })
  } catch { /* terrain is optional for the sketch */ }

  const pkg = buildLotPackage(
    {
      name: atlas.address.matchedAddress, address: atlas.address.matchedAddress,
      jurisdictionCode: 'prince_georges_md', zoneCode: atlas.zoning?.zoneCode ?? '',
      isResidentialSingleFamily: true, dwellingUnitCount: 1,
      streetPoint: atlas.streetPoint as [number, number] | null,
      parcelId: atlas.parcel.propId,
      contours: contours?.contours.map(c => ({
        elevationFt: c.elevationFt, path: c.path, weight: c.weight, hidden: c.hidden,
      })),
      verticalDatum: contours?.verticalDatum ?? null,
      programme: houseSqFt > 0
        ? { totalFloorAreaSqFt: houseSqFt, storeys,
            garage: (process.env.GARAGE as never) ?? 'attached_2_car',
            coveredPorch: process.env.PORCH === '1' }
        : undefined,
    },
    { ring: atlas.parcel.ring, provenance: 'jurisdiction_gis',
      authority: 'PGAtlas Property', retrievedAt: new Date().toISOString() },
  )

  const lot = atlas.parcel.ring.coordinates
  const P = makeProjector(lot as Position[])
  const g = blank()

  // z-order: contours < envelope < lot < building
  // Clip terrain to the lot's own extent. Contours are fetched over a 150 ft
  // radius, so unclipped they draw the neighbourhood and bury the lot.
  const lx = (lot as Position[]).map(p => p[0]), ly = (lot as Position[]).map(p => p[1])
  const inLot = (p: Position) =>
    p[0] >= Math.min(...lx) && p[0] <= Math.max(...lx) &&
    p[1] >= Math.min(...ly) && p[1] <= Math.max(...ly)
  for (const c of (contours?.contours ?? [])) {
    for (let i = 0; i < c.path.length - 1; i++) {
      const a = c.path[i] as Position, b2 = c.path[i + 1] as Position
      if (!inLot(a) && !inLot(b2)) continue
      line(g, P(a), P(b2), c.weight === 'index' ? '~' : '·', 0)
    }
  }
  if (pkg.buildable?.ring) ring(g, pkg.buildable.ring.coordinates as Position[], P, '+', 1)
  ring(g, lot as Position[], P, '#', 2)
  if (pkg.buildable?.footprint) {
    fill(g, pkg.buildable.footprint.coordinates as Position[], P, '█', 3)
    ring(g, pkg.buildable.footprint.coordinates as Position[], P, '█', 4)
  }
  if (atlas.streetPoint) {
    const [c, r] = P(atlas.streetPoint as Position)
    for (let d = -6; d <= 6; d++) plot(g, c + d, Math.min(H - 1, r), '=', 2)
  }

  const b = pkg.buildable
  const bind = b?.constraints.find(x => x.binding)
  const bar = '─'.repeat(W)

  console.log(`\n┌${bar}┐`)
  const centre = (s: string) => `│${s.padStart(Math.floor((W + s.length) / 2)).padEnd(W)}│`
  console.log(centre(atlas.address.matchedAddress))
  console.log(centre(`${atlas.zoning?.zoneCode ?? '—'}  ·  ${Math.round(atlas.parcel.areaSqFt).toLocaleString()} SQ FT  ·  PRELIMINARY`))
  console.log(`├${bar}┤`)
  for (const row of g) console.log(`│${row.map(c => c.ch).join('')}│`)
  console.log(`├${bar}┤`)
  console.log(`│ ${'# lot line   + BRL setback   █ proposed dwelling   ~ index contour   · intermediate   = street'.padEnd(W - 1)}│`)
  console.log(`└${bar}┘`)

  const row = (k: string, v: string) => console.log(`  ${k.padEnd(30)} ${v}`)
  console.log('\n  SITE DATA')
  row('Zone', atlas.zoning?.zoneCode ?? '—')
  row('Tax / parcel ID', atlas.parcel.propId ?? '—')
  row('Gross lot area', `${Math.round(atlas.parcel.areaSqFt).toLocaleString()} SF  (${(atlas.parcel.areaSqFt / 43560).toFixed(3)} AC)`)
  row('Front / side / rear yard', `${b?.setbacks.frontFt ?? '—'}' / ${b?.setbacks.sideFt ?? '—'}' / ${b?.setbacks.rearFt ?? '—'}'`)
  row('Buildable envelope', b?.envelopeAreaSqFt ? `${Math.round(b.envelopeAreaSqFt).toLocaleString()} SF` : '—')
  row('Street frontage (Sec. 24-128)', b?.hasStreetFrontage ? 'resolved' : 'NOT RESOLVED')
  row('Vertical datum', contours?.verticalDatum ?? 'NOT ESTABLISHED')
  row('Contours', contours ? `${contours.contours.length} lines, ${contours.elevationsFt[0]}–${contours.elevationsFt[contours.elevationsFt.length - 1]} ft @ ${contours.intervalFt} ft` : '—')

  console.log('\n  FOOTPRINT')
  if (pkg.footprintEstimate) row('Programme', `${houseSqFt.toLocaleString()} SF over ${storeys} storey(s)`)
  if (pkg.footprintEstimate) row('Basis', pkg.footprintEstimate.basis)
  for (const c of b?.constraints ?? []) {
    const lim = c.limitSqFt == null || !Number.isFinite(c.limitSqFt) ? 'n/a' : `${Math.round(c.limitSqFt).toLocaleString()} SF`
    row(`${c.binding ? '>>' : '  '} ${c.name}`, lim)
  }
  row('Drawn', b?.footprintAreaSqFt ? `${Math.round(b.footprintAreaSqFt).toLocaleString()} SF` : 'NONE')

  console.log(`\n  SHEETS  ${pkg.sheets.sheets.length} — ${pkg.sheets.rationale}`)
  console.log(`\n  BEFORE A PROFESSIONAL WILL SEAL  (${pkg.beforeSeal.length} items, plan is delivered regardless)`)
  for (const s of pkg.beforeSeal.slice(0, 4)) console.log(`    · ${s.slice(0, 92)}`)
  console.log('\n  Jurisdiction approval is separate and not implied.\n')
}

main().catch(e => { console.error('FAILED:', e.message); process.exit(1) })
