import type { PrismaClient } from '@prisma/client';
import type { ToolDefinition, ToolResult } from '../types';
import { assertChatProjectAccess } from '../access-guard';

export const definition: ToolDefinition = {
  name: 'approve_decision',
  description:
    'Approve a pending decision from the decision queue. Only project owners and PMs can approve.',
  input_schema: {
    type: 'object',
    properties: {
      decisionId: {
        type: 'string',
        description: 'The decision log ID to approve',
      },
      feedback: {
        type: 'string',
        description: 'Optional feedback or notes about the decision',
      },
    },
    required: ['decisionId'],
  },
};

export async function execute(
  prisma: PrismaClient,
  userId: string,
  input: Record<string, unknown>,
): Promise<ToolResult> {
  const decisionId = input.decisionId as string;
  const feedback = input.feedback as string | undefined;
  const p = prisma as any;

  const decision = await p.decisionLog.findUnique({
    where: { id: decisionId },
  });

  if (!decision) {
    return { content: `Decision ${decisionId} not found.` };
  }

  if (decision.accepted !== null) {
    return {
      content: `This decision has already been ${decision.accepted ? 'approved' : 'rejected'}.`,
    };
  }

  await assertChatProjectAccess(prisma, decision.projectId, userId);

  await p.decisionLog.update({
    where: { id: decisionId },
    data: {
      accepted: true,
      acceptedAt: new Date(),
      feedback: feedback || null,
    },
  });

  return {
    content: `Decision approved: ${decision.question}\n\nRecommendation was: ${decision.recommendation}${feedback ? `\nYour feedback: ${feedback}` : ''}`,
    actions: [
      {
        type: 'approve_decision',
        description: `Approved decision: ${decision.type}`,
        data: { decisionId, projectId: decision.projectId },
        requiresConfirmation: false,
      },
    ],
    sources: [
      {
        type: 'project',
        id: decision.projectId,
        label: `Decision: ${decision.type}`,
      },
    ],
  };
}
