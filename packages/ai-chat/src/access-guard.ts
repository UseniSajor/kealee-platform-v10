import type { PrismaClient } from '@prisma/client';

/**
 * Asserts the user has access to the given project.
 * Checks: project owner OR project manager / membership.
 * Mirrors assertProjectAccess from services/api/src/modules/projects/project.service.ts
 */
export async function assertChatProjectAccess(
  prisma: PrismaClient,
  projectId: string,
  userId: string,
): Promise<void> {
  const p = prisma as any;

  const project = await p.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      ownerId: true,
      projectManagers: { where: { userId }, select: { id: true } },
    },
  });

  if (!project) {
    throw new Error(`Project ${projectId} not found`);
  }

  // Owner always has access
  if (project.ownerId === userId) return;

  // Project manager / membership
  if (project.projectManagers && project.projectManagers.length > 0) return;

  throw new Error('You do not have access to this project');
}

/**
 * Asserts the user is the project owner or a PM (not just a member).
 */
export async function assertChatProjectOwnerOrPM(
  prisma: PrismaClient,
  projectId: string,
  userId: string,
): Promise<void> {
  const p = prisma as any;

  const project = await p.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      ownerId: true,
      pmId: true,
      projectManagers: {
        where: { userId },
        select: { id: true, role: true },
      },
    },
  });

  if (!project) {
    throw new Error(`Project ${projectId} not found`);
  }

  if (project.ownerId === userId) return;
  if (project.pmId === userId) return;
  if (project.projectManagers && project.projectManagers.length > 0) return;

  throw new Error('Only the project owner or PM can perform this action');
}
