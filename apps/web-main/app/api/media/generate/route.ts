import { timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import {
  createMediaRouterFromEnv,
  type MediaGenerationRequest,
  type MediaIntent,
  type MediaKind,
  type MediaProviderId,
} from '@kealee/media-router'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const KINDS = new Set<MediaKind>(['image', 'video'])
const INTENTS = new Set<MediaIntent>([
  'specialized-model',
  'open-source-model',
  'image-processing',
  'cinematic-video',
  'renovation-visualization',
  'development-visualization',
  'marketing-content',
])
const PROVIDERS = new Set<MediaProviderId>(['replicate', 'higgsfield', 'seedance', 'veo'])

function authorized(request: NextRequest): boolean {
  const expected = process.env.MEDIA_ROUTER_API_KEY ?? process.env.ADMIN_API_KEY
  if (!expected) return false
  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  const supplied = request.headers.get('x-media-router-key') ?? bearer
  if (!supplied) return false
  const actualBuffer = Buffer.from(supplied)
  const expectedBuffer = Buffer.from(expected)
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer)
}

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return unauthorized()

  let body: Record<string, unknown>
  try {
    body = await request.json() as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!KINDS.has(body.kind as MediaKind)) {
    return NextResponse.json({ error: 'kind must be image or video' }, { status: 400 })
  }
  if (!INTENTS.has(body.intent as MediaIntent)) {
    return NextResponse.json({ error: 'Unsupported media intent' }, { status: 400 })
  }
  if (typeof body.prompt !== 'string' || !body.prompt.trim()) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
  }
  if (body.provider !== undefined && !PROVIDERS.has(body.provider as MediaProviderId)) {
    return NextResponse.json({ error: 'Unsupported media provider' }, { status: 400 })
  }

  try {
    const router = createMediaRouterFromEnv()
    const job = await router.submit(body as unknown as MediaGenerationRequest)
    return NextResponse.json({ job }, { status: 202 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Media generation submission failed' },
      { status: 502 },
    )
  }
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return unauthorized()
  const params = request.nextUrl.searchParams
  const jobId = params.get('jobId')
  if (!jobId) {
    return NextResponse.json({ providers: createMediaRouterFromEnv().health() })
  }

  const provider = params.get('provider') as MediaProviderId | null
  const kind = params.get('kind') as MediaKind | null
  const model = params.get('model')
  if (!provider || !PROVIDERS.has(provider) || !kind || !KINDS.has(kind) || !model) {
    return NextResponse.json(
      { error: 'provider, kind, model, and jobId are required to poll a job' },
      { status: 400 },
    )
  }

  try {
    const result = await createMediaRouterFromEnv().poll({
      provider,
      kind,
      model,
      jobId,
      status: 'processing',
      submittedAt: params.get('submittedAt') ?? new Date().toISOString(),
      statusUrl: params.get('statusUrl') ?? undefined,
    })
    return NextResponse.json({ job: result })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Media generation poll failed' },
      { status: 502 },
    )
  }
}
