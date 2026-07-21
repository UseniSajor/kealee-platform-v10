import type { PrismaClient } from '@prisma/client';
import type { ToolDefinition, ToolResult } from '../types';

export const definition: ToolDefinition = {
  name: 'get_bid_pipeline',
  description:
    'Get a summary of the bid pipeline including counts by status, total pipeline value, win rate, and recent activity. Use when the user asks about bidding activity, pipeline status, or bid overview.',
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
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    total,
    active,
    dueSoon,
    submitted,
    awarded,
    lost,
    byStatus,
  ] = await Promise.all([
    p.bidOpportunity.count(),
    p.bidOpportunity.count({
      where: { status: { in: ['NEW', 'REVIEWING', 'PREPARING'] } },
    }),
    p.bidOpportunity.count({
      where: {
        status: { in: ['NEW', 'REVIEWING', 'PREPARING'] },
        dueDate: { lte: sevenDays, gte: now },
      },
    }),
    p.bidOpportunity.count({ where: { status: 'SUBMITTED' } }),
    p.bidOpportunity.count({ where: { status: 'AWARDED' } }),
    p.bidOpportunity.count({ where: { status: 'LOST' } }),
    p.bidOpportunity.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { estimatedValue: true },
    }),
  ]);

  const winRate = (submitted + awarded + lost) > 0
    ? Math.round((awarded / (awarded + lost)) * 100)
    : 0;

  const pipelineValue = byStatus.reduce((sum: number, s: any) => {
    if (['NEW', 'REVIEWING', 'PREPARING', 'SUBMITTED'].includes(s.status)) {
      return sum + (Number(s._sum?.estimatedValue) || 0);
    }
    return sum;
  }, 0);

  const lines: string[] = [
    `**Bid Pipeline Summary**`,
    `Total Bids: ${total} | Active: ${active} | Due This Week: ${dueSoon}`,
    `Submitted: ${submitted} | Awarded: ${awarded} | Lost: ${lost}`,
    `Win Rate: ${winRate}%`,
    `Pipeline Value: $${pipelineValue.toLocaleString()}`,
    '',
    '**By Status:**',
  ];

  for (const s of byStatus) {
    const value = Number(s._sum?.estimatedValue) || 0;
    lines.push(
      `- ${s.status}: ${s._count.id} bid${s._count.id !== 1 ? 's' : ''}${value > 0 ? ` ($${value.toLocaleString()})` : ''}`,
    );
  }

  return { content: lines.join('\n') };
}
