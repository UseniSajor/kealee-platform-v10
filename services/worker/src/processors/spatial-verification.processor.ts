import { Worker, Job } from 'bullmq'
import Anthropic from '@anthropic-ai/sdk'
import { redis } from '../config/redis.config'
import { SpatialVerificationJobData } from '../queues/spatial-verification.queue'

// Initialize Anthropic client
const anthropicApiKey = process.env.ANTHROPIC_API_KEY
let anthropic: Anthropic | null = null
if (anthropicApiKey) {
  anthropic = new Anthropic({ apiKey: anthropicApiKey })
} else {
  console.warn('ANTHROPIC_API_KEY not set. Spatial AI verification will use fallback scoring.')
}

// Configurable model via env var
const AI_MODEL = process.env.SPATIAL_AI_MODEL || 'claude-sonnet-4-20250514'
const AUTO_PASS_THRESHOLD = 85

/**
 * Run AI verification via Claude API with retry logic
 */
async function runAIVerification(
  job: Job<SpatialVerificationJobData>
): Promise<{ score: number; findings: any }> {
  const {
    milestoneName,
    milestoneDescription,
    scanType,
    scanCoverage,
    scanPointCount,
    scanProcessingNotes,
  } = job.data

  if (!anthropic) {
    // Fallback when no API key — returns neutral score requiring manual review
    console.log(`Spatial verification ${job.id}: No API key, using fallback`)
    return {
      score: 75,
      findings: {
        note: 'AI analysis unavailable — manual review required',
        fallback: true,
        timestamp: new Date().toISOString(),
      },
    }
  }

  const prompt = `You are an expert construction inspector verifying milestone completion.

Milestone: ${milestoneName}
Description: ${milestoneDescription || 'N/A'}

Scan Data:
- Type: ${scanType}
- Coverage: ${scanCoverage ?? 'N/A'}%
- Point Count: ${scanPointCount ?? 'N/A'}
- Processing Notes: ${scanProcessingNotes || 'N/A'}

Based on the spatial scan data and expected deliverables, provide your assessment as JSON with these fields:
- completionPercentage: number 0-100
- quality: "excellent" | "good" | "acceptable" | "poor"
- issues: string[] (list of concerns, empty if none)
- compliance: { dimensionsMatch: boolean, materialsVerified: boolean, workmanshipQuality: string }
- recommendation: "PASS" | "NEEDS_REVIEW" | "FAIL"

Respond ONLY with valid JSON, no markdown or explanation.`

  // Retry logic: 3 attempts with exponential backoff
  let lastError: Error | null = null
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const startTime = Date.now()

      const response = await anthropic.messages.create({
        model: AI_MODEL,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      })

      const duration = Date.now() - startTime
      console.log(`Spatial verification ${job.id}: AI call completed in ${duration}ms (attempt ${attempt})`)

      const content = response.content[0]
      if (content.type === 'text') {
        try {
          const analysis = JSON.parse(content.text)
          return {
            score: analysis.completionPercentage ?? 85,
            findings: {
              quality: analysis.quality ?? 'good',
              issues: analysis.issues ?? [],
              compliance: analysis.compliance ?? {},
              recommendation: analysis.recommendation ?? 'PASS',
              aiModel: AI_MODEL,
              durationMs: duration,
              timestamp: new Date().toISOString(),
            },
          }
        } catch (parseErr) {
          // JSON parse failed — still return the raw text as findings
          console.warn(`Spatial verification ${job.id}: JSON parse failed, using raw response`)
          return {
            score: 80,
            findings: {
              rawResponse: content.text,
              parseError: true,
              aiModel: AI_MODEL,
              timestamp: new Date().toISOString(),
            },
          }
        }
      }

      // Non-text response
      return {
        score: 80,
        findings: {
          note: 'AI returned non-text response',
          aiModel: AI_MODEL,
          timestamp: new Date().toISOString(),
        },
      }
    } catch (error: any) {
      lastError = error
      console.error(`Spatial verification ${job.id}: AI call attempt ${attempt} failed:`, error.message)

      if (attempt < 3) {
        const delay = Math.pow(2, attempt) * 1000 // 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  // All retries exhausted
  console.error(`Spatial verification ${job.id}: All AI attempts failed`)
  return {
    score: 75,
    findings: {
      error: 'AI analysis failed after 3 attempts — manual review required',
      details: lastError?.message,
      timestamp: new Date().toISOString(),
    },
  }
}

/**
 * Process spatial verification job
 */
async function processSpatialVerification(job: Job<SpatialVerificationJobData>) {
  const { verificationId } = job.data

  console.log(`Processing spatial verification: ${verificationId}`)

  // Dynamic import to avoid circular dependency with database package
  const { prisma } = await import('@kealee/database')
  const prismaAny = prisma as any

  // Mark verification as in-progress
  await prismaAny.spatialVerification.update({
    where: { id: verificationId },
    data: { status: 'IN_PROGRESS' },
  })

  // Run AI verification
  const { score, findings } = await runAIVerification(job)

  // Determine status based on score
  const status = score >= AUTO_PASS_THRESHOLD ? 'PASSED' : 'NEEDS_REVIEW'

  // Update verification record
  const verification = await prismaAny.spatialVerification.update({
    where: { id: verificationId },
    data: {
      aiScore: score,
      aiNotes: findings,
      status,
      manualReview: score < AUTO_PASS_THRESHOLD,
      verifiedAt: new Date(),
    },
  })

  console.log(
    `Spatial verification ${verificationId}: score=${score}, status=${status}`
  )

  return {
    verificationId,
    score,
    status,
    findings,
  }
}

/**
 * Create the spatial verification worker
 */
export function createSpatialVerificationWorker(): Worker<SpatialVerificationJobData> {
  const worker = new Worker<SpatialVerificationJobData>(
    'spatial-verification',
    async (job) => {
      return processSpatialVerification(job)
    },
    {
      connection: redis,
      concurrency: 3, // Process up to 3 verifications concurrently
    }
  )

  worker.on('completed', (job) => {
    console.log(`Spatial verification job ${job.id} completed`)
  })

  worker.on('failed', (job, err) => {
    console.error(`Spatial verification job ${job?.id} failed:`, err.message)
  })

  worker.on('error', (err) => {
    console.error('Spatial verification worker error:', err)
  })

  return worker
}
