import { Prisma } from '@prisma/client'
import { prisma } from '@kealee/database'
import {
  executeV30BotWithLlm,
  getV30Bot,
  runV30ParallelGeneration,
  shouldUseV30Llm,
  type V30BotExecutionResult,
} from '@kealee/kealee-agent-stack'
import { botTypesForPackageFeatures } from './feature-bots'
import { syncV30DesignConceptToProject } from './sync-design-concept'

export interface StartV30GenerationInput {
  projectId: string
  packageId: string
  sharedInput?: Record<string, unknown>
}

export interface StartV30GenerationResult {
  projectId: string
  packageId: string
  executionIds: Record<string, string>
  estimatedCompletionTime: string
}

async function persistExecutionResult(
  executionId: string,
  result: V30BotExecutionResult,
): Promise<void> {
  const status =
    result.status === 'COMPLETE' ? 'COMPLETE' : result.status === 'FAILED' ? 'FAILED' : 'EXECUTING'

  await prisma.v30BotExecution.update({
    where: { id: executionId },
    data: {
      status,
      progress: result.progress,
      outputData: (result.outputData ?? undefined) as Prisma.InputJsonValue | undefined,
      modelUsed: result.modelUsed,
      tokensUsed: result.tokensUsed,
      costUSD: result.costUSD,
      durationMs: result.durationMs,
      errorMessage: result.errorMessage,
      completedAt: status === 'COMPLETE' || status === 'FAILED' ? new Date() : undefined,
    },
  })

  if (status === 'COMPLETE' && result.outputData) {
    await prisma.v30BotResult.upsert({
      where: { executionId },
      create: {
        executionId,
        resultType: 'json',
        contentJson: result.outputData as Prisma.InputJsonValue,
        deliveredAt: new Date(),
        deliveryMethod: 'api',
      },
      update: {
        contentJson: result.outputData as Prisma.InputJsonValue,
        deliveredAt: new Date(),
      },
    })
  }
}

/**
 * Create V30BotExecution rows and run KeaBot v3.0 parallel generation (zip2 os-ai-orch).
 */
export async function startV30Generation(
  input: StartV30GenerationInput,
): Promise<StartV30GenerationResult> {
  const pkg = await prisma.v30CustomPackage.findUnique({
    where: { id: input.packageId },
    include: { intakeResponse: true },
  })

  if (!pkg || pkg.projectId !== input.projectId) {
    throw new Error('V30 package not found for project')
  }

  const botTypes = botTypesForPackageFeatures(pkg.features)
  const executionIds: Record<string, string> = {}

  for (const botType of botTypes) {
    const exec = await prisma.v30BotExecution.create({
      data: {
        projectId: input.projectId,
        packageId: input.packageId,
        botType,
        status: 'PENDING',
        progress: 0,
        inputData: {
          intake: pkg.intakeResponse,
          features: pkg.features,
          ...(input.sharedInput ?? {}),
        } as Prisma.InputJsonValue,
        modelUsed: getV30Bot(botType).defaultModel,
      },
    })
    executionIds[botType] = exec.id
  }

  await prisma.project.update({
    where: { id: input.projectId },
    data: { v30Status: 'GENERATING' },
  })

  const sharedInput = {
    projectId: input.projectId,
    packageId: input.packageId,
    intake: pkg.intakeResponse,
    features: pkg.features,
    ...(input.sharedInput ?? {}),
  }

  const orchOptions = shouldUseV30Llm()
    ? { botTypes, executeBot: executeV30BotWithLlm }
    : { botTypes }

  void runV30ParallelGeneration(input.projectId, input.packageId, sharedInput, orchOptions)
    .then(async summary => {
      for (const result of summary.executions) {
        const executionId = executionIds[result.botType]
        if (executionId) await persistExecutionResult(executionId, result)
      }

      const designResult = summary.executions.find(e => e.botType === 'design')
      if (designResult) {
        await syncV30DesignConceptToProject(input.projectId, designResult)
      }

      await prisma.project.update({
        where: { id: input.projectId },
        data: { v30Status: summary.failedCount === 0 ? 'DELIVERED' : 'GENERATING' },
      })

      if (summary.failedCount === 0) {
        await prisma.v30CustomPackage.update({
          where: { id: input.packageId },
          data: { status: 'COMPLETE', completedAt: new Date() },
        })
      }
    })
    .catch(async (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Generation failed'
      await prisma.project.update({
        where: { id: input.projectId },
        data: { v30Status: 'FAILED' },
      })
      for (const id of Object.values(executionIds)) {
        await prisma.v30BotExecution.update({
          where: { id },
          data: { status: 'FAILED', errorMessage: message, completedAt: new Date() },
        }).catch(() => undefined)
      }
    })

  return {
    projectId: input.projectId,
    packageId: input.packageId,
    executionIds,
    estimatedCompletionTime: '5–60 minutes depending on features',
  }
}

export interface V30ProjectGenerationStatus {
  projectId: string
  stage: 'generating' | 'complete' | 'failed' | 'idle'
  progress: Record<string, { status: string; progress: number }>
  successCount: number
  failedCount: number
  total: number
}

export async function getV30ProjectGenerationStatus(
  projectId: string,
): Promise<V30ProjectGenerationStatus> {
  const executions = await prisma.v30BotExecution.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' },
  })

  if (!executions.length) {
    return {
      projectId,
      stage: 'idle',
      progress: {},
      successCount: 0,
      failedCount: 0,
      total: 0,
    }
  }

  const progress: Record<string, { status: string; progress: number }> = {}
  let successCount = 0
  let failedCount = 0

  for (const exec of executions) {
    progress[exec.botType] = { status: exec.status, progress: exec.progress }
    if (exec.status === 'COMPLETE') successCount++
    if (exec.status === 'FAILED') failedCount++
  }

  const allComplete = executions.every(e => e.status === 'COMPLETE')
  const anyFailed = executions.some(e => e.status === 'FAILED')
  const stage = anyFailed ? 'failed' : allComplete ? 'complete' : 'generating'

  return {
    projectId,
    stage,
    progress,
    successCount,
    failedCount,
    total: executions.length,
  }
}
