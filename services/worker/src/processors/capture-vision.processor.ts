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
import { transcribeVoiceNote } from './voice-transcription.processor'
import { supabaseRest } from '../lib/supabase-rest'

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

export async function analyzeAsset(job: Job<CaptureAnalysisJobData>): Promise<void> {
  const { assetId, storageUrl, zone } = job.data

  if (!assetId || !storageUrl) {
    throw new Error('[capture-vision] assetId and storageUrl are required')
  }

  // Capture data is written by web-main to Supabase, not the Prisma/Railway DB.
  const existing = await supabaseRest<Array<{ ai_label: string | null }>>(
    `capture_assets?id=eq.${encodeURIComponent(assetId)}&select=ai_label&limit=1`,
  )

    if (existing.length > 0 && existing[0].ai_label !== null) {
      console.log(`[capture-vision] Asset ${assetId} already analyzed — skipping`)
      return
    }

    if (!anthropic) {
      await supabaseRest(`capture_assets?id=eq.${encodeURIComponent(assetId)}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ ai_label: 'skipped', ai_analyzed_at: new Date().toISOString() }),
      })
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

    await supabaseRest(`capture_assets?id=eq.${encodeURIComponent(assetId)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        ai_label: result.ai_label,
        ai_description: result.ai_description,
        ai_tags: result.ai_tags,
        ai_condition: result.condition,
        ai_room_type: result.room_type,
        ai_detected_elements: result.detected_elements,
        ai_potential_issues: result.potential_issues,
        ai_confidence: result.confidence,
        ai_analyzed_at: new Date().toISOString(),
      }),
    })

    await job.updateProgress(100)
    console.log(`[Event] capture.asset.analyzed assetId=${assetId} label="${result.ai_label}" confidence=${result.confidence}`)
}

// ---------------------------------------------------------------------------
// Poll for pending (called by cron)
// ---------------------------------------------------------------------------

export async function pollAndAnalyzePending(): Promise<void> {
  const { captureAnalysisQueue } = await import('../queues/capture-analysis.queue')
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const pending = await supabaseRest<Array<{ id: string; storage_url: string; zone: string; mime_type: string; capture_session_id: string }>>(
    `capture_assets?ai_label=is.null&mime_type=like.image%2F*&created_at=gt.${encodeURIComponent(cutoff)}&select=id,storage_url,zone,mime_type,capture_session_id&order=created_at.desc&limit=20`,
  )

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
}

// ---------------------------------------------------------------------------
// Worker factory
// ---------------------------------------------------------------------------

export function createCaptureVisionWorker(): Worker<CaptureAnalysisJobData> {
  const worker = new Worker<CaptureAnalysisJobData>(
    'capture-analysis',
    async (job) => {
      if (job.data.jobType === 'transcribe_voice_note') {
        await transcribeVoiceNote(job)
        return
      }
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
