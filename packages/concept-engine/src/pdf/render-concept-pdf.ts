/**
 * Concept Package PDF Renderer
 * Generates a multi-page PDF from assembled homeowner deliverables.
 * Uses pdfkit — installed in @kealee/worker.
 *
 * Pages:
 *   1. Cover — project title, address, date
 *   2. Floor Plan — room inventory table + layout dimensions
 *   3. Design Narrative — project summary + space-by-space
 *   4. Scope of Work — trade-by-trade line items + cost ranges
 *   5. Permit Path — permits required, timeline, cost estimate
 *   6. Visual Direction — style keywords + Midjourney prompt samples
 *   7. Next Steps — upsell services + Kealee contact
 */

// Dynamic import used at call site (pdfkit is a devDep of @kealee/worker, not concept-engine)
// This file exports a factory that accepts the PDFDocument class.

import type { HomeownerDeliverables } from '../package/generate-homeowner-deliverables'
import type { ArchitectHandoff }       from '../package/generate-architect-handoff'

export interface ConceptPdfInput {
  homeownerDeliverables: HomeownerDeliverables
  architectHandoff?: ArchitectHandoff
  logoUrl?: string
}

export type ConceptPdfResult = Buffer

interface PdfVisualAsset {
  label: string
  buffer: Uint8Array
  url?: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function safeTruncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + '…' : str
}

function drawHRule(doc: any, y?: number): void {
  const yPos = y ?? doc.y
  doc.moveTo(50, yPos).lineTo(545, yPos).strokeColor('#e2e8f0').lineWidth(1).stroke()
}

function sectionHeader(doc: any, title: string): void {
  doc.moveDown(0.5)
  doc.fontSize(13).fillColor('#0f172a').font('Helvetica-Bold').text(title)
  drawHRule(doc)
  doc.moveDown(0.25)
  doc.fontSize(10).fillColor('#334155').font('Helvetica')
}

function twoCol(doc: any, label: string, value: string): void {
  doc.fontSize(9).fillColor('#64748b').font('Helvetica').text(label, { continued: true, width: 150 })
  doc.fontSize(9).fillColor('#0f172a').font('Helvetica').text(value || '—')
}

// ── Status stamps and the standing footer ────────────────────────────────────
//
// The purchaser standard (docs/system/concept-package-deliverables.md): existing
// and proposed conditions cannot be confused; every section says what it is.

type Stamp = 'EXISTING' | 'PROPOSED CONCEPT' | 'REQUIRES VERIFICATION' | 'PROFESSIONALLY REVIEWED' | 'APPROVED BY CUSTOMER' | 'NOT FOR PERMIT OR CONSTRUCTION'
const STAMP_COLOR: Record<Stamp, string> = {
  'EXISTING': '#475569', 'PROPOSED CONCEPT': '#0f766e', 'REQUIRES VERIFICATION': '#b45309',
  'PROFESSIONALLY REVIEWED': '#1d4ed8', 'APPROVED BY CUSTOMER': '#15803d', 'NOT FOR PERMIT OR CONSTRUCTION': '#b91c1c',
}
function stamp(doc: any, s: Stamp, x = 395, y?: number): void {
  const yy = y ?? doc.y
  const w = 150
  doc.save()
  doc.roundedRect(x, yy, w, 14, 3).lineWidth(0.8).strokeColor(STAMP_COLOR[s]).stroke()
  doc.fontSize(6.5).fillColor(STAMP_COLOR[s]).font('Helvetica-Bold').text(s, x, yy + 3.5, { width: w, align: 'center', lineBreak: false })
  doc.restore()
}
function sectionWithStamp(doc: any, title: string, stamps: Stamp[]): void {
  doc.moveDown(0.5)
  const y = doc.y
  doc.fontSize(13).fillColor('#0f172a').font('Helvetica-Bold').text(title, 50, y, { width: 330 })
  const titleBottom = doc.y   // a two-line title ends lower than the stamps do
  stamps.slice(0, 2).forEach((st, i) => stamp(doc, st, 395, y + i * 16))
  doc.y = Math.max(titleBottom, y + 16 * Math.max(1, stamps.length)) + 2
  doc.x = 50   // the stamp moved the cursor to the right column; the body starts at the margin
  drawHRule(doc)
  doc.moveDown(0.25)
  doc.fontSize(10).fillColor('#334155').font('Helvetica')
}
/** Every page: the package is preliminary. Drawn on pageAdded so no page is missed. */
function standingFooter(doc: any, data: HomeownerDeliverables): void {
  const status = data.packageStatus
  const line = [
    'PRELIMINARY CONCEPT — NOT FOR PERMIT OR CONSTRUCTION',
    status?.professionallyReviewed ? `PROFESSIONALLY REVIEWED (${status.professionallyReviewed.state})` : 'NOT YET PROFESSIONALLY REVIEWED',
    status?.approvedByCustomer ? 'APPROVED BY CUSTOMER' : 'AWAITING CUSTOMER APPROVAL',
  ].join('   ·   ')
  // Drawn inside the bottom margin: pdfkit would otherwise open a new page for
  // text past the margin, fire pageAdded again, and recurse without end.
  const bottom = doc.page.margins.bottom
  doc.page.margins.bottom = 0
  const y = doc.y
  doc.save()
  doc.fontSize(6.5).fillColor('#b91c1c').font('Helvetica-Bold').text(line, 50, doc.page.height - 34, { width: 495, align: 'center', lineBreak: false })
  doc.restore()
  doc.page.margins.bottom = bottom
  doc.y = y
}

// ── Page 1: Cover ─────────────────────────────────────────────────────────────

function drawCoverPage(doc: any, data: HomeownerDeliverables): void {
  doc.fontSize(28).fillColor('#0f172a').font('Helvetica-Bold')
     .text('Kealee', 50, 80)
  doc.fontSize(11).fillColor('#64748b').font('Helvetica')
     .text('Concept Package', 50, 116)

  doc.moveDown(3)

  doc.fontSize(18).fillColor('#0f172a').font('Helvetica-Bold')
     .text(data.project?.path?.replace(/_/g, ' ')?.replace(/\b\w/g, (c: string) => c.toUpperCase()) ?? 'Concept Package', { align: 'left' })
  doc.moveDown(0.5)

  doc.fontSize(11).fillColor('#334155').font('Helvetica')
     .text(data.project?.address ?? data.client?.address ?? '', { align: 'left' })

  doc.moveDown(0.5)
  doc.fontSize(10).fillColor('#64748b').text(`Prepared for: ${data.client?.name ?? 'Homeowner'}`)
  doc.fontSize(10).fillColor('#64748b').text(`Budget range: ${data.project?.budgetRange ?? '—'}`)
  doc.fontSize(10).fillColor('#64748b').text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`)

  doc.moveDown(2)
  drawHRule(doc)

  doc.moveDown(1)
  doc.fontSize(9).fillColor('#94a3b8')
     .text('This generated using AI tools concept package is for planning and discussion purposes only. It is not a substitute for licensed architectural drawings, engineering plans, or permit-ready documents. Always verify zoning, code compliance, and project scope with licensed professionals before construction.', {
       align: 'left',
       width: 495,
     })
}

// ── Page 2: Floor Plan ────────────────────────────────────────────────────────

function drawFloorPlanPage(doc: any, data: HomeownerDeliverables): void {
  sectionHeader(doc, 'Floor Plan Overview')

  const fp = data.floorPlan
  if (!fp) {
    doc.text('Floor plan not available.')
    return
  }

  // Summary stats
  twoCol(doc, 'Total Area:', fp.totalAreaFt2 ? `${Math.round(fp.totalAreaFt2)} sq ft` : '—')
  twoCol(doc, 'Layout:', fp.totalWidthFt && fp.totalDepthFt ? `${Math.round(fp.totalWidthFt)}ft × ${Math.round(fp.totalDepthFt)}ft` : '—')
  twoCol(doc, 'Room Count:', String(fp.rooms?.length ?? 0))

  doc.moveDown(0.5)
  sectionHeader(doc, 'Room Inventory')

  // Table header
  const col = [50, 200, 295, 380, 470]
  doc.fontSize(8).fillColor('#ffffff').font('Helvetica-Bold')
  doc.rect(50, doc.y, 495, 16).fill('#334155')
  const tableHeaderY = doc.y - 16
  doc.fillColor('#ffffff')
     .text('Room', col[0] + 4, tableHeaderY + 4)
     .text('Type', col[1] + 4, tableHeaderY + 4)
     .text('Width (ft)', col[2] + 4, tableHeaderY + 4)
     .text('Depth (ft)', col[3] + 4, tableHeaderY + 4)
     .text('Area (ft²)', col[4] + 4, tableHeaderY + 4)
  doc.moveDown(0.1)

  // Table rows
  let rowIdx = 0
  for (const room of fp.rooms ?? []) {
    if (doc.y > 700) { doc.addPage(); sectionHeader(doc, 'Room Inventory (continued)') }
    const rowY = doc.y
    const bg = rowIdx % 2 === 0 ? '#f8fafc' : '#ffffff'
    doc.rect(50, rowY, 495, 14).fill(bg)
    doc.fontSize(8).fillColor('#0f172a').font('Helvetica')
       .text(safeTruncate(room.label ?? '', 30), col[0] + 4, rowY + 3)
       .text(room.type ?? '', col[1] + 4, rowY + 3)
       .text(String(Math.round(room.widthFt ?? 0)), col[2] + 4, rowY + 3)
       .text(String(Math.round(room.depthFt ?? 0)), col[3] + 4, rowY + 3)
       .text(String(Math.round(room.areaFt2 ?? 0)), col[4] + 4, rowY + 3)
    doc.y = rowY + 14
    rowIdx++
  }

  if (fp.layoutIssues?.length) {
    doc.moveDown(0.5)
    sectionHeader(doc, 'Layout Notes')
    for (const issue of fp.layoutIssues) {
      doc.fontSize(9).fillColor('#b45309').text(`• ${issue}`)
    }
  }
}

// ── Page 3: Design Narrative ──────────────────────────────────────────────────

function drawNarrativePage(doc: any, data: HomeownerDeliverables): void {
  sectionHeader(doc, 'Design Narrative')

  const n = data.narrative
  if (!n) { doc.text('Narrative not yet generated.'); return }

  if (n.projectSummary) {
    doc.fontSize(10).fillColor('#0f172a').font('Helvetica-Bold').text('Project Summary')
    doc.fontSize(9).fillColor('#334155').font('Helvetica').text(n.projectSummary, { width: 495 })
    doc.moveDown(0.5)
  }

  if (n.designIntent) {
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a').text('Design Intent')
    doc.fontSize(9).font('Helvetica').fillColor('#334155').text(n.designIntent, { width: 495 })
    doc.moveDown(0.5)
  }

  if (n.styleNarrative) {
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a').text('Style Direction')
    doc.fontSize(9).font('Helvetica').fillColor('#334155').text(n.styleNarrative, { width: 495 })
    doc.moveDown(0.5)
  }

  if (n.spaceBySpace) {
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a').text('Space-by-Space')
    doc.moveDown(0.25)
    for (const [space, desc] of Object.entries(n.spaceBySpace)) {
      if (doc.y > 700) doc.addPage()
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#475569').text(space.replace(/_/g, ' '))
      doc.fontSize(9).font('Helvetica').fillColor('#334155').text(String(desc), { width: 495 })
      doc.moveDown(0.25)
    }
  }

  if (n.materialDirection) {
    doc.moveDown(0.25)
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a').text('Material Direction')
    doc.fontSize(9).font('Helvetica').fillColor('#334155').text(n.materialDirection, { width: 495 })
  }
}

// ── Page 4: Scope of Work ─────────────────────────────────────────────────────

function drawScopePage(doc: any, data: HomeownerDeliverables): void {
  sectionHeader(doc, 'Scope of Work')

  const scope = data.scope
  if (!scope) { doc.text('Scope not yet generated.'); return }

  if (scope.budgetFitNote) {
    doc.fontSize(9).fillColor('#0369a1').font('Helvetica').text(scope.budgetFitNote, { width: 495 })
    doc.moveDown(0.5)
  }

  // Table header
  const col = [50, 220, 330, 430]
  doc.rect(50, doc.y, 495, 16).fill('#334155')
  const hY = doc.y - 16
  doc.fontSize(8).fillColor('#ffffff').font('Helvetica-Bold')
     .text('Trade / Item', col[0] + 4, hY + 4)
     .text('Description', col[1] + 4, hY + 4)
     .text('Low Est.', col[2] + 4, hY + 4)
     .text('High Est.', col[3] + 4, hY + 4)
  doc.moveDown(0.1)

  let rowIdx = 0
  for (const item of scope.lineItems ?? []) {
    if (doc.y > 700) { doc.addPage(); sectionHeader(doc, 'Scope (continued)') }
    const rowY = doc.y
    const bg = rowIdx % 2 === 0 ? '#f8fafc' : '#ffffff'
    doc.rect(50, rowY, 495, 14).fill(bg)
    doc.fontSize(8).fillColor('#0f172a').font('Helvetica')
       .text(safeTruncate(item.trade ?? '', 25), col[0] + 4, rowY + 3)
       .text(safeTruncate(item.description ?? '', 35), col[1] + 4, rowY + 3)
       .text(item.estimatedLow ?? '—', col[2] + 4, rowY + 3)
       .text(item.estimatedHigh ?? '—', col[3] + 4, rowY + 3)
    doc.y = rowY + 14
    rowIdx++
  }

  if (scope.estimatedTotal) {
    doc.moveDown(0.5)
    doc.fontSize(10).fillColor('#0f172a').font('Helvetica-Bold')
       .text(`Estimated Total Range: ${scope.estimatedTotal}`, { align: 'right' })
  }

  doc.moveDown(0.5)
  doc.fontSize(8).fillColor('#94a3b8').font('Helvetica')
     .text('* Cost estimates are rough ranges for planning purposes only. Get contractor bids before budgeting.', { width: 495 })
}

// ── Page 5: Permit Path ───────────────────────────────────────────────────────

function resolvePermitPathForPdf(data: HomeownerDeliverables): HomeownerDeliverables['permitPath'] {
  if (data.permitPath) return data.permitPath
  const p = data.permit
  if (!p) return undefined
  const [low, high] = p.estimatedCostRange ?? [500, 3500]
  return {
    requiresPermit: p.requiresPermit,
    likelyPermits: p.likelyPermits,
    estimatedTimeline: p.estimatedTimeline,
    estimatedCost: `$${low.toLocaleString()}–$${high.toLocaleString()}`,
    permits: p.likelyPermits,
    tradeLicenses: p.likelyTradePermits,
    structuralReviewRequired: p.keyConsiderations.some((c) => /structural|PE|engineer/i.test(c)),
    designReviewRequired: false,
    notes: [...p.keyConsiderations, p.disclaimer].filter(Boolean),
    disclaimer: p.disclaimer,
  }
}

function drawPermitPage(doc: any, data: HomeownerDeliverables): void {
  sectionHeader(doc, 'Permit Path & Zoning')

  const permit = resolvePermitPathForPdf(data)
  if (!permit) { doc.text('Permit information not yet generated.'); return }

  twoCol(doc, 'Estimated cost:', permit.estimatedCost ?? '—')
  twoCol(doc, 'Estimated timeline:', permit.estimatedTimeline ?? '—')
  twoCol(doc, 'Design review required:', permit.designReviewRequired ? 'Yes' : 'No')
  twoCol(doc, 'Structural review required:', permit.structuralReviewRequired ? 'Yes' : 'No')

  doc.moveDown(0.5)
  doc.fontSize(10).fillColor('#0f172a').font('Helvetica-Bold').text('Permits Required')
  doc.moveDown(0.15)
  for (const p of permit.permits ?? []) {
    doc.fontSize(9).fillColor('#334155').font('Helvetica').text(`• ${p}`)
  }

  if (permit.tradeLicenses?.length) {
    doc.moveDown(0.5)
    doc.fontSize(10).fillColor('#0f172a').font('Helvetica-Bold').text('Trade Licenses Needed')
    for (const t of permit.tradeLicenses) {
      doc.fontSize(9).fillColor('#334155').font('Helvetica').text(`• ${t}`)
    }
  }

  if (permit.notes?.length) {
    doc.moveDown(0.5)
    sectionHeader(doc, 'Permit Notes')
    for (const note of permit.notes) {
      doc.fontSize(9).fillColor('#334155').text(`• ${note}`)
    }
  }

  doc.moveDown(1)
  doc.fontSize(8).fillColor('#94a3b8').font('Helvetica')
     .text('Permit requirements vary by jurisdiction. Always confirm with your local building department.', { width: 495 })
}

// ── Page 6: Visual Direction ──────────────────────────────────────────────────

// ── Purchaser sections (docs/system/concept-package-deliverables.md) ────────

function drawYourProjectPage(doc: any, data: HomeownerDeliverables): void {
  sectionWithStamp(doc, '1. Your project — goals, property and budget', ['EXISTING'])
  twoCol(doc, 'Property:', data.client.address || data.project.address || '—')
  twoCol(doc, 'Project:', data.project.path.replace(/_/g, ' '))
  twoCol(doc, 'Budget comfort:', data.project.budgetRange || '—')
  if (data.project.timeline) twoCol(doc, 'Timeline:', data.project.timeline)
  if (data.project.stylePreferences.length) twoCol(doc, 'Style preferences:', data.project.stylePreferences.join(', '))
  doc.moveDown(0.5)
  doc.fontSize(10).fillColor('#0f172a').font('Helvetica-Bold').text('Your goals, in your words')
  doc.moveDown(0.2); doc.fontSize(9.5).fillColor('#334155').font('Helvetica')
  for (const g of data.project.goals.length ? data.project.goals : ['(not stated at intake)']) doc.text(`• ${safeTruncate(g, 600)}`, { width: 495 })
  if (data.project.knownConstraints.length) {
    doc.moveDown(0.4); doc.fontSize(10).fillColor('#0f172a').font('Helvetica-Bold').text('What must stay / what must change')
    doc.moveDown(0.2); doc.fontSize(9.5).fillColor('#334155').font('Helvetica')
    for (const c of data.project.knownConstraints) doc.text(`• ${safeTruncate(c, 400)}`, { width: 495 })
  }
}

function drawExistingPage(doc: any, data: HomeownerDeliverables, assets: PdfVisualAsset[]): void {
  sectionWithStamp(doc, '2. What exists today — photographs and existing conditions', ['EXISTING'])
  const ex = data.existingConditions
  doc.fontSize(9.5).fillColor('#334155').font('Helvetica').text(ex?.summary ?? 'Existing conditions as photographed by the customer.', { width: 495 })
  if (ex?.problems?.length) { doc.moveDown(0.3); doc.font('Helvetica-Bold').fillColor('#0f172a').text('Problems to solve'); doc.font('Helvetica').fillColor('#334155'); for (const p of ex.problems) doc.text(`• ${safeTruncate(p, 300)}`, { width: 495 }) }
  if (ex?.mustStay?.length) { doc.moveDown(0.3); doc.font('Helvetica-Bold').fillColor('#0f172a').text('Must stay'); doc.font('Helvetica').fillColor('#334155'); for (const p of ex.mustStay) doc.text(`• ${safeTruncate(p, 300)}`, { width: 495 }) }
  const photos = assets.filter(a => a.label.startsWith('Existing'))
  if (!photos.length) { doc.moveDown(0.4); doc.fillColor('#b45309').text('No photographs were supplied at intake. Before/after views (section 7) cannot be matched to a viewpoint until they are.') }
  for (const asset of photos) {
    if (doc.y > 430) { doc.addPage(); sectionWithStamp(doc, '2. What exists today (continued)', ['EXISTING']) }
    doc.fontSize(10).fillColor('#0f172a').font('Helvetica-Bold').text(asset.label); doc.moveDown(0.25)
    const y = doc.y; doc.image(asset.buffer, 50, y, { fit: [495, 240], align: 'center', valign: 'center' }); doc.y = y + 250; doc.moveDown(0.3)
  }
}

function drawDirectionsPage(doc: any, data: HomeownerDeliverables): void {
  sectionWithStamp(doc, '3. Concept directions — clear alternatives', ['PROPOSED CONCEPT'])
  const dirs = data.conceptDirections ?? []
  if (!dirs.length) { doc.text('One direction was developed for this package; see the recommended design.'); return }
  dirs.forEach((d, i) => {
    if (doc.y > 640) doc.addPage()
    doc.fontSize(11).fillColor('#0f172a').font('Helvetica-Bold').text(`${String.fromCharCode(65 + i)}. ${d.name}${d.recommended ? '   ★ recommended' : ''}`)
    doc.fontSize(9.5).fillColor('#334155').font('Helvetica').text(safeTruncate(d.description, 700), { width: 495 })
    twoCol(doc, 'Fit to your preferences:', `${d.styleMatch}/100`)
    twoCol(doc, 'Indicative cost:', d.estimatedCost ? `$${Math.round(d.estimatedCost * 0.85).toLocaleString()} – $${Math.round(d.estimatedCost * 1.15).toLocaleString()}` : '—')
    if (d.keyFeatures.length) twoCol(doc, 'What sets it apart:', d.keyFeatures.slice(0, 4).join('; '))
    if (d.materials.length) twoCol(doc, 'Materials:', d.materials.slice(0, 6).join(', '))
    doc.moveDown(0.5)
  })
}

function drawRecommendedPage(doc: any, data: HomeownerDeliverables): void {
  sectionWithStamp(doc, '4. Recommended design — and why', ['PROPOSED CONCEPT'])
  const r = data.recommendation
  doc.fontSize(12).fillColor('#0f172a').font('Helvetica-Bold').text(r?.conceptName ?? data.narrative.styleNarrative)
  doc.moveDown(0.3); doc.fontSize(9.5).fillColor('#334155').font('Helvetica')
  for (const line of r?.rationale?.length ? r.rationale : [data.narrative.designIntent || data.narrative.projectSummary]) doc.text(`• ${safeTruncate(line, 500)}`, { width: 495 })
  doc.moveDown(0.4)
  twoCol(doc, 'Cost range:', r ? `$${r.costRange[0].toLocaleString()} – $${r.costRange[1].toLocaleString()}` : data.scope.estimatedTotal ?? '—')
  twoCol(doc, 'Next step:', r?.nextStep ?? data.narrative.nextSteps)
  if (data.narrative.lifestyleAlignment) { doc.moveDown(0.3); doc.text(data.narrative.lifestyleAlignment, { width: 495 }) }
}

function drawViewsPage(doc: any, data: HomeownerDeliverables, assets: PdfVisualAsset[]): void {
  sectionWithStamp(doc, '6. Exterior and interior views — coordinated with the plan', ['PROPOSED CONCEPT'])
  const views = assets.filter(a => a.label.startsWith('Design concept'))
  if (!views.length) { doc.text('Concept views are rendered after the recommended direction is confirmed.'); return }
  for (const asset of views) {
    if (doc.y > 430) { doc.addPage(); sectionWithStamp(doc, '6. Views (continued)', ['PROPOSED CONCEPT']) }
    doc.fontSize(10).fillColor('#0f172a').font('Helvetica-Bold').text(`${asset.label} — coordinated with the concept floor plan`); doc.moveDown(0.25)
    const y = doc.y; doc.image(asset.buffer, 50, y, { fit: [495, 260], align: 'center', valign: 'center' }); doc.y = y + 270; doc.moveDown(0.3)
  }
  if (data.visuals?.consistencyNotes?.length) { doc.moveDown(0.2); doc.fontSize(9).fillColor('#334155'); for (const n of data.visuals.consistencyNotes) doc.text(`• ${n}`) }
}

function drawBeforeAfterPage(doc: any, data: HomeownerDeliverables, assets: PdfVisualAsset[]): void {
  sectionWithStamp(doc, '7. Before and after — matching viewpoint and geometry', ['EXISTING', 'PROPOSED CONCEPT'])
  const byUrl = (url: string) => assets.find(a => a.url === url)
  // Only pairs rendered from the customer's photograph with the camera locked to it
  // (form_data.conceptOutput.beforeAfterPairs) qualify — never two unrelated images.
  const pairs = (data.beforeAfterPairs ?? [])
    .map(p => ({ before: byUrl(p.beforeUrl), after: byUrl(p.afterUrl), caption: `${p.area ? `${p.area}: ` : ''}${p.label}${p.viewpoint ? ` — viewpoint: ${p.viewpoint}` : ''}` }))
    .filter((p): p is { before: PdfVisualAsset; after: PdfVisualAsset; caption: string } => Boolean(p.before && p.after))
  const hasExisting = assets.some(a => a.label.startsWith('Existing'))
  if (!pairs.length) { doc.fontSize(9.5).fillColor('#b45309').text(hasExisting ? 'Concept views rendered from your photographs\u2019 viewpoints are still in progress; this page is completed when they resolve.' : 'No labelled photograph was supplied to pair with a concept view. Add photographs with a label and viewpoint in your portal and the before/after pairs are rendered from the same viewpoint.', { width: 495 }); return }
  for (const p of pairs) {
    if (doc.y > 520) doc.addPage()
    const y = doc.y
    doc.fontSize(9).fillColor('#475569').font('Helvetica-Bold').text('BEFORE — EXISTING', 50, y, { width: 240 })
    doc.fontSize(9).fillColor('#0f766e').font('Helvetica-Bold').text('AFTER — PROPOSED CONCEPT', 305, y, { width: 240 })
    doc.image(p.before.buffer, 50, y + 14, { fit: [240, 180] }); doc.image(p.after.buffer, 305, y + 14, { fit: [240, 180] })
    doc.y = y + 200; doc.fontSize(8).fillColor('#64748b').font('Helvetica').text(`${p.caption}. The after view was rendered from this photograph with the camera locked to it; a pair that does not match is flagged at review.`, 50, doc.y, { width: 495 })
    doc.x = 50; doc.moveDown(0.6)
  }
}

function drawPalettePage(doc: any, data: HomeownerDeliverables): void {
  sectionWithStamp(doc, '8. Materials palette — labeled selections', ['PROPOSED CONCEPT'])
  const items = data.materialsPalette ?? []
  if (!items.length) { doc.text(data.narrative.materialDirection || 'Material selections follow confirmation of the recommended direction.', { width: 495 }); return }
  for (const it of items) { twoCol(doc, `${it.item}:`, it.selection + (it.note ? ` — ${it.note}` : '')) }
  if (data.visuals?.paletteSuggestion) { doc.moveDown(0.3); twoCol(doc, 'Palette:', data.visuals.paletteSuggestion) }
}

function drawSiteZoningPage(doc: any, data: HomeownerDeliverables): void {
  sectionWithStamp(doc, '9. Site and zoning snapshot — sources and confidence', ['REQUIRES VERIFICATION'])
  const sz = data.siteZoning
  if (!sz) { drawPermitPage(doc, data); return }
  doc.fontSize(8).fillColor('#64748b').font('Helvetica-Bold')
  const cols = [50, 160, 320, 430, 490]
  const y0 = doc.y
  ;['Claim', 'Value', 'Source', 'Confidence', 'Status'].forEach((h, i) => doc.text(h, cols[i], y0, { width: (cols[i + 1] ?? 545) - cols[i] - 4, lineBreak: false }))
  doc.y = y0 + 12; drawHRule(doc); doc.moveDown(0.2)
  for (const c of sz.claims) {
    if (doc.y > 700) doc.addPage()
    const y = doc.y
    doc.fontSize(8.5).fillColor('#0f172a').font('Helvetica').text(c.claim, cols[0], y, { width: 106 })
    const h1 = doc.y
    doc.text(safeTruncate(c.value, 160), cols[1], y, { width: 156 }); const h2 = doc.y
    doc.text(safeTruncate(c.source, 90), cols[2], y, { width: 106 }); const h3 = doc.y
    doc.text(c.confidence, cols[3], y, { width: 56 })
    doc.fillColor(c.status === 'existing' ? '#475569' : c.status === 'proposed' ? '#0f766e' : '#b45309').text(c.status.replace('-', ' '), cols[4], y, { width: 55 })
    doc.y = Math.max(h1, h2, h3, y + 12) + 3
  }
  doc.moveDown(0.4); doc.fontSize(8.5).fillColor('#475569').font('Helvetica').text(sz.disclaimer, 50, doc.y, { width: 495 })
  doc.x = 50; doc.moveDown(0.6)
  drawPermitPage(doc, data)
}

// ── Page 7: Next Steps ────────────────────────────────────────────────────────

function drawNextStepsPage(doc: any, data: HomeownerDeliverables): void {
  sectionHeader(doc, 'Next Steps')

  const nextStepsObj = data.nextSteps as any
  const steps: string[] = Array.isArray(nextStepsObj)
    ? nextStepsObj
    : (nextStepsObj?.actionItems ?? [])
  for (const step of steps) {
    doc.fontSize(10).fillColor('#0f172a').font('Helvetica')
       .text(`→  ${step}`, { width: 495 })
    doc.moveDown(0.3)
  }

  doc.moveDown(1)
  drawHRule(doc)
  doc.moveDown(0.5)

  doc.fontSize(10).fillColor('#0f172a').font('Helvetica-Bold').text('Ready to take the next step?')
  doc.moveDown(0.25)
  doc.fontSize(9).fillColor('#334155').font('Helvetica')
     .text('Kealee can connect you with licensed architects, permit expeditors, and verified contractors to bring this concept to life.')
  doc.moveDown(0.5)
  doc.fontSize(9).fillColor('#0ea5e9').text('Visit kealee.com or contact your Kealee advisor to get started.')

  doc.moveDown(2)
  drawHRule(doc)
  doc.moveDown(0.5)
  doc.fontSize(7).fillColor('#94a3b8')
     .text('© Kealee Inc. This document is confidential and intended for the named client only. Not for distribution. All cost estimates are approximate and for planning purposes only.', { width: 495, align: 'center' })
}

// ── Main Render Function ──────────────────────────────────────────────────────

export async function renderConceptPdf(input: ConceptPdfInput): Promise<ConceptPdfResult> {
  // Dynamic import — pdfkit lives in the worker, not in this package
  const PDFDocument = (await import('pdfkit' as any)).default ?? (await import('pdfkit' as any))

  const visuals = input.homeownerDeliverables.visuals
  const existingPhotos = (input.homeownerDeliverables.existingConditions?.photos ?? []).filter(p => p.kind === 'photo')
  const visualSources = [
    // Existing: the customer's own photographs (labelled, with viewpoint when given), else the legacy before-URLs
    ...(existingPhotos.length
      ? existingPhotos.map(p => ({ label: `Existing — ${p.area ? `${p.area}: ` : ''}${p.label}${p.viewpoint ? ` (viewpoint: ${p.viewpoint})` : ''}`, url: p.url }))
      : (visuals?.stableDiffusionPrompts ?? []).filter(value => /^https?:\/\//i.test(value)).map(url => ({ label: 'Existing condition — customer source', url }))),
    ...(visuals?.midjourneyPrompts ?? []).filter(value => /^https?:\/\//i.test(value)).map((url, index) => ({ label: `Design concept ${index + 1}`, url })),
  ].slice(0, 12)
  // Before/after pairs load by URL so a pair is never drawn from two unrelated images
  for (const pair of input.homeownerDeliverables.beforeAfterPairs ?? []) {
    for (const url of [pair.beforeUrl, pair.afterUrl]) {
      if (!visualSources.some(s => s.url === url)) visualSources.push({ label: url === pair.beforeUrl ? `Existing — ${pair.label}` : `Design concept — ${pair.label}`, url })
    }
  }
  const loadedVisualAssets = await Promise.all(visualSources.map(async source => {
    try {
      const response = await fetch(source.url)
      const contentType = response.headers.get('content-type') ?? ''
      if (!response.ok || !contentType.toLowerCase().startsWith('image/')) return null
      return { label: source.label, url: source.url, buffer: Buffer.from(await response.arrayBuffer()) }
    } catch {
      return null
    }
  }))
  const visualAssets: PdfVisualAsset[] = loadedVisualAssets.filter(
    (asset): asset is NonNullable<typeof asset> => asset !== null,
  )

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 50,
      size: 'LETTER',
      info: {
        Title: 'Kealee Concept Package',
        Author: 'Kealee Inc.',
        Subject: 'generated using AI tools concept design package',
      },
    })

    const chunks: Buffer[] = []
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const d = input.homeownerDeliverables
    doc.on('pageAdded', () => standingFooter(doc, d))

    // The purchaser order (docs/system/concept-package-deliverables.md):
    //  cover · 1 your project · 2 what exists today · 3 concept directions · 4 recommended design
    //  · 5 concept floor plan · 6 views · 7 before/after · 8 materials palette · 9 site & zoning
    //  · scope & cost · next steps. Every page carries the preliminary footer.
    drawCoverPage(doc, d); standingFooter(doc, d)
    doc.addPage(); drawYourProjectPage(doc, d)
    doc.addPage(); drawExistingPage(doc, d, visualAssets)
    doc.addPage(); drawDirectionsPage(doc, d)
    doc.addPage(); drawRecommendedPage(doc, d)
    doc.addPage(); sectionWithStamp(doc, '5. Concept floor plan — labeled and dimensioned', ['PROPOSED CONCEPT']); drawFloorPlanPage(doc, d)
    doc.addPage(); drawViewsPage(doc, d, visualAssets)
    doc.addPage(); drawBeforeAfterPage(doc, d, visualAssets)
    doc.addPage(); drawPalettePage(doc, d)
    doc.addPage(); drawSiteZoningPage(doc, d)
    doc.addPage(); sectionWithStamp(doc, 'Scope and cost range', ['PROPOSED CONCEPT', 'REQUIRES VERIFICATION']); drawScopePage(doc, d)
    doc.addPage(); drawNarrativePage(doc, d)
    doc.addPage(); drawNextStepsPage(doc, d)

    doc.end()
  })
}
