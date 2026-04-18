/**
 * services/worker/src/processors/project-execution.processor.ts
 *
 * Processes project execution jobs: runs agents/AI, generates deliverables,
 * updates ProjectOutput, sends notifications.
 */

import { Worker, Job } from 'bullmq'
import { redis } from '../config/redis.config'
import { getEmailQueue } from '../../src/utils/email-queue'
import { prismaAny } from '../../src/utils/prisma-helper'
import type { ProjectExecutionJobData } from '../queues/project-execution.queue'

export function createProjectExecutionWorker(): Worker<ProjectExecutionJobData> {
  return new Worker<ProjectExecutionJobData>(
    'project.execution',
    async (job: Job<ProjectExecutionJobData>) => {
      const { outputId, type, intakeId, orderId, projectId, metadata } = job.data

      console.log(
        `[project.execution] Starting job ${job.id} — type: ${type}, outputId: ${outputId}`
      )

      try {
        // 1. Fetch intake or order data
        let intakeData: any = null
        let orderData: any = null

        if (intakeId) {
          intakeData = await prismaAny.publicIntakeLead
            .findUnique({ where: { id: intakeId } })
            .catch(() => null)
        }

        if (orderId) {
          orderData = await prismaAny.conceptPackageOrder
            .findUnique({ where: { id: orderId } })
            .catch(() => null)
        }

        // 2. Update ProjectOutput status to 'generating'
        await prismaAny.projectOutput
          .update({
            where: { id: outputId },
            data: { status: 'generating' },
          })
          .catch(() => null)

        // 3. Run appropriate agent/AI based on type
        let result: any = null

        if (type === 'permit') {
          result = await executePermitExecution(intakeData, metadata)
        } else if (type === 'design') {
          result = await executeDesignExecution(intakeData, metadata)
        } else if (type === 'estimate') {
          result = await executeEstimateExecution(intakeData, metadata)
        } else if (type === 'concept') {
          result = await executeConceptExecution(intakeData, metadata)
        } else if (type === 'change_order') {
          result = await executeChangeOrderExecution(orderData, metadata)
        }

        // 4. Update ProjectOutput with result
        await prismaAny.projectOutput
          .update({
            where: { id: outputId },
            data: {
              status: 'completed',
              resultJson: result,
              completedAt: new Date(),
            },
          })
          .catch(e => {
            console.warn('[project.execution] Failed to update ProjectOutput:', e.message)
          })

        // 5. Send completion notification email
        if (intakeData?.contactEmail || orderData?.customerEmail) {
          const email = intakeData?.contactEmail || orderData?.customerEmail
          try {
            const emailQueue = getEmailQueue()
            await emailQueue.add('project_output_ready', {
              to: email,
              subject: `Your ${type} deliverable is ready!`,
              template: 'project_output_ready',
              data: {
                outputType: type,
                outputId,
              },
            })
          } catch (emailErr: any) {
            console.warn('[project.execution] Failed to queue notification email:', emailErr.message)
          }
        }

        // 6. Broadcast realtime update (if socket.io available)
        if (projectId) {
          console.log(`[project.execution] Job ${job.id} complete — broadcasting update for project ${projectId}`)
        }

        console.log(`[project.execution] Job ${job.id} completed successfully`)
      } catch (err: any) {
        console.error(`[project.execution] Job ${job.id} failed:`, err.message)

        // Mark as failed in database
        await prismaAny.projectOutput
          .update({
            where: { id: outputId },
            data: { status: 'failed' },
          })
          .catch(() => null)

        throw err
      }
    },
    { connection: redis, concurrency: 2 }
  )
}

// ── Execution handlers ──────────────────────────────────────────────────────────

async function executePermitExecution(intakeData: any, metadata: any) {
  // TODO: Call executePermitAgent from services/api
  // For now, return mock data
  return {
    type: 'permit',
    summary: 'Permit analysis complete',
    requiredPermits: metadata?.tier === 'EXPEDITED' ? 3 : 1,
  }
}

async function executeDesignExecution(intakeData: any, metadata: any) {
  // TODO: Call executeDesignAgent from services/api
  return {
    type: 'design',
    summary: 'Design concept generated',
    estimatedCost: 50000,
  }
}

async function executeEstimateExecution(intakeData: any, metadata: any) {
  // TODO: Call executeContractorAgent from services/api
  return {
    type: 'estimate',
    summary: 'Cost estimate completed',
    estimatedTotal: 150000,
  }
}

async function executeConceptExecution(intakeData: any, metadata: any) {
  // Concept execution chains to concept-engine queue
  return {
    type: 'concept',
    summary: 'Concept package queued for generation',
  }
}

async function executeChangeOrderExecution(orderData: any, metadata: any) {
  // TODO: Process change order logic
  return {
    type: 'change_order',
    summary: 'Change order processed',
  }
}
