# Kealee LLM Stack — Setup Notes

## Overview

Kealee uses an internal-first LLM routing architecture. All AI calls route through `packages/core-ai-gateway`, which selects the best provider based on operation type and availability, with automatic fallback chains.

## Environment Variables

```bash
# ── Internal LLM stack ──────────────────────────────────────────────
INTERNAL_LLM_ENABLED=true           # Set to true to enable internal Qwen providers
INTERNAL_API_KEY=local              # API key for OpenAI-compat endpoints (often ignored)

INTERNAL_TEXT_BASE_URL=http://localhost:8010/v1    # Qwen text inference
INTERNAL_VL_BASE_URL=http://localhost:8011/v1      # Qwen3-VL multimodal inference
INTERNAL_EMBED_BASE_URL=http://localhost:8012/v1   # BGE/Qwen embeddings
INTERNAL_RERANK_BASE_URL=http://localhost:8013/v1  # Qwen/BGE reranker

INTERNAL_TEXT_MODEL=qwen
INTERNAL_VL_MODEL=qwen-vl
INTERNAL_EMBED_MODEL=qwen-embed
INTERNAL_RERANK_MODEL=qwen-rerank

# ── Provider flags ────────────────────────────────────────────────────
LLM_DEFAULT_PROVIDER=internal
LLM_FALLBACK_PROVIDER=claude

CLAUDE_ENABLED=true
GPT_ENABLED=true

# ── External provider keys ────────────────────────────────────────────
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# ── Logging ────────────────────────────────────────────────────────────
LLM_SNAPSHOT_DIR=./docs/runtime-snapshots    # Where JSON run snapshots are written

# ── KeaCore service ────────────────────────────────────────────────────
PORT=3030
LOG_LEVEL=info
ALLOWED_ORIGINS=http://localhost:3024,https://yourdomain.com

# ── web-main integration ───────────────────────────────────────────────
NEXT_PUBLIC_KEACORE_URL=http://localhost:3030   # dev
# KEACORE_URL=https://keacore.yourdomain.com   # prod (server-side only)
```

## Starting Local KeaCore (Development)

```bash
# From repo root:
pnpm install

# Start KeaCore service (port 3030)
pnpm --filter @kealee/keacore dev

# Or with tsx directly:
cd services/keacore
tsx watch src/index.ts
```

## Internal Model Runtime Setup

The internal providers (Qwen, Qwen3-VL, embed, rerank) require running local inference endpoints.

### Option 1: vLLM (recommended for GPU)

```bash
# Text inference (port 8010)
vllm serve Qwen/Qwen2.5-7B-Instruct --port 8010 --served-model-name qwen

# Multimodal (port 8011)
vllm serve Qwen/Qwen2.5-VL-7B-Instruct --port 8011 --served-model-name qwen-vl

# Embeddings (port 8012)
vllm serve BAAI/bge-m3 --port 8012 --served-model-name qwen-embed --task embed

# Reranker (port 8013)
vllm serve BAAI/bge-reranker-v2-m3 --port 8013 --served-model-name qwen-rerank
```

### Option 2: Ollama (CPU/lightweight)

```bash
ollama serve
ollama pull qwen2.5:7b

# Point INTERNAL_TEXT_BASE_URL=http://localhost:11434/v1
# INTERNAL_TEXT_MODEL=qwen2.5:7b
```

### Option 3: Disable internal, use Claude only

```bash
INTERNAL_LLM_ENABLED=false
CLAUDE_ENABLED=true
GPT_ENABLED=false
ANTHROPIC_API_KEY=sk-ant-...
```

KeaCore will boot normally and route all calls to Claude.

## Validating Seeds

```bash
pnpm --filter @kealee/keacore seeds:validate
```

## Checking Provider Status

```bash
# HTTP
curl http://localhost:3030/health

# Expected response:
{
  "status": "ok",
  "service": "keacore",
  "providers": [
    { "name": "internal", "available": true },
    { "name": "claude", "available": true },
    { "name": "gpt", "available": false }
  ]
}
```

## LLM Run Snapshots

Every LLM call is logged to `docs/runtime-snapshots/<date>/<runId>.json`.
These include: provider, model, routing decision, confidence, prompt snapshot, retrieved context refs, parsed output.

```bash
# View recent snapshots
ls docs/runtime-snapshots/$(date +%Y-%m-%d)/
cat docs/runtime-snapshots/$(date +%Y-%m-%d)/<runId>.json
```

## Test Scenarios

```bash
# Scenario 1: ADU in DC
curl -X POST http://localhost:3030/keacore/intake/start \
  -H 'Content-Type: application/json' \
  -d '{"address":"1234 U St NW, Washington, DC 20009","projectType":"adu","scopeSummary":"Build a 2-unit ADU in my backyard"}'

# Scenario 2: Permit-only in PG County
curl -X POST http://localhost:3030/keacore/intake/start \
  -H 'Content-Type: application/json' \
  -d '{"address":"5678 Greenbelt Rd, College Park, MD 20740","projectType":"permit_only","hasPlans":true}'

# Scenario 3: Uploaded plans (triggers Qwen3-VL path)
curl -X POST http://localhost:3030/keacore/intake/start \
  -H 'Content-Type: application/json' \
  -d '{"projectType":"renovation","hasImages":true,"imageUrl":"https://example.com/plans.jpg","scopeSummary":"I want to know what I can build"}'
```

## TODO Items

- `TODO_LOCAL_RUNTIME`: Internal provider endpoints require a local inference server. See above for setup.
- `TODO_DB_TABLE`: LlmRunLog Prisma table (currently JSON snapshots to disk). Schema in `llm-run-recorder.ts`.
- `TODO_DB_TABLE`: Persist sessions to DB (currently in-memory Map). Schema: `AgentSession` model.
- Embed + rerank providers require vector-compatible endpoints (see vLLM setup above).
