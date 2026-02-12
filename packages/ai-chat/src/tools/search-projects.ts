import type { PrismaClient } from '@prisma/client';
import type { ToolDefinition, ToolResult } from '../types';

export const definition: ToolDefinition = {
  name: 'search_projects',
  description:
    "Search the user's projects by name or address. Returns matching projects with basic info.",
  input_schema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description:
          'Search term to match against project name or address',
      },
    },
    required: ['query'],
  },
};

export async function execute(
  prisma: PrismaClient,
  userId: string,
  input: Record<string, unknown>,
): Promise<ToolResult> {
  const query = input.query as string;
  const p = prisma as any;

  const projects = await p.project.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { projectManagers: { some: { userId } } },
      ],
      AND: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { address: { contains: query, mode: 'insensitive' } },
        ],
      },
    },
    select: {
      id: true,
      name: true,
      address: true,
      status: true,
      currentPhase: true,
      budget: true,
    },
    take: 10,
    orderBy: { updatedAt: 'desc' },
  });

  if (projects.length === 0) {
    return { content: `No projects found matching "${query}".` };
  }

  const lines: string[] = [
    `**Projects matching "${query}" (${projects.length}):**`,
  ];
  for (const proj of projects) {
    lines.push(
      `- **${proj.name || 'Untitled'}** (${proj.status})${proj.address ? ` — ${proj.address}` : ''}${proj.budget ? ` — Budget: $${Number(proj.budget).toLocaleString()}` : ''}`,
      `  ID: ${proj.id}`,
    );
  }

  return {
    content: lines.join('\n'),
    sources: projects.map((pr: any) => ({
      type: 'project' as const,
      id: pr.id,
      label: pr.name || 'Project',
    })),
  };
}
