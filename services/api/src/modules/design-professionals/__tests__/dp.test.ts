/**
 * dp.test.ts — Design Professionals Service Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../lib/prisma', () => ({
  default: {
    designProfessional: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    designProfessionalAssignment: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    project: {
      findFirst: vi.fn(),
    },
  },
}))

import prisma from '../../../lib/prisma'
import {
  registerDesignProfessional,
  getDPProfile,
  updateDPProfile,
  listDesignProfessionals,
  assignDP,
  listProjectAssignments,
  updateAssignment,
  adminVerifyDP,
} from '../dp.service'

const db = prisma as any

const MOCK_USER_ID = 'user-001'
const MOCK_DP_ID = 'dp-001'
const MOCK_PROJECT_ID = 'project-001'

const MOCK_PROFILE = {
  id: MOCK_DP_ID,
  userId: MOCK_USER_ID,
  role: 'ARCHITECT',
  status: 'PENDING_REVIEW',
  firmName: 'Smith Architecture',
  licenseNumber: 'ARC-12345',
  licenseState: 'MD',
  licenseExpiry: null,
  portfolioUrl: null,
  specialties: ['Residential', 'Commercial'],
  bio: 'Award-winning architect',
  yearsExperience: 15,
  jurisdictions: ['MD', 'DC', 'VA'],
  verifiedAt: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  user: { name: 'Jane Smith', email: 'jane@smith-arch.com' },
}

// ─── registerDesignProfessional ───────────────────────────────────────────────

describe('registerDesignProfessional', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates a new design professional profile', async () => {
    db.designProfessional.findUnique.mockResolvedValue(null)
    db.designProfessional.create.mockResolvedValue(MOCK_PROFILE)

    const result = await registerDesignProfessional(MOCK_USER_ID, {
      role: 'ARCHITECT',
      licenseNumber: 'ARC-12345',
      licenseState: 'MD',
      specialties: ['Residential'],
    })

    expect(result.role).toBe('ARCHITECT')
    expect(result.status).toBe('PENDING_REVIEW')
    expect(db.designProfessional.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: MOCK_USER_ID, role: 'ARCHITECT', status: 'PENDING_REVIEW' }),
      })
    )
  })

  it('throws 409 if profile already exists', async () => {
    db.designProfessional.findUnique.mockResolvedValue(MOCK_PROFILE)
    await expect(
      registerDesignProfessional(MOCK_USER_ID, { role: 'ARCHITECT' })
    ).rejects.toMatchObject({ statusCode: 409 })
  })
})

// ─── getDPProfile ─────────────────────────────────────────────────────────────

describe('getDPProfile', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns null when not found', async () => {
    db.designProfessional.findUnique.mockResolvedValue(null)
    const result = await getDPProfile(MOCK_USER_ID)
    expect(result).toBeNull()
  })

  it('returns mapped profile when found', async () => {
    db.designProfessional.findUnique.mockResolvedValue(MOCK_PROFILE)
    const result = await getDPProfile(MOCK_USER_ID)
    expect(result).not.toBeNull()
    expect(result?.firmName).toBe('Smith Architecture')
    expect(result?.specialties).toEqual(['Residential', 'Commercial'])
  })
})

// ─── updateDPProfile ──────────────────────────────────────────────────────────

describe('updateDPProfile', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 404 when profile not found', async () => {
    db.designProfessional.findUnique.mockResolvedValue(null)
    await expect(updateDPProfile(MOCK_USER_ID, { bio: 'New bio' })).rejects.toMatchObject({ statusCode: 404 })
  })

  it('updates profile fields', async () => {
    db.designProfessional.findUnique.mockResolvedValue(MOCK_PROFILE)
    db.designProfessional.update.mockResolvedValue({ ...MOCK_PROFILE, bio: 'Updated bio' })
    const result = await updateDPProfile(MOCK_USER_ID, { bio: 'Updated bio' })
    expect(result.bio).toBe('Updated bio')
  })
})

// ─── listDesignProfessionals ──────────────────────────────────────────────────

describe('listDesignProfessionals', () => {
  beforeEach(() => vi.clearAllMocks())

  it('defaults to VERIFIED status filter', async () => {
    db.designProfessional.findMany.mockResolvedValue([MOCK_PROFILE])
    db.designProfessional.count.mockResolvedValue(1)
    await listDesignProfessionals({})
    expect(db.designProfessional.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'VERIFIED' }),
      })
    )
  })

  it('applies role filter when provided', async () => {
    db.designProfessional.findMany.mockResolvedValue([])
    db.designProfessional.count.mockResolvedValue(0)
    await listDesignProfessionals({ role: 'ARCHITECT' })
    expect(db.designProfessional.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ role: 'ARCHITECT' }),
      })
    )
  })

  it('returns paginated result', async () => {
    db.designProfessional.findMany.mockResolvedValue([MOCK_PROFILE])
    db.designProfessional.count.mockResolvedValue(1)
    const result = await listDesignProfessionals({ page: 2, limit: 10 })
    expect(result.page).toBe(2)
    expect(result.limit).toBe(10)
    expect(db.designProfessional.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 })
    )
  })
})

// ─── assignDP ────────────────────────────────────────────────────────────────

describe('assignDP', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 404 when project not found or access denied', async () => {
    db.project.findFirst.mockResolvedValue(null)
    await expect(assignDP(MOCK_PROJECT_ID, MOCK_DP_ID, 'LEAD_ARCHITECT', MOCK_USER_ID))
      .rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws 404 when professional not found', async () => {
    db.project.findFirst.mockResolvedValue({ id: MOCK_PROJECT_ID })
    db.designProfessional.findUnique.mockResolvedValue(null)
    await expect(assignDP(MOCK_PROJECT_ID, MOCK_DP_ID, 'LEAD_ARCHITECT', MOCK_USER_ID))
      .rejects.toMatchObject({ statusCode: 404 })
  })

  it('creates assignment with INVITED status', async () => {
    db.project.findFirst.mockResolvedValue({ id: MOCK_PROJECT_ID })
    db.designProfessional.findUnique.mockResolvedValue(MOCK_PROFILE)
    db.designProfessionalAssignment.create.mockResolvedValue({
      id: 'assignment-001',
      projectId: MOCK_PROJECT_ID,
      professionalId: MOCK_DP_ID,
      role: 'LEAD_ARCHITECT',
      status: 'INVITED',
      invitedAt: new Date(),
      acceptedAt: null,
      completedAt: null,
    })

    const result = await assignDP(MOCK_PROJECT_ID, MOCK_DP_ID, 'LEAD_ARCHITECT', MOCK_USER_ID)
    expect(result.status).toBe('INVITED')
    expect(result.role).toBe('LEAD_ARCHITECT')
  })
})

// ─── adminVerifyDP ────────────────────────────────────────────────────────────

describe('adminVerifyDP', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 404 when not found', async () => {
    db.designProfessional.findUnique.mockResolvedValue(null)
    await expect(adminVerifyDP(MOCK_DP_ID, 'admin-001')).rejects.toMatchObject({ statusCode: 404 })
  })

  it('sets status to VERIFIED and sets verifiedAt', async () => {
    db.designProfessional.findUnique.mockResolvedValue(MOCK_PROFILE)
    db.designProfessional.update.mockResolvedValue({ ...MOCK_PROFILE, status: 'VERIFIED', verifiedAt: new Date() })
    const result = await adminVerifyDP(MOCK_DP_ID, 'admin-001')
    expect(result.status).toBe('VERIFIED')
    expect(db.designProfessional.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'VERIFIED', verifiedAt: expect.any(Date) }),
      })
    )
  })
})
