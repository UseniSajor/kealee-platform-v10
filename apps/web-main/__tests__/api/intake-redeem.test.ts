import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { getSupabaseAdmin } = vi.hoisted(() => ({
  getSupabaseAdmin: vi.fn(),
}))

vi.mock('@/lib/supabase-server', () => ({ getSupabaseAdmin }))

import { POST } from '@/app/api/intake/redeem/route'

function request(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/intake/redeem', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('intake promo validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.INTAKE_FREE_CODES
  })

  it('validates the free code before an intake record exists', async () => {
    const response = await POST(request({
      projectPath: 'whole_home_concept',
      promoCode: '  kealee-allin-2026  ',
      validateOnly: true,
    }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true, free: true })
    expect(getSupabaseAdmin).not.toHaveBeenCalled()
  })

  it('returns a clear error for an invalid code', async () => {
    const response = await POST(request({
      projectPath: 'whole_home_concept',
      promoCode: 'NOT-A-CODE',
      validateOnly: true,
    }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'Invalid promo code' })
    expect(getSupabaseAdmin).not.toHaveBeenCalled()
  })
})
