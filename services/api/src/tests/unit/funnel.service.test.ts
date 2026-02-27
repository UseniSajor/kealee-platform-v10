import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Prisma
const mockPrisma = {
  funnelSession: {
    create: vi.fn(),
    update: vi.fn(),
    findUnique: vi.fn(),
  },
}

vi.mock('../../utils/prisma-helper', () => ({
  prisma: mockPrisma,
}))

// Mock page-builder
vi.mock('@kealee/page-builder', () => ({
  buildPage: vi.fn().mockResolvedValue({
    sessionId: 'test-session-id',
    sections: [],
    layout: ['hero'],
    generatedAt: new Date().toISOString(),
  }),
  getProgress: vi.fn().mockResolvedValue(50),
  getCachedPage: vi.fn().mockResolvedValue(null),
}))

import { FunnelService } from '../../modules/funnel/funnel.service'

describe('FunnelService', () => {
  let service: FunnelService

  beforeEach(() => {
    service = new FunnelService()
    vi.clearAllMocks()
  })

  describe('createSession', () => {
    it('should create a session with IP and UTM params', async () => {
      const mockSession = { id: 'test-id', status: 'IN_PROGRESS', currentStep: 0 }
      mockPrisma.funnelSession.create.mockResolvedValue(mockSession)

      const result = await service.createSession({
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        utmSource: 'google',
        utmMedium: 'cpc',
        utmCampaign: 'spring-2026',
      })

      expect(result.id).toBe('test-id')
      expect(mockPrisma.funnelSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ipAddress: '127.0.0.1',
          utmSource: 'google',
          status: 'IN_PROGRESS',
          currentStep: 0,
        }),
      })
    })

    it('should create a session without optional params', async () => {
      const mockSession = { id: 'test-id-2', status: 'IN_PROGRESS', currentStep: 0 }
      mockPrisma.funnelSession.create.mockResolvedValue(mockSession)

      const result = await service.createSession({})
      expect(result.id).toBe('test-id-2')
    })
  })

  describe('updateSession', () => {
    it('should update session fields', async () => {
      const mockSession = { id: 'test-id', userType: 'HOMEOWNER', currentStep: 1 }
      mockPrisma.funnelSession.update.mockResolvedValue(mockSession)

      const result = await service.updateSession('test-id', {
        userType: 'HOMEOWNER',
        currentStep: 1,
      })

      expect(result.userType).toBe('HOMEOWNER')
      expect(mockPrisma.funnelSession.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: expect.objectContaining({
          userType: 'HOMEOWNER',
          currentStep: 1,
        }),
      })
    })

    it('should only include provided fields', async () => {
      mockPrisma.funnelSession.update.mockResolvedValue({ id: 'test-id' })

      await service.updateSession('test-id', { city: 'Bethesda' })

      const callData = mockPrisma.funnelSession.update.mock.calls[0][0].data
      expect(callData.city).toBe('Bethesda')
      expect(callData.userType).toBeUndefined()
    })
  })

  describe('getSession', () => {
    it('should return session by ID', async () => {
      const mockSession = { id: 'test-id', status: 'IN_PROGRESS' }
      mockPrisma.funnelSession.findUnique.mockResolvedValue(mockSession)

      const result = await service.getSession('test-id')
      expect(result).toEqual(mockSession)
    })

    it('should return null for unknown session', async () => {
      mockPrisma.funnelSession.findUnique.mockResolvedValue(null)

      const result = await service.getSession('unknown-id')
      expect(result).toBeNull()
    })
  })

  describe('generatePage', () => {
    it('should throw if session not found', async () => {
      mockPrisma.funnelSession.findUnique.mockResolvedValue(null)

      await expect(service.generatePage('missing-id')).rejects.toThrow('Session not found')
    })

    it('should throw if session is incomplete', async () => {
      mockPrisma.funnelSession.findUnique.mockResolvedValue({
        id: 'test-id',
        userType: 'HOMEOWNER',
        projectType: null, // incomplete
        city: null,
        state: null,
        budget: null,
        timeline: null,
      })

      await expect(service.generatePage('test-id')).rejects.toThrow('incomplete')
    })

    it('should generate page for complete session', async () => {
      const completeSession = {
        id: 'test-id',
        userType: 'HOMEOWNER',
        projectType: 'KITCHEN_REMODEL',
        city: 'Bethesda',
        state: 'MD',
        budget: 'RANGE_50K_100K',
        timeline: 'ONE_TO_THREE_MONTHS',
      }
      mockPrisma.funnelSession.findUnique.mockResolvedValue(completeSession)
      mockPrisma.funnelSession.update.mockResolvedValue({ ...completeSession, status: 'GENERATED' })

      const result = await service.generatePage('test-id')

      expect(result.sessionId).toBe('test-session-id')
      // Should mark as GENERATING first, then GENERATED
      expect(mockPrisma.funnelSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'test-id' },
          data: expect.objectContaining({ status: 'GENERATING' }),
        })
      )
    })
  })

  describe('getProgress', () => {
    it('should return progress percentage', async () => {
      const progress = await service.getProgress('test-id')
      expect(progress).toBe(50)
    })
  })
})
