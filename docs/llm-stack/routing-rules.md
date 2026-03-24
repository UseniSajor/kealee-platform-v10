# Kealee LLM Stack — Routing Rules

## Philosophy

1. **KeaCore stores truth. Models reason over retrieved truth.**
   Seeds, DB, memory, and documents are the source of truth. Models receive retrieved context and produce outputs that are saved back to KeaCore.

2. **Retrieval is required.**
   No prompt stuffing. Every LLM call includes retrieved context from seeds. Jurisdiction facts, pricing, service offerings, and workflow rules are retrieved — not baked into prompts.

3. **Internal-first routing.**
   All routine AI operations route to the internal Qwen model stack first. External providers (Claude, GPT) are fallbacks.

4. **Confidence-gated fallback.**
   If an internal provider returns below-threshold confidence, the call automatically falls back through the chain.

5. **Every run is logged.**
   Provider, model, routing decision, confidence, retrieved context refs, and parsed output are all saved.

---

## Routing Table

| Context | Preferred Provider | Fallback Chain | Confidence Threshold |
|---|---|---|---|
| `intake_classification` | internal (Qwen) | claude → gpt | 0.75 |
| `missing_field_detection` | internal (Qwen) | claude → gpt | 0.70 |
| `service_recommendation` | internal (Qwen) | claude → gpt | 0.65 |
| `risk_extraction` | internal (Qwen) | claude → gpt | 0.65 |
| `retrieval_summary` | internal (Qwen) | claude → gpt | 0.70 |
| `workflow_recommendation` | internal (Qwen) | claude → gpt | 0.75 |
| `multimodal_interpretation` | internal (Qwen3-VL) | claude → gpt | 0.60 |
| `permit_path_synthesis` | claude | gpt → internal | 0.70 |
| `narrative_generation` | claude | gpt | 0.60 |
| `complex_reasoning` | claude | gpt | 0.65 |
| `embedding` | internal | (none) | 0.50 |
| `reranking` | internal | (none) | 0.50 |
| `general` | internal | claude → gpt | 0.65 |

---

## Fallback Chains

```
internal → claude → gpt   (most common: routine internal call with external fallbacks)
internal → gpt             (if claude unavailable)
claude → gpt               (permit synthesis, narrative, complex reasoning)
gpt → claude               (if gpt is primary and claude available as fallback)
```

---

## What Triggers a Fallback

1. **Provider unavailable** (`isAvailable()` returns false)
   - Internal: `INTERNAL_LLM_ENABLED !== "true"`
   - Claude: `CLAUDE_ENABLED !== "true"` or no `ANTHROPIC_API_KEY`
   - GPT: `GPT_ENABLED !== "true"` or no `OPENAI_API_KEY`

2. **API error** (endpoint unreachable, rate limit, etc.)
   - Primary throws → router tries next in fallback chain
   - If all fail, error is surfaced clearly

3. **Low confidence** (below threshold for the routing context)
   - `heuristicConfidence(output) < threshold`
   - Router attempts fallback provider
   - Fallback result replaces primary result

---

## Multimodal Path (Qwen3-VL)

When intake includes `imageUrl` or `imageBase64`:
- `InternalProvider.generateText()` automatically routes to `QwenVLProvider`
- `QwenVLProvider` sends the image + prompt to `INTERNAL_VL_BASE_URL`
- Returns `source: "internal"` + multimodal interpretation result
- If VL endpoint unavailable, falls back to Claude Vision API

---

## What Is Stored in KeaCore

| Data | Storage Location |
|---|---|
| Normalized intake | `session.memory.facts.normalizedIntake` |
| Matched intent | `session.memory.facts.matchedIntent` |
| Matched workflow | `session.memory.facts.matchedWorkflow` |
| Jurisdiction code | `session.memory.facts.jurisdictionCode` |
| Tool outputs | `session.memory.outputs[toolName]` |
| AI analysis results | `session.memory.outputs.intakeAnalysis` |
| Risk flags | `session.memory.riskFlags[]` |
| Agent decisions | `session.memory.decisions[]` |
| LLM run records | `docs/runtime-snapshots/<date>/<runId>.json` (TODO_DB_TABLE: LlmRunLog) |

---

## Why Not Prompt Stuffing?

Prompt stuffing (baking all facts into every prompt) is rejected because:

- Jurisdiction permit portal URLs change annually — retrieval makes updates automatic
- Pricing changes — service seeds are the source of truth, not prompts
- Workflow rules evolve — seed retrieval surfaces current rules
- Prompt stuffing is unauditable — no record of which facts influenced which decision
- Large contexts waste tokens — retrieval selects only relevant blocks

The correct pattern is:
```
retrieve(query, { sourceTypes: ["jurisdiction", "service", "rule"] })
  → build context (top 8 scored blocks)
  → inject into prompt
  → model reasons over retrieved truth
  → output saved to KeaCore memory
```

---

## Adding a New Routing Context

1. Add to `RoutingContext` type in `packages/core-llm/src/router.ts`
2. Add entry to `ROUTING_TABLE` with preferred provider, fallback chain, and confidence threshold
3. Use the new context in gateway calls: `routingContext: "your_new_context"`
4. Update this file

---

## Approval-Gated Actions

Financial and external-write actions remain approval-gated regardless of AI confidence:

| Tool | Gate |
|---|---|
| `create_checkout` | Requires human approval step |
| `assign_contractor` | Requires human approval step |
| `send_email` | Requires operator template or approval |
| `send_sms` | Requires operator template or approval |

These gates are enforced at the executor level (`executor.ts`), not by the LLM router.

---

## Unsupported Jurisdictions

If a jurisdiction is detected outside the 7 supported DMV markets, the rule
`rule_jurisdiction_outside_seed_market` fires and routes to operator review.

Supported: `dc`, `montgomery_md`, `prince_georges_md`, `fairfax_va`, `arlington_va`, `alexandria_va`, `loudoun_va`
