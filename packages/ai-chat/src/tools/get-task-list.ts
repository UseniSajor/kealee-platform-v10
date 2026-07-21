import type { PrismaClient } from '@prisma/client';
import type { ToolDefinition, ToolResult } from '../types';
import { assertChatProjectAccess } from '../access-guard';

export const definition: ToolDefinition = {
  name: 'get_task_list',
  description:
    'Get the task list for a project, optionally filtered by status or assignee.',
  input_schema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'The project ID',
      },
      status: {
        type: 'string',
        description:
          'Filter by status (e.g. PENDING, IN_PROGRESS, COMPLETED)',
      },
      assignedTo: {
        type: 'string',
        description: 'Filter by assigned user ID',
      },
    },
    required: ['projectId'],
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

  const where: Record<string, unknown> = { projectId };
  if (input.status) where.status = input.status;
  if (input.assignedTo) where.assignedTo = input.assignedTo;

  const tasks = await p.task.findMany({
    where,
    orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    take: 50,
  });

  if (tasks.length === 0) {
    return { content: 'No tasks found matching the criteria.' };
  }

  const lines: string[] = [`**Tasks (${tasks.length}):**`];
  for (const task of tasks) {
    const due = task.dueDate
      ? new Date(task.dueDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })
      : 'No due date';
    lines.push(
      `- [${task.status}] ${task.title} (${task.priority}) — Due: ${due}${task.assignedTo ? ` — Assigned: ${task.assignedTo}` : ''}`,
    );
  }

  return {
    content: lines.join('\n'),
    sources: [{ type: 'task', id: projectId, label: 'Task List' }],
  };
}
