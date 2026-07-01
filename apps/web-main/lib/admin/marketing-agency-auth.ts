import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import {
  resolveRoleFromApiKey,
  roleHasScope,
  isExternalMarketingRole,
  type ApiScope,
  type KealeeAccessRole,
} from '@/lib/admin/access-roles'

export interface MarketingAgencyAuthResult {
  authorized: boolean
  role: KealeeAccessRole | null
  userId: string | null
  authMethod: 'api_key' | 'session' | null
}

function extractSecret(req: NextRequest): string | null {
  const auth = req.headers.get('Authorization')
  const xApiKey = req.headers.get('x-kealee-api-key')
  if (auth?.startsWith('Bearer ')) return auth.slice(7)
  if (xApiKey) return xApiKey
  return null
}

export function authorizeMarketingAgency(
  req: NextRequest,
  requiredScope?: ApiScope,
): MarketingAgencyAuthResult {
  const provided = extractSecret(req)
  if (provided) {
    const role = resolveRoleFromApiKey(provided)
    if (role && (!requiredScope || roleHasScope(role, requiredScope))) {
      return { authorized: true, role, userId: null, authMethod: 'api_key' }
    }
    if (role) return { authorized: false, role, userId: null, authMethod: 'api_key' }
  }

  return { authorized: false, role: null, userId: null, authMethod: null }
}

export async function authorizeMarketingAgencySession(
  req: NextRequest,
  requiredScope?: ApiScope,
): Promise<MarketingAgencyAuthResult> {
  const apiResult = authorizeMarketingAgency(req, requiredScope)
  if (apiResult.authorized) return apiResult

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: () => {},
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { authorized: false, role: null, userId: null, authMethod: null }
  }

  const appRole = (user.app_metadata?.role as string | undefined)?.toLowerCase()
  let role: KealeeAccessRole | null = null

  if (appRole === 'marketing_agency' || appRole === 'zem_marketing') {
    role = 'marketing_agency'
  } else if (['admin', 'super_admin', 'marketing_admin', 'owner'].includes(appRole ?? '')) {
    role = 'administrator'
  }

  if (!role || (requiredScope && !roleHasScope(role, requiredScope))) {
    return { authorized: false, role, userId: user.id, authMethod: 'session' }
  }

  return { authorized: true, role, userId: user.id, authMethod: 'session' }
}

/** Block external marketing roles from intelligence admin APIs */
export function blockExternalMarketingOnIntelligence(
  req: NextRequest,
): NextResponse | null {
  const provided = extractSecret(req)
  if (!provided) return null
  const role = resolveRoleFromApiKey(provided)
  if (role && isExternalMarketingRole(role)) {
    return NextResponse.json(
      { error: 'Forbidden — use /api/marketing/* endpoints only' },
      { status: 403 },
    )
  }
  return null
}

export function marketingUnauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export function marketingForbidden() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
