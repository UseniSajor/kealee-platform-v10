/**
 * Unit Tests — POST /api/concept/generate
 * MEGA PROMPT §2.3: API Testing (Concept Intake Endpoint)
 *
 * Tests:
 *  - Missing intakeId → 400
 *  - Non-existent intakeId → 404
 *  - Missing ANTHROPIC_API_KEY → 503
 *  - DesignBot success → 200 with conceptOutput
 *  - Cached concept returned if already generated
 *  - DesignBot failure → 500 with partial: true
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
  renderUrls: [],
  permitScope: {
    requiresPermit: true,
    permitTypes: ['Building Permit'],
    estimatedPermitFee: 850,
    estimatedProcessingDays: 21,
    requiresPE: false,
    notes: 'Permit required.',
  },
  zoningNotes: 'R-4 zone.',
  buildabilityFlag: 'feasible' as const,
  readinessScore: 80,
}

const mockDesignOutput = {
  projectId: 'test-intake-001',
  conceptCount: 1,
  concepts: [{
    id: 'c1',
    name: 'Modern Kitchen',
    description: 'Island kitchen',
    styleMatch: 85,
    estimatedCost: 46500,
    materials: ['Quartz'],
    accessibility: [],
    renderingHints: 'Clean lines',
    uniqueFeatures: ['Island'],
  }],
  recommendations: ['Add island seating'],
  estimatedTimeline: 90,
}

let mockSupabaseSelect: jest.Mock
let mockBotExecute: jest.Mock

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

// Mock DesignBotEnterprise and mapDesignOutputToConceptOutput so tests never
// hit the real Anthropic API.
jest.mock('@kealee/core-llm', () => ({
  DesignBotEnterprise: jest.fn().mockImplementation(() => ({
    execute: jest.fn((..._args: unknown[]) => mockBotExecute()),
  })),
  mapDesignOutputToConceptOutput: jest.fn((_data: unknown, _opts: unknown) => mockConceptOutput),
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
    mockBotExecute = jest.fn()
    // Re-wire the DesignBotEnterprise mock's execute to use the per-test mockBotExecute
    const { DesignBotEnterprise } = require('@kealee/core-llm') as {
      DesignBotEnterprise: jest.Mock
    }
    DesignBotEnterprise.mockImplementation(() => ({
      execute: jest.fn((..._args: unknown[]) => mockBotExecute()),
    }))
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

  test('returns 402 when intake is not paid (P0-4 gate)', async () => {
    const unpaidRecord = { ...mockIntakeRecord, status: 'new' }
    mockSupabaseSelect.mockResolvedValueOnce({ data: unpaidRecord, error: null })

    const POST = await getHandler()
    const res = await POST(makeRequest({ intakeId: 'test-intake-001' }))
    expect(res.status).toBe(402)
    const body = await res.json()
    expect(body.error).toMatch(/Payment required/i)
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

  test('calls DesignBot and returns conceptOutput on success', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key-for-unit-tests'
    mockSupabaseSelect.mockResolvedValueOnce({ data: mockIntakeRecord, error: null })
    mockBotExecute.mockResolvedValueOnce({ success: true, data: mockDesignOutput })

    const POST = await getHandler()
    const res = await POST(makeRequest({ intakeId: 'test-intake-001' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.conceptOutput).toBeDefined()
    expect(body.conceptOutput.designConcept.style).toBe('Modern')
  })

  test('returns 500 with partial:true when DesignBot fails', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key-for-unit-tests'
    mockSupabaseSelect.mockResolvedValueOnce({ data: mockIntakeRecord, error: null })
    mockBotExecute.mockResolvedValueOnce({ success: false, error: 'DesignBot error: service unavailable' })

    const POST = await getHandler()
    const res = await POST(makeRequest({ intakeId: 'test-intake-001' }))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.partial).toBe(true)
  })
})
