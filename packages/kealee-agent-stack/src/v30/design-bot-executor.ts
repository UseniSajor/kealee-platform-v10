/**
 * Canonical v30 DesignBot — single implementation (wired prompt + Opus).
 * Do not call services/api design-bot-service or bots.chain in parallel with this.
 */
import { getV30Bot } from './bots'
import { buildV30BotUserPrompt } from './bot-task-prompts'
import { DESIGN_BOT_PROMPT } from './prompts/design-bot'
import {
  maxTokensForV30Bot,
} from './v30-claude-client'
import { completeV30WithFallback, resolveV30OpenAIModel } from './v30-primary-client'
import type { V30BotExecutionInput, V30BotExecutionResult } from './types'

function extractJsonObject(text: string): Record<string, unknown> | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const raw = fenced?.[1]?.trim() ?? text.trim()
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end <= start) return null
  try {
    return JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>
  } catch {
    return null
  }
}

/** Map v30 DesignBot JSON → concept portal–friendly shape (no second Claude call). */
export function mapV30DesignToConceptOutput(
  designJson: Record<string, unknown>,
  intakeContext?: { projectPath?: string; location?: string },
): Record<string, unknown> {
  const concepts = (designJson.concepts as Array<Record<string, unknown>>) ?? []
  const primary = concepts[0] ?? {}
  const costMin = Number(primary.estimatedCostMin ?? 0)
  const costMax = Number(primary.estimatedCostMax ?? costMin)

  return {
    source: 'v30_design_bot',
    designConcept: {
      style: String(primary.positioning ?? 'Balanced'),
      colorPalette: [],
      keyFeatures: (primary.keyFeatures as string[]) ?? [],
    },
    description: String(designJson.summary ?? primary.narrative ?? 'v30 design concepts'),
    estimatedCost: Math.round((costMin + costMax) / 2) || costMin,
    projectTimeline: String(primary.timeline ?? '6-8 weeks'),
    concepts,
    imagePrompts: concepts.flatMap(c => (c.imagePrompts as string[]) ?? []).slice(0, 12),
    mepSystem: { electrical: 'TBD', plumbing: 'TBD', hvac: 'TBD', lighting: 'TBD' },
    billOfMaterials: [],
    includes: ['v30 DesignBot — 3 concepts'],
    renderUrls: [],
    permitScope: {
      requiresPermit: true,
      permitTypes: [],
      estimatedPermitFee: 0,
      estimatedProcessingDays: 30,
      requiresPE: false,
      notes: 'See Permits tab in v30 workspace',
    },
    zoningNotes: intakeContext?.location ?? '',
    buildabilityFlag: 'feasible',
    readinessScore: 75,
    projectPath: intakeContext?.projectPath,
  }
}

/**
 * Run the one true v30 DesignBot (Kealee Platform Agents wired prompt).
 */
export async function executeV30DesignBot(
  input: V30BotExecutionInput,
): Promise<V30BotExecutionResult> {
  const def = getV30Bot('design')
  const started = Date.now()
  let model = resolveV30OpenAIModel()

  try {
    const result = await completeV30WithFallback({
      anthropicDefaultModel: def.defaultModel,
      maxTokens: maxTokensForV30Bot('design'),
      system: DESIGN_BOT_PROMPT,
      user: buildV30BotUserPrompt('design', input.inputData),
      botType: 'design',
    })
    model = result.model

    const parsed = extractJsonObject(result.text)
    const tokens = result.inputTokens + result.outputTokens

    const outputData = parsed
      ? {
          ...parsed,
          canonicalBot: 'v30_design',
          conceptOutput: mapV30DesignToConceptOutput(parsed, {
            projectPath: String(input.inputData.projectPath ?? input.inputData.category ?? ''),
            location: String(
              (input.inputData.intake as { location?: string } | undefined)?.location ?? '',
            ),
          }),
        }
      : {
          raw: result.text.slice(0, 12_000),
          parseError: true,
          canonicalBot: 'v30_design',
        }

    return {
      botType: 'design',
      status: parsed ? 'COMPLETE' : 'FAILED',
      progress: parsed ? 100 : 0,
      outputData,
      modelUsed: model,
      tokensUsed: tokens,
      costUSD: def.estimatedCostUsd,
      durationMs: Date.now() - started,
      errorMessage: parsed ? undefined : 'DesignBot JSON parse failed',
    }
  } catch (err: unknown) {
    return {
      botType: 'design',
      status: 'FAILED',
      progress: 0,
      outputData: {
        error: err instanceof Error ? err.message : 'DesignBot failed',
        canonicalBot: 'v30_design',
      },
      modelUsed: model,
      tokensUsed: 0,
      costUSD: 0,
      durationMs: Date.now() - started,
      errorMessage: err instanceof Error ? err.message : 'DesignBot failed',
    }
  }
}
