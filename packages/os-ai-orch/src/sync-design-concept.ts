import { Prisma, prisma } from '@kealee/database'
import { mapV30DesignToConceptOutput, type V30BotExecutionResult } from '@kealee/kealee-agent-stack'

/**
 * Persist DesignBot output on Project for workspace + concept portal (single DesignBot, no /concept/generate).
 */
export async function syncV30DesignConceptToProject(
  projectId: string,
  designResult: V30BotExecutionResult,
): Promise<void> {
  if (designResult.botType !== 'design' || designResult.status !== 'COMPLETE' || !designResult.outputData) {
    return
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { categoryMetadata: true, category: true, address: true },
  })
  if (!project) return

  const meta = (project.categoryMetadata as Record<string, unknown> | null) ?? {}
  const conceptOutput =
    (designResult.outputData.conceptOutput as Record<string, unknown>) ??
    mapV30DesignToConceptOutput(designResult.outputData, {
      projectPath: project.category ?? undefined,
      location: project.address ?? undefined,
    })

  await prisma.project.update({
    where: { id: projectId },
    data: {
      status: 'DESIGN',
      categoryMetadata: {
        ...meta,
        v30DesignBot: designResult.outputData,
        v30ConceptOutput: conceptOutput,
        v30ConceptSyncedAt: new Date().toISOString(),
      } as Prisma.InputJsonValue,
    },
  })
}
