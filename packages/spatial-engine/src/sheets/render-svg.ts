/**
 * Vector sheet renderer (SVG).
 *
 * SVG is the primary vector output and converts cleanly to PDF. It has no
 * runtime dependency, so sheets can be produced anywhere in the pipeline and
 * inspected directly.
 *
 * Every sheet is drawn from the digital site twin. Two sheets showing the same
 * boundary read it from the same feature, so they cannot disagree.
 */

import type { SiteTwin, SiteFeature, Ring } from '../site-plan/site-twin'
import { featuresOfKind } from '../site-plan/site-twin'
import {
  ARCH_D, boundsOf, fitViewport, project, projectRing, graphicScaleTicks,
  type Bounds, type SheetSize, type Viewport,
} from './viewport'
import {
  SHEET_TITLES, SHEET_DISCIPLINE, type SheetContext, type SheetId, type SheetStatus,
  type RevisionEntry,
} from './sheet-template'

const PAD_FT = 20

interface Pen { stroke?: string; fill?: string; width?: number; dash?: string; opacity?: number }

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function poly(pts: [number, number][], pen: Pen): string {
  const d = pts.map(p => p.join(',')).join(' ')
  return `<polygon points="${d}" fill="${pen.fill ?? 'none'}" stroke="${pen.stroke ?? '#000'}" stroke-width="${pen.width ?? 1}"${
    pen.dash ? ` stroke-dasharray="${pen.dash}"` : ''
  }${pen.opacity != null ? ` fill-opacity="${pen.opacity}"` : ''}/>`
}

function line(x1: number, y1: number, x2: number, y2: number, pen: Pen): string {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${pen.stroke ?? '#000'}" stroke-width="${pen.width ?? 1}"${
    pen.dash ? ` stroke-dasharray="${pen.dash}"` : ''
  }/>`
}

function text(x: number, y: number, s: string, size = 8, opts: { bold?: boolean; anchor?: string; fill?: string } = {}): string {
  return `<text x="${x}" y="${y}" font-family="Helvetica, Arial, sans-serif" font-size="${size}"${
    opts.bold ? ' font-weight="bold"' : ''
  }${opts.anchor ? ` text-anchor="${opts.anchor}"` : ''} fill="${opts.fill ?? '#000'}">${esc(s)}</text>`
}

function rect(x: number, y: number, w: number, h: number, pen: Pen): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${pen.fill ?? 'none'}" stroke="${pen.stroke ?? '#000'}" stroke-width="${pen.width ?? 1}"/>`
}

// ── Sheet frame ─────────────────────────────────────────────────────────────

function northArrow(x: number, y: number): string {
  return [
    `<g transform="translate(${x},${y})">`,
    '<polygon points="0,-18 6,8 0,2 -6,8" fill="#000"/>',
    text(0, 22, 'N', 11, { bold: true, anchor: 'middle' }),
    '</g>',
  ].join('')
}

function graphicScale(x: number, y: number, vp: Viewport): string {
  const ticks = graphicScaleTicks(vp)
  const out: string[] = [text(x, y - 6, `SCALE: ${vp.label}`, 8, { bold: true })]
  const barH = 6
  ticks.slice(0, -1).forEach((t, i) => {
    const next = ticks[i + 1]
    out.push(rect(x + t.pt, y, next.pt - t.pt, barH, { fill: i % 2 ? '#000' : '#fff', stroke: '#000', width: 0.5 }))
  })
  ticks.forEach(t => out.push(text(x + t.pt, y + barH + 9, String(t.ft), 6.5, { anchor: 'middle' })))
  out.push(text(x + ticks[ticks.length - 1].pt + 14, y + barH + 9, 'FEET', 6.5))
  return out.join('')
}

function titleBlock(ctx: SheetContext, sheet: SheetSize): string {
  const x = sheet.widthPt - sheet.marginPt - sheet.titleBlockWidthPt
  const y = sheet.marginPt
  const w = sheet.titleBlockWidthPt
  const h = sheet.heightPt - sheet.marginPt * 2
  const out: string[] = [rect(x, y, w, h, { stroke: '#000', width: 1.5 })]
  let cy = y + 26

  out.push(text(x + 12, cy, 'KEALEE', 20, { bold: true }))
  cy += 14
  out.push(text(x + 12, cy, 'design, build, deliver', 8, { fill: '#E8793A' }))
  cy += 22
  out.push(line(x, cy - 8, x + w, cy - 8, { width: 0.75 }))

  const parcel = ctx.twin.features.find(f => f.kind === 'Parcel') as
    | { parcelId?: string | null; taxAccount?: string; lot?: string; block?: string } | undefined

  const rows: [string, string][] = [
    ['PROJECT', ctx.projectName],
    ['ADDRESS', ctx.twin.address],
    ['JURISDICTION', ctx.twin.jurisdictionCode.replace(/_/g, ' ').toUpperCase()],
    ['TAX ACCOUNT', parcel?.taxAccount ?? '—'],
    ['PARCEL', parcel?.parcelId ?? '—'],
    ['LOT / BLOCK', `${parcel?.lot ?? '—'} / ${parcel?.block ?? '—'}`],
    ['ZONE', ctx.twin.zoneCode ?? '—'],
    ['OVERLAYS', ctx.twin.overlayCodes.length ? ctx.twin.overlayCodes.join(', ') : 'None mapped'],
  ]
  for (const [k, v] of rows) {
    out.push(text(x + 12, cy, k, 6, { fill: '#666' }))
    cy += 10
    out.push(text(x + 12, cy, v.length > 42 ? v.slice(0, 41) + '…' : v, 8, { bold: true }))
    cy += 15
  }

  cy += 6
  out.push(line(x, cy - 8, x + w, cy - 8, { width: 0.75 }))
  out.push(text(x + 12, cy, 'RESPONSIBLE DISCIPLINE', 6, { fill: '#666' }))
  cy += 10
  out.push(text(x + 12, cy, SHEET_DISCIPLINE[ctx.sheet], 7.5, { bold: true }))
  cy += 16
  out.push(text(x + 12, cy, 'REVIEW STATUS', 6, { fill: '#666' }))
  cy += 10
  out.push(text(x + 12, cy, ctx.status.replace(/_/g, ' '), 7.5, { bold: true }))
  cy += 20

  // Revision table
  out.push(line(x, cy - 8, x + w, cy - 8, { width: 0.75 }))
  out.push(text(x + 12, cy, 'REVISIONS', 6, { fill: '#666' }))
  cy += 11
  out.push(text(x + 12, cy, 'NO', 6, { bold: true }))
  out.push(text(x + 34, cy, 'DATE', 6, { bold: true }))
  out.push(text(x + 84, cy, 'DESCRIPTION', 6, { bold: true }))
  cy += 4
  out.push(line(x + 8, cy, x + w - 8, cy, { width: 0.4 }))
  cy += 10
  const revs = ctx.revisions.length ? ctx.revisions : [{ number: 0, date: new Date().toISOString().slice(0, 10), description: 'Initial issue', by: 'Kealee' }]
  for (const r of revs.slice(0, 8)) {
    out.push(text(x + 12, cy, String(r.number), 6.5))
    out.push(text(x + 34, cy, r.date, 6.5))
    out.push(text(x + 84, cy, r.description.slice(0, 34), 6.5))
    cy += 11
  }

  // Source-data notes — required on every sheet.
  cy += 8
  out.push(line(x, cy - 8, x + w, cy - 8, { width: 0.75 }))
  out.push(text(x + 12, cy, 'SOURCE DATA', 6, { fill: '#666' }))
  cy += 10
  for (const s of ctx.twin.sources.slice(0, 4)) {
    out.push(text(x + 12, cy, `${s.dataset.slice(0, 40)}`, 6))
    cy += 8
    out.push(text(x + 12, cy, `${s.authority.slice(0, 34)} · ${s.retrievedAt.slice(0, 10)}`, 5.5, { fill: '#666' }))
    cy += 11
  }

  // Coordinate and datum notes.
  cy += 6
  out.push(text(x + 12, cy, 'COORDINATE SYSTEM', 6, { fill: '#666' }))
  cy += 9
  out.push(text(x + 12, cy, ctx.twin.crs, 6.5))
  cy += 9
  out.push(text(x + 12, cy, `H: ${ctx.twin.horizontalDatum ?? 'NOT ESTABLISHED'}`, 6.5))
  cy += 9
  out.push(text(x + 12, cy, `V: ${ctx.twin.verticalDatum ?? 'NOT ESTABLISHED'}`, 6.5))

  // Sheet number, bottom right.
  out.push(text(x + w - 14, sheet.heightPt - sheet.marginPt - 34, ctx.sheet, 30, { bold: true, anchor: 'end' }))
  out.push(text(x + w - 14, sheet.heightPt - sheet.marginPt - 20, `SHEET ${ctx.sheetIndex} OF ${ctx.sheetCount}`, 7, { anchor: 'end' }))
  out.push(text(x + 12, sheet.heightPt - sheet.marginPt - 20, `MODEL REV ${ctx.twinRevision}`, 6, { fill: '#666' }))
  return out.join('')
}

function watermark(ctx: SheetContext, sheet: SheetSize): string {
  if (ctx.status === 'PERMIT_SET') return ''
  const label = ctx.disclosure ?? ctx.status.replace(/_/g, ' ')
  const cx = (sheet.widthPt - sheet.titleBlockWidthPt) / 2
  const cy = sheet.heightPt / 2
  return (
    `<g transform="translate(${cx},${cy}) rotate(-30)" opacity="0.10">` +
    text(0, 0, label.length > 60 ? 'PRELIMINARY — NOT FOR CONSTRUCTION' : label, 46, { bold: true, anchor: 'middle', fill: '#c00' }) +
    '</g>'
  )
}

function legend(x: number, y: number, entries: [string, Pen][]): string {
  const out: string[] = [text(x, y - 8, 'LEGEND', 7, { bold: true })]
  entries.forEach(([label, pen], i) => {
    const ly = y + i * 13
    out.push(line(x, ly, x + 22, ly, pen))
    out.push(text(x + 28, ly + 3, label, 6.5))
  })
  return out.join('')
}

// ── Per-sheet content ───────────────────────────────────────────────────────

function ringsFor(twin: SiteTwin): Ring[] {
  return twin.features
    .map(f => (f as { ring?: Ring }).ring)
    .filter((r): r is Ring => Boolean(r))
}

function drawParcel(twin: SiteTwin, vp: Viewport, b: Bounds): string {
  return featuresOfKind(twin, 'Parcel')
    .map(p => poly(projectRing(p.ring, vp, b, PAD_FT), { stroke: '#000', width: 2 }))
    .join('')
}

function drawBuildings(twin: SiteTwin, vp: Viewport, b: Bounds, existingOnly: boolean): string {
  return featuresOfKind(twin, 'Building')
    .filter(bd => bd.existing === existingOnly)
    .map(bd =>
      poly(projectRing(bd.ring, vp, b, PAD_FT), {
        stroke: existingOnly ? '#888' : '#000',
        width: existingOnly ? 1 : 1.5,
        fill: existingOnly ? '#eee' : '#d8d8d8',
        dash: existingOnly ? '4,3' : undefined,
        opacity: 0.8,
      }),
    )
    .join('')
}

function drawSetbacks(twin: SiteTwin, vp: Viewport, b: Bounds): string {
  return featuresOfKind(twin, 'Setback')
    .filter(s => s.ring)
    .map(s => poly(projectRing(s.ring!, vp, b, PAD_FT), { stroke: '#c00', width: 0.8, dash: '6,4' }))
    .join('')
}

function drawEasements(twin: SiteTwin, vp: Viewport, b: Bounds): string {
  return featuresOfKind(twin, 'Easement')
    .map(e => poly(projectRing(e.ring, vp, b, PAD_FT), { stroke: '#06c', width: 0.8, dash: '10,3,2,3' }))
    .join('')
}

function drawLod(twin: SiteTwin, vp: Viewport, b: Bounds): string {
  return featuresOfKind(twin, 'LimitOfDisturbance')
    .map(l => poly(projectRing(l.ring, vp, b, PAD_FT), { stroke: '#e8793a', width: 1.6, dash: '12,4' }))
    .join('')
}

function dataTable(x: number, y: number, title: string, rows: [string, string][]): string {
  const out: string[] = [text(x, y, title, 9, { bold: true })]
  let cy = y + 14
  for (const [k, v] of rows) {
    out.push(text(x, cy, k, 7, { fill: '#555' }))
    out.push(text(x + 190, cy, v, 7, { bold: true }))
    cy += 12
  }
  return out.join('')
}

/**
 * Builds a sheet context with the drawing scale already resolved.
 *
 * The scale is a property of the geometry and the sheet size, not something a
 * caller should type in — an earlier version let callers pass it by hand and the
 * frame audit correctly failed every sheet because it arrived empty. Use this
 * rather than constructing SheetContext literally.
 */
export function buildSheetContext(input: {
  sheet: SheetId
  twin: SiteTwin
  projectName: string
  sheetIndex: number
  sheetCount: number
  status?: SheetStatus
  disclosure?: string | null
  revisions?: RevisionEntry[]
  sheetSize?: SheetSize
}): SheetContext {
  const size = input.sheetSize ?? ARCH_D
  const vp = fitViewport(boundsOf(ringsFor(input.twin)), size, PAD_FT)
  const level = input.twin.sources.reduce(
    (lowest, s) => (s.reliabilityLevel < lowest ? s.reliabilityLevel : lowest),
    2 as 0 | 1 | 2,
  )
  return {
    sheet: input.sheet,
    twin: input.twin,
    twinRevision: input.twin.revision,
    status: input.status ?? 'PRELIMINARY',
    scale: vp.label,
    revisions: input.revisions ?? [],
    reliabilityLevel: level,
    disclosure: input.disclosure ?? null,
    projectName: input.projectName,
    sheetIndex: input.sheetIndex,
    sheetCount: input.sheetCount,
  }
}

export interface RenderedSheet {
  sheet: SheetId
  svg: string
  scaleLabel: string
  twinRevision: number
}

export function renderSheetSvg(ctx: SheetContext, sheetSize: SheetSize = ARCH_D): RenderedSheet {
  const rings = ringsFor(ctx.twin)
  const b = boundsOf(rings)
  const vp = fitViewport(b, sheetSize, PAD_FT)

  const body: string[] = []
  const contentX = sheetSize.marginPt + 8

  switch (ctx.sheet) {
    case 'C-000': {
      body.push(text(contentX, 90, 'SITE DEVELOPMENT PLANS', 30, { bold: true }))
      body.push(text(contentX, 118, ctx.twin.address, 14))
      body.push(dataTable(contentX, 168, 'SITE DATA', [
        ['Zone', ctx.twin.zoneCode ?? '—'],
        ['Overlays', ctx.twin.overlayCodes.join(', ') || 'None mapped'],
        ['Jurisdiction', ctx.twin.jurisdictionCode.replace(/_/g, ' ')],
        ['Coordinate system', ctx.twin.crs],
        ['Horizontal datum', ctx.twin.horizontalDatum ?? 'NOT ESTABLISHED'],
        ['Vertical datum', ctx.twin.verticalDatum ?? 'NOT ESTABLISHED'],
        ['Site model revision', String(ctx.twinRevision)],
      ]))
      body.push(dataTable(contentX + 340, 168, 'PROFESSIONAL RESPONSIBILITY MATRIX',
        (Object.keys(SHEET_TITLES) as SheetId[]).map(s => [s, SHEET_DISCIPLINE[s]])))
      body.push(dataTable(contentX, 330, 'SHEET INDEX',
        (Object.keys(SHEET_TITLES) as SheetId[]).map(s => [s, SHEET_TITLES[s]])))
      body.push(text(contentX, 560, 'GENERAL NOTES', 9, { bold: true }))
      const notes = [
        '1. These drawings are prepared by Kealee acting as drafter. They require review, correction and sealing by a licensed professional before use for permit or construction.',
        '2. Boundary geometry shown from the source listed in the title block. Where that source is GIS, it is preliminary and may be offset from surveyed boundaries.',
        '3. Utility locations shown are from record information. Field verification is required before excavation. Call Miss Utility.',
        '4. Elevations refer to the vertical datum stated in the title block. Where none is established, no elevation work is shown.',
        '5. Contractor shall verify all dimensions and existing conditions before construction.',
      ]
      notes.forEach((n, i) => body.push(text(contentX, 578 + i * 13, n.slice(0, 150), 6.5)))
      break
    }

    case 'C-100': {
      body.push(drawParcel(ctx.twin, vp, b))
      body.push(drawEasements(ctx.twin, vp, b))
      body.push(drawBuildings(ctx.twin, vp, b, true))
      body.push(legend(contentX, sheetSize.heightPt - 120, [
        ['Property boundary', { stroke: '#000', width: 2 }],
        ['Easement', { stroke: '#06c', width: 0.8, dash: '10,3,2,3' }],
        ['Existing building', { stroke: '#888', width: 1, dash: '4,3' }],
      ]))
      break
    }

    case 'C-200': {
      body.push(drawParcel(ctx.twin, vp, b))
      body.push(drawSetbacks(ctx.twin, vp, b))
      body.push(drawEasements(ctx.twin, vp, b))
      body.push(drawBuildings(ctx.twin, vp, b, false))
      body.push(drawLod(ctx.twin, vp, b))
      body.push(legend(contentX, sheetSize.heightPt - 140, [
        ['Property boundary', { stroke: '#000', width: 2 }],
        ['Building setback', { stroke: '#c00', width: 0.8, dash: '6,4' }],
        ['Proposed building', { stroke: '#000', width: 1.5 }],
        ['Limit of disturbance', { stroke: '#e8793a', width: 1.6, dash: '12,4' }],
      ]))
      break
    }

    default: {
      // Every remaining sheet draws the same base geometry from the same model,
      // then layers its own discipline content as it is populated.
      body.push(drawParcel(ctx.twin, vp, b))
      body.push(drawLod(ctx.twin, vp, b))
      body.push(text(contentX, sheetSize.heightPt - 150, SHEET_TITLES[ctx.sheet], 10, { bold: true }))
      body.push(text(contentX, sheetSize.heightPt - 136,
        'Base geometry from the site model. Discipline content populated from the calculation package.', 7))
      break
    }
  }

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${sheetSize.widthPt}" height="${sheetSize.heightPt}" viewBox="0 0 ${sheetSize.widthPt} ${sheetSize.heightPt}">`,
    `<rect width="100%" height="100%" fill="#fff"/>`,
    rect(sheetSize.marginPt / 2, sheetSize.marginPt / 2, sheetSize.widthPt - sheetSize.marginPt, sheetSize.heightPt - sheetSize.marginPt, { stroke: '#000', width: 2 }),
    watermark(ctx, sheetSize),
    body.join(''),
    text(contentX, sheetSize.marginPt + 18, `${ctx.sheet} — ${SHEET_TITLES[ctx.sheet]}`, 13, { bold: true }),
    northArrow(sheetSize.widthPt - sheetSize.titleBlockWidthPt - sheetSize.marginPt - 44, sheetSize.marginPt + 46),
    graphicScale(contentX, sheetSize.heightPt - sheetSize.marginPt - 30, vp),
    titleBlock(ctx, sheetSize),
    '</svg>',
  ].join('\n')

  return { sheet: ctx.sheet, svg, scaleLabel: vp.label, twinRevision: ctx.twinRevision }
}
