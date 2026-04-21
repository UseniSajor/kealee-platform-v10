# LLM Fallback — Quick Reference

## API Signatures

### Primary: callLLMWithFallback()
```typescript
import { callLLMWithFallback } from '@kealee/core-bots'

const response = await callLLMWithFallback(
  messages: Anthropic.MessageParam[],
  systemPrompt: string,
  model: string,              // e.g. 'claude-sonnet-4-20250514'
  maxTokens: number,          // e.g. 4096
  temperature: number,        // e.g. 0.3
  tools?: Anthropic.Tool[],   // Optional: function definitions
)

// Returns: LLMResponse
interface LLMResponse {
  content: Anthropic.ContentBlock[]  // Response blocks (text, tool_use)
  stopReason: 'end_turn' | 'tool_use' | 'max_tokens' | 'stop_sequence' | 'error'
  llmSource: 'CLAUDE' | 'LOCAL' | 'ERROR'  // Which provider used
  error?: string                    // Error message if failed
}
```

### Configuration: getLLMStatus()
```typescript
import { getLLMStatus, isLLMHealthy } from '@kealee/core-bots'

const status = getLLMStatus()
// Returns: LLMStatusReport {
//   claude: { enabled, configured, endpoint },
//   localLLM: { enabled, baseUrl, model },
//   primaryProvider: 'CLAUDE' | 'LOCAL' | 'NONE',
//   status: 'FULL' | 'DEGRADED' | 'OFFLINE',
//   message: string
// }

const healthy = isLLMHealthy()  // boolean
```

### Provider Selection: getRecommendedProvider()
```typescript
import { getRecommendedProvider } from '@kealee/core-bots'

const provider = getRecommendedProvider('chat' | 'tools' | 'analysis')
// Returns: 'CLAUDE' | 'LOCAL'
// - Tools use case always returns CLAUDE (if available)
// - Other uses prefer CLAUDE, fallback to LOCAL
```

---

## Usage Examples

### KeaBots (Automatic)
No changes needed! The base class `KeaBot.chat()` automatically:
1. Tries Claude first
2. Falls back to local LLM on error
3. Includes `llmSource` in response

```typescript
const bot = new KeaBotCommand()
const response = await bot.handleMessage('Hello')
// response: '{ "content": "Hello! ...", "llmSource": "CLAUDE" }'
```

### Custom Integration
```typescript
import { callLLMWithFallback } from '@kealee/core-bots'
import Anthropic from '@anthropic-ai/sdk'

// Prepare messages
const messages: Anthropic.MessageParam[] = [
  { role: 'user', content: 'What is 2+2?' },
]

// Call with fallback
const result = await callLLMWithFallback(
  messages,
  'You are a math assistant.',
  'claude-sonnet-4-20250514',
  1024,
  0.7,
)

// Check source
if (result.llmSource === 'CLAUDE') {
  console.log('Using Claude API:', result.content)
} else if (result.llmSource === 'LOCAL') {
  console.log('Using local LLM (fallback):', result.content)
} else {
  console.error('Both failed:', result.error)
}
```

### With Tool Use
```typescript
// Claude supports function calling
const tools: Anthropic.Tool[] = [
  {
    name: 'calculator',
    description: 'Simple calculator',
    input_schema: {
      type: 'object' as const,
      properties: {
        expression: { type: 'string', description: 'Math expression' },
      },
      required: ['expression'],
    },
  },
]

const response = await callLLMWithFallback(
  messages,
  systemPrompt,
  model,
  maxTokens,
  temperature,
  tools,  // Pass tools
)

// Note: Local LLM won't use tools, returns text only
if (response.stopReason === 'tool_use' && response.llmSource === 'CLAUDE') {
  // Process tool calls
} else if (response.llmSource === 'LOCAL') {
  // Text response, no tool use
}
```

---

## Environment Variables

### Required (for Claude)
```bash
ANTHROPIC_API_KEY=sk-ant-...  # Existing
```

### Optional (for Local LLM Fallback)
```bash
INTERNAL_LLM_ENABLED=false                              # Enable fallback
INTERNAL_LLM_BASE_URL=http://localhost:8000             # vLLM/Ollama endpoint
INTERNAL_LLM_MODEL=meta-llama/Llama-2-7b-hf             # Model ID
```

---

## Local LLM Setup (3 Options)

### Option 1: vLLM (Recommended for CPU)
```bash
pip install vllm
python -m vllm.entrypoints.api_server \
  --model meta-llama/Llama-2-7b-hf \
  --port 8000
```

### Option 2: Ollama
```bash
# Install from https://ollama.ai
ollama pull llama2
ollama serve  # Runs on http://localhost:11434
# Update: INTERNAL_LLM_BASE_URL=http://localhost:11434
```

### Option 3: LM Studio
```bash
# Download from https://lmstudio.ai
# Load model → Start API server (port 1234)
# Update: INTERNAL_LLM_BASE_URL=http://localhost:1234
```

---

## Response Parsing

### Success (Any Provider)
```typescript
const response = await callLLMWithFallback(...)

if (response.stopReason !== 'error') {
  // Extract text from content blocks
  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map(block => block.text)
    .join('\n')

  console.log(`[${response.llmSource}]`, text)
}
```

### Error Handling
```typescript
if (response.stopReason === 'error') {
  console.error(`LLM failed [${response.llmSource}]:`, response.error)

  if (response.llmSource === 'ERROR') {
    // Both Claude and local LLM failed
    // Return user-friendly error message
  } else if (response.llmSource === 'LOCAL') {
    // Local LLM failed, but Claude was never tried
    // This shouldn't happen in normal flow
  }
}
```

### Tool Use (Claude Only)
```typescript
const toolUseBlocks = response.content.filter(
  (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
)

for (const tool of toolUseBlocks) {
  console.log(`Tool: ${tool.name}`, tool.input)
  // Execute tool, build tool_result block, continue loop
}
```

---

## Monitoring

### Check LLM Status
```typescript
import { getLLMStatus } from '@kealee/core-bots'

const status = getLLMStatus()
console.log('Primary provider:', status.primaryProvider)
console.log('Overall status:', status.status)
console.log('Message:', status.message)
```

### Track Fallback Usage
```typescript
const metrics = {
  claude_count: 0,
  local_count: 0,
  error_count: 0,
}

// After each call
if (result.llmSource === 'CLAUDE') metrics.claude_count++
else if (result.llmSource === 'LOCAL') metrics.local_count++
else metrics.error_count++

console.log('Fallback metrics:', metrics)
```

---

## Common Scenarios

### Scenario: Claude API Down
1. User sends message to KeaBot
2. `callLLMWithFallback()` tries Claude → fails
3. Falls back to local LLM (if enabled)
4. Returns response with `llmSource: 'LOCAL'`
5. User doesn't notice outage (graceful degradation)

### Scenario: Local LLM Not Configured
1. User sends message
2. Claude API call succeeds
3. Returns response with `llmSource: 'CLAUDE'`
4. Local LLM never needed

### Scenario: Both Unavailable
1. User sends message
2. Claude fails (network error, key invalid, quota exceeded)
3. Local LLM disabled or unreachable
4. Returns `{ error: '...', llmSource: 'ERROR' }`
5. Application shows error to user

---

## Performance Tips

### Reduce Latency
1. **Claude Primary**: 1-3 seconds (network round trip)
2. **vLLM on GPU**: 2-5 seconds (depends on hardware)
3. **Ollama on CPU**: 5-15 seconds (slow for large models)

### For Speed:
- Use smaller local model: `TinyLlama-1.1B` (fast) instead of `Llama-2-7b`
- Reduce `max_tokens` if possible
- Use GPU for vLLM/Ollama (set CUDA_VISIBLE_DEVICES)

### For Quality:
- Keep Claude as primary (Sonnet is best)
- Local fallback for non-critical tasks
- Monitor `llmSource` distribution, alert if too many fallbacks

---

## Troubleshooting

### "LLM not configured"
- Check `ANTHROPIC_API_KEY` is set
- Check `INTERNAL_LLM_ENABLED=true` if expecting fallback

### "Local LLM request failed"
- Verify vLLM/Ollama running: `curl http://localhost:8000/health`
- Check `INTERNAL_LLM_BASE_URL` is correct
- Check firewall not blocking port

### "Claude API failed"
- Check network connectivity
- Verify `ANTHROPIC_API_KEY` is valid
- Check API quota/rate limits

### "Tool use not working"
- Only Claude supports tool use
- Local LLM will return text-only (no function calling)
- Check `response.stopReason === 'tool_use'` only happens when `llmSource === 'CLAUDE'`

---

## See Also
- `/docs/llm-fallback.md` — Full setup guide
- `/packages/core-bots/src/llm-fallback.ts` — Implementation
- `/packages/core-bots/src/keabot-base.ts` — KeaBot integration
