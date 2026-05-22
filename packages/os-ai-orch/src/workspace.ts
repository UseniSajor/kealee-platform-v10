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

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { categoryMetadata: true, v30Status: true },
  })
  const meta = (project?.categoryMetadata as Record<string, unknown> | null) ?? {}

  return {
    projectId,
    intake,
    package: pkg,
    v30ConceptOutput: meta.v30ConceptOutput ?? null,
    v30DesignBot: meta.v30DesignBot ?? null,
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
