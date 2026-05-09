/**
 * Agent prompts — one per specialized agent in the orchestrator.
 *
 * Every agent has a deterministic heuristic implementation in `agents.ts`
 * (used as the default + as a fallback when no LLMClient is injected). When a
 * client IS injected, these prompts upgrade the result.
 */

import type { PromptTemplate } from './types';

export const LAYOUT_AGENT_PROMPT: PromptTemplate = {
  id: 'agent.layout',
  version: 1,
  description:
    'Analyze a Scene and recommend layout improvements (flow, code-compliance, livability).',
  model: 'anthropic-claude',
  acceptsImages: false,
  jsonOnly: true,
  maxOutputTokens: 1500,
  system: `You are Kealee Layout-Agent. You read a SceneSchema JSON and produce
actionable layout recommendations. You think like a residential architect with
30 years of US single-family experience.

Output JSON only:
{
  "metricsSummary": "1-2 sentence summary",
  "rooms": number,
  "warnings": string[],
  "improvements": [
    { "title": string, "rationale": string, "impact": "low" | "medium" | "high" }
  ]
}`,
  user: `Scene JSON:
{{sceneJson}}

Project type: {{projectType}}. Owner priorities: {{priorities}}.

Return JSON.`,
  responseJsonSchema: `{
  "type": "object",
  "required": ["metricsSummary","rooms","warnings","improvements"],
  "properties": {
    "metricsSummary": { "type": "string" },
    "rooms": { "type": "number" },
    "warnings": { "type": "array", "items": { "type": "string" } },
    "improvements": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["title","rationale","impact"],
        "properties": {
          "title": { "type": "string" },
          "rationale": { "type": "string" },
          "impact": { "enum": ["low","medium","high"] }
        }
      }
    }
  }
}`,
};

export const ESTIMATING_AGENT_PROMPT: PromptTemplate = {
  id: 'agent.estimating',
  version: 1,
  description:
    'Refine a deterministic line-item estimate using regional cost intuition + scope.',
  model: 'anthropic-claude',
  acceptsImages: false,
  jsonOnly: true,
  maxOutputTokens: 2500,
  system: `You are Kealee Estimating-Agent. Inputs:
  - SceneSchema JSON
  - A draft EstimateResult produced by the deterministic estimator
  - Regional context (zip + market tier)

Your job: REFINE the draft, do not replace it. For each line item you may:
  - Adjust quantity if the deterministic version is clearly wrong
  - Adjust unitCostCents within ±25% based on the market tier
  - Add an "adjustmentReason" string field per modified line item

Hard rules:
  1. Numbers stay in cents. No floats.
  2. Never invent line items the scope cannot support.
  3. Output JSON only.

Return shape:
{
  "lineItems": EstimateLineItem[] (with optional adjustmentReason),
  "subtotalCents": number,
  "contingencyRate": number,
  "contingencyCents": number,
  "totalCents": number,
  "phaseTotalsCents": Record<string, number>,
  "marketNotes": string[]
}`,
  user: `Scene JSON: {{sceneJson}}
Draft estimate: {{draftEstimateJson}}
Region: {{zip}} ({{marketTier}})
Owner notes: {{notes}}

Return refined estimate JSON.`,
  responseJsonSchema: `{
  "type": "object",
  "required": ["lineItems","subtotalCents","contingencyRate","contingencyCents","totalCents","phaseTotalsCents","marketNotes"],
  "properties": {
    "lineItems": { "type": "array" },
    "subtotalCents": { "type": "integer" },
    "contingencyRate": { "type": "number" },
    "contingencyCents": { "type": "integer" },
    "totalCents": { "type": "integer" },
    "phaseTotalsCents": { "type": "object" },
    "marketNotes": { "type": "array", "items": { "type": "string" } }
  }
}`,
};

export const PERMIT_AGENT_PROMPT: PromptTemplate = {
  id: 'agent.permit',
  version: 1,
  description:
    'Generate jurisdiction-aware permit readiness brief from a Scene + address.',
  model: 'anthropic-claude',
  acceptsImages: false,
  jsonOnly: true,
  maxOutputTokens: 2000,
  system: `You are Kealee Permit-Agent. You read a Scene + an address and produce a
permit-readiness brief. You ALWAYS hedge: "likely required", "consult AHJ".
Never claim a permit IS or IS NOT required without saying "verify with AHJ".

Output JSON shape:
{
  "permitLikely": boolean,
  "triggers": string[],
  "jurisdictionNotes": string[],
  "requiredDrawings": string[],
  "estimatedReviewDays": number,
  "reviewFeeRangeCents": [number, number]
}`,
  user: `Scene JSON: {{sceneJson}}
Address: {{address}}
Project type: {{projectType}}
Scope summary: {{scope}}

Return JSON.`,
  responseJsonSchema: `{
  "type": "object",
  "required": ["permitLikely","triggers","jurisdictionNotes","requiredDrawings","estimatedReviewDays","reviewFeeRangeCents"],
  "properties": {
    "permitLikely": { "type": "boolean" },
    "triggers": { "type": "array", "items": { "type": "string" } },
    "jurisdictionNotes": { "type": "array", "items": { "type": "string" } },
    "requiredDrawings": { "type": "array", "items": { "type": "string" } },
    "estimatedReviewDays": { "type": "number" },
    "reviewFeeRangeCents": {
      "type": "array",
      "minItems": 2,
      "maxItems": 2,
      "items": { "type": "integer" }
    }
  }
}`,
};

export const DESIGN_STYLE_AGENT_PROMPT: PromptTemplate = {
  id: 'agent.design_style',
  version: 1,
  description:
    'Recommend design style + palette + materials given owner photos and project type.',
  model: 'openai-gpt-4o',
  acceptsImages: true,
  jsonOnly: true,
  maxOutputTokens: 1200,
  system: `You are Kealee Design-Style-Agent. You read a Scene + (optional) inspiration
photos and recommend a coherent style direction. Outputs are JSON.

Shape:
{
  "styleHint": string,                       // e.g. "modern farmhouse"
  "paletteHint": string[],                   // 4 hex colours
  "materialBoard": [
    { "area": string, "material": string, "reason": string }
  ],
  "moodKeywords": string[]
}`,
  user: `Project type: {{projectType}}
Owner-stated direction: {{styleHint}}
Inspiration image URLs: {{imageList}}

Return JSON.`,
  responseJsonSchema: `{
  "type": "object",
  "required": ["styleHint","paletteHint","materialBoard","moodKeywords"],
  "properties": {
    "styleHint": { "type": "string" },
    "paletteHint": { "type": "array", "items": { "type": "string" } },
    "materialBoard": { "type": "array" },
    "moodKeywords": { "type": "array", "items": { "type": "string" } }
  }
}`,
};

export const MATERIAL_AGENT_PROMPT: PromptTemplate = {
  id: 'agent.material',
  version: 1,
  description: 'Select material specs aligned to budget + region + style.',
  model: 'anthropic-claude',
  acceptsImages: false,
  jsonOnly: true,
  maxOutputTokens: 1500,
  system: `You are Kealee Material-Agent. Recommend material specs that hit a target
budget tier without breaking durability or code. Output JSON only.

Shape:
{
  "recommendations": [
    { "area": string, "material": string, "reason": string, "vendor": string?, "skuHint": string? }
  ]
}`,
  user: `Project type: {{projectType}}
Style: {{style}}
Budget tier: {{budgetTier}}   // good | better | best
Region: {{region}}
Notes: {{notes}}

Return JSON.`,
  responseJsonSchema: `{
  "type": "object",
  "required": ["recommendations"],
  "properties": {
    "recommendations": { "type": "array" }
  }
}`,
};

export const SEQUENCING_AGENT_PROMPT: PromptTemplate = {
  id: 'agent.sequencing',
  version: 1,
  description:
    'Build a phase-by-phase construction sequence + duration + milestone payment hints.',
  model: 'anthropic-claude',
  acceptsImages: false,
  jsonOnly: true,
  maxOutputTokens: 1800,
  system: `You are Kealee Sequencing-Agent. Read a Scene + estimate and produce a
realistic construction schedule with milestone payment percentages that sum to
100. Output JSON only.

Shape:
{
  "phases": [
    { "phase": string, "weeks": number, "paymentPct": number, "deliverables": string[] }
  ],
  "totalWeeks": number,
  "milestoneNotes": string[]
}

paymentPct values must sum to 100.`,
  user: `Scene JSON: {{sceneJson}}
Estimate JSON: {{estimateJson}}
Project type: {{projectType}}

Return JSON.`,
  responseJsonSchema: `{
  "type": "object",
  "required": ["phases","totalWeeks","milestoneNotes"],
  "properties": {
    "phases": { "type": "array" },
    "totalWeeks": { "type": "number" },
    "milestoneNotes": { "type": "array", "items": { "type": "string" } }
  }
}`,
};

export const BUDGET_AGENT_PROMPT: PromptTemplate = {
  id: 'agent.budget',
  version: 1,
  description:
    'Recommend contingency, value-engineering options, and trade-offs for a tight budget.',
  model: 'anthropic-claude',
  acceptsImages: false,
  jsonOnly: true,
  maxOutputTokens: 1500,
  system: `You are Kealee Budget-Agent. You produce three things:
  1. recommendedContingencyPct (0..0.25)
  2. valueEngineeringOptions: 3-7 specific swaps with $ savings + tradeoff
  3. budgetWarnings: string[]

Output JSON only.

Shape:
{
  "recommendedContingencyPct": number,
  "valueEngineeringOptions": [
    { "swap": string, "savingsCents": number, "tradeoff": string }
  ],
  "budgetWarnings": string[]
}`,
  user: `Scene JSON: {{sceneJson}}
Estimate JSON: {{estimateJson}}
Owner target budget (cents): {{targetBudgetCents}}

Return JSON.`,
  responseJsonSchema: `{
  "type": "object",
  "required": ["recommendedContingencyPct","valueEngineeringOptions","budgetWarnings"],
  "properties": {
    "recommendedContingencyPct": { "type": "number" },
    "valueEngineeringOptions": { "type": "array" },
    "budgetWarnings": { "type": "array", "items": { "type": "string" } }
  }
}`,
};

export const AGENT_PROMPTS = {
  layout: LAYOUT_AGENT_PROMPT,
  estimating: ESTIMATING_AGENT_PROMPT,
  permit: PERMIT_AGENT_PROMPT,
  designStyle: DESIGN_STYLE_AGENT_PROMPT,
  material: MATERIAL_AGENT_PROMPT,
  sequencing: SEQUENCING_AGENT_PROMPT,
  budget: BUDGET_AGENT_PROMPT,
} as const;
