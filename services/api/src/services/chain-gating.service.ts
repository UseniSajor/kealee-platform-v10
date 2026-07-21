/**
 * CHAIN GATING & ORCHESTRATION SERVICE
 * Manages readiness states and flow between concept, estimation, and permits
 */

import { prismaAny } from '../utils/prisma-helper'

// ============================================================================
// TYPES
// ============================================================================

export enum ReadinessState {
  NOT_READY = 'NOT_READY',
  NEEDS_MORE_INFO = 'NEEDS_MORE_INFO',
  READY_FOR_CONCEPT = 'READY_FOR_CONCEPT',
  READY_FOR_ESTIMATION = 'READY_FOR_ESTIMATION',
  READY_FOR_PERMIT_REVIEW = 'READY_FOR_PERMIT_REVIEW',
  READY_FOR_CHECKOUT = 'READY_FOR_CHECKOUT',
  REQUIRES_ARCHITECT = 'REQUIRES_ARCHITECT',
  REQUIRES_ENGINEER = 'REQUIRES_ENGINEER',
  BLOCKED = 'BLOCKED',
}

export enum GatingReason {
  MISSING_SCOPE = 'MISSING_SCOPE',
  MISSING_LOCATION = 'MISSING_LOCATION',
  MISSING_VALUATION = 'MISSING_VALUATION',
  HIGH_ZONING_RISK = 'HIGH_ZONING_RISK',
  REQUIRES_ARCHITECT = 'REQUIRES_ARCHITECT',
  REQUIRES_ENGINEER = 'REQUIRES_ENGINEER',
  MISSING_DRAWINGS = 'MISSING_DRAWINGS',
  JURISDICTION_RESTRICTION = 'JURISDICTION_RESTRICTION',
  MISSING_ESTIMATE = 'MISSING_ESTIMATE',
  INCOMPLETE_AUTHORIZATION = 'INCOMPLETE_AUTHORIZATION',
}

export interface ChainGatingInput {
  projectId?: string
  conceptIntakeId?: string
  estimationIntakeId?: string
  permitIntakeId?: string
  zoningIntakeId?: string
}

// ============================================================================
// SERVICE
// ============================================================================

class ChainGatingService {
  /**
   * Evaluate concept → estimation flow
   * Returns readiness state and gating reasons
   */
  async evaluateConceptToEstimation(conceptIntakeId: string): Promise<{
    allowed: boolean
    readinessState: ReadinessState
    reasons: GatingReason[]
    nextStep: string
  }> {
    const concept = await prismaAny.conceptIntake.findUnique({
      where: { id: conceptIntakeId },
    })

    if (!concept) {
      return {
        allowed: false,
        readinessState: ReadinessState.NOT_READY,
        reasons: [GatingReason.MISSING_SCOPE],
        nextStep: 'Complete concept intake',
      }
    }

    const reasons: GatingReason[] = []

    // Check required fields
    if (!concept.projectType || !concept.description) {
      reasons.push(GatingReason.MISSING_SCOPE)
    }
    if (!concept.address) {
      reasons.push(GatingReason.MISSING_LOCATION)
    }

    // Check complexity flags
    if (concept.readinessState === 'REQUIRES_ARCHITECT') {
      reasons.push(GatingReason.REQUIRES_ARCHITECT)
    }
    if (concept.readinessState === 'REQUIRES_ENGINEER') {
      reasons.push(GatingReason.REQUIRES_ENGINEER)
    }

    const allowed = reasons.length === 0
    const readinessState = allowed ? ReadinessState.READY_FOR_ESTIMATION : ReadinessState.NEEDS_MORE_INFO

    return {
      allowed,
      readinessState,
      reasons,
      nextStep: allowed ? 'Proceed to estimation' : 'Complete concept requirements',
    }
  }

  /**
   * Evaluate estimation → permits flow
   * Returns readiness state and gating reasons
   */
  async evaluateEstimationToPermits(estimationIntakeId: string): Promise<{
    allowed: boolean
    readinessState: ReadinessState
    reasons: GatingReason[]
    nextStep: string
  }> {
    const estimation = await prismaAny.estimationIntake.findUnique({
      where: { id: estimationIntakeId },
    })

    if (!estimation) {
      return {
        allowed: false,
        readinessState: ReadinessState.NOT_READY,
        reasons: [GatingReason.MISSING_SCOPE],
        nextStep: 'Complete estimation intake',
      }
    }

    const reasons: GatingReason[] = []

    // Check required fields
    if (!estimation.projectScope || !estimation.projectType) {
      reasons.push(GatingReason.MISSING_SCOPE)
    }
    if (!estimation.address) {
      reasons.push(GatingReason.MISSING_LOCATION)
    }

    // Check architectural/engineering requirements
    if (estimation.requiresArchitecturalReview && !estimation.hasDesignDrawings) {
      reasons.push(GatingReason.REQUIRES_ARCHITECT)
    }
    if (estimation.requiresEngineeringReview) {
      reasons.push(GatingReason.REQUIRES_ENGINEER)
    }

    const allowed = reasons.length === 0
    const readinessState = allowed ? ReadinessState.READY_FOR_PERMIT_REVIEW : ReadinessState.NEEDS_MORE_INFO

    return {
      allowed,
      readinessState,
      reasons,
      nextStep: allowed ? 'Review permit requirements' : 'Address estimation requirements',
    }
  }

  /**
   * Evaluate permit checkout readiness
   * Returns readiness state and gating reasons
   */
  async evaluatePermitCheckoutReadiness(permitIntakeId: string): Promise<{
    allowed: boolean
    readinessState: ReadinessState
    reasons: GatingReason[]
    nextStep: string
  }> {
    const permit = await prismaAny.permitIntake.findUnique({
      where: { id: permitIntakeId },
    })

    if (!permit) {
      return {
        allowed: false,
        readinessState: ReadinessState.NOT_READY,
        reasons: [GatingReason.MISSING_SCOPE],
        nextStep: 'Complete permit intake',
      }
    }

    const reasons: GatingReason[] = []

    // Check required fields
    if (!permit.jurisdiction) {
      reasons.push(GatingReason.JURISDICTION_RESTRICTION)
    }
    if (!permit.projectScope) {
      reasons.push(GatingReason.MISSING_SCOPE)
    }

    // Check for design documents if required
    if (permit.involvesStructuralChange && !permit.hasDesignDocuments) {
      reasons.push(GatingReason.MISSING_DRAWINGS)
    }

    // Check authorization for managed submission
    if (permit.tier === 'inspection_coordination') {
      // Permit authorization required for managed submission
      const authorization = await prismaAny.permitAuthorization.findFirst({
        where: {
          projectId: permit.id,
          consentGiven: true,
        },
      })
      if (!authorization) {
        reasons.push(GatingReason.INCOMPLETE_AUTHORIZATION)
      }
    }

    const allowed = reasons.length === 0
    const readinessState = allowed ? ReadinessState.READY_FOR_CHECKOUT : ReadinessState.NEEDS_MORE_INFO

    return {
      allowed,
      readinessState,
      reasons,
      nextStep: allowed ? 'Proceed to checkout' : 'Complete permit requirements',
    }
  }

  /**
   * Get overall project readiness
   */
  async getProjectReadiness(
    input: ChainGatingInput
  ): Promise<{
    currentState: ReadinessState
    completedStages: string[]
    nextStage: string
    blockers: GatingReason[]
    canProceedToCheckout: boolean
  }> {
    const completedStages: string[] = []
    const blockers: GatingReason[] = []
    let nextStage = 'concept'

    // Check concept
    if (input.conceptIntakeId) {
      const conceptEval = await this.evaluateConceptToEstimation(input.conceptIntakeId)
      completedStages.push('concept')
      if (!conceptEval.allowed) {
        blockers.push(...conceptEval.reasons)
      } else {
        nextStage = 'estimation'
      }
    }

    // Check estimation
    if (input.estimationIntakeId && completedStages.includes('concept')) {
      const estimationEval = await this.evaluateEstimationToPermits(input.estimationIntakeId)
      completedStages.push('estimation')
      if (!estimationEval.allowed) {
        blockers.push(...estimationEval.reasons)
      } else {
        nextStage = 'permits'
      }
    }

    // Check permits
    if (input.permitIntakeId && completedStages.includes('estimation')) {
      const permitEval = await this.evaluatePermitCheckoutReadiness(input.permitIntakeId)
      completedStages.push('permits')
      if (!permitEval.allowed) {
        blockers.push(...permitEval.reasons)
      }
    }

    // Determine overall state
    let currentState = ReadinessState.NOT_READY
    if (completedStages.length === 0) {
      currentState = ReadinessState.READY_FOR_CONCEPT
    } else if (completedStages.includes('concept') && !completedStages.includes('estimation')) {
      currentState = blockers.length === 0 ? ReadinessState.READY_FOR_ESTIMATION : ReadinessState.NEEDS_MORE_INFO
    } else if (completedStages.includes('estimation') && !completedStages.includes('permits')) {
      currentState = blockers.length === 0 ? ReadinessState.READY_FOR_PERMIT_REVIEW : ReadinessState.NEEDS_MORE_INFO
    } else if (completedStages.includes('permits')) {
      currentState = blockers.length === 0 ? ReadinessState.READY_FOR_CHECKOUT : ReadinessState.NEEDS_MORE_INFO
    }

    const canProceedToCheckout = completedStages.includes('permits') && blockers.length === 0

    return {
      currentState,
      completedStages,
      nextStage,
      blockers,
      canProceedToCheckout,
    }
  }

  /**
   * Update service chain gate in database
   */
  async updateServiceChainGate(
    input: ChainGatingInput,
    readinessState: ReadinessState,
    blockedReason?: string
  ) {
    let gate = await prismaAny.serviceChainGate.findFirst({
      where: { projectId: input.projectId },
    })

    const data = {
      projectId: input.projectId,
      conceptIntakeId: input.conceptIntakeId,
      conceptCompleted: !!input.conceptIntakeId,
      estimationIntakeId: input.estimationIntakeId,
      estimationCompleted: !!input.estimationIntakeId,
      permitIntakeId: input.permitIntakeId,
      permitReadyForCheckout: readinessState === ReadinessState.READY_FOR_CHECKOUT,
      currentReadinessState: readinessState,
      blockedReason,
    }

    if (!gate) {
      gate = await prismaAny.serviceChainGate.create({ data })
    } else {
      gate = await prismaAny.serviceChainGate.update({
        where: { id: gate.id },
        data,
      })
    }

    return gate
  }
}

export const chainGatingService = new ChainGatingService()
