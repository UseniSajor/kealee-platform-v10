import type { MediaJobStatus } from './types'

export async function fetchJson(url: string, init?: RequestInit): Promise<Record<string, unknown>> {
  const response = await fetch(url, init)
  const text = await response.text()
  let body: Record<string, unknown> = {}
  if (text) {
    try {
      body = JSON.parse(text) as Record<string, unknown>
    } catch {
      body = { message: text }
    }
  }
  if (!response.ok) {
    throw new Error(`Media provider request failed (${response.status}): ${text.slice(0, 500)}`)
  }
  return body
}

export function mapStatus(value: unknown): MediaJobStatus {
  const status = String(value ?? '').toLowerCase()
  if (['completed', 'complete', 'succeeded', 'success', 'ready'].includes(status)) return 'completed'
  if (['failed', 'error'].includes(status)) return 'failed'
  if (['canceled', 'cancelled'].includes(status)) return 'canceled'
  if (['queued', 'pending', 'starting'].includes(status)) return 'queued'
  return 'processing'
}

export function extractOutputUrls(body: Record<string, unknown>): string[] {
  const urls = new Set<string>()
  const add = (value: unknown) => {
    if (typeof value === 'string' && /^https?:\/\//.test(value)) urls.add(value)
    if (Array.isArray(value)) value.forEach(add)
  }
  add(body.output)
  add(body.outputs)
  add(body.video)
  add(body.videos)
  add(body.image)
  add(body.images)
  add(body.output_url)
  add(body.output_urls)
  const result = body.result as Record<string, unknown> | undefined
  if (result) {
    add(result.output)
    add(result.video)
    add(result.videos)
    add(result.image)
    add(result.images)
    add(result.url)
  }
  const content = body.content as Record<string, unknown> | undefined
  if (content) {
    add(content.video_url)
    add(content.image_url)
    add(content.urls)
  }
  const response = body.response as Record<string, unknown> | undefined
  const generated = response?.generateVideoResponse as Record<string, unknown> | undefined
  const samples = (generated?.generatedSamples ?? response?.generatedSamples) as Array<Record<string, unknown>> | undefined
  for (const sample of samples ?? []) {
    const video = sample.video as Record<string, unknown> | undefined
    add(video?.uri)
    add(video?.url)
  }
  return [...urls]
}

export function errorMessage(body: Record<string, unknown>): string | undefined {
  const error = body.error
  if (typeof error === 'string') return error
  if (error && typeof error === 'object') {
    const message = (error as Record<string, unknown>).message
    if (typeof message === 'string') return message
  }
  return typeof body.message === 'string' ? body.message : undefined
}
