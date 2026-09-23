/** Six-page purchaser-facing preliminary Design Concept Package. */
import type { HomeownerDeliverables } from '../package/generate-homeowner-deliverables'
import type { ArchitectHandoff } from '../package/generate-architect-handoff'

export interface ConceptPdfInput {
  homeownerDeliverables: HomeownerDeliverables
  architectHandoff?: ArchitectHandoff
  logoUrl?: string
}
export type ConceptPdfResult = Buffer
interface Asset { label: string; buffer: Buffer; url: string }

const W = 792, H = 612, M = 38, CW = W - M * 2
const NAVY = '#14243d', ORANGE = '#e8724b', TEAL = '#209c9c'
const INK = '#172033', BODY = '#455268', MUTED = '#718096', LINE = '#dce3e9', SOFT = '#f5f7f8', WARN = '#a45b16'

function clean(v: unknown, fallback = 'Not provided'): string {
  const s = String(v ?? '').replace(/\s+/g, ' ').trim()
  return s || fallback
}
function short(v: unknown, n = 220): string { const s = clean(v); return s.length > n ? `${s.slice(0, n - 1)}…` : s }
function money(v: number): string { return `$${Math.max(0, Math.round(v)).toLocaleString('en-US')}` }
function addPage(doc: any): void { doc.addPage({ size: 'LETTER', layout: 'landscape', margin: M }) }
function header(doc: any, n: number, title: string, subtitle: string): void {
  doc.font('Helvetica-Bold').fontSize(8).fillColor(TEAL).text(`DESIGN CONCEPT  /  ${n} OF 6`, M, 28, { width: CW, characterSpacing: 1.2 })
  doc.font('Helvetica-Bold').fontSize(23).fillColor(NAVY).text(title, M, 48, { width: CW })
  doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(short(subtitle, 180), M, 78, { width: CW })
  doc.moveTo(M, 98).lineTo(W - M, 98).lineWidth(1).strokeColor(LINE).stroke()
}
function footer(doc: any, d: HomeownerDeliverables): void {
  const review = d.packageStatus?.professionallyReviewed ? 'Professional review recorded' : 'Professional verification not yet recorded'
  // Footer sits inside the physical page margin. Temporarily release pdfkit's
  // flow margin so drawing it cannot create a surprise overflow page.
  const previousBottom = doc.page.margins.bottom
  const previousY = doc.y
  doc.page.margins.bottom = 0
  doc.moveTo(M, H - 35).lineTo(W - M, H - 35).lineWidth(.7).strokeColor(LINE).stroke()
  doc.font('Helvetica-Bold').fontSize(6.6).fillColor('#a33a32').text(`PRELIMINARY CONCEPT — NOT FOR PERMIT OR CONSTRUCTION  ·  ${review.toUpperCase()}`, M, H - 25, { width: CW, align: 'center', lineBreak: false })
  doc.page.margins.bottom = previousBottom
  doc.y = previousY
}
function label(doc: any, s: string, x: number, y: number, width: number): void {
  doc.font('Helvetica-Bold').fontSize(7.2).fillColor(MUTED).text(s.toUpperCase(), x, y, { width, characterSpacing: .7 })
}
function value(doc: any, s: unknown, x: number, y: number, width: number, max = 150): void {
  doc.font('Helvetica').fontSize(9.2).fillColor(INK).text(short(s, max), x, y, { width, lineGap: 2 })
}
function card(doc: any, x: number, y: number, width: number, height: number, title: string): void {
  doc.roundedRect(x, y, width, height, 7).fillAndStroke('#fff', LINE)
  doc.font('Helvetica-Bold').fontSize(10).fillColor(NAVY).text(title, x + 14, y + 13, { width: width - 28 })
}
function bullets(doc: any, items: unknown[], x: number, y: number, width: number, max = 5): number {
  let cy = y
  for (const item of items.filter(Boolean).slice(0, max)) {
    doc.circle(x + 3, cy + 5, 1.8).fill(TEAL)
    doc.font('Helvetica').fontSize(8.7).fillColor(BODY).text(short(item, 170), x + 12, cy, { width: width - 12, height: 31, ellipsis: true, lineGap: 1 })
    cy += 33
  }
  return cy
}
function image(doc: any, asset: Asset, x: number, y: number, width: number, height: number): void {
  doc.roundedRect(x, y, width, height, 5).fill('#e8edf0')
  try { doc.image(asset.buffer, x, y, { fit: [width, height], align: 'center', valign: 'center' }) }
  catch { doc.font('Helvetica').fontSize(8).fillColor(MUTED).text('Project image unavailable in this export.', x + 12, y + height / 2 - 5, { width: width - 24, align: 'center' }) }
}

function page1(doc: any, d: HomeownerDeliverables): void {
  doc.rect(0, 0, W, H).fill('#fff'); doc.rect(0, 0, 245, H).fill(NAVY); doc.rect(0, 0, 9, H).fill(ORANGE)
  doc.font('Helvetica-Bold').fontSize(25).fillColor('#fff').text('K', 38, 40)
  doc.font('Helvetica-Bold').fontSize(8).fillColor('#9de1dc').text('DESIGN · BUILD · DELIVERY', 38, 76, { characterSpacing: 1.1 })
  doc.font('Helvetica-Bold').fontSize(28).fillColor('#fff').text('Design\nConcept\nPackage', 38, 142, { width: 170, lineGap: 5 })
  doc.font('Helvetica').fontSize(9).fillColor('#d9e2eb').text('A concise preliminary package for choosing a direction and planning the path forward.', 38, 285, { width: 165, lineGap: 4 })
  label(doc, 'Package status', 38, 402, 150); doc.font('Helvetica-Bold').fontSize(10).fillColor('#fff').text('PRELIMINARY', 38, 420)
  doc.font('Helvetica').fontSize(7.5).fillColor('#d9e2eb').text('Not for permit or construction', 38, 438)
  const x = 285, r = d.recommendation
  doc.font('Helvetica-Bold').fontSize(8).fillColor(ORANGE).text('PROJECT DECISION BRIEF', x, 72, { characterSpacing: 1 })
  doc.font('Helvetica-Bold').fontSize(27).fillColor(NAVY).text(short(d.project.path.replace(/_/g, ' '), 70), x, 101, { width: 460 })
  doc.font('Helvetica').fontSize(12).fillColor(BODY).text(clean(d.project.address ?? d.client.address), x, 142, { width: 460 })
  card(doc, x, 192, 462, 136, 'Recommended direction')
  doc.font('Helvetica-Bold').fontSize(17).fillColor(TEAL).text(short(r?.conceptName ?? d.narrative.styleNarrative, 80), x + 16, 225, { width: 430 })
  value(doc, r?.rationale?.[0] ?? d.narrative.designIntent ?? d.narrative.projectSummary, x + 16, 258, 430, 260)
  label(doc, 'Prepared for', x, 364, 132); value(doc, d.client.name, x, 380, 180, 70)
  label(doc, 'Generated', x + 215, 364, 100); value(doc, new Date(d.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }), x + 215, 380, 130)
  label(doc, 'Planning cost range', x, 424, 180); value(doc, r ? `${money(r.costRange[0])}–${money(r.costRange[1])}` : d.scope.estimatedTotal, x, 440, 200)
  label(doc, 'Budget stated', x + 215, 424, 150); value(doc, d.project.budgetRange, x + 215, 440, 190)
  doc.roundedRect(x, 501, 462, 46, 7).fill('#f7faf9')
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(NAVY).text('YOUR NEXT DECISION', x + 14, 513)
  doc.font('Helvetica').fontSize(8.5).fillColor(BODY).text(short(r?.nextStep ?? d.narrative.nextSteps, 190), x + 122, 511, { width: 325, height: 27, ellipsis: true })
  footer(doc, d)
}

function page2(doc: any, d: HomeownerDeliverables, assets: Asset[]): void {
  header(doc, 2, 'Project, existing condition & alternatives', 'What we understood and the directions considered')
  card(doc, M, 118, 335, 171, 'Project brief')
  label(doc, 'Address', M + 14, 149, 90); value(doc, d.project.address ?? d.client.address, M + 14, 163, 305)
  label(doc, 'Goals', M + 14, 202, 90); bullets(doc, d.project.goals.length ? d.project.goals : [d.narrative.projectSummary], M + 14, 219, 305, 2)
  card(doc, M, 305, 335, 236, 'Existing condition')
  const existing = assets.find(a => a.label.startsWith('Existing'))
  if (existing) {
    image(doc, existing, M + 14, 337, 150, 146); value(doc, d.existingConditions?.summary, M + 178, 337, 141, 210)
    label(doc, 'Problems to solve', M + 178, 410, 141); bullets(doc, d.existingConditions?.problems ?? d.project.knownConstraints, M + 178, 425, 141, 3)
  } else {
    doc.roundedRect(M + 14, 337, 307, 74, 5).fill(SOFT)
    doc.font('Helvetica-Bold').fontSize(9).fillColor(WARN).text('No project photograph was supplied.', M + 27, 354, { width: 280 })
    doc.font('Helvetica').fontSize(8.5).fillColor(BODY).text('No stock image has been substituted. Add labelled photos to create viewpoint-matched comparisons.', M + 27, 374, { width: 280 })
    bullets(doc, d.existingConditions?.problems ?? d.project.knownConstraints, M + 20, 431, 292, 3)
  }
  const x = 393; card(doc, x, 118, 361, 423, 'Concept alternatives')
  const dirs = d.conceptDirections?.length ? d.conceptDirections.slice(0, 3) : [{ id: 'rec', name: d.recommendation?.conceptName ?? d.narrative.styleNarrative, description: d.narrative.designIntent, recommended: true, keyFeatures: [], materials: [], styleMatch: 0, estimatedCost: 0 }]
  dirs.forEach((dir, i) => {
    const y = 153 + i * 121; doc.roundedRect(x + 14, y, 333, 105, 5).fill(dir.recommended ? '#edf9f7' : SOFT)
    doc.font('Helvetica-Bold').fontSize(8).fillColor(dir.recommended ? TEAL : MUTED).text(dir.recommended ? 'RECOMMENDED' : `ALTERNATIVE ${i + 1}`, x + 27, y + 12, { characterSpacing: .8 })
    doc.font('Helvetica-Bold').fontSize(12).fillColor(NAVY).text(short(dir.name, 52), x + 27, y + 29, { width: 300 })
    doc.font('Helvetica').fontSize(8.3).fillColor(BODY).text(short(dir.description, 180), x + 27, y + 51, { width: 300, height: 42, ellipsis: true })
  })
  footer(doc, d)
}

function page3(doc: any, d: HomeownerDeliverables): void {
  header(doc, 3, 'Recommended direction & concept plan', 'The planning logic behind the selected direction')
  card(doc, M, 118, 270, 423, 'Why this direction')
  doc.font('Helvetica-Bold').fontSize(16).fillColor(TEAL).text(short(d.recommendation?.conceptName ?? d.narrative.styleNarrative, 70), M + 15, 153, { width: 240 })
  bullets(doc, d.recommendation?.rationale?.length ? d.recommendation.rationale : [d.narrative.designIntent, d.narrative.lifestyleAlignment], M + 15, 191, 240, 5)
  label(doc, 'Material direction', M + 15, 374, 200); value(doc, d.narrative.materialDirection, M + 15, 391, 240, 260)
  label(doc, 'Planning cost range', M + 15, 469, 200); value(doc, d.recommendation ? `${money(d.recommendation.costRange[0])}–${money(d.recommendation.costRange[1])}` : d.scope.estimatedTotal, M + 15, 486, 240)
  const x = 325, fp = d.floorPlan; card(doc, x, 118, 429, 423, 'Preliminary concept plan')
  const stats = [['AREA', fp?.totalAreaFt2 ? `${Math.round(fp.totalAreaFt2).toLocaleString()} sq ft` : 'To verify'], ['FOOTPRINT', fp?.totalWidthFt && fp.totalDepthFt ? `${Math.round(fp.totalWidthFt)}′ × ${Math.round(fp.totalDepthFt)}′` : 'To verify'], ['SPACES', String(fp?.rooms?.length ?? fp?.roomCount ?? 0)]]
  stats.forEach(([k, v], i) => { const sx = x + 15 + i * 132; doc.roundedRect(sx, 153, 119, 52, 5).fill(SOFT); label(doc, k, sx + 10, 164, 100); doc.font('Helvetica-Bold').fontSize(10).fillColor(INK).text(v, sx + 10, 181, { width: 100 }) })
  const rooms = fp?.rooms?.slice(0, 9) ?? [], ty = 226
  doc.rect(x + 15, ty, 399, 23).fill(NAVY); doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#fff').text('SPACE', x + 24, ty + 8, { width: 160 }).text('DIMENSIONS', x + 211, ty + 8, { width: 85 }).text('AREA', x + 330, ty + 8, { width: 70 })
  if (!rooms.length) doc.font('Helvetica').fontSize(9).fillColor(BODY).text('A measured room schedule is not yet available. Field dimensions are required before permit drawings.', x + 28, ty + 55, { width: 370, lineGap: 4 })
  rooms.forEach((room, i) => { const y = ty + 23 + i * 24; doc.rect(x + 15, y, 399, 24).fill(i % 2 ? '#fff' : SOFT); doc.font('Helvetica').fontSize(8).fillColor(INK).text(short(room.label, 35), x + 24, y + 8, { width: 170 }).text(room.widthFt && room.depthFt ? `${room.widthFt}′ × ${room.depthFt}′` : '—', x + 211, y + 8, { width: 90 }).text(room.areaFt2 ? `${Math.round(room.areaFt2)} sf` : '—', x + 330, y + 8, { width: 70 }) })
  const ny = rooms.length ? Math.min(475, ty + 23 + rooms.length * 24 + 16) : 360
  label(doc, 'Plan notes', x + 24, ny, 120); value(doc, (fp?.layoutNotes ?? fp?.layoutIssues ?? []).slice(0, 3).join(' · ') || 'Confirm dimensions and code clearances during measured design development.', x + 24, ny + 16, 370, 260)
  footer(doc, d)
}

function page4(doc: any, d: HomeownerDeliverables, assets: Asset[]): void {
  header(doc, 4, 'Project-specific visual direction', 'Concept imagery coordinated to stored project information')
  const byUrl = new Map(assets.map(a => [a.url, a]))
  const pair = (d.beforeAfterPairs ?? []).map(p => ({ p, before: byUrl.get(p.beforeUrl), after: byUrl.get(p.afterUrl) })).find(p => p.before && p.after)
  if (pair?.before && pair.after) {
    label(doc, 'Existing — verified source image', M, 118, 330); label(doc, 'Proposed — matching source viewpoint', 404, 118, 350)
    image(doc, pair.before, M, 136, 350, 250); image(doc, pair.after, 404, 136, 350, 250)
    doc.font('Helvetica').fontSize(8).fillColor(BODY).text(short(`${pair.p.area ? `${pair.p.area}: ` : ''}${pair.p.label}${pair.p.viewpoint ? ` · ${pair.p.viewpoint}` : ''}`, 160), M, 397, { width: CW, align: 'center' })
  } else {
    const proposed = assets.filter(a => a.label.startsWith('Proposed')).slice(0, 4)
    if (proposed.length) proposed.forEach((a, i) => { const cols = proposed.length === 1 ? 1 : 2, iw = cols === 1 ? CW : 350, x = cols === 1 ? M : M + (i % 2) * 366, y = 122 + Math.floor(i / 2) * 190, ih = proposed.length <= 2 ? 310 : 160; image(doc, a, x, y, iw, ih); doc.font('Helvetica-Bold').fontSize(7.5).fillColor(TEAL).text(a.label.toUpperCase(), x + 8, y + ih + 8, { width: iw - 16 }) })
    else { card(doc, M, 125, CW, 230, 'Visual production status'); doc.font('Helvetica-Bold').fontSize(14).fillColor(WARN).text('Project-specific visuals are not available in this export.', M + 24, 177, { width: CW - 48 }); doc.font('Helvetica').fontSize(9.5).fillColor(BODY).text('This report does not insert stock images or placeholders. A final package must contain resolved project renderings before it is marked complete.', M + 24, 213, { width: CW - 48, lineGap: 4 }) }
  }
  doc.roundedRect(M, 463, CW, 58, 6).fill('#f7faf9'); doc.font('Helvetica-Bold').fontSize(8).fillColor(NAVY).text('HOW TO READ THESE IMAGES', M + 14, 477)
  doc.font('Helvetica').fontSize(8.3).fillColor(BODY).text(pair ? 'The comparison is linked by stored source URLs. Materials, dimensions, and site conditions remain subject to field verification.' : 'A before/after comparison appears only when a proposed view is explicitly linked to its source photograph.', M + 169, 475, { width: CW - 183, lineGap: 2 })
  footer(doc, d)
}

function page5(doc: any, d: HomeownerDeliverables): void {
  header(doc, 5, 'Materials, scope & planning cost', 'A concise basis for contractor conversations—not a bid')
  card(doc, M, 118, 235, 423, 'Materials & finish direction')
  const palette = d.materialsPalette?.length ? d.materialsPalette.slice(0, 8).map(i => `${i.item}: ${i.selection}${i.note ? ` — ${i.note}` : ''}`) : [d.narrative.materialDirection]
  bullets(doc, palette, M + 15, 157, 205, 8)
  const x = 289, s = d.scope; card(doc, x, 118, 465, 423, 'Scope and cost plan')
  doc.font('Helvetica-Bold').fontSize(16).fillColor(TEAL).text(s.totalEstimatedMin || s.totalEstimatedMax ? `${money(s.totalEstimatedMin)}–${money(s.totalEstimatedMax)}` : clean(s.estimatedTotal), x + 15, 151, { width: 260 })
  doc.font('Helvetica').fontSize(8).fillColor(MUTED).text('Preliminary construction planning range', x + 15, 175)
  const rows = s.lineItems?.slice(0, 9) ?? [], y0 = 205
  doc.rect(x + 15, y0, 435, 23).fill(NAVY); doc.font('Helvetica-Bold').fontSize(7.2).fillColor('#fff').text('TRADE / ITEM', x + 24, y0 + 8, { width: 105 }).text('DESCRIPTION', x + 142, y0 + 8, { width: 160 }).text('LOW', x + 316, y0 + 8, { width: 55 }).text('HIGH', x + 382, y0 + 8, { width: 55 })
  rows.forEach((r, i) => { const y = y0 + 23 + i * 25; doc.rect(x + 15, y, 435, 25).fill(i % 2 ? '#fff' : SOFT); doc.font('Helvetica').fontSize(7.6).fillColor(INK).text(short(r.trade, 24), x + 24, y + 8, { width: 108 }).text(short(r.description, 42), x + 142, y + 8, { width: 161 }).text(clean(r.estimatedLow, '—'), x + 316, y + 8, { width: 58 }).text(clean(r.estimatedHigh, '—'), x + 382, y + 8, { width: 58 }) })
  const ny = Math.max(455, y0 + 35 + rows.length * 25); doc.font('Helvetica').fontSize(7.5).fillColor(MUTED).text(short(s.budgetFitNote || 'Validate planning estimates through contractor bids and current supplier pricing.', 220), x + 20, ny, { width: 425, height: 33, ellipsis: true })
  label(doc, 'Not included in this preliminary package', x + 20, 498, 300); doc.font('Helvetica').fontSize(7.6).fillColor(BODY).text(short(s.exclusions.join(' · '), 250), x + 20, 513, { width: 425, height: 20, ellipsis: true })
  footer(doc, d)
}

function page6(doc: any, d: HomeownerDeliverables): void {
  header(doc, 6, 'Zoning, permits & next steps', 'Public zoning data, preliminary interpretation, and required verification')
  card(doc, M, 118, 405, 306, 'Zoning code & preliminary allowances')
  const claims = d.siteZoning?.claims?.slice(0, 6) ?? []
  if (claims.length) claims.forEach((c, i) => { const y = 154 + i * 40; doc.font('Helvetica-Bold').fontSize(7.7).fillColor(NAVY).text(short(c.claim, 34), M + 15, y, { width: 105 }); doc.font('Helvetica').fontSize(7.7).fillColor(INK).text(short(c.value, 95), M + 128, y, { width: 165, height: 28, ellipsis: true }); doc.font('Helvetica-Bold').fontSize(6.8).fillColor(c.status === 'requires-verification' ? WARN : TEAL).text(c.status.replace(/-/g, ' ').toUpperCase(), M + 302, y, { width: 86, align: 'right' }); doc.font('Helvetica').fontSize(6.6).fillColor(MUTED).text(short(c.source, 48), M + 302, y + 13, { width: 86, align: 'right' }) })
  else { doc.font('Helvetica-Bold').fontSize(10).fillColor(WARN).text('Zoning lookup must be completed before delivery.', M + 15, 158, { width: 370 }); doc.font('Helvetica').fontSize(8.5).fillColor(BODY).text('The final package must list the zoning district/code, describe general allowed use and relevant dimensional controls, cite the source, and flag items for final verification.', M + 15, 181, { width: 370, lineGap: 3 }) }
  const x = 463; card(doc, x, 118, 291, 306, 'Action plan')
  const rawNext = Array.isArray(d.nextSteps) ? d.nextSteps : d.nextSteps?.actionItems ?? []
  const steps = rawNext.length ? rawNext : ['Approve or request one revision.', 'Verify dimensions and zoning controls.', 'Advance to permit-ready drawings.', 'Obtain contractor pricing.']
  let cy = 157; steps.slice(0, 5).forEach((s, i) => { doc.circle(x + 23, cy + 9, 10).fill(i === 0 ? ORANGE : TEAL); doc.font('Helvetica-Bold').fontSize(8).fillColor('#fff').text(String(i + 1), x + 16, cy + 5, { width: 14, align: 'center' }); doc.font('Helvetica').fontSize(8.6).fillColor(BODY).text(short(s, 145), x + 42, cy, { width: 226, height: 34, ellipsis: true }); cy += 48 })
  doc.roundedRect(M, 441, CW, 100, 7).fill('#f7faf9'); doc.font('Helvetica-Bold').fontSize(9).fillColor(NAVY).text('PACKAGE MANIFEST', M + 15, 457)
  doc.font('Helvetica').fontSize(8).fillColor(BODY).text('01 Decision brief   ·   02 Project & alternatives   ·   03 Recommendation & plan   ·   04 Visual direction   ·   05 Scope & cost   ·   06 Zoning, permits & next steps', M + 15, 476, { width: CW - 30 })
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(TEAL).text('DELIVERED', M + 15, 510)
  doc.font('Helvetica').fontSize(7.7).fillColor(BODY).text('Six-page PDF · portal workspace · project files · one included revision. Video, extra views, editable CAD/DXF, consultation, and expanded revisions are optional add-ons when purchased.', M + 83, 508, { width: CW - 98, height: 26, ellipsis: true })
  footer(doc, d)
}

async function loadAssets(d: HomeownerDeliverables): Promise<Asset[]> {
  const sources: Array<{ label: string; url: string }> = []
  const add = (label: string, url: unknown) => { if (typeof url === 'string' && /^https?:\/\//i.test(url) && !sources.some(s => s.url === url)) sources.push({ label, url }) }
  for (const p of d.existingConditions?.photos ?? []) if (p.kind === 'photo') add(`Existing — ${p.label}`, p.url)
  for (const u of d.visuals?.stableDiffusionPrompts ?? []) add('Existing — customer source', u)
  for (const [i, u] of (d.visuals?.midjourneyPrompts ?? []).entries()) add(`Proposed concept ${i + 1}`, u)
  for (const p of d.beforeAfterPairs ?? []) { add(`Existing — ${p.label}`, p.beforeUrl); add(`Proposed concept — ${p.label}`, p.afterUrl) }
  const loaded = await Promise.all(sources.slice(0, 16).map(async s => { try { const r = await fetch(s.url), type = r.headers.get('content-type')?.toLowerCase() ?? ''; if (!r.ok || !type.startsWith('image/')) return null; return { ...s, buffer: Buffer.from(await r.arrayBuffer()) } } catch { return null } }))
  return loaded.filter((a): a is NonNullable<typeof a> => a !== null)
}

export async function renderConceptPdf(input: ConceptPdfInput): Promise<ConceptPdfResult> {
  const module = await import('pdfkit' as any), PDFDocument = module.default ?? module
  const d = input.homeownerDeliverables, assets = await loadAssets(d)
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ autoFirstPage: false, size: 'LETTER', layout: 'landscape', margin: M, bufferPages: true, info: { Title: `Kealee Design Concept Package — ${clean(d.project.address ?? d.client.address)}`, Author: 'Kealee', Subject: 'Preliminary design concept package' } })
    const chunks: Buffer[] = []; doc.on('data', (c: Buffer) => chunks.push(c)); doc.on('end', () => resolve(Buffer.concat(chunks))); doc.on('error', reject)
    addPage(doc); page1(doc, d); addPage(doc); page2(doc, d, assets); addPage(doc); page3(doc, d); addPage(doc); page4(doc, d, assets); addPage(doc); page5(doc, d); addPage(doc); page6(doc, d); doc.end()
  })
}
