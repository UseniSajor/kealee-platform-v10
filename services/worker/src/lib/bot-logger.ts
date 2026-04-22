/**
 * Bot Execution Logger for Worker Service
 * Wraps bot logging with lazy Prisma client initialization
 * For use in BullMQ job processors
 */

async function getPrisma() {
  const { PrismaClient } = await import('@prisma/client')
  return new PrismaClient() as any
}

export interface BotRunOptions {
  botName: string
  botVersion?: string
  agentType?: string
  sourceType?: string
  sourceId?: string
  triggeredBy?: string
  projectId?: string
  estimateId?: string
  metadata?: Record<string, any>
  tags?: string[]
}

/**
 * Create a BotRun record when a bot starts execution
 */
export async function createBotRun(options: BotRunOptions): Promise<string> {
  const prisma = await getPrisma()
  try {
    const run = await prisma.botRun.create({
      data: {
        botName: options.botName,
        botVersion: options.botVersion || '1.0',
        agentType: options.agentType,
        status: 'STARTED',
        sourceType: options.sourceType,
        sourceId: options.sourceId,
        triggeredBy: options.triggeredBy,
        projectId: options.projectId,
        estimateId: options.estimateId,
        metadata: options.metadata,
        tags: options.tags || [],
      },
    })
    return run.id
  } catch (err: any) {
    console.error('Failed to create BotRun:', err?.message)
    throw err
  } finally {
    await prisma.$disconnect()
  }
}

export interface CompleteBotRunOptions {
  output: Record<string, any>
  durationMs?: number
  quality?: 'high' | 'medium' | 'low' | 'review_required'
  confidenceScore?: number
  outputFileUrls?: string[]
}

/**
 * Mark a bot run as COMPLETED with output
 */
export async function completeBotRun(
  botRunId: string,
  options: CompleteBotRunOptions
): Promise<void> {
  const prisma = await getPrisma()
  try {
    // Create BotRunOutput record
    await prisma.botRunOutput.create({
      data: {
        botRunId,
        rawOutput: options.output,
        isComplete: true,
        quality: options.quality,
        confidenceScore: options.confidenceScore,
        outputFileUrls: options.outputFileUrls || [],
        outputFileCount: (options.outputFileUrls || []).length,
      },
    })

    // Update BotRun status
    await prisma.botRun.update({
      where: { id: botRunId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        durationMs: options.durationMs,
        outputId: botRunId,
      },
    })
  } catch (err: any) {
    console.error('Failed to complete BotRun:', err?.message)
    throw err
  } finally {
    await prisma.$disconnect()
  }
}

export interface FailBotRunOptions {
  errorType: string
  errorMessage: string
  errorStack?: string
  errorCode?: string
  isRetryable?: boolean
  recoveryAttempt?: string
}

/**
 * Mark a bot run as FAILED with error details
 */
export async function failBotRun(
  botRunId: string,
  options: FailBotRunOptions
): Promise<void> {
  const prisma = await getPrisma()
  try {
    // Create BotRunError record
    await prisma.botRunError.create({
      data: {
        botRunId,
        errorType: options.errorType,
        errorMessage: options.errorMessage,
        errorStack: options.errorStack,
        errorCode: options.errorCode,
        isRetryable: options.isRetryable ?? true,
        recoveryAttempt: options.recoveryAttempt,
      },
    })

    // Update BotRun status
    await prisma.botRun.update({
      where: { id: botRunId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        errorId: botRunId,
      },
    })
  } catch (err: any) {
    console.error('Failed to fail BotRun:', err?.message)
    throw err
  } finally {
    await prisma.$disconnect()
  }
}

export interface LogBotRunInputOptions {
  rawInput: Record<string, any>
  parsedInput?: Record<string, any>
  isValidated?: boolean
  validationErrors?: string[]
}

/**
 * Log the input that was passed to a bot
 */
export async function logBotRunInput(
  botRunId: string,
  options: LogBotRunInputOptions
): Promise<void> {
  const prisma = await getPrisma()
  try {
    await prisma.botRunInput.create({
      data: {
        botRunId,
        rawInput: options.rawInput,
        parsedInput: options.parsedInput,
        isValidated: options.isValidated ?? false,
        validationErrors: options.validationErrors || [],
      },
    })
  } catch (err: any) {
    console.error('Failed to log BotRunInput:', err?.message)
    // Non-blocking: don't throw
  } finally {
    await prisma.$disconnect()
  }
}
