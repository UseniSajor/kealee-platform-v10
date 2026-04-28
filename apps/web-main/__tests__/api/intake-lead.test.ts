/**
 * Unit Tests — POST /api/intake/lead
 * MEGA PROMPT §2.2: Integration Tests (Form Submission)
 *
 * Tests the lead API route in isolation using mocked Supabase.
 */

import { NextRequest } from 'next/server'

// Mock supabase-server before importing the route
jest.mock('@/lib/supabase-server', () => ({
  getSupabaseAdmin: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn(() => ({ error: null })),
    })),
  })),
}))

// Dynamic import of the route handler after mocks are set
async function getHandler() {
  const mod = await import('@/app/api/intake/lead/route')
  return mod.POST
}

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/intake/lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/intake/lead', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns 400 when name is missing', async () => {
    const POST = await getHandler()
    const req = makeRequest({ email: 'test@example.com', description: 'A project description' })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/name|required/i)
  })

  test('returns 400 when email is missing', async () => {
    const POST = await getHandler()
    const req = makeRequest({ name: 'Test User', description: 'A project description' })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/email|required/i)
  })

  test('returns 400 when description is missing', async () => {
    const POST = await getHandler()
    const req = makeRequest({ name: 'Test User', email: 'test@example.com' })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/description|required/i)
  })

  test('returns 200 with success:true on valid payload', async () => {
    const POST = await getHandler()
    const req = makeRequest({
      name: 'Alex Johnson',
      email: 'alex@example.com',
      description: 'Kitchen remodel with island',
      phone: '202-555-0101',
      budget: '$50,000',
      timeline: 'Flexible',
      contractorId: 'c1',
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  test('returns 200 even when Supabase is unavailable (graceful fallback)', async () => {
    const { getSupabaseAdmin } = require('@/lib/supabase-server')
    getSupabaseAdmin.mockImplementationOnce(() => {
      throw new Error('DB connection failed')
    })

    const POST = await getHandler()
    const req = makeRequest({
      name: 'Beth Martinez',
      email: 'beth@example.com',
      description: 'Bathroom renovation',
    })
    const res = await POST(req)
    // Should still return 200 — graceful fallback logs and continues
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.saved).toBe(false)
  })

  test('passes contractorId through to Supabase metadata', async () => {
    const { getSupabaseAdmin } = require('@/lib/supabase-server')
    const mockInsert = jest.fn(() => ({ error: null }))
    getSupabaseAdmin.mockReturnValueOnce({
      from: jest.fn(() => ({ insert: mockInsert })),
    })

    const POST = await getHandler()
    const req = makeRequest({
      name: 'Carlos Wei',
      email: 'carlos@example.com',
      description: 'Whole home remodel',
      contractorId: 'contractor-xyz',
    })
    await POST(req)

    const insertArg = (mockInsert.mock.calls[0] as unknown[])?.[0] as Record<string, any> | undefined
    expect(insertArg?.metadata?.contractorId).toBe('contractor-xyz')
  })

  test('source is set to contractor-inquiry', async () => {
    const { getSupabaseAdmin } = require('@/lib/supabase-server')
    const mockInsert = jest.fn(() => ({ error: null }))
    getSupabaseAdmin.mockReturnValueOnce({
      from: jest.fn(() => ({ insert: mockInsert })),
    })

    const POST = await getHandler()
    const req = makeRequest({
      name: 'Dana Park',
      email: 'dana@example.com',
      description: 'Garden design with irrigation',
    })
    await POST(req)

    const insertArg = (mockInsert.mock.calls[0] as unknown[])?.[0] as Record<string, any> | undefined
    expect(insertArg?.source).toBe('contractor-inquiry')
  })
})
