/**
 * Propose a subdivision of a parcel that has NO recorded plat.
 *
 *   pnpm tsx scripts/propose-subdivision.ts "4600 Wheeler Rd" ../../output/site-plans/wheeler-4600
 *
 * What this does, and what it refuses to do:
 *
 *   - The OUTER boundary is the county parcel polygon (PGAtlas Property layer,
 *     Level 1). It is compiled from tax maps, not surveyed; the sheets say so.
 *     No plat exists in this repository for the address, so nothing here is a
 *     boundary of record and nothing is labelled as one.
 *   - Lots are PROPOSED: strips perpendicular to the fronting street, each
 *     meeting the zone's minimum net area, lot width and street frontage from
 *     the certified dimensional table (Sec. 27-4202), to a uniform depth. What
 *     is left behind the lots is a remainder parcel, because lots that do not
 *     front a street are not lots (Sec. 24-128) and an internal street is a
 *     design decision this script does not make.
 *   - The density cap is checked and reported; nothing is squeezed past it.
 *
 * It writes the plat-spec files that generate-subdivision.ts consumes — the
 * courses are derived from coordinates, not transcribed from an instrument —
 * so the same composition, county layers and sheet renderer produce the set.
 */
import { mkdirSync, writeFileSync } from 'fs'
import path from 'path'
import { resolvePgAtlasSite } from '../src/jurisdictions/pgatlas'
import { PG_ZONE_DIMENSIONAL_TABLES } from '../src/jurisdictions/pg-dimensional-standards.generated'

type P = [number, number]

// ── Geometry, EPSG:2248 feet ────────────────────────────────────────────────

function area(r: P[]): number {
  let a = 0
  for (let i = 0; i < r.length; i++) { const q = r[(i + 1) % r.length]; a += r[i][0] * q[1] - q[0] * r[i][1] }
  return a / 2
}
function closeRing(r: P[]): P[] {
  const first = r[0], last = r[r.length - 1]
  return first[0] === last[0] && first[1] === last[1] ? r : [...r, first]
}
function openRing(r: P[]): P[] {
  const first = r[0], last = r[r.length - 1]
  return first[0] === last[0] && first[1] === last[1] ? r.slice(0, -1) : r
}
/** Keep the side of the line a→b where cross ≥ 0 (left side). */
function clipHalfPlane(subject: P[], a: P, b: P): P[] {
  const side = (p: P) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])
  const out: P[] = []
  for (let j = 0; j < subject.length; j++) {
    const cur = subject[j], prev = subject[(j + subject.length - 1) % subject.length]
    const cIn = side(cur) >= -1e-9, pIn = side(prev) >= -1e-9
    const cut = (): P => {
      const d1 = side(prev), d2 = side(cur), t = d1 / (d1 - d2 || 1e-12)
      return [prev[0] + (cur[0] - prev[0]) * t, prev[1] + (cur[1] - prev[1]) * t]
    }
    if (cIn) { if (!pIn) out.push(cut()); out.push(cur) } else if (pIn) out.push(cut())
  }
  return out
}
function bearingOf(a: P, b: P): string {
  const dx = b[0] - a[0], dy = b[1] - a[1]
  const ns = dy >= 0 ? 'N' : 'S', ew = dx >= 0 ? 'E' : 'W'
  const deg = Math.atan2(Math.abs(dx), Math.abs(dy)) * 180 / Math.PI
  const d = Math.floor(deg), m = Math.floor((deg - d) * 60), s = Math.round(((deg - d) * 60 - m) * 60)
  return `${ns} ${String(d).padStart(2, '0')}-${String(m).padStart(2, '0')}-${String(s).padStart(2, '0')} ${ew}`
}
function courses(ring: P[], labels: (i: number) => string) {
  const r = openRing(ring)
  return r.map((p, i) => {
    const q = r[(i + 1) % r.length]
    return { kind: 'line', bearing: bearingOf(p, q), distanceFt: Math.round(Math.hypot(q[0] - p[0], q[1] - p[1]) * 100) / 100, label: labels(i) }
  })
}

// ── Zone standards ──────────────────────────────────────────────────────────

function standard(zone: string, startsWith: string): number | null {
  const table = PG_ZONE_DIMENSIONAL_TABLES[zone]
  const row = table?.rows.find(r => r.standard.startsWith(startsWith))
  const v = row?.values[0]?.replace(/,/g, '').match(/[\d.]+/)?.[0]
  return v ? Number(v) : null
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const [address, outDir] = process.argv.slice(2)
  if (!address || !outDir) { console.error('usage: propose-subdivision.ts "<street address>" <out dir>'); process.exit(1) }
  mkdirSync(outDir, { recursive: true })

  const site = await resolvePgAtlasSite(address, {})
  if (!site?.parcel) throw new Error(`No parcel for "${address}" — nothing is proposed on an invented boundary.`)
  const zone = site.zoning?.zoneCode ?? ''
  const ring = openRing(site.parcel.ring.coordinates as P[])
  const ccw = area(ring) > 0 ? ring : ring.slice().reverse()
  const parcelSqFt = Math.abs(area(ccw))

  const minArea = standard(zone, 'Net lot area, min.')
  const minWidth = standard(zone, 'Lot width, min.')
  const minFrontage = standard(zone, 'Lot frontage')
  const maxDensity = standard(zone, 'Density, max.')
  const frontYard = standard(zone, 'Front yard depth') ?? 25
  const sideYard = standard(zone, 'Side yard depth') ?? 8
  if (!minArea || !minWidth) throw new Error(`Zone ${zone} has no certified lot standards in the dimensional table.`)

  console.log(`\n=== ${site.address.matchedAddress} — proposed subdivision ===`)
  console.log(`    parcel ${site.parcel.propId}  ${parcelSqFt.toFixed(0)} sq ft (${(parcelSqFt / 43560).toFixed(3)} ac)  zone ${zone}`)
  console.log(`    RSF standards: min lot ${minArea} sf · width ${minWidth} ft · frontage ${minFrontage} ft · density ${maxDensity} du/ac`)

  // ── Front edge: the parcel edge nearest the street point ────────────────
  const sp = site.streetPoint as P | null
  if (!sp) throw new Error('No fronting street established (Sec. 24-128); lots cannot be proposed.')
  let best = { i: 0, d: Infinity }
  for (let i = 0; i < ccw.length; i++) {
    const a = ccw[i], b = ccw[(i + 1) % ccw.length]
    const vx = b[0] - a[0], vy = b[1] - a[1]
    const t = Math.max(0, Math.min(1, ((sp[0] - a[0]) * vx + (sp[1] - a[1]) * vy) / (vx * vx + vy * vy || 1)))
    const d = Math.hypot(sp[0] - (a[0] + t * vx), sp[1] - (a[1] + t * vy))
    if (d < best.d) best = { i, d }
  }
  const A = ccw[best.i], B = ccw[(best.i + 1) % ccw.length]
  const L = Math.hypot(B[0] - A[0], B[1] - A[1])
  const ux = (B[0] - A[0]) / L, uy = (B[1] - A[1]) / L        // along the frontage
  const nx = -uy, ny = ux                                      // inward normal (CCW ring → interior is left)
  console.log(`    frontage on ${site.streets[0]?.name ?? 'street'}: ${L.toFixed(1)} ft, street point ${best.d.toFixed(1)} ft off the edge`)

  // ── Lot strips ────────────────────────────────────────────────────────────
  // Width from the frontage divided into the most strips that still meet the
  // minimum width; depth uniform, the smallest that clears the minimum area
  // at that width plus a margin for the front-yard setback drawing well.
  const n = Math.floor(L / minWidth)
  const w = L / n
  const depth = Math.max(Math.ceil(minArea / w / 5) * 5 + 10, 120)
  const densityCap = maxDensity ? Math.floor(maxDensity * parcelSqFt / 43560) : Infinity

  const lots: { ring: P[]; sqFt: number; widthFt: number; ok: boolean; problems: string[] }[] = []
  let cursor = 0
  while (cursor < n) {
    let span = 1
    let lotRing: P[] = []
    let sqFt = 0
    for (;;) {
      const s0 = cursor * w, s1 = Math.min((cursor + span) * w, L)
      const p0: P = [A[0] + ux * s0, A[1] + uy * s0]
      const p1: P = [A[0] + ux * s1, A[1] + uy * s1]
      const back0: P = [p0[0] + nx * depth, p0[1] + ny * depth]
      const back1: P = [p1[0] + nx * depth, p1[1] + ny * depth]
      // clipHalfPlane keeps the LEFT of a→b. With u along the frontage and n
      // the inward normal (left of u): left of -n is +u, left of +n is -u,
      // left of -u is -n. So:
      let poly = ccw.slice()
      poly = clipHalfPlane(poly, back0, p0)         // along ≥ s0
      poly = clipHalfPlane(poly, p1, back1)         // along ≤ s1
      poly = clipHalfPlane(poly, back1, back0)      // depth ≤ D
      lotRing = poly
      sqFt = poly.length >= 3 ? Math.abs(area(poly)) : 0
      if (sqFt >= minArea || cursor + span >= n) break
      span++
    }
    const widthFt = span * w
    const problems: string[] = []
    if (sqFt < minArea) problems.push(`net area ${sqFt.toFixed(0)} < ${minArea} sf`)
    if (widthFt < minWidth) problems.push(`width ${widthFt.toFixed(1)} < ${minWidth} ft`)
    if (minFrontage && widthFt < minFrontage) problems.push(`frontage ${widthFt.toFixed(1)} < ${minFrontage} ft`)
    lots.push({ ring: lotRing, sqFt, widthFt, ok: problems.length === 0, problems })
    cursor += span
  }

  // A tail strip that could not reach the minimum is merged into its neighbour.
  if (lots.length > 1 && !lots[lots.length - 1].ok) {
    const tail = lots.pop()!
    const prev = lots[lots.length - 1]
    const s0 = (cursor - Math.round((prev.widthFt + tail.widthFt) / w)) * w
    const p0: P = [A[0] + ux * s0, A[1] + uy * s0]
    const back0: P = [p0[0] + nx * depth, p0[1] + ny * depth]
    const back1: P = [B[0] + nx * depth, B[1] + ny * depth]
    let poly = ccw.slice()
    poly = clipHalfPlane(poly, back0, p0)          // along ≥ s0
    poly = clipHalfPlane(poly, back1, back0)       // depth ≤ D
    prev.ring = poly; prev.sqFt = Math.abs(area(poly)); prev.widthFt = prev.widthFt + tail.widthFt
    prev.problems = prev.sqFt < minArea ? [`net area ${prev.sqFt.toFixed(0)} < ${minArea} sf`] : []
    prev.ok = prev.problems.length === 0
  }

  // Remainder: everything behind the lot band.
  const backA: P = [A[0] + nx * depth, A[1] + ny * depth]
  const backB: P = [B[0] + nx * depth, B[1] + ny * depth]
  const remainder = clipHalfPlane(ccw.slice(), backA, backB)   // depth ≥ D
  const remainderSqFt = remainder.length >= 3 ? Math.abs(area(remainder)) : 0

  const conforming = lots.filter(l => l.ok)
  console.log(`\n    ${lots.length} lots proposed along the frontage, ${w.toFixed(1)} ft × ${depth} ft; `
    + `${conforming.length} conform; density cap ${densityCap === Infinity ? 'n/a' : densityCap} du`)
  lots.forEach((l, i) => console.log(`      Lot ${i + 1}: ${l.widthFt.toFixed(1)} ft × ${l.sqFt.toFixed(0)} sf ${l.ok ? 'OK' : 'NOT CONFORMING — ' + l.problems.join('; ')}`))
  console.log(`      Remainder (Parcel A): ${remainderSqFt.toFixed(0)} sf — not a lot; needs a public street to subdivide further`)
  if (lots.length > densityCap) console.log(`    *** ${lots.length} lots exceeds the density cap of ${densityCap}`)

  // ── Emit plat-spec files for generate-subdivision.ts ──────────────────────
  const slug = path.basename(outDir)
  const subdivisionName = `${site.address.matchedAddress} — PRELIMINARY SUBDIVISION CONCEPT`
  const provenance =
    'PRELIMINARY. Outer boundary from the Prince George\'s County parcel layer (PGAtlas Property/MapServer/15), ' +
    'compiled from tax maps — NOT a boundary survey and NOT a plat of record. Lot lines are PROPOSED by Kealee. ' +
    'A Maryland licensed surveyor must establish the boundary before any plat is prepared.'
  const reference = { subdivisionName, recordedIn: 'NONE — no plat of record; preliminary concept' }
  const pob = ccw[best.i]
  const programme = { totalFloorAreaSqFt: 2400, storeys: 2, hasBasement: false, garage: 'attached_2_car', coveredPorch: true }

  const outerSpec = {
    _source: provenance,
    address: site.address.matchedAddress,
    reference: { ...reference, lot: 'outer boundary (county parcel)' },
    basisOfBearings: 'Maryland State Plane Coordinate System (NAD 83), from PGAtlas parcel geometry',
    pointOfBeginning: pob,
    recordedAreaSqFt: Math.round(parcelSqFt),
    programme,
    frontSetbackFt: frontYard, sideSetbackFt: sideYard,
    calls: courses([...ccw.slice(best.i), ...ccw.slice(0, best.i)], i => i === 0 ? `frontage — ${site.streets[0]?.name ?? 'street'}` : `county parcel edge ${i + 1}`),
  }
  writeFileSync(path.join(outDir, `${slug}.plat.json`), JSON.stringify(outerSpec, null, 2))
  writeFileSync(path.join(outDir, `${slug}.plat-record.json`), JSON.stringify({
    reference: `${subdivisionName}. Zone ${zone}. Parcel ${site.parcel.propId}, ${parcelSqFt.toFixed(0)} sq ft (${(parcelSqFt / 43560).toFixed(3)} ac). ${provenance}`,
    citation: 'PRELIMINARY CONCEPT — NO PLAT OF RECORD',
    notes: [
      'This drawing is a preliminary subdivision concept. It is not a plat, not a boundary survey, and not for recording.',
      `Lot lines are proposed to meet Sec. 27-4202 ${zone}: minimum net lot area ${minArea} sq ft, minimum lot width ${minWidth} ft, minimum frontage ${minFrontage} ft, maximum density ${maxDensity} du/ac.`,
      'The remainder parcel is not a buildable lot. Subdividing it requires a public street (Sec. 24-128) and a major subdivision preliminary plan (Subtitle 24).',
      'Boundary shown from the county parcel layer (Level 1). A field survey by a Maryland licensed surveyor governs.',
    ],
    dedicationWidthFt: 0,
    adjoiners: [],
  }, null, 2))

  const lotFiles: string[] = []
  lots.forEach((l, i) => {
    const lotSpec = {
      _source: provenance,
      address: site.address.matchedAddress,
      reference: { ...reference, lot: `${i + 1} (proposed)` },
      basisOfBearings: outerSpec.basisOfBearings,
      pointOfBeginning: l.ring[0],
      recordedAreaSqFt: Math.round(l.sqFt),
      programme,
      frontSetbackFt: frontYard, sideSetbackFt: sideYard,
      calls: courses(l.ring, j => j === 0 ? 'proposed lot line' : `proposed lot line ${j + 1}`),
    }
    const f = path.join(outDir, `${slug}-lot${i + 1}.plat.json`)
    writeFileSync(f, JSON.stringify(lotSpec, null, 2))
    lotFiles.push(f)
  })
  writeFileSync(path.join(outDir, `${slug}.proposal.json`), JSON.stringify({
    address: site.address.matchedAddress, parcelId: site.parcel.propId, zone, parcelSqFt,
    standards: { minArea, minWidth, minFrontage, maxDensity, frontYard, sideYard },
    frontage: { streetName: site.streets[0]?.name ?? null, lengthFt: L },
    lots: lots.map((l, i) => ({ lot: i + 1, widthFt: l.widthFt, sqFt: l.sqFt, conforming: l.ok, problems: l.problems, ring: l.ring })),
    remainder: { sqFt: remainderSqFt, ring: remainder },
    densityCap, generatedAt: new Date().toISOString(),
  }, null, 2))

  console.log(`\n    wrote ${lotFiles.length + 3} files to ${outDir}`)
  console.log(`    next: pnpm tsx scripts/generate-subdivision.ts ${path.join(outDir, `${slug}.plat.json`)} ${lotFiles.join(' ')} ${path.join(outDir, `${slug}-preliminary-set.pdf`)}`)
}

main().catch(e => { console.error(e); process.exit(1) })
