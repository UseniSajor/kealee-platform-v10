import type { PrismaClient } from '@prisma/client';
import type { ToolDefinition, ToolResult } from '../types';
import { assertChatProjectAccess } from '../access-guard';

export const definition: ToolDefinition = {
  name: 'request_change_order',
  description:
    'Create a draft change order for a project. The change order will need separate approval.',
  input_schema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'The project ID',
      },
      title: {
        type: 'string',
        description: 'Title of the change order',
      },
      description: {
        type: 'string',
        description: 'Detailed description of the change',
      },
      reason: {
        type: 'string',
        description:
          'Reason: OWNER_REQUEST, DESIGN_CHANGE, UNFORESEEN_CONDITIONS, or CODE_COMPLIANCE',
      },
      estimatedCost: {
        type: 'number',
        description: 'Estimated cost impact in dollars',
      },
      scheduleDays: {
        type: 'number',
        description: 'Estimated schedule impact in days',
      },
    },
    required: ['projectId', 'title', 'description'],
  },
};

export async function execute(
  prisma: PrismaClient,
  userId: string,
  input: Record<string, unknown>,
): Promise<ToolResult> {
  const projectId = input.projectId as string;
  const p = prisma as any;

  await assertChatProjectAccess(prisma, projectId, userId);

  const count = await p.changeOrder.count({ where: { projectId } });
  const changeOrderNumber = `CO-${String(count + 1).padStart(3, '0')}`;
  const estimatedCost = (input.estimatedCost as number) || 0;

  const co = await p.changeOrder.create({
    data: {
      projectId,
      changeOrderNumber,
      title: input.title as string,
      description: (input.description as string) || null,
      reason: (input.reason as string) || 'OWNER_REQUEST',
      requestedBy: userId,
      originalAmount: 0,
      totalCost: estimatedCost,
      estimatedCost,
      scheduleDays: (input.scheduleDays as number) || 0,
      status: 'DRAFT',
    },
  });

  return {
    content: `Change order created as DRAFT.\n\n**${co.changeOrderNumber}: ${co.title}**\nEstimated Cost: $${estimatedCost.toLocaleString()}\nSchedule Impact: ${co.scheduleDays} days\n\nThis change order is in DRAFT status and will need to be submitted and approved.`,
    actions: [
      {
        type: 'request_change_order',
        description: `Created change order: ${co.changeOrderNumber}`,
        data: {
          changeOrderId: co.id,
          projectId,
          number: co.changeOrderNumber,
        },
        requiresConfirmation: false,
      },
    ],
    sources: [
      { type: 'project', id: projectId, label: `CO: ${co.changeOrderNumber}` },
    ],
  };
}
