/**
 * bots.types.ts
 *
 * Core TypeScript interfaces for the KeaBots AI automation framework.
 * Each bot has a well-typed input/output contract so domain code can
 * call bots without any runtime surprises.
 */

// ── Framework core ────────────────────────────────────────────────────────────

export type BotId =
  | 'lead-bot'
  | 'estimate-bot'
  | 'permit-bot'
  | 'contractor-match-bot'
  | 'project-monitor-bot'
  | 'support-bot'

export type BotCostProfile = 'free' | 'low' | 'medium' | 'high'
export type ModelTier       = 'fast' | 'standard' | 'premium'

export interface BotContext {
  botId:      BotId
  requestId:  string
  userId?:    string
  orgId?:     string
  sessionId?: string
}

export interface BotRunOptions {
  tier?:        ModelTier
  model?:       string
  maxTokens?:   number
  temperature?: number
}

export interface BotInput<T = Record<string, unknown>> {
  data:     T
  options?: BotRunOptions
}

export interface BotOutput<T = Record<string, unknown>> {
  success: boolean
  result:  T
  trace:   BotExecutionTrace
  error?:  string
}

export interface BotExecutionTrace {
  requestId:    string
  botId:        BotId
  startedAt:    Date
  completedAt:  Date
  durationMs:   number
  modelUsed?:   string
  inputTokens?: number
  outputTokens?: number
  deterministic: boolean
  steps:        BotStep[]
  cost?: { estimatedUSD: number }
}

export interface BotStep {
  stepId:        string
  type:          'deterministic' | 'llm' | 'tool' | 'lookup'
  name:          string
  inputSummary?: string
  outputSummary?: string
  durationMs:    number
  error?:        string
}

export interface IBot<
  TInput  = Record<string, unknown>,
  TOutput = Record<string, unknown>
> {
  readonly id:            BotId
  readonly name:          string
  readonly description:   string
  readonly version:       string
  readonly costProfile:   BotCostProfile
  readonly requiresLLM:   boolean

  execute(input: BotInput<TInput>, ctx: BotContext): Promise<BotOutput<TOutput>>
}

// ── LeadBot ───────────────────────────────────────────────────────────────────

export interface LeadBotInput {
  sessionId:            string
  message:              string
  conversationHistory?: ConvMessage[]
  projectData?: {
    type?:     string
    location?: string
    budget?:   number
    timeline?: string
  }
}

export interface ConvMessage {
  role:    'user' | 'assistant'
  content: string
}

export interface LeadBotOutput {
  reply:            string
  leadScore:        number
  readyForHandoff:  boolean
  suggestedActions: string[]
  extractedData: {
    projectType?:     string
    location?:        string
    estimatedBudget?: number
    urgency?:         'low' | 'medium' | 'high'
  }
}

// ── EstimateBot ───────────────────────────────────────────────────────────────

export interface EstimateBotInput {
  projectId?:          string
  projectType:         string
  scopeOfWork:         string
  squareFootage?:      number
  location:            string
  qualityLevel?:       'standard' | 'premium' | 'luxury'
  existingConditions?: string
}

export interface EstimateLineItem {
  category:   string
  description: string
  unitCost:   number
  quantity:   number
  unit:       string
  totalLow:   number
  totalHigh:  number
  confidence: 'high' | 'medium' | 'low'
}

export interface EstimateBotOutput {
  estimateId:         string
  totalLow:           number
  totalHigh:          number
  breakdown:          EstimateLineItem[]
  assumptions:        string[]
  exclusions:         string[]
  validityPeriodDays: number
  confidence:         number
}

// ── PermitBot ─────────────────────────────────────────────────────────────────

export interface PermitBotInput {
  projectId?:          string
  projectType:         string
  jurisdiction:        string
  scope:               string
  squareFootage?:      number
  structuralChanges?:  boolean
  plumbingChanges?:    boolean
  electricalChanges?:  boolean
  hvacChanges?:        boolean
}

export interface PermitRequired {
  type:               string
  authority:          string
  estimatedTimeline:  string
  estimatedCost:      number
  requiredDocuments:  string[]
  notes:              string
}

export interface PermitIssue {
  severity:   'blocking' | 'warning' | 'info'
  message:    string
  resolution: string
}

export interface PermitChecklistItem {
  item:     string
  complete: boolean
  required: boolean
}

export interface PermitBotOutput {
  readinessScore:   number
  permitsRequired:  PermitRequired[]
  issues:           PermitIssue[]
  recommendation:   string
  checklist:        PermitChecklistItem[]
}

// ── ContractorMatchBot ────────────────────────────────────────────────────────

export interface ContractorMatchBotInput {
  leadId:                string
  projectType:           string
  location:              string
  budget?:               number
  timeline?:             string
  specialRequirements?:  string[]
  preferredTier?:        string
}

export interface ContractorMatch {
  profileId:   string
  score:       number
  reasons:     string[]
  strengths:   string[]
  concerns:    string[]
  recommended: boolean
}

export interface ContractorMatchBotOutput {
  matches:           ContractorMatch[]
  matchingCriteria:  Record<string, number>
  recommendation:    string
  totalCandidates:   number
}

// ── ProjectMonitorBot ─────────────────────────────────────────────────────────

export interface ProjectMonitorBotInput {
  projectId:               string
  includeRiskAnalysis?:    boolean
  includeBudgetAnalysis?:  boolean
  includeScheduleAnalysis?: boolean
}

export interface ProjectRisk {
  category:    string
  severity:    'high' | 'medium' | 'low'
  description: string
  mitigation:  string
}

export interface ProjectAction {
  priority: 'urgent' | 'high' | 'medium'
  action:   string
  owner:    string
  dueDate?: string
}

export interface ProjectMonitorBotOutput {
  healthScore: number
  status:      'healthy' | 'at_risk' | 'critical'
  summary:     string
  budget: {
    allocated:       number
    spent:           number
    remaining:       number
    burnRate:        number
    forecastOverrun: number
    cpi:             number
  }
  schedule: {
    completionPct:       number
    onSchedule:          boolean
    projectedCompletion?: string
    daysDelay?:          number
  }
  risks:   ProjectRisk[]
  actions: ProjectAction[]
}

// ── SupportBot ────────────────────────────────────────────────────────────────

export interface SupportBotInput {
  sessionId:            string
  message:              string
  userRole?:            string
  conversationHistory?: ConvMessage[]
  context?: {
    currentPage?:  string
    projectId?:    string
    currentPhase?: string
  }
}

export interface SupportAction {
  label:   string
  url?:    string
  action?: string
}

export interface SupportBotOutput {
  reply:            string
  category:         'faq' | 'escalation' | 'navigation' | 'technical' | 'billing'
  shouldEscalate:   boolean
  suggestedActions: SupportAction[]
  relatedArticles?: string[]
}
