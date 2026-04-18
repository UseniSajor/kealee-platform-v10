/**
 * Chain Gating Middleware
 * Enforces EstimateBot and PermitBot execution dependencies
 */

import type { FastifyReply, FastifyRequest } from 'fastify'

/**
 * Readiness state enum
 * Standardized states across all bots for consistent gating
 */
export enum ReadinessState {
  NOT_READY = 'NOT_READY',
  NEEDS_MORE_INFO = 'NEEDS_MORE_INFO',
  READY_FOR_ESTIMATE = 'READY_FOR_ESTIMATE',
  READY_FOR_PERMIT_REVIEW = 'READY_FOR_PERMIT_REVIEW',
  REQUIRES_DESIGN_HANDOFF = 'REQUIRES_DESIGN_HANDOFF',
  REQUIRES_ARCHITECT = 'REQUIRES_ARCHITECT',
  REQUIRES_ENGINEER = 'REQUIRES_ENGINEER',
  READY_FOR_CHECKOUT = 'READY_FOR_CHECKOUT',
}

/**
 * Gate error codes
 * Standardized errors for gating enforcement
 */
export enum GateErrorCode {
  // Missing prerequisite
  MISSING_DESIGN_CONCEPT = 'MISSING_DESIGN_CONCEPT',
  MISSING_ESTIMATE = 'MISSING_ESTIMATE',

  // Invalid state
  DESIGN_CONCEPT_NOT_READY = 'DESIGN_CONCEPT_NOT_READY',
  ESTIMATE_NOT_READY = 'ESTIMATE_NOT_READY',

  // Invalid data
  INVALID_DESIGN_CONCEPT = 'INVALID_DESIGN_CONCEPT',
  INVALID_ESTIMATE = 'INVALID_ESTIMATE',

  // User action required
  DESIGN_NEEDS_REVISION = 'DESIGN_NEEDS_REVISION',
  ESTIMATE_NEEDS_REVISION = 'ESTIMATE_NEEDS_REVISION',
}

/**
 * Gate response when execution is blocked
 */
export interface GateResponse {
  blocked: true
  reason: string
  code: GateErrorCode
  nextSteps: string[]
  canRetry: boolean
  retryAfterMs?: number
}

/**
 * Gate response when execution is allowed
 */
export interface AllowResponse {
  blocked: false
  reason?: string
}

export type GateResult = GateResponse | AllowResponse

/**
 * EstimateBot → DesignBot Gating
 * EstimateBot requires valid DesignBot output before execution
 *
 * @param designBotOutputId - ID of the DesignBot output to validate
 * @param projectContext - Current project context
 * @returns GateResult with decision and reasoning
 */
export async function gateEstimateOnDesign(
  designBotOutputId: string | undefined,
  projectContext: {
    intakeId: string
    hasDesignConcept: boolean
    designConceptState?: string
  }
): Promise<GateResult> {
  // Must have a design concept
  if (!designBotOutputId || !projectContext.hasDesignConcept) {
    return {
      blocked: true,
      reason:
        'This estimate requires a design concept to be generated first. Please complete design generation before requesting cost estimation.',
      code: GateErrorCode.MISSING_DESIGN_CONCEPT,
      nextSteps: [
        'Return to Design Generation',
        'After design is complete, EstimateBot will analyze scope and generate cost estimate',
      ],
      canRetry: true,
    }
  }

  // Design concept must be in a valid state
  if (projectContext.designConceptState !== 'APPROVED' && projectContext.designConceptState !== 'READY_FOR_ESTIMATE') {
    return {
      blocked: true,
      reason: `Design is currently in state: ${projectContext.designConceptState}. Wait for design approval before requesting estimate.`,
      code: GateErrorCode.DESIGN_CONCEPT_NOT_READY,
      nextSteps: ['Check design status', 'Request design revision if needed', 'Wait for design to be ready'],
      canRetry: true,
      retryAfterMs: 10000,
    }
  }

  // Validation passed
  return {
    blocked: false,
    reason: 'Design concept validated. EstimateBot ready to execute.',
  }
}

/**
 * PermitBot → EstimateBot Gating
 * PermitBot requires valid EstimateBot output before execution
 *
 * @param estimateBotOutputId - ID of the EstimateBot output to validate
 * @param projectContext - Current project context
 * @returns GateResult with decision and reasoning
 */
export async function gatePermitOnEstimate(
  estimateBotOutputId: string | undefined,
  projectContext: {
    intakeId: string
    hasEstimate: boolean
    estimateState?: string
    estimateConfidenceScore?: number
  }
): Promise<GateResult> {
  // Must have an estimate
  if (!estimateBotOutputId || !projectContext.hasEstimate) {
    return {
      blocked: true,
      reason:
        'Permit preparation requires a cost estimate. Please complete cost estimation before proceeding with permit guidance.',
      code: GateErrorCode.MISSING_ESTIMATE,
      nextSteps: ['Go back to Cost Estimation', 'Get cost estimate for your project', 'Return to permit process'],
      canRetry: true,
    }
  }

  // Estimate must be in ready state
  if (projectContext.estimateState !== 'APPROVED' && projectContext.estimateState !== 'READY_FOR_PERMIT') {
    return {
      blocked: true,
      reason: `Estimate is currently in state: ${projectContext.estimateState}. Wait for estimate approval before proceeding with permits.`,
      code: GateErrorCode.ESTIMATE_NOT_READY,
      nextSteps: [
        'Review estimate details',
        'Request estimate revision if needed',
        'Wait for estimate to be finalized',
      ],
      canRetry: true,
      retryAfterMs: 10000,
    }
  }

  // Estimate must have adequate confidence
  const minConfidenceScore = 60
  if (projectContext.estimateConfidenceScore !== undefined && projectContext.estimateConfidenceScore < minConfidenceScore) {
    return {
      blocked: true,
      reason: `Estimate confidence is ${projectContext.estimateConfidenceScore}%, below the ${minConfidenceScore}% threshold for permit planning. Please request estimate revision.`,
      code: GateErrorCode.ESTIMATE_NEEDS_REVISION,
      nextSteps: ['Request estimate revision with additional details', 'Provide more design documentation', 'Retry permit analysis'],
      canRetry: true,
    }
  }

  // Validation passed
  return {
    blocked: false,
    reason: 'Estimate validated. PermitBot ready to execute.',
  }
}

/**
 * Middleware factory for gating on Fastify
 * Returns middleware that can be applied to routes
 */
export function createGatingMiddleware(gateFn: () => Promise<GateResult>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const gateResult = await gateFn()

    if (gateResult.blocked) {
      return reply.status(402).send({
        error: 'BLOCKED_BY_GATE',
        message: gateResult.reason,
        code: gateResult.code,
        nextSteps: gateResult.nextSteps,
        canRetry: gateResult.canRetry,
        retryAfterMs: gateResult.retryAfterMs,
      })
    }

    // Gate passed, allow request to proceed
    // Middleware returns without ending request processing
  }
}

/**
 * Helper: Check if a state is terminal (won't change)
 */
export function isTerminalState(state: string): boolean {
  const terminalStates = ['APPROVED', 'REJECTED', 'ARCHIVED', 'ERROR']
  return terminalStates.includes(state)
}

/**
 * Helper: Get human-readable state description
 */
export function describeState(state: string): string {
  const descriptions: Record<string, string> = {
    NOT_READY: 'Not yet ready',
    NEEDS_MORE_INFO: 'Needs more information',
    READY_FOR_ESTIMATE: 'Ready for cost estimation',
    READY_FOR_PERMIT_REVIEW: 'Ready for permit review',
    IN_PROGRESS: 'Currently processing',
    APPROVED: 'Ready to proceed',
    REVISION_REQUESTED: 'Revision requested',
    REJECTED: 'Not approved',
  }
  return descriptions[state] ?? state
}
