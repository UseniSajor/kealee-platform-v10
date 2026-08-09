import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface CampaignManifest {
  id: string
  provider: string
  generatedAt: string
  images: Array<{
    id: string
    filename: string
    alt: string
    prompt: string
    model: string
  }>
  video?: {
    filename: string
    model: string
    prompt: string
  } | null
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : []
}

function stringValues(value: unknown): string[] {
  if (Array.isArray(value)) return stringArray(value)
  if (!value || typeof value !== 'object') return []
  return Object.values(value).filter(
    (item): item is string => typeof item === 'string' && item.length > 0,
  )
}

async function loadMarketingMedia() {
  const manifestPath = path.join(
    process.cwd(),
    'public',
    'renderings',
    'marketing',
    'preconstruction',
    'manifest.json',
  )
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as CampaignManifest
  const basePath = '/renderings/marketing/preconstruction'

  const campaignAssets = [
    ...manifest.images.map((image) => ({
      id: image.id,
      collection: 'preconstruction-campaign',
      title: image.alt,
      kind: 'image' as const,
      url: `${basePath}/${image.filename}`,
      thumbnailUrl: `${basePath}/${image.filename}`,
      provider: manifest.provider,
      model: image.model,
      prompt: image.prompt,
      generatedAt: manifest.generatedAt,
      placement: 'Preconstruction services campaign',
    })),
    ...(manifest.video ? [{
      id: 'preconstruction-hero-video',
      collection: 'preconstruction-campaign',
      title: 'Preconstruction campaign hero video',
      kind: 'video' as const,
      url: `${basePath}/${manifest.video.filename}`,
      thumbnailUrl: `${basePath}/preconstruction-design.jpg`,
      provider: manifest.provider,
      model: manifest.video.model,
      prompt: manifest.video.prompt,
      generatedAt: manifest.generatedAt,
      placement: 'Preconstruction services hero',
    }] : []),
  ]

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kealee.com'
  let cardAssets: Array<Record<string, unknown>> = []
  try {
    const response = await fetch(`${site.replace(/\/$/, '')}/api/marketing/card-media`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(8_000),
    })
    if (response.ok) {
      const cardManifest = await response.json() as {
        cards?: Record<string, {
          photoUrl?: string
          photoAlt?: string
          videoUrl?: string
          source?: string
          generatedAt?: string
          promptUsed?: string
        }>
      }
      cardAssets = Object.entries(cardManifest.cards ?? {}).flatMap(([key, entry]) => {
        const items: Array<Record<string, unknown>> = []
        if (entry.photoUrl) {
          items.push({
            id: `${key}:image`,
            collection: 'website-card-media',
            title: entry.photoAlt || key,
            kind: 'image',
            url: entry.photoUrl,
            thumbnailUrl: entry.photoUrl,
            provider: entry.source === 'generated' ? 'platform generator' : 'fallback',
            prompt: entry.promptUsed,
            generatedAt: entry.generatedAt,
            placement: key,
          })
        }
        if (entry.videoUrl) {
          items.push({
            id: `${key}:video`,
            collection: 'website-card-media',
            title: `${entry.photoAlt || key} video`,
            kind: 'video',
            url: entry.videoUrl,
            thumbnailUrl: entry.photoUrl,
            provider: entry.source === 'generated' ? 'platform generator' : 'fallback',
            generatedAt: entry.generatedAt,
            placement: key,
          })
        }
        return items
      })
    }
  } catch {
    cardAssets = []
  }

  return [...campaignAssets, ...cardAssets]
}

async function loadPurchasedConcepts() {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('public_intake_leads')
    .select('id, client_name, contact_email, project_path, project_address, status, paid_at, created_at, updated_at, form_data')
    .not('paid_at', 'is', null)
    .order('created_at', { ascending: false })
    .limit(250)

  if (error) throw error

  return (data ?? []).flatMap((lead) => {
    const formData = asRecord(lead.form_data)
    const conceptOutput = asRecord(formData.conceptOutput)
    const renderUrls = stringArray(conceptOutput.renderUrls)
    const videoUrls = [
      ...stringValues(conceptOutput.videoFormatUrls),
      ...(typeof conceptOutput.videoUrl === 'string' ? [conceptOutput.videoUrl] : []),
    ]
    const jobs = stringArray(formData.renderJobs)

    if (renderUrls.length === 0 && videoUrls.length === 0 && jobs.length === 0) return []

    return [{
      id: lead.id,
      clientName: lead.client_name || 'Unnamed client',
      contactEmail: lead.contact_email,
      projectPath: lead.project_path,
      projectAddress: lead.project_address,
      status: lead.status,
      paidAt: lead.paid_at,
      createdAt: lead.created_at,
      updatedAt: lead.updated_at,
      tier: typeof formData.tier === 'number' ? formData.tier : null,
      renderJobs: jobs,
      assets: [
        ...renderUrls.map((url, index) => ({
          id: `${lead.id}:render:${index}`,
          title: `Concept rendering ${index + 1}`,
          kind: 'image' as const,
          url,
        })),
        ...videoUrls.map((url, index) => ({
          id: `${lead.id}:video:${index}`,
          title: `Concept video ${index + 1}`,
          kind: 'video' as const,
          url,
        })),
      ],
    }]
  })
}

export async function GET() {
  const cookieStore = cookies()
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => undefined,
      },
    },
  )
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const [marketingResult, conceptsResult] = await Promise.allSettled([
    loadMarketingMedia(),
    loadPurchasedConcepts(),
  ])

  const errors: string[] = []
  if (marketingResult.status === 'rejected') {
    errors.push(`Marketing media: ${marketingResult.reason instanceof Error ? marketingResult.reason.message : String(marketingResult.reason)}`)
  }
  if (conceptsResult.status === 'rejected') {
    errors.push(`Purchased concepts: ${conceptsResult.reason instanceof Error ? conceptsResult.reason.message : String(conceptsResult.reason)}`)
  }

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    marketing: marketingResult.status === 'fulfilled' ? marketingResult.value : [],
    purchasedConcepts: conceptsResult.status === 'fulfilled' ? conceptsResult.value : [],
    errors,
  })
}
