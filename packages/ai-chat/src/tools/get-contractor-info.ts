import type { PrismaClient } from '@prisma/client';
import type { ToolDefinition, ToolResult } from '../types';

export const definition: ToolDefinition = {
  name: 'get_contractor_info',
  description:
    'Look up a contractor by name or ID. Returns company info, trades, rating, and project history.',
  input_schema: {
    type: 'object',
    properties: {
      contractorId: {
        type: 'string',
        description: 'The contractor ID (if known)',
      },
      searchName: {
        type: 'string',
        description: 'Search by company name (partial match)',
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

  let contractors: any[];

  if (input.contractorId) {
    const c = await p.contractor.findUnique({
      where: { id: input.contractorId as string },
      include: {
        reviews: { orderBy: { createdAt: 'desc' }, take: 3 },
        contractorProjects: { take: 5 },
        bidSubmissions: { select: { id: true, status: true }, take: 10 },
      },
    });
    contractors = c ? [c] : [];
  } else if (input.searchName) {
    contractors = await p.contractor.findMany({
      where: {
        companyName: {
          contains: input.searchName as string,
          mode: 'insensitive',
        },
      },
      include: {
        bidSubmissions: { select: { id: true, status: true }, take: 10 },
      },
      take: 5,
    });
  } else {
    return { content: 'Please provide a contractorId or searchName.' };
  }

  if (contractors.length === 0) {
    return { content: 'No contractors found matching the criteria.' };
  }

  const lines: string[] = [];
  for (const c of contractors) {
    lines.push(
      `**${c.companyName}**`,
      `  Contact: ${c.contactName} (${c.email})`,
      `  Trades: ${c.trades?.join(', ') || 'N/A'}`,
      `  Rating: ${Number(c.rating).toFixed(1)}/5 (${c.reviewCount} reviews)`,
      `  Status: ${c.status}${c.isVerified ? ' - Verified' : ''}${c.isPreferred ? ' - Preferred' : ''}`,
    );
    if (c.yearsInBusiness)
      lines.push(`  Experience: ${c.yearsInBusiness} years`);
    if (c.bidSubmissions?.length) {
      const awarded = c.bidSubmissions.filter(
        (b: any) => b.status === 'AWARDED',
      ).length;
      lines.push(
        `  Recent Bids: ${c.bidSubmissions.length} (${awarded} awarded)`,
      );
    }
    lines.push('');
  }

  return {
    content: lines.join('\n'),
    sources: contractors.map((c: any) => ({
      type: 'contractor' as const,
      id: c.id,
      label: c.companyName,
    })),
  };
}
