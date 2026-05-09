# @kealee/pascal-agents

Versioned LLM prompt library + agent orchestrator for the Pascal preconstruction
stack. Pairs with [`@kealee/pascal-wrapper`](../pascal-wrapper) (the editor surface
+ scene schema + estimate bridge).

This package is **stateless, pure-data, no UI, no DB**. Drop it into any API
route or worker.

## What's inside

```
src/
├── prompts/
│   ├── types.ts                → PromptTemplate type + renderPrompt()
│   ├── vision-prompts.ts       → photo / floor-plan PDF / hand-sketch → geometry
│   ├── agent-prompts.ts        → layout, estimating, permit, design-style,
│   │                             material, sequencing, budget
│   ├── render-prompts.ts       → image-generation briefs (style, before/after,
│   │                             moodboard) for Replicate / SDXL / Midjourney
│   ├── orchestrator-prompt.ts  → master router prompt (no auth, no consultations)
│   └── index.ts                → PROMPT_CATALOG, getPrompt(), listPromptIds()
└── agents.ts                   → Heuristic-first orchestrator with optional
                                  LLMClient injection. Each agent has a
                                  deterministic fallback so it never blocks on
                                  a missing API key.
```

## How it composes with the rest of the platform

```
                    ┌──────────────────────────┐
                    │   @kealee/pascal-wrapper │
                    │   (editor + types +      │
                    │    sceneToEstimateInput) │
                    └─────────────┬────────────┘
                                  │ PascalSceneData
                                  ▼
┌─────────────────────────────────────────────────────────┐
│                @kealee/pascal-agents                    │
│                                                         │
│   prompts/  → versioned templates (id@version)          │
│   agents.ts → orchestrate(scene, { llm, … })            │
│                ↓                                        │
│           AgentOutput[] (typed JSON)                    │
└─────────────────────────────────────────────────────────┘
                                  │
              ┌───────────────────┼─────────────────────┐
              ▼                   ▼                     ▼
   /api/editor/vision   /api/editor/renders     EstimateBot prompt
   /api/concept/...     Replicate worker         Permit copy
```

## Why versioned prompts?

The Pascal Editor's `/api/editor/vision` route currently inlines a single hard-
coded `VISION_SYSTEM_PROMPT` string. That works once, but it's invisible to
analytics, caching, and A/B tests. The prompt-catalog gives every prompt:

- **Stable id** (`vision.photo_to_geometry`) — used as cache key.
- **Version** (`1`) — bump when semantics change. Older completions stay
  attributable to the prompt that produced them.
- **`responseJsonSchema`** — JSON Schema string the response must validate
  against. Wire it into a parser to fail loudly on drift.
- **`acceptsImages` flag** — the LLM client routes vision-capable prompts to
  the right model.

Swap the inline prompt in `/api/editor/vision/route.ts` for:

```ts
import { Prompts } from '@kealee/pascal-agents'

const tmpl = Prompts.getPrompt('vision.photo_to_geometry')
const { system, user } = Prompts.renderPrompt(tmpl, {
  projectType,
  areaLabel: imageType,
  imageList: fileUrl,
  notes: '',
})
```

Same model call, but now you can roll prompt versions without code changes.

## Why a heuristic-first orchestrator?

Construction estimates can't 500 because Anthropic is rate-limited. Every agent
in `agents.ts` returns a result from deterministic geometry first; the LLM
refines on top when an `LLMClient` is injected. Result: the API never blocks
on a missing key, and tests are reproducible.
