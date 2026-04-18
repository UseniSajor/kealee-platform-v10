/**
 * Service Chain Gating & Orchestration
 * Implements the sequential service chain: Concept → Zoning → Estimation → Permit
 * Prevents users from proceeding without completing prerequisite services
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '@kealee/database'
import type { ReadinessState } from '@kealee/database'

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
  const gate = await prisma.serviceChainGate.findFirst({
    where: { projectId },
  })

  if (!gate) {
    // Create new gate if it doesn't exist
    const newGate = await prisma.serviceChainGate.create({
      data: {
        projectId,
        currentReadinessState: 'NOT_READY' as ReadinessState,
      },
    })
    return newGate.currentReadinessState
  }

  return gate.currentReadinessState as ReadinessState
}

/**
 * Update readiness state based on completed services
 */
export async function updateReadinessState(
  projectId: string,
  completedServices: {
    conceptCompleted?: boolean
    zoningCompleted?: boolean
    estimationCompleted?: boolean
    permitReadyForCheckout?: boolean
  }
): Promise<ReadinessState> {
  // Determine next readiness state based on completed services
  let nextState: ReadinessState = 'NOT_READY'

  if (completedServices.conceptCompleted && !completedServices.zoningCompleted) {
    nextState = 'READY_FOR_ZONING_REVIEW'
  } else if (completedServices.conceptCompleted && completedServices.zoningCompleted && !completedServices.estimationCompleted) {
    nextState = 'READY_FOR_ESTIMATE'
  } else if (
    completedServices.conceptCompleted &&
    completedServices.zoningCompleted &&
    completedServices.estimationCompleted &&
    !completedServices.permitReadyForCheckout
  ) {
    nextState = 'READY_FOR_PERMIT_REVIEW'
  } else if (
    completedServices.conceptCompleted &&
    completedServices.zoningCompleted &&
    completedServices.estimationCompleted &&
    completedServices.permitReadyForCheckout
  ) {
    nextState = 'READY_FOR_CHECKOUT'
  }

  // Determine next required service
  let nextRequiredService: string | undefined = undefined
  if (!completedServices.conceptCompleted) {
    nextRequiredService = 'concept'
  } else if (!completedServices.zoningCompleted) {
    nextRequiredService = 'zoning'
  } else if (!completedServices.estimationCompleted) {
    nextRequiredService = 'estimation'
  } else if (!completedServices.permitReadyForCheckout) {
    nextRequiredService = 'permit'
  }

  // Update gate
  const gate = await prisma.serviceChainGate.upsert({
    where: {
      projectId,
    },
    create: {
      projectId,
      currentReadinessState: nextState,
      nextRequiredService,
      ...completedServices,
    },
    update: {
      currentReadinessState: nextState,
      nextRequiredService,
      ...completedServices,
    },
  })

  return gate.currentReadinessState as ReadinessState
}

/**
 * Get gating requirements for a specific service
 */
export function getGatingRequirements(
  targetService: 'concept' | 'zoning' | 'estimation' | 'permit'
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
      skipAllowed: false, // Zoning is mandatory for most projects
    },
    estimation: {
      prerequisites: ['concept', 'zoning'],
      description: 'Requires concept and zoning to be completed',
      skipAllowed: false, // Estimation is mandatory
    },
    permit: {
      prerequisites: ['concept', 'zoning', 'estimation'],
      description: 'Requires all prior services to be completed',
      skipAllowed: false, // Permits require everything
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
  requestedService: 'concept' | 'zoning' | 'estimation' | 'permit'
): Promise<{
  allowed: boolean
  reason?: string
  nextStep?: string
  blocker?: string
}> {
  const currentState = await getProjectReadinessState(projectId)
  const gatingRequirements = getGatingRequirements(requestedService)

  // Map readiness states to accessible services
  const stateToServicesMap: Record<ReadinessState, string[]> = {
    NOT_READY: ['concept'],
    NEEDS_MORE_INFO: ['concept'],
    READY_FOR_CONCEPT: ['concept'],
    READY_FOR_ZONING_REVIEW: ['zoning'],
    READY_FOR_ESTIMATE: ['estimation'],
    READY_FOR_PERMIT_REVIEW: ['zoning', 'estimation', 'permit'], // Can review/revise
    READY_FOR_CHECKOUT: ['zoning', 'estimation', 'permit', 'checkout'],
    REQUIRES_CONSULTATION: ['concept'],
    BLOCKED: [],
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
  await prisma.zoningIntake.update({
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
  await prisma.estimationIntake.update({
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
  await prisma.permitIntake.update({
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
