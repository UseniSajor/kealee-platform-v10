/**
 * Points of investigation and the 100-year overflow path — DPIE Site
 * Development Concept Plan checklist items C-9, C-10 and C-11.
 *
 * A POI is where runoff leaves the site. DPIE asks for the ESD required and
 * provided to be broken out per POI (C-9), for the ultimate 100-year overflow
 * path to be arrowed through the site (C-10) and for off-site area draining
 * onto it to be shown (C-11). All three follow from one thing: which way the
 * existing ground falls. The surface here is interpolated from the existing
 * contours already on the twin and routed D8 (steepest of eight neighbours).
 *
 * This is a CONCEPT-LEVEL determination from 2-ft mapping. It is stated as
 * such on the sheet, and a field-run survey resets it.
 */
import type { Position } from './site-twin'

export interface ContourLine { elevationFt: number; line: Position[] }
export interface Poi {
  id: string; at: Position; share: number
  /** Hydraulically longest on-site path to this POI and its fall, for the time of concentration. */
  longestFlowFt?: number; longestFlowDropFt?: number; longestFlowStart?: Position
}
export interface OverflowPath { from: string; poi: string; line: Position[] }
export interface PoiAnalysis {
  pois: Poi[]
  overflow: OverflowPath[]
  /** Cells draining onto the tract from outside it, as rings of cell squares merged by row runs. */
  offsiteAreaSqFt: number
  offsiteCells: Position[]
  cellFt: number
  method: string
}

function pointInRing(p: Position, ring: Position[]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j]
    if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

/**
 * @param tract   the site boundary (closed or open ring, EPSG:2248 ft)
 * @param contours existing contours
 * @param practices named points whose overflow path is traced (e.g. ESD cells)
 */
export function analysePois(input: {
  tract: Position[]
  contours: ContourLine[]
  practices: { id: string; at: Position }[]
  cellFt?: number
  marginFt?: number
  clusterFt?: number
  minShare?: number
}): PoiAnalysis {
  const CELL = input.cellFt ?? 5
  const M = input.marginFt ?? 260
  const tract = input.tract
  const xs = tract.map(p => p[0]), ys = tract.map(p => p[1])
  const x0 = Math.min(...xs) - M, x1 = Math.max(...xs) + M
  const y0 = Math.min(...ys) - M, y1 = Math.max(...ys) + M
  const nx = Math.ceil((x1 - x0) / CELL), ny = Math.ceil((y1 - y0) / CELL)

  // Samples along every contour, bucketed for nearest-neighbour lookup.
  const B = 40
  const buckets = new Map<string, [number, number, number][]>()
  for (const c of input.contours) {
    for (let i = 0; i < c.line.length - 1; i++) {
      const a = c.line[i], b = c.line[i + 1]
      const L = Math.hypot(b[0] - a[0], b[1] - a[1])
      const n = Math.max(1, Math.ceil(L / 4))
      for (let k = 0; k <= n; k++) {
        const x = a[0] + (b[0] - a[0]) * (k / n), y = a[1] + (b[1] - a[1]) * (k / n)
        const key = `${Math.floor(x / B)},${Math.floor(y / B)}`
        let arr = buckets.get(key)
        if (!arr) { arr = []; buckets.set(key, arr) }
        arr.push([x, y, c.elevationFt])
      }
    }
  }
  // Inverse-distance surface from the nearest samples of the two nearest
  // DIFFERENT contours — so a cell between the 204 and 206 lines reads between.
  const Z = new Float64Array(nx * ny)
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const x = x0 + (i + 0.5) * CELL, y = y0 + (j + 0.5) * CELL
      const bx = Math.floor(x / B), by = Math.floor(y / B)
      const best = new Map<number, number>()   // elevation -> nearest distance
      for (let r = 1; r <= 4 && best.size < 2; r++) {
        for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) {
          for (const [sx, sy, sz] of buckets.get(`${bx + dx},${by + dy}`) ?? []) {
            const d = Math.hypot(sx - x, sy - y)
            if (d < (best.get(sz) ?? Infinity)) best.set(sz, d)
          }
        }
      }
      const two = [...best.entries()].sort((a, b) => a[1] - b[1]).slice(0, 2)
      if (!two.length) { Z[j * nx + i] = NaN; continue }
      if (two.length === 1 || two[0][1] < 1e-6) { Z[j * nx + i] = two[0][0]; continue }
      const w0 = 1 / two[0][1], w1 = 1 / two[1][1]
      Z[j * nx + i] = (two[0][0] * w0 + two[1][0] * w1) / (w0 + w1)
    }
  }
  const idx = (i: number, j: number) => j * nx + i
  const at = (i: number, j: number): Position => [x0 + (i + 0.5) * CELL, y0 + (j + 0.5) * CELL]
  const inside = new Uint8Array(nx * ny)
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) inside[idx(i, j)] = pointInRing(at(i, j), tract) ? 1 : 0
  // D8 receivers
  const rec = new Int32Array(nx * ny).fill(-1)
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const z = Z[idx(i, j)]; if (Number.isNaN(z)) continue
    let bestDrop = 0, r = -1
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue
      const ii = i + di, jj = j + dj
      if (ii < 0 || jj < 0 || ii >= nx || jj >= ny) continue
      const zz = Z[idx(ii, jj)]; if (Number.isNaN(zz)) continue
      const drop = (z - zz) / (CELL * Math.hypot(di, dj))
      if (drop > bestDrop) { bestDrop = drop; r = idx(ii, jj) }
    }
    rec[idx(i, j)] = r
  }
  const trace = (start: number, max = 3000): number[] => {
    const path = [start]; let c = start
    for (let k = 0; k < max; k++) { const r = rec[c]; if (r < 0) break; c = r; path.push(c) }
    return path
  }
  const cellPos = (c: number): Position => at(c % nx, Math.floor(c / nx))

  // Where each on-site cell's flow first leaves the tract.
  const exits: Position[] = []
  const runs: { lengthFt: number; dropFt: number; start: Position }[] = []
  for (let j = 0; j < ny; j += 2) for (let i = 0; i < nx; i += 2) {
    const c = idx(i, j); if (!inside[c]) continue
    const p = trace(c)
    const k = p.findIndex(q => !inside[q])
    const end = k >= 0 ? k : p.length - 1
    exits.push(cellPos(p[end]))
    let L = 0
    for (let m = 1; m <= end; m++) { const a = cellPos(p[m - 1]), b = cellPos(p[m]); L += Math.hypot(b[0] - a[0], b[1] - a[1]) }
    runs.push({ lengthFt: L, dropFt: Z[c] - Z[p[end]], start: cellPos(c) })
  }
  // Single-link clustering of the exit points.
  const CL = input.clusterFt ?? 120
  const label = new Int32Array(exits.length).fill(-1)
  let k = 0
  for (let n = 0; n < exits.length; n++) {
    if (label[n] >= 0) continue
    const stack = [n]; label[n] = k
    while (stack.length) {
      const m = stack.pop()!
      for (let q = 0; q < exits.length; q++) {
        if (label[q] < 0 && Math.hypot(exits[q][0] - exits[m][0], exits[q][1] - exits[m][1]) < CL) {
          label[q] = k; stack.push(q)
        }
      }
    }
    k++
  }
  const sizes = new Array(k).fill(0)
  for (const l of label) sizes[l]++
  const order = sizes.map((s, i) => [s, i]).sort((a, b) => b[0] - a[0])
  const pois: Poi[] = []
  for (const [s, ci] of order) {
    const share = s / exits.length
    if (share < (input.minShare ?? 0.04)) continue
    const pts = exits.filter((_, i) => label[i] === ci)
    // the densest exit point of the cluster
    let bestP = pts[0], bestN = -1
    for (const p of pts) {
      const n = pts.filter(q => Math.hypot(q[0] - p[0], q[1] - p[1]) < 25).length
      if (n > bestN) { bestN = n; bestP = p }
    }
    const longest = runs.filter((_, i) => label[i] === ci).reduce((a, b) => (b.lengthFt > a.lengthFt ? b : a))
    pois.push({
      id: `POI-${pois.length + 1}`, at: bestP, share: Number(share.toFixed(3)),
      longestFlowFt: Math.round(longest.lengthFt), longestFlowDropFt: Number(longest.dropFt.toFixed(1)), longestFlowStart: longest.start,
    })
  }
  const poiOf = (p: Position) => pois.reduce((b, q) =>
    Math.hypot(q.at[0] - p[0], q.at[1] - p[1]) < Math.hypot(b.at[0] - p[0], b.at[1] - p[1]) ? q : b, pois[0])

  // Overflow paths from each practice to where it leaves the site.
  const overflow: OverflowPath[] = []
  for (const pr of input.practices) {
    const i = Math.floor((pr.at[0] - x0) / CELL), j = Math.floor((pr.at[1] - y0) / CELL)
    if (i < 0 || j < 0 || i >= nx || j >= ny || !pois.length) continue
    const p = trace(idx(i, j))
    const line: Position[] = []
    for (const c of p) { line.push(cellPos(c)); if (!inside[c] && line.length > 3) break }
    if (line.length < 2) continue
    overflow.push({ from: pr.id, poi: poiOf(line[line.length - 1]).id, line })
  }

  // Off-site area draining onto the tract.
  const offsiteCells: Position[] = []
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const c = idx(i, j); if (inside[c]) continue
    const p = trace(c, 400)
    if (p.some(q => inside[q])) offsiteCells.push(cellPos(c))
  }
  return {
    pois, overflow, offsiteCells, cellFt: CELL,
    offsiteAreaSqFt: offsiteCells.length * CELL * CELL,
    method: `D8 flow routing on a ${CELL}-ft surface interpolated from the existing 2-ft contours; exit points clustered at ${CL} ft; POIs carrying under ${Math.round(100 * (input.minShare ?? 0.04))}% of the site omitted. Concept-level — reset from the field-run survey.`,
  }
}
