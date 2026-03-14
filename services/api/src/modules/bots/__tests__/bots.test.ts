/**
 * bots.test.ts
 *
 * Tests for the KeaBots framework:
 *   - BotRegistry (registration, list, has)
 *   - bots.router (parseJSON, checkCostGuard, isLLMAvailable)
 *   - bots.logger (startStep, newRequestId, recordTrace, getRecentTraces, getTrace)
 *   - LeadBot (deterministic scoring, fallback reply)
 *   - EstimateBot (deterministic pre-estimate, fallback breakdown)
 *   - PermitBot (checklist builder, readiness score)
 *   - ContractorMatchBot (deterministic scoring logic)
 *   - SupportBot (category classification, escalation)
 *
 * All LLM calls are mocked — no Anthropic API key required.
 *
 * TO RUN: pnpm --filter services/api test -- bots
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ── Mock Anthropic SDK ─────────────────────────────────────────────────────────

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Mock LLM response' }],
        usage:   { input_tokens: 100, output_tokens: 50 },
      }),
    },
  })),
}))

// ── Mock prismaAny (for ContractorMatchBot + ProjectMonitorBot) ───────────────

vi.mock('../../../utils/prisma-helper', () => ({
  prismaAny: {
    rotationQueueEntry: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    project: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
  },
}))

// ── Imports ───────────────────────────────────────────────────────────────────

import { botRegistry }           from '../bots.registry'
import { parseJSON, checkCostGuard } from '../bots.router'
import { startStep, newRequestId, recordTrace, getRecentTraces, getTrace } from '../bots.logger'
import { LeadBot }               from '../bots/lead.bot'
import { EstimateBot }           from '../bots/estimate.bot'
import { PermitBot }             from '../bots/permit.bot'
import { ContractorMatchBot }    from '../bots/contractor-match.bot'
import { SupportBot }            from '../bots/support.bot'
import { prismaAny }             from '../../../utils/prisma-helper'

// ─────────────────────────────────────────────────────────────────────────────
// BotRegistry
// ─────────────────────────────────────────────────────────────────────────────

describe('BotRegistry', () => {
  it('registers all 6 bots on init', () => {
    const list = botRegistry.list()
    expect(list).toHaveLength(6)
    const ids = list.map(b => b.id)
    expect(ids).toContain('lead-bot')
    expect(ids).toContain('estimate-bot')
    expect(ids).toContain('permit-bot')
    expect(ids).toContain('contractor-match-bot')
    expect(ids).toContain('project-monitor-bot')
    expect(ids).toContain('support-bot')
  })

  it('returns a bot by id', () => {
    const bot = botRegistry.get('lead-bot')
    expect(bot).toBeDefined()
    expect(bot?.name).toBe('LeadBot')
  })

  it('returns undefined for unknown botId', () => {
    expect(botRegistry.get('unknown-bot' as any)).toBeUndefined()
  })

  it('has() returns true for valid ids', () => {
    expect(botRegistry.has('estimate-bot')).toBe(true)
    expect(botRegistry.has('ghost-bot')).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// bots.router helpers
// ─────────────────────────────────────────────────────────────────────────────

describe('parseJSON()', () => {
  it('extracts JSON from a fenced block', () => {
    const raw = 'Some text\n```json\n{"score": 42}\n```'
    expect(parseJSON(raw, null)).toEqual({ score: 42 })
  })

  it('extracts bare JSON object', () => {
    const raw = '{"foo": "bar", "n": 1}'
    expect(parseJSON(raw, null)).toEqual({ foo: 'bar', n: 1 })
  })

  it('returns fallback on invalid JSON', () => {
    expect(parseJSON('not json at all', { default: true })).toEqual({ default: true })
  })

  it('returns fallback when no JSON-like content', () => {
    expect(parseJSON('just text', [])).toEqual([])
  })
})

describe('checkCostGuard()', () => {
  it('allows calls within rate limit', () => {
    const r = checkCostGuard({ key: 'test-user-new', maxPerHour: 10 })
    expect(r.allowed).toBe(true)
  })

  it('blocks after exceeding hourly limit', () => {
    const key = `rate-limit-test-${Date.now()}`
    // Exhaust limit
    for (let i = 0; i < 3; i++) checkCostGuard({ key, maxPerHour: 3 })
    const result = checkCostGuard({ key, maxPerHour: 3 })
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('Rate limit')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// bots.logger
// ─────────────────────────────────────────────────────────────────────────────

describe('bots.logger', () => {
  it('newRequestId returns a UUID-like string', () => {
    const id = newRequestId()
    expect(id).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('startStep.finish() returns correct BotStep shape', () => {
    const timer = startStep('deterministic', 'test_step', 'input summary')
    const step  = timer.finish('output summary')
    expect(step.name).toBe('test_step')
    expect(step.type).toBe('deterministic')
    expect(step.inputSummary).toBe('input summary')
    expect(step.outputSummary).toBe('output summary')
    expect(step.durationMs).toBeGreaterThanOrEqual(0)
    expect(step.error).toBeUndefined()
  })

  it('recordTrace + getTrace roundtrip', () => {
    const requestId = newRequestId()
    const trace = {
      requestId,
      botId:        'lead-bot' as const,
      startedAt:    new Date(),
      completedAt:  new Date(),
      durationMs:   10,
      deterministic: true,
      steps:        [],
    }
    recordTrace(trace)
    const found = getTrace(requestId)
    expect(found).toBeDefined()
    expect(found?.requestId).toBe(requestId)
  })

  it('getRecentTraces returns traces in LIFO order', () => {
    const id1 = newRequestId()
    const id2 = newRequestId()
    recordTrace({ requestId: id1, botId: 'support-bot', startedAt: new Date(), completedAt: new Date(), durationMs: 1, deterministic: true, steps: [] })
    recordTrace({ requestId: id2, botId: 'support-bot', startedAt: new Date(), completedAt: new Date(), durationMs: 1, deterministic: true, steps: [] })
    const traces = getRecentTraces(2, 'support-bot')
    expect(traces[0].requestId).toBe(id2) // most recent first
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// LeadBot
// ─────────────────────────────────────────────────────────────────────────────

describe('LeadBot', () => {
  const bot = new LeadBot()

  it('has correct metadata', () => {
    expect(bot.id).toBe('lead-bot')
    expect(bot.costProfile).toBe('low')
    expect(bot.requiresLLM).toBe(true)
  })

  it('scores a high-quality lead correctly (deterministic)', async () => {
    // This message should score high: location + budget + ready to start
    const result = await bot.execute({
      data: {
        sessionId: 'sess-1',
        message:   'I am ready to start my renovation project in Bethesda MD next month. Budget is $200K.',
      },
    }, { botId: 'lead-bot', requestId: newRequestId() })

    expect(result.success).toBe(true)
    // Location (+20) + budget (+15) + timeline (+10) + ready? — should be >= 45
    expect(result.result.leadScore).toBeGreaterThanOrEqual(45)
  })

  it('scores a low-quality lead below handoff threshold', async () => {
    const result = await bot.execute({
      data: {
        sessionId: 'sess-2',
        message:   'I am just browsing.',
      },
    }, { botId: 'lead-bot', requestId: newRequestId() })

    expect(result.result.leadScore).toBeLessThan(65)
    expect(result.result.readyForHandoff).toBe(false)
  })

  it('returns a reply string', async () => {
    const result = await bot.execute({
      data: { sessionId: 'sess-3', message: 'Tell me about your services' },
    }, { botId: 'lead-bot', requestId: newRequestId() })

    expect(typeof result.result.reply).toBe('string')
    expect(result.result.reply.length).toBeGreaterThan(0)
  })

  it('includes trace with at least one step', async () => {
    const result = await bot.execute({
      data: { sessionId: 'sess-4', message: 'Hello' },
    }, { botId: 'lead-bot', requestId: newRequestId() })

    expect(result.trace.steps.length).toBeGreaterThanOrEqual(1)
    expect(result.trace.botId).toBe('lead-bot')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// EstimateBot
// ─────────────────────────────────────────────────────────────────────────────

describe('EstimateBot', () => {
  const bot = new EstimateBot()

  it('has correct metadata', () => {
    expect(bot.id).toBe('estimate-bot')
    expect(bot.costProfile).toBe('medium')
  })

  it('returns a budget range for a known project type', async () => {
    const result = await bot.execute({
      data: {
        projectType:    'residential renovation',
        location:       'Bethesda MD',
        scopeOfWork:    'Kitchen and two bathrooms full gut renovation',
        squareFootage:  1200,
        qualityLevel:   'premium',
      },
    }, { botId: 'estimate-bot', requestId: newRequestId() })

    expect(result.success).toBe(true)
    expect(result.result.totalLow).toBeGreaterThan(0)
    expect(result.result.totalHigh).toBeGreaterThan(result.result.totalLow)
    expect(result.result.breakdown.length).toBeGreaterThan(0)
    expect(result.result.validityPeriodDays).toBe(30)
  })

  it('applies DC premium location multiplier', async () => {
    const dcResult = await bot.execute({
      data: {
        projectType: 'renovation', location: 'Washington DC',
        scopeOfWork: 'Full interior', squareFootage: 1000, qualityLevel: 'standard',
      },
    }, { botId: 'estimate-bot', requestId: newRequestId() })

    const defaultResult = await bot.execute({
      data: {
        projectType: 'renovation', location: 'Rural town',
        scopeOfWork: 'Full interior', squareFootage: 1000, qualityLevel: 'standard',
      },
    }, { botId: 'estimate-bot', requestId: newRequestId() })

    // DC estimate should be higher due to multiplier (1.25 vs 1.0)
    expect(dcResult.result.totalLow).toBeGreaterThan(defaultResult.result.totalLow)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// PermitBot
// ─────────────────────────────────────────────────────────────────────────────

describe('PermitBot', () => {
  const bot = new PermitBot()

  it('has correct metadata', () => {
    expect(bot.id).toBe('permit-bot')
  })

  it('builds checklist including structural items when flag is set', async () => {
    const result = await bot.execute({
      data: {
        projectType:       'addition',
        jurisdiction:      'Arlington, VA',
        scope:             'Two-story rear addition',
        structuralChanges: true,
        electricalChanges: true,
      },
    }, { botId: 'permit-bot', requestId: newRequestId() })

    expect(result.success).toBe(true)
    const checklist = result.result.checklist
    const hasStructural = checklist.some(i => /structural engineer/i.test(i.item))
    const hasElectrical = checklist.some(i => /electrical/i.test(i.item))
    expect(hasStructural).toBe(true)
    expect(hasElectrical).toBe(true)
  })

  it('returns readiness score between 0-100', async () => {
    const result = await bot.execute({
      data: {
        projectType:  'renovation',
        jurisdiction: 'DC',
        scope:        'Kitchen renovation',
      },
    }, { botId: 'permit-bot', requestId: newRequestId() })

    expect(result.result.readinessScore).toBeGreaterThanOrEqual(0)
    expect(result.result.readinessScore).toBeLessThanOrEqual(100)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ContractorMatchBot
// ─────────────────────────────────────────────────────────────────────────────

describe('ContractorMatchBot', () => {
  const bot = new ContractorMatchBot()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(prismaAny.rotationQueueEntry.findMany as any).mockResolvedValue([])
  })

  it('has correct metadata', () => {
    expect(bot.id).toBe('contractor-match-bot')
    expect(bot.requiresLLM).toBe(false) // deterministic-first
  })

  it('returns empty matches when no candidates in DB', async () => {
    const result = await bot.execute({
      data: {
        leadId:      'lead-001',
        projectType: 'renovation',
        location:    'Bethesda',
        budget:      150000,
      },
    }, { botId: 'contractor-match-bot', requestId: newRequestId() })

    expect(result.success).toBe(true)
    expect(result.result.matches).toHaveLength(0)
    expect(result.result.totalCandidates).toBe(0)
  })

  it('scores and ranks candidates correctly', async () => {
    const mockCandidates = [
      {
        id:                'entry-1',
        status:            'ELIGIBLE',
        licenseVerified:   true,
        insuranceVerified: true,
        professionalType:  'CONTRACTOR',
        profile: {
          id:                   'profile-1',
          businessName:         'Verified Pro LLC',
          specialties:          ['RENOVATION'],
          performanceScore:     90,
          maxPipelineValue:     2000000,
          currentPipelineValue: 500000,
          rating:               4.8,
          projectsCompleted:    25,
        },
      },
      {
        id:                'entry-2',
        status:            'IN_ROTATION',
        licenseVerified:   false,
        insuranceVerified: false,
        professionalType:  'CONTRACTOR',
        profile: {
          id:                   'profile-2',
          businessName:         'Unverified GC',
          specialties:          [],
          performanceScore:     60,
          maxPipelineValue:     null,
          currentPipelineValue: null,
          rating:               3.5,
          projectsCompleted:    5,
        },
      },
    ]

    ;(prismaAny.rotationQueueEntry.findMany as any).mockResolvedValue(mockCandidates)

    const result = await bot.execute({
      data: {
        leadId:      'lead-002',
        projectType: 'renovation',
        location:    'DC',
        budget:      200000,
      },
    }, { botId: 'contractor-match-bot', requestId: newRequestId() })

    expect(result.result.matches).toHaveLength(2)
    // Verified pro should rank first (higher score)
    expect(result.result.matches[0].profileId).toBe('profile-1')
    expect(result.result.matches[0].score).toBeGreaterThan(result.result.matches[1].score)
    // Verified pro should be recommended (>= 70)
    expect(result.result.matches[0].recommended).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SupportBot
// ─────────────────────────────────────────────────────────────────────────────

describe('SupportBot', () => {
  const bot = new SupportBot()

  it('has correct metadata', () => {
    expect(bot.id).toBe('support-bot')
    expect(bot.costProfile).toBe('low')
  })

  it('classifies billing questions correctly', async () => {
    const result = await bot.execute({
      data: { sessionId: 'sess-10', message: 'I need a refund for my last invoice' },
    }, { botId: 'support-bot', requestId: newRequestId() })

    expect(result.result.category).toBe('billing')
    expect(result.result.shouldEscalate).toBe(true) // refund = escalate
  })

  it('classifies legal/dispute as escalation', async () => {
    const result = await bot.execute({
      data: { sessionId: 'sess-11', message: 'This contractor scammed me, I need a lawyer!' },
    }, { botId: 'support-bot', requestId: newRequestId() })

    expect(result.result.shouldEscalate).toBe(true)
    expect(result.result.category).toBe('escalation')
  })

  it('classifies navigation question correctly', async () => {
    const result = await bot.execute({
      data: { sessionId: 'sess-12', message: 'Where do I find my active leads?' },
    }, { botId: 'support-bot', requestId: newRequestId() })

    expect(result.result.category).toBe('navigation')
    expect(result.result.shouldEscalate).toBe(false)
  })

  it('returns suggestedActions array', async () => {
    const result = await bot.execute({
      data: { sessionId: 'sess-13', message: 'How do I upload my license?' },
    }, { botId: 'support-bot', requestId: newRequestId() })

    expect(Array.isArray(result.result.suggestedActions)).toBe(true)
    expect(result.result.suggestedActions.length).toBeGreaterThan(0)
  })

  it('includes trace with deterministic + llm steps', async () => {
    const result = await bot.execute({
      data: { sessionId: 'sess-14', message: 'Hello, how does Kealee work?' },
    }, { botId: 'support-bot', requestId: newRequestId() })

    expect(result.trace.steps.length).toBeGreaterThanOrEqual(1)
    const hasClassifyStep = result.trace.steps.some(s => s.name === 'classify_category')
    expect(hasClassifyStep).toBe(true)
  })
})
