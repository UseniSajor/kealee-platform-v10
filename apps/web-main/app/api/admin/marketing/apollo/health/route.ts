import { NextRequest, NextResponse } from 'next/server'
import { authorizeOps, unauthorized } from '@/lib/admin/intelligence-auth'
import { getApolloImportHealth } from '@/lib/marketing/apollo-import'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!authorizeOps(req, 'read:marketing').authorized) return unauthorized()
  return NextResponse.json(await getApolloImportHealth())
}
