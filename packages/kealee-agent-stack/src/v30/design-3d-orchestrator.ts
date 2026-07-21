/**
 * Design 3D Model Orchestrator.
 *
 * After DesignBot generates concepts, submit 3D model generation jobs for Premium+ customers.
 * Models are generated asynchronously and stored in the project's design output.
 *
 * Flow:
 * 1. DesignBot outputs 3 concepts with 3D model prompts (Premium+ only)
 * 2. Orchestrator submits each concept's 3D model to Meshy/Tripo3D
 * 3. Returns job IDs immediately (async)
 * 4. Client polls for model URLs via getDesignConceptStatus
 * 5. Once ready, models embedded in portal and homeowner email
 */

import { generate3DModel, get3DModelStatus, qualityForTier, is3DAvailable } from '../ai-3d'
import type { V30DesignConcept, V30DesignBotOutput } from './types'

export interface Design3DOrchestrationInput {
  projectId: string
  tier: number
  projectType: string
  designOutput: V30DesignBotOutput
  propertyContext: Record<string, any>
}

export interface Design3DOrchestrationResult {
  projectId: string
  submittedAt: string
  conceptModels: {
    conceptId: string
    positioning: string
    provider: string
    jobId: string
    status: 'queued' | 'processing'
    estimatedTime: string
  }[]
  totalCost: number
  notes: string
}

/**
 * Submit 3D model generation jobs for each design concept.
 * Premium: basic 3D (1 model per concept)
 * Premium+: enhanced 3D (1 model per concept, with walkthrough if applicable)
 */
export async function orchestrateDesign3DGeneration(
  input: Design3DOrchestrationInput,
): Promise<Design3DOrchestrationResult> {
  // Tier check: only Premium+ (tier >= 2)
  if (!is3DAvailable(input.tier)) {
    return {
      projectId: input.projectId,
      submittedAt: new Date().toISOString(),
      conceptModels: [],
      totalCost: 0,
      notes: `Tier ${input.tier} does not include 3D models (Premium+ required)`,
    }
  }

  const quality = qualityForTier(input.tier)
  const conceptModels = []

  // Submit 3D generation for each design concept
  for (const concept of input.designOutput.concepts) {
    // Only submit if the concept has 3D specifications
    if (!concept.threeD?.modelPrompt) {
      console.warn(`[Design3D] Concept ${concept.id} missing 3D prompt, skipping`)
      continue
    }

    try {
      const result = await generate3DModel({
        prompt: concept.threeD.modelPrompt,
        quality,
        modelType: input.projectType as any,
        referenceImageUrl: concept.imagePrompts?.[0], // Use first image as reference if available
      })

      conceptModels.push({
        conceptId: concept.id,
        positioning: concept.positioning,
        provider: result.provider,
        jobId: result.jobId,
        status: 'queued' as const,
        estimatedTime: quality === 'enhanced' ? '5-10 minutes' : '2-5 minutes',
      })

      // Store job ID in concept for later retrieval
      concept.threeDModels = {
        provider: result.provider,
        jobId: result.jobId,
        status: 'queued',
        generatedAt: new Date().toISOString(),
      }
    } catch (err) {
      console.error(`[Design3D] Failed to submit 3D job for concept ${concept.id}:`, err)
      // Continue with other concepts, but log the error
      conceptModels.push({
        conceptId: concept.id,
        positioning: concept.positioning,
        provider: 'unknown',
        jobId: '',
        status: 'processing' as const,
        estimatedTime: 'failed to submit',
      })
    }
  }

  // Estimated cost: ~$0.05 per model (Meshy/Tripo3D pricing)
  const costPerModel = 0.05
  const totalCost = conceptModels.length * costPerModel

  return {
    projectId: input.projectId,
    submittedAt: new Date().toISOString(),
    conceptModels,
    totalCost,
    notes: `Submitted ${conceptModels.length} 3D models (${quality} quality) for generation. Models will be ready in 2-10 minutes.`,
  }
}

/**
 * Poll status of a 3D model generation job.
 * Returns model URL when complete.
 */
export async function checkDesignConceptModel3DStatus(
  provider: string,
  jobId: string,
  tier: number,
) {
  const quality = qualityForTier(tier)

  const status = await get3DModelStatus(provider as any, jobId, quality)
  return status
}

/**
 * Store 3D model URLs in the design concept output.
 * Called after models are generated and URLs are available.
 */
export function storeDesignConcept3DUrls(
  concept: V30DesignConcept,
  modelUrl: string,
  previewUrl?: string,
  usdzUrl?: string,
) {
  concept.threeDModels = {
    provider: concept.threeDModels?.provider ?? 'unknown',
    jobId: concept.threeDModels?.jobId ?? '',
    ...concept.threeDModels,
    modelUrl,
    previewUrl,
    usdzUrl,
    status: 'completed',
    generatedAt: new Date().toISOString(),
  }

  return concept
}
