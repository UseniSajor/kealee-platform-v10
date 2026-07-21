/**
 * markets.service.ts — Multi-Market Expansion Operating System
 * Market jurisdiction management, launch checklists, city configs.
 */
import { prisma } from '../../lib/prisma'
import type {
  CreateMarketBody,
  UpdateMarketBody,
  CreateLaunchChecklistItemBody,
  UpdateLaunchChecklistItemBody,
  SetMarketConfigBody,
  MarketDto,
  LaunchChecklistItemDto,
  MarketStatsDto,
} from './markets.dto'

const db = prisma as any

// ─── Market CRUD ──────────────────────────────────────────────────────────────

export async function listMarkets(statusFilter?: string): Promise<MarketDto[]> {
  const markets = await db.market.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    include: {
      _count: { select: { checklistItems: true } },
      checklistItems: { select: { status: true } },
    },
    orderBy: { name: 'asc' },
  })
  return markets.map(mapMarket)
}

export async function getMarket(marketId: string): Promise<MarketDto> {
  const market = await db.market.findUnique({
    where: { id: marketId },
    include: {
      _count: { select: { checklistItems: true } },
      checklistItems: { select: { status: true } },
    },
  })
  if (!market) throw Object.assign(new Error('Market not found'), { statusCode: 404 })
  return mapMarket(market)
}

export async function createMarket(body: CreateMarketBody): Promise<MarketDto> {
  const existing = await db.market.findFirst({ where: { jurisdictionCode: body.jurisdictionCode } })
  if (existing) throw Object.assign(new Error('Market with this jurisdiction code already exists'), { statusCode: 409 })

  const market = await db.market.create({
    data: {
      ...body,
      status: 'PLANNED',
      launchDate: body.launchDate ? new Date(body.launchDate) : null,
    },
    include: {
      _count: { select: { checklistItems: true } },
      checklistItems: { select: { status: true } },
    },
  })
  return mapMarket(market)
}

export async function updateMarket(marketId: string, body: UpdateMarketBody): Promise<MarketDto> {
  const existing = await db.market.findUnique({ where: { id: marketId } })
  if (!existing) throw Object.assign(new Error('Market not found'), { statusCode: 404 })

  const market = await db.market.update({
    where: { id: marketId },
    data: {
      ...body,
      launchDate: body.launchDate ? new Date(body.launchDate) : undefined,
    },
    include: {
      _count: { select: { checklistItems: true } },
      checklistItems: { select: { status: true } },
    },
  })
  return mapMarket(market)
}

// ─── Launch Checklist ─────────────────────────────────────────────────────────

export async function getChecklist(marketId: string): Promise<LaunchChecklistItemDto[]> {
  const items = await db.launchChecklistItem.findMany({
    where: { marketId },
    orderBy: [{ category: 'asc' }, { createdAt: 'asc' }],
  })
  return items.map(mapChecklistItem)
}

export async function createChecklistItem(body: CreateLaunchChecklistItemBody): Promise<LaunchChecklistItemDto> {
  const market = await db.market.findUnique({ where: { id: body.marketId } })
  if (!market) throw Object.assign(new Error('Market not found'), { statusCode: 404 })

  const item = await db.launchChecklistItem.create({
    data: {
      ...body,
      status: 'TODO',
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
    },
  })
  return mapChecklistItem(item)
}

export async function updateChecklistItem(
  itemId: string,
  body: UpdateLaunchChecklistItemBody,
): Promise<LaunchChecklistItemDto> {
  const existing = await db.launchChecklistItem.findUnique({ where: { id: itemId } })
  if (!existing) throw Object.assign(new Error('Checklist item not found'), { statusCode: 404 })

  const item = await db.launchChecklistItem.update({
    where: { id: itemId },
    data: {
      ...body,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      completedAt: body.completedAt ? new Date(body.completedAt) :
        (body.status === 'DONE' && !existing.completedAt ? new Date() : undefined),
    },
  })
  return mapChecklistItem(item)
}

// ─── Market Config ────────────────────────────────────────────────────────────

export async function getMarketConfig(marketId: string): Promise<Record<string, unknown>> {
  const configs = await db.marketConfig.findMany({ where: { marketId } })
  return Object.fromEntries(configs.map((c: any) => [c.key, c.value]))
}

export async function setMarketConfig(marketId: string, body: SetMarketConfigBody): Promise<void> {
  await db.marketConfig.upsert({
    where: { marketId_key: { marketId, key: body.key } },
    create: { marketId, key: body.key, value: body.value },
    update: { value: body.value },
  })
}

// ─── Market Stats ─────────────────────────────────────────────────────────────

export async function getMarketStats(marketId: string): Promise<MarketStatsDto> {
  const market = await db.market.findUnique({ where: { id: marketId } })
  if (!market) throw Object.assign(new Error('Market not found'), { statusCode: 404 })

  const [projects, contracts] = await Promise.all([
    db.project.count({
      where: { jurisdictionCode: market.jurisdictionCode, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
    }),
    db.contractAgreement.count({
      where: { project: { jurisdictionCode: market.jurisdictionCode }, status: 'COMPLETED' },
    }),
  ])

  return {
    marketId,
    jurisdictionCode: market.jurisdictionCode,
    activeProjects: projects,
    registeredContractors: 0,  // TODO: from contractor profile table
    openLeads: 0,              // TODO: from lead model
    completedContracts: contracts,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapMarket(m: any): MarketDto {
  const items: { status: string }[] = m.checklistItems ?? []
  return {
    id: m.id,
    name: m.name,
    jurisdictionCode: m.jurisdictionCode,
    countryCode: m.countryCode,
    stateCode: m.stateCode ?? null,
    city: m.city ?? null,
    timezone: m.timezone,
    status: m.status,
    launchDate: m.launchDate ? new Date(m.launchDate).toISOString() : null,
    notes: m.notes ?? null,
    createdAt: new Date(m.createdAt).toISOString(),
    checklistProgress: {
      total: items.length,
      done: items.filter(i => i.status === 'DONE').length,
    },
  }
}

function mapChecklistItem(i: any): LaunchChecklistItemDto {
  return {
    id: i.id,
    marketId: i.marketId,
    category: i.category,
    title: i.title,
    description: i.description ?? null,
    status: i.status,
    dueDate: i.dueDate ? new Date(i.dueDate).toISOString() : null,
    assigneeId: i.assigneeId ?? null,
    completedAt: i.completedAt ? new Date(i.completedAt).toISOString() : null,
  }
}
