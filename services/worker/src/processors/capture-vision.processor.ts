/**
 * Capture Vision Processor
 *
 * Processes analyze_capture_asset jobs using Claude Vision API.
 * Also exports pollAndAnalyzePending() used by the cron job.
 */

import { Worker, Job } from 'bullmq'
import Anthropic from '@anthropic-ai/sdk'
import https from 'https'
import http from 'http'
import { redis } from '../config/redis.config'
import type { CaptureAnalysisJobData } from '../queues/capture-analysis.queue'

// ---------------------------------------------------------------------------
// Anthropic client
// ---------------------------------------------------------------------------

const anthropicApiKey = process.env.ANTHROPIC_API_KEY
let anthropic: Anthropic | null = null

if (anthropicApiKey) {
  anthropic = new Anthropic({ apiKey: anthropicApiKey })
} else {
  console.warn('[capture-vision] ANTHROPIC_API_KEY not set. Vision analysis will be skipped.')
}

const VISION_MODEL = 'claude-sonnet-4-6'

// ---------------------------------------------------------------------------
// Vision prompt
// ---------------------------------------------------------------------------

const VISION_SYSTEM_PROMPT = `You are analyzing a construction/home interior or exterior photo for a project pre-design intake.
Analyze the image and return ONLY valid JSON with no markdown wrapping.

Return:
{
  "room_type": "kitchen|bathroom|living_room|bedroom|exterior_front|exterior_rear|exterior_side|roof|hvac|electrical|plumbing|basement|garage|other",
  "detected_elements": ["list of visible elements"],
  "materials": ["materials visible"],
  "condition": "good|outdated|damaged|unknown",
  "potential_issues": ["any visible issues"],
  "ai_label": "Short 3-5 word label",
  "ai_description": "One or two sentence objective description.",
  "ai_tags": ["tag1", "tag2", "tag3"],
  "confidence": 0.85
}`

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VisionResult {
  room_type: string
  detected_elements: string[]
  materials: string[]
  condition: 'good' | 'outdated' | 'damaged' | 'unknown'
  potential_issues: string[]
  ai_label: string
  ai_description: string
  ai_tags: string[]
  confidence: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchImageAsBase64(url: string): Promise<{ base64: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http
    protocol.get(url, (res) => {
      const chunks: Buffer[] = []
      res.on('data', (chunk: Buffer) => chunks.push(chunk))
      res.on('end', () => {
        const buffer = Buffer.concat(chunks)
        const contentType = res.headers['content-type'] || 'image/jpeg'
        const mediaType = contentType.includes('png')
          ? 'image/png'
          : contentType.includes('gif')
          ? 'image/gif'
          : contentType.includes('webp')
          ? 'image/webp'
          : 'image/jpeg'
        resolve({ base64: buffer.toString('base64'), mediaType })
      })
      res.on('error', reject)
    }).on('error', reject)
  })
}

function extractJson(raw: string): VisionResult | null {
  try {
    return JSON.parse(raw) as VisionResult
  } catch {
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) {
      try { return JSON.parse(match[0]) as VisionResult } catch { return null }
    }
    return null
  }
}

function fallbackResult(rawText: string): VisionResult {
  return {
    room_type: 'other',
    detected_elements: [],
    materials: [],
    condition: 'unknown',
    potential_issues: [],
    ai_label: 'Unanalyzed photo',
    ai_description: rawText.slice(0, 200),
    ai_tags: [],
    confidence: 0,
  }
}

// ---------------------------------------------------------------------------
// Core analysis
// ---------------------------------------------------------------------------

async function analyzeAsset(job: Job<CaptureAnalysisJobData>): Promise<void> {
  const { assetId, storageUrl, zone } = job.data

  if (!assetId || !storageUrl) {
    throw new Error('[capture-vision] assetId and storageUrl are required')
  }

  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient() as any

  try {
    // Idempotency check
    const existing = await prisma.$queryRaw`
      SELECT ai_label FROM capture_assets WHERE id = ${assetId} LIMIT 1
    ` as Array<{ ai_label: string | null }>

    if (existing.length > 0 && existing[0].ai_label !== null) {
      console.log(`[capture-vision] Asset ${assetId} already analyzed — skipping`)
      return
    }

    if (!anthropic) {
      await prisma.$executeRaw`
        UPDATE capture_assets SET ai_label = 'skipped', ai_analyzed_at = NOW() WHERE id = ${assetId}
      `
      return
    }

    await job.updateProgress(10)

    const { base64, mediaType } = await fetchImageAsBase64(storageUrl)
    await job.updateProgress(30)

    const response = await anthropic.messages.create({
      model: VISION_MODEL,
      max_tokens: 1024,
      system: VISION_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: base64,
              },
            },
            {
              type: 'text',
              text: `Analyze this ${zone ?? 'unknown zone'} photo from a construction/home capture session.`,
            },
          ],
        },
      ],
    })

    await job.updateProgress(70)

    const rawText = response.content[0]?.type === 'text' ? response.content[0].text : ''
    const result = extractJson(rawText) ?? fallbackResult(rawText)

    await prisma.$executeRaw`
      UPDATE capture_assets SET
        ai_label             = ${result.ai_label},
        ai_description       = ${result.ai_description},
        ai_tags              = ${JSON.stringify(result.ai_tags)}::jsonb,
        ai_condition         = ${result.condition},
        ai_room_type         = ${result.room_type},
        ai_detected_elements = ${JSON.stringify(result.detected_elements)}::jsonb,
        ai_potential_issues  = ${JSON.stringify(result.potential_issues)}::jsonb,
        ai_confidence        = ${result.confidence},
        ai_analyzed_at       = NOW()
      WHERE id = ${assetId}
    `

    await job.updateProgress(100)
    console.log(`[Event] capture.asset.analyzed assetId=${assetId} label="${result.ai_label}" confidence=${result.confidence}`)
  } finally {
    await prisma.$disconnect()
  }
}

// ---------------------------------------------------------------------------
// Poll for pending (called by cron)
// ---------------------------------------------------------------------------

export async function pollAndAnalyzePending(): Promise<void> {
  const { captureAnalysisQueue } = await import('../queues/capture-analysis.queue')
  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient() as any

  try {
    const pending = await prisma.$queryRaw`
      SELECT id, storage_url, zone, mime_type, capture_session_id
      FROM capture_assets
      WHERE ai_label IS NULL
        AND mime_type LIKE 'image/%'
        AND created_at > NOW() - INTERVAL '7 days'
      ORDER BY created_at DESC
      LIMIT 20
    ` as Array<{ id: string; storage_url: string; zone: string; mime_type: string; capture_session_id: string }>

    if (pending.length === 0) return
    console.log(`[capture-vision] Poll found ${pending.length} pending asset(s)`)

    for (const asset of pending) {
      try {
        await captureAnalysisQueue.analyzeAsset({
          assetId: asset.id,
          storageUrl: asset.storage_url,
          zone: asset.zone,
          mimeType: asset.mime_type,
          captureSessionId: asset.capture_session_id,
        })
      } catch (err: any) {
        if (!err?.message?.includes('already exists')) {
          console.warn(`[capture-vision] Failed to enqueue asset ${asset.id}:`, err.message)
        }
      }
    }
  } finally {
    await prisma.$disconnect()
  }
}

// ---------------------------------------------------------------------------
// Worker factory
// ---------------------------------------------------------------------------

export function createCaptureVisionWorker(): Worker<CaptureAnalysisJobData> {
  const worker = new Worker<CaptureAnalysisJobData>(
    'capture-analysis',
    async (job) => {
      if (job.data.jobType !== 'analyze_capture_asset') return
      await analyzeAsset(job)
    },
    {
      connection: redis,
      concurrency: 5,
      limiter: { max: 20, duration: 60000 },
    },
  )

  worker.on('completed', (job) => {
    console.log(`[capture-vision] Job ${job.id} (${job.data.assetId}) completed`)
  })
  worker.on('failed', (job, err) => {
    console.error(`[capture-vision] Job ${job?.id} failed:`, err.message)
  })
  worker.on('error', (err) => {
    console.error('[capture-vision] Worker error:', err)
  })

  return worker
}
