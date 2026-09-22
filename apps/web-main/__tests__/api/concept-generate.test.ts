import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const generationMocks = vi.hoisted(() => ({
  request: vi.fn(),
}))

vi.mock('@/lib/concept-generation', () => {
  class ConceptGenerationError extends Error {
    constructor(message: string, readonly status: number) {
      super(message)
      this.name = 'ConceptGenerationError'
    }
  }
  return {
    ConceptGenerationError,
    requestCanonicalConceptGeneration: generationMocks.request,
  }
})

async function getHandler() {
  return (await import('@/app/api/concept/generate/route')).POST
}

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/concept/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/concept/generate canonical adapter', () => {
  beforeEach(() => {
    generationMocks.request.mockReset()
  })

  test('returns 400 when intakeId is missing', async () => {
    const POST = await getHandler()
    const response = await POST(makeRequest({}))
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'intakeId required' })
    expect(generationMocks.request).not.toHaveBeenCalled()
  })

  test('returns an existing package without dispatching a second producer', async () => {
    generationMocks.request.mockResolvedValue({
      state: 'ready',
      cached: true,
      intakeId: 'intake-1',
      source: 'legacy-existing',
      conceptOutput: { description: 'Existing paid package' },
    })

    const POST = await getHandler()
    const response = await POST(makeRequest({ intakeId: 'intake-1' }))
    expect(response.status).toBe(200)
    expect((await response.json()).cached).toBe(true)
    expect(generationMocks.request).toHaveBeenCalledOnce()
  })

  test('returns 202 when v30 accepts generation', async () => {
    generationMocks.request.mockResolvedValue({
      state: 'accepted',
      cached: false,
      intakeId: 'intake-1',
      source: 'v30',
      projectId: 'project-1',
      packageId: 'package-1',
    })

    const POST = await getHandler()
    const response = await POST(makeRequest({ intakeId: 'intake-1' }))
    expect(response.status).toBe(202)
    expect(await response.json()).toMatchObject({ source: 'v30', projectId: 'project-1' })
  })

  test('preserves canonical payment and not-found errors', async () => {
    const { ConceptGenerationError } = await import('@/lib/concept-generation')
    generationMocks.request.mockRejectedValueOnce(new ConceptGenerationError('Payment required before generation', 402))

    const POST = await getHandler()
    const paymentResponse = await POST(makeRequest({ intakeId: 'unpaid' }))
    expect(paymentResponse.status).toBe(402)

    generationMocks.request.mockRejectedValueOnce(new ConceptGenerationError('Intake not found', 404))
    const missingResponse = await POST(makeRequest({ intakeId: 'missing' }))
    expect(missingResponse.status).toBe(404)
  })
})
