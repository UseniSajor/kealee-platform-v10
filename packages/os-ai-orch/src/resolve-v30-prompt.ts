import { prisma } from '@kealee/database'
import { V30Prompts, type V30BotType } from '@kealee/kealee-agent-stack'

/** Live prompt: DB override (portal-admin) or wired default from agent-stack. */
export async function resolveV30SystemPrompt(botType: V30BotType): Promise<string> {
  return V30Prompts.getV30SystemPrompt(botType)
}
