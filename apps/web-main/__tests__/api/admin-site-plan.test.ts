/**
 * POST /api/admin/site-plan — staff activation of a paid site-plan order.
 *
 * Orders paid before webhook activation existed sit in the manual queue with
 * no workflow. This route calls the SAME entry point the webhook calls;
 * these tests protect the guards around it: only site-plan products, only
 * paid orders, and the disposition is written back to the order.
 */

import { NextRequest } from 'next/server'
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  intake: null as null | Record<string, unknown>,
  updates: [] as Record<string, unknown>[],
  activate: vi.fn(),
}))

vi.mock('@/lib/command-center-api-auth', () => ({ requireCommandCenterApi: async () => null }))
vi.mock('@/lib/supabase-server', () => ({
  getSupabaseAdmin: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: mocks.intake, error: null }) }),
        in: () => ({ in: () => ({ order: () => ({ limit: async () => ({ data: [], error: null }) }) }) }),
      }),
      update: (payload: Record<string, unknown>) => ({
        eq: async () => { mocks.updates.push(payload); return { error: null } },
      }),
    }),
  }),
}))
vi.mock('@kealee/database', () => ({ prisma: { sitePlanWorkflow: { findMany: async () => [] } } }))
vi.mock('@/lib/site-plan-workflow', () => ({
  activateSitePlanForOrder: mocks.activate,
  sitePlanWorkflowFormData: (a: { workflowId: string | null; disposition: string }) => ({
    sitePlanWorkflowId: a.workflowId, sitePlanWorkflowDisposition: a.disposition,
  }),
}))

import { POST } from '../../app/api/admin/site-plan/route'

const req = (body: unknown) =>
  new NextRequest('http://localhost/api/admin/site-plan', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })

describe('POST /api/admin/site-plan', () => {
  beforeEach(() => {
    mocks.updates.length = 0
    mocks.activate.mockReset().mockResolvedValue({
      disposition: 'CREATED', workflowId: 'wf_new', enqueued: ['siteplan.initialize'], summary: 'created',
    })
  })

  it('activates a paid site-plan order and records the disposition on it', async () => {
    mocks.intake = { id: 'intake_1', project_path: 'preliminary_site_plan', status: 'processing', form_data: { description: 'x' }, project_address: '1009 rollins ave 20743' }
    const res = await POST(req({ intakeId: 'intake_1' }))
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ disposition: 'CREATED', workflowId: 'wf_new' })
    // The address comes from the project_address COLUMN; the first real
    // orders blocked at resolve_property because only form_data was passed.
    expect(mocks.activate).toHaveBeenCalledWith(expect.objectContaining({
      projectId: 'intake_1', orderId: 'intake_1', productId: 'preliminary_site_plan', isSitePlan: true,
      projectAddress: '1009 rollins ave 20743',
    }))
    expect(mocks.updates[0].form_data).toMatchObject({
      description: 'x', sitePlanWorkflowId: 'wf_new', sitePlanWorkflowDisposition: 'CREATED',
    })
  })

  it('refuses a product that is not a site plan', async () => {
    mocks.intake = { id: 'intake_2', project_path: 'kitchen_remodel', status: 'paid', form_data: {} }
    const res = await POST(req({ intakeId: 'intake_2' }))
    expect(res.status).toBe(400)
    expect(mocks.activate).not.toHaveBeenCalled()
  })

  it('refuses an unpaid order', async () => {
    mocks.intake = { id: 'intake_3', project_path: 'permit_site_plan', status: 'new', form_data: {} }
    const res = await POST(req({ intakeId: 'intake_3' }))
    expect(res.status).toBe(409)
    expect(mocks.activate).not.toHaveBeenCalled()
  })

  it('reports a failed activation as 500 but still records it on the order', async () => {
    mocks.intake = { id: 'intake_4', project_path: 'permit_site_plan', status: 'paid', form_data: {} }
    mocks.activate.mockResolvedValueOnce({ disposition: 'FAILED', workflowId: null, enqueued: [], summary: 'no org' })
    const res = await POST(req({ intakeId: 'intake_4' }))
    expect(res.status).toBe(500)
    expect(mocks.updates[0].form_data).toMatchObject({ sitePlanWorkflowDisposition: 'FAILED' })
  })

  it('404s an unknown order', async () => {
    mocks.intake = null
    expect((await POST(req({ intakeId: 'ghost' }))).status).toBe(404)
  })
})
