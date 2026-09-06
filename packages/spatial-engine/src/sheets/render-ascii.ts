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

import type { Position, Ring, SiteFeature, SiteTwin } from '../site-plan/site-twin'
import { featuresForSheet, isBuildableEnvelope } from './composer'
import type { SheetId } from './sheet-template'

const W = 96, H = 40

type Cell = { ch: string; z: number }

function blank(): Cell[][] {
  // Empty ground sits BELOW every layer. It was -1, which is not below the
  // street's -2, so the centreline failed its own depth test and never painted
  // a single cell.
  return Array.from({ length: H }, () => Array.from({ length: W }, () => ({ ch: ' ', z: -99 })))
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
    // NOT clamped. Clamping drags anything off-frame onto the border, so an
    // adjoining lot 200 ft away drew as a solid line down the edge of the
    // frame. `plot` rejects out-of-range cells, which clips properly.
    return [col, row]
  }
}

// Returns whether the cell was actually painted. The legend is built from what
// landed IN FRAME: it listed a street centreline that was clipped away
// entirely, which is the same defect as a sheet whose legend describes content
// it does not carry.
function plot(g: Cell[][], c: number, r: number, ch: string, z: number): boolean {
  if (r < 0 || r >= H || c < 0 || c >= W) return false
  if (g[r][c].z <= z) { g[r][c] = { ch, z }; return true }
  return false
}

function line(g: Cell[][], a: [number, number], b: [number, number], ch: string, z: number): boolean {
  const steps = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]), 1)
  let drew = false
  for (let i = 0; i <= steps; i++) {
    if (plot(g, Math.round(a[0] + ((b[0] - a[0]) * i) / steps),
             Math.round(a[1] + ((b[1] - a[1]) * i) / steps), ch, z)) drew = true
  }
  return drew
}

function ring(g: Cell[][], pts: Position[], P: (p: Position) => [number, number], ch: string, z: number): boolean {
  let drew = false
  for (let i = 0; i < pts.length - 1; i++) if (line(g, P(pts[i]), P(pts[i + 1]), ch, z)) drew = true
  return drew
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
function fill(g: Cell[][], pts: Position[], P: (p: Position) => [number, number], ch: string, z: number): boolean {
  let drew = false
  const proj = pts.map(P)
  const minC = Math.min(...proj.map(p => p[0])), maxC = Math.max(...proj.map(p => p[0]))
  const minR = Math.min(...proj.map(p => p[1])), maxR = Math.max(...proj.map(p => p[1]))
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      if (inside([c, r], proj) && plot(g, c, r, ch, z)) drew = true
    }
  }
  return drew
}

export interface AsciiPlanInput {
  twin: SiteTwin
  /** Building restriction line. */
  envelope?: Ring | null
  footprint?: Ring | null
  title: string
  subtitle?: string
  /**
   * Draw only what this sheet carries, through the SAME filter the PDF uses.
   *
   * Without it every sheet in the set renders identically in the terminal —
   * which is exactly the defect that went unnoticed in the PDF until someone
   * looked at five pixel-identical pages. Reviewing C-400 by eye means seeing
   * C-400's content, not the boundary sheet again.
   */
  sheet?: SheetId
}

/** What each glyph is, in draw order. Only the ones actually drawn are shown. */
const GLYPHS: { ch: string; label: string }[] = [
  { ch: '-', label: 'street centreline' },
  { ch: ':', label: 'adjoining lot' },
  { ch: '#', label: 'lot line' },
  { ch: '+', label: 'BRL setback' },
  { ch: '█', label: 'dwelling' },
  { ch: '~', label: 'index contour' },
  { ch: '·', label: 'intermediate' },
  { ch: 'E', label: 'easement' },
  { ch: '▒', label: 'paving' },
  { ch: '"', label: 'planting strip' },
  { ch: 'L', label: 'limit of disturbance' },
  { ch: 'x', label: 'sediment control' },
  { ch: 'D', label: 'drainage area' },
  { ch: 'S', label: 'SWM practice' },
  { ch: 'u', label: 'utility' },
  { ch: 'T', label: 'tree' },
  { ch: '○', label: 'spot elevation' },
]

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

  // The sheet's own content, filtered exactly as the PDF filters it.
  const feats: SiteFeature[] = input.sheet
    ? featuresForSheet(input.twin.features, input.sheet)
    : input.twin.features

  const g = blank()
  // The frame includes the street. The centreline sits beyond the frontage, so
  // a projector fitted to the lot alone clipped it out entirely while the
  // legend went on advertising it.
  const streetsForFrame = (input.twin as { streets?: { paths: Position[][] }[] }).streets ?? []
  const nearLot = (q: Position) => lot.some(c => Math.hypot(c[0] - q[0], c[1] - q[1]) <= 90)
  const frame: Position[] = [...lot,
    ...streetsForFrame.flatMap(st => st.paths.flat()).filter(nearLot)]
  const P = makeProjector(frame)
  const used = new Set<string>()
  // A glyph enters the legend only once it has actually been painted in frame.
  const kept = (ch: string, drew: boolean) => { if (drew) used.add(ch); return ch }
  const mark = (ch: string) => ch

  const ringOf = (f: SiteFeature) => (f as { ring?: Ring }).ring?.coordinates as Position[] | undefined
  const lineOf = (f: SiteFeature) => (f as { line?: Position[] }).line

  // The STREET, drawn as the plat draws it: the existing pavement centreline
  // running across the frontage, with the ground on the far side shown by the
  // adjoining lots opposite. A frontage with no street on it gives a reviewer
  // no way to see which way the lot faces.
  const streets = (input.twin as { streets?: { name: string | null; paths: Position[][] }[] })
    .streets ?? []
  for (const st of streets) {
    for (const path of st.paths) {
      // Dash-dot in the terminal too, so it does not read as curb line.
      for (let i = 0; i < path.length - 1; i++) {
        kept('-', line(g, P(path[i]), P(path[i + 1]), '-', -2))
      }
    }
  }

  // Adjoining lots, beneath everything. A recorded plat shows them because a
  // boundary means nothing without what it abuts — which line is shared, where
  // the subject sits in the block. They are context, so they are the faintest
  // thing drawn and never compete with the subject boundary.
  const adjoining = (input.twin as { adjacentParcels?: { ring: Ring }[] }).adjacentParcels ?? []
  for (const a of adjoining) {
    const r = a.ring?.coordinates as Position[] | undefined
    if (r?.length) kept(':', ring(g, r, P, ':', -1))
  }

  // Contours first and clipped: the county serves them on a radius, so
  // unclipped they draw the neighbourhood and bury the lot.
  const lotProj = lot.map(P)
  for (const f of feats) {
    if (f.kind !== 'Contour') continue
    const l = lineOf(f)
    if (!l?.length) continue
    const idx = ((f as { attributes?: Record<string, unknown> }).attributes?.weight === 'index')
    for (let i = 0; i < l.length - 1; i++) {
      const a = l[i], b2 = l[i + 1]
      if (!inside(P(a), lotProj) && !inside(P(b2), lotProj)) continue
      kept(idx ? '~' : '·', line(g, P(a), P(b2), idx ? '~' : '·', 0))
    }
  }

  // Areas below lines, lines below the boundary, the dwelling on top.
  for (const f of feats) {
    const r = ringOf(f)
    if (f.kind === 'DrainageArea' && r) kept('D', fill(g, r, P, 'D', 1))
  }
  for (const f of feats) {
    const r = ringOf(f)
    if (!r) continue
    if (f.kind === 'LimitOfDisturbance') kept('L', ring(g, r, P, 'L', 2))
    else if (f.kind === 'Pavement' || f.kind === 'Sidewalk') kept('▒', fill(g, r, P, '▒', 3))
    else if (f.kind === 'Surface') kept('"', fill(g, r, P, '"', 2))
    else if (f.kind === 'SWMPractice') kept('S', fill(g, r, P, 'S', 4))
    else if (f.kind === 'Tree') kept('T', fill(g, r, P, 'T', 5))
    else if (f.kind === 'Easement') kept('E', ring(g, r, P, 'E', 5))
  }

  for (const f of feats) {
    const l = lineOf(f)
    if (!l || l.length < 2) continue
    if (f.kind !== 'Utility' && f.kind !== 'StormPipe') continue
    for (let i = 0; i < l.length - 1; i++) kept('u', line(g, P(l[i]), P(l[i + 1]), 'u', 6))
  }

  // Sediment control and any other proposed linework that is not the envelope.
  // Envelopes are drawn with the BRL glyph below, including the lot-namespaced
  // ones a subdivision drawing produces.
  const envelopeFeats = feats.filter(f =>
    f.kind === 'ProposedFeature' && 'id' in f && isBuildableEnvelope(String(f.id)))
  for (const f of feats) {
    if (f.kind !== 'ProposedFeature') continue
    const id = 'id' in f ? String(f.id) : ''
    if (isBuildableEnvelope(id)) continue
    const r = ringOf(f), l = lineOf(f)
    if (r) kept('x', ring(g, r, P, 'x', 7))
    else if (l && l.length > 1) {
      for (let i = 0; i < l.length - 1; i++) kept('x', line(g, P(l[i]), P(l[i + 1]), 'x', 7))
    }
  }

  for (const f of feats) {
    const pt = (f as { point?: Position }).point
    if (f.kind === 'SpotElevation' && pt) kept('○', plot(g, ...P(pt), '○', 8))
  }

  if (input.envelope) kept('+', ring(g, input.envelope.coordinates as Position[], P, '+', 9))
  for (const f of envelopeFeats) {
    const r2 = ringOf(f)
    if (r2) kept('+', ring(g, r2, P, '+', 9))
  }
  kept('#', ring(g, lot, P, '#', 10))
  if (input.footprint) kept('█', fill(g, input.footprint.coordinates as Position[], P, '█', 11))
  else for (const f of feats) {
    const r = ringOf(f)
    if (f.kind === 'Building' && r) kept('█', fill(g, r, P, '█', 11))
  }

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
  // Only what this sheet actually drew. A fixed legend listing symbols absent
  // from the drawing is how an empty sheet passes for a full one.
  const legend = GLYPHS.filter(x => used.has(x.ch)).map(x => `${x.ch} ${x.label}`).join('   ')
  out.push('│' + pad(legend || '(nothing drawn on this sheet)') + '│')
  out.push('└' + bar + '┘')
  return out.join('\n')
}
