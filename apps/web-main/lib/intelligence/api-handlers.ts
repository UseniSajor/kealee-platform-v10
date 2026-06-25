import { NextRequest, NextResponse } from 'next/server'
import {
  intelligenceRunner,
  intelligenceRunService,
  prismaPropertyTwinService,
  prismaLeadTwinService,
  prismaProjectTwinService,
  prismaCapitalTwinService,
  isIntelligencePersistenceAvailable,
  type IntelligenceEngineTypeName,
  type IntelligenceEventType,
} from '@kealee/intelligence'

export function authorizeIntelligence(req: NextRequest): boolean {
  const secret = process.env.KEALEE_OPS_SECRET || process.env.CRON_SECRET
  if (!secret) return false
  const auth = req.headers.get('Authorization')
  const xKealeeOps = req.headers.get('x-kealee-ops')
  return (
    (auth != null && auth === `Bearer ${secret}`) ||
    (xKealeeOps != null && xKealeeOps === secret)
  )
}

export function intelligenceUnavailable() {
  return NextResponse.json(
    { error: 'DATABASE_URL not configured for intelligence persistence' },
    { status: 503 },
  )
}

export function intelligenceUnauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export interface IntelligenceRunBody {
  triggerEvent?: IntelligenceEventType
  triggerEventId?: string
  orgId?: string
  engine?: IntelligenceEngineTypeName
  propertyTwinId?: string
  leadTwinId?: string
  projectTwinId?: string
  capitalTwinId?: string
  parcelId?: string
  address?: string
  jurisdiction?: string
  input?: Record<string, unknown>
}

export async function handleIntelligenceRun(
  body: IntelligenceRunBody,
  defaults: { triggerEvent: IntelligenceEventType; engine?: IntelligenceEngineTypeName },
) {
  const result = await intelligenceRunner.run({
    triggerEvent: body.triggerEvent ?? defaults.triggerEvent,
    triggerEventId: body.triggerEventId,
    orgId: body.orgId,
    engine: body.engine ?? defaults.engine,
    propertyTwinId: body.propertyTwinId,
    leadTwinId: body.leadTwinId,
    projectTwinId: body.projectTwinId,
    capitalTwinId: body.capitalTwinId,
    parcelId: body.parcelId,
    address: body.address,
    jurisdiction: body.jurisdiction,
    input: body.input,
  })
  return NextResponse.json(result)
}

export async function handleGetIntelligenceRun(id: string) {
  const run = await intelligenceRunService.getById(id)
  if (!run) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(run)
}

export async function handleGetPropertyTwin(id: string) {
  const twin = await prismaPropertyTwinService.getById(id)
  if (!twin) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const runs = await intelligenceRunService.listByTwin({ propertyTwinId: id, limit: 5 })
  return NextResponse.json({ twin, intelligenceRuns: runs })
}

export async function handleGetLeadTwin(id: string) {
  const twin = await prismaLeadTwinService.getById(id)
  if (!twin) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const runs = await intelligenceRunService.listByTwin({ leadTwinId: id, limit: 5 })
  return NextResponse.json({ twin, intelligenceRuns: runs })
}

export async function handleGetProjectTwin(id: string) {
  const twin = await prismaProjectTwinService.getById(id)
  if (!twin) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const runs = await intelligenceRunService.listByTwin({ projectTwinId: id, limit: 5 })
  return NextResponse.json({ twin, intelligenceRuns: runs })
}

export async function handleGetCapitalTwin(id: string) {
  const twin = await prismaCapitalTwinService.getById(id)
  if (!twin) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const runs = await intelligenceRunService.listByTwin({ capitalTwinId: id, limit: 5 })
  return NextResponse.json({ twin, intelligenceRuns: runs })
}

export async function parseIntelligenceBody(req: NextRequest): Promise<IntelligenceRunBody> {
  return (await req.json().catch(() => ({}))) as IntelligenceRunBody
}

export function guardIntelligenceRequest(req: NextRequest) {
  if (!authorizeIntelligence(req)) return intelligenceUnauthorized()
  if (!isIntelligencePersistenceAvailable()) return intelligenceUnavailable()
  return null
}
