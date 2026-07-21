/**
 * construction-engagement.service.ts
 *
 * Automation service for the CONSTRUCTION_READY → contractor engagement lifecycle.
 *
 * Triggered from professional-assignment.service.ts → engageContractor() after all
 * readiness and eligibility gates pass.
 *
 * Automation sequence (initializeEngagement):
 *   1. Create ContractAgreement (DRAFT) — linked to project, owner, contractor
 *   2. Create Milestones — standard schedule from project-type template
 *   3. Create EscrowAgreement — 10 % initial deposit, 10 % holdback
 *   4. Stamp Project.constructionReadiness = CONSTRUCTION_READY (idempotent)
 *   5. Fire engagement notifications (owner + contractor)
 *   6. Emit CONSTRUCTION_ENGAGEMENT_INITIALIZED event for audit trail
 *
 * Applies to: RESIDENTIAL, COMMERCIAL, MULTIFAMILY, MIXED_USE
 *
 * Step errors are collected and returned — a failure in one step (e.g. escrow)
 * never aborts the lead award.  The caller logs partial failures and the
 * POST /leads/:leadId/engagement/initialize endpoint enables manual retry.
 *
 * NOTE on ConstructionReadinessStatus:
 *   markConstructionReady() is the canonical way to set the field.
 *   professional-assignment.service.ts uses a dual-path check (canonical field
 *   preferred; CONSTRUCTION_READY_PHASES Set as backward-compat fallback) until
 *   all Projects are migrated.  See ConstructionReadinessStatus enum comment.
 */

import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError } from '../../errors/app.error'
import { auditService } from '../audit/audit.service'
import { eventService } from '../events/event.service'
import { workflowOrchestratorService } from '../workflow/workflow-orchestrator.service'

// ─── Project-type categories ──────────────────────────────────────────────────

export type ProjectCategory = 'RESIDENTIAL' | 'COMMERCIAL' | 'MULTIFAMILY' | 'MIXED_USE'

/**
 * Standard milestone payment schedules by project category.
 *
 * Percentages sum to 1.0 for each category.
 * Names and descriptions reflect real-world construction progress gates that
 * trigger payment upon verified completion.
 *
 * These are starting templates — the owner/contractor can adjust milestones
 * after the contract is in DRAFT status before final signing.
 */
const MILESTONE_TEMPLATES: Record<
  ProjectCategory,
  Array<{ name: string; description: string; pct: number; order: number }>
> = {
  RESIDENTIAL: [
    {
      name:        'Contract Execution & Mobilization',
      description: 'Permit pulled, site secured, temporary utilities, materials ordered.',
      pct:   0.10,
      order: 1,
    },
    {
      name:        'Site Preparation & Foundation',
      description: 'Demo (if applicable), excavation complete, slab or foundation poured and cured.',
      pct:   0.20,
      order: 2,
    },
    {
      name:        'Framing',
      description: 'Structural framing complete, roof sheathing installed, windows rough-set.',
      pct:   0.20,
      order: 3,
    },
    {
      name:        'Rough-In (MEP)',
      description: 'Rough electrical, plumbing, and HVAC installed; rough inspections passed.',
      pct:   0.20,
      order: 4,
    },
    {
      name:        'Exterior & Insulation',
      description: 'Exterior cladding, roofing, insulation, and vapor barrier complete.',
      pct:   0.15,
      order: 5,
    },
    {
      name:        'Interior Finishes',
      description: 'Drywall, flooring, cabinetry, fixtures, and trim installed.',
      pct:   0.10,
      order: 6,
    },
    {
      name:        'Final Inspection & Punch List',
      description: 'Certificate of Occupancy obtained, punch list resolved, owner walkthrough complete.',
      pct:   0.05,
      order: 7,
    },
  ],

  COMMERCIAL: [
    {
      name:        'Mobilization & Site Work',
      description: 'Permits finalized, site fencing, temporary utilities, grading complete.',
      pct:   0.10,
      order: 1,
    },
    {
      name:        'Foundation & Structural',
      description: 'Deep foundations or slab complete; structural steel or concrete frame erected.',
      pct:   0.25,
      order: 2,
    },
    {
      name:        'MEP Rough-In',
      description: 'Mechanical, electrical, plumbing, and fire-suppression rough-in; inspections passed.',
      pct:   0.20,
      order: 3,
    },
    {
      name:        'Exterior Envelope',
      description: 'Curtain wall, cladding, roofing, and glazing complete; building weathered-in.',
      pct:   0.15,
      order: 4,
    },
    {
      name:        'Interior Build-Out',
      description: 'Tenant partitions, ceilings, flooring, finishes, and fixtures installed.',
      pct:   0.20,
      order: 5,
    },
    {
      name:        'Final / Certificate of Occupancy',
      description: 'All inspections passed, TCO or CO issued, punch list complete.',
      pct:   0.10,
      order: 6,
    },
  ],

  MULTIFAMILY: [
    {
      name:        'Mobilization',
      description: 'Permits secured, site preparation, temporary utilities established.',
      pct:   0.10,
      order: 1,
    },
    {
      name:        'Foundation & Podium',
      description: 'Underground utilities, mat foundation or podium slab poured and cured.',
      pct:   0.20,
      order: 2,
    },
    {
      name:        'Structural Framing — All Floors',
      description: 'Wood or light-gauge framing complete for all residential floors.',
      pct:   0.20,
      order: 3,
    },
    {
      name:        'MEP Rough-In',
      description: 'Mechanical, electrical, and plumbing rough-in; rough inspections passed.',
      pct:   0.20,
      order: 4,
    },
    {
      name:        'Interior Finishes — All Units',
      description: 'Drywall, flooring, cabinetry, and fixtures installed across all units.',
      pct:   0.15,
      order: 5,
    },
    {
      name:        'Site Work & Common Areas',
      description: 'Landscaping, parking, lobby, corridors, and amenities complete.',
      pct:   0.10,
      order: 6,
    },
    {
      name:        'Final / Certificate of Occupancy',
      description: 'All units inspected, CO issued, punch list resolved.',
      pct:   0.05,
      order: 7,
    },
  ],

  MIXED_USE: [
    {
      name:        'Mobilization',
      description: 'Permits secured, site preparation, temporary utilities established.',
      pct:   0.10,
      order: 1,
    },
    {
      name:        'Foundation & Commercial Podium',
      description: 'Underground utilities, mat foundation, podium slab for commercial base.',
      pct:   0.20,
      order: 2,
    },
    {
      name:        'Structural Framing — All Floors',
      description: 'Commercial-level structural steel or concrete plus residential floors above.',
      pct:   0.20,
      order: 3,
    },
    {
      name:        'MEP Rough-In',
      description: 'MEP rough-in for all commercial spaces and residential units; inspections passed.',
      pct:   0.20,
      order: 4,
    },
    {
      name:        'Commercial Build-Out & Residential Finishes',
      description: 'Retail/office tenant finishes and all residential unit interior finishes.',
      pct:   0.15,
      order: 5,
    },
    {
      name:        'Site Work, Common Areas & Amenities',
      description: 'Landscaping, parking, lobbies, corridors, and shared amenities complete.',
      pct:   0.10,
      order: 6,
    },
    {
      name:        'Final / Certificate of Occupancy — All Components',
      description: 'Full CO for all commercial and residential components; punch list resolved.',
      pct:   0.05,
      order: 7,
    },
  ],
}

// ─── PreConPhase phases that qualify for construction readiness ───────────────
// Used by markConstructionReady() to validate before stamping the canonical field.
// Mirrors the CONSTRUCTION_READY_PHASES Set in professional-assignment.service.ts.
const READY_PRECON_PHASES = new Set([
  'BIDDING_OPEN',
  'AWARDED',
  'CONTRACT_PENDING',
  'CONTRACT_RATIFIED',
  'COMPLETED',
])

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EngagementInitInput {
  leadId:            string
  profileId:         string  // MarketplaceProfile.id (contractor)
  contractorUserId:  string  // User.id of the contractor
  ownerUserId:       string  // User.id of the project owner
  projectId:         string
  contractAmount:    number
  projectCategory?:  string  // fed from Project.category or PreConProject.category
  triggeredByUserId: string
}

export interface EngagementInitResult {
  success:            boolean
  contractId?:        string
  escrowId?:          string
  milestonesCreated?: number
  /** Partial failures — engagement still proceeds; use manual retry endpoint to fix. */
  errors?:            string[]
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const constructionEngagementService = {

  // ── 1. MARK CONSTRUCTION READY ─────────────────────────────────────────────

  /**
   * Explicitly mark a project as CONSTRUCTION_READY.
   *
   * This is the canonical way to set Project.constructionReadiness.
   * Call it when:
   *   - PreConProject.phase transitions to BIDDING_OPEN (plans approved + permits submitted)
   *   - An admin/PM confirms readiness manually
   *
   * After this is populated, professional-assignment.service.ts will use the
   * canonical field instead of the CONSTRUCTION_READY_PHASES Set proxy.
   */
  async markConstructionReady(input: {
    projectId:   string
    confirmedBy: string
    reason?:     string
  }): Promise<any> {
    const { projectId, confirmedBy, reason } = input

    const project = await prismaAny.project.findUnique({
      where:   { id: projectId },
      include: { preConProject: { select: { id: true, phase: true } } },
    })
    if (!project) throw new NotFoundError('Project', projectId)

    // Validate: associated PreConProject must be in a ready phase
    const preConProject = project.preConProject
    if (!preConProject) {
      throw new Error(
        'Cannot mark construction-ready: no PreConProject is linked to this project. ' +
        'Plans must exist and permits must be submitted.'
      )
    }
    if (!READY_PRECON_PHASES.has(preConProject.phase)) {
      throw new Error(
        `Cannot mark construction-ready: PreConProject is in phase "${preConProject.phase}". ` +
        `Required: BIDDING_OPEN or later (plans approved + permits at least submitted).`
      )
    }

    const updated = await prismaAny.project.update({
      where: { id: projectId },
      data: {
        constructionReadiness:            'CONSTRUCTION_READY',
        constructionReadinessUpdatedAt:   new Date(),
        constructionReadinessConfirmedBy: confirmedBy,
      },
    })

    await Promise.allSettled([
      auditService.recordAudit({
        action:     'PROJECT_CONSTRUCTION_READY',
        entityType: 'Project',
        entityId:   projectId,
        userId:     confirmedBy,
        reason:     reason ?? 'Construction readiness confirmed',
        after: {
          constructionReadiness: 'CONSTRUCTION_READY',
          preConPhase:           preConProject.phase,
        },
      }),
      eventService.recordEvent({
        type:       'PROJECT_CONSTRUCTION_READY',
        entityType: 'Project',
        entityId:   projectId,
        userId:     confirmedBy,
        payload: {
          projectId,
          constructionReadiness: 'CONSTRUCTION_READY',
          preConProjectId:       preConProject.id,
          preConPhase:           preConProject.phase,
          reason,
        },
      }),
    ])

    // Mirror into workflow stage (fire-and-forget; does not replace canonical field)
    workflowOrchestratorService.onConstructionReady({
      projectId,
      triggeredByUserId: confirmedBy,
    }).catch((err: any) => {
      console.warn('[workflow] onConstructionReady failed (non-fatal):', err?.message)
    })

    return updated
  },

  // ── 2. GET READINESS STATUS ─────────────────────────────────────────────────

  async getReadinessStatus(projectId: string): Promise<any> {
    const project = await prismaAny.project.findUnique({
      where: { id: projectId },
      select: {
        id:                               true,
        constructionReadiness:            true,
        constructionReadinessUpdatedAt:   true,
        constructionReadinessConfirmedBy: true,
        preConProject: {
          select: {
            id:                  true,
            phase:               true,
            awardedContractorId: true,
            contractAmount:      true,
          },
        },
      },
    })
    if (!project) throw new NotFoundError('Project', projectId)

    return {
      projectId,
      constructionReadiness:            project.constructionReadiness ?? 'NOT_READY',
      constructionReadinessUpdatedAt:   project.constructionReadinessUpdatedAt,
      constructionReadinessConfirmedBy: project.constructionReadinessConfirmedBy,
      preConPhase:                      project.preConProject?.phase ?? null,
      // Derived: is the project currently in a CONSTRUCTION_READY state?
      isReady: project.constructionReadiness === 'CONSTRUCTION_READY',
      // Derived: would the backward-compat proxy also pass?
      proxyWouldPass: READY_PRECON_PHASES.has(project.preConProject?.phase ?? ''),
    }
  },

  // ── 3. INITIALIZE ENGAGEMENT (main automation sequence) ───────────────────

  /**
   * Runs the full engagement automation after a contractor is formally engaged.
   *
   * Called from professional-assignment.service.ts → engageContractor() after
   * all readiness/eligibility gates pass.
   *
   * Also exposed via POST /marketplace/leads/:leadId/engagement/initialize
   * for manual retry when auto-initialization partially failed.
   */
  async initializeEngagement(input: EngagementInitInput): Promise<EngagementInitResult> {
    const {
      leadId,
      profileId,
      contractorUserId,
      ownerUserId,
      projectId,
      contractAmount,
      projectCategory,
      triggeredByUserId,
    } = input

    const errors: string[] = []
    let contractId:       string | undefined
    let escrowId:         string | undefined
    let engagementId:     string | undefined
    let milestonesCreated = 0

    // ── Step 0.5: Create canonical Engagement record ──────────────────────
    try {
      const engagement = await prismaAny.engagement.create({
        data: {
          projectId,
          contractorId:  contractorUserId,
          ownerId:       ownerUserId,
          status:        'ACTIVE',
          phase:         'CONSTRUCTION',
          contractValue: contractAmount,
          startDate:     new Date(),
        },
      })
      engagementId = engagement.id
    } catch (err: any) {
      // Non-fatal — canonical record, not blocking
      errors.push(`Engagement record creation failed: ${err?.message ?? String(err)}`)
    }

    // ── Step 1: Create ContractAgreement (DRAFT) ──────────────────────────
    try {
      const contract = await prismaAny.contractAgreement.create({
        data: {
          projectId,
          ownerId:      ownerUserId,
          contractorId: contractorUserId,
          amount:       contractAmount,
          status:       'DRAFT',
        },
      })
      contractId = contract.id

      // Back-link engagement → contract
      if (engagementId) {
        await prismaAny.engagement.update({
          where: { id: engagementId },
          data:  { contractAgreementId: contractId },
        }).catch(() => null)
      }
    } catch (err: any) {
      errors.push(`Contract creation failed: ${err?.message ?? String(err)}`)
    }

    // ── Step 2: Create Milestones from project-type template ──────────────
    if (contractId) {
      try {
        const category  = this._detectCategory(projectCategory)
        const templates = MILESTONE_TEMPLATES[category]

        const milestoneRows = templates.map((t) => ({
          contractId,
          name:        t.name,
          description: t.description,
          // Round to 2 decimal places (avoids floating-point drift)
          amount:      Math.round(contractAmount * t.pct * 100) / 100,
          status:      'PENDING',
        }))

        await prismaAny.$transaction(
          milestoneRows.map((m: any) => prismaAny.milestone.create({ data: m }))
        )
        milestonesCreated = milestoneRows.length
      } catch (err: any) {
        errors.push(`Milestone creation failed: ${err?.message ?? String(err)}`)
      }
    }

    // ── Step 3: Create EscrowAgreement ────────────────────────────────────
    if (contractId) {
      try {
        const escrowAccountNumber = await this._generateEscrowAccountNumber()
        const escrow = await prismaAny.escrowAgreement.create({
          data: {
            contractId,
            projectId,
            escrowAccountNumber,
            totalContractAmount:  contractAmount,
            // Initial deposit = 10 % of contract value (mobilisation milestone)
            initialDepositAmount: Math.round(contractAmount * 0.10 * 100) / 100,
            holdbackPercentage:   10,
            currentBalance:       0,
            availableBalance:     0,
            heldBalance:          0,
            status:               'PENDING_DEPOSIT',
          },
        })
        escrowId = escrow.id

        // Back-link engagement → escrow
        if (engagementId) {
          await prismaAny.engagement.update({
            where: { id: engagementId },
            data:  { escrowAgreementId: escrowId },
          }).catch(() => null)
        }
      } catch (err: any) {
        errors.push(`Escrow creation failed: ${err?.message ?? String(err)}`)
      }
    }

    // ── Step 4: Stamp Project.constructionReadiness = CONSTRUCTION_READY ──
    // Idempotent — safe to call even if markConstructionReady() was called earlier.
    try {
      await prismaAny.project.update({
        where: { id: projectId },
        data: {
          constructionReadiness:            'CONSTRUCTION_READY',
          constructionReadinessUpdatedAt:   new Date(),
          constructionReadinessConfirmedBy: triggeredByUserId,
        },
      })
    } catch (err: any) {
      errors.push(`Project readiness update failed: ${err?.message ?? String(err)}`)
    }

    // ── Step 5: Notifications ─────────────────────────────────────────────
    try {
      await this._sendEngagementNotifications({
        ownerUserId,
        contractorUserId,
        projectId,
        contractId,
        escrowId,
        contractAmount,
      })
    } catch (err: any) {
      errors.push(`Notification delivery failed: ${err?.message ?? String(err)}`)
    }

    // ── Step 6: Audit + Event record ──────────────────────────────────────
    const payload = {
      leadId,
      profileId,
      projectId,
      contractId,
      escrowId,
      milestonesCreated,
      contractAmount,
      errors,
    }

    await Promise.allSettled([
      auditService.recordAudit({
        action:     'CONSTRUCTION_ENGAGEMENT_INITIALIZED',
        entityType: 'Lead',
        entityId:   leadId,
        userId:     triggeredByUserId,
        after:      payload,
      }),
      eventService.recordEvent({
        type:       'CONSTRUCTION_ENGAGEMENT_INITIALIZED',
        entityType: 'Lead',
        entityId:   leadId,
        userId:     triggeredByUserId,
        payload,
      }),
    ])

    return {
      success: errors.length === 0,
      contractId,
      escrowId,
      milestonesCreated,
      ...(errors.length > 0 ? { errors } : {}),
    }
  },

  // ── 4. GET ENGAGEMENT STATUS ───────────────────────────────────────────────

  async getEngagementStatus(leadId: string): Promise<any> {
    const lead = await prismaAny.lead.findUnique({
      where:   { id: leadId },
      include: {
        project: {
          include: {
            contracts: {
              include: {
                milestones:      { orderBy: { createdAt: 'asc' } },
                escrowAgreement: true,
              },
              orderBy: { createdAt: 'desc' },
              take:    1,
            },
          },
        },
      },
    })
    if (!lead) throw new NotFoundError('Lead', leadId)

    const latestContract = lead.project?.contracts?.[0] ?? null

    return {
      leadId,
      projectId:             lead.projectId,
      constructionReadiness: lead.project?.constructionReadiness ?? 'NOT_READY',
      contract: latestContract
        ? {
            id:             latestContract.id,
            status:         latestContract.status,
            amount:         latestContract.amount,
            signedAt:       latestContract.signedAt,
            milestoneCount: latestContract.milestones?.length ?? 0,
            milestones:     latestContract.milestones,
            escrow:         latestContract.escrowAgreement ?? null,
          }
        : null,
    }
  },

  // ── Public helpers ─────────────────────────────────────────────────────────

  /** Expose templates for admin preview or custom overrides. */
  getMilestoneTemplate(category: ProjectCategory) {
    return MILESTONE_TEMPLATES[category]
  },

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Infer ProjectCategory from a free-form category string.
   * Falls back to RESIDENTIAL (the most common case).
   */
  _detectCategory(categoryStr: string | null | undefined): ProjectCategory {
    if (!categoryStr) return 'RESIDENTIAL'
    const c = categoryStr.toUpperCase()
    if (c.includes('MIXED'))       return 'MIXED_USE'
    if (
      c.includes('MULTIFAMILY') ||
      c.includes('MULTI_FAMILY') ||
      c.includes('APARTMENT')   ||
      c.includes('CONDO')
    )                              return 'MULTIFAMILY'
    if (
      c.includes('COMMERCIAL') ||
      c.includes('OFFICE')     ||
      c.includes('RETAIL')     ||
      c.includes('INDUSTRIAL') ||
      c.includes('WAREHOUSE')
    )                              return 'COMMERCIAL'
    return 'RESIDENTIAL'
  },

  /**
   * Fire engagement notification events.
   * Uses the existing eventService append-only log.
   * Actual email/push delivery is handled by the email queue subscriber
   * that watches for these event types.
   */
  async _sendEngagementNotifications(input: {
    ownerUserId:      string
    contractorUserId: string
    projectId:        string
    contractId?:      string
    escrowId?:        string
    contractAmount:   number
  }): Promise<void> {
    await Promise.allSettled([
      // Owner: contract ready for review
      eventService.recordEvent({
        type:       'ENGAGEMENT_CONTRACT_READY_FOR_REVIEW',
        entityType: 'Project',
        entityId:   input.projectId,
        userId:     input.ownerUserId,
        payload: {
          recipient:      'owner',
          projectId:      input.projectId,
          contractId:     input.contractId,
          escrowId:       input.escrowId,
          contractAmount: input.contractAmount,
          message:
            'Your contractor engagement contract is ready for review. ' +
            'Please review and sign to unlock the escrow deposit.',
        },
      }),
      // Contractor: contract issued
      eventService.recordEvent({
        type:       'ENGAGEMENT_CONTRACT_ISSUED_TO_CONTRACTOR',
        entityType: 'Project',
        entityId:   input.projectId,
        userId:     input.contractorUserId,
        payload: {
          recipient:      'contractor',
          projectId:      input.projectId,
          contractId:     input.contractId,
          escrowId:       input.escrowId,
          contractAmount: input.contractAmount,
          message:
            'A contract has been issued for your accepted project engagement. ' +
            'Work may begin once the owner signs and the initial deposit clears escrow.',
        },
      }),
    ])
  },

  /**
   * Generate an ESC-YYYYMMDD-XXXX account number, matching the pattern used
   * by payService.generateEscrowAccountNumber() in services/os-pay.
   * Idempotent per day: increments the sequence suffix for each new escrow.
   */
  async _generateEscrowAccountNumber(): Promise<string> {
    const date   = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const prefix = `ESC-${date}-`

    const latest = await prismaAny.escrowAgreement.findFirst({
      where:   { escrowAccountNumber: { startsWith: prefix } },
      orderBy: { escrowAccountNumber: 'desc' },
      select:  { escrowAccountNumber: true },
    })

    const seq = latest
      ? parseInt(latest.escrowAccountNumber.split('-').at(-1) ?? '0', 10) + 1
      : 1

    return `${prefix}${String(seq).padStart(4, '0')}`
  },
}
