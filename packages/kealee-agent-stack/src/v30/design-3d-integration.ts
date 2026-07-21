/**
 * DesignBot + 3D Model Integration Layer
 *
 * After DesignBot generates concepts, automatically submit 3D generation jobs
 * for Premium+ customers. This file handles:
 * - Tier detection
 * - 3D job orchestration
 * - Webhook payload storage for async completion
 * - Portal display readiness checks
 */

import { get3DModelStatus, is3DAvailable } from '../ai-3d'
import { orchestrateDesign3DGeneration, type Design3DOrchestrationInput } from './design-3d-orchestrator'
import type { V30DesignBotOutput, V30DesignConcept } from './types'

export interface DesignWith3DIntegrationInput {
  projectId: string
  tier: number
  projectType: string
  designOutput: V30DesignBotOutput
  propertyContext: Record<string, any>
  intake?: Record<string, any>
}

export interface DesignWith3DIntegrationOutput {
  designOutput: V30DesignBotOutput
  threeD?: {
    available: boolean
    submittedAt?: string
    jobCount?: number
    estimatedReadyIn?: string
    webhookSecret?: string
  }
}

/**
 * Post-process DesignBot output: submit 3D jobs if tier supports it.
 * Called immediately after DesignBot completes.
 *
 * Non-blocking: returns immediately, 3D models generate in background.
 */
export async function integrateDesignWith3D(
  input: DesignWith3DIntegrationInput,
): Promise<DesignWith3DIntegrationOutput> {
  // Check if 3D is available for this tier
  if (!is3DAvailable(input.tier)) {
    return {
      designOutput: input.designOutput,
      threeD: {
        available: false,
      },
    }
  }

  try {
    // Submit 3D generation jobs for all concepts
    const orchestrationResult = await orchestrateDesign3DGeneration({
      projectId: input.projectId,
      tier: input.tier,
      projectType: input.projectType,
      designOutput: input.designOutput,
      propertyContext: input.propertyContext,
    })

    // Augment design output with 3D job info
    const enhancedOutput = enhanceDesignOutputWith3D(input.designOutput, orchestrationResult)

    return {
      designOutput: enhancedOutput,
      threeD: {
        available: true,
        submittedAt: orchestrationResult.submittedAt,
        jobCount: orchestrationResult.conceptModels.length,
        estimatedReadyIn:
          input.tier >= 3
            ? '5-10 minutes (Premium+ enhanced)'
            : '2-5 minutes (Premium basic)',
        webhookSecret: generateWebhookSecret(input.projectId),
      },
    }
  } catch (err) {
    console.error('[Design3D Integration] Failed to orchestrate 3D generation:', err)
    // Non-fatal: continue with design output, 3D just won't be generated
    return {
      designOutput: input.designOutput,
      threeD: {
        available: false,
      },
    }
  }
}

/**
 * Augment each design concept with 3D job metadata.
 */
function enhanceDesignOutputWith3D(
  designOutput: V30DesignBotOutput,
  orchestrationResult: any,
): V30DesignBotOutput {
  type ConceptModelJob = {
    conceptId: string
    provider: string
    jobId: string
    status: 'queued' | 'processing'
  }
  const jobs = orchestrationResult.conceptModels as ConceptModelJob[]
  const jobMap = new Map<string, ConceptModelJob>(jobs.map(job => [job.conceptId, job]))

  const enhancedConcepts = designOutput.concepts.map((concept: V30DesignConcept) => {
    const job = jobMap.get(concept.id)
    if (job) {
      return {
        ...concept,
        threeDModels: {
          provider: job.provider,
          jobId: job.jobId,
          status: job.status,
          generatedAt: new Date().toISOString(),
        },
      }
    }
    return concept
  })

  return {
    ...designOutput,
    concepts: enhancedConcepts,
  }
}

/**
 * Generate a webhook secret for verifying Replicate callbacks.
 * In production, this should be stored in a secrets manager.
 */
export function generateWebhookSecret(projectId: string): string {
  // Format: project_id + timestamp + random
  const ts = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `${projectId}_${ts}_${random}`
}

/**
 * Check if a design has all 3D models ready for display.
 * Used by portal to show "3D Ready" badge.
 */
export function isDesign3DReady(designOutput: V30DesignBotOutput): boolean {
  if (!designOutput.concepts) return false

  return designOutput.concepts.every(concept => {
    const models = (concept as any).threeDModels
    return models?.status === 'completed' && models?.modelUrl
  })
}

/**
 * Get the 3D model URL for a specific concept.
 * Returns undefined if model is not ready yet.
 */
export function getDesignConcept3DUrl(concept: V30DesignConcept, format: 'glb' | 'usdz' | 'preview' = 'glb'): string | undefined {
  const models = (concept as any).threeDModels
  if (!models || models.status !== 'completed') {
    return undefined
  }

  switch (format) {
    case 'glb':
      return models.modelUrl
    case 'usdz':
      return models.usdzUrl
    case 'preview':
      return models.previewUrl
    default:
      return models.modelUrl
  }
}

/**
 * Poll 3D model status for a design.
 * Called by portal client (e.g., every 10 seconds while "Generating..." badge shows).
 */
export async function pollDesign3DStatus(designOutput: V30DesignBotOutput) {
  const results = await Promise.allSettled(
    designOutput.concepts.map(async concept => {
      const models = (concept as any).threeDModels
      if (!models || !models.jobId) return null

      try {
        const status = await get3DModelStatus(models.provider, models.jobId, models.quality || 'basic')
        return {
          conceptId: concept.id,
          status,
        }
      } catch (err) {
        console.error(`[Design3D Poll] Failed to check status for ${concept.id}:`, err)
        return null
      }
    }),
  )

  return results
    .map(r => (r.status === 'fulfilled' ? r.value : null))
    .filter(Boolean)
}

/**
 * Update a design concept with completed 3D model URLs.
 * Called by webhook handler when Replicate job completes.
 */
export function updateConcept3DUrls(
  concept: V30DesignConcept,
  modelUrl: string,
  previewUrl?: string,
  usdzUrl?: string,
): V30DesignConcept {
  const updated = { ...concept }
  const models = (updated as any).threeDModels || {}

  return {
    ...updated,
    threeDModels: {
      ...models,
      modelUrl,
      previewUrl: previewUrl || models.previewUrl,
      usdzUrl: usdzUrl || models.usdzUrl,
      status: 'completed',
      completedAt: new Date().toISOString(),
    } as any,
  }
}
