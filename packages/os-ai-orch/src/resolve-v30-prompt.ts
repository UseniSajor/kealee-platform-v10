import { prisma } from '@kealee/database'
import { V30Prompts, type V30BotType } from '@kealee/kealee-agent-stack'

/** Live prompt: DB override (portal-admin) or wired default from agent-stack. */
export async function resolveV30SystemPrompt(botType: V30BotType): Promise<string> {
  try {
    const row = await prisma.v30BotConfiguration.findUnique({ where: { botType } })
    if (row?.enabled && row.systemPrompt.trim().length > 0) {
      return row.systemPrompt
    }
  } catch {
    /* migration not applied */
  }
  return V30Prompts.getV30SystemPrompt(botType)
}
