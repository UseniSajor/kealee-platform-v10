import {
  generateVideo,
  getVideoStatus,
  buildInstallationProcessPrompt,
  type GenerateVideoResult,
} from '@/lib/ai-video'
import type { VideoProvider } from '@kealee/core-rules'
import { TIER_VIDEO_DEFAULTS } from '@kealee/core-rules'
import type { CardMediaSpec } from './card-media-spec'
import {
  deliverableSegmentCount,
  getProcessSegments,
  narrativeForProjectPath,
  type VideoNarrativeId,
} from './installation-video-scripts'
import { downloadUrlToBuffer } from './card-media-storage'
import { stitchMp4Segments } from './video-stitch'

export type ProcessVideoSegmentState = {
  id: string
  label: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  provider?: VideoProvider
  jobId?: string
  outputUrl?: string
  error?: string
}

export type DeliverableProcessVideoState = {
  videoKind: 'process'
  narrativeId: VideoNarrativeId
  status: 'pending' | 'processing' | 'completed' | 'failed'
  provider: VideoProvider
  model?: string
  segments: ProcessVideoSegmentState[]
  currentIndex: number
  inputImageUrl?: string
  outputUrl?: string
  startedAt: string
  completedAt?: string
  error?: string
}

async function pollVideoJob(
  provider: VideoProvider,
  jobId: string,
  maxMs = 600_000,
): Promise<string> {
  const started = Date.now()
  while (Date.now() - started < maxMs) {
    const status = await getVideoStatus(provider, jobId)
    if (status.status === 'completed' && status.outputUrl) return status.outputUrl
    if (status.status === 'failed') throw new Error(status.error ?? 'Video generation failed')
    await new Promise((r) => setTimeout(r, 4000))
  }
  throw new Error('Video generation timed out')
}

/** Marketing card loop — always Kling img2video. */
export async function generateCardProcessVideo(
  spec: CardMediaSpec,
  heroImageUrl: string,
): Promise<{ videoUrl: string; prompt: string }> {
  const segmentPrompt = spec.cardProcessPrompt ?? spec.imageDescription
  const prompt = buildInstallationProcessPrompt({
    segmentPrompt,
    style: spec.style,
    roomType: spec.roomType,
  })

  const job = await generateVideo({
    prompt,
    inputImageUrl: heroImageUrl,
    durationSec: 10,
    aspectRatio: spec.scope === 'home' ? '1:1' : '16:9',
    size: spec.scope === 'home' ? '1080x1920' : '1920x1080',
    provider: 'kling-2.5',
  })

  const outputUrl = await pollVideoJob(job.provider, job.jobId)
  return { videoUrl: outputUrl, prompt }
}

export function buildDeliverableProcessPlan(opts: {
  tier: 1 | 2 | 3
  projectPath: string
  provider: VideoProvider
  inputImageUrl?: string
}): DeliverableProcessVideoState | null {
  const tierDefault = TIER_VIDEO_DEFAULTS[opts.tier]
  if (!tierDefault) return null

  const narrativeId = narrativeForProjectPath(opts.projectPath)
  const count = deliverableSegmentCount(opts.tier, narrativeId)
  if (count === 0) return null

  const segments = getProcessSegments(narrativeId, count).map((s) => ({
    id: s.id,
    label: s.label,
    status: 'pending' as const,
  }))

  return {
    videoKind: 'process',
    narrativeId,
    status: 'processing',
    provider: opts.provider,
    segments,
    currentIndex: 0,
    inputImageUrl: opts.inputImageUrl,
    startedAt: new Date().toISOString(),
  }
}

export async function startNextDeliverableSegment(
  state: DeliverableProcessVideoState,
  opts: {
    style: string
    roomType: string
    inputImageUrl?: string
  },
): Promise<{ state: DeliverableProcessVideoState; job?: GenerateVideoResult }> {
  const idx = state.currentIndex
  const segment = state.segments[idx]
  if (!segment || segment.status === 'completed') {
    return { state }
  }

  const script = getProcessSegments(state.narrativeId, state.segments.length)[idx]
  if (!script) {
    return {
      state: { ...state, status: 'failed', error: 'Missing process script segment' },
    }
  }

  const prompt = buildInstallationProcessPrompt({
    segmentPrompt: script.prompt,
    style: opts.style,
    roomType: opts.roomType,
  })

  // Sora 2/2-Pro minimum supported duration is 10s; Veo supports 8s+; Kling uses 10s.
  const durationSec = state.provider === 'kling-2.5' ? 10 : state.provider.startsWith('sora') ? 10 : 8
  const job = await generateVideo({
    prompt,
    inputImageUrl: opts.inputImageUrl ?? state.inputImageUrl,
    durationSec,
    aspectRatio: '16:9',
    size: state.provider === 'sora-2-pro' ? '1920x1080' : '1280x720',
    provider: state.provider,
  })

  const nextSegments = [...state.segments]
  nextSegments[idx] = {
    ...segment,
    status: 'processing',
    provider: job.provider,
    jobId: job.jobId,
  }

  return {
    state: {
      ...state,
      status: 'processing',
      model: job.modelVersion,
      segments: nextSegments,
    },
    job,
  }
}

export async function pollCurrentDeliverableSegment(
  state: DeliverableProcessVideoState,
  mirrorCompletedUrl: (remoteUrl: string) => Promise<string>,
): Promise<DeliverableProcessVideoState> {
  const idx = state.currentIndex
  const segment = state.segments[idx]
  if (!segment?.jobId || !segment.provider) return state

  const live = await getVideoStatus(segment.provider, segment.jobId)
  if (live.status === 'failed') {
    const segments = [...state.segments]
    segments[idx] = { ...segment, status: 'failed', error: live.error ?? 'Segment failed' }
    return { ...state, status: 'failed', segments, error: live.error }
  }

  if (live.status !== 'completed' || !live.outputUrl) {
    return state
  }

  const publicUrl = await mirrorCompletedUrl(live.outputUrl)
  const segments = [...state.segments]
  segments[idx] = { ...segment, status: 'completed', outputUrl: publicUrl }

  const nextIndex = idx + 1
  if (nextIndex < segments.length) {
    return {
      ...state,
      segments,
      currentIndex: nextIndex,
      status: 'processing',
    }
  }

  return {
    ...state,
    segments,
    status: 'processing',
    currentIndex: nextIndex,
  }
}

/** Upload stitched bytes via caller — advanceDeliverable uses mirror for remote URLs only. */
export async function finalizeDeliverableStitch(
  state: DeliverableProcessVideoState,
  uploadBytes: (bytes: Buffer) => Promise<string>,
): Promise<DeliverableProcessVideoState> {
  const completed = state.segments.filter((s) => s.status === 'completed' && s.outputUrl)
  if (completed.length === 0) return state

  const buffers: Buffer[] = []
  for (const s of completed) {
    if (s.outputUrl) buffers.push(await downloadUrlToBuffer(s.outputUrl))
  }

  const stitched = await stitchMp4Segments(buffers)
  if (stitched) {
    const outputUrl = await uploadBytes(stitched)
    return {
      ...state,
      status: 'completed',
      outputUrl,
      completedAt: new Date().toISOString(),
    }
  }

  return {
    ...state,
    status: 'completed',
    outputUrl: completed[completed.length - 1]?.outputUrl,
    completedAt: new Date().toISOString(),
  }
}
