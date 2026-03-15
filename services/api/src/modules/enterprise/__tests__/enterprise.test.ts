/**
 * enterprise.test.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockTransaction = vi.fn()
vi.mock('../../../lib/prisma', () => ({
  default: {
    portfolioOrg: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    teamMembership: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    featureFlag: { upsert: vi.fn(), findMany: vi.fn(), findFirst: vi.fn() },
    orgEntitlement: { upsert: vi.fn(), findMany: vi.fn(), findFirst: vi.fn() },
    partnerIntegration: { create: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    user: { findUnique: vi.fn() },
    $transaction: mockTransaction,
  },
}))

import prisma from '../../../lib/prisma'
import {
  createPortfolioOrg,
  inviteTeamMember,
  removeTeamMember,
  setFeatureFlag,
  checkFeatureFlag,
  grantEntitlement,
  hasEntitlement,
  registerPartner,
} from '../enterprise.service'

const db = prisma as any

const USER_ID = 'user-001'
const ORG_ID = 'org-001'

const MOCK_ORG = {
  id: ORG_ID,
  name: 'Acme Corp',
  domain: 'acme.com',
  logoUrl: null,
  planId: null,
  ownerId: USER_ID,
  createdAt: new Date(),
  _count: { members: 1, projects: 3 },
}

const MOCK_MEMBERSHIP = {
  id: 'mem-001',
  orgId: ORG_ID,
  userId: USER_ID,
  role: 'OWNER',
  projectIds: [],
  invitedAt: new Date(),
  joinedAt: new Date(),
  user: { email: 'owner@acme.com' },
}

// ─── createPortfolioOrg ──────────────────────────────────────────────────────

describe('createPortfolioOrg', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTransaction.mockImplementation(async (fn: any) => {
      const result = await fn(db)
      return result
    })
  })

  it('creates org and auto-adds creator as OWNER in transaction', async () => {
    db.portfolioOrg.create.mockResolvedValue({ id: ORG_ID })
    db.teamMembership.create.mockResolvedValue({})
    db.portfolioOrg.findUnique.mockResolvedValue(MOCK_ORG)

    const result = await createPortfolioOrg({ name: 'Acme Corp' }, USER_ID)
    expect(result.name).toBe('Acme Corp')
    expect(db.teamMembership.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ role: 'OWNER' }) }),
    )
  })
})

// ─── inviteTeamMember ────────────────────────────────────────────────────────

describe('inviteTeamMember', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 403 when inviter is not ADMIN or OWNER', async () => {
    db.teamMembership.findFirst
      .mockResolvedValueOnce({ role: 'VIEWER' })  // _requireOrgRole check
    await expect(
      inviteTeamMember({ orgId: ORG_ID, email: 'new@test.com', role: 'PROJECT_MANAGER' }, USER_ID),
    ).rejects.toMatchObject({ statusCode: 403 })
  })

  it('throws 404 when user not found', async () => {
    db.teamMembership.findFirst
      .mockResolvedValueOnce({ role: 'OWNER' })   // role check passes
    db.user.findUnique.mockResolvedValue(null)
    await expect(
      inviteTeamMember({ orgId: ORG_ID, email: 'ghost@test.com', role: 'VIEWER' }, USER_ID),
    ).rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws 409 when user is already a member', async () => {
    db.teamMembership.findFirst
      .mockResolvedValueOnce({ role: 'OWNER' })           // role check
      .mockResolvedValueOnce({ id: 'existing-mem' })      // existing member check
    db.user.findUnique.mockResolvedValue({ id: 'user-002', email: 'existing@acme.com' })
    await expect(
      inviteTeamMember({ orgId: ORG_ID, email: 'existing@acme.com', role: 'VIEWER' }, USER_ID),
    ).rejects.toMatchObject({ statusCode: 409 })
  })
})

// ─── removeTeamMember ────────────────────────────────────────────────────────

describe('removeTeamMember', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 422 when trying to remove the owner', async () => {
    db.teamMembership.findFirst
      .mockResolvedValueOnce({ role: 'OWNER' })              // role check for requester
      .mockResolvedValueOnce({ id: 'mem-001', role: 'OWNER' })  // target member
    await expect(removeTeamMember(ORG_ID, 'mem-001', USER_ID)).rejects.toMatchObject({ statusCode: 422 })
  })

  it('deletes member when requester is admin', async () => {
    db.teamMembership.findFirst
      .mockResolvedValueOnce({ role: 'ADMIN' })                       // requester check
      .mockResolvedValueOnce({ id: 'mem-002', role: 'VIEWER' })       // target
    db.teamMembership.delete.mockResolvedValue({})
    await removeTeamMember(ORG_ID, 'mem-002', USER_ID)
    expect(db.teamMembership.delete).toHaveBeenCalledWith({ where: { id: 'mem-002' } })
  })
})

// ─── setFeatureFlag ──────────────────────────────────────────────────────────

describe('setFeatureFlag', () => {
  beforeEach(() => vi.clearAllMocks())

  it('upserts feature flag', async () => {
    db.featureFlag.upsert.mockResolvedValue({
      flagKey: 'ai_chat', enabled: true, scope: 'GLOBAL', scopeId: null,
      rolloutPercent: null, expiresAt: null,
    })
    const result = await setFeatureFlag({ flagKey: 'ai_chat', enabled: true, scope: 'GLOBAL' })
    expect(result.flagKey).toBe('ai_chat')
    expect(result.enabled).toBe(true)
  })
})

// ─── checkFeatureFlag ────────────────────────────────────────────────────────

describe('checkFeatureFlag', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns false when no flags exist', async () => {
    db.featureFlag.findMany.mockResolvedValue([])
    const result = await checkFeatureFlag({ flagKey: 'nonexistent' })
    expect(result).toBe(false)
  })

  it('returns enabled value for global flag', async () => {
    db.featureFlag.findMany.mockResolvedValue([
      { flagKey: 'ai_chat', enabled: true, scope: 'GLOBAL', scopeId: '', rolloutPercent: null, expiresAt: null },
    ])
    const result = await checkFeatureFlag({ flagKey: 'ai_chat' })
    expect(result).toBe(true)
  })

  it('user scope takes priority over global', async () => {
    db.featureFlag.findMany.mockResolvedValue([
      { flagKey: 'beta', enabled: true, scope: 'GLOBAL', scopeId: '', rolloutPercent: null, expiresAt: null },
      { flagKey: 'beta', enabled: false, scope: 'USER', scopeId: USER_ID, rolloutPercent: null, expiresAt: null },
    ])
    const result = await checkFeatureFlag({ flagKey: 'beta', userId: USER_ID })
    expect(result).toBe(false)  // user override wins
  })
})

// ─── grantEntitlement ────────────────────────────────────────────────────────

describe('grantEntitlement', () => {
  beforeEach(() => vi.clearAllMocks())

  it('upserts entitlement and returns dto', async () => {
    db.orgEntitlement.upsert.mockResolvedValue({
      id: 'ent-001', orgId: ORG_ID, featureKey: 'advanced_analytics',
      status: 'ACTIVE', expiresAt: null,
    })
    const result = await grantEntitlement({
      orgId: ORG_ID, featureKey: 'advanced_analytics', status: 'ACTIVE',
    })
    expect(result.status).toBe('ACTIVE')
  })
})

// ─── hasEntitlement ──────────────────────────────────────────────────────────

describe('hasEntitlement', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns false when entitlement not found', async () => {
    db.orgEntitlement.findFirst.mockResolvedValue(null)
    expect(await hasEntitlement(ORG_ID, 'feature_x')).toBe(false)
  })

  it('returns true when active entitlement found', async () => {
    db.orgEntitlement.findFirst.mockResolvedValue({ id: 'ent-001', status: 'ACTIVE' })
    expect(await hasEntitlement(ORG_ID, 'advanced_analytics')).toBe(true)
  })
})

// ─── registerPartner ─────────────────────────────────────────────────────────

describe('registerPartner', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates partner and returns dto', async () => {
    db.partnerIntegration.create.mockResolvedValue({
      id: 'partner-001', name: 'Wells Fargo', partnerType: 'LENDER',
      active: true, markets: ['CA-LA'], contactEmail: 'partner@wf.com',
    })
    const result = await registerPartner({
      name: 'Wells Fargo', partnerType: 'LENDER', contactEmail: 'partner@wf.com',
    })
    expect(result.partnerType).toBe('LENDER')
    expect(result.active).toBe(true)
  })
})
