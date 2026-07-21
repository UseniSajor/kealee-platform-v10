/**
 * services/api/src/modules/rag/document-processor.ts
 *
 * Prepares raw DB records into RagDocument ingest payloads.
 * Supports: permits, estimates, concept reports, jurisdiction guides, projects.
 */

import { prismaAny } from '../../utils/prisma-helper.js'

// Inline types — avoids runtime dependency on @kealee/ai which is not installed here
type RagDocumentType =
  | 'PROJECT_DESCRIPTION'
  | 'PERMIT_APPLICATION'
  | 'ESTIMATE'
  | 'INSPECTION_REPORT'
  | 'JURISDICTION_GUIDE'
  | 'SERVICE_CATALOG'
  | 'CONCEPT_REPORT'
  | 'ZONING_DATA'
  | 'CONTRACTOR_PROFILE'
  | 'PHASE_NOTE'

interface IngestOptions {
  sourceType: RagDocumentType
  sourceId: string
  title: string
  content: string
  jurisdiction?: string
  serviceType?: string
  phase?: string
  projectId?: string
  chunkSize?: number
  chunkOverlap?: number
}

// ── Jurisdiction Guide text — built-in knowledge ──────────────────────────────

const JURISDICTION_GUIDES: Record<string, string> = {
  'dc': `District of Columbia (DC) Permit Guide:
Department of Buildings (DOB) — online permit portal dcra.dc.gov.
Residential building permit: typically 6–10 weeks for plan review.
Historic District: add 4–6 weeks for HPRB review.
Structural/Addition over 500 SF: require PE stamped drawings.
ADU: allowed by right in most zones under DC Zoning Regs. Title 11.
Over-the-counter permits available for minor work under $5,000.
Contact: 1100 4th St SW, Washington DC 20024.`,

  'montgomery-county': `Montgomery County MD Permit Guide:
Department of Permitting Services (DPS) — online: permittingservices.montgomerycountymd.gov.
Residential addition/alteration: 4–8 weeks review. Commercial: 8–16 weeks.
Requires licensed contractor for work over $5,000.
Historic Preservation: add 3–5 weeks for HPO review in historic districts.
Express permit available for simple repairs under $5,000.
Stormwater management plan required for impervious area > 5,000 SF.
Contact: 2425 Reedie Dr, Wheaton MD 20902.`,

  'fairfax-county': `Fairfax County VA Permit Guide:
Land Development Services (LDS) — online: fairfaxcounty.gov/permits.
Simple residential: 2–4 weeks. Complex/addition: 5–10 weeks.
Zoning approval required before building permit for additions/ADUs.
Footing/framing inspections must be scheduled 48 hours in advance.
VA licensed contractor required for work exceeding $1,000.
Storm drain review required for parcels > 2,500 SF impervious.
Contact: 12055 Government Center Pkwy, Fairfax VA 22035.`,

  'arlington': `Arlington County VA Permit Guide:
Department of Community Planning, Housing and Development (CPHD).
Online portal: permits.arlingtonva.us.
Residential alteration: 3–7 weeks. WMATA proximity adds 1–2 weeks.
ADU: allowed by right in R-5 and R-6 zones. Deed restriction required.
Green Building threshold: LEED Silver required for commercial > 25,000 SF.
Contact: 2100 Clarendon Blvd, Arlington VA 22201.`,

  'prince-georges-county': `Prince George's County MD Permit Guide:
Department of Permitting, Inspections and Enforcement (DPIE).
Online: pgcountymd.gov/departments/dpie.
Residential permit: 4–10 weeks. Commercial: 8–16 weeks.
Special inspection required for structural work over $100,000.
Chesapeake Bay Critical Area: additional environmental review within 1,000 ft of tidal water.
Contact: 9400 Peppercorn Place, Largo MD 20774.`,

  'alexandria-city': `Alexandria City VA Permit Guide:
Planning and Zoning + Building and Fire Code Services.
Online: alexandriava.gov/permits.
Simple residential: 4–8 weeks. Historic District (Old Town): add 4–6 weeks.
Design Review Board approval required for exterior changes in historic zones.
Contact: 301 King St, Alexandria VA 22314.`,

  'howard-county': `Howard County MD Permit Guide:
Department of Planning and Zoning (DPZ) — permits.howardcountymd.gov.
Residential permit: 4–8 weeks. Commercial: 10–14 weeks.
Forest Conservation Plan required for disturbance > 40,000 SF.
SFR addition under 400 SF eligible for express review (2–3 weeks).
Contact: 3430 Court House Dr, Ellicott City MD 21043.`,
}

// ── Processors ────────────────────────────────────────────────────────────────

export async function processPermitLeads(): Promise<IngestOptions[]> {
  const leads: any[] = await prismaAny.$queryRawUnsafe(`
    SELECT id, "fullName", email, "contractorType", jurisdictions, message, status, "createdAt"
    FROM permit_service_leads
    WHERE status IN ('NEW', 'PAID', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED')
    ORDER BY "createdAt" DESC
    LIMIT 500
  `)

  return leads.map((lead: any) => ({
    sourceType: 'PERMIT_APPLICATION' as const,
    sourceId: lead.id,
    title: `Permit Application — ${lead.fullName ?? lead.email}`,
    content: [
      `Applicant: ${lead.fullName ?? 'Unknown'}`,
      `Email: ${lead.email}`,
      `Project Type: ${lead.contractorType ?? 'Not specified'}`,
      `Jurisdictions: ${Array.isArray(lead.jurisdictions) ? lead.jurisdictions.join(', ') : lead.jurisdictions}`,
      `Status: ${lead.status}`,
      `Details: ${lead.message ?? 'No additional details'}`,
      `Submitted: ${lead.createdAt}`,
    ].join('\n'),
    jurisdiction: Array.isArray(lead.jurisdictions) ? lead.jurisdictions[0] : undefined,
    serviceType: 'permit',
  }))
}

export async function processPublicIntakes(): Promise<IngestOptions[]> {
  const intakes: any[] = await prismaAny.$queryRawUnsafe(`
    SELECT id, "clientName", "contactEmail", "projectAddress", "projectPath",
           "budgetRange", "timelineGoal", "leadTier", "leadScore", "status"
    FROM public_intake_leads
    WHERE status IN ('new', 'checkout_complete', 'processing')
    ORDER BY "createdAt" DESC
    LIMIT 500
  `).catch(() => [])

  return intakes.map((intake: any) => ({
    sourceType: 'PROJECT_DESCRIPTION' as const,
    sourceId: intake.id,
    title: `Intake — ${intake.projectPath} — ${intake.clientName ?? intake.contactEmail}`,
    content: [
      `Client: ${intake.clientName ?? 'Unknown'}`,
      `Project Path: ${intake.projectPath}`,
      `Address: ${intake.projectAddress}`,
      `Budget: ${intake.budgetRange ?? 'Not specified'}`,
      `Timeline: ${intake.timelineGoal ?? 'Not specified'}`,
      `Lead Tier: ${intake.leadTier} (score: ${intake.leadScore})`,
      `Status: ${intake.status}`,
    ].join('\n'),
    serviceType: intake.projectPath?.includes('permit') ? 'permit' : 'concept',
  }))
}

export async function processJurisdictionGuides(): Promise<IngestOptions[]> {
  return Object.entries(JURISDICTION_GUIDES).map(([slug, content]) => ({
    sourceType: 'JURISDICTION_GUIDE' as const,
    sourceId: `jurisdiction:${slug}`,
    title: `Jurisdiction Guide — ${slug}`,
    content,
    jurisdiction: slug,
    serviceType: 'permit',
  }))
}

export async function processServiceCatalog(): Promise<IngestOptions[]> {
  const catalog: IngestOptions[] = [
    {
      sourceType: 'SERVICE_CATALOG',
      sourceId: 'service:ai-concept',
      title: 'Kealee AI Concept Service',
      content: `AI Concept Design + Validation Service:
Price: $395 (Design + Validation), $495 (Advanced — 3 options), $695 (Full AI Package)
Turnaround: 24–48 hours guaranteed for standard tier.
Delivers: AI floor plan sketch, design brief, room-by-room scope notes, zoning check, structural risk rating, cost band (low–high), permit risk rating, contractor scope outline.
Staff-reviewed before delivery.
NOT permit-ready — pre-design concept only.
Best for: homeowners planning a project, getting a cost estimate, exploring design options.
Next steps after concept: Design Services for permit-ready plans, or Permit Services if plans already exist.`,
      serviceType: 'concept',
    },
    {
      sourceType: 'SERVICE_CATALOG',
      sourceId: 'service:permit-simple',
      title: 'Permit Research + Checklist',
      content: `Permit Research + Checklist Service:
Price: $149
Turnaround: Same-day eligible (before 2pm submission cutoff, capacity available).
Delivers: Jurisdiction permit requirements, document checklist, fee schedule, timeline estimate.
Requires: Project address and project description.
Best for: homeowners who want to understand what's required before starting.`,
      serviceType: 'permit',
    },
    {
      sourceType: 'SERVICE_CATALOG',
      sourceId: 'service:permit-package',
      title: 'Full Permit Package',
      content: `Full Permit Package Service:
Price: $950
Turnaround: 3–5 business days typically.
Delivers: Complete permit-ready submission package, application prepared and filed on your behalf, comment response, approval tracking.
Requires: Architect-stamped drawings OR existing permitted plans. Project address.
Best for: homeowners with plans ready who want professional filing.
Most common permit service — covers residential additions, remodels, ADUs.`,
      serviceType: 'permit',
    },
    {
      sourceType: 'SERVICE_CATALOG',
      sourceId: 'service:permit-coordination',
      title: 'Permit Coordination',
      content: `Permit Coordination Service:
Price: $2,750
Turnaround: 5–10 business days for initial submission.
Delivers: Full coordination with jurisdiction, multiple agency submissions, comment response, all required approvals managed.
Requires: Architect-stamped drawings. Complex project scope.
Best for: multi-agency projects, complex permits, commercial.`,
      serviceType: 'permit',
    },
    {
      sourceType: 'SERVICE_CATALOG',
      sourceId: 'service:permit-expediting',
      title: 'Permit Expediting',
      content: `Permit Expediting Service:
Price: Starting at $5,500
Turnaround: Same-day eligible for simple projects.
Delivers: Expedited review queue, permit office liaison, same-day results where available.
Requires: Architect-stamped drawings. Must submit before 10am cutoff for same-day eligibility.
Best for: time-sensitive projects, tight construction schedules.`,
      serviceType: 'permit',
    },
    {
      sourceType: 'SERVICE_CATALOG',
      sourceId: 'service:design-services',
      title: 'Kealee Design Services',
      content: `Design Services (Permit-Ready Plans):
Starter Package: $1,200 — stamped drawings for simple residential projects.
Visualization Package: $2,800 — full visualization + permit-ready drawings.
Full Pre-Design: $6,500 — complete pre-design package including structural, MEP scope.
Turnaround: 5–15 business days depending on package.
Delivers: Architect-stamped, jurisdiction-specific construction documents ready for permit submission.
Required for: any project needing a permit that doesn't have existing architect drawings.
Follows AI Concept if used as pre-design planning tool.`,
      serviceType: 'design',
    },
    {
      sourceType: 'SERVICE_CATALOG',
      sourceId: 'service:estimate',
      title: 'Construction Cost Estimation',
      content: `Cost Estimation Services:
AI Design Estimate: $395 — AI-generated cost band in 48 hours. RSMeans-validated.
Detailed Cost Estimate: $695 — line-item estimate by CSI division, 5–7 day turnaround.
Certified Cost Estimate: $1,200 — licensed estimator review, bankable for financing, 7–10 day turnaround.
Best for: planning budgets, validating contractor bids, obtaining financing.`,
      serviceType: 'estimate',
    },
  ]
  return catalog
}

/**
 * Build all ingestion payloads for nightly job
 */
export async function buildAllIngestPayloads(): Promise<IngestOptions[]> {
  const [permits, intakes, jurisdictions, catalog] = await Promise.all([
    processPermitLeads(),
    processPublicIntakes(),
    processJurisdictionGuides(),
    processServiceCatalog(),
  ])
  return [...permits, ...intakes, ...jurisdictions, ...catalog]
}
