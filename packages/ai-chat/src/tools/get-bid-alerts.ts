import type { PrismaClient } from '@prisma/client';
import type { ToolDefinition, ToolResult } from '../types';

export const definition: ToolDefinition = {
  name: 'get_bid_alerts',
  description:
    'Get current bid alerts including urgent deadlines, bids due this week, items needing follow-up, and new leads. Use when the user asks about bid deadlines, upcoming due dates, or what needs attention.',
  input_schema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

export async function execute(
  prisma: PrismaClient,
  _userId: string,
  _input: Record<string, unknown>,
): Promise<ToolResult> {
  const p = prisma as any;

  const now = new Date();
  const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const activeStatuses = ['NEW', 'REVIEWING', 'PREPARING'];

  const [urgent, thisWeek, needsFollowUp, newLeads] = await Promise.all([
    p.bidOpportunity.findMany({
      where: {
        status: { in: activeStatuses },
        dueDate: { lte: threeDays, gte: now },
      },
      orderBy: { dueDate: 'asc' },
      select: { id: true, projectName: true, dueDate: true, status: true, priority: true, scope: true },
    }),
    p.bidOpportunity.findMany({
      where: {
        status: { in: activeStatuses },
        dueDate: { lte: sevenDays, gte: threeDays },
      },
      orderBy: { dueDate: 'asc' },
      select: { id: true, projectName: true, dueDate: true, status: true, priority: true, scope: true },
    }),
    p.bidOpportunity.findMany({
      where: {
        status: 'SUBMITTED',
        updatedAt: { lte: fourteenDaysAgo },
      },
      orderBy: { updatedAt: 'asc' },
      select: { id: true, projectName: true, dueDate: true, status: true, updatedAt: true },
    }),
    p.bidOpportunity.findMany({
      where: { status: 'NEW' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, projectName: true, source: true, dueDate: true, createdAt: true },
    }),
  ]);

  const totalAlerts = urgent.length + thisWeek.length + needsFollowUp.length + newLeads.length;

  if (totalAlerts === 0) {
    return { content: 'No active bid alerts. The pipeline is clear.' };
  }

  const lines: string[] = [`**Bid Alerts (${totalAlerts} total)**`];

  if (urgent.length > 0) {
    lines.push('', `**URGENT — Due within 3 days (${urgent.length}):**`);
    for (const b of urgent) {
      const due = b.dueDate ? new Date(b.dueDate).toLocaleDateString() : 'N/A';
      lines.push(`- **${b.projectName}** — Due: ${due} (${b.status})${b.scope ? ` — ${b.scope}` : ''}`);
    }
  }

  if (thisWeek.length > 0) {
    lines.push('', `**This Week — Due within 7 days (${thisWeek.length}):**`);
    for (const b of thisWeek) {
      const due = b.dueDate ? new Date(b.dueDate).toLocaleDateString() : 'N/A';
      lines.push(`- **${b.projectName}** — Due: ${due} (${b.status})`);
    }
  }

  if (needsFollowUp.length > 0) {
    lines.push('', `**Needs Follow-Up — No update in 14+ days (${needsFollowUp.length}):**`);
    for (const b of needsFollowUp) {
      lines.push(`- **${b.projectName}** — Last updated: ${new Date(b.updatedAt).toLocaleDateString()}`);
    }
  }

  if (newLeads.length > 0) {
    lines.push('', `**New Leads — Unreviewed (${newLeads.length}):**`);
    for (const b of newLeads) {
      lines.push(`- **${b.projectName}** — Source: ${b.source || 'N/A'}${b.dueDate ? `, Due: ${new Date(b.dueDate).toLocaleDateString()}` : ''}`);
    }
  }

  const sources = [
    ...urgent.map((b: any) => ({ type: 'bid' as const, id: b.id, label: b.projectName })),
    ...thisWeek.map((b: any) => ({ type: 'bid' as const, id: b.id, label: b.projectName })),
  ];

  return { content: lines.join('\n'), sources };
}
