/**
 * engagement-exec.test.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockTransaction = vi.fn()
vi.mock('../../../lib/prisma', () => ({
  default: {
    contractAgreement: { findFirst: vi.fn(), update: vi.fn() },
    changeOrder: { create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    milestone: { findFirst: vi.fn(), update: vi.fn() },
    dispute: { create: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    escrowAgreement: { findFirst: vi.fn(), update: vi.fn() },
    $transaction: mockTransaction,
  },
}))

import { prisma } from '../../../lib/prisma'
import {
  createChangeOrder,
  listChangeOrders,
  respondToChangeOrder,
  submitMilestone,
  approveMilestone,
  openDispute,
  resolveDispute,
} from '../engagement-exec.service'

const db = prisma as any

const USER_ID = 'user-001'
const CONTRACT_ID = 'contract-001'
const MILESTONE_ID = 'milestone-001'
const DISPUTE_ID = 'dispute-001'

const MOCK_CONTRACT = {
  id: CONTRACT_ID,
  status: 'ACTIVE',
  ownerId: USER_ID,
  contractorId: 'contractor-001',
}

const MOCK_CO = {
  id: 'co-001',
  contractId: CONTRACT_ID,
  title: 'Add window',
  description: null,
  amountDelta: '2500',
  scheduleDeltaDays: null,
  reason: 'OWNER_REQUEST',
  status: 'PENDING',
  requestedById: USER_ID,
  respondedById: null,
  respondedAt: null,
  counterAmountDelta: null,
  notes: null,
  createdAt: new Date(),
}

// ─── createChangeOrder ────────────────────────────────────────────────────────

describe('createChangeOrder', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates a change order when user has contract access', async () => {
    db.contractAgreement.findFirst.mockResolvedValue(MOCK_CONTRACT)
    db.changeOrder.create.mockResolvedValue(MOCK_CO)

    const result = await createChangeOrder(USER_ID, {
      contractId: CONTRACT_ID,
      title: 'Add window',
      amountDelta: 2500,
      reason: 'OWNER_REQUEST',
    })

    expect(result.title).toBe('Add window')
    expect(result.status).toBe('PENDING')
    expect(result.amountDelta).toBe(2500)
  })

  it('throws 404 when no contract access', async () => {
    db.contractAgreement.findFirst.mockResolvedValue(null)
    await expect(
      createChangeOrder('other-user', { contractId: CONTRACT_ID, title: 'x', amountDelta: 100, reason: 'OWNER_REQUEST' })
    ).rejects.toMatchObject({ statusCode: 404 })
  })
})

// ─── respondToChangeOrder ─────────────────────────────────────────────────────

describe('respondToChangeOrder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTransaction.mockImplementation(async (fn: any) => fn(db))
  })

  it('throws 422 when requester tries to respond to own change order', async () => {
    db.changeOrder.findFirst.mockResolvedValue({
      ...MOCK_CO,
      requestedById: USER_ID,
      contract: MOCK_CONTRACT,
    })

    await expect(
      respondToChangeOrder('co-001', USER_ID, { action: 'APPROVE' })
    ).rejects.toMatchObject({ statusCode: 422 })
  })

  it('sets status APPROVED and updates contract amount on approval', async () => {
    db.changeOrder.findFirst.mockResolvedValue({
      ...MOCK_CO,
      requestedById: 'contractor-001',
      contract: { ...MOCK_CONTRACT, id: CONTRACT_ID, amount: '45000' },
    })
    db.changeOrder.update.mockResolvedValue({ ...MOCK_CO, status: 'APPROVED', respondedById: USER_ID, respondedAt: new Date() })
    db.contractAgreement.update.mockResolvedValue({})

    const result = await respondToChangeOrder('co-001', USER_ID, { action: 'APPROVE' })
    expect(result.status).toBe('APPROVED')
    expect(db.contractAgreement.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ amount: { increment: expect.any(Number) } }),
      })
    )
  })
})

// ─── submitMilestone ──────────────────────────────────────────────────────────

describe('submitMilestone', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 404 when milestone not found for contractor', async () => {
    db.milestone.findFirst.mockResolvedValue(null)
    await expect(submitMilestone(USER_ID, { milestoneId: MILESTONE_ID }))
      .rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws 422 when milestone not PENDING', async () => {
    db.milestone.findFirst.mockResolvedValue({
      id: MILESTONE_ID, status: 'PAID', amount: '10000',
      contract: { ownerId: 'owner-001', contractorId: USER_ID },
    })
    await expect(submitMilestone(USER_ID, { milestoneId: MILESTONE_ID }))
      .rejects.toMatchObject({ statusCode: 422 })
  })

  it('sets milestone to SUBMITTED', async () => {
    db.milestone.findFirst.mockResolvedValue({
      id: MILESTONE_ID, status: 'PENDING', amount: '10000',
      contract: { ownerId: 'owner-001', contractorId: USER_ID },
    })
    db.milestone.update.mockResolvedValue({
      id: MILESTONE_ID, status: 'SUBMITTED', amount: '10000',
      approvedById: null, approvedAt: null, notes: null,
      completedAt: new Date(),
    })

    const result = await submitMilestone(USER_ID, { milestoneId: MILESTONE_ID })
    expect(result.status).toBe('SUBMITTED')
  })
})

// ─── openDispute ──────────────────────────────────────────────────────────────

describe('openDispute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTransaction.mockImplementation(async (fn: any) => fn(db))
  })

  it('throws 409 when dispute already open', async () => {
    db.contractAgreement.findFirst.mockResolvedValue(MOCK_CONTRACT)
    db.dispute.findFirst.mockResolvedValue({ id: 'existing-dispute', status: 'OPEN' })
    await expect(
      openDispute(USER_ID, { contractId: CONTRACT_ID, reason: 'Work not done properly', requestedResolution: 'REDO_WORK' })
    ).rejects.toMatchObject({ statusCode: 409 })
  })

  it('creates dispute and puts escrow on hold', async () => {
    db.contractAgreement.findFirst.mockResolvedValue(MOCK_CONTRACT)
    db.dispute.findFirst.mockResolvedValue(null)
    db.dispute.create.mockResolvedValue({
      id: DISPUTE_ID, contractId: CONTRACT_ID, reason: 'Work not done properly',
      status: 'OPEN', requestedResolution: 'REDO_WORK', openedById: USER_ID,
      createdAt: new Date(), resolvedAt: null,
    })
    db.escrowAgreement.findFirst.mockResolvedValue({ id: 'escrow-001', contractId: CONTRACT_ID })
    db.escrowAgreement.update.mockResolvedValue({})
    db.contractAgreement.update.mockResolvedValue({})

    const result = await openDispute(USER_ID, {
      contractId: CONTRACT_ID,
      reason: 'Work not done properly',
      requestedResolution: 'REDO_WORK',
    })

    expect(result.status).toBe('OPEN')
    expect(db.escrowAgreement.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'ON_HOLD' }) })
    )
  })
})

// ─── resolveDispute ───────────────────────────────────────────────────────────

describe('resolveDispute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTransaction.mockImplementation(async (fn: any) => fn(db))
  })

  it('throws 404 when dispute not found', async () => {
    db.dispute.findFirst.mockResolvedValue(null)
    await expect(
      resolveDispute(DISPUTE_ID, USER_ID, { resolution: 'Work completed satisfactorily', resolutionType: 'DISMISSED' })
    ).rejects.toMatchObject({ statusCode: 404 })
  })

  it('reactivates escrow and contract on resolution', async () => {
    db.dispute.findFirst.mockResolvedValue({
      id: DISPUTE_ID, status: 'OPEN', contractId: CONTRACT_ID,
      contract: { escrowAgreement: { id: 'escrow-001' }, id: CONTRACT_ID },
    })
    db.dispute.update.mockResolvedValue({ id: DISPUTE_ID, status: 'RESOLVED', resolvedAt: new Date(), contractId: CONTRACT_ID, reason: 'x', requestedResolution: 'DISMISSED', openedById: USER_ID, createdAt: new Date() })
    db.escrowAgreement.update.mockResolvedValue({})
    db.contractAgreement.update.mockResolvedValue({})

    await resolveDispute(DISPUTE_ID, USER_ID, { resolution: 'Work completed satisfactorily', resolutionType: 'DISMISSED' })

    expect(db.escrowAgreement.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'ACTIVE' }) })
    )
    expect(db.contractAgreement.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'ACTIVE' }) })
    )
  })
})
