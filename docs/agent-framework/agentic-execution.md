# Agentic Execution Framework

## Overview

The agentic execution system enables multi-step tool orchestration with Claude. Instead of a single LLM call, agents can iteratively call tools, receive results, and refine their approach until completion.

**Core function:** `callModelAgentic()`

## How It Works

```
User Message
    ↓
Claude API with tools
    ↓
Claude generates tool_use blocks (or end_turn)
    ↓
Execute each tool in parallel
    ↓
Feed results back to Claude
    ↓
Claude processes results + generates new tools/final text
    ↓
Loop until end_turn (no tool_use blocks)
    ↓
Final Text Response
```

## API Reference

### `callModelAgentic(args)`

Execute a multi-step agentic task with Claude tool use.

**Parameters:**

```typescript
{
  systemPrompt: string;         // Bot's system prompt
  userMessage: string;          // Initial user input
  tools: AgenticTool[];         // Available tools
  model?: string;               // Default: 'claude-opus-4-8'
  maxTokens?: number;           // Default: 4096
  context?: AgenticExecutionContext; // Session/project context
  memory?: SessionMemory;       // Optional: track tool history
}
```

**Returns:**

```typescript
{
  status: 'completed' | 'failed' | 'max_iterations_reached';
  finalText: string;            // Claude's final response
  toolHistory: ToolExecutionRecord[];
  totalIterations: number;
  error?: string;
}
```

### `AgenticTool` Interface

Define a tool that Claude can use:

```typescript
interface AgenticTool {
  name: string;                 // e.g., 'retrieve_context'
  description: string;          // What the tool does
  inputSchema: Record<string, unknown>; // JSON Schema
  execute: (input: unknown) => Promise<unknown>;
}
```

## Example: Research Task with RAG

```typescript
import { callModelAgentic, createRagTool } from '@kealee/core-agents';

const ragTool = createRagTool();

const result = await callModelAgentic({
  systemPrompt: 'You are a permit specialist. Answer questions about DC building codes.',
  userMessage: 'What are the setback requirements for a residential property in DC?',
  tools: [ragTool],
  model: 'claude-opus-4-8',
  maxTokens: 2048,
});

console.log(result.finalText);
// Output: A detailed answer citing DC zoning rules retrieved via RAG
```

## Tool History & Memory

When `memory` is provided, tool executions are persisted:

```typescript
const memory: SessionMemory = {
  userIntent: 'research permits',
  facts: { jurisdiction: 'DC' },
  constraints: {},
  riskFlags: [],
  agentNotes: [],
  toolHistory: [],
  stepOutputs: {},
  outputs: {},
  decisions: [],
};

const result = await callModelAgentic({
  // ...
  memory,
});

// After execution:
console.log(memory.toolHistory);
// [
//   { id: 'toolrun_...', toolName: 'retrieve_context', input: {...}, output: {...}, success: true, ... },
//   ...
// ]
```

## Built-in Tools

### `retrieve_context` (RAG)

Retrieve knowledge from seed packs (jurisdictions, services, rules, workflows).

**Input:**
```typescript
{
  query: string;               // Search query
  sourceTypes?: string[];      // Filter: 'jurisdiction', 'service', 'rule', etc.
  jurisdictionCode?: string;   // Boost: 'DC', 'MD_MONTGOMERY'
  serviceCategory?: string;    // Filter: 'kitchen', 'bathroom', 'permit'
  topK?: number;               // Max results (default: 8)
}
```

**Output:**
```typescript
{
  blocks: RetrievedContextBlock[];
  summary: string;
  hitCount: number;
  avgScore: number; // 0–1
}
```

### `browse_web` (Browser Automation)

Control a browser to navigate and extract information. **Requires:** `enableBrowserTool: true` on bot config.

**Actions:**
- `navigate`: Go to URL
- `click`: Click an element
- `input`: Fill a text field
- `extract`: Get element content
- `screenshot`: Capture page/element

**Input:**
```typescript
{
  sessionId: string;
  action: 'navigate' | 'click' | 'input' | 'extract' | 'screenshot';
  url?: string;                // For navigate
  selector?: string;           // For click/input/extract/screenshot
  text?: string;               // For input
  format?: 'text' | 'json' | 'html'; // For extract (default: text)
  timeout?: number;            // In ms (default: 10000)
  waitForSelector?: string;    // After navigate, wait for selector
}
```

**Output:**
```typescript
{
  success: boolean;
  data?: unknown;              // Extracted data or base64 screenshot
  error?: string;
  durationMs: number;
}
```

## Error Handling

### Tool Execution Errors

If a tool throws, the error is returned to Claude:

```typescript
// Tool fails
execute: async (input) => {
  throw new Error('API unreachable');
}

// Claude receives:
{
  type: 'tool_result',
  tool_use_id: '...',
  content: 'Error: API unreachable',
  is_error: true,
}

// Claude can then decide to retry, use fallback, or inform user
```

### Iteration Limits

Default max iterations: 20. If reached without completion, status is `max_iterations_reached`.

### Timeouts

Default iteration timeout: 30s per iteration. If exceeded, execution fails.

## Security Constraints

### Browser Tool

- **Blocked URLs:** localhost, 127.0.0.1, private IPs (10.x, 172.16-31.x, 192.168.x), file://, internal domains
- **Audit Logging:** All navigations and interactions logged to `BrowserSecurityAuditLog`
- **User-Agent Obfuscation:** Rotates through realistic user agents
- **Cookie Isolation:** No credential leakage between sessions

### RAG Tool

- No sensitive data in seed pack queries
- Jurisdiction + service filtering built-in
- Results ranked by relevance score

## Best Practices

1. **Clear System Prompts:** Define bot role and constraints upfront
2. **Chunked Tasks:** Break large tasks into smaller, focused user messages
3. **Tool Descriptions:** Write detailed descriptions so Claude knows when to use tools
4. **Fallback Guidance:** In system prompt, tell Claude what to do if tools fail
5. **Monitor Tool History:** Review `toolHistory` for unexpected patterns

## Example: Multi-Step Estimate Flow

```typescript
const estimateBot = new EstimateBotAgentic({
  name: 'EstimateBot',
  domain: 'construction',
  systemPrompt: `You are a construction cost estimator. 
    Use retrieve_context to find cost rules for the jurisdiction.
    Break down estimates into labor, materials, and contingency.`,
  enableRagTool: true,
});

const result = await estimateBot.handleMessage(
  'Generate a cost estimate for a kitchen remodel in DC (500 sqft, mid-range finishes)',
  { projectId: 'proj_123', jurisdiction: 'DC' }
);

// EstimateBot internally calls callModelAgentic with RAG tool
// Claude retrieves DC cost data, applies rules, returns estimate
```
