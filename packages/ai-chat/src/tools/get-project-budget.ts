import type { PrismaClient } from '@prisma/client';
import type { ToolDefinition, ToolResult } from '../types';
import { assertChatProjectAccess } from '../access-guard';

export const definition: ToolDefinition = {
  name: 'get_project_budget',
  description:
    'Get detailed budget information for a project including total budget, spent, remaining, variance, and category breakdown.',
  input_schema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'The project ID',
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

  const [snapshot, changeOrders, project] = await Promise.all([
    p.budgetSnapshot.findFirst({
      where: { projectId },
      orderBy: { snapshotDate: 'desc' },
    }),
    p.changeOrder.findMany({
      where: { projectId, status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } },
      select: { id: true, title: true, totalCost: true, status: true },
    }),
    p.project.findUnique({
      where: { id: projectId },
      select: { name: true, budget: true },
    }),
  ]);

  const lines: string[] = [
    `**Budget Summary — ${project?.name || 'Project'}**`,
  ];

  if (snapshot) {
    const variance = Number(snapshot.totalVariance);
    lines.push(
      `Total Budget: $${Number(snapshot.totalBudget).toLocaleString()}`,
      `Committed: $${Number(snapshot.totalCommitted).toLocaleString()}`,
      `Actual Spent: $${Number(snapshot.totalActual).toLocaleString()}`,
      `Remaining: $${(Number(snapshot.totalBudget) - Number(snapshot.totalActual)).toLocaleString()}`,
      `Variance: $${variance.toLocaleString()} (${variance >= 0 ? 'under' : 'over'} budget)`,
      `Completion: ${Number(snapshot.percentComplete)}%`,
    );
    if (snapshot.forecast) {
      lines.push(
        `Forecast at Completion: $${Number(snapshot.forecast).toLocaleString()}`,
      );
    }
    if (snapshot.categories) {
      lines.push('', '**Category Breakdown:**');
      const cats = snapshot.categories as Record<string, any>;
      for (const [cat, data] of Object.entries(cats)) {
        if (typeof data === 'object' && data !== null) {
          lines.push(
            `  - ${cat}: $${Number((data as any).actual ?? 0).toLocaleString()} of $${Number((data as any).budget ?? 0).toLocaleString()}`,
          );
        }
      }
    }
    if (snapshot.notes) {
      lines.push(`\nNotes: ${snapshot.notes}`);
    }
  } else if (project?.budget) {
    lines.push(
      `Total Budget: $${Number(project.budget).toLocaleString()}`,
      'No budget snapshots recorded yet.',
    );
  } else {
    lines.push('No budget data available for this project.');
  }

  if (changeOrders.length > 0) {
    lines.push('', `**Pending Change Orders (${changeOrders.length}):**`);
    for (const co of changeOrders) {
      lines.push(
        `  - ${co.title}: $${Number(co.totalCost).toLocaleString()} (${co.status})`,
      );
    }
  }

  return {
    content: lines.join('\n'),
    sources: [
      {
        type: 'budget',
        id: snapshot?.id ?? projectId,
        label: `${project?.name || 'Project'} Budget`,
      },
    ],
  };
}
