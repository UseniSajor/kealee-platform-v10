import { NextRequest, NextResponse } from 'next/server'

export function authorizeOps(req: NextRequest): boolean {
  const secret = process.env.KEALEE_OPS_SECRET || process.env.CRON_SECRET
  if (!secret) return false
  const auth = req.headers.get('Authorization')
  const xKealeeOps = req.headers.get('x-kealee-ops')
  return (
    (auth != null && auth === `Bearer ${secret}`) ||
    (xKealeeOps != null && xKealeeOps === secret)
  )
}

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export function parseIntelligenceFilters(req: NextRequest) {
  const p = req.nextUrl.searchParams
  return {
    jurisdiction: p.get('jurisdiction') ?? undefined,
    productType: p.get('productType') ?? undefined,
    propertyType: p.get('propertyType') ?? undefined,
    ownershipType: p.get('ownershipType') ?? undefined,
    priority: p.get('priority') ?? undefined,
    segment: p.get('segment') ?? undefined,
    campaignStatus: (p.get('campaignStatus') as 'routed' | 'suppressed' | 'all') ?? undefined,
    minScore: p.get('minScore') ? Number(p.get('minScore')) : undefined,
    maxScore: p.get('maxScore') ? Number(p.get('maxScore')) : undefined,
    minDataQuality: p.get('minDataQuality') ? Number(p.get('minDataQuality')) : undefined,
    limit: p.get('limit') ? Number(p.get('limit')) : 50,
    offset: p.get('offset') ? Number(p.get('offset')) : 0,
  }
}
