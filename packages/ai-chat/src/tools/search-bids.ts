import type { PrismaClient } from '@prisma/client';
import type { ToolDefinition, ToolResult } from '../types';

export const definition: ToolDefinition = {
  name: 'search_bids',
  description:
    'Search and filter bid opportunities by keyword, status, or source. Returns matching bids with key details. Use when the user asks to find a bid, search for bids, or filter by criteria.',
  input_schema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search term to match against project name, scope, owner, GC, or location',
      },
      status: {
        type: 'string',
        description: 'Filter by status (NEW, REVIEWING, PREPARING, SUBMITTED, AWARDED, LOST, NO_BID, WITHDRAWN)',
      },
      source: {
        type: 'string',
        description: 'Filter by source (MANUAL, BUILDING_CONNECTED, EMMA, OPENGOV, SHA_MDOT, DIRECT_INVITE)',
      },
    },
    required: [],
  },
};

export async function execute(
  prisma: PrismaClient,
  _userId: string,
  input: Record<string, unknown>,
): Promise<ToolResult> {
  const p = prisma as any;
  const query = input.query as string | undefined;
  const status = input.status as string | undefined;
  const source = input.source as string | undefined;

  const where: any = {};

  if (status) where.status = status;
  if (source) where.source = source;
  if (query) {
    where.OR = [
      { projectName: { contains: query, mode: 'insensitive' } },
      { scope: { contains: query, mode: 'insensitive' } },
      { ownerName: { contains: query, mode: 'insensitive' } },
      { gcName: { contains: query, mode: 'insensitive' } },
      { location: { contains: query, mode: 'insensitive' } },
    ];
  }

  const bids = await p.bidOpportunity.findMany({
    where,
    select: {
      id: true,
      projectName: true,
      status: true,
      source: true,
      scope: true,
      dueDate: true,
      estimatedValue: true,
      ownerName: true,
      gcName: true,
      location: true,
      overallScore: true,
    },
    take: 10,
    orderBy: { dueDate: 'asc' },
  });

  if (bids.length === 0) {
    const filterDesc = [
      query && `matching "${query}"`,
      status && `status: ${status}`,
      source && `source: ${source}`,
    ].filter(Boolean).join(', ');
    return { content: `No bids found${filterDesc ? ` ${filterDesc}` : ''}.` };
  }

  const lines: string[] = [`**Bids Found (${bids.length}):**`];

  for (const bid of bids) {
    const due = bid.dueDate ? new Date(bid.dueDate).toLocaleDateString() : 'No date';
    const value = bid.estimatedValue ? `$${Number(bid.estimatedValue).toLocaleString()}` : '';
    lines.push(
      `- **${bid.projectName}** (${bid.status})`,
      `  Due: ${due}${value ? ` | Value: ${value}` : ''}${bid.scope ? ` | Scope: ${bid.scope}` : ''}`,
      `  ${[bid.ownerName && `Owner: ${bid.ownerName}`, bid.gcName && `GC: ${bid.gcName}`, bid.location && `Location: ${bid.location}`].filter(Boolean).join(' | ')}`,
      `  ID: ${bid.id}${bid.overallScore ? ` | Score: ${bid.overallScore}/100` : ''}`,
    );
  }

  return {
    content: lines.join('\n'),
    sources: bids.map((b: any) => ({
      type: 'bid' as const,
      id: b.id,
      label: b.projectName,
    })),
  };
}
