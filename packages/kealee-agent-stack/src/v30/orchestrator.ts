import { getV30Bot, V30_PARALLEL_BOT_TYPES } from './bots'
import { getV30SystemPrompt } from './prompts'
import type {
  V30BotExecutionInput,
  V30BotExecutionResult,
  V30BotType,
  V30ParallelGenerationResult,
} from './types'

export interface V30OrchestratorOptions {
  /** When set, calls this instead of dry-run stubs (wire to Hermes / KeaBot). */
  executeBot?: (input: V30BotExecutionInput & { systemPrompt: string }) => Promise<V30BotExecutionResult>
  /** Subset of bots to run (default: all parallel post-payment bots). */
  botTypes?: V30BotType[]
}

export function v30DryRunExecution(input: V30BotExecutionInput): V30BotExecutionResult {
  const def = getV30Bot(input.botType)
  const started = Date.now()
  return {
    botType: input.botType,
    status: 'COMPLETE',
    progress: 100,
    outputData: {
      dryRun: true,
      message: `${def.displayName} completed (orchestrator stub)`,
      inputKeys: Object.keys(input.inputData),
    },
    modelUsed: def.defaultModel,
    tokensUsed: 0,
    costUSD: def.estimatedCostUsd,
    durationMs: Date.now() - started,
  }
}

/**
 * Run all post-payment v30 bots in parallel (KeaBot v3.0 pattern).
 */
export async function runV30ParallelGeneration(
  projectId: string,
  packageId: string,
  sharedInput: Record<string, unknown>,
  options: V30OrchestratorOptions = {},
): Promise<V30ParallelGenerationResult> {
  const types = options.botTypes ?? V30_PARALLEL_BOT_TYPES
  const startedAt = new Date().toISOString()

  const tasks = types.map(async (botType): Promise<V30BotExecutionResult> => {
    const input: V30BotExecutionInput = {
      projectId,
      packageId,
      botType,
      inputData: { ...sharedInput, botType },
    }
    const systemPrompt = getV30SystemPrompt(botType)

    if (options.executeBot) {
      return options.executeBot({ ...input, systemPrompt })
    }
    return v30DryRunExecution(input)
  })

  const executions = await Promise.all(tasks)
  const successCount = executions.filter(e => e.status === 'COMPLETE').length
  const failedCount = executions.length - successCount

  return {
    projectId,
    packageId,
    startedAt,
    completedAt: new Date().toISOString(),
    executions,
    successCount,
    failedCount,
  }
}
