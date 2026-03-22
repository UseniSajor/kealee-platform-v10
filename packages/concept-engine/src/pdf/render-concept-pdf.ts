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

// ── Page 1: Cover ─────────────────────────────────────────────────────────────

function drawCoverPage(doc: any, data: HomeownerDeliverables): void {
  doc.fontSize(28).fillColor('#0f172a').font('Helvetica-Bold')
     .text('Kealee', 50, 80)
  doc.fontSize(11).fillColor('#64748b').font('Helvetica')
     .text('AI Concept Package', 50, 116)

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
     .text('This AI-generated concept package is for planning and discussion purposes only. It is not a substitute for licensed architectural drawings, engineering plans, or permit-ready documents. Always verify zoning, code compliance, and project scope with licensed professionals before construction.', {
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

function drawPermitPage(doc: any, data: HomeownerDeliverables): void {
  sectionHeader(doc, 'Permit Path')

  const permit = data.permitPath
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

function drawVisualsPage(doc: any, data: HomeownerDeliverables): void {
  sectionHeader(doc, 'Visual Direction')

  const visuals = data.visuals
  if (!visuals) { doc.text('Visual prompts not yet generated.'); return }

  if (visuals.styleKeywords?.length) {
    twoCol(doc, 'Style keywords:', visuals.styleKeywords.join(', '))
  }
  if (visuals.materialKeywords?.length) {
    twoCol(doc, 'Material keywords:', visuals.materialKeywords.join(', '))
  }
  if (visuals.paletteSuggestion) {
    twoCol(doc, 'Palette:', visuals.paletteSuggestion)
  }
  if (visuals.lightingDirection) {
    twoCol(doc, 'Lighting:', visuals.lightingDirection)
  }
  if (visuals.cameraGuidance) {
    twoCol(doc, 'Camera guidance:', visuals.cameraGuidance)
  }

  if (visuals.midjourneyPrompts?.length) {
    doc.moveDown(0.5)
    doc.fontSize(10).fillColor('#0f172a').font('Helvetica-Bold').text('AI Visual Prompts (Midjourney)')
    doc.moveDown(0.25)
    for (const prompt of visuals.midjourneyPrompts.slice(0, 4)) {
      if (doc.y > 680) break
      doc.rect(50, doc.y, 495, 1).fill('#e2e8f0')
      doc.moveDown(0.15)
      doc.fontSize(8).fillColor('#475569').font('Helvetica').text(safeTruncate(prompt, 280), { width: 495 })
      doc.moveDown(0.25)
    }
  }

  if (visuals.consistencyNotes?.length) {
    doc.moveDown(0.25)
    sectionHeader(doc, 'Consistency Notes')
    for (const note of visuals.consistencyNotes) {
      doc.fontSize(9).fillColor('#334155').text(`• ${note}`)
    }
  }
}

// ── Page 7: Next Steps ────────────────────────────────────────────────────────

function drawNextStepsPage(doc: any, data: HomeownerDeliverables): void {
  sectionHeader(doc, 'Next Steps')

  const steps = data.nextSteps ?? []
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

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 50,
      size: 'LETTER',
      info: {
        Title: 'Kealee AI Concept Package',
        Author: 'Kealee Inc.',
        Subject: 'AI-generated concept design package',
      },
    })

    const chunks: Buffer[] = []
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const d = input.homeownerDeliverables

    // Page 1: Cover
    drawCoverPage(doc, d)

    // Page 2: Floor Plan
    doc.addPage()
    drawFloorPlanPage(doc, d)

    // Page 3: Narrative
    doc.addPage()
    drawNarrativePage(doc, d)

    // Page 4: Scope
    doc.addPage()
    drawScopePage(doc, d)

    // Page 5: Permit
    doc.addPage()
    drawPermitPage(doc, d)

    // Page 6: Visuals
    doc.addPage()
    drawVisualsPage(doc, d)

    // Page 7: Next Steps
    doc.addPage()
    drawNextStepsPage(doc, d)

    doc.end()
  })
}
