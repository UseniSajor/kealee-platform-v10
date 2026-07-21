import type { PrismaClient } from '@prisma/client';
import type { ToolDefinition, ToolResult } from '../types';

export const definition: ToolDefinition = {
  name: 'get_decision_queue',
  description:
    "Get pending decisions that need the user's approval. Shows AI recommendations and confidence scores.",
  input_schema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Optional: filter to a specific project',
      },
    },
    required: [],
  },
};

export async function execute(
  prisma: PrismaClient,
  userId: string,
  input: Record<string, unknown>,
): Promise<ToolResult> {
  const p = prisma as any;

  const userProjects = await p.project.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { projectManagers: { some: { userId } } },
      ],
    },
    select: { id: true, name: true },
  });

  const projectIds = input.projectId
    ? [input.projectId as string]
    : userProjects.map((pr: any) => pr.id);

  if (projectIds.length === 0) {
    return { content: 'You have no projects with pending decisions.' };
  }

  const decisions = await p.decisionLog.findMany({
    where: {
      projectId: { in: projectIds },
      accepted: null,
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  if (decisions.length === 0) {
    return {
      content: "No pending decisions in your queue. You're all caught up!",
    };
  }

  const projectMap = new Map(
    userProjects.map((pr: any) => [pr.id, pr.name]),
  );

  const lines: string[] = [`**Pending Decisions (${decisions.length}):**`];
  for (const d of decisions) {
    const projName = projectMap.get(d.projectId) || 'Unknown Project';
    const confidence = Math.round(Number(d.confidence) * 100);
    lines.push(
      `\n**[${d.type}]** ${projName}`,
      `  Question: ${d.question}`,
      `  AI Recommendation: ${d.recommendation}`,
      `  Confidence: ${confidence}%`,
      `  Created: ${new Date(d.createdAt).toLocaleDateString()}`,
      `  Decision ID: ${d.id}`,
    );
  }

  return {
    content: lines.join('\n'),
    sources: decisions.map((d: any) => ({
      type: 'project' as const,
      id: d.projectId,
      label: `Decision: ${d.type}`,
    })),
  };
}
