/**
 * contractor-match.bot.ts
 *
 * ContractorMatchBot — Scores and ranks contractors for a given lead.
 *
 * Deterministic:  Criteria scoring (verification, tier, pipeline capacity, type match)
 * LLM:            Narrative strengths/concerns + recommendation summary
 *
 * Integrates with the canonical RotationQueueEntry + MarketplaceProfile DB tables.
 */

import { prismaAny } from '../../../utils/prisma-helper'
import { callModel, parseJSON, isLLMAvailable } from '../bots.router'
import { startStep, recordTrace } from '../bots.logger'
import type {
  IBot, BotInput, BotOutput, BotContext,
  ContractorMatchBotInput, ContractorMatchBotOutput, ContractorMatch,
} from '../bots.types'

// ── Scoring weights ───────────────────────────────────────────────────────────

const WEIGHTS = {
  licenseVerified:   25,
  insuranceVerified: 20,
  onlineEligible:    15, // in rotation queue and eligible
  projectTypeMatch:  20,
  pipelineCapacity:  10,
  performanceScore:  10,
}

const PROJECT_TYPE_KEYWORDS: Record<string, string[]> = {
  RENOVATION:   ['renov', 'remodel', 'interior', 'kitchen', 'bath'],
  NEW_HOME:     ['new build', 'ground.up', 'new home', 'new construct'],
  ADDITION:     ['addition', 'bump.out', 'extension', 'expand'],
  MULTIFAMILY:  ['multi', 'apartment', 'condo', 'townhouse'],
  COMMERCIAL:   ['commercial', 'office', 'retail', 'warehouse', 'industrial'],
}

function projectTypeScore(specialties: string[], projectType: string): number {
  const pt = projectType.toLowerCase()
  for (const [type, keywords] of Object.entries(PROJECT_TYPE_KEYWORDS)) {
    if (keywords.some(k => pt.includes(k))) {
      if (specialties.some(s => s.toUpperCase().includes(type))) return WEIGHTS.projectTypeMatch
    }
  }
  return 5 // partial credit — general contractor
}

function pipelineCapacityScore(
  maxPipelineValue:     number | null,
  currentPipelineValue: number | null,
  budget:               number | null,
): number {
  if (!maxPipelineValue) return 5 // unknown — give half credit
  const remaining = (maxPipelineValue ?? 0) - (currentPipelineValue ?? 0)
  if (remaining <= 0) return 0
  if (!budget || remaining > budget * 1.5) return WEIGHTS.pipelineCapacity
  if (remaining > budget * 0.5) return Math.round(WEIGHTS.pipelineCapacity * 0.6)
  return 2
}

function scoreCandidate(
  entry:       any,
  profile:     any,
  projectType: string,
  budget:      number | null,
): { score: number; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {}

  breakdown.licenseVerified   = entry.licenseVerified   ? WEIGHTS.licenseVerified   : 0
  breakdown.insuranceVerified = entry.insuranceVerified ? WEIGHTS.insuranceVerified : 0
  breakdown.onlineEligible    = entry.status === 'ELIGIBLE' ? WEIGHTS.onlineEligible : 0
  breakdown.projectTypeMatch  = projectTypeScore(profile.specialties ?? [], projectType)
  breakdown.pipelineCapacity  = pipelineCapacityScore(
    profile.maxPipelineValue    ? Number(profile.maxPipelineValue)    : null,
    profile.currentPipelineValue ? Number(profile.currentPipelineValue) : null,
    budget,
  )
  breakdown.performanceScore  = profile.performanceScore
    ? Math.round((profile.performanceScore / 100) * WEIGHTS.performanceScore)
    : 5

  const score = Object.values(breakdown).reduce((s, v) => s + v, 0)
  return { score: Math.min(score, 100), breakdown }
}

// ── LLM prompt ────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a construction marketplace analyst helping match contractors to projects.

Given a list of scored contractor candidates and the project details, provide:
1. Narrative strengths for the top 3 candidates
2. Any concerns worth flagging
3. A brief overall recommendation

Return ONLY JSON:
{
  "matches": [
    {
      "profileId": "...",
      "strengths": ["Extensive renovation portfolio", "Verified license and insurance"],
      "concerns": ["Current pipeline near capacity"]
    }
  ],
  "recommendation": "Contractor A is the strongest fit based on..."
}

Be concise. Each strengths/concerns array should have 1-3 items max.`

// ── Bot class ─────────────────────────────────────────────────────────────────

export class ContractorMatchBot implements IBot<ContractorMatchBotInput, ContractorMatchBotOutput> {
  readonly id          = 'contractor-match-bot' as const
  readonly name        = 'ContractorMatchBot'
  readonly description = 'Scores and ranks eligible contractors for a lead using verification, pipeline, and type-match criteria'
  readonly version     = '1.0.0'
  readonly costProfile = 'low' as const
  readonly requiresLLM = false // deterministic-first; LLM is enhancement

  async execute(
    input: BotInput<ContractorMatchBotInput>,
    ctx:   BotContext,
  ): Promise<BotOutput<ContractorMatchBotOutput>> {
    const { data }  = input
    const requestId = ctx.requestId
    const startedAt = new Date()
    const steps: ReturnType<typeof startStep>[] = []

    // ── Step 1: Load rotation queue + profiles ───────────────────────────────
    const loadTimer = startStep('lookup', 'load_candidates', data.projectType)
    let candidates: any[] = []
    try {
      const entries = await prismaAny.rotationQueueEntry.findMany({
        where: {
          professionalType: 'CONTRACTOR',
          status: { in: ['ELIGIBLE', 'IN_ROTATION'] },
        },
        include: {
          profile: {
            select: {
              id: true, businessName: true, specialties: true,
              performanceScore: true, maxPipelineValue: true,
              currentPipelineValue: true, rating: true, projectsCompleted: true,
            },
          },
        },
        take: 20,
      })
      candidates = entries
      steps.push(loadTimer.finish(`${entries.length} candidates`))
    } catch (err: any) {
      steps.push(loadTimer.finish('0 candidates (DB error)', err.message))
    }

    // ── Step 2: Score deterministically ──────────────────────────────────────
    const scoreTimer = startStep('deterministic', 'score_candidates', `${candidates.length} candidates`)
    const scored = candidates
      .filter(e => e.profile)
      .map(e => {
        const { score, breakdown } = scoreCandidate(e, e.profile, data.projectType, data.budget ?? null)
        return { entry: e, profile: e.profile, score, breakdown }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5) // top 5

    const matchingCriteria: Record<string, number> = {
      licenseVerified:   WEIGHTS.licenseVerified,
      insuranceVerified: WEIGHTS.insuranceVerified,
      onlineEligible:    WEIGHTS.onlineEligible,
      projectTypeMatch:  WEIGHTS.projectTypeMatch,
      pipelineCapacity:  WEIGHTS.pipelineCapacity,
      performanceScore:  WEIGHTS.performanceScore,
    }
    steps.push(scoreTimer.finish(`top score=${scored[0]?.score ?? 0}`))

    // ── Step 3: Build base match objects ──────────────────────────────────────
    const baseMatches: ContractorMatch[] = scored.map(s => ({
      profileId:   s.profile.id,
      score:       s.score,
      reasons:     Object.entries(s.breakdown)
        .filter(([, v]) => v > 0)
        .map(([k]) => k.replace(/([A-Z])/g, ' $1').trim()),
      strengths:   [],
      concerns:    [],
      recommended: s.score >= 70,
    }))

    // ── Step 4 (optional): LLM narratives ─────────────────────────────────────
    let recommendation = `${scored.length} contractors evaluated. Top match score: ${scored[0]?.score ?? 0}/100.`
    let modelUsed: string | undefined
    let inputTokens  = 0
    let outputTokens = 0
    let costUSD      = 0

    if (isLLMAvailable() && scored.length > 0) {
      const llmTimer = startStep('llm', 'generate_narratives', `top=${scored[0]?.score}`)
      try {
        const candidateSummary = scored.slice(0, 3).map(s => ({
          profileId:        s.profile.id,
          businessName:     s.profile.businessName,
          score:            s.score,
          specialties:      s.profile.specialties,
          performanceScore: s.profile.performanceScore,
          verified:         s.entry.licenseVerified && s.entry.insuranceVerified,
          pipelineCapacity: s.breakdown.pipelineCapacity,
        }))

        const result = await callModel({
          systemPrompt: SYSTEM_PROMPT,
          userPrompt:   `Project: ${data.projectType} in ${data.location}\nBudget: ${data.budget ?? 'unknown'}\nCandidates: ${JSON.stringify(candidateSummary, null, 2)}`,
          tier:         'fast',
          temperature:  0.3,
        })

        const parsed = parseJSON<{
          matches?: Array<{ profileId: string; strengths: string[]; concerns: string[] }>
          recommendation?: string
        }>(result.content, {})

        if (parsed.matches) {
          for (const m of baseMatches) {
            const llmM = parsed.matches.find(p => p.profileId === m.profileId)
            if (llmM) {
              m.strengths = llmM.strengths ?? []
              m.concerns  = llmM.concerns  ?? []
            }
          }
        }
        recommendation = parsed.recommendation ?? recommendation
        modelUsed       = result.model
        inputTokens     = result.inputTokens
        outputTokens    = result.outputTokens
        costUSD         = result.estimatedCostUSD
        steps.push(llmTimer.finish('narratives added'))
      } catch (err: any) {
        steps.push(llmTimer.finish(undefined, err.message))
      }
    }

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
      deterministic: !isLLMAvailable() || !modelUsed,
      steps,
      cost: { estimatedUSD: costUSD },
    }
    recordTrace(trace)

    return {
      success: true,
      result: {
        matches:          baseMatches,
        matchingCriteria,
        recommendation,
        totalCandidates:  candidates.length,
      },
      trace,
    }
  }
}
