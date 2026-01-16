/**
 * ML Prediction Processor
 * Handles BullMQ jobs for ML predictions
 */

import { Worker, Job } from 'bullmq'
import { redis } from '../config/redis.config'
import { mlPredictionEngine } from '../jobs/ml-predictions'
import type { MLPredictionJobData, MLPredictionJobResult } from '../types/ml-prediction.types'

/**
 * Process ML prediction job
 */
async function processMLPredictionJob(
  job: Job<MLPredictionJobData>
): Promise<MLPredictionJobResult> {
  const { type, projectId, phase, options, metadata } = job.data

  try {
    console.log(`🔮 Processing ML prediction: ${type} for project ${projectId}`)

    let result: MLPredictionJobResult

    switch (type) {
      case 'TIMELINE_RISK': {
        const predictions = await mlPredictionEngine.predictTimelineRisks(projectId)

        // Calculate overall risk
        const riskScores = predictions.map((p) => {
          const severityScores = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 }
          return severityScores[p.severity] * p.probability
        })
        const avgRiskScore = riskScores.reduce((a, b) => a + b, 0) / (riskScores.length || 1)

        const overallRisk =
          avgRiskScore >= 3 ? 'CRITICAL' : avgRiskScore >= 2 ? 'HIGH' : avgRiskScore >= 1 ? 'MEDIUM' : 'LOW'

        // Calculate predicted end date
        const maxDelay = Math.max(...predictions.map((p) => p.estimatedImpact.daysDelay || 0), 0)
        const predictedEndDate = new Date()
        predictedEndDate.setDate(predictedEndDate.getDate() + maxDelay)

        result = {
          success: true,
          type: 'TIMELINE_RISK',
          projectId,
          data: {
            projectId,
            analyzedAt: new Date(),
            overallRisk,
            riskScore: Math.round(avgRiskScore * 25), // Convert to 0-100 scale
            predictions,
            timelineProjection: {
              predictedEndDate,
              confidence: predictions.reduce((a, b) => a + b.confidence, 0) / (predictions.length || 1),
              factors: predictions.flatMap((p) => p.factors),
            },
            recommendations: predictions.flatMap((p) =>
              p.mitigationSuggestions.map((s) => s.action)
            ),
          },
          processedAt: new Date(),
        }
        break
      }

      case 'RESOURCE_ALLOCATION': {
        if (!phase) {
          throw new Error('Phase is required for resource allocation')
        }

        const suggestions = await mlPredictionEngine.suggestResources(projectId, phase)

        // Calculate optimization score
        const avgConfidence = suggestions.reduce((a, b) => a + b.confidence, 0) / (suggestions.length || 1)
        const optimizationScore = Math.round(avgConfidence * 100)

        // Calculate estimated cost
        const estimatedCost = suggestions.reduce((sum, s) => sum + (s.cost?.estimated || 0), 0)

        // Calculate estimated timeline
        const maxDuration = Math.max(...suggestions.map((s) => s.timing.estimatedDuration), 0)

        // Identify gaps
        const gaps: Array<{ resourceType: string; description: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' }> = []
        const resourceTypes = new Set(suggestions.map((s) => s.resourceType))
        if (!resourceTypes.has('CONTRACTOR')) {
          gaps.push({
            resourceType: 'CONTRACTOR',
            description: 'No contractor suggestions available',
            severity: 'HIGH',
          })
        }

        result = {
          success: true,
          type: 'RESOURCE_ALLOCATION',
          projectId,
          data: {
            projectId,
            phase,
            analyzedAt: new Date(),
            suggestions,
            optimizationScore,
            estimatedCost,
            estimatedTimeline: maxDuration,
            gaps,
          },
          processedAt: new Date(),
        }
        break
      }

      default:
        throw new Error(`Unknown prediction type: ${type}`)
    }

    console.log(`✅ ML prediction completed: ${type} for project ${projectId}`)
    return result
  } catch (error: any) {
    console.error(`❌ ML prediction failed: ${type} for project ${projectId}`, error)
    return {
      success: false,
      type,
      projectId,
      error: error.message || 'Unknown error',
      processedAt: new Date(),
    }
  }
}

/**
 * Create ML prediction worker
 */
export function createMLPredictionWorker() {
  return new Worker<MLPredictionJobData, MLPredictionJobResult>(
    'ml-predictions',
    async (job) => {
      return processMLPredictionJob(job)
    },
    {
      connection: redis,
      concurrency: 3, // Process 3 prediction jobs concurrently
      limiter: {
        max: 10, // Max 10 jobs
        duration: 60000, // Per minute (Claude API rate limits)
      },
    }
  )
}
