/**
 * permit.bot.ts
 *
 * PermitBot — Analyzes construction projects for permit requirements.
 *
 * Deterministic:  Checklist generation based on project type + scope flags
 * LLM:            Jurisdiction-specific rules, issue analysis, recommendations
 *
 * Covers DC, Maryland, Virginia jurisdictions.
 * Does NOT replace a licensed permit expediter — for planning only.
 */

import { callModel, parseJSON, isLLMAvailable } from '../bots.router'
import { startStep, recordTrace } from '../bots.logger'
import type {
  IBot, BotInput, BotOutput, BotContext,
  PermitBotInput, PermitBotOutput, PermitRequired, PermitIssue, PermitChecklistItem,
} from '../bots.types'

// ── Deterministic checklist builder ──────────────────────────────────────────

function buildBaseChecklist(input: PermitBotInput): PermitChecklistItem[] {
  const items: PermitChecklistItem[] = [
    { item: 'Architectural drawings (floor plans, elevations, sections)', complete: false, required: true },
    { item: 'Site plan with property lines and setbacks',                complete: false, required: true },
    { item: 'Owner authorization / property deed',                      complete: false, required: true },
    { item: 'Contractor license + insurance certificates',              complete: false, required: true },
  ]

  if (input.structuralChanges) {
    items.push(
      { item: 'Structural engineer stamped drawings',   complete: false, required: true },
      { item: 'Geotechnical / soil report (if new found.)', complete: false, required: false },
    )
  }
  if (input.electricalChanges) {
    items.push(
      { item: 'Electrical panel schedule and load calculations', complete: false, required: true },
      { item: 'Electrical permit application (separate)',        complete: false, required: true },
    )
  }
  if (input.plumbingChanges) {
    items.push(
      { item: 'Plumbing riser diagram',                         complete: false, required: true },
      { item: 'Plumbing permit application (separate)',         complete: false, required: true },
    )
  }
  if (input.hvacChanges) {
    items.push(
      { item: 'HVAC / mechanical drawings',                     complete: false, required: true },
      { item: 'Manual J / energy compliance form',              complete: false, required: false },
    )
  }
  if ((input.squareFootage ?? 0) > 5000) {
    items.push({ item: 'Fire suppression / sprinkler review', complete: false, required: true })
  }
  return items
}

function computeReadinessScore(issues: PermitIssue[], checklist: PermitChecklistItem[]): number {
  const blocking  = issues.filter(i => i.severity === 'blocking').length
  const warnings  = issues.filter(i => i.severity === 'warning').length
  const total     = checklist.filter(i => i.required).length || 1
  const complete  = checklist.filter(i => i.required && i.complete).length
  const base      = Math.round((complete / total) * 100)
  return Math.max(0, base - blocking * 20 - warnings * 5)
}

// ── LLM prompt ────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a permit specialist with 15+ years experience in DC, Maryland, and Virginia building codes.

Given a construction project description, identify:
1. All required permits and approvals
2. Blocking issues (will prevent permit issuance)
3. Warnings (will cause delays if unaddressed)
4. Recommendations for a smooth permit process

Return ONLY a JSON object:
{
  "permitsRequired": [
    {
      "type": "Building Permit",
      "authority": "DCRA (DC Dept of Consumer & Regulatory Affairs)",
      "estimatedTimeline": "8-12 weeks",
      "estimatedCost": 2500,
      "requiredDocuments": ["Architectural drawings", "Structural calcs"],
      "notes": "Express review available for residential projects under 3,000 sqft"
    }
  ],
  "issues": [
    {
      "severity": "blocking",
      "message": "Historic district review required — project is in Capitol Hill HD",
      "resolution": "Submit HPRB application 60 days before permit"
    }
  ],
  "recommendation": "1-2 sentences summarizing approach"
}

severities: "blocking" | "warning" | "info"
Be specific to the jurisdiction. Include real agency names, timelines, and costs.`

// ── Bot class ─────────────────────────────────────────────────────────────────

export class PermitBot implements IBot<PermitBotInput, PermitBotOutput> {
  readonly id          = 'permit-bot' as const
  readonly name        = 'PermitBot'
  readonly description = 'Analyzes permit requirements and readiness for DC/MD/VA construction projects'
  readonly version     = '1.0.0'
  readonly costProfile = 'medium' as const
  readonly requiresLLM = true

  async execute(
    input: BotInput<PermitBotInput>,
    ctx:   BotContext,
  ): Promise<BotOutput<PermitBotOutput>> {
    const { data }  = input
    const requestId = ctx.requestId
    const startedAt = new Date()
    const steps     = []

    // ── Step 1: Build deterministic checklist ────────────────────────────────
    const checklistTimer = startStep('deterministic', 'build_checklist', data.projectType)
    const checklist = buildBaseChecklist(data)
    steps.push(checklistTimer.finish(`${checklist.length} items`))

    // ── Step 2: LLM permit analysis ──────────────────────────────────────────
    let permitsRequired: PermitRequired[] = []
    let issues:          PermitIssue[]    = []
    let recommendation   = 'Engage a licensed permit expediter for jurisdiction-specific guidance.'
    let modelUsed: string | undefined
    let inputTokens  = 0
    let outputTokens = 0
    let costUSD      = 0

    const userPrompt = `Project Type: ${data.projectType}
Jurisdiction: ${data.jurisdiction}
Scope: ${data.scope}${data.squareFootage ? `\nSq ft: ${data.squareFootage}` : ''}
Structural changes: ${data.structuralChanges ?? false}
Plumbing changes: ${data.plumbingChanges ?? false}
Electrical changes: ${data.electricalChanges ?? false}
HVAC changes: ${data.hvacChanges ?? false}`

    if (isLLMAvailable()) {
      const llmTimer = startStep('llm', 'analyze_permits', data.jurisdiction)
      try {
        const result = await callModel({
          systemPrompt: SYSTEM_PROMPT,
          userPrompt,
          tier:         'standard',
          temperature:  0.2,
        })

        const parsed = parseJSON<{
          permitsRequired?: PermitRequired[]
          issues?:          PermitIssue[]
          recommendation?:  string
        }>(result.content, {})

        permitsRequired = parsed.permitsRequired ?? []
        issues          = parsed.issues          ?? []
        recommendation  = parsed.recommendation  ?? recommendation
        modelUsed       = result.model
        inputTokens     = result.inputTokens
        outputTokens    = result.outputTokens
        costUSD         = result.estimatedCostUSD
        steps.push(llmTimer.finish(`${permitsRequired.length} permits, ${issues.length} issues`))
      } catch (err: any) {
        steps.push(llmTimer.finish(undefined, err.message))
        permitsRequired = buildFallbackPermits(data)
      }
    } else {
      permitsRequired = buildFallbackPermits(data)
    }

    // ── Step 3: Compute readiness score ──────────────────────────────────────
    const scoreTimer  = startStep('deterministic', 'compute_readiness_score')
    const readinessScore = computeReadinessScore(issues, checklist)
    steps.push(scoreTimer.finish(`${readinessScore}%`))

    const completedAt = new Date()
    const trace = {
      requestId,
      botId:        this.id,
      startedAt,
      completedAt,
      durationMs:   completedAt.getTime() - startedAt.getTime(),
      modelUsed,
      inputTokens,
      outputTokens,
      deterministic: false,
      steps,
      cost: { estimatedUSD: costUSD },
    }
    recordTrace(trace)

    return {
      success: true,
      result: { readinessScore, permitsRequired, issues, recommendation, checklist },
      trace,
    }
  }
}

// ── Fallback ──────────────────────────────────────────────────────────────────

function buildFallbackPermits(input: PermitBotInput): PermitRequired[] {
  const permits: PermitRequired[] = [{
    type:               'Building Permit',
    authority:          `${input.jurisdiction} Building Department`,
    estimatedTimeline:  '6-12 weeks',
    estimatedCost:      1500,
    requiredDocuments:  ['Architectural drawings', 'Site plan', 'Owner authorization'],
    notes:              'Timeline varies by jurisdiction and project complexity',
  }]
  if (input.electricalChanges) {
    permits.push({
      type: 'Electrical Permit', authority: `${input.jurisdiction} Building Department`,
      estimatedTimeline: '2-4 weeks', estimatedCost: 300,
      requiredDocuments: ['Electrical plans', 'Load calculations'], notes: '',
    })
  }
  if (input.plumbingChanges) {
    permits.push({
      type: 'Plumbing Permit', authority: `${input.jurisdiction} Building Department`,
      estimatedTimeline: '2-4 weeks', estimatedCost: 250,
      requiredDocuments: ['Plumbing riser diagram'], notes: '',
    })
  }
  return permits
}
