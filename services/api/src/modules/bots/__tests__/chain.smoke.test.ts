/**
 * chain.smoke.test.ts
 *
 * Smoke tests for the KeaBots three-stage chain:
 *   DesignBot → EstimateBot → PermitBot
 *
 * Coverage:
 *   1. Full chain happy-path (all three stages complete)
 *   2. runDesignBot — returns DesignBotResult shape
 *   3. runEstimateBot — gates on COMPLETED design run
 *   4. runPermitBot — gates on COMPLETED estimate run
 *   5. ChainGateError thrown when parent is FAILED
 *   6. Claude prompt caching — cacheMetrics shape returned
 *   7. JSON parse fallback — chain completes even on partial LLM JSON
 *   8. RAG context — permit records injected when RAG is loaded
 *
 * All LLM calls are mocked — no Anthropic API key required.
 * DB (Prisma) is mocked — no database required.
 *
 * TO RUN: pnpm --filter services/api test -- chain.smoke
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { randomUUID } from 'crypto'

// ── Mock @anthropic-ai/sdk ────────────────────────────────────────────────────

const mockDesignJson = JSON.stringify({
  mepSystem: {
    hvac:       'Ducted split system, 3-zone',
    electrical: '200A service, LED throughout',
    plumbing:   '3 bathrooms, kitchen, laundry',
    lighting:   'Recessed LED + pendants',
    drainage:   'French drain at foundation',
  },
  bom: [
    { item: 'Framing Lumber 2×6', quantity: 1200, unit: 'LF',  estimatedCost: 4500,  ctcTaskNumber: '06-11-10', csiCode: '06 11 10' },
    { item: 'OSB Sheathing 7/16"', quantity: 2400, unit: 'SF',  estimatedCost: 3120,  ctcTaskNumber: '06-11-20', csiCode: '06 11 20' },
    { item: 'Split AC 3-ton',      quantity: 2,    unit: 'EA',  estimatedCost: 14690, ctcTaskNumber: '15-64-10', csiCode: '23 81 26' },
    { item: 'Electrical Panel 200A', quantity: 1,  unit: 'EA',  estimatedCost: 3616,  ctcTaskNumber: '16-12-10', csiCode: '26 24 16' },
    { item: 'Drywall 5/8"',        quantity: 5200, unit: 'SF',  estimatedCost: 19084, ctcTaskNumber: '09-21-10', csiCode: '09 21 16' },
  ],
  designNotes: 'Standard DMV residential renovation using 2026 CTC pricing.',
})

const mockEstimateJson = JSON.stringify({
  lineItems: [
    {
      category: 'Demolition',     description: 'Demo existing finishes',
      csiCode: '02 41 19',        ctcTaskNumber: '02-41-19',
      quantity: 1,                unit: 'LS',
      unitCost: 8500,             inflationFactor: 1.13,
      subtotal: 9605,             totalLow: 8645,  totalHigh: 11526,
      laborHours: 80,             laborRate: 89.50,
    },
    {
      category: 'Framing',        description: '2×6 exterior walls @ 16" OC',
      csiCode: '06 11 10',        ctcTaskNumber: '06-11-10',
      quantity: 1200,             unit: 'LF',
      unitCost: 15.82,            inflationFactor: 1.13,
      subtotal: 18984,            totalLow: 17086, totalHigh: 22781,
      laborHours: 96,             laborRate: 89.50,
    },
    {
      category: 'HVAC',           description: 'Ducted split system 3-zone',
      csiCode: '23 81 26',        ctcTaskNumber: '15-64-10',
      quantity: 2,                unit: 'EA',
      unitCost: 7345,             inflationFactor: 1.13,
      subtotal: 14690,            totalLow: 13221, totalHigh: 17628,
      laborHours: 24,             laborRate: 110.00,
    },
  ],
  assumptions: ['Permits not included', 'Owner selects finishes'],
  exclusions:  ['Design fees', 'Furniture', 'Moving services'],
  confidence:  0.82,
})

const mockPermitJson = JSON.stringify({
  permits: [
    {
      permitType:    'Building Permit',
      agency:        "Prince George's County DPIE",
      estimatedFee:  1850,
      processingDays: 45,
      requiresPlans: true,
      requiresPE:    false,
      notes:         'Online submission available',
    },
    {
      permitType:    'Electrical Permit',
      agency:        "Prince George's County DPIE",
      estimatedFee:  350,
      processingDays: 14,
      requiresPlans: true,
      requiresPE:    false,
      notes:         'Sub-permit, separate application',
    },
  ],
  issues: [
    {
      severity:   'warning',
      message:    'Owner-occupied affidavit required for owner-builder exception',
      resolution: 'Submit affidavit with permit application',
    },
  ],
  readinessScore: 70,
  recommendation: 'File building permit first; electrical sub-permit follows automatically in PG County.',
})

// Mock Anthropic to return stage-appropriate JSON
let callCount = 0
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockImplementation(async (params: { model: string }) => {
        callCount++
        // DesignBot = opus, Estimate/Permit = sonnet
        const isDesign   = params.model === 'claude-opus-4-6'
        const isEstimate = !isDesign && callCount % 2 === 0
        const text = isDesign
          ? mockDesignJson
          : isEstimate ? mockEstimateJson : mockPermitJson

        return {
          content: [{ type: 'text', text }],
          model:   params.model,
          usage: {
            input_tokens:                  800,
            output_tokens:                 350,
            cache_creation_input_tokens:   callCount === 1 ? 800 : 0,
            cache_read_input_tokens:       callCount > 1   ? 800 : 0,
          },
        }
      }),
    },
  })),
}))

// ── Mock RAG retriever ────────────────────────────────────────────────────────

vi.mock('../../../../ai-orchestrator/src/retrieval/rag-retriever', () => ({
  loadRAGData:           vi.fn(),
  isRAGLoaded:           vi.fn().mockReturnValue(true),
  retrievePermitContext: vi.fn().mockReturnValue([
    {
      type:              'permit',
      jurisdiction:      'prince-george-county-md',
      project_types:     ['renovation', 'addition'],
      permit_type:       'Building Permit',
      processing_days:   45,
      requirements:      ['Architectural drawings', 'Site plan'],
      common_issues:     ['Missing PE stamp'],
      fee_base:          1200,
      fee_per_sqft:      0.15,
      expedited_available: true,
      online_submission:   true,
    },
  ]),
  retrieveCostContext: vi.fn().mockReturnValue([
    {
      type:                    'cost',
      project_type:            'renovation',
      jurisdiction:            'prince-george-county-md',
      cost_per_sqft:           165,
      avg_size_sqft:           1800,
      soft_costs_percent:      12,
      contingency_percent:     15,
      typical_duration_months: 6,
      primary_expense_categories: ['Framing', 'MEP', 'Finishes'],
    },
  ]),
  retrieveZoningContext: vi.fn().mockReturnValue([]),
}))

// ── Mock CTC calculator ───────────────────────────────────────────────────────

vi.mock('../../../../ai-orchestrator/src/costing/ctc-calculator', () => ({
  calculateCTC: vi.fn().mockReturnValue({
    total:         285000,
    range:         [242250, 342000] as [number, number],
    cost_per_sqft: 190,
    sqft:          1500,
    breakdown: {
      construction: 213750,
      soft:         25650,
      risk:         30938,
      execution:    14663,
    },
  }),
}))

// ── Mock Prisma ───────────────────────────────────────────────────────────────

const mockRunStore: Record<string, string> = {}

vi.mock('@prisma/client', () => {
  const PrismaClient = vi.fn().mockImplementation(() => ({
    keaBotRun: {
      create: vi.fn().mockImplementation(async ({ data }: { data: { id: string; status: string } }) => {
        mockRunStore[data.id] = data.status
        return data
      }),
      update: vi.fn().mockImplementation(async ({ where, data }: { where: { id: string }; data: { status?: string } }) => {
        if (data.status) mockRunStore[where.id] = data.status
        return { id: where.id, ...data }
      }),
      findUnique: vi.fn().mockImplementation(async ({ where }: { where: { id: string } }) => {
        const status = mockRunStore[where.id]
        return status ? { status } : null
      }),
      findMany: vi.fn().mockResolvedValue([]),
    },
    designConcept: {
      create: vi.fn().mockResolvedValue({ id: randomUUID() }),
    },
    estimateLineItem: {
      createMany: vi.fn().mockResolvedValue({ count: 3 }),
    },
    permitCase: {
      create: vi.fn().mockResolvedValue({ id: randomUUID() }),
    },
  }))
  return { PrismaClient }
})

// ── Import chain under test ───────────────────────────────────────────────────

import {
  runChain,
  runDesignBot,
  runEstimateBot,
  runPermitBot,
  ChainGateError,
  type ChainInput,
  type DesignBotResult,
  type EstimateBotResult,
} from '../bots.chain'

// ── Test data ─────────────────────────────────────────────────────────────────

const BASE_INPUT: ChainInput = {
  projectId:         `proj-${randomUUID()}`,
  projectType:       'renovation',
  location:          'Prince George\'s County, MD',
  scope:             'Full gut renovation of 1,500 SF single-family home. New kitchen, 2 bathrooms, open floor plan.',
  sqft:              1500,
  budgetUsd:         275000,
  jurisdiction:      'prince-george-county-md',
  zipCode:           '20743',
  structuralChanges:  true,
  electricalChanges:  true,
  plumbingChanges:    true,
  hvacChanges:        true,
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('KeaBots Chain — bots.chain.ts', () => {

  beforeEach(() => {
    callCount = 0
    // Reset run store
    for (const k of Object.keys(mockRunStore)) delete mockRunStore[k]
    vi.clearAllMocks()
  })

  // ────────────────────────────────────────────────────────────────────────────
  // 1. Full chain happy-path
  // ────────────────────────────────────────────────────────────────────────────

  describe('runChain — full chain', () => {
    it('runs all three stages and returns a ChainRunResult', async () => {
      const result = await runChain({ ...BASE_INPUT })

      expect(result.chainId).toMatch(/^[0-9a-f-]{36}$/)
      expect(result.projectId).toBe(BASE_INPUT.projectId)
      expect(result.design).toBeDefined()
      expect(result.estimate).toBeDefined()
      expect(result.permit).toBeDefined()
      expect(result.totalDurationMs).toBeGreaterThan(0)
    })

    it('returns botRunIds that look like UUIDs', async () => {
      const result = await runChain({ ...BASE_INPUT })

      expect(result.design.botRunId).toMatch(/^[0-9a-f-]{36}$/)
      expect(result.estimate.botRunId).toMatch(/^[0-9a-f-]{36}$/)
      expect(result.permit.botRunId).toMatch(/^[0-9a-f-]{36}$/)
    })

    it('chains parentRunIds correctly', async () => {
      const result = await runChain({ ...BASE_INPUT })

      expect(result.estimate.parentRunId).toBe(result.design.botRunId)
      expect(result.permit.parentRunId).toBe(result.estimate.botRunId)
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  // 2. DesignBot — output shape
  // ────────────────────────────────────────────────────────────────────────────

  describe('runDesignBot', () => {
    it('returns a valid DesignBotResult', async () => {
      const result = await runDesignBot({ ...BASE_INPUT })

      expect(result.botRunId).toMatch(/^[0-9a-f-]{36}$/)
      expect(result.ctcTotal).toBe(285000)
      expect(result.ctcRange).toEqual([242250, 342000])
      expect(result.sqft).toBe(1500)
      expect(result.bomItemCount).toBeGreaterThan(0)
      expect(Array.isArray(result.bom)).toBe(true)
      expect(result.aiConceptCostUsd).toBeGreaterThanOrEqual(445)
    })

    it('returns mepSystem with expected keys', async () => {
      const result = await runDesignBot({ ...BASE_INPUT })

      expect(result.mepSystem).toHaveProperty('hvac')
      expect(result.mepSystem).toHaveProperty('electrical')
      expect(result.mepSystem).toHaveProperty('plumbing')
    })

    it('returns BOM items with required fields', async () => {
      const result = await runDesignBot({ ...BASE_INPUT })

      for (const item of result.bom) {
        expect(item).toHaveProperty('item')
        expect(item).toHaveProperty('quantity')
        expect(item).toHaveProperty('unit')
        expect(item).toHaveProperty('estimatedCost')
      }
    })

    it('returns cacheMetrics with cache fields', async () => {
      const result = await runDesignBot({ ...BASE_INPUT })

      expect(result.cacheMetrics).toMatchObject({
        cacheCreationTokens: expect.any(Number),
        cacheReadTokens:     expect.any(Number),
        cacheHit:            expect.any(Boolean),
        savedTokens:         expect.any(Number),
      })
    })

    it('uses claude-opus-4-6 (premium tier)', async () => {
      const { default: Anthropic } = await import('@anthropic-ai/sdk')
      await runDesignBot({ ...BASE_INPUT })

      const instance = (Anthropic as ReturnType<typeof vi.fn>).mock.results[0]?.value
      const createCall = instance?.messages?.create?.mock?.calls[0]?.[0]
      expect(createCall?.model).toBe('claude-opus-4-6')
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  // 3. EstimateBot — chain gating + output shape
  // ────────────────────────────────────────────────────────────────────────────

  describe('runEstimateBot', () => {
    let designResult: DesignBotResult

    beforeEach(async () => {
      designResult = await runDesignBot({ ...BASE_INPUT })
    })

    it('returns a valid EstimateBotResult when design is COMPLETED', async () => {
      const result = await runEstimateBot({ ...BASE_INPUT }, designResult)

      expect(result.botRunId).toMatch(/^[0-9a-f-]{36}$/)
      expect(result.parentRunId).toBe(designResult.botRunId)
      expect(Array.isArray(result.lineItems)).toBe(true)
      expect(result.lineItems.length).toBeGreaterThan(0)
      expect(result.totalLow).toBeGreaterThan(0)
      expect(result.totalHigh).toBeGreaterThanOrEqual(result.totalLow)
      expect(result.confidence).toBeGreaterThan(0)
    })

    it('line items have inflationFactor 1.13', async () => {
      const result = await runEstimateBot({ ...BASE_INPUT }, designResult)

      for (const item of result.lineItems) {
        expect(item.inflationFactor).toBe(1.13)
      }
    })

    it('line items have required cost fields', async () => {
      const result = await runEstimateBot({ ...BASE_INPUT }, designResult)

      for (const item of result.lineItems) {
        expect(item.category).toBeTruthy()
        expect(item.description).toBeTruthy()
        expect(item.quantity).toBeGreaterThan(0)
        expect(item.unit).toBeTruthy()
        expect(item.unitCost).toBeGreaterThan(0)
        expect(item.subtotal).toBeGreaterThan(0)
      }
    })

    it('throws ChainGateError when parent run is FAILED', async () => {
      // Manually set the design run to FAILED in the mock store
      mockRunStore[designResult.botRunId] = 'FAILED'

      await expect(runEstimateBot({ ...BASE_INPUT }, designResult))
        .rejects.toThrow(ChainGateError)

      await expect(runEstimateBot({ ...BASE_INPUT }, designResult))
        .rejects.toMatchObject({
          stage:        'EstimateBot',
          parentRunId:  designResult.botRunId,
          parentStatus: 'FAILED',
        })
    })

    it('throws ChainGateError when parent run is IN_PROGRESS', async () => {
      mockRunStore[designResult.botRunId] = 'IN_PROGRESS'

      await expect(runEstimateBot({ ...BASE_INPUT }, designResult))
        .rejects.toThrow(ChainGateError)
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  // 4. PermitBot — chain gating + output shape
  // ────────────────────────────────────────────────────────────────────────────

  describe('runPermitBot', () => {
    let designResult:   DesignBotResult
    let estimateResult: EstimateBotResult

    beforeEach(async () => {
      designResult   = await runDesignBot({ ...BASE_INPUT })
      estimateResult = await runEstimateBot({ ...BASE_INPUT }, designResult)
    })

    it('returns a valid PermitBotResult when estimate is COMPLETED', async () => {
      const result = await runPermitBot({ ...BASE_INPUT }, estimateResult)

      expect(result.botRunId).toMatch(/^[0-9a-f-]{36}$/)
      expect(result.parentRunId).toBe(estimateResult.botRunId)
      expect(Array.isArray(result.permits)).toBe(true)
      expect(result.permits.length).toBeGreaterThan(0)
      expect(result.totalPermitCostUsd).toBeGreaterThan(0)
      expect(result.totalProcessingDays).toBeGreaterThan(0)
      expect(result.readinessScore).toBeGreaterThanOrEqual(0)
      expect(result.readinessScore).toBeLessThanOrEqual(100)
    })

    it('returns state MD for PG County', async () => {
      const result = await runPermitBot({ ...BASE_INPUT }, estimateResult)
      expect(result.state).toBe('MD')
    })

    it('returns state DC for Washington DC', async () => {
      const dcInput = { ...BASE_INPUT, location: 'Washington DC', jurisdiction: 'district-of-columbia' }
      const result  = await runPermitBot(dcInput, estimateResult)
      expect(result.state).toBe('DC')
    })

    it('returns state VA for Arlington', async () => {
      const vaInput = { ...BASE_INPUT, location: 'Arlington, VA', jurisdiction: 'arlington-county-va' }
      const result  = await runPermitBot(vaInput, estimateResult)
      expect(result.state).toBe('VA')
    })

    it('returns jurisdictionCacheHit=true when RAG has data', async () => {
      const result = await runPermitBot({ ...BASE_INPUT }, estimateResult)
      expect(result.jurisdictionCacheHit).toBe(true)
    })

    it('returns permit items with required fields', async () => {
      const result = await runPermitBot({ ...BASE_INPUT }, estimateResult)

      for (const permit of result.permits) {
        expect(permit.permitType).toBeTruthy()
        expect(permit.agency).toBeTruthy()
        expect(permit.estimatedFee).toBeGreaterThanOrEqual(0)
        expect(permit.processingDays).toBeGreaterThanOrEqual(0)
      }
    })

    it('throws ChainGateError when parent run is FAILED', async () => {
      mockRunStore[estimateResult.botRunId] = 'FAILED'

      await expect(runPermitBot({ ...BASE_INPUT }, estimateResult))
        .rejects.toThrow(ChainGateError)

      await expect(runPermitBot({ ...BASE_INPUT }, estimateResult))
        .rejects.toMatchObject({
          stage:        'PermitBot',
          parentRunId:  estimateResult.botRunId,
          parentStatus: 'FAILED',
        })
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  // 5. Claude prompt caching metrics
  // ────────────────────────────────────────────────────────────────────────────

  describe('Prompt caching — CacheMetrics', () => {
    it('first DesignBot call produces cache_creation tokens (cache write)', async () => {
      callCount = 0 // ensure first call
      const result = await runDesignBot({ ...BASE_INPUT })
      // First call: cacheCreationTokens > 0, cacheReadTokens = 0
      expect(result.cacheMetrics.cacheCreationTokens).toBeGreaterThan(0)
      expect(result.cacheMetrics.cacheHit).toBe(false)
    })

    it('subsequent call returns cache_read tokens (cache hit)', async () => {
      // Make callCount > 1 so mock returns cacheRead > 0
      callCount = 2
      const result = await runDesignBot({ ...BASE_INPUT })
      expect(result.cacheMetrics.cacheReadTokens).toBeGreaterThan(0)
      expect(result.cacheMetrics.cacheHit).toBe(true)
      expect(result.cacheMetrics.savedTokens).toBeGreaterThan(0)
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  // 6. JSON parse fallback
  // ────────────────────────────────────────────────────────────────────────────

  describe('JSON parse fallback', () => {
    it('chain completes with empty BOM if LLM returns non-JSON', async () => {
      const { default: Anthropic } = await import('@anthropic-ai/sdk')
      const mockInstance = (Anthropic as ReturnType<typeof vi.fn>).mock.results[0]?.value
      if (mockInstance?.messages?.create) {
        mockInstance.messages.create.mockResolvedValueOnce({
          content: [{ type: 'text', text: 'Sorry, I cannot help with that.' }],
          model:   'claude-opus-4-6',
          usage:   { input_tokens: 50, output_tokens: 20, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
        })
      }

      const result = await runDesignBot({ ...BASE_INPUT })
      // Falls back to empty objects/arrays — chain should not throw
      expect(result.botRunId).toMatch(/^[0-9a-f-]{36}$/)
      expect(Array.isArray(result.bom)).toBe(true)
      expect(typeof result.mepSystem).toBe('object')
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  // 7. ChainGateError shape
  // ────────────────────────────────────────────────────────────────────────────

  describe('ChainGateError', () => {
    it('is an instance of Error', () => {
      const err = new ChainGateError('test', 'EstimateBot', 'run-123', 'FAILED')
      expect(err).toBeInstanceOf(Error)
      expect(err).toBeInstanceOf(ChainGateError)
    })

    it('exposes stage, parentRunId, parentStatus', () => {
      const err = new ChainGateError('blocked', 'PermitBot', 'run-456', 'IN_PROGRESS')
      expect(err.stage).toBe('PermitBot')
      expect(err.parentRunId).toBe('run-456')
      expect(err.parentStatus).toBe('IN_PROGRESS')
      expect(err.name).toBe('ChainGateError')
    })
  })
})
