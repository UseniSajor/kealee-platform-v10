import type { PrismaClient } from '@prisma/client';
import type { ToolDefinition, ToolResult } from '../types';
import { assertChatProjectAccess } from '../access-guard';

export const definition: ToolDefinition = {
  name: 'get_project_schedule',
  description:
    'Get the project schedule including start/end dates, phase timeline, and milestones.',
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

  const project = await p.project.findUnique({
    where: { id: projectId },
    include: {
      phases: { orderBy: { sortOrder: 'asc' } },
    },
  });

  if (!project) {
    return { content: `Project ${projectId} not found.` };
  }

  const fmt = (d: Date | string | null | undefined) =>
    d
      ? new Date(d).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : 'TBD';

  const lines: string[] = [
    `**Schedule — ${project.name || 'Project'}**`,
    `Planned Start: ${fmt(project.scheduledStartDate)}`,
    `Planned End: ${fmt(project.scheduledEndDate)}`,
  ];

  if (project.projectedEndDate) {
    lines.push(`Projected End: ${fmt(project.projectedEndDate)}`);
  }
  if (project.actualStartDate) {
    lines.push(`Actual Start: ${fmt(project.actualStartDate)}`);
  }
  if (project.actualEndDate) {
    lines.push(`Actual End: ${fmt(project.actualEndDate)}`);
  }

  if (project.scheduledEndDate && project.projectedEndDate) {
    const planned = new Date(project.scheduledEndDate).getTime();
    const projected = new Date(project.projectedEndDate).getTime();
    const diffDays = Math.round(
      (projected - planned) / (1000 * 60 * 60 * 24),
    );
    if (diffDays > 0) {
      lines.push(`Schedule Variance: ${diffDays} days behind`);
    } else if (diffDays < 0) {
      lines.push(`Schedule Variance: ${Math.abs(diffDays)} days ahead`);
    } else {
      lines.push(`On schedule`);
    }
  }

  if (project.phases && project.phases.length > 0) {
    lines.push('', '**Phases:**');
    for (const phase of project.phases) {
      const icon =
        phase.status === 'COMPLETED'
          ? '[DONE]'
          : phase.status === 'IN_PROGRESS'
            ? '[ACTIVE]'
            : '[--]';
      const dates =
        phase.plannedStartDate || phase.plannedEndDate
          ? ` (${fmt(phase.plannedStartDate)} - ${fmt(phase.plannedEndDate)})`
          : '';
      lines.push(
        `  ${icon} ${phase.name} — ${phase.percentComplete}% complete${dates}`,
      );
    }
  }

  return {
    content: lines.join('\n'),
    sources: [
      {
        type: 'project',
        id: projectId,
        label: `${project.name || 'Project'} Schedule`,
      },
    ],
  };
}
