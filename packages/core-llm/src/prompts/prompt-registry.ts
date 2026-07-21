/**
 * core-llm/prompts/prompt-registry.ts
 * Version-controlled prompt registry.
 *
 * Prompts are stored here as versioned templates, separate from model calls.
 * This makes it possible to audit what prompt was used for a given run,
 * A/B test prompt versions, and roll back if a prompt degrades quality.
 */

export interface PromptTemplate {
  code: string;
  version: string;
  description: string;
  systemPrompt?: string;
  userPromptTemplate: string;
  requiredVars: string[];
  tags: string[];
  active: boolean;
}

// ─── Registry ─────────────────────────────────────────────────────────────────

const registry = new Map<string, PromptTemplate>();

export function registerPrompt(template: PromptTemplate): void {
  registry.set(template.code, template);
}

export function getPrompt(code: string): PromptTemplate {
  const p = registry.get(code);
  if (!p) throw new Error(`[PromptRegistry] Prompt not found: "${code}"`);
  return p;
}

export function listPrompts(): PromptTemplate[] {
  return [...registry.values()];
}

/**
 * Render a prompt template by substituting {{varName}} placeholders.
 */
export function renderPrompt(
  code: string,
  vars: Record<string, string>,
): { systemPrompt?: string; userPrompt: string } {
  const template = getPrompt(code);

  function substitute(str: string): string {
    return str.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
  }

  return {
    systemPrompt: template.systemPrompt ? substitute(template.systemPrompt) : undefined,
    userPrompt: substitute(template.userPromptTemplate),
  };
}

// ─── Built-in prompts ─────────────────────────────────────────────────────────

registerPrompt({
  code: "intake_analysis_v1",
  version: "1.0.0",
  description: "Analyzes homeowner intake to extract intent, complexity, risk flags, and service recommendations",
  systemPrompt: "You are KeaCore, the Kealee platform's AI intake analyst. Your job is to analyze project intake data and output a structured JSON analysis. Be concise and grounded in the context provided.",
  userPromptTemplate: `Analyze this project intake and return a JSON object.

PROJECT INTAKE:
{{intakeText}}

RETRIEVED CONTEXT:
{{context}}

Return JSON with this exact structure:
{
  "summary": "1-2 sentence plain-English summary of the project",
  "likelyProjectComplexity": "low|medium|high",
  "missingCriticalFields": ["list", "of", "missing", "fields"],
  "riskFlags": ["list", "of", "risk", "flags"],
  "suggestedUpsells": ["list", "of", "service", "codes"],
  "matchedIntent": "intent_code",
  "matchedWorkflow": "workflow_code",
  "primaryService": "service_code",
  "secondaryServices": ["service_code"],
  "jurisdictionCode": "jurisdiction_code_or_null",
  "requiresOperatorReview": false,
  "disclaimers": ["list", "of", "applicable", "disclaimers"]
}`,
  requiredVars: ["intakeText", "context"],
  tags: ["intake", "analysis", "classification"],
  active: true,
});

registerPrompt({
  code: "feasibility_summary_v1",
  version: "1.0.0",
  description: "Summarizes feasibility analysis results for homeowner-facing output",
  systemPrompt: "You are KeaCore. Summarize the feasibility analysis in plain English for a homeowner. Be honest about risks and limitations.",
  userPromptTemplate: `Summarize this feasibility analysis for a homeowner.

INTAKE:
{{intakeText}}

FEASIBILITY DATA:
{{feasibilityData}}

CONTEXT:
{{context}}

Return JSON:
{
  "summary": "plain English summary",
  "viabilityScore": "low|medium|high",
  "keyRisks": ["list", "of", "key", "risks"],
  "recommendedNextSteps": ["list", "of", "next", "steps"],
  "estimatedBudgetRange": "e.g. $150,000–$250,000 or unknown"
}`,
  requiredVars: ["intakeText", "feasibilityData", "context"],
  tags: ["feasibility", "summary"],
  active: true,
});

registerPrompt({
  code: "recommendation_package_v1",
  version: "1.0.0",
  description: "Generates final service recommendation package for user presentation",
  systemPrompt: "You are KeaCore. Recommend the right Kealee services for this project based on the analysis. Be direct and helpful. Avoid over-recommending.",
  userPromptTemplate: `Generate a service recommendation package.

PROJECT ANALYSIS:
{{analysisJson}}

AVAILABLE SERVICES:
{{servicesContext}}

CONTEXT:
{{context}}

Return JSON:
{
  "primaryRecommendation": {
    "serviceCode": "service_code",
    "name": "Service Name",
    "rationale": "why this service fits",
    "price": "$XXX"
  },
  "secondaryRecommendations": [
    { "serviceCode": "code", "name": "name", "rationale": "why" }
  ],
  "operatorNote": "note for operator if any, or null",
  "userSummary": "1-2 sentences for the user about next steps"
}`,
  requiredVars: ["analysisJson", "servicesContext", "context"],
  tags: ["recommendation", "services"],
  active: true,
});
