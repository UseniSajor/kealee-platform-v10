/**
 * bots-agentic.test.ts
 *
 * Tests for callModelAgentic() and buildRAGTool() added to bots.router.ts in Phase 1.
 *
 * Strategy:
 *   - vi.hoisted() for mockCreate — safe against vi.mock hoisting order
 *   - Mock @anthropic-ai/sdk with sequential mockResolvedValueOnce responses
 *   - Mock rag-retriever to avoid filesystem access
 *   - Verify tool invocation, token accumulation, maxIterations guard, error recovery
 *
 * TO RUN: pnpm --filter services/api test -- bots-agentic
 *
 * Last verified: Phase 1 (June 2026)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoist mockCreate so it is available inside vi.mock factory ─────────────────

const mockCreate = vi.hoisted(() => vi.fn())

// ── Mock Anthropic SDK ──────────────────────────────────────────────────────────

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  })),
}))

// ── Mock RAG retriever — avoid filesystem access ───────────────────────────────
// bots.rag-tool.ts imports the rag-retriever; mock it here so buildRAGTool()
// works without data files on disk.

vi.mock('../../../lib/orchestrator/retrieval/rag-retriever', () => ({
  isRAGLoaded:           vi.fn().mockReturnValue(true),
  loadRAGData:           vi.fn(),
  retrievePermitContext: vi.fn().mockReturnValue([
    { type: 'permit', permit_type: 'Building Permit', processing_days: 30, fee_base: 500 },
  ]),
  retrieveCostContext:   vi.fn().mockReturnValue([
    { type: 'cost', cost_per_sqft: 150, project_type: 'renovation' },
  ]),
  retrieveZoningContext: vi.fn().mockReturnValue([
    { type: 'zoning', zone: 'R-1', max_height_ft: 35 },
  ]),
}))

// ── Imports (after vi.mock — order matters for hoisting) ──────────────────────

import { callModelAgentic } from '../bots.router'
import { buildRAGTool }     from '../bots.rag-tool'
import { retrievePermitContext, retrieveCostContext, retrieveZoningContext } from '../../../lib/orchestrator/retrieval/rag-retriever'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeEndTurnResponse(text: string, inputTokens = 100, outputTokens = 50) {
  return {
    content:     [{ type: 'text', text }],
    stop_reason: 'end_turn',
    usage:       { input_tokens: inputTokens, output_tokens: outputTokens },
  }
}

function makeToolUseResponse(
  toolName:  string,
  toolId:    string,
  toolInput: unknown,
  preamble = '',
  inputTokens = 120,
  outputTokens = 40,
) {
  return {
    content: [
      ...(preamble ? [{ type: 'text', text: preamble }] : []),
      { type: 'tool_use', id: toolId, name: toolName, input: toolInput },
    ],
    stop_reason: 'tool_use',
    usage: { input_tokens: inputTokens, output_tokens: outputTokens },
  }
}

const BASE_PARAMS = {
  systemPrompt: 'You are a helpful assistant.',
  userPrompt:   'Hello',
  tools:        [],
}

// ─────────────────────────────────────────────────────────────────────────────
// callModelAgentic()
// ─────────────────────────────────────────────────────────────────────────────

describe('callModelAgentic()', () => {
  beforeEach(() => {
    mockCreate.mockReset()
  })

  // ── Basic end_turn path ───────────────────────────────────────────────────

  it('returns end_turn result when model stops with no tool calls', async () => {
    mockCreate.mockResolvedValueOnce(makeEndTurnResponse('Hello back!', 80, 30))

    const result = await callModelAgentic(BASE_PARAMS)

    expect(result.content).toBe('Hello back!')
    expect(result.iterations).toBe(1)
    expect(result.stoppedBy).toBe('end_turn')
    expect(result.toolsInvoked).toHaveLength(0)
    expect(result.inputTokens).toBe(80)
    expect(result.outputTokens).toBe(30)
  })

  it('extracts text from response even when preceded by no blocks', async () => {
    mockCreate.mockResolvedValueOnce({
      content:     [],
      stop_reason: 'end_turn',
      usage:       { input_tokens: 10, output_tokens: 5 },
    })

    const result = await callModelAgentic(BASE_PARAMS)

    expect(result.content).toBe('')
    expect(result.stoppedBy).toBe('end_turn')
  })

  // ── Tool invocation path ──────────────────────────────────────────────────

  it('invokes tool handler on tool_use, then returns on subsequent end_turn', async () => {
    const handler = vi.fn().mockResolvedValue({ data: 'tool output' })
    const tool = {
      name:         'my_tool',
      description:  'A test tool',
      input_schema: { type: 'object' as const, properties: {} },
      handler,
    }

    mockCreate
      .mockResolvedValueOnce(makeToolUseResponse('my_tool', 'tu-1', { key: 'val' }, 'Fetching...'))
      .mockResolvedValueOnce(makeEndTurnResponse('Done using tool.', 200, 60))

    const result = await callModelAgentic({ ...BASE_PARAMS, tools: [tool] })

    expect(result.stoppedBy).toBe('end_turn')
    expect(result.iterations).toBe(2)
    expect(result.toolsInvoked).toEqual(['my_tool'])
    expect(result.content).toBe('Done using tool.')
    expect(handler).toHaveBeenCalledOnce()
    expect(handler).toHaveBeenCalledWith({ key: 'val' })
  })

  it('sends tool_result as user message after tool invocation', async () => {
    const handler = vi.fn().mockResolvedValue({ answer: 42 })
    const tool = {
      name:         'calc',
      description:  'Calculates things',
      input_schema: { type: 'object' as const, properties: {} },
      handler,
    }

    mockCreate
      .mockResolvedValueOnce(makeToolUseResponse('calc', 'tu-abc', {}))
      .mockResolvedValueOnce(makeEndTurnResponse('Result noted.'))

    await callModelAgentic({ ...BASE_PARAMS, tools: [tool] })

    // Second call's messages should include the tool_result
    const secondCallMessages = mockCreate.mock.calls[1][0].messages
    const toolResultMsg = secondCallMessages.find(
      (m: any) => m.role === 'user' && Array.isArray(m.content),
    )
    expect(toolResultMsg).toBeDefined()
    expect(toolResultMsg.content[0].type).toBe('tool_result')
    expect(toolResultMsg.content[0].tool_use_id).toBe('tu-abc')
    const parsedContent = JSON.parse(toolResultMsg.content[0].content)
    expect(parsedContent).toEqual({ answer: 42 })
  })

  // ── Token accumulation ────────────────────────────────────────────────────

  it('accumulates inputTokens and outputTokens across all iterations', async () => {
    const tool = {
      name:         'ping',
      description:  'ping',
      input_schema: { type: 'object' as const, properties: {} },
      handler:      vi.fn().mockResolvedValue('pong'),
    }

    // 2 tool_use iterations + 1 end_turn
    mockCreate
      .mockResolvedValueOnce(makeToolUseResponse('ping', 'tu-1', {}, '', 120, 40))
      .mockResolvedValueOnce(makeToolUseResponse('ping', 'tu-2', {}, '', 130, 45))
      .mockResolvedValueOnce(makeEndTurnResponse('All done!', 50, 20))

    const result = await callModelAgentic({ ...BASE_PARAMS, tools: [tool] })

    expect(result.inputTokens).toBe(120 + 130 + 50)
    expect(result.outputTokens).toBe(40 + 45 + 20)
    expect(result.iterations).toBe(3)
    expect(result.toolsInvoked).toEqual(['ping', 'ping'])
  })

  // ── maxIterations guard ───────────────────────────────────────────────────

  it('stops at maxIterations and reports max_iterations', async () => {
    const tool = {
      name:         'infinite',
      description:  'Always requests another call',
      input_schema: { type: 'object' as const, properties: {} },
      handler:      vi.fn().mockResolvedValue('ok'),
    }

    // All calls return tool_use (infinite loop scenario)
    mockCreate.mockResolvedValue(makeToolUseResponse('infinite', 'tu-x', {}))

    const result = await callModelAgentic({ ...BASE_PARAMS, tools: [tool], maxIterations: 3 })

    expect(result.stoppedBy).toBe('max_iterations')
    expect(result.iterations).toBe(3)
    expect(mockCreate).toHaveBeenCalledTimes(3)
  })

  it('default maxIterations is 10', async () => {
    const tool = {
      name:         'loop',
      description:  'Loops',
      input_schema: { type: 'object' as const, properties: {} },
      handler:      vi.fn().mockResolvedValue('ok'),
    }

    mockCreate.mockResolvedValue(makeToolUseResponse('loop', 'tu-x', {}))

    const result = await callModelAgentic({ ...BASE_PARAMS, tools: [tool] })

    expect(result.iterations).toBe(10)
    expect(mockCreate).toHaveBeenCalledTimes(10)
  })

  // ── Error recovery ────────────────────────────────────────────────────────

  it('returns error tool_result for unknown tool name and continues loop', async () => {
    mockCreate
      .mockResolvedValueOnce(makeToolUseResponse('ghost_tool', 'tu-1', {}))
      .mockResolvedValueOnce(makeEndTurnResponse('Recovered from unknown tool.'))

    const result = await callModelAgentic({ ...BASE_PARAMS, tools: [] })

    expect(result.stoppedBy).toBe('end_turn')
    expect(result.toolsInvoked).toContain('ghost_tool')

    // Verify the error was sent as a tool_result
    const secondCallMessages = mockCreate.mock.calls[1][0].messages
    const toolResultMsg = secondCallMessages.find(
      (m: any) => m.role === 'user' && Array.isArray(m.content),
    )
    const parsed = JSON.parse(toolResultMsg.content[0].content)
    expect(parsed.error).toContain('Unknown tool: ghost_tool')
  })

  it('returns error tool_result when handler throws and continues loop', async () => {
    const failingTool = {
      name:         'explode',
      description:  'Always throws',
      input_schema: { type: 'object' as const, properties: {} },
      handler:      vi.fn().mockRejectedValue(new Error('DB connection refused')),
    }

    mockCreate
      .mockResolvedValueOnce(makeToolUseResponse('explode', 'tu-1', {}))
      .mockResolvedValueOnce(makeEndTurnResponse('Handled gracefully.'))

    const result = await callModelAgentic({ ...BASE_PARAMS, tools: [failingTool] })

    expect(result.stoppedBy).toBe('end_turn')
    expect(result.toolsInvoked).toContain('explode')

    const secondCallMessages = mockCreate.mock.calls[1][0].messages
    const toolResultMsg = secondCallMessages.find(
      (m: any) => m.role === 'user' && Array.isArray(m.content),
    )
    const parsed = JSON.parse(toolResultMsg.content[0].content)
    expect(parsed.error).toContain('DB connection refused')
  })

  // ── Model / tier selection ────────────────────────────────────────────────

  it('uses tier-based model and maxTokens by default', async () => {
    mockCreate.mockResolvedValueOnce(makeEndTurnResponse('OK'))

    await callModelAgentic({ ...BASE_PARAMS, tier: 'fast' })

    const args = mockCreate.mock.calls[0][0]
    expect(args.model).toBe('claude-haiku-4-5-20251001')
    expect(args.max_tokens).toBe(1024)
  })

  it('respects explicit model and maxTokens overrides', async () => {
    mockCreate.mockResolvedValueOnce(makeEndTurnResponse('OK'))

    await callModelAgentic({
      ...BASE_PARAMS,
      model:     'claude-opus-4-6',
      maxTokens: 8192,
    })

    const args = mockCreate.mock.calls[0][0]
    expect(args.model).toBe('claude-opus-4-6')
    expect(args.max_tokens).toBe(8192)
  })

  // ── API call structure ────────────────────────────────────────────────────

  it('passes systemPrompt and tools on every iteration', async () => {
    const tool = {
      name:         'check',
      description:  'Checks something',
      input_schema: { type: 'object' as const, properties: {} },
      handler:      vi.fn().mockResolvedValue('checked'),
    }

    mockCreate
      .mockResolvedValueOnce(makeToolUseResponse('check', 'tu-1', {}))
      .mockResolvedValueOnce(makeEndTurnResponse('Done'))

    await callModelAgentic({
      ...BASE_PARAMS,
      systemPrompt: 'Custom system prompt.',
      tools:        [tool],
    })

    for (const call of mockCreate.mock.calls) {
      expect(call[0].system).toBe('Custom system prompt.')
      expect(call[0].tools).toHaveLength(1)
      expect(call[0].tools[0].name).toBe('check')
    }
  })

  // ── Cost calculation ──────────────────────────────────────────────────────

  it('estimates cost correctly from accumulated token counts', async () => {
    // claude-sonnet-4-6 (standard): input $0.003/1k, output $0.015/1k
    mockCreate.mockResolvedValueOnce(makeEndTurnResponse('OK', 1000, 500))

    const result = await callModelAgentic({ ...BASE_PARAMS, tier: 'standard' })

    const expected = (1000 / 1000) * 0.003 + (500 / 1000) * 0.015
    expect(result.estimatedCostUSD).toBeCloseTo(expected, 6)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// buildRAGTool()
// ─────────────────────────────────────────────────────────────────────────────

describe('buildRAGTool()', () => {
  it('returns a tool named retrieve_relevant_context', () => {
    const tool = buildRAGTool()
    expect(tool.name).toBe('retrieve_relevant_context')
  })

  it('has a non-empty description', () => {
    const tool = buildRAGTool()
    expect(tool.description.length).toBeGreaterThan(20)
  })

  it('declares query as the only required parameter', () => {
    const tool = buildRAGTool()
    expect(tool.input_schema.required).toEqual(['query'])
  })

  it('exposes jurisdiction, category, and projectId as optional parameters', () => {
    const tool = buildRAGTool()
    const props = Object.keys(tool.input_schema.properties)
    expect(props).toContain('jurisdiction')
    expect(props).toContain('category')
    expect(props).toContain('projectId')
  })

  it('handler with category=permit returns only permit results', async () => {
    const tool = buildRAGTool()
    const result = await tool.handler({
      query:        'DC permit requirements',
      category:     'permit',
      jurisdiction: 'Washington DC',
    }) as any

    expect(result.results.permits).toBeDefined()
    expect(result.results.costs).toBeUndefined()
    expect(result.results.zoning).toBeUndefined()
    expect(retrievePermitContext).toHaveBeenCalledWith('Washington DC', expect.any(String))
  })

  it('handler with category=cost returns only cost results', async () => {
    const tool = buildRAGTool()
    const result = await tool.handler({
      query:        'renovation cost estimate',
      category:     'cost',
      jurisdiction: 'Arlington, VA',
    }) as any

    expect(result.results.costs).toBeDefined()
    expect(result.results.permits).toBeUndefined()
    expect(result.results.zoning).toBeUndefined()
  })

  it('handler with category=all returns permits, costs, and zoning', async () => {
    const tool = buildRAGTool()
    const result = await tool.handler({
      query:        'renovation info',
      category:     'all',
      jurisdiction: 'Bethesda, MD',
    }) as any

    expect(result.results.permits).toBeDefined()
    expect(result.results.costs).toBeDefined()
    expect(result.results.zoning).toBeDefined()
  })

  it('handler without category defaults to all and returns all result types', async () => {
    const tool = buildRAGTool()
    const result = await tool.handler({ query: 'general project info' }) as any

    expect(result.results.permits).toBeDefined()
    expect(result.results.costs).toBeDefined()
    expect(result.results.zoning).toBeDefined()
  })

  it('handler returns correct recordCount as sum of all result arrays', async () => {
    // Mocked: permits=[1 item], costs=[1 item], zoning=[1 item] → total 3
    const tool = buildRAGTool()
    const result = await tool.handler({ query: 'test query', category: 'all' }) as any

    expect(result.recordCount).toBe(3)
  })

  it('handler with no jurisdiction label shows "(all DMV)"', async () => {
    const tool = buildRAGTool()
    const result = await tool.handler({ query: 'general info' }) as any

    expect(result.jurisdiction).toBe('(all DMV)')
  })

  it('handler with jurisdiction shows the jurisdiction string', async () => {
    const tool = buildRAGTool()
    const result = await tool.handler({
      query:        'info',
      jurisdiction: 'McLean, VA',
    }) as any

    expect(result.jurisdiction).toBe('McLean, VA')
  })

  it('handler infers projectType=renovation for remodel queries', async () => {
    vi.mocked(retrieveCostContext).mockClear()
    const tool = buildRAGTool()
    await tool.handler({ query: 'kitchen remodel costs', category: 'cost', jurisdiction: 'DC' })

    expect(vi.mocked(retrieveCostContext)).toHaveBeenCalledWith('renovation', 'DC')
  })

  it('handler infers projectType=addition for addition queries', async () => {
    vi.mocked(retrieveCostContext).mockClear()
    const tool = buildRAGTool()
    await tool.handler({ query: 'rear addition project', category: 'cost', jurisdiction: 'Bethesda' })

    expect(vi.mocked(retrieveCostContext)).toHaveBeenCalledWith('addition', 'Bethesda')
  })

  it('handler infers projectType=commercial for office queries', async () => {
    vi.mocked(retrievePermitContext).mockClear()
    const tool = buildRAGTool()
    await tool.handler({ query: 'office fit-out permit', category: 'permit', jurisdiction: 'DC' })

    expect(vi.mocked(retrievePermitContext)).toHaveBeenCalledWith('DC', 'commercial')
  })

  it('handler falls back to renovation for unknown project type', async () => {
    vi.mocked(retrieveCostContext).mockClear()
    const tool = buildRAGTool()
    await tool.handler({ query: 'mystery project info', category: 'cost', jurisdiction: '' })

    expect(vi.mocked(retrieveCostContext)).toHaveBeenCalledWith('renovation', '')
  })
})
