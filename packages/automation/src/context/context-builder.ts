import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ContextBuilder {
  /**
   * Retrieves read-only supplemental context required by agents.
   * This ensures agents themselves remain stateless and pure.
   */
  async buildContext(projectId: string, triggerEvent: string): Promise<{
    optionalKnowledgeContext: string;
    priorLoopHistory: any[];
  }> {
    // Fetch prior loop history for this project
    const priorLoops = await prisma.loopRun.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // We can inject RAG from Obsidian/Orgo here eventually.
    // For MVP, we return a simple string and loop history.
    const optionalKnowledgeContext = `Project requires adherence to standard municipal zoning laws. No specific legacy RAG entries injected for MVP.`;

    return {
      optionalKnowledgeContext,
      priorLoopHistory: priorLoops.map(run => ({
        id: run.id,
        loopType: run.loopType,
        status: run.status,
        triggerEvent: run.triggerEvent,
        createdAt: run.createdAt,
      })),
    };
  }
}

export const contextBuilder = new ContextBuilder();
