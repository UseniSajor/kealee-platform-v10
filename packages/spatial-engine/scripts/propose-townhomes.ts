/**
 * Yield study and block layout for attached housing on a commercial-zone
 * (CGO) site: townhouses, two-family (duplex) and two-over-two dwellings.
 *
 *   pnpm tsx scripts/propose-townhomes.ts ../../output/site-plans/livingston-fort-washington \
 *     --accounts 0412007,5770367,5770375 --name "Livingston of Fort Washington"
 *
 * Everything is read, not assumed: the parcels and their owner from PGAtlas
 * Address/Property, the zone from Zoning/63, the county's certified CGO table
 * (Sec. 27-4203) for density, lot width, coverage and yards, and the county's
 * stream, slope, floodplain and woodland-conservation layers for what cannot
 * be built on. Parking ratios are STATED AS ASSUMED — Sec. 27-6300 is not in
 * the certified tables this engine carries.
 *
 * The layout is a block diagram: streets across the developable ground and
 * sticks of units along them, each unit's lot clipped to the ground it can
 * actually have. It is a yield study for a Detailed Site Plan, not the DSP.
 */
import { mkdirSync, writeFileSync } from 'fs'
import path from 'path'
import polygonClipping from 'polygon-clipping'
import PDFDocument from 'pdfkit'
import { createWriteStream } from 'fs'
import { PGATLAS_ENDPOINTS, fetchPgAtlasPropertyRecord, type PgAtlasPropertyRecord } from '../src/jurisdictions/pgatlas'
import { PG_ZONE_DIMENSIONAL_TABLES } from '../src/jurisdictions/pg-dimensional-standards.generated'

type P = [number, number]
type MP = polygonClipping.MultiPolygon

// ── Unit types — footprints and lots as PG townhouse DSPs commonly draw them ──
//
// Each is a stick along a street. The zone table gives the minimums (20-ft lot
// width, 10/8/15 yards, 65% coverage); these are typical marketable units
// above them, and they are the ASSUMPTIONS the yield rests on.
const UNIT_TYPES = {
  townhouse: {
    label: 'Townhouse', column: 'Townhouse Dwelling',
    lotWidthFt: 20, lotDepthFt: 90, footprintFt: [20, 40] as [number, number], unitsPerBay: 1,
    stickMaxUnits: 6, breakFt: 16, parkingPerUnit: 2.0, parkingWhere: 'front-load garage + driveway on the lot',
  },
  twoFamily: {
    label: 'Two-family (duplex)', column: 'Two-Family Dwelling',
    lotWidthFt: 30, lotDepthFt: 90, footprintFt: [30, 40] as [number, number], unitsPerBay: 1,
    stickMaxUnits: 2, breakFt: 16, parkingPerUnit: 2.0, parkingWhere: 'garage + driveway on each lot',
  },
  twoOverTwo: {
    label: 'Two-over-two (stacked, 2 units per bay)', column: 'Multifamily Dwelling, Artists’ Residential Studio, Live-Work Dwelling (2)',
    lotWidthFt: 24, lotDepthFt: 100, footprintFt: [24, 48] as [number, number], unitsPerBay: 2,
    stickMaxUnits: 8, breakFt: 20, parkingPerUnit: 1.5, parkingWhere: 'one garage space per unit + surface bays along the street',
  },
} as const
type UnitKey = keyof typeof UNIT_TYPES

const STREET_FT = 40           // private street: 26-ft pavement, walk one side, in a 40-ft strip (assumed)
const ENTRANCE_FT = 60         // the public-road connection

// ── Geometry ────────────────────────────────────────────────────────────────
const area = (r: P[]) => { let a = 0; for (let i = 0; i < r.length; i++) { const q = r[(i + 1) % r.length]; a += r[i][0] * q[1] - q[0] * r[i][1] } return a / 2 }
const openRing = (r: P[]): P[] => { const f = r[0], l = r[r.length - 1]; return f[0] === l[0] && f[1] === l[1] ? r.slice(0, -1) : r }
const clean = (r: P[]): P[] => { const o: P[] = []; for (const p of r) { const q: P = [Math.round(p[0] * 100) / 100, Math.round(p[1] * 100) / 100]; const l = o[o.length - 1]; if (!l || l[0] !== q[0] || l[1] !== q[1]) o.push(q) } while (o.length > 1 && o[0][0] === o[o.length - 1][0] && o[0][1] === o[o.length - 1][1]) o.pop(); return o.length >= 3 ? o : [] }
const asMP = (r: P[]): MP => { const c = clean(r); return c.length ? [[[...c, c[0]]]] : [] }
const mpOf = (rings: P[][]): MP => rings.map(clean).filter(r => r.length >= 3).map(r => [[...r, r[0]]])
const union = (rings: P[][]): MP => { const m = mpOf(rings); if (!m.length) return []; try { return polygonClipping.union(m[0], ...m.slice(1)) } catch { return [] } }
const unionMP = (a: MP, b: MP): MP => { try { return a.length ? (b.length ? polygonClipping.union(a, b) : a) : b } catch { return a } }
const intersection = (a: MP, b: MP): MP => { try { return a.length && b.length ? polygonClipping.intersection(a, b) : [] } catch { return [] } }
const difference = (a: MP, b: MP): MP => { try { return a.length ? (b.length ? polygonClipping.difference(a, b) : a) : [] } catch { return [] } }
const mpArea = (mp: MP) => mp.reduce((s, poly) => s + Math.abs(area(openRing(poly[0] as P[]))) - poly.slice(1).reduce((h, hole) => h + Math.abs(area(openRing(hole as P[]))), 0), 0)
const rings = (mp: MP): P[][] => mp.map(poly => openRing(poly[0] as P[]))
const add = (o: P, d: P, k: number): P => [o[0] + d[0] * k, o[1] + d[1] * k]
const norm = (d: P): P => { const l = Math.hypot(d[0], d[1]) || 1; return [d[0] / l, d[1] / l] }
const leftOf = (d: P): P => [-d[1], d[0]]
const dot = (p: P, o: P, d: P) => (p[0] - o[0]) * d[0] + (p[1] - o[1]) * d[1]
function bufferPolyline(pts: P[], hw: number): P[][] {
  const out: P[][] = []
  for (let i = 0; i + 1 < pts.length; i++) {
    const d = norm([pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]]), n = leftOf(d)
    out.push([add(pts[i], n, hw), add(pts[i + 1], n, hw), add(pts[i + 1], n, -hw), add(pts[i], n, -hw)])
    out.push(Array.from({ length: 16 }, (_, k) => [pts[i][0] + hw * Math.cos(2 * Math.PI * k / 16), pts[i][1] + hw * Math.sin(2 * Math.PI * k / 16)] as P))
  }
  const last = pts[pts.length - 1]
  out.push(Array.from({ length: 16 }, (_, k) => [last[0] + hw * Math.cos(2 * Math.PI * k / 16), last[1] + hw * Math.sin(2 * Math.PI * k / 16)] as P))
  return out
}
function pointInRing(pt: P, r: P[]): boolean {
  let inside = false
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const xi = r[i][0], yi = r[i][1], xj = r[j][0], yj = r[j][1]
    if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi) inside = !inside
  }
  return inside
}
/** A point inside the ring: the centroid when it is, else the inside-most sample of a grid over the ring. */
function interiorPoint(r: P[]): P {
  const c = r.reduce((a, q) => [a[0] + q[0] / r.length, a[1] + q[1] / r.length], [0, 0] as P)
  if (pointInRing(c, r)) return c
  const xs = r.map(q => q[0]), ys = r.map(q => q[1])
  let best: P = c, bestD = -1
  for (let i = 1; i < 20; i++) for (let j = 1; j < 20; j++) {
    const q: P = [Math.min(...xs) + (Math.max(...xs) - Math.min(...xs)) * i / 20, Math.min(...ys) + (Math.max(...ys) - Math.min(...ys)) * j / 20]
    if (!pointInRing(q, r)) continue
    let d = Infinity
    for (let k = 0; k < r.length; k++) { const a = r[k], b = r[(k + 1) % r.length]; const vx = b[0] - a[0], vy = b[1] - a[1]; const t = Math.max(0, Math.min(1, ((q[0] - a[0]) * vx + (q[1] - a[1]) * vy) / (vx * vx + vy * vy || 1))); d = Math.min(d, Math.hypot(q[0] - a[0] - t * vx, q[1] - a[1] - t * vy)) }
    if (d > bestD) { bestD = d; best = q }
  }
  return best
}
function bearingOf(a: P, b: P): string {
  const dx = b[0] - a[0], dy = b[1] - a[1]
  const ns = dy >= 0 ? 'N' : 'S', ew = dx >= 0 ? 'E' : 'W'
  let total = Math.round(Math.atan2(Math.abs(dx), Math.abs(dy)) * 180 / Math.PI * 3600)
  const d = Math.floor(total / 3600); total -= d * 3600; const m = Math.floor(total / 60), s = total - m * 60
  return `${ns} ${String(d).padStart(2, '0')}-${String(m).padStart(2, '0')}-${String(s).padStart(2, '0')} ${ew}`
}

// ── County data ─────────────────────────────────────────────────────────────
const ENV = 'https://gis.pgatlas.com/pgatlas/rest/services/Environmental/MapServer'
async function arcgis(url: string, params: Record<string, string>) {
  const res = await fetch(`${url}/query?` + new URLSearchParams({ f: 'json', inSR: '2248', outSR: '2248', ...params }))
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`)
  const j = await res.json() as { features?: { attributes?: Record<string, unknown>; geometry?: { rings?: number[][][]; paths?: number[][][] } }[]; error?: unknown }
  if (j.error) throw new Error(`${url}: ${JSON.stringify(j.error)}`)
  return j.features ?? []
}
async function parcelByAccount(acct: string) {
  const f = await arcgis(PGATLAS_ENDPOINTS.propertyRecords, { where: `ACCOUNT='${acct}'`, outFields: 'ACCOUNT,OWNER_NAME,LAND_AREA_ACRE,LAND_AREA_SQFT,PROPERTY_DESC,SUB_NAME,PLAT,LIBER,FOLIO', returnGeometry: 'true' })
  if (!f.length || !f[0].geometry?.rings?.length) return null
  const ring = openRing(f[0].geometry.rings[0].map(c => [c[0], c[1]] as P))
  return { ring: area(ring) > 0 ? ring : ring.slice().reverse(), attributes: f[0].attributes ?? {} }
}
async function zoneAt(p: P): Promise<string | null> {
  const f = await arcgis(`${PGATLAS_ENDPOINTS.zoning}`, { where: '1=1', geometry: `${p[0]},${p[1]}`, geometryType: 'esriGeometryPoint', spatialRel: 'esriSpatialRelIntersects', outFields: 'ARCDBA.PGATLAS_ZONECODE.CODE', returnGeometry: 'false' })
  return f.length ? String(f[0].attributes?.['ARCDBA.PGATLAS_ZONECODE.CODE'] ?? '') : null
}
function standard(zone: string, column: string, startsWith: string): number | null {
  const t = PG_ZONE_DIMENSIONAL_TABLES[zone]
  if (!t) return null
  const ci = t.useColumns.indexOf(column)
  const row = t.rows.find(r => r.standard.startsWith(startsWith))
  const v = row?.values[ci]?.replace(/,/g, '').match(/[\d.]+/)?.[0]
  return v ? Number(v) : null
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const argv = process.argv.slice(2)
  const flag = (k: string) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined }
  const outDir = argv.find(a => !a.startsWith('--') && !argv.includes(`--${a}`) && argv[argv.indexOf(a) - 1]?.startsWith('--') !== true)
  const accounts = (flag('--accounts') ?? '').split(',').map(s => s.trim()).filter(Boolean)
  const name = flag('--name') ?? 'CGO residential yield study'
  const mixArg = flag('--mix') ?? 'twoOverTwo,townhouse,townhouse,twoFamily'   // band assignment from the commercial edge inward
  if (!outDir || !accounts.length) { console.error('usage: propose-townhomes.ts <out dir> --accounts A,B,C [--name N] [--mix band,band,...]'); process.exit(1) }
  mkdirSync(outDir, { recursive: true })
  const slug = path.basename(outDir)

  // Parcels, owners, zones
  const parcels: { account: string; ring: P[]; record: PgAtlasPropertyRecord | null; zone: string | null; sqFt: number }[] = []
  for (const acct of accounts) {
    const p = await parcelByAccount(acct)
    if (!p) { console.log(`    account ${acct}: NOT FOUND on PGAtlas`); continue }
    const c = interiorPoint(p.ring)
    const record = await fetchPgAtlasPropertyRecord(c[0], c[1])
    const zone = await zoneAt(c)
    parcels.push({ account: acct, ring: p.ring, record, zone, sqFt: Math.abs(area(p.ring)) })
    console.log(`    ${acct}: ${record?.ownerName ?? '?'} · ${record?.propertyDesc ?? ''} · ${(Math.abs(area(p.ring)) / 43560).toFixed(3)} ac GIS (${record?.acres ?? '?'} ac assessed) · zone ${zone ?? '?'}`)
  }
  if (!parcels.length) throw new Error('No parcels.')
  const zones = [...new Set(parcels.map(p => p.zone).filter(Boolean))]
  const zone = zones.length === 1 ? zones[0]! : (() => { throw new Error(`Parcels are not all one zone: ${zones.join(', ')}`) })()
  if (!PG_ZONE_DIMENSIONAL_TABLES[zone]) throw new Error(`No certified dimensional table for zone ${zone}.`)
  const tract = union(parcels.map(p => p.ring))
  const tractSqFt = mpArea(tract)
  const bbox = parcels.flatMap(p => p.ring).reduce((e, q) => ({ x0: Math.min(e.x0, q[0]), x1: Math.max(e.x1, q[0]), y0: Math.min(e.y0, q[1]), y1: Math.max(e.y1, q[1]) }), { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity })
  const env = `${bbox.x0 - 100},${bbox.y0 - 100},${bbox.x1 + 100},${bbox.y1 + 100}`
  console.log(`    tract ${tractSqFt.toFixed(0)} sf (${(tractSqFt / 43560).toFixed(3)} ac), zone ${zone}`)

  // What cannot be built on — the county's own layers, clipped to the tract.
  const q = (layer: number, extra: Record<string, string> = {}) => arcgis(`${ENV}/${layer}`, { where: '1=1', geometry: env, geometryType: 'esriGeometryEnvelope', spatialRel: 'esriSpatialRelIntersects', outFields: '*', returnGeometry: 'true', ...extra })
  const streams = (await q(1)).filter(f => [4110, 4111, 4112, 4113].includes(Number(f.attributes?.FEATURE_CODE)))
  const streamPaths = streams.flatMap(f => f.geometry?.paths ?? []).map(pth => pth.map(c => [c[0], c[1]] as P))
  const STREAM_BUFFER_FT = 50   // the Primary Management Area's minimum stream buffer (Sec. 24-130 / the Environmental Technical Manual); expanded at steep slopes, which are taken separately
  const pma = intersection(union(streamPaths.flatMap(p => bufferPolyline(p, STREAM_BUFFER_FT))), tract)
  const slopes = await q(13)
  // Slopes over 25% are taken out only where they form a body of ground (a
  // ravine side), not where they are a ribbon (a graded embankment of the
  // existing development, which a new grading plan takes out). A ribbon is a
  // polygon whose area is small against its perimeter — here, under 0.25 ac.
  // A body is at least 0.25 ac AND wider than a graded bank: mean width 2A/P over 30 ft.
  const STEEP_BODY_MIN_SQFT = 0.25 * 43560, STEEP_BODY_MIN_WIDTH_FT = 30
  const perim = (r: P[]) => r.reduce((t, p, i) => t + Math.hypot(r[(i + 1) % r.length][0] - p[0], r[(i + 1) % r.length][1] - p[1]), 0)
  const isBody = (poly: polygonClipping.Polygon) => { const r = openRing(poly[0] as P[]); const a = Math.abs(area(r)); return a >= STEEP_BODY_MIN_SQFT && 2 * a / perim(r) >= STEEP_BODY_MIN_WIDTH_FT }
  const steepAll = intersection(union(slopes.filter(f => Number(f.attributes?.RANGE) === 90).flatMap(f => f.geometry?.rings ?? []).map(r => openRing(r.map(c => [c[0], c[1]] as P)))), tract)
  const steep: MP = steepAll.filter(isBody)
  const steepRibbonsSqFt = mpArea(steepAll) - mpArea(steep)
  const moderate = intersection(union(slopes.filter(f => Number(f.attributes?.RANGE) === 25).flatMap(f => f.geometry?.rings ?? []).map(r => openRing(r.map(c => [c[0], c[1]] as P)))), tract)
  const flood = (await q(3)).filter(f => !/^X$/i.test(String(f.attributes?.FLD_ZONE ?? '')))
  const floodplain = intersection(union(flood.flatMap(f => f.geometry?.rings ?? []).map(r => openRing(r.map(c => [c[0], c[1]] as P)))), tract)
  const wca = await q(26)
  const woodland = intersection(union(wca.flatMap(f => f.geometry?.rings ?? []).map(r => openRing(r.map(c => [c[0], c[1]] as P)))), tract)
  const wetlands = intersection(union((await q(25)).flatMap(f => f.geometry?.rings ?? []).map(r => openRing(r.map(c => [c[0], c[1]] as P)))), tract)
  const constraints = [pma, steep, floodplain, woodland, wetlands].reduce((a, b) => unionMP(a, b), [] as MP)
  let developable: MP = tract
  for (const [label, cst] of [['stream buffer', pma], ['steep slopes', steep], ['floodplain', floodplain], ['woodland conservation', woodland], ['wetlands', wetlands]] as const) {
    if (!cst.length) continue
    let next: MP = []
    try { next = polygonClipping.difference(developable, cst) } catch (e) { console.log(`    !! subtracting ${label} failed in the polygon library (${(e as Error).message.slice(0, 60)}); it is NOT taken out`); continue }
    developable = next
  }
  const devSqFt = mpArea(developable)
  console.log(`    constraints in the tract: stream buffer ${(mpArea(pma) / 43560).toFixed(2)} ac · slopes >25% in bodies (≥ 0.25 ac and ≥ 30 ft wide) ${(mpArea(steep) / 43560).toFixed(2)} ac (ribbons regraded: ${(steepRibbonsSqFt / 43560).toFixed(2)} ac; 15–25%: ${(mpArea(moderate) / 43560).toFixed(2)} ac) · floodplain ${(mpArea(floodplain) / 43560).toFixed(2)} ac · woodland conservation (approved TCP) ${(mpArea(woodland) / 43560).toFixed(2)} ac · wetlands ${(mpArea(wetlands) / 43560).toFixed(2)} ac`)
  console.log(`    developable ${devSqFt.toFixed(0)} sf (${(devSqFt / 43560).toFixed(3)} ac) in ${developable.length} piece(s)`)

  // Zone standards per unit type, from the certified table
  const stds = Object.fromEntries((Object.keys(UNIT_TYPES) as UnitKey[]).map(k => {
    const u = UNIT_TYPES[k]
    return [k, {
      densityDuAc: standard(zone, u.column, 'Density, max.'), minLotSqFt: standard(zone, u.column, 'Net lot area, min.'), minLotWidthFt: standard(zone, u.column, 'Lot width, min.'),
      maxCoveragePct: standard(zone, u.column, 'Lot coverage, max.'), frontFt: standard(zone, u.column, 'Front yard'), sideFt: standard(zone, u.column, 'Side yard'), rearFt: standard(zone, u.column, 'Rear yard'), maxHeightFt: standard(zone, u.column, 'Principal structure height'),
    }]
  })) as Record<UnitKey, { densityDuAc: number | null; minLotSqFt: number | null; minLotWidthFt: number | null; maxCoveragePct: number | null; frontFt: number | null; sideFt: number | null; rearFt: number | null; maxHeightFt: number | null }>
  for (const k of Object.keys(stds) as UnitKey[]) { const s = stds[k]; console.log(`    ${zone} ${UNIT_TYPES[k].label}: ${s.densityDuAc} du/ac · lot ≥ ${s.minLotSqFt ?? 'no min'} sf, ≥ ${s.minLotWidthFt} ft wide · coverage ≤ ${s.maxCoveragePct}% · yards ${s.frontFt}/${s.sideFt}/${s.rearFt} · height ≤ ${s.maxHeightFt} ft`) }

  // ── Block layout ──────────────────────────────────────────────────────────
  // Streets run along the developable ground's long axis; bands of lots sit
  // either side of each street; the entrance is from the public road at the
  // tract's frontage (the edge nearest the tract's longest boundary segment is
  // taken as the commercial frontage and the first band is placed there).
  const devRing = rings(developable).sort((a, b) => Math.abs(area(b)) - Math.abs(area(a)))[0]
  const cen = devRing.reduce((a, p) => [a[0] + p[0] / devRing.length, a[1] + p[1] / devRing.length], [0, 0] as P)
  let sxx = 0, sxy = 0, syy = 0
  for (const p of devRing) { const dx = p[0] - cen[0], dy = p[1] - cen[1]; sxx += dx * dx; sxy += dx * dy; syy += dy * dy }
  const theta = 0.5 * Math.atan2(2 * sxy, sxx - syy)

  const mix = mixArg.split(',').map(s => s.trim()) as UnitKey[]
  for (const m of mix) if (!UNIT_TYPES[m]) throw new Error(`Unknown unit type ${m}`)
  type Unit = { type: UnitKey; ring: P[]; sqFt: number; band: number; units: number }
  /** Streets across the ground at one orientation and offset; bands of lots either side. Returns what it placed. */
  const layoutAt = (theta: number, shift: number) => {
    const axis: P = [Math.cos(theta), Math.sin(theta)], across = leftOf(axis)
    const along = devRing.map(p => dot(p, cen, axis)), cross_ = devRing.map(p => dot(p, cen, across))
    const a0 = Math.min(...along), a1 = Math.max(...along), c0 = Math.min(...cross_), c1 = Math.max(...cross_)
    const units: Unit[] = []
    const streets: P[][] = []
    let taken: MP = []
    let c = c0 + 10 + shift
    let band = 0
    while (c < c1 - 60) {
      const t1 = UNIT_TYPES[mix[band % mix.length]], t2 = UNIT_TYPES[mix[(band + 1) % mix.length]]
      const rowA = t1.lotDepthFt, rowB = t2.lotDepthFt
      if (c + rowA + STREET_FT + 40 > c1) break
      const streetC0 = c + rowA, streetC1 = streetC0 + STREET_FT
      const strip = intersection(asMP([add(add(cen, axis, a0 - 50), across, streetC0), add(add(cen, axis, a1 + 50), across, streetC0), add(add(cen, axis, a1 + 50), across, streetC1), add(add(cen, axis, a0 - 50), across, streetC1)]), developable)
      const pieces = mpArea(strip) < 2000 ? [] : rings(strip).filter(r => Math.abs(area(r)) >= 120 * STREET_FT)
      if (!pieces.length) { c += 40; continue }
      for (const stripRing of pieces) {
        streets.push(stripRing)
        taken = unionMP(taken, asMP(stripRing))
        const sAlong = stripRing.map(p => dot(p, cen, axis)); const s0 = Math.min(...sAlong), s1 = Math.max(...sAlong)
        for (const [T, cc0, cc1, bandNo] of [[t1, c, streetC0, band], [t2, streetC1, streetC1 + rowB, band + 1]] as const) {
          let s = s0 + 10, inStick = 0
          while (s + T.lotWidthFt <= s1 - 10) {
            const lot: P[] = [add(add(cen, axis, s), across, cc0), add(add(cen, axis, s + T.lotWidthFt), across, cc0), add(add(cen, axis, s + T.lotWidthFt), across, cc1), add(add(cen, axis, s), across, cc1)]
            const inside = difference(intersection(asMP(lot), developable), taken)
            const got = mpArea(inside)
            if (got >= T.lotWidthFt * T.lotDepthFt * 0.92 && inside.length === 1) {
              const ring = rings(inside)[0]
              units.push({ type: mix[bandNo % mix.length], ring, sqFt: got, band: bandNo, units: T.unitsPerBay })
              taken = unionMP(taken, asMP(ring))
              inStick++
              s += T.lotWidthFt
              if (inStick >= T.stickMaxUnits) { s += T.breakFt; inStick = 0 }
            } else { s += 10; inStick = 0 }
          }
        }
      }
      c = streetC1 + rowB + 10
      band += 2
    }
    return { axis, units, streets, du: units.reduce((t, u) => t + u.units, 0) }
  }
  // Two orientations (the ground's principal axis and across it) and three offsets; the most dwellings wins.
  let best = layoutAt(theta, 0)
  for (const th of [theta, theta + Math.PI / 2]) for (const sh of [0, 40, 80]) {
    const cand = layoutAt(th, sh)
    console.log(`      orientation ${bearingOf([0, 0], [Math.cos(th), Math.sin(th)])} offset ${sh}: ${cand.du} du on ${cand.streets.length} street segment(s)`)
    if (cand.du > best.du) best = cand
  }
  const { axis, units, streets } = best

  // ── Yield, density and parking ────────────────────────────────────────────
  const byType = (Object.keys(UNIT_TYPES) as UnitKey[]).map(k => {
    const us = units.filter(u => u.type === k)
    const lotSqFt = us.reduce((s, u) => s + u.sqFt, 0)
    const du = us.reduce((s, u) => s + u.units, 0)
    // net lot area for density: the lots plus half the abutting street strip, apportioned by lot area
    const streetShare = streets.reduce((s, r) => s + Math.abs(area(r)), 0) * (units.length ? lotSqFt / units.reduce((s, u) => s + u.sqFt, 0) : 0)
    const netAc = (lotSqFt + streetShare) / 43560
    const cap = stds[k].densityDuAc
    const density = netAc > 0 ? du / netAc : 0
    const T = UNIT_TYPES[k]
    const coverage = us.length ? (T.footprintFt[0] * T.footprintFt[1]) / (T.lotWidthFt * T.lotDepthFt) * 100 : 0
    return { type: k, label: T.label, bays: us.length, dwellingUnits: du, lotSqFt: Math.round(lotSqFt), netAcForDensity: Math.round(netAc * 1000) / 1000, densityDuAc: Math.round(density * 100) / 100, densityCapDuAc: cap,
      withinDensity: cap == null || density <= cap + 1e-9, maxUnitsAtCap: cap != null ? Math.floor(netAc * cap) : null,
      lotCoveragePct: Math.round(coverage * 10) / 10, coverageCapPct: stds[k].maxCoveragePct, parkingRequired: Math.ceil(du * T.parkingPerUnit), parkingRatioAssumed: T.parkingPerUnit, parkingWhere: T.parkingWhere }
  })
  const totalDu = byType.reduce((s, t) => s + t.dwellingUnits, 0)
  console.log(`\n    ${units.length} bays / ${totalDu} dwelling units on ${streets.length} street(s):`)
  for (const t of byType) if (t.bays) console.log(`      ${t.label}: ${t.bays} bays, ${t.dwellingUnits} du · ${t.densityDuAc} du/ac vs cap ${t.densityCapDuAc} → ${t.withinDensity ? 'ok' : 'OVER — trim to ' + t.maxUnitsAtCap} · coverage ${t.lotCoveragePct}% vs ${t.coverageCapPct}% · parking ${t.parkingRequired} at ${t.parkingRatioAssumed}/du (assumed)`)
  const overCap = byType.filter(t => !t.withinDensity)

  // The theoretical ceilings, for the record
  const ceilings = (Object.keys(UNIT_TYPES) as UnitKey[]).map(k => ({ type: k, label: UNIT_TYPES[k].label, allOfThisType: stds[k].densityDuAc != null ? Math.floor(devSqFt / 43560 * 0.8 * stds[k].densityDuAc!) : null, basis: 'developable ac × 0.8 (streets, parking, open space) × certified density' }))

  // ── Emit ──────────────────────────────────────────────────────────────────
  const out = {
    name, generatedAt: new Date().toISOString(), zone,
    parcels: parcels.map(p => ({ account: p.account, owner: p.record?.ownerName, description: p.record?.propertyDesc, subdivision: p.record?.subdivision, plat: p.record?.plat, liber: p.record?.liber, folio: p.record?.folio, assessedAcres: p.record?.acres, gisSqFt: Math.round(p.sqFt), zone: p.zone, ring: p.ring })),
    tractSqFt: Math.round(tractSqFt), tractAcres: Math.round(tractSqFt / 43560 * 1000) / 1000,
    constraints: {
      source: 'PGAtlas Environmental/MapServer — Stream Center and Drainage (2023) buffered 50 ft; Slope (2023) >25%; Floodplain (FEMA 2026) other than Zone X; Woodland Conservation Area (approved TCPs); Wetland (DNR). Clipped to the tract.',
      streamBufferSqFt: Math.round(mpArea(pma)), steepSlopeSqFt: Math.round(mpArea(steep)), steepSlopeRibbonsRegradedSqFt: Math.round(steepRibbonsSqFt), moderateSlopeSqFt: Math.round(mpArea(moderate)), floodplainSqFt: Math.round(mpArea(floodplain)), woodlandConservationSqFt: Math.round(mpArea(woodland)), wetlandSqFt: Math.round(mpArea(wetlands)),
      unionSqFt: Math.round(mpArea(constraints)), rings: { streamBuffer: rings(pma), steep: rings(steep), steepRibbons: rings(steepAll.filter(poly => !isBody(poly))), floodplain: rings(floodplain), woodland: rings(woodland), wetlands: rings(wetlands) },
      caveat: 'The Primary Management Area, the woodland conservation threshold and any expanded buffers are set by an approved Natural Resources Inventory and TCP, not by these layers. A 50-ft stream buffer and slopes over 25% are the minimum that would be taken; the NRI may take more.',
    },
    developableSqFt: Math.round(devSqFt), developableAcres: Math.round(devSqFt / 43560 * 1000) / 1000, developableRings: rings(developable),
    standards: { zone, section: PG_ZONE_DIMENSIONAL_TABLES[zone].section, perType: stds, source: PG_ZONE_DIMENSIONAL_TABLES[zone].source },
    unitTypes: UNIT_TYPES, streetStripFt: STREET_FT, mix,
    layout: { axisBearing: bearingOf([0, 0], axis), streets, units: units.map(u => ({ type: u.type, band: u.band, dwellingUnits: u.units, sqFt: Math.round(u.sqFt), ring: u.ring })) },
    yield: { totalBays: units.length, totalDwellingUnits: totalDu, byType, overCap: overCap.map(t => t.type), ceilings,
      grossDensityDuAc: Math.round(totalDu / (tractSqFt / 43560) * 100) / 100 },
    approvals: [
      `${zone}: townhouse, two-family and multifamily (two-over-two) dwellings are listed uses with their own intensity standards in the certified Sec. 27-4203 table; a Detailed Site Plan is the approval path for residential in the commercial zones (confirm the use table entry for each type — the use table is not carried by this engine).`,
      'Sec. 27-6300 parking, Sec. 27-6400 landscaping (Landscape Manual 4.7 buffers against the RE lots), Sec. 25-121 woodland conservation, Sec. 24 subdivision (a preliminary plan of subdivision creates fee-simple townhouse and duplex lots; two-over-twos are condominium or fee-simple with a DSP), stormwater concept (DPIE), WSSC hydraulic planning analysis.',
    ],
  }
  writeFileSync(path.join(outDir, `${slug}.yield.json`), JSON.stringify(out, null, 2))
  await renderYieldSheet(out, path.join(outDir, `${slug}-yield-study.pdf`))
  console.log(`\n    wrote ${path.join(outDir, `${slug}.yield.json`)} and ${slug}-yield-study.pdf`)
}


// ── The sheet: plan at scale, the numbers beside it ─────────────────────────
type Out = { name: string; zone: string; parcels: { account: string; owner: string | null | undefined; description: string | null | undefined; assessedAcres: number | null | undefined; gisSqFt: number; ring: P[]; plat: string | null | undefined; liber: string | null | undefined; folio: string | null | undefined }[]
  tractSqFt: number; tractAcres: number; developableSqFt: number; developableAcres: number; developableRings: P[][]
  constraints: { streamBufferSqFt: number; steepSlopeSqFt: number; steepSlopeRibbonsRegradedSqFt: number; moderateSlopeSqFt: number; floodplainSqFt: number; woodlandConservationSqFt: number; wetlandSqFt: number; rings: Record<string, P[][]>; caveat: string; source: string }
  standards: { zone: string; section: string; perType: Record<string, { densityDuAc: number | null; minLotWidthFt: number | null; maxCoveragePct: number | null; frontFt: number | null; sideFt: number | null; rearFt: number | null; maxHeightFt: number | null }> }
  unitTypes: typeof UNIT_TYPES; layout: { streets: P[][]; units: { type: string; ring: P[]; dwellingUnits: number }[] }
  yield: { totalBays: number; totalDwellingUnits: number; grossDensityDuAc: number; byType: { type: string; label: string; bays: number; dwellingUnits: number; densityDuAc: number; densityCapDuAc: number | null; withinDensity: boolean; lotCoveragePct: number; coverageCapPct: number | null; parkingRequired: number; parkingRatioAssumed: number; parkingWhere: string; netAcForDensity: number }[]; ceilings: { label: string; allOfThisType: number | null }[] }
  approvals: string[] }

async function renderYieldSheet(y: Out, file: string) {
  const W = 36 * 72, H = 24 * 72, M = 36, COL = 9 * 72
  const doc = new PDFDocument({ size: [W, H], margin: 0, info: { Title: `${y.name} — yield study` } })
  const stream = createWriteStream(file)
  doc.pipe(stream)
  doc.rect(M / 2, M / 2, W - M, H - M).lineWidth(1.5).stroke('#000')
  // plan viewport
  const pts = y.parcels.flatMap(p => p.ring)
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1])
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys)
  const drawW = W - M * 2 - COL - 20, drawH = H - M * 2 - 60
  const scales = [20, 30, 40, 50, 60, 100]
  const scale = scales.find(s => (maxX - minX + 100) * 72 / s <= drawW && (maxY - minY + 100) * 72 / s <= drawH) ?? 100
  const ppf = 72 / scale
  const ox = M + (drawW - (maxX - minX) * ppf) / 2, oy = M + 40 + (drawH - (maxY - minY) * ppf) / 2
  const X = (x: number) => ox + (x - minX) * ppf, Y = (v: number) => oy + (maxY - v) * ppf
  const poly = (r: P[], fill: string | null, stroke: string, width = 0.6, dash?: number[]) => {
    doc.save(); doc.moveTo(X(r[0][0]), Y(r[0][1])); for (const q of r.slice(1)) doc.lineTo(X(q[0]), Y(q[1])); doc.closePath()
    if (dash) doc.dash(dash[0], { space: dash[1] })
    if (fill) { doc.fillColor(fill).fillOpacity(0.6).fill(); doc.fillOpacity(1); doc.moveTo(X(r[0][0]), Y(r[0][1])); for (const q of r.slice(1)) doc.lineTo(X(q[0]), Y(q[1])); doc.closePath() }
    doc.lineWidth(width).strokeColor(stroke).stroke(); doc.restore()
  }
  for (const p of y.parcels) poly(p.ring, '#f6f6f6', '#000', 1.4)
  for (const r of y.constraints.rings.woodland ?? []) poly(r, '#cfe5cf', '#2f6f3f', 0.6)
  for (const r of y.constraints.rings.steep ?? []) poly(r, '#e8b8b0', '#a04030', 0.4)
  for (const r of y.constraints.rings.steepRibbons ?? []) poly(r, null, '#c06050', 0.3, [2, 2])
  for (const r of y.constraints.rings.streamBuffer ?? []) poly(r, '#c8d8f0', '#2050a0', 0.5)
  for (const r of y.constraints.rings.floodplain ?? []) poly(r, null, '#2050a0', 0.6, [6, 3])
  for (const r of y.layout.streets) poly(r, '#c8c8c8', '#555', 0.6)
  const col: Record<string, string> = { townhouse: '#f0c060', twoFamily: '#8fb8ee', twoOverTwo: '#cf98d8' }
  for (const u of y.layout.units) poly(u.ring, col[u.type] ?? '#ddd', '#333', 0.4)
  // parcel labels
  doc.font('Helvetica-Bold').fontSize(7).fillColor('#000')
  for (const p of y.parcels) { const c = interiorPoint(p.ring); doc.text(`${p.description ?? ''}\n${p.owner ?? ''}\n${(p.gisSqFt / 43560).toFixed(3)} AC · ${y.zone}`, X(c[0]) - 60, Y(c[1]) - 12, { width: 120, align: 'center' }) }
  // north arrow + scale
  doc.font('Helvetica-Bold').fontSize(9).text('N', M + 14, M + 8); doc.moveTo(M + 18, M + 40).lineTo(M + 18, M + 20).lineWidth(1).stroke('#000')
  doc.fontSize(8).text(`SCALE 1" = ${scale}'   ·   GRAPHIC: |${'—'.repeat(10)}| = ${scale * 2} FT`, M + 40, M + 10)
  doc.font('Helvetica').fontSize(6.5).fillColor('#444').text('LEGEND — yellow: townhouse lots · blue: two-family (duplex) lots · violet: two-over-two (stacked) bays · grey: private street strip 40 ft · green: woodland conservation (approved TCP) · red: slopes >25% (dashed = graded banks, regraded) · blue band: 50-ft stream buffer', M + 40, M + 24, { width: drawW - 60 })
  // right column
  let x = W - M - COL, yy = M + 4
  const line = (t: string, size = 7, bold = false, color = '#000', gap = 2) => { doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(size).fillColor(color).text(t, x, yy, { width: COL - 8 }); yy = doc.y + gap }
  line('KEALEE', 14, true); line('ATTACHED HOUSING YIELD STUDY — PRELIMINARY, NOT A SITE PLAN', 8, true, '#900')
  line(y.name, 9, true); line(`Zone ${y.zone} · certified intensity table Sec. ${y.standards.section} · generated ${new Date().toISOString().slice(0, 10)}`, 7)
  yy += 4; line('PARCELS (PGAtlas Address/Property — owner of record, assessment)', 7.5, true)
  for (const p of y.parcels) line(`Acct ${p.account} · ${p.description ?? ''} · ${p.owner ?? '?'} · ${p.assessedAcres ?? '?'} ac assessed / ${(p.gisSqFt / 43560).toFixed(3)} ac GIS · plat ${p.plat ?? '—'} · L.${p.liber ?? '?'} F.${p.folio ?? '?'}`, 6.5)
  line(`Tract ${y.tractSqFt.toLocaleString()} sf (${y.tractAcres} ac). Boundary is the county parcel layer — not a survey.`, 6.5, false, '#333')
  yy += 4; line('WHAT CANNOT BE BUILT ON (county layers, clipped to the tract)', 7.5, true)
  const c = y.constraints
  line(`Woodland conservation (approved TCP areas) ${(c.woodlandConservationSqFt / 43560).toFixed(2)} ac · slopes >25% in bodies ${(c.steepSlopeSqFt / 43560).toFixed(2)} ac (graded banks ${(c.steepSlopeRibbonsRegradedSqFt / 43560).toFixed(2)} ac, regraded) · 15–25% ${(c.moderateSlopeSqFt / 43560).toFixed(2)} ac (built with grading) · stream buffer ${(c.streamBufferSqFt / 43560).toFixed(2)} ac · floodplain ${(c.floodplainSqFt / 43560).toFixed(2)} ac · wetlands ${(c.wetlandSqFt / 43560).toFixed(2)} ac`, 6.5)
  line(`Developable ${y.developableSqFt.toLocaleString()} sf (${y.developableAcres} ac).`, 7, true)
  line(c.caveat, 6, false, '#333')
  yy += 4; line(`${y.zone} STANDARDS BY DWELLING TYPE (Sec. ${y.standards.section})`, 7.5, true)
  for (const [k, st] of Object.entries(y.standards.perType)) line(`${(y.unitTypes as Record<string, { label: string }>)[k].label}: ${st.densityDuAc} du/ac net · lot ≥ ${st.minLotWidthFt} ft wide · coverage ≤ ${st.maxCoveragePct}% · yards ${st.frontFt}/${st.sideFt}/${st.rearFt} ft · height ≤ ${st.maxHeightFt} ft`, 6.5)
  yy += 4; line('YIELD — THIS LAYOUT', 7.5, true)
  for (const t of y.yield.byType) if (t.bays) line(`${t.label}: ${t.bays} bays → ${t.dwellingUnits} du · ${t.densityDuAc} du/ac on ${t.netAcForDensity} net ac (cap ${t.densityCapDuAc}) ${t.withinDensity ? '✓' : 'OVER'} · lot coverage ${t.lotCoveragePct}% (cap ${t.coverageCapPct}%) · parking ${t.parkingRequired} at ${t.parkingRatioAssumed}/du ASSUMED — ${t.parkingWhere}`, 6.5)
  line(`TOTAL ${y.yield.totalDwellingUnits} DWELLING UNITS in ${y.yield.totalBays} bays · ${y.yield.grossDensityDuAc} du/ac gross on the ${y.tractAcres}-ac tract`, 8, true)
  yy += 2; line('CEILINGS if the whole developable ground were one type (× 0.8 for streets, parking, open space):', 6.5, true)
  for (const ce of y.yield.ceilings) line(`${ce.label}: ${ce.allOfThisType ?? '—'} du`, 6.5)
  yy += 4; line('UNIT ASSUMPTIONS', 7.5, true)
  for (const [k, u] of Object.entries(y.unitTypes as Record<string, { label: string; lotWidthFt: number; lotDepthFt: number; footprintFt: [number, number]; stickMaxUnits: number; unitsPerBay: number }>)) line(`${u.label}: ${u.lotWidthFt} × ${u.lotDepthFt} ft lot, ${u.footprintFt[0]} × ${u.footprintFt[1]} ft footprint, ${u.unitsPerBay} du per bay, sticks of ≤ ${u.stickMaxUnits}`, 6.5)
  line('Private streets in 40-ft strips (26-ft pavement, walk one side). Streets are drawn as parallel segments; the connecting street, entrance from the public road, visitor parking, open space and the Landscape Manual 4.7 buffer to the RE lots are DSP work not drawn here.', 6.5, false, '#333')
  yy += 4; line('APPROVALS', 7.5, true)
  for (const a of y.approvals) line(a, 6.2, false, '#333')
  yy += 4; line('This is a yield study prepared by the Kealee site-plan engine from county GIS and the certified zoning table. It is not a Detailed Site Plan, not a survey and not a determination of what the Planning Board will approve.', 6.2, true, '#900')
  doc.end()
  await new Promise<void>((res, rej) => { stream.on('finish', () => res()); stream.on('error', rej) })
}

main().catch(e => { console.error(e); process.exit(1) })
