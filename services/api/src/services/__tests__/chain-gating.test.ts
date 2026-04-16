/**
 * Chain Gating & Orchestration Tests
 * Tests concept → estimation → permits flow
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { chainGatingService, ReadinessState, GatingReason } from '../chain-gating.service'

// Mock prismaAny
vi.mock('../../utils/prisma-helper', () => ({
  prismaAny: {
    conceptIntake: {
      findUnique: vi.fn(),
    },
    estimationIntake: {
      findUnique: vi.fn(),
    },
    permitIntake: {
      findUnique: vi.fn(),
    },
    permitAuthorization: {
      findFirst: vi.fn(),
    },
    serviceChainGate: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}))

describe('Chain Gating & Orchestration', () => {
  describe('Concept to Estimation Flow', () => {
    it('should allow progression with complete concept intake', async () => {
      const { prismaAny } = await import('../../utils/prisma-helper')
      vi.mocked(prismaAny.conceptIntake.findUnique).mockResolvedValue({
        id: 'concept-1',
        projectType: 'renovation',
        description: 'Kitchen renovation',
        address: '123 Main St, DC',
        readinessState: 'READY_FOR_ESTIMATE',
      } as any)

      const result = await chainGatingService.evaluateConceptToEstimation('concept-1')

      expect(result.allowed).toBe(true)
      expect(result.readinessState).toBe(ReadinessState.READY_FOR_ESTIMATION)
      expect(result.reasons.length).toBe(0)
    })

    it('should block progression with missing scope', async () => {
      const { prismaAny } = await import('../../utils/prisma-helper')
      vi.mocked(prismaAny.conceptIntake.findUnique).mockResolvedValue({
        id: 'concept-1',
        projectType: '',
        description: '',
        address: '123 Main St, DC',
      } as any)

      const result = await chainGatingService.evaluateConceptToEstimation('concept-1')

      expect(result.allowed).toBe(false)
      expect(result.reasons).toContain(GatingReason.MISSING_SCOPE)
    })

    it('should block progression with missing location', async () => {
      const { prismaAny } = await import('../../utils/prisma-helper')
      vi.mocked(prismaAny.conceptIntake.findUnique).mockResolvedValue({
        id: 'concept-1',
        projectType: 'renovation',
        description: 'Kitchen renovation',
        address: '',
      } as any)

      const result = await chainGatingService.evaluateConceptToEstimation('concept-1')

      expect(result.allowed).toBe(false)
      expect(result.reasons).toContain(GatingReason.MISSING_LOCATION)
    })

    it('should flag architect requirement', async () => {
      const { prismaAny } = await import('../../utils/prisma-helper')
      vi.mocked(prismaAny.conceptIntake.findUnique).mockResolvedValue({
        id: 'concept-1',
        projectType: 'addition',
        description: 'Home addition',
        address: '123 Main St, DC',
        readinessState: 'REQUIRES_ARCHITECT',
      } as any)

      const result = await chainGatingService.evaluateConceptToEstimation('concept-1')

      expect(result.allowed).toBe(false)
      expect(result.reasons).toContain(GatingReason.REQUIRES_ARCHITECT)
    })
  })

  describe('Estimation to Permits Flow', () => {
    it('should allow progression with complete estimation', async () => {
      const { prismaAny } = await import('../../utils/prisma-helper')
      vi.mocked(prismaAny.estimationIntake.findUnique).mockResolvedValue({
        id: 'estimation-1',
        projectType: 'renovation',
        projectScope: 'Kitchen and bathroom',
        address: '123 Main St, DC',
        hasDesignDrawings: true,
        requiresArchitecturalReview: false,
        requiresEngineeringReview: false,
      } as any)

      const result = await chainGatingService.evaluateEstimationToPermits('estimation-1')

      expect(result.allowed).toBe(true)
      expect(result.readinessState).toBe(ReadinessState.READY_FOR_PERMIT_REVIEW)
    })

    it('should flag missing design drawings', async () => {
      const { prismaAny } = await import('../../utils/prisma-helper')
      vi.mocked(prismaAny.estimationIntake.findUnique).mockResolvedValue({
        id: 'estimation-1',
        projectType: 'renovation',
        projectScope: 'Kitchen and bathroom',
        address: '123 Main St, DC',
        hasDesignDrawings: false,
        requiresArchitecturalReview: true,
        requiresEngineeringReview: false,
      } as any)

      const result = await chainGatingService.evaluateEstimationToPermits('estimation-1')

      expect(result.allowed).toBe(false)
      expect(result.reasons).toContain(GatingReason.REQUIRES_ARCHITECT)
    })
  })

  describe('Permit Checkout Readiness', () => {
    it('should allow checkout with complete permit intake', async () => {
      const { prismaAny } = await import('../../utils/prisma-helper')
      vi.mocked(prismaAny.permitIntake.findUnique).mockResolvedValue({
        id: 'permit-1',
        jurisdiction: 'Washington, DC',
        projectScope: 'Kitchen renovation',
        involvesStructuralChange: false,
        hasDesignDocuments: true,
        tier: 'submission',
      } as any)

      const result = await chainGatingService.evaluatePermitCheckoutReadiness('permit-1')

      expect(result.allowed).toBe(true)
      expect(result.readinessState).toBe(ReadinessState.READY_FOR_CHECKOUT)
    })

    it('should block checkout with missing design documents', async () => {
      const { prismaAny } = await import('../../utils/prisma-helper')
      vi.mocked(prismaAny.permitIntake.findUnique).mockResolvedValue({
        id: 'permit-1',
        jurisdiction: 'Washington, DC',
        projectScope: 'Structural addition',
        involvesStructuralChange: true,
        hasDesignDocuments: false,
        tier: 'submission',
      } as any)

      const result = await chainGatingService.evaluatePermitCheckoutReadiness('permit-1')

      expect(result.allowed).toBe(false)
      expect(result.reasons).toContain(GatingReason.MISSING_DRAWINGS)
    })

    it('should require authorization for managed submission', async () => {
      const { prismaAny } = await import('../../utils/prisma-helper')
      vi.mocked(prismaAny.permitIntake.findUnique).mockResolvedValue({
        id: 'permit-1',
        jurisdiction: 'Washington, DC',
        projectScope: 'Full renovation',
        involvesStructuralChange: false,
        hasDesignDocuments: true,
        tier: 'inspection_coordination', // Managed submission tier
      } as any)
      vi.mocked(prismaAny.permitAuthorization.findFirst).mockResolvedValue(null)

      const result = await chainGatingService.evaluatePermitCheckoutReadiness('permit-1')

      expect(result.allowed).toBe(false)
      expect(result.reasons).toContain(GatingReason.INCOMPLETE_AUTHORIZATION)
    })
  })

  describe('Project Readiness Summary', () => {
    it('should return overall project readiness', async () => {
      const { prismaAny } = await import('../../utils/prisma-helper')

      // Mock successful concept
      vi.mocked(prismaAny.conceptIntake.findUnique).mockResolvedValue({
        id: 'concept-1',
        projectType: 'renovation',
        description: 'Kitchen',
        address: '123 Main St',
        readinessState: 'READY_FOR_ESTIMATE',
      } as any)

      const readiness = await chainGatingService.getProjectReadiness({
        conceptIntakeId: 'concept-1',
      })

      expect(readiness.completedStages).toContain('concept')
      expect(readiness.nextStage).toBe('estimation')
      expect(readiness.canProceedToCheckout).toBe(false)
    })

    it('should track multiple completed stages', async () => {
      const { prismaAny } = await import('../../utils/prisma-helper')

      vi.mocked(prismaAny.conceptIntake.findUnique).mockResolvedValue({
        id: 'concept-1',
        projectType: 'renovation',
        description: 'Kitchen',
        address: '123 Main St',
        readinessState: 'READY_FOR_ESTIMATE',
      } as any)

      vi.mocked(prismaAny.estimationIntake.findUnique).mockResolvedValue({
        id: 'estimation-1',
        projectType: 'renovation',
        projectScope: 'Kitchen and bath',
        address: '123 Main St',
        hasDesignDrawings: true,
        requiresArchitecturalReview: false,
        requiresEngineeringReview: false,
      } as any)

      const readiness = await chainGatingService.getProjectReadiness({
        conceptIntakeId: 'concept-1',
        estimationIntakeId: 'estimation-1',
      })

      expect(readiness.completedStages).toContain('concept')
      expect(readiness.completedStages).toContain('estimation')
      expect(readiness.nextStage).toBe('permits')
    })
  })

  describe('Gating Reasons', () => {
    it('should provide clear reasons for blocking', async () => {
      const { prismaAny } = await import('../../utils/prisma-helper')
      vi.mocked(prismaAny.conceptIntake.findUnique).mockResolvedValue({
        id: 'concept-1',
        projectType: '',
        description: '',
        address: '',
        readinessState: 'REQUIRES_ARCHITECT',
      } as any)

      const result = await chainGatingService.evaluateConceptToEstimation('concept-1')

      expect(result.reasons).toContain(GatingReason.MISSING_SCOPE)
      expect(result.reasons).toContain(GatingReason.MISSING_LOCATION)
      expect(result.reasons).toContain(GatingReason.REQUIRES_ARCHITECT)
    })
  })
})
