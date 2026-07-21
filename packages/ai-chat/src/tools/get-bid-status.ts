import type { PrismaClient } from '@prisma/client';
import type { ToolDefinition, ToolResult } from '../types';
import { assertChatProjectAccess } from '../access-guard';

export const definition: ToolDefinition = {
  name: 'get_bid_status',
  description:
    'Get the status of bid requests for a project including submissions, scores, and recommendations.',
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

  const bidRequests = await p.bidRequest.findMany({
    where: { projectId },
    include: {
      bidSubmissions: {
        include: {
          contractor: { select: { companyName: true, rating: true } },
        },
        orderBy: { score: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (bidRequests.length === 0) {
    return { content: 'No bid requests found for this project.' };
  }

  const lines: string[] = [`**Bid Requests (${bidRequests.length}):**`];
  for (const br of bidRequests) {
    lines.push(
      `\n**${br.title || 'Bid Request'}** (${br.status})`,
      `  Trades: ${br.trades?.join(', ') || 'N/A'}`,
      `  Deadline: ${new Date(br.deadline).toLocaleDateString()}`,
      `  Submissions: ${br.bidSubmissions.length}`,
    );

    if (br.estimatedBudget) {
      lines.push(
        `  Estimated Budget: $${Number(br.estimatedBudget).toLocaleString()}`,
      );
    }

    if (br.bidSubmissions.length > 0) {
      const amounts = br.bidSubmissions.map((s: any) => Number(s.amount));
      const avg =
        amounts.reduce((a: number, b: number) => a + b, 0) / amounts.length;
      lines.push(`  Average Bid: $${Math.round(avg).toLocaleString()}`);

      lines.push('  **Top Bids:**');
      for (const sub of br.bidSubmissions.slice(0, 3)) {
        const score =
          sub.score != null ? ` | Score: ${sub.score}/100` : '';
        lines.push(
          `    - ${sub.contractor?.companyName || 'Unknown'}: $${Number(sub.amount).toLocaleString()}${score} (${sub.status})`,
        );
        if (sub.recommendation) {
          lines.push(`      AI: ${sub.recommendation}`);
        }
      }
    }
  }

  return {
    content: lines.join('\n'),
    sources: bidRequests.map((br: any) => ({
      type: 'bid' as const,
      id: br.id,
      label: br.title || 'Bid Request',
    })),
  };
}
