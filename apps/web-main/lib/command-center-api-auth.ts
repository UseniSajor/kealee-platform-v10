import { NextRequest, NextResponse } from 'next/server'
import { getClerkUser } from '@kealee/auth'
import {
  hasCommandCenterApiRole,
  verifyOpsBearer,
} from '@kealee/auth/ops-api-auth'

export async function requireCommandCenterApi(
  req: NextRequest,
): Promise<NextResponse | null> {
  if (verifyOpsBearer(req)) return null

  const user = await getClerkUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const role = user.role?.toLowerCase()
  if (!hasCommandCenterApiRole(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return null
}
