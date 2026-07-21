import { NextResponse } from 'next/server'
import { getQueueHealth } from '@/lib/queue'

export const dynamic = 'force-dynamic'

export async function GET() {
  const queue = await getQueueHealth()
  return NextResponse.json({
    service: 'kealee-marketing-os',
    status: queue.configured && !queue.connected ? 'degraded' : 'ok',
    queue,
    timestamp: new Date().toISOString(),
  }, { status: queue.configured && !queue.connected ? 503 : 200 })
}
