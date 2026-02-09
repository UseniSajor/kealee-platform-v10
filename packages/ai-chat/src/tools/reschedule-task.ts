import type { PrismaClient } from '@prisma/client';
import type { ToolDefinition, ToolResult } from '../types';
import { assertChatProjectAccess } from '../access-guard';

export const definition: ToolDefinition = {
  name: 'reschedule_task',
  description:
    'Reschedule a task to a new due date. Only PMs and project owners can reschedule.',
  input_schema: {
    type: 'object',
    properties: {
      taskId: {
        type: 'string',
        description: 'The task ID to reschedule',
      },
      newDueDate: {
        type: 'string',
        description: 'The new due date in ISO format (e.g. 2026-03-15)',
      },
    },
    required: ['taskId', 'newDueDate'],
  },
};

export async function execute(
  prisma: PrismaClient,
  userId: string,
  input: Record<string, unknown>,
): Promise<ToolResult> {
  const taskId = input.taskId as string;
  const newDueDate = input.newDueDate as string;
  const p = prisma as any;

  const task = await p.task.findUnique({ where: { id: taskId } });
  if (!task) {
    return { content: `Task ${taskId} not found.` };
  }

  if (task.projectId) {
    await assertChatProjectAccess(prisma, task.projectId, userId);
  }

  const oldDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'No due date';

  await p.task.update({
    where: { id: taskId },
    data: { dueDate: new Date(newDueDate) },
  });

  const newDateFormatted = new Date(newDueDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return {
    content: `Task "${task.title}" rescheduled from ${oldDate} to ${newDateFormatted}.`,
    actions: [
      {
        type: 'reschedule_task',
        description: `Rescheduled: ${task.title}`,
        data: {
          taskId,
          oldDate,
          newDueDate: newDateFormatted,
          projectId: task.projectId,
        },
        requiresConfirmation: false,
      },
    ],
    sources: task.projectId
      ? [{ type: 'task', id: taskId, label: task.title }]
      : [],
  };
}
