import { beforeEach, describe, expect, it, vi } from 'vitest'
const db = vi.hoisted(() => ({ orgMember: { findFirst: vi.fn(), count: vi.fn() }, softwareSubscription: { findFirst: vi.fn() }, pMServiceSubscription: { findFirst: vi.fn() }, project: { count: vi.fn() } }))
const stripe = vi.hoisted(() => ({ billingPortal: { sessions: { create: vi.fn() } } }))
vi.mock('../../../utils/prisma-helper', () => ({ prismaAny: db }))
vi.mock('../stripe.client', () => ({ getStripe: () => stripe }))
import { SoftwareBillingService } from '../software-billing.service'
const service = new SoftwareBillingService()
beforeEach(() => {
  vi.resetAllMocks()
  db.orgMember.findFirst.mockResolvedValue({ orgId: 'org-a', roleKey: 'org_owner', user: { role: 'CONTRACTOR', status: 'ACTIVE' } })
})
describe('software billing tenant scope', () => {
  it('requires an explicit organization without querying arbitrary membership', async () => {
    await expect(service.getUsage('user')).rejects.toMatchObject({ statusCode: 400 })
    expect(db.orgMember.findFirst).not.toHaveBeenCalled()
  })
  it('denies nonmembers before subscription lookup', async () => {
    db.orgMember.findFirst.mockResolvedValue(null)
    await expect(service.getSubscription('user', 'org-b')).rejects.toMatchObject({ statusCode: 403 })
    expect(db.softwareSubscription.findFirst).not.toHaveBeenCalled()
  })
  it('cannot apply another organization subscription to current usage', async () => {
    db.project.count.mockResolvedValue(2)
    db.orgMember.count.mockResolvedValue(3)
    db.softwareSubscription.findFirst.mockResolvedValue(null)
    db.pMServiceSubscription.findFirst.mockResolvedValue(null)
    await service.getUsage('user', 'org-a')
    expect(db.softwareSubscription.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { organizationId: 'org-a', status: 'ACTIVE' } }))
  })
  it('blocks viewers from modifying billing', async () => {
    db.orgMember.findFirst.mockResolvedValue({ orgId: 'org-a', roleKey: 'org_viewer', user: { role: 'CONTRACTOR', status: 'ACTIVE' } })
    await expect(service.cancelSubscription('user', false, 'org-a')).rejects.toMatchObject({ statusCode: 403 })
    expect(db.softwareSubscription.findFirst).not.toHaveBeenCalled()
  })
  it('does not fall back to a personal Stripe customer in the tenant portal', async () => {
    db.softwareSubscription.findFirst.mockResolvedValue(null)
    await expect(service.createPortalSession('user', 'https://example.com', 'org-a')).rejects.toThrow('No Stripe customer')
    expect(stripe.billingPortal.sessions.create).not.toHaveBeenCalled()
  })
})
