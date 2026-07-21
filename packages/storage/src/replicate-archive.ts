/**
 * Persist Replicate prediction outputs for reuse and model training.
 *
 * - Supabase bucket `replicate-archive` (prod + shared dev)
 * - Optional local mirror under `data/replicate-archive/` in the monorepo when not on Vercel
 */

import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, appendFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { uploadFile } from './storage'

export const REPLICATE_ARCHIVE_BUCKET =
  process.env.REPLICATE_ARCHIVE_BUCKET?.trim() || 'replicate-archive'

export type ReplicateArchiveMediaKind = 'image' | 'video'

export interface ArchiveReplicateOutputOptions {
  predictionId: string
  /** Logical origin, e.g. concept-render-poll, editor-webhook, concept-video-kling */
  source: string
  mediaKind: ReplicateArchiveMediaKind
  outputUrls: string[]
  model?: string
  prompt?: string
  context?: Record<string, string | number | boolean | undefined>
}

export interface ArchivedAsset {
  index: number
  sourceUrl: string
  storagePath: string
  publicUrl: string
  localPath?: string
  contentType: string
  byteSize: number
}

export interface ArchiveReplicateOutputResult {
  predictionId: string
  source: string
  assets: ArchivedAsset[]
  manifestStoragePath: string
  manifestPublicUrl?: string
}

function isArchiveDisabled(): boolean {
  return process.env.REPLICATE_ARCHIVE_DISABLED === 'true'
}

function findMonorepoRoot(start = process.cwd()): string | null {
  let dir = start
  for (let i = 0; i < 10; i++) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) return dir
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return null
}

function resolveLocalArchiveDir(): string | null {
  const explicit = process.env.REPLICATE_ARCHIVE_LOCAL_DIR?.trim()
  if (explicit) {
    const root = findMonorepoRoot()
    return explicit.startsWith('/') || /^[A-Za-z]:/.test(explicit)
      ? explicit
      : root
        ? join(root, explicit)
        : explicit
  }

  if (process.env.VERCEL === '1') return null
  if (process.env.REPLICATE_ARCHIVE_SAVE_LOCAL === 'false') return null

  const root = findMonorepoRoot()
  if (!root) return null

  const saveLocal =
    process.env.REPLICATE_ARCHIVE_SAVE_LOCAL === 'true' ||
    process.env.NODE_ENV !== 'production'

  return saveLocal ? join(root, 'data', 'replicate-archive') : null
}

function extFromContentType(contentType: string, mediaKind: ReplicateArchiveMediaKind): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'application/octet-stream': mediaKind === 'video' ? 'mp4' : 'jpg',
  }
  const base = contentType.split(';')[0]?.trim().toLowerCase() ?? ''
  return map[base] ?? (mediaKind === 'video' ? 'mp4' : 'jpg')
}

function extFromUrl(url: string, mediaKind: ReplicateArchiveMediaKind): string {
  try {
    const pathname = new URL(url).pathname.toLowerCase()
    const match = pathname.match(/\.(jpe?g|png|webp|mp4|webm|gif)$/)
    if (match) return match[1] === 'jpeg' ? 'jpg' : match[1]
  } catch {
    /* ignore */
  }
  return mediaKind === 'video' ? 'mp4' : 'jpg'
}

async function downloadUrl(url: string, timeoutMs = 120_000): Promise<{ buffer: Buffer; contentType: string }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} fetching ${url}`)
    }
    const contentType = res.headers.get('content-type') ?? 'application/octet-stream'
    const buffer = Buffer.from(await res.arrayBuffer())
    return { buffer, contentType }
  } finally {
    clearTimeout(timer)
  }
}

function sanitizeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80)
}

function buildManifestPath(predictionId: string): string {
  return `manifests/${sanitizeSegment(predictionId)}.json`
}

/**
 * Download Replicate CDN outputs, upload to Supabase, optionally mirror to repo.
 */
export async function archiveReplicateOutputs(
  opts: ArchiveReplicateOutputOptions,
): Promise<ArchiveReplicateOutputResult | null> {
  if (isArchiveDisabled()) return null

  const urls = opts.outputUrls.filter((u) => typeof u === 'string' && u.startsWith('http'))
  if (urls.length === 0) return null

  const archivedAt = new Date().toISOString()
  const assets: ArchivedAsset[] = []
  const localDir = resolveLocalArchiveDir()

  for (let index = 0; index < urls.length; index++) {
    const sourceUrl = urls[index]
    try {
      const { buffer, contentType } = await downloadUrl(sourceUrl)
      const ext = extFromContentType(contentType, opts.mediaKind) || extFromUrl(sourceUrl, opts.mediaKind)
      const storagePath = `${sanitizeSegment(opts.source)}/${sanitizeSegment(opts.predictionId)}/${index}.${ext}`

      const upload = await uploadFile({
        bucket: REPLICATE_ARCHIVE_BUCKET,
        path: storagePath,
        file: buffer,
        contentType,
        metadata: {
          prediction_id: opts.predictionId,
          source: opts.source,
          source_url: sourceUrl.slice(0, 500),
        },
      })

      let localPath: string | undefined
      if (localDir) {
        localPath = join(localDir, 'media', sanitizeSegment(opts.predictionId), `${index}.${ext}`)
        mkdirSync(dirname(localPath), { recursive: true })
        writeFileSync(localPath, buffer)

        const manifestLine = JSON.stringify({
          predictionId: opts.predictionId,
          source: opts.source,
          mediaKind: opts.mediaKind,
          model: opts.model,
          index,
          sourceUrl,
          storagePath,
          publicUrl: upload.url,
          localPath: localPath.replace(/\\/g, '/'),
          contentType,
          byteSize: buffer.length,
          archivedAt,
          context: opts.context,
        })
        appendFileSync(join(localDir, 'manifest.jsonl'), manifestLine + '\n', 'utf8')
      }

      assets.push({
        index,
        sourceUrl,
        storagePath,
        publicUrl: upload.url,
        localPath,
        contentType,
        byteSize: buffer.length,
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.warn(
        `[replicate-archive] Failed asset ${index} for ${opts.predictionId} (${opts.source}):`,
        message,
      )
    }
  }

  if (assets.length === 0) return null

  const manifest = {
    predictionId: opts.predictionId,
    source: opts.source,
    mediaKind: opts.mediaKind,
    model: opts.model,
    prompt: opts.prompt,
    context: opts.context,
    archivedAt,
    assets: assets.map((a) => ({
      index: a.index,
      sourceUrl: a.sourceUrl,
      storagePath: a.storagePath,
      publicUrl: a.publicUrl,
      localPath: a.localPath,
      contentType: a.contentType,
      byteSize: a.byteSize,
    })),
  }

  const manifestStoragePath = buildManifestPath(opts.predictionId)
  const manifestBuffer = Buffer.from(JSON.stringify(manifest, null, 2), 'utf8')

  let manifestPublicUrl: string | undefined
  try {
    const manifestUpload = await uploadFile({
      bucket: REPLICATE_ARCHIVE_BUCKET,
      path: manifestStoragePath,
      file: manifestBuffer,
      contentType: 'application/json',
    })
    manifestPublicUrl = manifestUpload.url
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.warn(`[replicate-archive] Manifest upload failed for ${opts.predictionId}:`, message)
  }

  if (localDir) {
    const manifestLocal = join(localDir, 'manifests', `${sanitizeSegment(opts.predictionId)}.json`)
    mkdirSync(dirname(manifestLocal), { recursive: true })
    writeFileSync(manifestLocal, manifestBuffer)
  }

  return {
    predictionId: opts.predictionId,
    source: opts.source,
    assets,
    manifestStoragePath,
    manifestPublicUrl,
  }
}

/** Non-blocking archive — errors are logged, never thrown to callers. */
export function archiveReplicateOutputsFireAndForget(opts: ArchiveReplicateOutputOptions): void {
  if (isArchiveDisabled()) return
  void archiveReplicateOutputs(opts).catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err)
    console.warn(`[replicate-archive] ${opts.source}/${opts.predictionId}:`, message)
  })
}

/** Archive when only CDN URLs are known (no Replicate prediction id). */
export function archiveReplicateUrlsFireAndForget(
  opts: Omit<ArchiveReplicateOutputOptions, 'predictionId'> & { predictionId?: string },
): void {
  const predictionId =
    opts.predictionId ??
    `url-${createHash('sha256').update(opts.outputUrls.join('|')).digest('hex').slice(0, 16)}`
  archiveReplicateOutputsFireAndForget({ ...opts, predictionId })
}
