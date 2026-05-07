/**
 * GET /api/bots/executions
 *
 * Returns the in-memory execution trace log for this server process.
 * Accepts ?botId= and ?limit= query params.
 */

import { NextRequest, NextResponse } from 'next/server'
import { executionStore } from '../_store'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const botId = searchParams.get('botId')
  const limit = parseInt(searchParams.get('limit') ?? '30', 10)

  let traces = executionStore.getAll()
  if (botId) traces = traces.filter(t => t.botId === botId)
  traces = traces.slice(-limit).reverse()

  return NextResponse.json({ traces })
}
