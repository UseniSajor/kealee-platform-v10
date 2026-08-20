/**
 * Shapes one intake row into the customer-facing order view.
 *
 * Every AI-derived field carried here is accompanied by its assumptions,
 * sources, confidence, and review status — a customer must never see a
 * generated number without knowing what it rests on.
 */

import { SERVICE_DELIVERABLES } from '@/lib/service-deliverables'
import { COVERAGE_LABELS, type CoverageLevel } from '@/lib/site-intelligence/authoritative-gis'
import type { OrderRecord } from '@/lib/order-access'
import { buildOrderChecklist, type OrderChecklistItem } from '@/lib/intake-checklist'

export { buildOrderChecklist }
export type { OrderChecklistItem }

export interface OrderDeliverableFile {
  label: string
  url: string
  kind: 'render' | 'document' | 'video' | 'cad' | 'other'
}

export interface OrderView {
  intakeId: string
  productKey: string
  productLabel: string
  clientName: string | null
  projectAddress: string | null
  createdAt: string | null
  paidAt: string | null
  deliveryDays: string | null
  /** Human-review posture for this order. */
  review: {
    required: boolean
    status: 'not_started' | 'in_review' | 'complete'
    note: string
  }
  jurisdiction: {
    state: string | null
    county: string | null
    city: string | null
    coverage: CoverageLevel | null
    coverageLabel: string | null
    confidence: number | null
    sources: { authority: string; dataset: string; retrievedAt: string }[]
    itemsRequiringConfirmation: string[]
  } | null
  checklist: OrderChecklistItem[]
  missingCount: number
  deliverables: OrderDeliverableFile[]
  /** Structured report rendered inline when there is no downloadable file. */
  report: {
    title: string
    readinessStatus?: string
    observations: string[]
    nextActions: string[]
  } | null
  nextStep: { label: string; href: string } | null
  disclaimers: string[]
}

const PRELIMINARY_DISCLAIMER =
  'This package is preliminary. It does not replace licensed architectural, engineering, or surveying services, and it is not a jurisdiction approval.'

const CATEGORY_DISCLAIMERS: Record<string, string> = {
  permit:
    'Kealee prepares, coordinates, and assists with permit filing. Only the jurisdiction issues a permit — approval, fees, and timelines are set by that agency.',
  estimate:
    'An estimate is a priced opinion based on the stated scope and assumptions. It is not a bid, a contract price, or a guarantee of construction cost.',
  development:
    'Site findings are preliminary and not for construction unless professionally reviewed. They are not a boundary survey.',
  design:
    'Concepts are preliminary design direction. They are not construction documents and do not replace licensed architectural or engineering services.',
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function collectDeliverables(formData: Record<string, unknown>): OrderDeliverableFile[] {
  const files: OrderDeliverableFile[] = []
  const seen = new Set<string>()

  const push = (label: string, url: unknown, kind: OrderDeliverableFile['kind']) => {
    if (typeof url !== 'string' || !url.startsWith('http')) return
    if (seen.has(url)) return
    seen.add(url)
    files.push({ label, url, kind })
  }

  const concept = asRecord(formData.v30ConceptOutput ?? formData.conceptOutput)
  const renders = concept.renders ?? concept.renderUrls ?? formData.renderUrls
  if (Array.isArray(renders)) {
    renders.forEach((entry, index) => {
      const url = typeof entry === 'string' ? entry : asRecord(entry).url
      push(`Concept render ${index + 1}`, url, 'render')
    })
  }

  push('Concept package (PDF)', concept.pdfUrl ?? formData.conceptPdfUrl, 'document')
  push('Cost estimate (PDF)', formData.estimatePdfUrl, 'document')
  push('Permit package (PDF)', formData.permitPackageUrl, 'document')
  push('Site plan (PDF)', formData.sitePlanPdfUrl, 'document')
  push('Concept video', concept.videoUrl ?? formData.conceptVideoUrl, 'video')

  const floorplan = asRecord(formData.v30FloorplanDeliverables)
  push('Floor plan (PDF)', floorplan.pdfUrl, 'document')
  push('CAD file (DXF)', floorplan.dxfUrl ?? formData.cadDxfUrl, 'cad')

  return files
}

/**
 * Some deliverables are structured records rather than files — the free
 * Project Clarity Report is the first. Render them inline so a delivered order
 * never shows an empty downloads list.
 */
function buildInlineReport(formData: Record<string, unknown>): OrderView['report'] {
  const report = asRecord(formData.projectClarityReport)
  if (!report.title) return null
  return {
    title: String(report.title),
    readinessStatus:
      typeof report.readinessStatus === 'string' ? report.readinessStatus : undefined,
    observations: Array.isArray(report.observations) ? (report.observations as string[]) : [],
    nextActions: Array.isArray(report.nextActions) ? (report.nextActions as string[]) : [],
  }
}

export function buildOrderView(order: OrderRecord): OrderView {
  const formData = order.form_data ?? {}
  const deliverable = SERVICE_DELIVERABLES[order.project_path]
  const siteIntelligence = asRecord(formData.siteIntelligence)
  const checklist = buildOrderChecklist(order.project_path, formData, order)

  const requiresReview =
    Boolean(siteIntelligence.requiresProfessionalVerification) ||
    deliverable?.category === 'development' ||
    deliverable?.category === 'permit' ||
    order.project_path === 'certified_estimate'

  const reviewComplete = formData.professionalReviewCompletedAt != null
  const reviewInProgress =
    formData.orderStatus === 'needs_professional_review' || formData.orderStatus === 'in_review'

  const coverage = typeof siteIntelligence.coverage === 'string'
    ? (siteIntelligence.coverage as CoverageLevel)
    : null

  const jurisdictionRecord = asRecord(siteIntelligence.jurisdiction)
  const sources = Array.isArray(siteIntelligence.dataSources)
    ? (siteIntelligence.dataSources as Record<string, unknown>[]).map(source => ({
        authority: String(source.authority ?? 'Unknown source'),
        dataset: String(source.dataset ?? ''),
        retrievedAt: String(source.retrievedAt ?? ''),
      }))
    : []

  const disclaimers = [PRELIMINARY_DISCLAIMER]
  const categoryDisclaimer = deliverable?.category
    ? CATEGORY_DISCLAIMERS[deliverable.category]
    : undefined
  if (categoryDisclaimer) disclaimers.push(categoryDisclaimer)

  return {
    intakeId: order.id,
    productKey: order.project_path,
    productLabel: deliverable?.label ?? order.project_path.replace(/_/g, ' '),
    clientName: order.client_name,
    projectAddress: order.project_address,
    createdAt: order.created_at,
    paidAt: order.paid_at,
    deliveryDays: deliverable?.deliveryDays ?? null,
    review: {
      required: requiresReview,
      status: reviewComplete ? 'complete' : reviewInProgress ? 'in_review' : 'not_started',
      note: requiresReview
        ? 'A qualified Kealee reviewer checks this deliverable before it is treated as final.'
        : 'This deliverable is generated and released without a separate professional review. Treat it as preliminary.',
    },
    jurisdiction: Object.keys(siteIntelligence).length
      ? {
          state: (jurisdictionRecord.state as string) ?? null,
          county: (jurisdictionRecord.county as string) ?? null,
          city: (jurisdictionRecord.city as string) ?? null,
          coverage,
          coverageLabel: coverage ? COVERAGE_LABELS[coverage] : null,
          confidence:
            typeof siteIntelligence.confidence === 'number' ? siteIntelligence.confidence : null,
          sources,
          itemsRequiringConfirmation: Array.isArray(siteIntelligence.itemsRequiringConfirmation)
            ? (siteIntelligence.itemsRequiringConfirmation as string[])
            : [],
        }
      : null,
    checklist,
    missingCount: checklist.filter(item => item.state === 'missing').length,
    deliverables: collectDeliverables(formData),
    report: buildInlineReport(formData),
    nextStep: deliverable?.nextStep ?? null,
    disclaimers,
  }
}
