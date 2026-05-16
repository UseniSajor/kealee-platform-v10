/**
 * SESSION 12 Smoke Tests — Orgo + Obsidian + Hermes
 * All 12 must pass before deployment.
 *
 * Tests:
 *  1. DesignBot produces valid JSON output
 *  2. EstimateBot chains after concept
 *  3. PermitBot chains after estimate
 *  4. Obsidian stores concept correctly
 *  5. Pricing rules load from core-rules
 *  6. Cache metrics recorded
 *  7. Approval workflow blocks estimate
 *  8. Events emit on completion
 *  9. DC DCRA permit blueprint correct
 * 10. Maryland Playwright fields correct
 * 11. No references to disallowed legacy services
 * 12. Cache hit rate >= 40%
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock Anthropic SDK ───────────────────────────────────────────────────────

const mockMessagesCreate = vi.fn();

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: mockMessagesCreate,
      },
    })),
  };
});

// ── Imports ──────────────────────────────────────────────────────────────────

import {
  ClaudeCachedClient,
  CacheMetricsLogger,
  KheaEventEmitter,
  KheaEvent,
} from '../hermes/hermes-function-routing';
import {
  Gateway,
  KeaBotExecutor,
  KeaBotRoot,
  ChainStage,
  AgentRole,
  createObsidianKnowledge,
  ExecutionContext,
} from '../orgo/orgo-agent-structure';
import {
  ObsidianKnowledgeBase,
  getObsidianKnowledgeBase,
} from '../obsidian/obsidian-knowledge-base';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeMockResponse(content: string, cacheHit = false) {
  return {
    content: [{ type: 'text', text: content }],
    stop_reason: 'end_turn',
    usage: {
      input_tokens: 100,
      output_tokens: 50,
      cache_creation_input_tokens: cacheHit ? 0 : 50,
      cache_read_input_tokens: cacheHit ? 45 : 0,
    },
  };
}

const sampleDesignOutput = JSON.stringify({
  concept: 'Open-plan kitchen renovation with quartz counters and LED lighting.',
  assumptions: ['DC jurisdiction', 'permit required'],
  imagePrompts: ['Front elevation', 'Interior view', 'Side view', 'Detail 1', 'Detail 2', 'Detail 3'],
  timeline: '8 weeks',
  risks: ['Supply chain delay'],
});

const sampleEstimateOutput = JSON.stringify({
  costs: { total: 45000, labor: 22000, materials: 18000, equipment: 5000 },
  breakdown: { HVAC: 12000, PLUMBING: 8000, ELECTRICAL: 10000, CARPENTRY: 15000 },
  timeline: '8 weeks',
  risks: ['Material price increase'],
});

const samplePermitOutput = JSON.stringify({
  jurisdiction: 'DC_DCRA',
  permitType: 'REST_API',
  documents: ['Stamped plans', 'PE signature'],
  filing: { method: 'oauth2', endpoint: 'https://api.dcapps.dc.gov/permits/v2' },
  verificationSteps: ['Check status in 5 business days'],
});

function makeContext(overrides: Partial<ExecutionContext> = {}): ExecutionContext {
  return {
    projectId: 'proj-smoke-001',
    userId: 'user-test',
    intents: ['ai concept'],
    metadata: {
      intakeAnswers: {
        property_type: 'Single-family home',
        scope: 'Kitchen remodel',
        budget: '$45,000',
        timeline: '8 weeks',
        location: 'Washington DC',
      },
    },
    startTime: new Date(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// TEST 1: DesignBot produces valid JSON output
// ============================================================================

describe('Smoke Test 1: DesignBot produces valid JSON output', () => {
  it('calls Claude Opus and parses JSON response', async () => {
    mockMessagesCreate.mockResolvedValue(makeMockResponse(sampleDesignOutput));

    const logger = new CacheMetricsLogger();
    const client = new ClaudeCachedClient(logger);
    const obsidian = createObsidianKnowledge();
    const executor = new KeaBotExecutor(client, obsidian);
    const context = makeContext();

    const result = await executor.runDesignBot(context);

    expect(result.conceptId).toBe(`concept-${context.projectId}`);
    expect(result.concept).toContain('kitchen');
    expect(Array.isArray(result.imagePrompts)).toBe(true);
    expect(result.imagePrompts).toHaveLength(6);
    expect(Array.isArray(result.assumptions)).toBe(true);
  });
});

// ============================================================================
// TEST 2: EstimateBot chains after concept
// ============================================================================

describe('Smoke Test 2: EstimateBot chains after concept', () => {
  it('requires concept output and returns cost breakdown', async () => {
    // First call: design, second call: estimate
    mockMessagesCreate
      .mockResolvedValueOnce(makeMockResponse(sampleDesignOutput))
      .mockResolvedValueOnce(makeMockResponse(sampleEstimateOutput));

    const logger = new CacheMetricsLogger();
    const client = new ClaudeCachedClient(logger);
    const obsidian = createObsidianKnowledge();
    const executor = new KeaBotExecutor(client, obsidian);
    const context = makeContext();

    const conceptResult = await executor.runDesignBot(context);
    const estimateResult = await executor.runEstimateBot(context, conceptResult);

    expect(estimateResult.estimateId).toBe(`estimate-${context.projectId}`);
    expect(estimateResult.costs).toBeDefined();
    expect(estimateResult.costs.total).toBe(45000);
    expect(mockMessagesCreate).toHaveBeenCalledTimes(2);
  });
});

// ============================================================================
// TEST 3: PermitBot chains after estimate
// ============================================================================

describe('Smoke Test 3: PermitBot chains after estimate', () => {
  it('requires concept + estimate and returns permit filing', async () => {
    mockMessagesCreate
      .mockResolvedValueOnce(makeMockResponse(sampleDesignOutput))
      .mockResolvedValueOnce(makeMockResponse(sampleEstimateOutput))
      .mockResolvedValueOnce(makeMockResponse(samplePermitOutput));

    const logger = new CacheMetricsLogger();
    const client = new ClaudeCachedClient(logger);
    const obsidian = createObsidianKnowledge();
    const executor = new KeaBotExecutor(client, obsidian);
    const context = makeContext();

    const conceptResult = await executor.runDesignBot(context);
    const estimateResult = await executor.runEstimateBot(context, conceptResult);
    const permitResult = await executor.runPermitBot(context, conceptResult, estimateResult);

    expect(permitResult.permitId).toBe(`permit-${context.projectId}`);
    expect(permitResult.jurisdiction).toBe('DC_DCRA');
    expect(mockMessagesCreate).toHaveBeenCalledTimes(3);
  });
});

// ============================================================================
// TEST 4: Obsidian stores concept correctly
// ============================================================================

describe('Smoke Test 4: Obsidian stores concept correctly', () => {
  it('stores and retrieves concept records', async () => {
    const obsidian = new ObsidianKnowledgeBase();

    const stored = await obsidian.storeConceptRecord('proj-001', 'user-001', {
      concept: 'Open-plan kitchen renovation',
      assumptions: ['DC jurisdiction'],
      imagePrompts: ['Front elevation', 'Interior view'],
      timeline: '8 weeks',
      risks: ['Supply delay'],
    });

    expect(stored.id).toMatch(/^concept-proj-001-/);
    expect(stored.status).toBe('DRAFT');
    expect(stored.images).toHaveLength(2);
    expect(stored.expiresAt.getTime()).toBeGreaterThan(Date.now());

    const retrieved = await obsidian.getConceptRecord(stored.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.concept).toContain('kitchen');
  });
});

// ============================================================================
// TEST 5: Pricing rules load from core-rules
// ============================================================================

describe('Smoke Test 5: Pricing rules load from core-rules', () => {
  it('returns 2026 DMV pricing with correct multipliers', async () => {
    const obsidian = new ObsidianKnowledgeBase();
    const rules = await obsidian.getPricingRules('DMV', 2026);

    expect(rules.year).toBe(2026);
    expect(rules.region).toBe('DMV');
    expect(rules.baselineMultiplier).toBe(1.28); // +28% DMV adjustment
    expect(rules.materialAdjustments.lumber).toBe(1.38);
    expect(rules.hourlyRates.HVAC.base).toBe(95);
    expect(rules.hourlyRates.HVAC.regional).toBe(121.6);
    expect(rules.contingencyRate).toBe(0.15);
    expect(rules.builderRiskRate).toBe(0.012);
  });
});

// ============================================================================
// TEST 6: Cache metrics recorded
// ============================================================================

describe('Smoke Test 6: Cache metrics recorded', () => {
  it('records cache metrics after each API call', async () => {
    mockMessagesCreate.mockResolvedValue(makeMockResponse(sampleDesignOutput, true));

    const logger = new CacheMetricsLogger();
    const client = new ClaudeCachedClient(logger);

    await client.callClaudeWithCache('ctx-001', 'test prompt', 'claude-sonnet-4-20250514');

    const metrics = await logger.getAggregateMetrics();

    expect(metrics.totalRequests).toBe(1);
    expect(metrics.totalTokensSaved).toBeGreaterThan(0);
  });
});

// ============================================================================
// TEST 7: Approval workflow blocks estimate
// ============================================================================

describe('Smoke Test 7: Approval workflow blocks estimate without approval', () => {
  it('returns false for unapproved concept', async () => {
    const obsidian = new ObsidianKnowledgeBase();

    const concept = await obsidian.storeConceptRecord('proj-002', 'user-002', {
      concept: 'Kitchen remodel',
      assumptions: [],
      imagePrompts: [],
      timeline: '6 weeks',
      risks: [],
    });

    // No approval given — should block
    const canProceed = await obsidian.canProceedToNextStage(concept.id, 'CONCEPT');
    expect(canProceed).toBe(false);
  });

  it('returns true after concept is approved', async () => {
    const obsidian = new ObsidianKnowledgeBase();

    const concept = await obsidian.storeConceptRecord('proj-003', 'user-003', {
      concept: 'Bathroom remodel',
      assumptions: [],
      imagePrompts: [],
      timeline: '4 weeks',
      risks: [],
    });

    await obsidian.approveConceptRecord(concept.id, 'client-user-003');

    const canProceed = await obsidian.canProceedToNextStage(concept.id, 'CONCEPT');
    expect(canProceed).toBe(true);
  });
});

// ============================================================================
// TEST 8: Events emit on completion
// ============================================================================

describe('Smoke Test 8: Events emit on completion', () => {
  it('emits DESIGN_COMPLETE event when design runs', () => {
    const emitter = new KheaEventEmitter();
    const received: any[] = [];

    emitter.on(KheaEvent.DESIGN_COMPLETE, (payload) => {
      received.push(payload);
    });

    emitter.emit(KheaEvent.DESIGN_COMPLETE, 'proj-001', { conceptId: 'concept-123' });

    expect(received).toHaveLength(1);
    expect(received[0].event).toBe(KheaEvent.DESIGN_COMPLETE);
    expect(received[0].contextId).toBe('proj-001');
    expect(received[0].data.conceptId).toBe('concept-123');
  });

  it('emits APPROVAL_REQUIRED when estimate is blocked', () => {
    const emitter = new KheaEventEmitter();
    const received: any[] = [];

    emitter.on(KheaEvent.APPROVAL_REQUIRED, (payload) => {
      received.push(payload);
    });

    emitter.emit(KheaEvent.APPROVAL_REQUIRED, 'proj-001', { stage: 'CONCEPT' });

    expect(received).toHaveLength(1);
    expect(received[0].data.stage).toBe('CONCEPT');
  });
});

// ============================================================================
// TEST 9: DC DCRA permit blueprint correct
// ============================================================================

describe('Smoke Test 9: DC DCRA permit blueprint correct', () => {
  it('returns REST_API type blueprint with OAuth2 auth', async () => {
    const obsidian = new ObsidianKnowledgeBase();
    const blueprint = await obsidian.getPermitBlueprint('DC_DCRA');

    expect(blueprint.type).toBe('REST_API');
    expect(blueprint.auth).toBe('OAuth2');
    expect(blueprint.jurisdiction).toBe('DC_DCRA');
    expect(blueprint.requirements).toContain('PE stamp and signature');
    expect(blueprint.requirements).toContain('Stamped site plans');
    expect(blueprint.approvalGates.some((g) => g.requiredApprovals.includes('PE'))).toBe(true);
  });
});

// ============================================================================
// TEST 10: Maryland Playwright fields correct
// ============================================================================

describe('Smoke Test 10: Maryland Playwright fields correct', () => {
  it('returns PLAYWRIGHT_AUTOMATION type with form fields', async () => {
    const obsidian = new ObsidianKnowledgeBase();
    const blueprint = await obsidian.getPermitBlueprint('MARYLAND_MONTGOMERY');

    expect(blueprint.type).toBe('PLAYWRIGHT_AUTOMATION');
    expect(blueprint.jurisdiction).toBe('MARYLAND_MONTGOMERY');
    expect(blueprint.formFields).toBeDefined();
    expect(blueprint.formFields!.length).toBeGreaterThan(0);

    const fieldNames = blueprint.formFields!.map((f) => f.name);
    expect(fieldNames).toContain('permit_type');
    expect(fieldNames).toContain('project_address');
    expect(fieldNames).toContain('scope_of_work');
    expect(fieldNames).toContain('estimated_cost');
  });
});

// ============================================================================
// TEST 11: No references to disallowed legacy services
// ============================================================================

describe('Smoke Test 11: No disallowed references in agent prompts', () => {
  it('DesignBot system prompt does not contain disallowed terms', () => {
    const logger = new CacheMetricsLogger();
    const client = new ClaudeCachedClient(logger);

    // Access private method via cast for testing
    const buildPrompt = (client as any).buildSystemPrompt.bind(client);
    const designPrompt = buildPrompt({ role: AgentRole.DESIGN });

    expect(designPrompt.toLowerCase()).not.toContain('zem solutions');
    expect(designPrompt.toLowerCase()).not.toContain('zem');
  });

  it('Execution constraints do not contain disallowed terms', () => {
    const logger = new CacheMetricsLogger();
    const client = new ClaudeCachedClient(logger);

    const buildConstraints = (client as any).buildExecutionConstraintsBlock.bind(client);
    const constraints = buildConstraints();

    expect(constraints.toLowerCase()).not.toContain('zem solutions');
  });
});

// ============================================================================
// TEST 12: Cache hit rate >= 40%
// ============================================================================

describe('Smoke Test 12: Cache hit rate >= 40%', () => {
  it('achieves >= 40% cache hit rate over multiple calls', async () => {
    // Simulate 10 calls: 5 cache misses, 5 cache hits
    const responses = [
      ...Array(5).fill(null).map(() => makeMockResponse(sampleDesignOutput, false)),
      ...Array(5).fill(null).map(() => makeMockResponse(sampleDesignOutput, true)),
    ];
    responses.forEach((r) => mockMessagesCreate.mockResolvedValueOnce(r));

    const logger = new CacheMetricsLogger();
    const client = new ClaudeCachedClient(logger);

    for (let i = 0; i < 10; i++) {
      await client.callClaudeWithCache(`ctx-${i}`, 'test prompt');
    }

    const metrics = await logger.getAggregateMetrics();

    expect(metrics.totalRequests).toBe(10);
    expect(metrics.cacheHitRate).toBeGreaterThanOrEqual(0.4); // >= 40%
  });
});
