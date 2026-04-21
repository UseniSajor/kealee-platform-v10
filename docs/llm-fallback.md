# LLM Fallback System for KeaBots

## Overview

KeaBots now support graceful fallback from Claude API to local LLM (vLLM/Ollama) if Claude becomes unavailable or fails. All responses include an `llmSource` flag for audit trail.

## Behavior

### Default (Claude Primary)
1. **Attempt Claude API** first via `@anthropic-ai/sdk`
2. **On Success**: Return response with `llmSource: 'CLAUDE'`
3. **On Failure**: Log error and attempt fallback

### Fallback (Local LLM)
1. **If Claude fails** AND `INTERNAL_LLM_ENABLED=true`:
   - Attempt local LLM at `INTERNAL_LLM_BASE_URL`
   - Convert messages to local LLM format
   - Return response with `llmSource: 'LOCAL'`
2. **If Local LLM fails** OR `INTERNAL_LLM_ENABLED=false`:
   - Return error response with `llmSource: 'ERROR'`
   - Include error message for debugging

### Response Format
```json
{
  "content": "Bot response text",
  "llmSource": "CLAUDE" | "LOCAL" | "ERROR"
}
```

Or on error:
```json
{
  "error": "Error message",
  "llmSource": "CLAUDE" | "LOCAL" | "ERROR"
}
```

## Configuration

### Environment Variables

```bash
# Enable/disable local LLM fallback
INTERNAL_LLM_ENABLED=true|false

# Local LLM endpoint (vLLM/Ollama compatible)
INTERNAL_LLM_BASE_URL=http://localhost:8000

# Model ID for local LLM
INTERNAL_LLM_MODEL=meta-llama/Llama-2-7b-hf
```

### Development Setup

#### Option 1: vLLM (Recommended for CPU)

```bash
# Install vLLM
pip install vllm

# Start vLLM with a model
python -m vllm.entrypoints.api_server \
  --model meta-llama/Llama-2-7b-hf \
  --port 8000 \
  --gpu-memory-utilization 0.8
```

#### Option 2: Ollama

```bash
# Install from https://ollama.ai

# Pull a model
ollama pull llama2

# Start server (default: http://localhost:11434)
# Then update INTERNAL_LLM_BASE_URL=http://localhost:11434
```

#### Option 3: LM Studio

1. Download LM Studio from https://lmstudio.ai
2. Load a model and start the API server (default port: 1234)
3. Update env: `INTERNAL_LLM_BASE_URL=http://localhost:1234`

## Testing

### 1. Verify Configuration
```bash
# Check what's enabled
curl http://localhost:3001/api/llm-config
```

### 2. Test Claude Primary
```bash
# Make a bot request — should use Claude
curl -X POST http://localhost:3001/api/bots/keabot-command \
  -H "Content-Type: application/json" \
  -d '{"message": "What is 2+2?"}'
```

Response:
```json
{
  "content": "2 + 2 = 4",
  "llmSource": "CLAUDE"
}
```

### 3. Test Fallback
Temporarily:
- Set `ANTHROPIC_API_KEY=` (empty)
- Ensure local LLM is running
- Make the same bot request

Response should have `llmSource: "LOCAL"`.

### 4. Test Error Handling
- Disable Claude API and local LLM
- Make bot request
- Should return `llmSource: "ERROR"` with error message

## Architecture

### Files Modified/Created

- **`packages/core-bots/src/llm-fallback.ts`** (NEW)
  - `callLLMWithFallback()` — main entry point with fallback logic
  - `callLocalLLM()` — makes HTTP request to local LLM endpoint
  - `getLLMConfig()` — returns current LLM configuration status
  - Handles message format conversion between Anthropic SDK and local LLM APIs

- **`packages/core-bots/src/keabot-base.ts`** (MODIFIED)
  - Updated `chat()` method to use `callLLMWithFallback()`
  - Tracks `llmSource` from first API call
  - Includes `llmSource` in all responses
  - Maintains tool-use loop and max iterations logic

- **`packages/core-bots/src/index.ts`** (MODIFIED)
  - Exports `callLLMWithFallback`, `getLLMConfig`
  - Exports types: `LLMResponse`, `LLMSource`

- **`.env.example`** (MODIFIED)
  - Added LLM fallback configuration variables
  - Includes setup instructions in comments

## Limitations

### Tool Use
- **Claude**: Full tool support (function calling)
- **Local LLM**: Limited/no tool support
  - Local LLMs typically don't support function definitions
  - Fallback responses will be text-only
  - Multi-turn tool loops will complete after 1 iteration for local LLM

### Response Quality
- Claude Sonnet: Superior reasoning, better tool use
- Local Llama-2-7b: Adequate for simple tasks, may struggle with complex requests

### Latency
- Claude: 1-3 seconds (API call)
- vLLM: 2-10 seconds depending on hardware
- Ollama: 3-15 seconds (varies by GPU)

## Monitoring

### Logs
Watch for these patterns in application logs:

```
[LLM Fallback] Claude API failed: ...
[LLM Fallback] Attempting fallback to local LLM at http://localhost:8000
[LLM Fallback] Local LLM also failed: ...
```

### Metrics
Track `llmSource` distribution in responses:
- `CLAUDE`: Primary working
- `LOCAL`: Fallback working, Claude failed
- `ERROR`: Both failed, user sees degraded experience

## Security Considerations

1. **Local LLM Exposure**: Ensure vLLM/Ollama only listens on localhost
2. **API Keys**: `ANTHROPIC_API_KEY` not sent to local LLM
3. **Data Privacy**: Local LLM never sees sensitive data unless explicitly configured
4. **Network Isolation**: Fallback only works on same machine or secure network

## Future Enhancements

- [ ] Support for other LLM providers (OpenAI, Replicate, etc.)
- [ ] Automatic retry with exponential backoff
- [ ] Fallback caching for identical requests
- [ ] LLM health checks in startup
- [ ] Performance metrics dashboard
- [ ] Configurable timeout per LLM provider
