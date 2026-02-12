import type { PrismaClient } from '@prisma/client';
import type { ToolDefinition, ToolResult } from '../types';
import { assertChatProjectAccess } from '../access-guard';

export const definition: ToolDefinition = {
  name: 'get_project_status',
  description:
    'Get the current status of a construction project including phase, percent complete, budget summary, and recent activity. Use this tool first when the user asks about a specific project.',
  input_schema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'The project ID to look up',
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

  const project = await p.project.findUnique({
    where: { id: projectId },
    include: {
      phases: { orderBy: { sortOrder: 'asc' } },
      tasks: { select: { id: true, status: true } },
      budgetSnapshots: { orderBy: { snapshotDate: 'desc' }, take: 1 },
      reports: { orderBy: { createdAt: 'desc' }, take: 1 },
      changeOrders: { where: { status: 'SUBMITTED' }, select: { id: true } },
    },
  });

  if (!project) {
    return { content: `Project ${projectId} not found.` };
  }

  const tasksByStatus: Record<string, number> = {};
  for (const t of project.tasks) {
    tasksByStatus[t.status] = (tasksByStatus[t.status] || 0) + 1;
  }

  const currentPhase = project.phases?.find(
    (ph: any) => ph.status === 'IN_PROGRESS',
  );
  const completedPhases =
    project.phases?.filter((ph: any) => ph.status === 'COMPLETED').length ?? 0;
  const totalPhases = project.phases?.length ?? 0;

  const snap = project.budgetSnapshots?.[0];
  const latestReport = project.reports?.[0];

  const lines: string[] = [
    `**${project.name || 'Untitled Project'}**`,
    `Address: ${project.address || 'N/A'}`,
    `Status: ${project.status}`,
    `Current Phase: ${currentPhase?.name ?? project.currentPhase ?? 'N/A'}`,
    `Phases Completed: ${completedPhases}/${totalPhases}`,
  ];

  if (snap) {
    lines.push(
      `Budget: $${Number(snap.totalBudget).toLocaleString()} | Spent: $${Number(snap.totalActual).toLocaleString()} | Remaining: $${(Number(snap.totalBudget) - Number(snap.totalActual)).toLocaleString()}`,
      `Budget % Complete: ${Number(snap.percentComplete)}%`,
    );
  } else if (project.budget) {
    lines.push(`Budget: $${Number(project.budget).toLocaleString()}`);
  }

  lines.push(
    `Tasks: ${Object.entries(tasksByStatus).map(([s, c]) => `${s}: ${c}`).join(', ') || 'None'}`,
  );

  if (project.changeOrders?.length > 0) {
    lines.push(`Pending Change Orders: ${project.changeOrders.length}`);
  }

  if (latestReport) {
    lines.push(
      `Latest Report: "${latestReport.title}" (${new Date(latestReport.createdAt).toLocaleDateString()})`,
    );
  }

  return {
    content: lines.join('\n'),
    sources: [
      { type: 'project', id: projectId, label: project.name || 'Project' },
    ],
  };
}
