import type { PrismaClient } from '@prisma/client';
import type { ToolDefinition, ToolResult } from '../types';
import { assertChatProjectAccess } from '../access-guard';

export const definition: ToolDefinition = {
  name: 'get_weekly_report',
  description:
    'Get the latest weekly report for a project, including narrative, data, and period covered.',
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

  const report = await p.report.findFirst({
    where: { projectId, type: 'weekly' },
    orderBy: { periodEnd: 'desc' },
  });

  if (!report) {
    return { content: 'No weekly reports found for this project.' };
  }

  const lines: string[] = [
    `**${report.title}**`,
    `Period: ${report.periodStart ? new Date(report.periodStart).toLocaleDateString() : 'N/A'} — ${report.periodEnd ? new Date(report.periodEnd).toLocaleDateString() : 'N/A'}`,
    `Status: ${report.status}`,
  ];

  if (report.narrative) {
    lines.push('', report.narrative);
  }

  if (report.data && typeof report.data === 'object') {
    const data = report.data as Record<string, unknown>;
    if (data.highlights && Array.isArray(data.highlights)) {
      lines.push('', '**Highlights:**');
      for (const h of data.highlights) {
        lines.push(`  - ${h}`);
      }
    }
    if (data.issues && Array.isArray(data.issues)) {
      lines.push('', '**Issues:**');
      for (const i of data.issues) {
        lines.push(`  - ${i}`);
      }
    }
  }

  return {
    content: lines.join('\n'),
    sources: [{ type: 'report', id: report.id, label: report.title }],
  };
}
