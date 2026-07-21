/**
 * Capture Analysis Queue
 * Handles two job types:
 * 1. analyze_capture_asset  — analyze a capture photo with Claude Vision
 * 2. transcribe_voice_note  — transcribe audio with OpenAI Whisper
 */

import { BaseQueue } from './base.queue'

export interface CaptureAnalysisJobData {
  jobType: 'analyze_capture_asset' | 'transcribe_voice_note'
  // For analyze_capture_asset
  assetId?: string
  captureSessionId?: string
  storageUrl?: string
  zone?: string
  mimeType?: string
  projectId?: string
  // For transcribe_voice_note
  voiceNoteId?: string
  audioDurationSeconds?: number
}

export class CaptureAnalysisQueue extends BaseQueue<CaptureAnalysisJobData> {
  constructor() {
    super('capture-analysis', {
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 3000,
        },
        removeOnComplete: {
          age: 7 * 24 * 3600,
          count: 1000,
        },
        removeOnFail: {
          age: 30 * 24 * 3600,
        },
      },
    })
  }

  async analyzeAsset(
    data: Omit<CaptureAnalysisJobData, 'jobType'> & { assetId: string; storageUrl: string },
  ) {
    return this.add(
      'analyze_capture_asset',
      { ...data, jobType: 'analyze_capture_asset' },
      { jobId: `vision-${data.assetId}` },
    )
  }

  async transcribeVoiceNote(
    data: Omit<CaptureAnalysisJobData, 'jobType'> & { voiceNoteId: string; storageUrl: string },
  ) {
    return this.add(
      'transcribe_voice_note',
      { ...data, jobType: 'transcribe_voice_note' },
      { jobId: `transcribe-${data.voiceNoteId}` },
    )
  }
}

export const captureAnalysisQueue = new CaptureAnalysisQueue()
