import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { getSupabaseAdmin, buildStorageUrl } from '@/lib/supabase-server'
import type { CardMediaScope } from './card-media-spec'

export const MARKETING_MEDIA_BUCKET =
  process.env.SUPABASE_MARKETING_MEDIA_BUCKET?.trim() || 'marketing-media'

const PUBLIC_MEDIA_ROOT = path.join(process.cwd(), 'public', 'media')

export async function downloadUrlToBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url, { signal: AbortSignal.timeout(120_000) })
  if (!res.ok) throw new Error(`Download failed ${res.status}: ${url.slice(0, 80)}`)
  return Buffer.from(await res.arrayBuffer())
}

function localMediaPath(scope: CardMediaScope, id: string, ext: string): string {
  const folder = ext === 'mp4' || ext === 'webm' ? 'service-videos' : 'service-photos'
  return path.join(PUBLIC_MEDIA_ROOT, folder, `${scope}-${id}.${ext}`)
}

export function localPublicMediaUrl(scope: CardMediaScope, id: string, ext: string): string {
  const folder = ext === 'mp4' || ext === 'webm' ? 'service-videos' : 'service-photos'
  return `/media/${folder}/${scope}-${id}.${ext}`
}

export async function saveLocalMarketingAsset(
  scope: CardMediaScope,
  id: string,
  bytes: Buffer,
  ext: 'webp' | 'jpg' | 'mp4' | 'webm',
): Promise<string> {
  const filePath = localMediaPath(scope, id, ext)
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, bytes)
  return localPublicMediaUrl(scope, id, ext)
}

function canUseSupabase(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.CARD_MEDIA_LOCAL_ONLY !== 'true',
  )
}

export async function uploadMarketingAsset(
  scope: CardMediaScope,
  id: string,
  bytes: Buffer,
  ext: 'webp' | 'jpg' | 'mp4' | 'webm',
): Promise<string> {
  if (!canUseSupabase()) {
    return saveLocalMarketingAsset(scope, id, bytes, ext)
  }

  try {
    const supabase = getSupabaseAdmin()
    const contentType =
      ext === 'mp4'
        ? 'video/mp4'
        : ext === 'webm'
          ? 'video/webm'
          : ext === 'webp'
            ? 'image/webp'
            : 'image/jpeg'

    const storagePath = `${scope}/${id}.${ext}`
    const { error } = await supabase.storage
      .from(MARKETING_MEDIA_BUCKET)
      .upload(storagePath, bytes, { contentType, upsert: true })

    if (error) throw error
    return buildStorageUrl(MARKETING_MEDIA_BUCKET, storagePath)
  } catch (err) {
    console.warn('[card-media] Supabase upload failed, saving locally:', err)
    return saveLocalMarketingAsset(scope, id, bytes, ext)
  }
}
