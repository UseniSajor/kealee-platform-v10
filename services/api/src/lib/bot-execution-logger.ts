/**
 * Bot Execution Logger
 * Creates and updates BotRun records in the database
 * For use in API routes and synchronous contexts
 */

import { prismaAny } from '../utils/prisma-helper'

export interface BotRunOptions {
  botName: string
  botVersion?: string
  agentType?: string
  sourceType?: string // "intake", "project", "job_queue", "webhook", "manual", etc.
  sourceId?: string
  triggeredBy?: string // User ID or service name
  projectId?: string
  estimateId?: string
  metadata?: Record<string, any>
  tags?: string[]
}

/**
 * Create a BotRun record when a bot starts execution
 */
export async function createBotRun(options: BotRunOptions): Promise<string> {
  try {
    const run = await prismaAny.botRun.create({
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
  try {
    // Create BotRunOutput record
    await prismaAny.botRunOutput.create({
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
    await prismaAny.botRun.update({
      where: { id: botRunId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        durationMs: options.durationMs,
        outputId: botRunId, // Link to output
      },
    })
  } catch (err: any) {
    console.error('Failed to complete BotRun:', err?.message)
    throw err
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
  try {
    // Create BotRunError record
    await prismaAny.botRunError.create({
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
    await prismaAny.botRun.update({
      where: { id: botRunId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        errorId: botRunId, // Link to error
      },
    })
  } catch (err: any) {
    console.error('Failed to fail BotRun:', err?.message)
    throw err
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
  try {
    await prismaAny.botRunInput.create({
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
  }
}
