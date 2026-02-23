import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError, ValidationError } from '../../errors/app.error'

export interface CreateSOPTemplateInput {
  name: string
  description?: string
  projectType: string
  createdBy?: string
  phases: {
    name: string
    description?: string
    order: number
    entryCondition?: string
    exitCondition?: string
    steps: {
      name: string
      description?: string
      order: number
      mandatory?: boolean
      estimatedMinutes?: number
      requiredIntegration?: string
      validations?: any
      dependencies?: string[]
      metadata?: any
    }[]
  }[]
}

class SOPService {
  // ── Templates ──

  async createTemplate(input: CreateSOPTemplateInput) {
    return prismaAny.$transaction(async (tx: any) => {
      const template = await tx.sOPTemplate.create({
        data: {
          name: input.name,
          description: input.description ?? null,
          projectType: input.projectType,
          createdBy: input.createdBy ?? null,
          status: 'ACTIVE',
          active: true,
          version: 1,
        },
      })

      for (const phaseInput of input.phases) {
        const phase = await tx.sOPPhase.create({
          data: {
            templateId: template.id,
            name: phaseInput.name,
            description: phaseInput.description ?? null,
            order: phaseInput.order,
            entryCondition: phaseInput.entryCondition ?? null,
            exitCondition: phaseInput.exitCondition ?? null,
          },
        })

        for (const stepInput of phaseInput.steps) {
          await tx.sOPStep.create({
            data: {
              phaseId: phase.id,
              name: stepInput.name,
              description: stepInput.description ?? null,
              order: stepInput.order,
              mandatory: stepInput.mandatory ?? true,
              estimatedMinutes: stepInput.estimatedMinutes ?? null,
              requiredIntegration: stepInput.requiredIntegration ?? null,
              validations: stepInput.validations ?? null,
              dependencies: stepInput.dependencies ?? null,
              metadata: stepInput.metadata ?? null,
            },
          })
        }
      }

      return this.getTemplate(template.id)
    })
  }

  async listTemplates(filters?: { projectType?: string; active?: boolean; status?: string }) {
    const where: any = {}
    if (filters?.projectType) where.projectType = filters.projectType
    if (filters?.active !== undefined) where.active = filters.active
    if (filters?.status) where.status = filters.status

    return prismaAny.sOPTemplate.findMany({
      where,
      include: {
        phases: {
          include: { steps: { orderBy: { order: 'asc' } } },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async getTemplate(templateId: string) {
    const template = await prismaAny.sOPTemplate.findUnique({
      where: { id: templateId },
      include: {
        phases: {
          include: { steps: { orderBy: { order: 'asc' } } },
          orderBy: { order: 'asc' },
        },
      },
    })
    if (!template) throw new NotFoundError('SOPTemplate', templateId)
    return template
  }

  async updateTemplate(templateId: string, data: { name?: string; description?: string; status?: string; active?: boolean }) {
    const template = await prismaAny.sOPTemplate.findUnique({ where: { id: templateId } })
    if (!template) throw new NotFoundError('SOPTemplate', templateId)

    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.status !== undefined) updateData.status = data.status
    if (data.active !== undefined) updateData.active = data.active

    return prismaAny.sOPTemplate.update({ where: { id: templateId }, data: updateData })
  }

  async deleteTemplate(templateId: string) {
    const template = await prismaAny.sOPTemplate.findUnique({ where: { id: templateId } })
    if (!template) throw new NotFoundError('SOPTemplate', templateId)
    return prismaAny.sOPTemplate.delete({ where: { id: templateId } })
  }

  // ── Executions ──

  async startExecution(templateId: string, projectId: string) {
    const template = await prismaAny.sOPTemplate.findUnique({
      where: { id: templateId },
      include: {
        phases: {
          include: { steps: { orderBy: { order: 'asc' } } },
          orderBy: { order: 'asc' },
        },
      },
    })
    if (!template) throw new NotFoundError('SOPTemplate', templateId)
    if (!template.active) throw new ValidationError('Cannot start execution from an inactive template')

    const project = await prismaAny.project.findUnique({ where: { id: projectId } })
    if (!project) throw new NotFoundError('Project', projectId)

    // Check for existing active execution
    const existing = await prismaAny.sOPExecution.findFirst({
      where: { templateId, projectId, status: { in: ['NOT_STARTED', 'IN_PROGRESS'] } },
    })
    if (existing) throw new ValidationError('An active execution already exists for this template and project')

    return prismaAny.$transaction(async (tx: any) => {
      const execution = await tx.sOPExecution.create({
        data: {
          templateId,
          projectId,
          status: 'IN_PROGRESS',
          startedAt: new Date(),
          progress: 0,
        },
      })

      // Create step executions for all steps in the template
      const allSteps = template.phases.flatMap((p: any) => p.steps)
      for (const step of allSteps) {
        await tx.sOPStepExecution.create({
          data: {
            executionId: execution.id,
            stepId: step.id,
            status: 'PENDING',
          },
        })
      }

      return this.getExecution(execution.id)
    })
  }

  async getExecution(executionId: string) {
    const execution = await prismaAny.sOPExecution.findUnique({
      where: { id: executionId },
      include: {
        template: {
          include: {
            phases: {
              include: { steps: { orderBy: { order: 'asc' } } },
              orderBy: { order: 'asc' },
            },
          },
        },
        stepExecutions: {
          include: { step: true },
          orderBy: { step: { order: 'asc' } },
        },
      },
    })
    if (!execution) throw new NotFoundError('SOPExecution', executionId)
    return execution
  }

  async listExecutions(projectId: string) {
    return prismaAny.sOPExecution.findMany({
      where: { projectId },
      include: {
        template: { select: { id: true, name: true, projectType: true } },
        stepExecutions: { select: { id: true, status: true } },
      },
      orderBy: { startedAt: 'desc' },
    })
  }

  async completeStep(executionId: string, stepExecutionId: string, userId: string, data?: { notes?: string; evidence?: any }) {
    const stepExecution = await prismaAny.sOPStepExecution.findFirst({
      where: { id: stepExecutionId, executionId },
      include: { step: true },
    })
    if (!stepExecution) throw new NotFoundError('SOPStepExecution', `${executionId}/${stepExecutionId}`)
    if (stepExecution.status === 'COMPLETED') throw new ValidationError('Step already completed')

    // Check dependencies
    if (stepExecution.step.dependencies) {
      const depIds = stepExecution.step.dependencies as string[]
      if (depIds.length) {
        const depExecutions = await prismaAny.sOPStepExecution.findMany({
          where: { executionId, stepId: { in: depIds } },
        })
        const incomplete = depExecutions.filter((d: any) => d.status !== 'COMPLETED' && d.status !== 'SKIPPED')
        if (incomplete.length) {
          throw new ValidationError('Dependent steps must be completed first')
        }
      }
    }

    await prismaAny.sOPStepExecution.update({
      where: { id: stepExecution.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        completedBy: userId,
        notes: data?.notes ?? null,
        evidence: data?.evidence ?? null,
      },
    })

    // Recalculate progress
    await this.recalculateProgress(executionId)

    return this.getExecution(executionId)
  }

  async skipStep(executionId: string, stepExecutionId: string, userId: string, reason: string) {
    const stepExecution = await prismaAny.sOPStepExecution.findFirst({
      where: { id: stepExecutionId, executionId },
      include: { step: true },
    })
    if (!stepExecution) throw new NotFoundError('SOPStepExecution', `${executionId}/${stepExecutionId}`)

    if (stepExecution.step.mandatory) {
      throw new ValidationError('Cannot skip a mandatory step')
    }

    await prismaAny.sOPStepExecution.update({
      where: { id: stepExecution.id },
      data: {
        status: 'SKIPPED',
        completedAt: new Date(),
        completedBy: userId,
        notes: reason,
      },
    })

    await this.recalculateProgress(executionId)
    return this.getExecution(executionId)
  }

  async pauseExecution(executionId: string) {
    const execution = await prismaAny.sOPExecution.findUnique({ where: { id: executionId } })
    if (!execution) throw new NotFoundError('SOPExecution', executionId)
    if (execution.status !== 'IN_PROGRESS') throw new ValidationError('Can only pause an in-progress execution')

    return prismaAny.sOPExecution.update({
      where: { id: executionId },
      data: { status: 'PAUSED' },
    })
  }

  async resumeExecution(executionId: string) {
    const execution = await prismaAny.sOPExecution.findUnique({ where: { id: executionId } })
    if (!execution) throw new NotFoundError('SOPExecution', executionId)
    if (execution.status !== 'PAUSED') throw new ValidationError('Can only resume a paused execution')

    return prismaAny.sOPExecution.update({
      where: { id: executionId },
      data: { status: 'IN_PROGRESS' },
    })
  }

  private async recalculateProgress(executionId: string) {
    const stepExecutions = await prismaAny.sOPStepExecution.findMany({ where: { executionId } })
    const total = stepExecutions.length
    const done = stepExecutions.filter((s: any) => s.status === 'COMPLETED' || s.status === 'SKIPPED').length
    const progress = total > 0 ? Math.round((done / total) * 100) : 0

    const updateData: any = { progress }
    if (progress === 100) {
      updateData.status = 'COMPLETED'
      updateData.completedAt = new Date()
    }

    await prismaAny.sOPExecution.update({ where: { id: executionId }, data: updateData })
  }

  // ── Seed: NEW_CONSTRUCTION Multifamily Template ──

  async seedNewConstructionTemplate() {
    const existing = await prismaAny.sOPTemplate.findFirst({
      where: { projectType: 'NEW_CONSTRUCTION', name: 'Multifamily New Construction SOP' },
    })
    if (existing) return existing

    return this.createTemplate({
      name: 'Multifamily New Construction SOP',
      description: 'Standard operating procedure for multifamily new construction projects (51+ units)',
      projectType: 'NEW_CONSTRUCTION',
      phases: [
        {
          name: 'Pre-Construction',
          description: 'Project setup, permits, and planning',
          order: 1,
          entryCondition: 'Project created and lead converted',
          exitCondition: 'All permits approved and contracts signed',
          steps: [
            { name: 'Verify project scope and budget', order: 1, mandatory: true, estimatedMinutes: 60, requiredIntegration: 'm-project-owner' },
            { name: 'Complete site survey review', order: 2, mandatory: true, estimatedMinutes: 120 },
            { name: 'Submit building permits', order: 3, mandatory: true, estimatedMinutes: 90, requiredIntegration: 'm-permits-inspections' },
            { name: 'Execute GC contract', order: 4, mandatory: true, estimatedMinutes: 60, requiredIntegration: 'm-finance-trust' },
            { name: 'Obtain builder risk insurance', order: 5, mandatory: true, estimatedMinutes: 30 },
            { name: 'Set up escrow account', order: 6, mandatory: true, estimatedMinutes: 45, requiredIntegration: 'm-finance-trust' },
            { name: 'Finalize unit mix and floor plans', order: 7, mandatory: true, estimatedMinutes: 120, requiredIntegration: 'm-architect' },
            { name: 'Establish area phasing plan', order: 8, mandatory: true, estimatedMinutes: 90 },
          ],
        },
        {
          name: 'Site Work & Foundation',
          description: 'Clearing, grading, utilities, and foundation',
          order: 2,
          entryCondition: 'Permits approved',
          exitCondition: 'Foundation inspection passed',
          steps: [
            { name: 'Mobilize site', order: 1, mandatory: true, estimatedMinutes: 30 },
            { name: 'Confirm erosion control measures', order: 2, mandatory: true, estimatedMinutes: 30, requiredIntegration: 'm-permits-inspections' },
            { name: 'Verify utility connections', order: 3, mandatory: true, estimatedMinutes: 60 },
            { name: 'Foundation pour — schedule inspection', order: 4, mandatory: true, estimatedMinutes: 45, requiredIntegration: 'm-permits-inspections' },
            { name: 'Submit Draw #1 (sitework)', order: 5, mandatory: true, estimatedMinutes: 60, requiredIntegration: 'm-finance-trust' },
          ],
        },
        {
          name: 'Structural & Framing',
          description: 'Framing, structural steel, sheathing',
          order: 3,
          entryCondition: 'Foundation inspection passed',
          exitCondition: 'Framing inspection passed for all buildings',
          steps: [
            { name: 'Track framing progress per building', order: 1, mandatory: true, estimatedMinutes: 30 },
            { name: 'Schedule framing inspections by building', order: 2, mandatory: true, estimatedMinutes: 45, requiredIntegration: 'm-permits-inspections' },
            { name: 'Update unit statuses to IN_PROGRESS', order: 3, mandatory: true, estimatedMinutes: 30 },
            { name: 'Submit Draw #2 (framing)', order: 4, mandatory: true, estimatedMinutes: 60, requiredIntegration: 'm-finance-trust' },
          ],
        },
        {
          name: 'Rough-In (MEP)',
          description: 'Mechanical, electrical, plumbing rough-in',
          order: 4,
          entryCondition: 'Framing inspection passed',
          exitCondition: 'Rough-in inspections passed',
          steps: [
            { name: 'Coordinate MEP rough-in schedule', order: 1, mandatory: true, estimatedMinutes: 60 },
            { name: 'Schedule rough-in inspections (plumbing, electrical, mechanical)', order: 2, mandatory: true, estimatedMinutes: 45, requiredIntegration: 'm-permits-inspections' },
            { name: 'Update unit statuses to ROUGH_IN', order: 3, mandatory: true, estimatedMinutes: 20 },
            { name: 'Submit Draw #3 (rough-in)', order: 4, mandatory: true, estimatedMinutes: 60, requiredIntegration: 'm-finance-trust' },
          ],
        },
        {
          name: 'Insulation & Drywall',
          description: 'Insulation, drywall, and taping',
          order: 5,
          entryCondition: 'Rough-in inspections passed',
          exitCondition: 'Insulation inspection passed, drywall complete',
          steps: [
            { name: 'Schedule insulation inspection', order: 1, mandatory: true, estimatedMinutes: 30, requiredIntegration: 'm-permits-inspections' },
            { name: 'Track drywall completion by unit', order: 2, mandatory: true, estimatedMinutes: 30 },
            { name: 'Update unit statuses to DRYWALL', order: 3, mandatory: true, estimatedMinutes: 20 },
            { name: 'Submit Draw #4 (drywall)', order: 4, mandatory: true, estimatedMinutes: 60, requiredIntegration: 'm-finance-trust' },
          ],
        },
        {
          name: 'Finishes',
          description: 'Cabinets, countertops, flooring, paint, fixtures',
          order: 6,
          entryCondition: 'Drywall complete',
          exitCondition: 'All units finish-complete',
          steps: [
            { name: 'Track finish installation by unit', order: 1, mandatory: true, estimatedMinutes: 30 },
            { name: 'Update unit statuses to FINISHES', order: 2, mandatory: true, estimatedMinutes: 20 },
            { name: 'Submit Draw #5 (finishes)', order: 3, mandatory: true, estimatedMinutes: 60, requiredIntegration: 'm-finance-trust' },
          ],
        },
        {
          name: 'Punch List & Closeout',
          description: 'Punch lists, final inspections, CO, turnover',
          order: 7,
          entryCondition: 'Finishes complete',
          exitCondition: 'All units turned over, CO issued',
          steps: [
            { name: 'Generate punch lists per unit', order: 1, mandatory: true, estimatedMinutes: 120 },
            { name: 'Update unit statuses to PUNCH_LIST', order: 2, mandatory: true, estimatedMinutes: 20 },
            { name: 'Schedule final inspections', order: 3, mandatory: true, estimatedMinutes: 45, requiredIntegration: 'm-permits-inspections' },
            { name: 'Obtain Certificate of Occupancy', order: 4, mandatory: true, estimatedMinutes: 30, requiredIntegration: 'm-permits-inspections' },
            { name: 'Complete unit turnover checklist', order: 5, mandatory: true, estimatedMinutes: 60 },
            { name: 'Update unit statuses to TURNED_OVER', order: 6, mandatory: true, estimatedMinutes: 20 },
            { name: 'Submit final draw request', order: 7, mandatory: true, estimatedMinutes: 60, requiredIntegration: 'm-finance-trust' },
            { name: 'Release retainage', order: 8, mandatory: true, estimatedMinutes: 30, requiredIntegration: 'm-finance-trust' },
            { name: 'Close out project', order: 9, mandatory: true, estimatedMinutes: 60, requiredIntegration: 'm-project-owner' },
          ],
        },
      ],
    })
  }
}

export const sopService = new SOPService()
