import { NextResponse } from 'next/server'
import { loadCardMediaManifest } from '@/lib/marketing/card-media-manifest'

export const dynamic = 'force-dynamic'

export async function GET() {
  const manifest = await loadCardMediaManifest()
  return NextResponse.json(manifest, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
  })
}
