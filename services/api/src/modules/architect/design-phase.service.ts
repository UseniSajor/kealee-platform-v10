import { prisma } from '@kealee/database'
import { NotFoundError, ValidationError } from '../../errors/app.error'
import { auditService } from '../audit/audit.service'
import { eventService } from '../events/event.service'

export const designPhaseService = {
  /**
   * Get phase by ID
   */
  async getPhase(phaseId: string) {
    const phase = await prisma.designPhaseInstance.findUnique({
      where: { id: phaseId },
      include: {
        designProject: {
          include: {
            phases: {
              orderBy: { phase: 'asc' },
            },
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        completedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!phase) {
      throw new NotFoundError('DesignPhaseInstance', phaseId)
    }

    return phase
  },

  /**
   * Start a phase
   */
  async startPhase(phaseId: string, userId: string) {
    const phase = await prisma.designPhaseInstance.findUnique({
      where: { id: phaseId },
      include: {
        designProject: true,
      },
    })

    if (!phase) {
      throw new NotFoundError('DesignPhaseInstance', phaseId)
    }

    if (phase.status === 'IN_PROGRESS') {
      throw new ValidationError('Phase is already in progress')
    }

    if (phase.status === 'COMPLETED') {
      throw new ValidationError('Cannot start a completed phase')
    }

    const updated = await prisma.designPhaseInstance.update({
      where: { id: phaseId },
      data: {
        status: 'IN_PROGRESS',
        actualStartDate: new Date(),
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'DESIGN_PHASE_STARTED',
      entityType: 'DesignPhaseInstance',
      entityId: phaseId,
      userId,
      reason: `Phase ${phase.name} started`,
      after: {
        status: 'IN_PROGRESS',
        actualStartDate: updated.actualStartDate,
      },
    })

    // Log event
    await eventService.recordEvent({
      type: 'DESIGN_PHASE_STARTED',
      entityType: 'DesignPhaseInstance',
      entityId: phaseId,
      userId,
      payload: {
        phaseName: phase.name,
        designProjectId: phase.designProjectId,
      },
    })

    return updated
  },

  /**
   * Approve phase (phase gate)
   */
  async approvePhase(phaseId: string, userId: string, notes?: string) {
    const phase = await prisma.designPhaseInstance.findUnique({
      where: { id: phaseId },
      include: {
        designProject: {
          include: {
            phases: {
              orderBy: { phase: 'asc' },
            },
          },
        },
      },
    })

    if (!phase) {
      throw new NotFoundError('DesignPhaseInstance', phaseId)
    }

    if (!phase.requiresApproval) {
      throw new ValidationError('This phase does not require approval')
    }

    if (phase.approvedAt) {
      throw new ValidationError('Phase is already approved')
    }

    const updated = await prisma.designPhaseInstance.update({
      where: { id: phaseId },
      data: {
        approvedAt: new Date(),
        approvedById: userId,
        approvalNotes: notes,
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'DESIGN_PHASE_APPROVED',
      entityType: 'DesignPhaseInstance',
      entityId: phaseId,
      userId,
      reason: notes || `Phase ${phase.name} approved`,
      after: {
        approvedAt: updated.approvedAt,
        approvedById: userId,
        approvalNotes: notes,
      },
    })

    // Log event
    await eventService.recordEvent({
      type: 'DESIGN_PHASE_APPROVED',
      entityType: 'DesignPhaseInstance',
      entityId: phaseId,
      userId,
      payload: {
        phaseName: phase.name,
        designProjectId: phase.designProjectId,
      },
    })

    // Check if auto-progression is enabled and all deliverables are complete
    if (phase.autoProgressEnabled) {
      await this.checkAutoProgression(phase.designProjectId, phaseId)
    }

    return updated
  },

  /**
   * Complete a phase
   */
  async completePhase(
    phaseId: string,
    userId: string,
    data: {
      completionNotes?: string
      signOffDocumentUrl?: string
    }
  ) {
    const phase = await prisma.designPhaseInstance.findUnique({
      where: { id: phaseId },
      include: {
        designProject: {
          include: {
            phases: {
              orderBy: { phase: 'asc' },
            },
          },
        },
      },
    })

    if (!phase) {
      throw new NotFoundError('DesignPhaseInstance', phaseId)
    }

    if (phase.status === 'COMPLETED') {
      throw new ValidationError('Phase is already completed')
    }

    // Check if approval is required and obtained
    if (phase.requiresApproval && !phase.approvedAt) {
      throw new ValidationError('Phase must be approved before completion')
    }

    const now = new Date()
    const actualEndDate = phase.actualEndDate || now

    // Calculate actual duration
    const actualStartDate = phase.actualStartDate || phase.createdAt
    const actualDurationDays = Math.ceil(
      (actualEndDate.getTime() - actualStartDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    // Check for delays
    let delayReason: string | null = null
    if (phase.plannedEndDate && actualEndDate > phase.plannedEndDate) {
      const delayDays = Math.ceil(
        (actualEndDate.getTime() - phase.plannedEndDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      delayReason = `Phase completed ${delayDays} day(s) past planned end date`
    }

    const updated = await prisma.designPhaseInstance.update({
      where: { id: phaseId },
      data: {
        status: 'COMPLETED',
        actualEndDate,
        actualEndDate: actualEndDate,
        completedById: userId,
        completionNotes: data.completionNotes,
        signOffDocumentUrl: data.signOffDocumentUrl,
        actualDurationDays,
        delayReason,
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'DESIGN_PHASE_COMPLETED',
      entityType: 'DesignPhaseInstance',
      entityId: phaseId,
      userId,
      reason: data.completionNotes || `Phase ${phase.name} completed`,
      after: {
        status: 'COMPLETED',
        actualEndDate,
        actualDurationDays,
        delayReason,
      },
    })

    // Log event
    await eventService.recordEvent({
      type: 'DESIGN_PHASE_COMPLETED',
      entityType: 'DesignPhaseInstance',
      entityId: phaseId,
      userId,
      payload: {
        phaseName: phase.name,
        designProjectId: phase.designProjectId,
        actualDurationDays,
        delayReason,
      },
    })

    // Check if auto-progression is enabled
    if (phase.autoProgressEnabled) {
      await this.checkAutoProgression(phase.designProjectId, phaseId)
    }

    return updated
  },

  /**
   * Update phase deliverables checklist
   */
  async updateDeliverablesChecklist(
    phaseId: string,
    userId: string,
    deliverables: Array<{
      id: string
      name: string
      status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
      completedAt?: string
    }>
  ) {
    const phase = await prisma.designPhaseInstance.findUnique({
      where: { id: phaseId },
    })

    if (!phase) {
      throw new NotFoundError('DesignPhaseInstance', phaseId)
    }

    const updated = await prisma.designPhaseInstance.update({
      where: { id: phaseId },
      data: {
        deliverablesChecklist: deliverables as any,
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'DESIGN_PHASE_DELIVERABLES_UPDATED',
      entityType: 'DesignPhaseInstance',
      entityId: phaseId,
      userId,
      reason: 'Deliverables checklist updated',
      after: {
        deliverablesChecklist: deliverables,
      },
    })

    return updated
  },

  /**
   * Update phase timeline
   */
  async updatePhaseTimeline(
    phaseId: string,
    userId: string,
    data: {
      plannedStartDate?: string
      plannedEndDate?: string
      estimatedDurationDays?: number
    }
  ) {
    const phase = await prisma.designPhaseInstance.findUnique({
      where: { id: phaseId },
    })

    if (!phase) {
      throw new NotFoundError('DesignPhaseInstance', phaseId)
    }

    const updateData: any = {}
    if (data.plannedStartDate) {
      updateData.plannedStartDate = new Date(data.plannedStartDate)
    }
    if (data.plannedEndDate) {
      updateData.plannedEndDate = new Date(data.plannedEndDate)
    }
    if (data.estimatedDurationDays !== undefined) {
      updateData.estimatedDurationDays = data.estimatedDurationDays
    }

    const updated = await prisma.designPhaseInstance.update({
      where: { id: phaseId },
      data: updateData,
    })

    // Log audit
    await auditService.recordAudit({
      action: 'DESIGN_PHASE_TIMELINE_UPDATED',
      entityType: 'DesignPhaseInstance',
      entityId: phaseId,
      userId,
      reason: 'Phase timeline updated',
      after: updateData,
    })

    return updated
  },

  /**
   * Check for phase delays and generate alerts
   */
  async checkPhaseDelays(designProjectId: string) {
    const phases = await prisma.designPhaseInstance.findMany({
      where: {
        designProjectId,
        status: { in: ['NOT_STARTED', 'IN_PROGRESS'] },
        plannedEndDate: { not: null },
      },
    })

    const now = new Date()
    const delayedPhases = phases.filter((phase) => {
      if (!phase.plannedEndDate) return false
      return now > phase.plannedEndDate && phase.status !== 'COMPLETED'
    })

    return delayedPhases.map((phase) => {
      const delayDays = Math.ceil(
        (now.getTime() - phase.plannedEndDate!.getTime()) / (1000 * 60 * 60 * 24)
      )
      return {
        phaseId: phase.id,
        phaseName: phase.name,
        delayDays,
        plannedEndDate: phase.plannedEndDate,
      }
    })
  },

  /**
   * Get phase timeline history
   */
  async getPhaseTimeline(designProjectId: string) {
    const phases = await prisma.designPhaseInstance.findMany({
      where: { designProjectId },
      orderBy: { phase: 'asc' },
      include: {
        approvedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        completedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return phases.map((phase) => ({
      id: phase.id,
      phase: phase.phase,
      name: phase.name,
      status: phase.status,
      plannedStartDate: phase.plannedStartDate,
      plannedEndDate: phase.plannedEndDate,
      actualStartDate: phase.actualStartDate,
      actualEndDate: phase.actualEndDate,
      estimatedDurationDays: phase.estimatedDurationDays,
      actualDurationDays: phase.actualDurationDays,
      delayReason: phase.delayReason,
      approvedAt: phase.approvedAt,
      approvedBy: phase.approvedBy,
      completedAt: phase.actualEndDate,
      completedBy: phase.completedBy,
      createdAt: phase.createdAt,
      updatedAt: phase.updatedAt,
    }))
  },

  /**
   * Check and trigger automatic phase progression
   */
  async checkAutoProgression(designProjectId: string, completedPhaseId: string) {
    const project = await prisma.designProject.findUnique({
      where: { id: designProjectId },
      include: {
        phases: {
          orderBy: { phase: 'asc' },
        },
      },
    })

    if (!project) return

    const completedPhase = project.phases.find((p) => p.id === completedPhaseId)
    if (!completedPhase) return

    // Find next phase in sequence
    const phaseOrder = ['PRE_DESIGN', 'SCHEMATIC_DESIGN', 'DESIGN_DEVELOPMENT', 'CONSTRUCTION_DOCUMENTS']
    const currentIndex = phaseOrder.indexOf(completedPhase.phase)
    if (currentIndex === -1 || currentIndex === phaseOrder.length - 1) return

    const nextPhaseType = phaseOrder[currentIndex + 1]
    const nextPhase = project.phases.find((p) => p.phase === nextPhaseType)

    if (!nextPhase) return

    // Auto-start next phase if it's not started and auto-progression is enabled
    if (nextPhase.autoProgressEnabled && nextPhase.status === 'NOT_STARTED') {
      await prisma.designPhaseInstance.update({
        where: { id: nextPhase.id },
        data: {
          status: 'IN_PROGRESS',
          actualStartDate: new Date(),
        },
      })

      // Log event
      await eventService.recordEvent({
        type: 'DESIGN_PHASE_AUTO_PROGRESSED',
        entityType: 'DesignPhaseInstance',
        entityId: nextPhase.id,
        payload: {
          phaseName: nextPhase.name,
          designProjectId,
          triggeredByPhaseId: completedPhaseId,
        },
      })
    }
  },
}
