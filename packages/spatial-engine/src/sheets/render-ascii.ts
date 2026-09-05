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
    // NOT clamped. Clamping drags anything off-frame onto the border, so an
    // adjoining lot 200 ft away drew as a solid line down the edge of the
    // frame. `plot` rejects out-of-range cells, which clips properly.
    return [col, row]
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
  { ch: ':', label: 'adjoining lot' },
  { ch: '#', label: 'lot line' },
  { ch: '+', label: 'BRL setback' },
  { ch: '█', label: 'dwelling' },
  { ch: '~', label: 'index contour' },
  { ch: '·', label: 'intermediate' },
  { ch: 'E', label: 'easement' },
  { ch: '▒', label: 'paving' },
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
  const P = makeProjector(lot)
  const used = new Set<string>()
  const mark = (ch: string) => { used.add(ch); return ch }

  const ringOf = (f: SiteFeature) => (f as { ring?: Ring }).ring?.coordinates as Position[] | undefined
  const lineOf = (f: SiteFeature) => (f as { line?: Position[] }).line

  // Adjoining lots, beneath everything. A recorded plat shows them because a
  // boundary means nothing without what it abuts — which line is shared, where
  // the subject sits in the block. They are context, so they are the faintest
  // thing drawn and never compete with the subject boundary.
  const adjoining = (input.twin as { adjacentParcels?: { ring: Ring }[] }).adjacentParcels ?? []
  for (const a of adjoining) {
    const r = a.ring?.coordinates as Position[] | undefined
    if (r?.length) ring(g, r, P, mark(':'), -1)
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
      line(g, P(a), P(b2), mark(idx ? '~' : '·'), 0)
    }
  }

  // Areas below lines, lines below the boundary, the dwelling on top.
  for (const f of feats) {
    const r = ringOf(f)
    if (f.kind === 'DrainageArea' && r) fill(g, r, P, mark('D'), 1)
  }
  for (const f of feats) {
    const r = ringOf(f)
    if (!r) continue
    if (f.kind === 'LimitOfDisturbance') ring(g, r, P, mark('L'), 2)
    else if (f.kind === 'Pavement' || f.kind === 'Sidewalk') fill(g, r, P, mark('▒'), 3)
    else if (f.kind === 'SWMPractice') fill(g, r, P, mark('S'), 4)
    else if (f.kind === 'Tree') fill(g, r, P, mark('T'), 5)
    else if (f.kind === 'Easement') ring(g, r, P, mark('E'), 5)
  }

  for (const f of feats) {
    const l = lineOf(f)
    if (!l || l.length < 2) continue
    if (f.kind !== 'Utility' && f.kind !== 'StormPipe') continue
    for (let i = 0; i < l.length - 1; i++) line(g, P(l[i]), P(l[i + 1]), mark('u'), 6)
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
    if (r) ring(g, r, P, mark('x'), 7)
    else if (l && l.length > 1) {
      for (let i = 0; i < l.length - 1; i++) line(g, P(l[i]), P(l[i + 1]), mark('x'), 7)
    }
  }

  for (const f of feats) {
    const pt = (f as { point?: Position }).point
    if (f.kind === 'SpotElevation' && pt) plot(g, ...P(pt), mark('○'), 8)
  }

  if (input.envelope) ring(g, input.envelope.coordinates as Position[], P, mark('+'), 9)
  for (const f of envelopeFeats) {
    const r2 = ringOf(f)
    if (r2) ring(g, r2, P, mark('+'), 9)
  }
  ring(g, lot, P, mark('#'), 10)
  if (input.footprint) fill(g, input.footprint.coordinates as Position[], P, mark('█'), 11)
  else for (const f of feats) {
    const r = ringOf(f)
    if (f.kind === 'Building' && r) fill(g, r, P, mark('█'), 11)
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
