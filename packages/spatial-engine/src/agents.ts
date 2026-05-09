/**
 * Heuristic-first agent orchestrator.
 *
 * Each agent has a deterministic implementation that runs immediately from
 * `PascalSceneData` geometry. When an `LLMClient` is injected, the matching
 * prompt template (from `./prompts`) is rendered + sent to the model and the
 * result is merged on top.
 *
 * This means the API never blocks on a missing API key and tests are
 * reproducible: in unit tests, omit `llm` and you get pure-function output.
 */

import {
  calculateSceneStats,
  formatQuantitiesForPrompt,
  sceneToEstimateInput,
  type PascalSceneData,
  type SceneEstimateInput,
  type EstimateQuantity,
  type SceneGeometryStats,
} from '@kealee/pascal-wrapper';

import {
  AGENT_PROMPTS,
  renderPrompt,
  type PromptTemplate,
} from './prompts';

// ── Public types ────────────────────────────────────────────────────────────

export interface LLMClient {
  /**
   * Returns a JSON string. Implementations should:
   *  - route image-capable prompts to a vision model
   *  - apply json_mode / response_format when `jsonOnly` is true
   *  - cache by `id@version` if appropriate
   */
  complete(input: {
    system: string;
    user: string;
    jsonOnly?: boolean;
  }): Promise<string>;
}

export type AgentName =
  | 'layout'
  | 'estimating'
  | 'permit'
  | 'design_style'
  | 'material'
  | 'sequencing'
  | 'budget';

export interface AgentInput<TPayload = unknown> {
  scene: PascalSceneData;
  payload?: TPayload;
  llm?: LLMClient;
}

export interface AgentOutput<TResult = unknown> {
  agent: AgentName;
  ok: boolean;
  result: TResult;
  notes?: string[];
  error?: string;
  /** Set when the LLM was used (vs. deterministic fallback only). */
  llmUsed?: boolean;
  /** Prompt id@version so we can attribute later. */
  promptRef?: string;
}

// ── LLM helper ──────────────────────────────────────────────────────────────

async function runPromptJson<T>(
  template: PromptTemplate,
  vars: Record<string, string | number | boolean>,
  llm: LLMClient | undefined,
): Promise<{ result: T | null; promptRef: string }> {
  const promptRef = `${template.id}@${template.version}`;
  if (!llm) return { result: null, promptRef };
  try {
    const { system, user } = renderPrompt(template, vars);
    const raw = await llm.complete({ system, user, jsonOnly: template.jsonOnly });
    return { result: JSON.parse(raw) as T, promptRef };
  } catch {
    return { result: null, promptRef };
  }
}

function dedupe<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

// ── Layout agent ────────────────────────────────────────────────────────────

export interface LayoutAgentResult {
  metrics: SceneGeometryStats;
  rooms: number;
  warnings: string[];
  improvements?: { title: string; rationale: string; impact: 'low' | 'medium' | 'high' }[];
}

export async function layoutAgent(
  input: AgentInput<{ priorities?: string }>,
): Promise<AgentOutput<LayoutAgentResult>> {
  const m = calculateSceneStats(input.scene);
  const warnings: string[] = [];
  if (m.totalFloorAreaSqFt < 50 && m.floorCount > 0) {
    warnings.push('Floor area is unusually small — verify wall closure.');
  }
  if (m.totalOpenings === 0 && m.totalFloorAreaSqFt > 0) {
    warnings.push('No doors or windows placed yet.');
  }

  const { result: llm, promptRef } = await runPromptJson<{
    warnings?: string[];
    rooms?: number;
    improvements?: LayoutAgentResult['improvements'];
  }>(
    AGENT_PROMPTS.layout,
    {
      sceneJson: JSON.stringify(input.scene),
      projectType: input.scene.projectType,
      priorities: input.payload?.priorities ?? 'flow, code-compliance, livability',
    },
    input.llm,
  );

  return {
    agent: 'layout',
    ok: true,
    llmUsed: !!llm,
    promptRef,
    result: {
      metrics: m,
      rooms: llm?.rooms ?? Math.max(1, m.roomCount),
      warnings: dedupe([...warnings, ...(llm?.warnings ?? [])]),
      improvements: llm?.improvements,
    },
  };
}

// ── Estimating agent ────────────────────────────────────────────────────────

export interface EstimatingAgentResult extends SceneEstimateInput {
  /** LLM-supplied market notes (zip + tier) when an LLMClient is present. */
  marketNotes?: string[];
  /** Quantities formatted for direct injection into EstimateBot. */
  estimateBotPrompt: string;
}

export async function estimatingAgent(
  input: AgentInput<{ zip?: string; marketTier?: string; notes?: string }>,
): Promise<AgentOutput<EstimatingAgentResult>> {
  const draft = sceneToEstimateInput(input.scene);

  const { result: llm, promptRef } = await runPromptJson<{
    marketNotes?: string[];
    quantities?: EstimateQuantity[];
  }>(
    AGENT_PROMPTS.estimating,
    {
      sceneJson: JSON.stringify(input.scene),
      draftEstimateJson: JSON.stringify(draft),
      zip: input.payload?.zip ?? 'unknown',
      marketTier: input.payload?.marketTier ?? 'mid',
      notes: input.payload?.notes ?? '',
    },
    input.llm,
  );

  const merged: EstimatingAgentResult = {
    ...draft,
    quantities: llm?.quantities ?? draft.quantities,
    marketNotes: llm?.marketNotes,
    estimateBotPrompt: formatQuantitiesForPrompt(draft),
  };

  return {
    agent: 'estimating',
    ok: true,
    llmUsed: !!llm,
    promptRef,
    result: merged,
  };
}

// ── Permit agent ────────────────────────────────────────────────────────────

export interface PermitAgentResult {
  permitLikely: boolean;
  triggers: string[];
  jurisdictionNotes: string[];
  requiredDrawings?: string[];
  estimatedReviewDays?: number;
  reviewFeeRangeCents?: [number, number];
}

export async function permitAgent(
  input: AgentInput<{ address?: string; scope?: string }>,
): Promise<AgentOutput<PermitAgentResult>> {
  const triggers: string[] = [];
  const m = calculateSceneStats(input.scene);

  if (m.exteriorPerimeterFt > 0) triggers.push('Exterior wall work — building permit typically required.');
  if (input.scene.projectType === 'addition') triggers.push('Addition increases conditioned area — zoning + setback review required.');
  if (input.scene.projectType === 'adu') triggers.push('ADU permitting subject to local ordinance — typically required.');
  if (input.scene.projectType === 'kitchen_remodel') triggers.push('Plumbing + electrical relocations usually require permits.');

  const { result: llm, promptRef } = await runPromptJson<PermitAgentResult>(
    AGENT_PROMPTS.permit,
    {
      sceneJson: JSON.stringify(input.scene),
      address: input.payload?.address ?? 'unknown',
      projectType: input.scene.projectType,
      scope: input.payload?.scope ?? '',
    },
    input.llm,
  );

  return {
    agent: 'permit',
    ok: true,
    llmUsed: !!llm,
    promptRef,
    result: {
      permitLikely: llm?.permitLikely ?? triggers.length > 0,
      triggers: dedupe([...(triggers ?? []), ...(llm?.triggers ?? [])]),
      jurisdictionNotes: llm?.jurisdictionNotes ?? [
        'Confirm setbacks, FAR, and lot coverage with local AHJ.',
        'Schedule pre-application meeting if scope > $50k.',
      ],
      requiredDrawings: llm?.requiredDrawings,
      estimatedReviewDays: llm?.estimatedReviewDays,
      reviewFeeRangeCents: llm?.reviewFeeRangeCents,
    },
  };
}

// ── Design-style agent ──────────────────────────────────────────────────────

export interface DesignStyleAgentResult {
  styleHint: string;
  paletteHint: string[];
  materialBoard?: { area: string; material: string; reason: string }[];
  moodKeywords?: string[];
}

export async function designStyleAgent(
  input: AgentInput<{ styleHint?: string; imageList?: string }>,
): Promise<AgentOutput<DesignStyleAgentResult>> {
  const hint = input.payload?.styleHint ?? input.scene.metadata.style ?? 'transitional';

  const { result: llm, promptRef } = await runPromptJson<DesignStyleAgentResult>(
    AGENT_PROMPTS.designStyle,
    {
      projectType: input.scene.projectType,
      styleHint: hint,
      imageList: input.payload?.imageList ?? '',
    },
    input.llm,
  );

  return {
    agent: 'design_style',
    ok: true,
    llmUsed: !!llm,
    promptRef,
    result: {
      styleHint: llm?.styleHint ?? hint,
      paletteHint: llm?.paletteHint ?? paletteFor(hint),
      materialBoard: llm?.materialBoard,
      moodKeywords: llm?.moodKeywords,
    },
  };
}

function paletteFor(style: string): string[] {
  const s = style.toLowerCase();
  if (s.includes('modern')) return ['#0F172A', '#E2E8F0', '#94A3B8', '#0EA5E9'];
  if (s.includes('farmhouse')) return ['#F8F5EC', '#3F3A36', '#A47148', '#8C8C82'];
  if (s.includes('industrial')) return ['#1F1F1F', '#6B7280', '#B45309', '#E5E7EB'];
  return ['#FAFAF7', '#1A2B4A', '#E8724B', '#94A3B8'];
}

// ── Material agent ──────────────────────────────────────────────────────────

export interface MaterialAgentResult {
  recommendations: { area: string; material: string; reason: string; vendor?: string; skuHint?: string }[];
}

export async function materialAgent(
  input: AgentInput<{ style?: string; budgetTier?: 'good' | 'better' | 'best'; region?: string; notes?: string }>,
): Promise<AgentOutput<MaterialAgentResult>> {
  const recs: MaterialAgentResult['recommendations'] = [];
  switch (input.scene.projectType) {
    case 'kitchen_remodel':
      recs.push(
        { area: 'flooring', material: 'engineered hardwood', reason: 'Durability + warmth in cooking zones.' },
        { area: 'countertop', material: 'quartz', reason: 'Low maintenance, stain-resistant.' },
      );
      break;
    case 'bath_remodel':
      recs.push(
        { area: 'flooring', material: 'porcelain tile', reason: 'Waterproof + slip-rated options.' },
        { area: 'wet wall', material: 'large-format porcelain', reason: 'Fewer grout lines, easier cleaning.' },
      );
      break;
    default:
      recs.push({ area: 'flooring', material: 'LVP or engineered hardwood', reason: 'Strong cost-to-quality balance.' });
  }

  const { result: llm, promptRef } = await runPromptJson<MaterialAgentResult>(
    AGENT_PROMPTS.material,
    {
      projectType: input.scene.projectType,
      style: input.payload?.style ?? input.scene.metadata.style ?? 'transitional',
      budgetTier: input.payload?.budgetTier ?? 'better',
      region: input.payload?.region ?? 'unknown',
      notes: input.payload?.notes ?? '',
    },
    input.llm,
  );

  return {
    agent: 'material',
    ok: true,
    llmUsed: !!llm,
    promptRef,
    result: { recommendations: llm?.recommendations ?? recs },
  };
}

// ── Sequencing agent ────────────────────────────────────────────────────────

export interface SequencingAgentPhase {
  phase: string;
  weeks: number;
  paymentPct?: number;
  deliverables?: string[];
}

export interface SequencingAgentResult {
  phases: SequencingAgentPhase[];
  totalWeeks: number;
  milestoneNotes?: string[];
}

export async function sequencingAgent(
  input: AgentInput<{ estimateJson?: string }>,
): Promise<AgentOutput<SequencingAgentResult>> {
  const m = calculateSceneStats(input.scene);
  const sqft = m.totalFloorAreaSqFt;
  const baseline: SequencingAgentPhase[] = [
    { phase: 'demolition', weeks: 1, paymentPct: 5 },
    { phase: 'framing', weeks: 1 + Math.ceil(sqft / 600), paymentPct: 20 },
    { phase: 'mep_rough', weeks: 2, paymentPct: 15 },
    { phase: 'insulation', weeks: 1, paymentPct: 5 },
    { phase: 'drywall', weeks: 2, paymentPct: 10 },
    { phase: 'cabinetry', weeks: 1, paymentPct: 10 },
    { phase: 'finishes', weeks: 2 + Math.ceil(sqft / 800), paymentPct: 15 },
    { phase: 'fixtures', weeks: 1, paymentPct: 5 },
    { phase: 'mep_trim', weeks: 1, paymentPct: 10 },
    { phase: 'cleanup', weeks: 1, paymentPct: 5 },
  ];
  const totalWeeks = baseline.reduce((s, p) => s + p.weeks, 0);

  const { result: llm, promptRef } = await runPromptJson<SequencingAgentResult>(
    AGENT_PROMPTS.sequencing,
    {
      sceneJson: JSON.stringify(input.scene),
      estimateJson: input.payload?.estimateJson ?? '{}',
      projectType: input.scene.projectType,
    },
    input.llm,
  );

  return {
    agent: 'sequencing',
    ok: true,
    llmUsed: !!llm,
    promptRef,
    result: llm ?? { phases: baseline, totalWeeks },
  };
}

// ── Budget agent ────────────────────────────────────────────────────────────

export interface BudgetAgentResult {
  recommendedContingencyPct: number;
  notes: string[];
  valueEngineeringOptions?: { swap: string; savingsCents: number; tradeoff: string }[];
  budgetWarnings?: string[];
}

export async function budgetAgent(
  input: AgentInput<{ targetBudgetCents?: number; estimateJson?: string }>,
): Promise<AgentOutput<BudgetAgentResult>> {
  const m = calculateSceneStats(input.scene);
  const notes: string[] = [];
  let pct = 0.1;
  if (input.scene.projectType === 'addition' || input.scene.projectType === 'adu') {
    pct = 0.15;
    notes.push('Additions/ADUs warrant 15% contingency due to unknown site conditions.');
  } else if (m.totalFloorAreaSqFt > 1500) {
    pct = 0.12;
    notes.push('Larger renovations carry more discovery risk — budget 12%.');
  } else {
    notes.push('Standard renovation contingency at 10%.');
  }

  const { result: llm, promptRef } = await runPromptJson<{
    recommendedContingencyPct?: number;
    valueEngineeringOptions?: BudgetAgentResult['valueEngineeringOptions'];
    budgetWarnings?: string[];
  }>(
    AGENT_PROMPTS.budget,
    {
      sceneJson: JSON.stringify(input.scene),
      estimateJson: input.payload?.estimateJson ?? '{}',
      targetBudgetCents: input.payload?.targetBudgetCents ?? 0,
    },
    input.llm,
  );

  return {
    agent: 'budget',
    ok: true,
    llmUsed: !!llm,
    promptRef,
    result: {
      recommendedContingencyPct: llm?.recommendedContingencyPct ?? pct,
      notes,
      valueEngineeringOptions: llm?.valueEngineeringOptions,
      budgetWarnings: llm?.budgetWarnings,
    },
  };
}

// ── Orchestrator ────────────────────────────────────────────────────────────

export interface OrchestrationResult {
  sceneId: string;
  layout: AgentOutput<LayoutAgentResult>;
  estimating: AgentOutput<EstimatingAgentResult>;
  permit: AgentOutput<PermitAgentResult>;
  designStyle: AgentOutput<DesignStyleAgentResult>;
  material: AgentOutput<MaterialAgentResult>;
  sequencing: AgentOutput<SequencingAgentResult>;
  budget: AgentOutput<BudgetAgentResult>;
}

export interface OrchestrateOptions {
  styleHint?: string;
  address?: string;
  zip?: string;
  marketTier?: string;
  targetBudgetCents?: number;
  llm?: LLMClient;
}

/**
 * Run the full agent pipeline. Errors in one agent do not abort the others —
 * each `AgentOutput.ok` flag tells the caller what succeeded.
 */
export async function orchestrate(
  scene: PascalSceneData,
  opts: OrchestrateOptions = {},
): Promise<OrchestrationResult> {
  const base: AgentInput = { scene, llm: opts.llm };

  const [layout, estimating, permit, designStyle, material, sequencing, budget] = await Promise.all([
    layoutAgent({ ...base }),
    estimatingAgent({ ...base, payload: { zip: opts.zip, marketTier: opts.marketTier } }),
    permitAgent({ ...base, payload: { address: opts.address } }),
    designStyleAgent({ ...base, payload: { styleHint: opts.styleHint } }),
    materialAgent({ ...base, payload: { style: opts.styleHint } }),
    sequencingAgent({ ...base }),
    budgetAgent({ ...base, payload: { targetBudgetCents: opts.targetBudgetCents } }),
  ]);

  return {
    sceneId: scene.id,
    layout,
    estimating,
    permit,
    designStyle,
    material,
    sequencing,
    budget,
  };
}
