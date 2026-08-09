import { prismaAny } from '../../../utils/prisma-helper'
import { projectToDCSInput, scoreDCS } from '@kealee/agent-utils'
import { callModel, isLLMAvailable, parseJSON } from '../bots.router'
import { recordTrace, startStep } from '../bots.logger'
import type { BotCatalogEntry } from '../bots.catalog'
import type { BotContext, BotInput, BotOutput, BotStep, IBot } from '../bots.types'

export interface MigratedBotInput {
  prompt?: string
  projectId?: string
  context?: Record<string, unknown>
  [key: string]: unknown
}

export interface MigratedBotResult {
  summary: string
  recommendations: string[]
  nextStep: string
  confidence: 'low' | 'medium' | 'high'
  dataSource: 'prisma' | 'caller' | 'none'
  status: BotCatalogEntry['status']
  temporaryReason?: string
  raw?: Record<string, unknown>
}

function fallback(entry: BotCatalogEntry, input: MigratedBotInput): MigratedBotResult {
  return {
    summary: `${entry.name} accepted the request but model execution is unavailable.`,
    recommendations: ['Review the supplied context', 'Retry when the model service is configured'],
    nextStep: 'Provide additional project context or retry the request.',
    confidence: input.projectId || input.context ? 'medium' : 'low',
    dataSource: input.context ? 'caller' : 'none',
    status: entry.status,
    temporaryReason: entry.temporaryReason,
  }
}

export class MigratedBot implements IBot<MigratedBotInput, MigratedBotResult> {
  readonly id
  readonly name
  readonly description
  readonly version = '1.0.0'
  readonly costProfile
  readonly requiresLLM
  readonly migrationStatus

  constructor(private readonly entry: BotCatalogEntry) {
    this.id = entry.id
    this.name = entry.name
    this.description = entry.description
    this.costProfile = entry.costProfile
    this.requiresLLM = entry.requiresLLM
    this.migrationStatus = entry.status
  }

  async execute(
    input: BotInput<MigratedBotInput>,
    ctx: BotContext,
  ): Promise<BotOutput<MigratedBotResult>> {
    const startedAt = new Date()
    const steps: BotStep[] = []
    let project: Record<string, unknown> | null = null
    let dataSource: MigratedBotResult['dataSource'] = input.data.context ? 'caller' : 'none'

    if (input.data.projectId && this.entry.dataModel === 'project') {
      const lookup = startStep('lookup', 'load_project', input.data.projectId)
      try {
        project = await prismaAny.project.findUnique({ where: { id: input.data.projectId } })
        dataSource = project ? 'prisma' : dataSource
        steps.push(lookup.finish(project ? 'project loaded' : 'project not found'))
      } catch (error) {
        steps.push(lookup.finish(undefined, error instanceof Error ? error.message : String(error)))
      }
    }

    let result = fallback(this.entry, input.data)
    result.dataSource = dataSource
    if (this.id === 'design-bot' || this.id === 'feasibility-bot') {
      const scoring = startStep('deterministic', 'score_design_complexity')
      const source = { ...input.data, ...(project ?? {}) }
      const dcs = scoreDCS(projectToDCSInput(source as any))
      result.raw = { ...(result.raw ?? {}), designComplexity: dcs }
      steps.push(scoring.finish(`DCS=${dcs.total}, route=${dcs.route}`))
    }
    let modelUsed: string | undefined
    let inputTokens = 0
    let outputTokens = 0
    let costUSD = 0

    if (isLLMAvailable()) {
      const llm = startStep('llm', 'generate_response', this.entry.id)
      try {
        const response = await callModel({
          systemPrompt: this.entry.systemPrompt,
          userPrompt: [
            input.data.prompt ?? 'Analyze the supplied request and provide the best next action.',
            `Input: ${JSON.stringify(input.data)}`,
            project ? `Project data: ${JSON.stringify(project)}` : '',
            'Return JSON: {"summary":string,"recommendations":string[],"nextStep":string,"confidence":"low|medium|high","raw"?:object}',
          ].filter(Boolean).join('\n\n'),
          tier: input.options?.tier ?? 'standard',
          model: input.options?.model,
          maxTokens: input.options?.maxTokens ?? 1200,
          temperature: input.options?.temperature ?? 0.2,
        })
        const parsed = parseJSON<Partial<MigratedBotResult>>(response.content, {})
        result = {
          ...result,
          ...parsed,
          recommendations: Array.isArray(parsed.recommendations)
            ? parsed.recommendations
            : result.recommendations,
          dataSource,
          status: this.entry.status,
          temporaryReason: this.entry.temporaryReason,
        }
        modelUsed = response.model
        inputTokens = response.inputTokens
        outputTokens = response.outputTokens
        costUSD = response.estimatedCostUSD
        steps.push(llm.finish(result.summary.slice(0, 120)))
      } catch (error) {
        steps.push(llm.finish(undefined, error instanceof Error ? error.message : String(error)))
      }
    }

    const completedAt = new Date()
    const trace = {
      requestId: ctx.requestId,
      botId: this.id,
      startedAt,
      completedAt,
      durationMs: completedAt.getTime() - startedAt.getTime(),
      modelUsed,
      inputTokens,
      outputTokens,
      deterministic: !modelUsed,
      steps,
      cost: { estimatedUSD: costUSD },
    }
    recordTrace(trace, ctx)

    return { success: true, result, trace }
  }
}
