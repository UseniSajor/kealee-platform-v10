/**
 * Voice Transcription Processor
 *
 * Processes transcribe_voice_note jobs.
 * Uses OpenAI Whisper if OPENAI_API_KEY is set, otherwise marks as provider_not_configured.
 * Also exports pollAndTranscribePending() used by the cron job.
 */

import { Worker, Job } from 'bullmq'
import https from 'https'
import http from 'http'
import { redis } from '../config/redis.config'
import type { CaptureAnalysisJobData } from '../queues/capture-analysis.queue'

// ---------------------------------------------------------------------------
// OpenAI client (lazy, optional)
// ---------------------------------------------------------------------------

let openai: any | null = null

async function getOpenAIClient(): Promise<any | null> {
  if (!process.env.OPENAI_API_KEY) return null
  if (openai) return openai
  try {
    const { default: OpenAI } = await import('openai')
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    return openai
  } catch {
    console.warn('[voice-transcription] openai SDK not installed — Whisper unavailable')
    return null
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http
    protocol.get(url, (res) => {
      const chunks: Buffer[] = []
      res.on('data', (chunk: Buffer) => chunks.push(chunk))
      res.on('end', () => resolve(Buffer.concat(chunks)))
      res.on('error', reject)
    }).on('error', reject)
  })
}

function extractKeywords(text: string): string[] {
  const stopwords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'up', 'about', 'into', 'is', 'it', 'its',
    'was', 'are', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
    'did', 'will', 'would', 'could', 'should', 'may', 'might', 'shall',
    'this', 'that', 'these', 'those', 'i', 'we', 'you', 'he', 'she', 'they',
    'so', 'if', 'as', 'just', 'not', 'no', 'can', 'all', 'also', 'there',
    'then', 'than', 'when', 'what', 'which', 'who', 'how', 'here',
  ])

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopwords.has(w))

  const seen = new Set<string>()
  const keywords: string[] = []
  for (const w of words) {
    if (!seen.has(w)) { seen.add(w); keywords.push(w) }
  }
  return keywords.slice(0, 30)
}

// ---------------------------------------------------------------------------
// Core transcription
// ---------------------------------------------------------------------------

async function transcribeVoiceNote(job: Job<CaptureAnalysisJobData>): Promise<void> {
  const { voiceNoteId, storageUrl, audioDurationSeconds } = job.data

  if (!voiceNoteId || !storageUrl) {
    throw new Error('[voice-transcription] voiceNoteId and storageUrl are required')
  }

  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient() as any

  try {
    // Idempotency check
    const existing = await prisma.$queryRaw`
      SELECT transcription_status FROM capture_voice_notes WHERE id = ${voiceNoteId} LIMIT 1
    ` as Array<{ transcription_status: string | null }>

    if (existing.length > 0 && existing[0].transcription_status === 'completed') {
      console.log(`[voice-transcription] Voice note ${voiceNoteId} already transcribed — skipping`)
      return
    }

    await job.updateProgress(10)

    const client = await getOpenAIClient()

    if (client) {
      const audioBuffer = await fetchBuffer(storageUrl)
      await job.updateProgress(30)

      const urlPath = new URL(storageUrl).pathname
      const ext = urlPath.split('.').pop() || 'webm'
      const file = new File([audioBuffer], `voice_note_${voiceNoteId}.${ext}`, { type: `audio/${ext}` })

      const transcription = await client.audio.transcriptions.create({
        model: 'whisper-1',
        file,
      })

      await job.updateProgress(70)

      const text: string = transcription.text ?? ''
      const keywords = extractKeywords(text)

      await prisma.$executeRaw`
        UPDATE capture_voice_notes SET
          transcription_text     = ${text},
          transcription_status   = 'completed',
          transcription_keywords = ${JSON.stringify(keywords)}::jsonb,
          transcribed_at         = NOW()
        WHERE id = ${voiceNoteId}
      `

      await job.updateProgress(100)
      console.log(`[Event] capture.voice_note.transcribed voiceNoteId=${voiceNoteId} words=${text.split(/\s+/).filter(Boolean).length}`)
      return
    }

    // No provider configured
    await prisma.$executeRaw`
      UPDATE capture_voice_notes SET
        transcription_status = 'provider_not_configured',
        transcribed_at = NOW()
      WHERE id = ${voiceNoteId}
    `
    console.warn(`[voice-transcription] No transcription provider configured for ${voiceNoteId}. Set OPENAI_API_KEY to enable Whisper.`)
  } finally {
    await prisma.$disconnect()
  }
}

// ---------------------------------------------------------------------------
// Poll for pending (called by cron)
// ---------------------------------------------------------------------------

export async function pollAndTranscribePending(): Promise<void> {
  const { captureAnalysisQueue } = await import('../queues/capture-analysis.queue')
  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient() as any

  try {
    const pending = await prisma.$queryRaw`
      SELECT id, storage_url, audio_duration_seconds
      FROM capture_voice_notes
      WHERE (transcription_status IS NULL OR transcription_status = 'pending')
        AND created_at > NOW() - INTERVAL '7 days'
      ORDER BY created_at DESC
      LIMIT 20
    ` as Array<{ id: string; storage_url: string; audio_duration_seconds: number | null }>

    if (pending.length === 0) return
    console.log(`[voice-transcription] Poll found ${pending.length} pending voice note(s)`)

    for (const note of pending) {
      try {
        await captureAnalysisQueue.transcribeVoiceNote({
          voiceNoteId: note.id,
          storageUrl: note.storage_url,
          audioDurationSeconds: note.audio_duration_seconds ?? undefined,
        })
      } catch (err: any) {
        if (!err?.message?.includes('already exists')) {
          console.warn(`[voice-transcription] Failed to enqueue voice note ${note.id}:`, err.message)
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

export function createVoiceTranscriptionWorker(): Worker<CaptureAnalysisJobData> {
  const worker = new Worker<CaptureAnalysisJobData>(
    'capture-analysis',
    async (job) => {
      if (job.data.jobType !== 'transcribe_voice_note') return
      await transcribeVoiceNote(job)
    },
    {
      connection: redis,
      concurrency: 5,
      limiter: { max: 20, duration: 60000 },
    },
  )

  worker.on('completed', (job) => {
    console.log(`[voice-transcription] Job ${job.id} (${job.data.voiceNoteId}) completed`)
  })
  worker.on('failed', (job, err) => {
    console.error(`[voice-transcription] Job ${job?.id} failed:`, err.message)
  })
  worker.on('error', (err) => {
    console.error('[voice-transcription] Worker error:', err)
  })

  return worker
}
