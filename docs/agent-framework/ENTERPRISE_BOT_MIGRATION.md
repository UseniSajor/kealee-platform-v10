# Enterprise Bot Migration to Agentic Framework

## Overview

This guide shows how to migrate existing enterprise bots (DesignBot, EstimateBot, PermitBot, FloorplanBot) from the `EnterpriseBot` base class to the new `AgenticBot` framework for multi-step reasoning with RAG + browser capabilities.

## Migration Benefits

| Feature | EnterpriseBot | AgenticBot |
|---------|---------------|-----------|
| Multi-step reasoning | ❌ Single LLM call | ✅ Tool orchestration loop |
| RAG access | ❌ Manual | ✅ Auto-registered |
| Browser automation | ❌ No | ✅ Optional, secure |
| Error recovery | ⚠️ Basic | ✅ Tool-level with fallback |
| Audit logging | ⚠️ Basic metrics | ✅ Full execution trail |
| Session memory | ❌ No | ✅ Decision records + outputs |

## Migration Path

### Phase 1: Rename Base Class

**Before:**
```typescript
import { EnterpriseBot } from '@kealee/core-llm';

export class DesignBotEnterprise extends EnterpriseBot {
  constructor() {
    super({
      name: 'DesignBot',
      model: 'claude-opus-4-8',
      maxTokens: 4096,
      temperature: 0.7,
      // ...
    });
  }
}
```

**After:**
```typescript
import { AgenticBot } from '@kealee/core-bots';

export class DesignBotEnterprise extends AgenticBot {
  constructor() {
    super({
      name: 'DesignBot',
      domain: 'design',
      systemPrompt: DESIGN_BOT_SYSTEM_PROMPT,  // New requirement
      enableRagTool: true,   // Auto-register RAG
      enableBrowserTool: false, // Opt-in
    });
  }
}
```

### Phase 2: Update System Prompt

**Before:**
```typescript
// Single LLM call — generic prompt
const prompt = `Generate 3 design concepts for a ${projectType} project...`;
```

**After:**
```typescript
// Multi-step agentic prompt with tool guidance
const DESIGN_BOT_SYSTEM_PROMPT = `
You are an expert home design specialist. Your task is to generate detailed design concepts.

TOOLS AVAILABLE:
1. retrieve_context: Get design rules, standards, and material info for the location
2. (Optional) browse_web: Research design trends and competitor references

WORKFLOW:
1. First, retrieve_context to get location-specific building codes and preferences
2. Generate 3 design concepts that comply with retrieved rules
3. For each concept, provide:
   - Style + positioning
   - Key features
   - Materials & finishes
   - Estimated cost range
   - Build timeline

IMPORTANT:
- Always ground designs in retrieved context (jurisdiction rules, service specs)
- If retrieve_context returns empty, state the limitation and proceed with generic best-practices
- Be specific about materials and costs
- Flag any feasibility concerns upfront
`;
```

### Phase 3: Update execute() Method

**Before:**
```typescript
async execute(input: DesignInput): Promise<BotResult<DesignOutput>> {
  const result = await this.callClaude(
    buildPrompt(input),
    systemPrompt,
    cacheKey
  );

  const parsed = extractJsonObject(result.content);
  return {
    success: !!parsed,
    data: mapOutput(parsed),
    metrics: this.metrics,
    timestamp: new Date(),
  };
}
```

**After:**
```typescript
async handleMessage(message: string, context?: Record<string, unknown>): Promise<string> {
  // Multi-step execution: RAG + design generation
  return this.callAgentic(message, context);
}

// callAgentic() will:
// 1. Call Claude with system prompt + tools (RAG auto-included)
// 2. Claude may call retrieve_context for location rules
// 3. Execute tools, feed results back
// 4. Repeat until Claude produces final response
// 5. Return response + execution history
```

### Phase 4: Handle Different Input Styles

**If using AgenticBot with enterprise-style structured input:**

```typescript
async handleMessage(message: string, context?: Record<string, unknown>): Promise<string> {
  // Convert context to message format
  const structuredMessage = `
    Project Type: ${context?.projectType}
    Square Feet: ${context?.squareFeet}
    Budget: ${context?.budget}
    Style Preference: ${context?.stylePreferences?.join(', ')}
    
    Generate design concepts for this project.
  `;

  return this.callAgentic(structuredMessage, context);
}
```

## Migration Checklist

### For Each Enterprise Bot (Design, Estimate, Permit, Floorplan)

#### Step 1: File Updates
- [ ] Import `AgenticBot` instead of `EnterpriseBot`
- [ ] Update class to extend `AgenticBot`
- [ ] Add `domain` field to config
- [ ] Add `systemPrompt` field to config (replace inline prompt building)

#### Step 2: Prompt Engineering
- [ ] Write new agentic system prompt with tool guidance
- [ ] Add fallback guidance (what to do if tools fail)
- [ ] Include examples of multi-step reasoning
- [ ] Test prompt with RAG examples

#### Step 3: Method Updates
- [ ] Remove `callClaude()` calls
- [ ] Replace `execute()` with `handleMessage()`
- [ ] Remove cache key logic (handled by SessionMemory)
- [ ] Update error handling for agentic failures

#### Step 4: Output Handling
- [ ] Update output parsing to expect agentic response format
- [ ] Map tool history to metrics (success rate, tool breakdown)
- [ ] Preserve existing output schema (for API compatibility)

#### Step 5: Testing
- [ ] Unit test: bot initializes without errors
- [ ] Integration test: handleMessage() returns valid output
- [ ] Regression test: output schema matches old version
- [ ] Tool test: RAG tool calls work in execution
- [ ] Audit test: tool history recorded in SessionMemory

## Migration Example: DesignBot

### Before (EnterpriseBot)

```typescript
export class DesignBotEnterprise extends EnterpriseBot {
  constructor() {
    super({
      name: 'DesignBot',
      model: 'claude-opus-4-8',
      maxTokens: 4096,
      temperature: 0.7,
      timeout: 60000,
      retries: 3,
      cacheTTL: 3600,
    });
  }

  async execute(input: DesignInput): Promise<BotResult<DesignOutput>> {
    const startTime = Date.now();

    try {
      this.validateInput(input);

      const prompt = buildDesignPrompt(input);
      const result = await this.callClaude(prompt, DESIGN_SYSTEM_PROMPT, `design_${input.projectId}`);

      const parsed = extractJsonObject(result.content);
      const concepts = mapDesignConcepts(parsed);

      return {
        success: !!concepts,
        data: { concepts, recommendations: [] },
        metrics: this.metrics,
        timestamp: new Date(),
      };
    } catch (error) {
      this.metrics.errors++;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metrics: this.metrics,
        timestamp: new Date(),
      };
    }
  }
}
```

### After (AgenticBot)

```typescript
const DESIGN_BOT_SYSTEM_PROMPT = `
You are an expert residential design specialist. Generate detailed design concepts.

TOOLS:
- retrieve_context: Get design standards, material costs, build timelines for location

STEPS:
1. Analyze project requirements
2. Call retrieve_context with location + project type
3. Generate 3 design concepts using retrieved standards
4. Include: style, key features, materials, estimated cost, timeline

Guidelines:
- Always cite retrieved rules and standards
- Be specific about materials and costs
- Flag feasibility concerns upfront
- If retrieve_context returns empty: use generic best-practices and note limitation
`;

export class DesignBotEnterprise extends AgenticBot {
  constructor() {
    super({
      name: 'DesignBot',
      domain: 'design',
      systemPrompt: DESIGN_BOT_SYSTEM_PROMPT,
      enableRagTool: true,
      enableBrowserTool: false,
    });
  }

  async initialize(): Promise<void> {
    // Setup (if needed)
  }

  async handleMessage(message: string, context?: Record<string, unknown>): Promise<string> {
    // Build user message from context
    const userMessage = `
      Project Type: ${context?.projectType}
      Square Feet: ${context?.squareFeet}
      Budget: ${context?.budget}
      Style: ${context?.stylePreferences?.join(', ')}
      
      ${message}
    `;

    // Multi-step execution with RAG
    return this.callAgentic(userMessage, {
      sessionId: context?.sessionId,
      projectId: context?.projectId,
      userId: context?.userId,
    });
  }

  shouldHandoff(message: string) {
    // No handoff logic needed for now
    return null;
  }
}
```

## Migration Strategy

### Option A: Big Bang (All at Once)
- Migrate all 4 bots simultaneously
- Benefits: Consistent, single code review
- Risks: Higher blast radius if issues

### Option B: Phased (One Per Sprint)
- Design → Estimate → Permit → Floorplan
- Benefits: Learn from each migration, reduce risk
- Timeline: 4 sprints

### Option C: Parallel (Keep Both)
- New agentic versions in separate files
- Route new orders to agentic bots via feature flag
- Gradually shift traffic
- Sunset old bots after confidence builds

**Recommendation:** Option B (phased) with feature flag for safety.

## Feature Flag Integration

```typescript
// In bot registry or factory
function createDesignBot(useAgentic: boolean = process.env.AGENTIC_DESIGN_BOT === 'true') {
  if (useAgentic) {
    return new DesignBotAgentic();
  } else {
    return new DesignBotEnterprise(); // Old version
  }
}

// Usage
const bot = createDesignBot(true); // Opt-in to agentic
const result = await bot.handleMessage(userMessage, context);
```

## Testing Strategy

### Unit Tests
```typescript
describe('DesignBotAgentic', () => {
  it('initializes with agentic config', () => {
    const bot = new DesignBotAgentic();
    expect(bot.name).toBe('DesignBot');
    expect(bot.enableRagTool).toBe(true);
  });

  it('handleMessage returns string output', async () => {
    const result = await bot.handleMessage('Design a modern kitchen');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
```

### Integration Tests
```typescript
describe('DesignBotAgentic Integration', () => {
  it('uses RAG to ground design output', async () => {
    const result = await bot.handleMessage(
      'Design a kitchen in DC',
      { jurisdiction: 'DC' }
    );
    // Should mention DC-specific building codes
    expect(result.toLowerCase()).toMatch(/dc|district of columbia|setback/);
  });

  it('handles RAG failure gracefully', async () => {
    // Mock empty RAG results
    const result = await bot.handleMessage('Design a kitchen');
    // Should still return valid output, noting limitation
    expect(result.includes('limitation') || result.length > 0).toBe(true);
  });
});
```

### Regression Tests
```typescript
// Compare old vs new output schema
describe('Output Compatibility', () => {
  it('agentic output maps to old schema', async () => {
    const agenticResult = await agenticBot.handleMessage(testInput);
    const parsed = JSON.parse(agenticResult);

    expect(parsed).toHaveProperty('concepts');
    expect(parsed.concepts).toBeInstanceOf(Array);
    expect(parsed.concepts[0]).toHaveProperty('style');
    expect(parsed.concepts[0]).toHaveProperty('estimatedCost');
  });
});
```

## Rollback Plan

If agentic migration causes issues:

1. **Immediate:** Disable feature flag, route to old bot
2. **Short-term:** Investigate in staging environment
3. **Resolution:** Fix issue, re-enable with canary deployment
4. **Long-term:** Sunset old bot after confidence reached

```typescript
// In worker or API route
try {
  const result = await agenticBot.handleMessage(message);
  return result;
} catch (err) {
  console.error('Agentic bot failed, falling back:', err);
  // Fallback to old bot
  const fallbackBot = new DesignBotEnterprise();
  return await fallbackBot.execute(input);
}
```

## Timeline

- **Week 1:** Design bot migration + testing
- **Week 2:** Deploy to staging, run validation tests
- **Week 3:** Canary deploy (10% traffic)
- **Week 4:** Full rollout, monitor metrics
- **Week 5:** Repeat for Estimate bot
- **Weeks 6-9:** Permit + Floorplan bots

## Metrics to Track

- Success rate (vs old bot)
- Tool usage (% using RAG, average tool calls)
- Quality (user satisfaction, output correctness)
- Performance (duration, iterations, tool failures)
- Cost (token usage, API calls)

```typescript
// Monitor metrics
async function trackMigrationMetrics(result: AgenticJobResult) {
  await metrics.record({
    bot: 'design',
    success: result.success,
    toolCalls: result.toolHistory.length,
    iterations: result.totalIterations,
    durationMs: result.durationMs,
    timestamp: new Date(),
  });
}
```

## Support

For issues during migration:
- Check [VERIFICATION_CHECKLIST.md](VERIFICATION_CHECKLIST.md) for verification steps
- Review [agentic-execution.md](agentic-execution.md) for tool orchestration details
- See [rag-integration.md](rag-integration.md) for RAG prompt engineering
