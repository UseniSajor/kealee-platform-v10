import {
  executeV30BotWithLlm,
  type V30BotExecutionInput,
  type V30BotExecutionResult,
} from '@kealee/kealee-agent-stack'
import { resolveV30SystemPrompt } from './resolve-v30-prompt'

/** Execute v30 bot with DB-backed prompts (portal-admin live editing). */
export async function executeV30BotForOrch(
  input: V30BotExecutionInput,
): Promise<V30BotExecutionResult> {
  const systemPrompt = await resolveV30SystemPrompt(input.botType)
  return executeV30BotWithLlm({ ...input, systemPrompt })
}
