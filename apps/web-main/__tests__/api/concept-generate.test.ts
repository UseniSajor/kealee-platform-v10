/**
 * Unit Tests — POST /api/concept/generate
 * MEGA PROMPT §2.3: API Testing (Concept Intake Endpoint)
 *
 * Tests:
 *  - Missing intakeId → 400
 *  - Non-existent intakeId → 404
 *  - Missing ANTHROPIC_API_KEY → 503
 *  - Claude response parsing
 *  - Cached concept returned if already generated
 */

import { NextRequest } from 'next/server'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockIntakeRecord = {
  id: 'test-intake-001',
  project_path: 'kitchen_remodel',
  client_name: 'Test User',
  contact_email: 'test@example.com',
  project_address: '1600 Pennsylvania Ave NW, Washington DC 20500',
  budget_range: '$50,000',
  form_data: { description: 'Modern kitchen with island', squareFootage: 200 },
  status: 'paid',
}

const mockConceptOutput = {
  designConcept: { style: 'Modern', colorPalette: ['White', 'Grey'], keyFeatures: ['Island', 'LED lighting'] },
  mepSystem: { electrical: 'New circuits', plumbing: 'Island sink', hvac: 'N/A', lighting: 'LED recessed' },
  billOfMaterials: [
    { item: 'Cabinetry', quantity: 1, unit: 'set', estimatedCost: 15000, description: 'Custom shaker' },
    { item: 'Countertops', quantity: 80, unit: 'sqft', estimatedCost: 8000, description: 'Quartz' },
    { item: 'Appliances', quantity: 1, unit: 'set', estimatedCost: 12000, description: 'Professional grade' },
    { item: 'Labor', quantity: 100, unit: 'hours', estimatedCost: 8000, description: 'Install' },
    { item: 'Electrical', quantity: 1, unit: 'job', estimatedCost: 3500, description: 'New circuits' },
  ],
  estimatedCost: 46500,
  projectTimeline: '10–14 weeks',
  description: 'Modern chef kitchen concept.',
  includes: ['3 renders', 'BOM', 'MEP spec'],
}

let mockSupabaseSelect: jest.Mock
let mockSupabaseUpdate: jest.Mock
let mockAnthropicCreate: jest.Mock

jest.mock('@/lib/supabase-server', () => ({
  getSupabaseAdmin: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: mockSupabaseSelect,
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  })),
}))

jest.mock('@anthropic-ai/sdk', () => ({
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn(() => mockAnthropicCreate()),
    },
  })),
}))

async function getHandler() {
  const mod = await import('@/app/api/concept/generate/route')
  return mod.POST
}

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/concept/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/concept/generate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseSelect = jest.fn()
    mockSupabaseUpdate = jest.fn()
    mockAnthropicCreate = jest.fn()
  })

  test('returns 400 when intakeId is missing', async () => {
    const POST = await getHandler()
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/intakeId/i)
  })

  test('returns 404 when intake record not found', async () => {
    mockSupabaseSelect.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } })

    const POST = await getHandler()
    const res = await POST(makeRequest({ intakeId: 'nonexistent-uuid' }))
    expect(res.status).toBe(404)
  })

  test('returns 503 when ANTHROPIC_API_KEY is missing', async () => {
    const originalKey = process.env.ANTHROPIC_API_KEY
    delete process.env.ANTHROPIC_API_KEY

    mockSupabaseSelect.mockResolvedValueOnce({ data: mockIntakeRecord, error: null })

    const POST = await getHandler()
    const res = await POST(makeRequest({ intakeId: 'test-intake-001' }))
    expect(res.status).toBe(503)

    if (originalKey) process.env.ANTHROPIC_API_KEY = originalKey
  })

  test('returns cached concept when already generated', async () => {
    const cachedRecord = {
      ...mockIntakeRecord,
      status: 'concept_ready',
      form_data: { ...mockIntakeRecord.form_data, conceptOutput: mockConceptOutput },
    }
    mockSupabaseSelect.mockResolvedValueOnce({ data: cachedRecord, error: null })

    const POST = await getHandler()
    const res = await POST(makeRequest({ intakeId: 'test-intake-001' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.cached).toBe(true)
    expect(body.conceptOutput).toBeDefined()
  })

  test('calls Claude and returns conceptOutput on success', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key-for-unit-tests'
    mockSupabaseSelect.mockResolvedValueOnce({ data: mockIntakeRecord, error: null })
    mockAnthropicCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify(mockConceptOutput) }],
    })

    const POST = await getHandler()
    const res = await POST(makeRequest({ intakeId: 'test-intake-001' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.conceptOutput).toBeDefined()
    expect(body.conceptOutput.designConcept.style).toBe('Modern')
  })

  test('falls back to partial concept when Claude returns no JSON', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key-for-unit-tests'
    mockSupabaseSelect.mockResolvedValueOnce({ data: mockIntakeRecord, error: null })
    mockAnthropicCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'Sorry, I cannot help with that.' }],
    })

    const POST = await getHandler()
    const res = await POST(makeRequest({ intakeId: 'test-intake-001' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    // Partial fallback should still return a concept
    expect(body.conceptOutput).toBeDefined()
    expect(body.conceptOutput.estimatedCost).toBeGreaterThan(0)
  })
})
