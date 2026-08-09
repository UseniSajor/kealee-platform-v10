import { NextRequest, NextResponse } from 'next/server'
import {
  resolveRoleFromApiKey,
  roleHasScope,
  isExternalMarketingRole,
  type ApiScope,
  type KealeeAccessRole,
} from '@/lib/admin/access-roles'

export interface OpsAuthResult {
  authorized: boolean
  role: KealeeAccessRole | null
}

function extractSecret(req: NextRequest): string | null {
  const auth = req.headers.get('Authorization')
  const xKealeeOps = req.headers.get('x-kealee-ops')
  const xApiKey = req.headers.get('x-kealee-api-key')
  if (auth?.startsWith('Bearer ')) return auth.slice(7)
  if (xKealeeOps) return xKealeeOps
  if (xApiKey) return xApiKey
  return null
}

export function authorizeOps(req: NextRequest, requiredScope?: ApiScope): OpsAuthResult {
  const provided = extractSecret(req)
  if (!provided) return { authorized: false, role: null }

  const opsSecret = process.env.KEALEE_OPS_SECRET || process.env.CRON_SECRET
  if (opsSecret && provided === opsSecret) {
    return { authorized: true, role: 'ops' }
  }

  const partnerRole = resolveRoleFromApiKey(provided)
  if (partnerRole) {
    if (isExternalMarketingRole(partnerRole)) {
      return { authorized: false, role: partnerRole }
    }
    if (!requiredScope || roleHasScope(partnerRole, requiredScope)) {
      return { authorized: true, role: partnerRole }
    }
    return { authorized: false, role: partnerRole }
  }

  return { authorized: false, role: null }
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
