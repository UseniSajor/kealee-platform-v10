/**
 * A site plan drawn with block characters instead of vectors.
 *
 * Same package, same numbers, same sources as the PDF — a different output
 * device. A PDF is a poor way to check a plan while iterating: it has to be
 * opened, and a defect that is obvious at a glance (a footprint through the
 * setback line, a discipline sheet identical to the boundary sheet, a drawing
 * lost in white space) survives a status line saying the render succeeded.
 *
 * Every drawing defect in this engine's history was found by LOOKING, and
 * missed by grepping. This exists so looking costs nothing.
 */

import type { Position, Ring, SiteTwin } from '../site-plan/site-twin'

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

export interface AsciiPlanInput {
  twin: SiteTwin
  /** Building restriction line. */
  envelope?: Ring | null
  footprint?: Ring | null
  title: string
  subtitle?: string
}

/**
 * Renders the plan for terminal review.
 *
 * z-order matters: contours beneath, then the BRL, then the lot line, then the
 * dwelling. A building drawn under the lot line reads as outside it.
 */
export function renderAsciiPlan(input: AsciiPlanInput): string {
  const parcel = input.twin.features.find(f => f.kind === 'Parcel') as { ring?: Ring } | undefined
  if (!parcel?.ring) return '  (no parcel geometry — nothing to draw)'
  const lot = parcel.ring.coordinates as Position[]

  const g = blank()
  const P = makeProjector(lot)

  // Contours first and clipped: the county serves them on a radius, so
  // unclipped they draw the neighbourhood and bury the lot.
  for (const f of input.twin.features) {
    if (f.kind !== 'Contour') continue
    const line_ = (f as { line?: Position[] }).line
    if (!line_?.length) continue
    const idx = ((f as { attributes?: Record<string, unknown> }).attributes?.weight === 'index')
    for (let i = 0; i < line_.length - 1; i++) {
      const a = line_[i], b2 = line_[i + 1]
      if (!inside(P(a), lot.map(P)) && !inside(P(b2), lot.map(P))) continue
      line(g, P(a), P(b2), idx ? '~' : '·', 0)
    }
  }

  // Easements before the envelope, under everything else. A recorded easement
  // constrains where a building may go as hard as a setback does, and the
  // terminal view is where a placement gets eyeballed — an easement visible
  // only in the PDF is invisible at exactly the moment it matters.
  let easementsDrawn = 0
  for (const f of input.twin.features) {
    if (f.kind !== 'Easement') continue
    const r = (f as { ring?: Ring }).ring
    if (!r?.coordinates?.length) continue
    ring(g, r.coordinates as Position[], P, 'E', 1)
    easementsDrawn++
  }

  if (input.envelope) ring(g, input.envelope.coordinates as Position[], P, '+', 1)
  ring(g, lot, P, '#', 2)
  if (input.footprint) fill(g, input.footprint.coordinates as Position[], P, '█', 3)

  const bar = '─'.repeat(W)
  const out: string[] = []
  out.push('┌' + bar + '┐')
  const pad = (s: string) => {
    const room = W - s.length
    const left = Math.max(0, Math.floor(room / 2))
    return ' '.repeat(left) + s + ' '.repeat(Math.max(0, room - left))
  }
  out.push('│' + pad(input.title) + '│')
  if (input.subtitle) out.push('│' + pad(input.subtitle) + '│')
  out.push('├' + bar + '┤')
  for (const row of g) out.push('│' + row.map(c => c.ch).join('') + '│')
  out.push('├' + bar + '┤')
  const legend = '# lot line   + BRL setback   █ dwelling   ~ index contour   · intermediate'
    + (easementsDrawn ? '   E easement' : '')
  out.push('│' + pad(legend) + '│')
  out.push('└' + bar + '┘')
  return out.join('\n')
}
