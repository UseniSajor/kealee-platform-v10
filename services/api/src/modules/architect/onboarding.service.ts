import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError, ValidationError } from '../../errors/app.error'
import { auditService } from '../audit/audit.service'
import { eventService } from '../events/event.service'

// Default onboarding steps for architects
const DEFAULT_ONBOARDING_STEPS = [
  { stepId: 1, name: 'Welcome & Overview', description: 'Introduction to Architect Hub', status: 'NOT_STARTED' },
  { stepId: 2, name: 'Create First Project', description: 'Create your first design project', status: 'NOT_STARTED' },
  { stepId: 3, name: 'Upload Drawings', description: 'Upload and organize drawing sets', status: 'NOT_STARTED' },
  { stepId: 4, name: 'Team Setup', description: 'Add team members and assign roles', status: 'NOT_STARTED' },
  { stepId: 5, name: 'Explore Templates', description: 'Browse template library', status: 'NOT_STARTED' },
  { stepId: 6, name: 'Create Deliverable', description: 'Create your first deliverable', status: 'NOT_STARTED' },
  { stepId: 7, name: 'Version Control', description: 'Create a version branch', status: 'NOT_STARTED' },
  { stepId: 8, name: 'Design Review', description: 'Request a design review', status: 'NOT_STARTED' },
  { stepId: 9, name: 'Quality Control', description: 'Create a QC checklist', status: 'NOT_STARTED' },
  { stepId: 10, name: 'Complete Onboarding', description: 'Finish onboarding process', status: 'NOT_STARTED' },
]

export const onboardingService = {
  /**
   * Initialize onboarding for user
   */
  async initializeOnboarding(userId: string) {
    // Check if onboarding already exists
    const existing = await prismaAny.architectOnboarding.findUnique({
      where: { userId },
    })

    if (existing) {
      return existing
    }

    const onboarding = await prismaAny.architectOnboarding.create({
      data: {
        userId,
        currentStep: 0,
        totalSteps: DEFAULT_ONBOARDING_STEPS.length,
        completedSteps: 0,
        completionPercentage: '0',
        isCompleted: false,
        steps: DEFAULT_ONBOARDING_STEPS as any,
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'ARCHITECT_ONBOARDING_INITIALIZED',
      entityType: 'ArchitectOnboarding',
      entityId: onboarding.id,
      userId,
      reason: 'Architect onboarding initialized',
      after: {
        totalSteps: DEFAULT_ONBOARDING_STEPS.length,
      },
    })

    return onboarding
  },

  /**
   * Get onboarding status
   */
  async getOnboarding(userId: string) {
    let onboarding = await prismaAny.architectOnboarding.findUnique({
      where: { userId },
    })

    if (!onboarding) {
      onboarding = await this.initializeOnboarding(userId)
    }

    return onboarding
  },

  /**
   * Complete onboarding step
   */
  async completeStep(userId: string, stepId: number) {
    const onboarding = await prismaAny.architectOnboarding.findUnique({
      where: { userId },
    })

    if (!onboarding) {
      throw new NotFoundError('ArchitectOnboarding', userId)
    }

    const steps = (onboarding.steps as any[]) || []
    const stepIndex = steps.findIndex((s) => s.stepId === stepId)

    if (stepIndex === -1) {
      throw new ValidationError(`Step ${stepId} not found`)
    }

    // Update step status
    steps[stepIndex] = {
      ...steps[stepIndex],
      status: 'COMPLETED',
      completedAt: new Date().toISOString(),
    }

    // Calculate completion
    const completedSteps = steps.filter((s) => s.status === 'COMPLETED').length
    const completionPercentage = (completedSteps / steps.length) * 100
    const currentStep = Math.max(
      ...steps.map((s, idx) => (s.status === 'COMPLETED' ? idx + 1 : 0))
    )

    const isCompleted = completedSteps === steps.length

    const updated = await prismaAny.architectOnboarding.update({
      where: { userId },
      data: {
        steps: steps as any,
        completedSteps,
        completionPercentage: completionPercentage.toString(),
        currentStep,
        isCompleted,
        completedAt: isCompleted ? new Date() : undefined,
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'ARCHITECT_ONBOARDING_STEP_COMPLETED',
      entityType: 'ArchitectOnboarding',
      entityId: onboarding.id,
      userId,
      reason: `Completed step ${stepId}: ${steps[stepIndex].name}`,
      after: {
        completedSteps,
        completionPercentage: completionPercentage.toString(),
      },
    })

    return updated
  },

  /**
   * Skip onboarding step
   */
  async skipStep(userId: string, stepId: number) {
    const onboarding = await prismaAny.architectOnboarding.findUnique({
      where: { userId },
    })

    if (!onboarding) {
      throw new NotFoundError('ArchitectOnboarding', userId)
    }

    const steps = (onboarding.steps as any[]) || []
    const stepIndex = steps.findIndex((s) => s.stepId === stepId)

    if (stepIndex === -1) {
      throw new ValidationError(`Step ${stepId} not found`)
    }

    steps[stepIndex] = {
      ...steps[stepIndex],
      status: 'SKIPPED',
    }

    const updated = await prismaAny.architectOnboarding.update({
      where: { userId },
      data: {
        steps: steps as any,
      },
    })

    return updated
  },
}
