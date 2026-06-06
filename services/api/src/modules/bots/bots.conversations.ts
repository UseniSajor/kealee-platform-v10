import { prismaAny } from '../../utils/prisma-helper'
import type { BotContext, BotOutput } from './bots.types'

export function persistBotConversation(
  input: Record<string, unknown>,
  output: BotOutput<unknown>,
  ctx: BotContext,
): Promise<void> {
  if (!ctx.userId || !ctx.sessionId) return Promise.resolve()

  return prismaAny.aIConversation.create({
    data: {
      userId: ctx.userId,
      projectId: typeof input.projectId === 'string' ? input.projectId : undefined,
      title: `${ctx.botId} execution`,
      messages: [
        { role: 'user', content: JSON.stringify(input) },
        { role: 'assistant', content: JSON.stringify(output.result) },
      ],
      context: {
        source: 'system-c',
        botId: ctx.botId,
        requestId: ctx.requestId,
        sessionId: ctx.sessionId,
      },
      tokens: (output.trace.inputTokens ?? 0) + (output.trace.outputTokens ?? 0),
      model: output.trace.modelUsed,
      lastMessageAt: output.trace.completedAt,
    },
  }).then(() => undefined).catch((error: unknown) => {
    console.error('[bots.conversations] Failed to persist conversation:', error)
  })
}
