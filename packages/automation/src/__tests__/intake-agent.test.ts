import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IntakeAgent } from '../agents/intake-agent.js';
import { AgentInputPayload } from '../agents/types.js';
import { generateJSON } from '../infrastructure/ai.js';

vi.mock('../infrastructure/ai.js', () => ({
  generateJSON: vi.fn(),
}));

describe('IntakeAgent', () => {
  let agent: IntakeAgent;

  beforeEach(() => {
    vi.clearAllMocks();
    agent = new IntakeAgent();
  });

  it('correctly maps LLM output to the AgentOutput schema', async () => {
    const mockInput: AgentInputPayload = {
      projectId: 'proj-123',
      triggerEvent: 'INTAKE_UPDATED',
      digitalTwinState: { budget: null, status: 'NEW' },
      eventPayload: { customerBudget: '200000', scope: 'kitchen remodel' },
    };

    const mockLLMResponse = {
      intakeCompletenessScore: 85,
      missingCriticalFields: ['propertyAddress'],
      inferredProjectFacts: { scope: 'kitchen remodel' },
      digitalTwinUpdates: {
        budget: { total: 200000 },
        status: 'INTAKE_REVIEW',
      },
      riskFlags: [],
      nextActions: [],
      confidenceScore: 0.9,
      requiresHumanReview: false,
    };

    // Cast the mock function
    (generateJSON as any).mockResolvedValue({ data: mockLLMResponse, usage: { input: 10, output: 10 } });

    const result = await agent.evaluate(mockInput);

    expect(generateJSON).toHaveBeenCalledTimes(1);
    expect(result.digitalTwinUpdates.budget.total).toBe(200000);
    expect(result.agentName).toBe('IntakeAgent');
    expect(result.loopType).toBe('intake_refinement');
    expect(result.confidenceScore).toBe(0.9);
  });
});
