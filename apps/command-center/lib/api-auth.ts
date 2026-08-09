import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import {
  hasCommandCenterApiRole,
  verifyOpsBearer,
} from '@kealee/auth/ops-api-auth'

export async function requireCommandCenterApi(
  req: NextRequest,
): Promise<NextResponse | null> {
  if (verifyOpsBearer(req)) return null

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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const role = (user.app_metadata?.role as string | undefined)?.toLowerCase()
  if (!hasCommandCenterApiRole(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return null
}
