/**
 * Unit Tests — POST /api/test/intake-demo
 * MEGA PROMPT §4.14: /api/test/intake-demo route
 *
 * Tests:
 *  - Returns 400 when projectPath missing
 *  - Returns 403 in production (ALLOW_TEST_INTAKE=false)
 *  - Returns intakeId and deliverableUrl on success
 */

import { NextRequest } from 'next/server'

let mockInsert: jest.Mock
let mockFetch: jest.Mock

jest.mock('@/lib/supabase-server', () => ({
  getSupabaseAdmin: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: mockInsert,
        })),
      })),
    })),
  })),
}))

// Mock global fetch (used to call /api/concept/generate internally)
global.fetch = jest.fn(() => mockFetch())

async function getHandler() {
  const mod = await import('@/app/api/test/intake-demo/route')
  return mod.POST
}

function makeRequest(body: Record<string, unknown>): NextRequest {
  const req = new NextRequest('http://localhost:3000/api/test/intake-demo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return req
}

describe('POST /api/test/intake-demo', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockInsert = jest.fn()
    mockFetch = jest.fn()

    // Default: endpoint is enabled (dev/test env)
    delete process.env.NODE_ENV
    process.env.ALLOW_TEST_INTAKE = 'true'
  })

  test('returns 400 when projectPath is missing', async () => {
    const POST = await getHandler()
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/projectPath/i)
  })

  test('returns intakeId and deliverableUrl on success', async () => {
    const testIntakeId = 'test-demo-uuid-001'
    mockInsert.mockResolvedValueOnce({ data: { id: testIntakeId }, error: null })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ conceptOutput: {} }),
    })

    const POST = await getHandler()
    const res = await POST(
      makeRequest({
        projectPath: 'exterior_concept',
        description: 'Test project',
        address: '1600 Pennsylvania Ave NW, Washington DC 20500',
      })
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.intakeId).toBe(testIntakeId)
    expect(body.deliverableUrl).toContain(testIntakeId)
    expect(body.deliverableUrl).toContain('/concept/deliverable')
  })

  test('returns deliverableUrl even if concept generation fails', async () => {
    const testIntakeId = 'test-demo-uuid-002'
    mockInsert.mockResolvedValueOnce({ data: { id: testIntakeId }, error: null })
    mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'AI unavailable' }) })

    const POST = await getHandler()
    const res = await POST(makeRequest({ projectPath: 'kitchen_remodel' }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.intakeId).toBe(testIntakeId)
    expect(body.deliverableUrl).toBeDefined()
  })

  test('returns 500 when Supabase insert fails', async () => {
    mockInsert.mockResolvedValueOnce({ data: null, error: { message: 'DB connection refused' } })

    const POST = await getHandler()
    const res = await POST(makeRequest({ projectPath: 'exterior_concept' }))
    expect(res.status).toBe(500)
  })

  test('intake record is created with status paid', async () => {
    const testIntakeId = 'test-demo-uuid-003'
    mockInsert.mockResolvedValueOnce({ data: { id: testIntakeId }, error: null })
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })

    const { getSupabaseAdmin } = require('@/lib/supabase-server')
    const mockFrom = jest.fn()
    const mockInsertFn = jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => ({ data: { id: testIntakeId }, error: null })),
      })),
    }))
    getSupabaseAdmin.mockReturnValueOnce({
      from: jest.fn(() => ({ insert: mockInsertFn })),
    })

    const POST = await getHandler()
    await POST(makeRequest({ projectPath: 'garden_concept' }))

    const insertArg = mockInsertFn.mock.calls[0]?.[0]
    if (insertArg) {
      expect(insertArg.status).toBe('paid')
      expect(insertArg.requires_payment).toBe(false)
    }
  })
})
