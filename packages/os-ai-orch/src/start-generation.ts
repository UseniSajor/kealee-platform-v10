import { Prisma, prisma } from '@kealee/database'
import {
  getV30Bot,
  type V30BotExecutionInput,
  type V30BotExecutionResult,
  type V30BotType,
} from '@kealee/kealee-agent-stack'
import { botTypesForPackageFeatures } from './feature-bots'
import { executeV30BotForOrch } from './execute-v30-bot'
import { syncV30DesignConceptToProject } from './sync-design-concept'
import { enqueueV30BotJobs } from './bot-queue'

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

/** Execute every bot through the canonical v30 executor and parser. */
async function executeDesignBotOrOrch(
  input: V30BotExecutionInput,
): Promise<V30BotExecutionResult> {
  return executeV30BotForOrch(input)
}

/**
 * Create V30BotExecution rows and run KeaBot v3.0 parallel generation (zip2 os-ai-orch).
 */
/**
 * Runs ONE bot execution to completion and persists its result.
 *
 * This is the unit the worker drains. It lives here rather than in the worker
 * because executeDesignBotOrOrch and persistExecutionResult are the canonical
 * paths for dispatching and recording a bot, and a second copy in the worker
 * would drift from them.
 *
 * Throws on a retryable failure so the caller can requeue; a bot that ran and
 * reported FAILED is recorded and NOT thrown, because re-running a bot that
 * produced a deterministic bad answer just spends money to get it again.
 */
export async function runV30BotExecution(executionId: string): Promise<{
  botType: string
  status: 'COMPLETE' | 'FAILED'
}> {
  const exec = await prisma.v30BotExecution.findUnique({
    where: { id: executionId },
    select: {
      id: true, projectId: true, packageId: true, botType: true,
      status: true, inputData: true,
    },
  })
  if (!exec) throw new Error(`v30BotExecution ${executionId} not found`)

  // Already terminal: a redelivered job must not re-run finished work.
  if (exec.status === 'COMPLETE' || exec.status === 'FAILED') {
    return { botType: exec.botType, status: exec.status as 'COMPLETE' | 'FAILED' }
  }

  await prisma.v30BotExecution.update({
    where: { id: executionId },
    data: { status: 'EXECUTING' },
  })

  const result = await executeDesignBotOrOrch({
    botType: exec.botType as V30BotType,
    projectId: exec.projectId,
    packageId: exec.packageId,
    inputData: (exec.inputData ?? {}) as Record<string, unknown>,
  })

  await persistExecutionResult(executionId, result)

  if (exec.botType === 'design' && result.status === 'COMPLETE') {
    await syncV30DesignConceptToProject(exec.projectId, result)
  }

  return {
    botType: exec.botType,
    status: result.status === 'COMPLETE' ? 'COMPLETE' : 'FAILED',
  }
}

/**
 * Closes out a package once every bot for it is terminal.
 *
 * Under the old fire-and-forget design this ran in a single `.then()` after
 * Promise.all. With bots draining independently, whichever bot finishes last
 * has to do it, so this is safe to call after every execution — it is a no-op
 * while any bot is still PENDING or EXECUTING.
 */
export async function finalizeV30PackageIfComplete(input: {
  projectId: string
  packageId: string
}): Promise<{ finalized: boolean; failedCount: number; total: number }> {
  const executions = await prisma.v30BotExecution.findMany({
    where: { projectId: input.projectId, packageId: input.packageId },
    select: { status: true, outputData: true },
  })

  const total = executions.length
  const terminal = executions.filter(
    e => e.status === 'COMPLETE' || e.status === 'FAILED',
  )
  if (total === 0 || terminal.length < total) {
    return { finalized: false, failedCount: 0, total }
  }

  const failed = terminal.filter(e => e.status === 'FAILED')
  const failedCount = failed.length
  // A bot the model-free engine handed to a person (requiresHumanFulfillment)
  // is waiting on staff, not broken: the order reads IN_REVIEW, the platform's
  // status for "a person is on it". Only a genuine failure reads FAILED.
  const staffOnly = failedCount > 0 && failed.every(e =>
    Boolean((e.outputData as Record<string, unknown> | null)?.requiresHumanFulfillment))

  await prisma.project.update({
    where: { id: input.projectId },
    data: { status: failedCount === 0 ? 'DELIVERED' : staffOnly ? 'IN_REVIEW' : 'FAILED' },
  })

  if (failedCount === 0) {
    await prisma.v30CustomPackage.update({
      where: { id: input.packageId },
      data: { status: 'COMPLETE', completedAt: new Date() },
    })
  }

  return { finalized: true, failedCount, total }
}

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
    data: { status: 'GENERATING' },
  })

  const project = await prisma.project.findUnique({
    where: { id: input.projectId },
    select: { categoryMetadata: true },
  })
  const meta = (project?.categoryMetadata as Record<string, unknown> | null) ?? {}

  const sharedInput = {
    projectId: input.projectId,
    packageId: input.packageId,
    intake: pkg.intakeResponse,
    features: pkg.features,
    lotContext: meta.v30LotContext ?? input.sharedInput?.lotContext,
    projectPath: (input.sharedInput?.projectPath as string) ?? undefined,
    ...(input.sharedInput ?? {}),
  }

  // Persist the resolved shared input onto each execution row before queueing.
  // The worker rehydrates from the row, so everything a bot needs has to be
  // durable — a payload held only in this process would die with it.
  await prisma.v30BotExecution.updateMany({
    where: { id: { in: Object.values(executionIds) } },
    data: { inputData: sharedInput as Prisma.InputJsonValue },
  })

  // Record intent in JobQueue rather than running the bots here. The previous
  // `void runV30ParallelGeneration(...)` executed every bot in this process:
  // an API restart killed them with no resume, a failure was terminal until a
  // human retried, and the work competed with HTTP request handling. Draining
  // from the worker gives restart-safety, retry with backoff, and a bounded
  // number of concurrent Claude calls.
  await enqueueV30BotJobs({
    projectId: input.projectId,
    packageId: input.packageId,
    executionIds,
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
