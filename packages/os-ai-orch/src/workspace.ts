import { prisma } from '@kealee/database'

export async function getV30ProjectWorkspace(projectId: string) {
  const [intake, pkg, executions] = await Promise.all([
    prisma.v30IntakeResponse.findUnique({ where: { projectId } }),
    prisma.v30CustomPackage.findUnique({ where: { projectId } }),
    prisma.v30BotExecution.findMany({
      where: { projectId },
      include: { result: true },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  return {
    projectId,
    intake,
    package: pkg,
    executions: executions.map(e => ({
      id: e.id,
      botType: e.botType,
      status: e.status,
      progress: e.progress,
      outputData: e.outputData,
      modelUsed: e.modelUsed,
      completedAt: e.completedAt,
      result: e.result,
    })),
  }
}
