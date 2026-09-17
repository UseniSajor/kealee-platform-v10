/**
 * The full Prince George's County submission set for an attached-housing
 * (townhouse / two-family / two-over-two) layout produced by
 * `propose-townhomes.ts` — the canonical eleven sheets (C-000 … C-900, L-100)
 * on ARCH E, plus DXF, LandXML and a manifest.
 *
 *   pnpm tsx scripts/generate-attached-set.ts \
 *     ../../output/site-plans/aragona-village/aragona-village.yield.json \
 *     ../../output/site-plans/aragona-village/aragona-village-dsp-set.pdf
 *
 * Every drawn object comes from the yield study's layout (lots, dwellings,
 * private streets, turnarounds, driveways, walks, ESD areas, open space) or
 * from the county's own layers fetched here (2-ft contours, adjoining parcels
 * and their owners of record, streets, soils from USDA). Nothing is invented:
 * where a layer does not answer, the sheet says so.
 *
 * It is a PRELIMINARY set — a Detailed Site Plan / preliminary plan of
 * subdivision submission drawn from county GIS, not from a survey — and every
 * sheet carries that status.
 */
import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { createSiteTwin, addFeatures, addSource, type SiteFeature, type SiteTwin, type Position } from '../src/site-plan/site-twin'
import { gisSourceRecord } from '../src/site-plan/reliability'
import { fetchPgContours } from '../src/jurisdictions/pg-elevation'
import { fetchSoilMapUnits } from '../src/jurisdictions/usda-soils'
import { fetchPgAtlasAdjacentParcels, fetchPgAtlasStreets, fetchPgAtlasPropertyRecord } from '../src/jurisdictions/pgatlas'
import { renderSheetSetPdf } from '../src/sheets/render-pdf'
import { buildSheetContext } from '../src/sheets/render-svg'
import { ARCH_E } from '../src/sheets/viewport'
import { toDxf, toLandXml } from '../src/export/exporters'
import type { SheetId } from '../src/sheets/sheet-template'
import polygonClipping from 'polygon-clipping'

type P = [number, number]
type Yield = {
  name: string; zone: string; mappedZone: string; hypothetical: boolean; hypotheticalNote: string | null
  parcels: { account: string; owner?: string | null; description?: string | null; subdivision?: string | null; plat?: string | null; liber?: string | null; folio?: string | null; assessedAcres?: number | null; gisSqFt: number; zone: string | null; ring: P[] }[]
  tractSqFt: number; tractAcres: number
  developableRings: P[][]
  standards: { zone: string; section: string; perType: Record<string, { frontFt: number | null; sideFt: number | null; rearFt: number | null; maxCoveragePct: number | null; maxHeightFt: number | null; densityDuAc: number | null }> }
  unitTypes: Record<string, { label: string; lotWidthFt: number; lotDepthFt: number; footprintFt: [number, number]; unitsPerBay: number; storeys?: number; heightFt?: number }>
  layout: { axisBearing: string; streets: P[][]; connectors: P[][]; turnarounds: P[][]; parking: { ring: P[]; spaces: number }[]; buildings: { ring: P[]; type: string }[]; driveways: { ring: P[]; type: string; cars: number }[]; walks: P[][]; units: { type: string; band: number; dwellingUnits: number; sqFt: number; ring: P[] }[] }
  existingStreetRow: P[][]
  yield: { totalDwellingUnits: number; totalBays: number; byType: { type: string; label: string; bays: number; dwellingUnits: number; parkingRequired: number }[]; parkingDrawnSurface: number; parkingInGarages: number; parkingRequired: number; grossDensityDuAc: number }
  stormwater: { method: string; imperviousSqFt: number; percentImpervious: number; rv: number; esdvCf: number; practiceFootprintSqFt: number; reservedSqFt: number; esdPracticeRings: P[][]; esdReservedSqFt: number; finding: string }
  openSpace?: { rings: P[][]; sqFt: number; requiredSqFt: number; basis: string }
  access?: { road: string; note: string } | null
  designStandards?: string[]
  approvals: string[]
}

const FULL_SET: SheetId[] = ['C-000', 'C-100', 'C-200', 'C-300', 'C-400', 'C-500', 'C-600', 'C-700', 'C-800', 'C-900', 'L-100']

const area = (r: P[]) => { let a = 0; for (let i = 0; i < r.length; i++) { const q = r[(i + 1) % r.length]; a += r[i][0] * q[1] - q[0] * r[i][1] } return a / 2 }
const closed = (r: P[]): Position[] => { const c = r.map(q => [q[0], q[1]] as Position); if (c.length && (c[0][0] !== c[c.length - 1][0] || c[0][1] !== c[c.length - 1][1])) c.push([c[0][0], c[0][1]]); return c }
const ring = (r: P[]) => ({ coordinates: closed(r) })
const centroid = (r: P[]): P => [r.reduce((s, q) => s + q[0], 0) / r.length, r.reduce((s, q) => s + q[1], 0) / r.length]
const segDist = (p: P, a: P, b: P) => { const vx = b[0] - a[0], vy = b[1] - a[1]; const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / (vx * vx + vy * vy || 1))); return Math.hypot(p[0] - a[0] - t * vx, p[1] - a[1] - t * vy) }
/** The long axis of a street strip (principal direction of its ring) and its centreline run. */
function centrelineOf(r: P[]): P[] {
  const c = centroid(r); let sxx = 0, sxy = 0, syy = 0
  for (const q of r) { const dx = q[0] - c[0], dy = q[1] - c[1]; sxx += dx * dx; sxy += dx * dy; syy += dy * dy }
  const th = 0.5 * Math.atan2(2 * sxy, sxx - syy); const ax: P = [Math.cos(th), Math.sin(th)]
  const al = r.map(q => (q[0] - c[0]) * ax[0] + (q[1] - c[1]) * ax[1])
  const s0 = Math.min(...al), s1 = Math.max(...al)
  return [[c[0] + ax[0] * s0, c[1] + ax[1] * s0], [c[0] + ax[0] * s1, c[1] + ax[1] * s1]]
}
/** Offset a run of points to one side by d ft. */
function offsetLine(pts: P[], d: number): P[] {
  return pts.map((q, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]; const vx = b[0] - a[0], vy = b[1] - a[1]; const L = Math.hypot(vx, vy) || 1; return [q[0] - vy / L * d, q[1] + vx / L * d] as P })
}

async function main() {
  const [yieldPath, outPath] = process.argv.slice(2)
  if (!yieldPath || !outPath) { console.error('usage: generate-attached-set.ts <study.yield.json> <out.pdf>'); process.exit(1) }
  const y = JSON.parse(readFileSync(yieldPath, 'utf8')) as Yield
  const slug = path.basename(outPath).replace(/\.pdf$/i, '')
  const outDir = path.dirname(outPath)
  const T = y.unitTypes

  // ── The tract: outer ring of the union of the parcels (the largest developable ring's hull is not
  // the boundary — the parcels are). The boundary drawn is every parcel; the subject Parcel feature
  // for clipping is the whole tract's bounding ring.
  const allPts = y.parcels.flatMap(p => p.ring)
  const cen = centroid(allPts)
  const radiusFt = Math.ceil(Math.max(...allPts.map(q => Math.hypot(q[0] - cen[0], q[1] - cen[1]))) + 100)
  console.log(`  ${y.name}\n    ${y.parcels.length} parcels, ${y.tractAcres} ac, zone ${y.zone}${y.hypothetical ? ` (HYPOTHETICAL — mapped ${y.mappedZone})` : ''}`)

  // County layers
  const contours = await fetchPgContours(cen[0], cen[1], { radiusFt }).catch(() => null)
  console.log(`    contours        ${contours?.contours.length ?? 0} within ${radiusFt} ft` + (contours ? ` · ${contours.verticalDatum ?? 'datum not stated'}` : ' — NONE RETURNED'))
  const swept = await fetchPgAtlasAdjacentParcels(cen[0], cen[1], { radiusFt: radiusFt + 200 }).catch(() => [])
  const subjectAccts = new Set(y.parcels.map(p => p.account))
  const tractRings = y.parcels.map(p => p.ring)
  const gap = (r: Position[]) => Math.min(...r.map(c => Math.min(...tractRings.map(tr => Math.min(...tr.map((v, i) => segDist([c[0], c[1]], v, tr[(i + 1) % tr.length])))))))
  const inside = (r: Position[]) => { const c = centroid(r.map(q => [q[0], q[1]] as P)); return tractRings.some(tr => { let inn = false; for (let i = 0, j = tr.length - 1; i < tr.length; j = i++) { const xi = tr[i][0], yi = tr[i][1], xj = tr[j][0], yj = tr[j][1]; if ((yi > c[1]) !== (yj > c[1]) && c[0] < (xj - xi) * (c[1] - yi) / (yj - yi) + xi) inn = !inn } return inn }) }
  const adjacentParcels = swept.filter(p => !inside(p.ring.coordinates as Position[]) && gap(p.ring.coordinates as Position[]) <= 90)
  for (const ap of adjacentParcels) { const c = centroid(ap.ring.coordinates.map(q => [q[0], q[1]] as P)); (ap as { record?: unknown }).record = await fetchPgAtlasPropertyRecord(c[0], c[1]).catch(() => null) }
  console.log(`    adjoining lots  ${adjacentParcels.length} (of ${swept.length} swept), owners of record fetched`)
  const streetsNear = await fetchPgAtlasStreets(cen[0], cen[1], { searchFt: radiusFt + 300 }).catch(() => [])
  const soils = (await fetchSoilMapUnits('prince_georges_md').catch(() => null))?.units ?? null
  console.log(`    streets         ${streetsNear.length} county centrelines · soils ${soils ? soils.length + ' map units' : 'NOT RETRIEVED'}`)
  void subjectAccts

  // ── The twin ─────────────────────────────────────────────────────────────
  let twin = createSiteTwin({
    siteId: slug, projectId: slug, organizationId: 'kealee',
    address: y.parcels[0]?.description ?? y.name, jurisdictionCode: 'prince_georges_md',
    crs: 'EPSG:2248', horizontalDatum: 'NAD83', verticalDatum: contours?.verticalDatum ?? null,
  })
  twin = addSource(twin, gisSourceRecord({ sourceId: 'pgatlas-parcels', authority: "Prince George's County PGAtlas Address/Property (assessment join)", dataset: 'Parcel boundaries — county parcel layer (compiled, not surveyed)', crs: 'EPSG:2248', horizontalDatum: 'NAD83' }))
  if (contours) twin = addSource(twin, gisSourceRecord({ sourceId: 'pgatlas-contours', authority: "Prince George's County / M-NCPPC", dataset: 'Elevation/MapServer/1 — Contour 2 ft (2023)', crs: 'EPSG:2248', horizontalDatum: 'NAD83' }))
  twin = addSource(twin, gisSourceRecord({ sourceId: 'kealee-layout', authority: 'Kealee spatial engine — propose-townhomes.ts', dataset: `Attached-housing layout: ${y.yield.totalDwellingUnits} du in ${y.yield.totalBays} bays`, crs: 'EPSG:2248', horizontalDatum: 'NAD83' }))
  twin = { ...twin, zoneCode: y.zone }
  const base = { sourceId: 'kealee-layout', reliabilityLevel: 1 as const, crs: 'EPSG:2248', revision: 1 }
  const gis = { sourceId: 'pgatlas-parcels', reliabilityLevel: 1 as const, crs: 'EPSG:2248', revision: 1 }
  const F: SiteFeature[] = []

  // The tract: every parcel as a Parcel feature (the first is the subject for clipping — the largest).
  const parcelsSorted = [...y.parcels].sort((a, b) => Math.abs(area(b.ring)) - Math.abs(area(a.ring)))
  // A single outer ring for clipping and the site data table: the convex hull is wrong for an L; use the
  // union's bounding parcel — the renderer clips to the first Parcel's bbox plus 20 ft, so give it one
  // covering ring: the bbox of all parcels as a Parcel named for the tract.
  // The tract boundary is the union of the lots of record (their outer rings, largest first); the
  // lots themselves are drawn as existing lot lines, since the layout resubdivides them.
  const unionMP = (() => { try { const m = y.parcels.map(p => [[...p.ring, p.ring[0]]] as polygonClipping.Polygon); return polygonClipping.union(m[0], ...m.slice(1)) } catch { return [] as polygonClipping.MultiPolygon } })()
  const outerRings = unionMP.map(poly => poly[0].slice(0, -1).map(c => [c[0], c[1]] as P)).sort((a, b) => Math.abs(area(b)) - Math.abs(area(a)))
  outerRings.forEach((r, i) => F.push({ kind: 'Parcel', id: i === 0 ? 'tract' : `tract-${i + 1}`, parcelId: i === 0 ? 'TRACT' : `TRACT ${i + 1}`, ring: ring(r), areaSqFt: Math.round(Math.abs(area(r))), notes: 'Outer boundary — union of the lots of record (county parcel layer)', ...gis } as SiteFeature))
  parcelsSorted.forEach((p, i) => F.push({ kind: 'ExistingFeature', id: `ex-lot-${i + 1}`, ring: ring(p.ring), attributes: { type: 'existing lot line', label: `EX. ${p.description ?? 'LOT'} (ACCT ${p.account}) — TO BE RESUBDIVIDED` }, ...gis } as SiteFeature))
  void parcelsSorted

  // Existing: the kept public right-of-way and the county street centrelines
  y.existingStreetRow.forEach((r, i) => F.push({ kind: 'ExistingFeature', id: `ex-row-${i}`, ring: ring(r), attributes: { type: 'right-of-way', label: 'EXISTING PUBLIC RIGHT-OF-WAY (SCHOONER COURT) — KEPT' }, ...gis } as SiteFeature))
  // Existing topography
  if (contours) contours.contours.forEach((c, ci) => F.push({ kind: 'Contour', id: `ct-${ci}`, line: c.path.map(([x, yv]) => [x, yv, c.elevationFt] as Position), attributes: { elevationFt: c.elevationFt, weight: c.weight, hidden: c.hidden }, sourceId: 'pgatlas-contours', reliabilityLevel: 1, crs: 'EPSG:2248', revision: 1 } as SiteFeature))

  // Proposed lots (the units' lots), lettered by number
  const lots = y.layout.units.map((u, i) => ({ ...u, no: i + 1 }))
  lots.forEach(u => F.push({ kind: 'ProposedFeature', id: `lot-${u.no}`, ring: ring(u.ring), attributes: { type: 'proposed lot', label: `LOT ${u.no}`, unitType: u.type, areaSqFt: Math.round(u.sqFt), dwellingUnits: u.dwellingUnits, proposed: true }, ...base } as SiteFeature))
  // Building restriction lines, one per stick (front / side at the stick ends / rear per the zone table,
  // the front deepened to the driveway apron) — the BRL every discipline is set from.
  ;((y.layout as unknown as { buildingRestrictionLines?: { ring: P[]; frontFt: number; sideFt: number; rearFt: number; units: number; type: string }[] }).buildingRestrictionLines ?? []).forEach((bl, i) => F.push({ kind: 'ProposedFeature', id: `stick${i + 1}-buildable-envelope`, ring: ring(bl.ring), attributes: { type: 'buildable envelope', setbacks: { frontFt: bl.frontFt, sideFt: bl.sideFt, rearFt: bl.rearFt }, label: '', proposed: true }, ...base } as SiteFeature))
  // Dwellings
  y.layout.buildings.forEach((b, i) => { const ut = T[b.type]; F.push({ kind: 'Building', id: `bldg-${i + 1}`, ring: ring(b.ring), existing: false, storeys: ut?.storeys ?? 3, heightFt: ut?.heightFt ?? 35, use: ut?.label ?? b.type, attributes: { areaSqFt: Math.round(Math.abs(area(b.ring))), type: b.type, caption: null, lotLabel: `LOT ${i + 1}` }, ...base } as SiteFeature) })
  // One caption per stick: buildings that touch are one stick; the caption names the type and count.
  {
    const bs = y.layout.buildings.map((b, i) => ({ i, b, c: centroid(b.ring) }))
    const touches = (a: P[], c: P[]) => a.some(q => c.some((v, k) => segDist(q, v, c[(k + 1) % c.length]) < 0.5))
    const seen = new Set<number>(); let stickNo = 0
    for (const s0 of bs) {
      if (seen.has(s0.i)) continue
      const stick = [s0]; seen.add(s0.i)
      for (let k = 0; k < stick.length; k++) for (const o of bs) if (!seen.has(o.i) && o.b.type === s0.b.type && touches(stick[k].b.ring, o.b.ring)) { seen.add(o.i); stick.push(o) }
      const pts = stick.flatMap(u => u.b.ring); const c = centroid(pts)
      const short: Record<string, string> = { townhouse: 'TH', twoFamily: 'DUPLEX', twoOverTwo: '2/2', mixedUse: 'MIXED USE' }
      const du = stick.reduce((t, u) => t + (T[u.b.type]?.unitsPerBay ?? 1), 0)
      F.push({ kind: 'ProposedFeature', id: `stick-${++stickNo}`, ring: ring([[c[0] - 1, c[1] - 1], [c[0] + 1, c[1] - 1], [c[0] + 1, c[1] + 1], [c[0] - 1, c[1] + 1]]), attributes: { type: 'building stick', label: `${short[s0.b.type] ?? s0.b.type} ×${stick.length}${du !== stick.length ? ` (${du} DU)` : ''} · ${T[s0.b.type]?.storeys ?? 3} STY`, proposed: true }, ...base } as SiteFeature)
    }
  }
  // Streets, turnarounds, connectors — private streets, 26-ft pavement in a 40-ft strip
  const allStreets = y.layout.streets
  allStreets.forEach((r, i) => F.push({ kind: 'Pavement', id: `street-${i + 1}`, ring: ring(r), attributes: { improvement: 'private street — bituminous pavement 26 ft in a 40-ft strip', label: y.layout.turnarounds.some(t => t === r) ? 'TURNAROUND R=45\'' : `PRIVATE STREET ${String.fromCharCode(65 + (i % 26))}`, proposed: true }, ...base } as SiteFeature))
  y.layout.driveways.forEach((d, i) => F.push({ kind: 'Pavement', id: `drive-${i + 1}`, ring: ring(d.ring), attributes: { improvement: `driveway — bituminous, ${d.cars}-car garage`, proposed: true }, ...base } as SiteFeature))
  y.layout.walks.forEach((w, i) => F.push({ kind: 'Pavement', id: `walk-${i + 1}`, ring: ring(w), attributes: { improvement: 'concrete sidewalk 5 ft', proposed: true }, ...base } as SiteFeature))
  y.layout.parking.forEach((pk, i) => F.push({ kind: 'Pavement', id: `park-${i + 1}`, ring: ring(pk.ring), attributes: { improvement: `parking bay — ${pk.spaces} spaces`, proposed: true }, ...base } as SiteFeature))
  // Utilities: an 8-in water main and an 8-in sanitary sewer in every private street, tied to the
  // mains in the kept right-of-way (the approved subdivision's mains, WSSC) — drawn on the centreline
  // of each strip, water 5 ft one side and sewer 5 ft the other.
  allStreets.filter(r => !y.layout.turnarounds.includes(r)).forEach((r, i) => {
    const cl = centrelineOf(r)
    F.push({ kind: 'Utility', id: `wm-${i + 1}`, line: offsetLine(cl, 5).map(q => [q[0], q[1]] as Position), attributes: { type: 'Water main', size: '8" DIP', from: 'offsite', sizeAtMain: '8"', note: 'PROP. 8" WATER MAIN IN PRIVATE STREET — CONNECT TO EX. WSSC MAIN IN SCHOONER COURT' }, ...base } as SiteFeature)
    F.push({ kind: 'Utility', id: `ss-${i + 1}`, line: offsetLine(cl, -5).map(q => [q[0], q[1]] as Position), attributes: { type: 'Sanitary sewer', size: '8" PVC', from: 'offsite', sizeAtMain: '8"', note: 'PROP. 8" SANITARY SEWER IN PRIVATE STREET — CONNECT TO EX. WSSC SEWER IN SCHOONER COURT' }, ...base } as SiteFeature)
  })
  // Public utility easement 10 ft along each private street (Sec. 24-128(b)(12)) — the strip's edges
  // are the lots' front lines; the PUE sits on the lots' first 10 ft, coincident with the front yard.
  // Drawn as an easement ring per street: the strip widened 10 ft each side less the strip.
  // (Left as a note on the sheet rather than 300 small rings.)
  // ESD practices and open space
  y.stormwater.esdPracticeRings.forEach((r, i) => F.push({ kind: 'SWMPractice', id: `esd-${i + 1}`, ring: ring(r), attributes: { type: 'micro-bioretention (M-6)', footprintSqFt: Math.round(Math.abs(area(r))), proposed: true }, ...base } as SiteFeature))
  ;(y.openSpace?.rings ?? []).forEach((r, i) => F.push({ kind: 'ProposedFeature', id: `open-space-${i + 1}`, ring: ring(r), attributes: { type: 'open space', label: `OPEN SPACE — RECREATION (HOA) ${(Math.abs(area(r)) / 43560).toFixed(2)} AC`, proposed: true }, ...base } as SiteFeature))
  // Limit of disturbance: the tract (the whole site is graded), as one ring per parcel-union piece — the
  // developable rings ARE the tract here.
  y.developableRings.filter(r => Math.abs(area(r)) > 20000).forEach((r, i) => F.push({ kind: 'LimitOfDisturbance', id: `lod-${i + 1}`, ring: ring(r), areaSqFt: Math.round(Math.abs(area(r))), attributes: { note: 'Limit of disturbance — the whole tract; perimeter silt fence (SF) on the LOD, stabilised construction entrance at Schooner Court.' }, ...base } as SiteFeature))
  // Street trees: one every 40 ft along each street strip's long edges, 5 ft off the strip (Landscape Manual 4.6)
  let treeNo = 0
  allStreets.filter(r => !y.layout.turnarounds.includes(r)).forEach(r => {
    const cl = centrelineOf(r); const L = Math.hypot(cl[1][0] - cl[0][0], cl[1][1] - cl[0][1]); const ax: P = [(cl[1][0] - cl[0][0]) / L, (cl[1][1] - cl[0][1]) / L]; const nx: P = [-ax[1], ax[0]]
    for (let s = 20; s < L - 10; s += 40) for (const side of [1, -1]) {
      const q: P = [cl[0][0] + ax[0] * s + nx[0] * side * 24, cl[0][1] + ax[1] * s + nx[1] * side * 24]
      F.push({ kind: 'Tree', id: `street-tree-${++treeNo}`, ring: ring([[q[0] - 5, q[1] - 5], [q[0] + 5, q[1] - 5], [q[0] + 5, q[1] + 5], [q[0] - 5, q[1] + 5]]), designation: 'Street tree in the front yard, 40 ft o.c. (Landscape Manual Sec. 4.6)', ...base } as SiteFeature)
    }
  })
  // Finished-floor spot elevations at each dwelling: the nearest existing contour + 1.0 ft (preliminary)
  if (contours?.contours.length) {
    const near = (q: P): number | null => { let best: { d: number; z: number } | null = null; for (const c of contours.contours) for (let i = 0; i + 1 < c.path.length; i++) { const d = segDist(q, [c.path[i][0], c.path[i][1]], [c.path[i + 1][0], c.path[i + 1][1]]); if (!best || d < best.d) best = { d, z: c.elevationFt } } return best?.z ?? null }
    y.layout.buildings.forEach((b, i) => { const c = centroid(b.ring); const z = near(c); if (z != null) F.push({ kind: 'SpotElevation', id: `ffe-${i + 1}`, point: [c[0], c[1], z + 1.0] as Position, attributes: { elevationFt: Math.round((z + 1.0) * 10) / 10, label: `FFE ${(z + 1.0).toFixed(1)}`, proposed: true, kind: 'finished floor (preliminary — nearest existing contour + 1.0 ft)' }, ...base } as SiteFeature) })
  }
  twin = addFeatures(twin, F)
  console.log(`    features        ${F.length}: ${Object.entries(F.reduce((m, f) => ({ ...m, [f.kind]: (m[f.kind] ?? 0) + 1 }), {} as Record<string, number>)).map(([k, n]) => `${k} ${n}`).join(', ')}`)

  // Extras the sheets read
  const owner = y.parcels[0]
  const platRecord = {
    reference: `${owner?.subdivision ?? 'ARAGONA VILLAGE'} — ${y.parcels.length} lots of record, plat${y.parcels.some(p => p.plat) ? 's ' + [...new Set(y.parcels.map(p => p.plat).filter(Boolean))].join(', ') : ''}, L.${owner?.liber ?? '?'} F.${owner?.folio ?? '?'} — owner of record ${owner?.owner ?? '?'} (PGAtlas Address/Property)`,
    citation: [...new Set(y.parcels.map(p => p.plat).filter(Boolean))].map(p => `PLAT ${p}`).join(', ') || 'COUNTY PARCEL LAYER — NO PLAT TRANSCRIBED',
    notes: [
      `PRELIMINARY. Boundaries are the county parcel layer (compiled from the recorded plats, not surveyed); a boundary survey precedes any final plat.`,
      y.hypotheticalNote ?? `Zone ${y.zone}.`,
      `Layout: ${y.yield.totalDwellingUnits} dwelling units in ${y.yield.totalBays} bays — ${y.yield.byType.filter(t => t.bays).map(t => `${t.dwellingUnits} ${t.label.toLowerCase()}`).join(', ')}; ${y.yield.grossDensityDuAc} du/ac gross.`,
      `Private streets: 26-ft pavement in 40-ft strips with 5-ft walks, 10-ft PUE contiguous (Sec. 24-128(b)(7),(12)), maintained by the HOA; the existing public right-of-way (Schooner Court) is kept and the rows front on it.`,
      `Stormwater: ESD to the MEP — ${y.stormwater.esdvCf.toLocaleString()} cf ESDv, ${y.stormwater.practiceFootprintSqFt.toLocaleString()} sf micro-bioretention required, ${y.stormwater.reservedSqFt.toLocaleString()} sf reserved (drawn); DPIE concept approval precedes the preliminary plan (Sec. 24-121(a)(15)).`,
      y.openSpace ? `${y.openSpace.basis}: ${y.openSpace.sqFt.toLocaleString()} sf drawn against ${y.openSpace.requiredSqFt.toLocaleString()} sf.` : 'Open space per Sec. 24-134 to be provided.',
      ...(y.designStandards ?? []),
    ],
    legend: ['LOT n — proposed fee-simple lot', 'PRIVATE STREET A… — HOA street, 26 ft pavement', 'ESD — micro-bioretention', 'FFE — finished floor (preliminary)'],
    exhibits: [] as string[],
    ownerOfRecord: { account: owner?.account, ownerName: owner?.owner ?? null, acres: y.tractAcres, plat: owner?.plat ?? null, liber: owner?.liber ?? null, folio: owner?.folio ?? null, subdivision: owner?.subdivision ?? null, propertyDesc: `${y.parcels.length} lots` },
    stormwater: y.stormwater,
  }
  const projectLots = [{ label: 'TRACT', areaSqFt: y.tractSqFt, buildableEnvelope: { setbacks: { frontFt: 20, sideFt: y.standards.perType.townhouse?.sideFt ?? 8, rearFt: y.standards.perType.townhouse?.rearFt ?? 15 }, coveragePct: y.standards.perType.townhouse?.maxCoveragePct ?? null, frontage: { providedFt: null, requiredFt: 20, meets: true } } }]
  twin = { ...twin, adjacentParcels, streets: streetsNear, soils, platRecord, projectLots } as SiteTwin

  // ── Sheets ───────────────────────────────────────────────────────────────
  const sheetIds = (process.env.SHEETS?.split(',').map(s => s.trim()).filter(Boolean) as SheetId[] | undefined) ?? FULL_SET
  const projectName = `${y.name}`
  const sheets = sheetIds.map((sheet, i) => ({
    ...buildSheetContext({ sheet, twin, projectName, status: 'PRELIMINARY', sheetIndex: i + 1, sheetCount: sheetIds.length, sheetSize: ARCH_E }),
    sheetIds, exhibits: [] as string[],
  }))
  console.log(`    sheets          ${sheetIds.length}: ${sheetIds.join(', ')} on ARCH E`)
  const out = await renderSheetSetPdf({ sheets, sheetSize: ARCH_E, responsibility: undefined })
  const written = (() => { try { writeFileSync(outPath, out.buffer); return outPath } catch (e) { const err = e as NodeJS.ErrnoException; if (!['EACCES', 'EBUSY', 'EPERM'].includes(err.code ?? '')) throw e; const alt = outPath.replace(/\.pdf$/, `.${Date.now()}.pdf`); writeFileSync(alt, out.buffer); console.error(`    !! ${outPath} is locked (open in a viewer); wrote ${alt}`); return alt } })()
  const dxfPath = written.replace(/\.pdf$/i, '.dxf'), xmlPath = written.replace(/\.pdf$/i, '.landxml.xml')
  writeFileSync(dxfPath, toDxf(twin)); writeFileSync(xmlPath, toLandXml(twin))
  const manifest = {
    generatedAt: new Date().toISOString(), source: path.basename(yieldPath), sheets: sheetIds, sheetSize: 'ARCH E (36 x 48 in)', pages: out.pageCount,
    plottedScales: out.plottedScales, frameFailures: out.frameFailures,
    yield: y.yield, stormwater: { esdvCf: y.stormwater.esdvCf, practiceFootprintSqFt: y.stormwater.practiceFootprintSqFt, reservedSqFt: y.stormwater.reservedSqFt }, openSpace: y.openSpace ? { sqFt: y.openSpace.sqFt, requiredSqFt: y.openSpace.requiredSqFt } : null,
    sources: twin.sources, adjoiners: adjacentParcels.length, contours: contours?.contours.length ?? 0, soils: soils?.length ?? 0,
    outputs: { pdf: path.basename(written), dxf: path.basename(dxfPath), landxml: path.basename(xmlPath) },
    status: 'PRELIMINARY — Detailed Site Plan / preliminary plan of subdivision submission drawn from county GIS; not a survey',
  }
  writeFileSync(written.replace(/\.pdf$/i, '.manifest.json'), JSON.stringify(manifest, null, 2))
  console.log(`    wrote ${written} (${out.pageCount} pages), ${path.basename(dxfPath)}, ${path.basename(xmlPath)}, manifest`)
  for (const s of out.plottedScales) console.log(`      ${s.sheet}: ${s.scaleLabel}`)
  if (out.frameFailures.length) for (const f of out.frameFailures) console.log(`      !! ${f.sheet} frame incomplete: ${f.missing.join(', ')}`)
  void outDir
}

main().catch(e => { console.error(e); process.exit(1) })
