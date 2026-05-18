/**
 * Service Chain Gating & Orchestration
 * Implements the sequential service chain: Concept → Zoning → Estimation → Permit
 * Prevents users from proceeding without completing prerequisite services
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '@kealee/database'
const prismaAny = prisma as any

// ReadinessState as string union (model not yet generated into Prisma client types)
type ReadinessState =
  | 'NOT_READY'
  | 'NEEDS_MORE_INFO'
  | 'READY_FOR_CONCEPT'
  | 'READY_FOR_ZONING_REVIEW'
  | 'READY_FOR_ESTIMATE'
  | 'READY_FOR_PERMIT_REVIEW'
  | 'READY_FOR_CHECKOUT'
  | 'PERMIT_SUBMITTED'
  | 'PERMIT_APPROVED'
  | 'REQUIRES_CONSULTATION'
  | 'BLOCKED'

// ============================================================================
// READINESS LOGIC
// ============================================================================

/**
 * Determine the current readiness state of a project
 */
export async function getProjectReadinessState(
  projectId: string
): Promise<ReadinessState> {
  // Get the service chain gate for this project
  const gate = await prismaAny.serviceChainGate.findFirst({
    where: { projectId },
  })

  if (!gate) {
    // Create new gate if it doesn't exist
    const newGate = await prismaAny.serviceChainGate.create({
      data: {
        projectId,
        currentReadinessState: 'NOT_READY',
      },
    })
    return newGate.currentReadinessState as ReadinessState
  }

  return gate.currentReadinessState as ReadinessState
}

/**
 * Update readiness state based on completed services.
 * Contractor matching unlocks when:
 *   - permit has been submitted or approved, OR
 *   - no permit is required and estimation is complete
 */
export async function updateReadinessState(
  projectId: string,
  completedServices: {
    conceptCompleted?: boolean
    zoningCompleted?: boolean
    estimationCompleted?: boolean
    permitReadyForCheckout?: boolean
    permitSubmitted?: boolean
    permitApproved?: boolean
    noPermitRequired?: boolean
  }
): Promise<ReadinessState> {
  // Merge with existing gate data so partial updates don't reset other flags
  const existing = await prismaAny.serviceChainGate.findFirst({ where: { projectId } })
  const merged = { ...(existing ?? {}), ...completedServices }

  const {
    conceptCompleted,
    zoningCompleted,
    estimationCompleted,
    permitReadyForCheckout,
    permitSubmitted,
    permitApproved,
    noPermitRequired,
  } = merged

  // Contractor matching unlocks if:
  //   1. permit submitted or approved, OR
  //   2. project doesn't need a permit and estimation is done
  const contractorMatchingUnlocked = !!(
    permitSubmitted ||
    permitApproved ||
    (noPermitRequired && estimationCompleted)
  )

  // Determine readiness state in priority order
  let nextState: ReadinessState = 'NOT_READY'

  if (permitApproved) {
    nextState = 'PERMIT_APPROVED'
  } else if (permitSubmitted) {
    nextState = 'PERMIT_SUBMITTED'
  } else if (noPermitRequired && conceptCompleted && zoningCompleted && estimationCompleted) {
    // No permit needed — skip straight to checkout / contractor matching
    nextState = 'READY_FOR_CHECKOUT'
  } else if (conceptCompleted && zoningCompleted && estimationCompleted && permitReadyForCheckout) {
    nextState = 'READY_FOR_CHECKOUT'
  } else if (conceptCompleted && zoningCompleted && estimationCompleted) {
    nextState = 'READY_FOR_PERMIT_REVIEW'
  } else if (conceptCompleted && zoningCompleted) {
    nextState = 'READY_FOR_ESTIMATE'
  } else if (conceptCompleted) {
    nextState = 'READY_FOR_ZONING_REVIEW'
  }

  // Determine next required service
  let nextRequiredService: string | undefined
  if (!conceptCompleted) {
    nextRequiredService = 'concept'
  } else if (!zoningCompleted) {
    nextRequiredService = 'zoning'
  } else if (!estimationCompleted) {
    nextRequiredService = 'estimation'
  } else if (!noPermitRequired && !permitReadyForCheckout) {
    nextRequiredService = 'permit'
  } else if (!noPermitRequired && !permitSubmitted) {
    nextRequiredService = 'permit_submission'
  }

  const writeData = {
    currentReadinessState: nextState,
    nextRequiredService,
    contractorMatchingUnlocked,
    ...completedServices,
  }

  // Upsert the gate record
  const gate = await prismaAny.serviceChainGate.upsert({
    where:  { projectId },
    create: { projectId, ...writeData },
    update: writeData,
  })

  return gate.currentReadinessState as ReadinessState
}

/**
 * Get gating requirements for a specific service
 */
export function getGatingRequirements(
  targetService: 'concept' | 'zoning' | 'estimation' | 'permit' | 'contractor_matching'
): {
  prerequisites: string[]
  description: string
  skipAllowed: boolean
} {
  const gatingMap: Record<string, ReturnType<typeof getGatingRequirements>> = {
    concept: {
      prerequisites: [],
      description: 'Entry point - no prerequisites',
      skipAllowed: false,
    },
    zoning: {
      prerequisites: ['concept'],
      description: 'Requires concept to be completed first',
      skipAllowed: false,
    },
    estimation: {
      prerequisites: ['concept', 'zoning'],
      description: 'Requires concept and zoning to be completed',
      skipAllowed: false,
    },
    permit: {
      prerequisites: ['concept', 'zoning', 'estimation'],
      description: 'Requires all prior services to be completed',
      skipAllowed: false,
    },
    contractor_matching: {
      prerequisites: ['concept', 'zoning', 'estimation'],
      description: 'Requires permit submission/approval, OR no permit needed with estimation complete',
      skipAllowed: false,
    },
  }

  return gatingMap[targetService] || gatingMap.concept
}

/**
 * Check if a service can be accessed based on chain gating
 * Returns { allowed: boolean, reason?: string, nextStep?: string }
 */
export async function checkServiceAccess(
  projectId: string,
  requestedService: 'concept' | 'zoning' | 'estimation' | 'permit' | 'contractor_matching'
): Promise<{
  allowed: boolean
  reason?: string
  nextStep?: string
  blocker?: string
}> {
  // Contractor matching has its own unlock logic — check the gate record directly
  // so that "no permit required" projects aren't blocked unnecessarily
  if (requestedService === 'contractor_matching') {
    const gate = await prismaAny.serviceChainGate.findFirst({ where: { projectId } })
    if (gate?.contractorMatchingUnlocked) return { allowed: true }
    return {
      allowed: false,
      reason: 'Contractor matching is not yet available for this project',
      nextStep: gate?.noPermitRequired
        ? 'Complete your cost estimation to unlock contractor matching'
        : 'Submit your permit package to unlock contractor matching',
      blocker: gate?.noPermitRequired ? 'estimation' : 'permit_submission',
    }
  }

  const currentState = await getProjectReadinessState(projectId)
  const gatingRequirements = getGatingRequirements(requestedService)

  // Map readiness states to accessible services
  const stateToServicesMap: Record<ReadinessState, string[]> = {
    NOT_READY:                ['concept'],
    NEEDS_MORE_INFO:          ['concept'],
    READY_FOR_CONCEPT:        ['concept'],
    READY_FOR_ZONING_REVIEW:  ['zoning'],
    READY_FOR_ESTIMATE:       ['estimation'],
    READY_FOR_PERMIT_REVIEW:  ['zoning', 'estimation', 'permit'],
    READY_FOR_CHECKOUT:       ['zoning', 'estimation', 'permit', 'checkout', 'contractor_matching'],
    PERMIT_SUBMITTED:         ['zoning', 'estimation', 'permit', 'checkout', 'contractor_matching'],
    PERMIT_APPROVED:          ['zoning', 'estimation', 'permit', 'checkout', 'contractor_matching'],
    REQUIRES_CONSULTATION:    ['concept'],
    BLOCKED:                  [],
  }

  const accessibleServices = stateToServicesMap[currentState] || []

  if (accessibleServices.includes(requestedService)) {
    return { allowed: true }
  }

  return {
    allowed: false,
    reason: `Cannot access ${requestedService} at this stage`,
    nextStep: `Current stage: ${currentState}. Complete the recommended service first.`,
    blocker: gatingRequirements.prerequisites.find(p => !accessibleServices.includes(p as any)),
  }
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Create gating middleware for a specific service
 * Blocks requests if prerequisites not met, returns 402 Payment Required with guidance
 */
export function createGatingMiddleware(
  service: 'concept' | 'zoning' | 'estimation' | 'permit'
) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      // Public endpoints - skip gating
      return
    }

    const userId = (request.user as any).id
    const projectId = request.body?.projectId || request.query?.projectId || (request.params as any)?.projectId

    if (!projectId) {
      // Can't enforce gating without project ID
      return
    }

    const access = await checkServiceAccess(projectId, service)

    if (!access.allowed) {
      return reply.code(402).send({
        error: 'PAYMENT_REQUIRED',
        code: 'SERVICE_GATING',
        message: access.reason,
        nextStep: access.nextStep,
        blocker: access.blocker,
        retryAfterMs: 0, // User must complete prerequisites
        canRetry: false,
      })
    }
  }
}

// ============================================================================
// SERVICE LINKING
// ============================================================================

/**
 * Link concept intake to zoning intake
 */
export async function linkConceptToZoning(
  conceptIntakeId: string,
  zoningIntakeId: string
): Promise<void> {
  await prismaAny.zoningIntake.update({
    where: { id: zoningIntakeId },
    data: { conceptIntakeId },
  })
}

/**
 * Link zoning to estimation
 */
export async function linkZoningToEstimation(
  zoningIntakeId: string,
  estimationIntakeId: string
): Promise<void> {
  await prismaAny.estimationIntake.update({
    where: { id: estimationIntakeId },
    data: {
      relatedZoningId: zoningIntakeId,
    },
  })
}

/**
 * Link estimation to permit
 */
export async function linkEstimationToPermit(
  estimationIntakeId: string,
  permitIntakeId: string
): Promise<void> {
  await prismaAny.permitIntake.update({
    where: { id: permitIntakeId },
    data: {
      relatedEstimateId: estimationIntakeId,
    },
  })
}

// ============================================================================
// CONVERSION TRACKING
// ============================================================================

/**
 * Track conversion event in the funnel
 */
export async function trackConversionEvent(
  funnelSessionId: string,
  event: string,
  metadata?: Record<string, any>
): Promise<void> {
  const funnel = await prisma.conversionFunnel.findFirst({
    where: { funnelSessionId },
  })

  if (!funnel) {
    // Create new funnel entry
    await prisma.conversionFunnel.create({
      data: {
        funnelSessionId,
        events: [event],
        eventTimestamps: { [event]: new Date().toISOString() },
        firstEventAt: new Date(),
        lastEventAt: new Date(),
      },
    })
  } else {
    // Update existing funnel
    const existingEvents = (funnel.events as string[]) || []
    const existingTimestamps = (funnel.eventTimestamps as Record<string, string>) || {}

    const updatedEvents = [...new Set([...existingEvents, event])]
    const updatedTimestamps = {
      ...existingTimestamps,
      [event]: new Date().toISOString(),
    }

    // Update completion flags
    const updateData: any = {
      events: updatedEvents,
      eventTimestamps: updatedTimestamps,
      lastEventAt: new Date(),
    }

    if (event.includes('CONCEPT') && event.includes('PAID')) {
      updateData.conceptCompleted = true
    }
    if (event.includes('ZONING') && event.includes('PAID')) {
      updateData.zoningCompleted = true
    }
    if (event.includes('ESTIMATION') && event.includes('PAID')) {
      updateData.estimationCompleted = true
    }
    if (event.includes('PERMIT') && event.includes('PAID')) {
      updateData.permitCompleted = true
    }
    if (
      updateData.conceptCompleted &&
      updateData.zoningCompleted &&
      updateData.estimationCompleted &&
      updateData.permitCompleted
    ) {
      updateData.fullChainCompleted = true
    }

    await prisma.conversionFunnel.update({
      where: { funnelSessionId },
      data: updateData,
    })
  }
}

// ============================================================================
// ORCHESTRATION ROUTES
// ============================================================================

/**
 * Register orchestration endpoints
 * GET /orchestration/chain/{projectId} - Get current chain status
 * GET /orchestration/readiness/{projectId} - Get readiness state
 * POST /orchestration/chain/{projectId}/advance - Advance to next service
 */
export async function registerOrchestrationRoutes(fastify: FastifyInstance) {
  /**
   * GET /orchestration/chain/{projectId}
   * Get full chain status for a project
   */
  fastify.get<{ Params: { projectId: string } }>(
    '/orchestration/chain/:projectId',
    async (request, reply) => {
      try {
        const { projectId } = request.params
        const currentState = await getProjectReadinessState(projectId)

        const gate = await prisma.serviceChainGate.findFirst({
          where: { projectId },
        })

        return reply.send({
          projectId,
          currentState,
          chain: gate?.chain || [],
          completedServices: {
            concept: gate?.conceptCompleted || false,
            zoning: gate?.zoningCompleted || false,
            estimation: gate?.estimationCompleted || false,
            permit: gate?.permitReadyForCheckout || false,
          },
          nextRequiredService: gate?.nextRequiredService,
        })
      } catch (error) {
        fastify.log.error(error)
        throw error
      }
    }
  )

  /**
   * GET /orchestration/readiness/{projectId}
   * Get readiness state and next steps
   */
  fastify.get<{ Params: { projectId: string } }>(
    '/orchestration/readiness/:projectId',
    async (request, reply) => {
      try {
        const { projectId } = request.params
        const currentState = await getProjectReadinessState(projectId)
        const gatingReqs = getGatingRequirements('concept') // Placeholder

        const stateDescriptions: Record<ReadinessState, string> = {
          NOT_READY: 'Not started',
          NEEDS_MORE_INFO: 'Additional information needed',
          READY_FOR_CONCEPT: 'Ready for concept generation',
          READY_FOR_ZONING_REVIEW: 'Proceed to zoning analysis',
          READY_FOR_ESTIMATE: 'Proceed to cost estimation',
          READY_FOR_PERMIT_REVIEW: 'Proceed to permit preparation',
          READY_FOR_CHECKOUT: 'Ready for payment and order creation',
          REQUIRES_CONSULTATION: 'Schedule consultation with specialist',
          BLOCKED: 'Service temporarily unavailable',
        }

        return reply.send({
          projectId,
          readinessState: currentState,
          description: stateDescriptions[currentState],
          nextAction:
            currentState === 'NOT_READY' ? 'Start with concept intake' : `Continue to next service`,
        })
      } catch (error) {
        fastify.log.error(error)
        throw error
      }
    }
  )

  fastify.log.info('Orchestration routes registered')
}
