import { NextRequest, NextResponse } from 'next/server'
import { verifyCronRequest } from '@/lib/cron-auth'
import { runApolloImport } from '@/lib/marketing/apollo-import'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const denied = verifyCronRequest(req)
  if (denied) return denied
  try {
    const result = await runApolloImport()
    const status = result.status === 'failed' ? 500 : result.status === 'rate_limited' ? 429 : 200
    return NextResponse.json(result, { status })
  } catch (error) {
    console.error('[cron/apollo-import] configuration or startup failure:', error)
    return NextResponse.json({
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
