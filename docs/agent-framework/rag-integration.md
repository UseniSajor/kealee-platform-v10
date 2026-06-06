# RAG Integration Guide

## Overview

Every KeaBot automatically has access to the `retrieve_context` tool, which retrieves relevant knowledge from seed packs. This enables bots to ground their responses in platform rules, jurisdiction requirements, service definitions, and workflows.

## Architecture

**Data Flow:**
```
Seed Packs (YAML/JSON)
    ↓
seed-ingest (parsing + chunking)
    ↓
SeedChunk[] (in-memory store)
    ↓
retrieve() (BM25 + metadata scoring)
    ↓
RetrievedContextBlock[] (sorted by relevance)
    ↓
Claude prompt context
```

## Seed Pack Structure

Seed packs live in `docs/seeds/` and are ingested at bot boot:

```
docs/seeds/
├── jurisdictions/
│   ├── dc.yml          # DC zoning, setback, height, FAR rules
│   ├── md_montgomery.yml
│   └── ...
├── services/
│   ├── kitchen.yml     # Kitchen remodel specs, timelines, costs
│   ├── bathroom.yml
│   └── ...
├── workflows/
│   ├── permit.yml      # Permit workflow, phases, review gates
│   ├── inspection.yml
│   └── ...
└── rules/
    ├── tier-deliverables.yml  # What's in Tier 1, 2, 3
    ├── pricing-rules.yml
    └── ...
```

Each chunk has metadata: `sourceType`, `jurisdictionCode`, `serviceCode`, `workflowCode`, `keywords`.

## Query Patterns

### General Query

```typescript
{
  query: 'DC zoning setback requirements for residential',
  topK: 8,
}
```

Retriever uses BM25 keyword overlap + metadata boost. No jurisdiction boost unless specified.

### Jurisdiction-Specific

```typescript
{
  query: 'residential setback requirements',
  jurisdictionCode: 'DC',  // Boost results for DC
  sourceTypes: ['jurisdiction', 'zoning'],
}
```

Extra 0.4 boost if chunk matches `jurisdictionCode`.

### Service-Specific

```typescript
{
  serviceCategory: 'kitchen',
}
```

Returns all chunks tagged with `serviceCode: 'kitchen'`. Used for service-level queries.

### Filtered by Source Type

```typescript
{
  query: 'permit review timeline',
  sourceTypes: ['workflow', 'rule'],  // Only workflows and rules
  topK: 5,
}
```

Restricts retrieval to specific chunk types.

## Relevance Scoring

**BM25-inspired scoring:**
- Query words matched in chunk text: +1 per word
- Query words matched in chunk keywords: +0.5 per word
- Score normalized: 0–1

**Metadata boost:**
- Jurisdiction match: +0.3
- Workflow match: +0.2
- Service match: +0.2
- (Applied after BM25 but capped at 1.0)

**Example:**
```
Query: "DC kitchen remodel permit"

Chunk 1: "DC residential kitchen remodel — 6-8 weeks, requires DOB permit"
  BM25 score: 0.8 (4/5 query words matched)
  Metadata boost: +0.3 (jurisdiction: DC) + 0.2 (service: kitchen) = +0.5
  Final score: min(0.8 + 0.5, 1.0) = 1.0 ✓ #1 result

Chunk 2: "Kitchen design trends — no permitting required"
  BM25 score: 0.4 (only "kitchen" matched)
  Metadata boost: 0
  Final score: 0.4 ✓ Lower priority
```

## Using RAG in Bots

### Automatic (Default)

All KeaBots have `retrieve_context` enabled by default:

```typescript
const designBot = new DesignBot({
  name: 'DesignBot',
  domain: 'design',
  systemPrompt: '...',
  enableRagTool: true,  // ← default
});

// Claude can now call retrieve_context during execution
```

### Disable RAG

```typescript
const bot = new DesignBot({
  // ...
  enableRagTool: false,  // Opt-out
});
```

### Agentic Bots

RAG is always enabled in `AgenticBot`:

```typescript
class MyAgenticBot extends AgenticBot {
  constructor() {
    super({
      name: 'MyBot',
      domain: 'construction',
      systemPrompt: '...',
      enableRagTool: true,    // Always true for agentic
      enableBrowserTool: false, // Separate opt-in
    });
  }
}
```

## Prompt Engineering for RAG

### Good Prompts (Ground in RAG Results)

```
You are a permit specialist. When asked about permit requirements:

1. Use retrieve_context with query = user's jurisdiction + question
2. If results > 3 blocks with score > 0.5:
   - Reference the rules directly
   - Cite the source (e.g., "DC zoning code § 401")
3. If results < 3 blocks or score < 0.5:
   - Tell the user "I don't have specific rules for this jurisdiction"
   - Offer to research or escalate

Example:
User: "What are DC setback rules for additions?"
→ Call retrieve_context with query="DC residential addition setback"
→ Get blocks with rules
→ Respond: "DC requires 10' setback from property line for additions on residential properties (DC zoning § 401.3). This applies to your property at [address]."
```

### Bad Prompts (Generic/Hallucinated)

```
❌ "You know all permit requirements. Answer any question without tools."
   → Claude hallucinates rules, gives incorrect guidance

❌ "Retrieve context but ignore results if confident"
   → Claude trusts its training data over current rules

✓ "Always retrieve context first. If you don't have seed pack data, say so."
   → Claude defers to retrieved knowledge
```

## Fallback Chains

### Empty Results Handling

```typescript
// In system prompt:
const systemPrompt = `
If retrieve_context returns 0 blocks:
1. Try a broader query (remove jurisdiction filter)
2. If still empty, ask: "I don't have specific rules. Would you like me to research [topic]?"
3. Offer to escalate to specialist bot
`;
```

### Low Confidence Handling

```typescript
// In system prompt:
const systemPrompt = `
If retrieve_context returns results with avgScore < 0.3:
1. Note uncertainty: "Based on limited available rules..."
2. Recommend human review
3. Provide alternative sources (e.g., official websites)
`;
```

## Observability

### View Retrieved Blocks

```typescript
const result = await callModelAgentic({
  systemPrompt: '...',
  userMessage: '...',
  tools: [ragTool],
  memory,  // Optional
});

// After execution, memory contains tool history:
console.log(memory.toolHistory);
// [
//   {
//     id: 'toolrun_...',
//     toolName: 'retrieve_context',
//     input: { query: '...', jurisdiction: '...' },
//     output: {
//       blocks: [...],
//       summary: '...',
//       hitCount: 5,
//       avgScore: 0.72,
//     },
//     success: true,
//   },
// ]
```

### Check Coverage

```typescript
// Are all seed packs loaded?
import { getAllChunks } from '@kealee/core-llm';
const chunks = getAllChunks();
console.log(`Loaded ${chunks.length} seed chunks`);

// By source type:
const jurisdictionChunks = chunks.filter(c => c.sourceType === 'jurisdiction');
console.log(`${jurisdictionChunks.length} jurisdiction rules`);
```

## Performance

**Retrieval time:** < 50ms (keyword + metadata filtering, no vector DB)

**Memory usage:** ~5MB per 1000 chunks (typical: 10K chunks = ~50MB)

**Scaling:** Currently in-memory. Migration to pgvector planned when seed count > 100K.

## Examples

### Example 1: Permit Bot with Jurisdiction Context

```typescript
const permitBot = new PermitBot({
  name: 'PermitBot',
  domain: 'permit',
  systemPrompt: `You help applicants understand permit requirements.
    
    When asked about requirements:
    1. Call retrieve_context with the jurisdiction and topic
    2. Reference the actual rules from results
    3. If no rules found, say so and offer to escalate
  `,
  enableRagTool: true,
});

const result = await permitBot.handleMessage(
  'What do I need for a deck permit in DC?',
  { jurisdiction: 'DC', projectId: 'proj_123' }
);

// Internally:
// Claude calls retrieve_context with query = "DC deck permit requirements"
// Gets blocks about DC deck rules (setback, footings, height, electrical, etc.)
// Returns detailed answer citing rules
```

### Example 2: Estimate Bot with Service Rules

```typescript
const estimateBot = new EstimateBot({
  name: 'EstimateBot',
  domain: 'estimate',
  systemPrompt: `Estimate construction costs using the cost database.
    
    For each line item:
    1. Call retrieve_context with serviceCategory = user's service type
    2. Get cost rules and assembly definitions
    3. Apply labor + material + contingency
  `,
  enableRagTool: true,
});

const result = await estimateBot.handleMessage(
  'Estimate a bathroom remodel in DC (100 sqft, basic finishes)',
  { jurisdiction: 'DC', serviceCategory: 'bathroom' }
);

// Internally:
// Claude retrieves bathroom-specific costs from seed packs
// Applies DC labor rates, material adjustments
// Returns itemized estimate
```
