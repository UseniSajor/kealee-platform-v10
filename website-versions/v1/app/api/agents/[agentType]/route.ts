/**
 * apps/web-main/app/api/agents/[agentType]/route.ts
 *
 * Proxy to backend RAG agent endpoints:
 *   POST /api/agents/land      → /api/v1/agents/land/execute
 *   POST /api/agents/design    → /api/v1/agents/design/execute
 *   POST /api/agents/permit    → /api/v1/agents/permit/execute
 *   POST /api/agents/contractor → /api/v1/agents/contractor/execute
 */

import { NextRequest, NextResponse } from 'next/server'

const VALID_AGENTS = new Set(['land', 'design', 'permit', 'contractor'])
const API = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? ''

export async function POST(
  req: NextRequest,
  { params }: { params: { agentType: string } }
) {
  const { agentType } = params

  if (!VALID_AGENTS.has(agentType)) {
    return NextResponse.json({ error: `Unknown agent type: ${agentType}` }, { status: 400 })
  }

  if (!API) {
    return NextResponse.json({ error: 'API_URL not configured' }, { status: 503 })
  }

  try {
    const body = await req.json()
    const upstream = await fetch(`${API}/api/v1/agents/${agentType}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    })

    const data = await upstream.json()
    return NextResponse.json(data, { status: upstream.status })
  } catch (err: any) {
    console.error(`[agents/${agentType}] proxy error:`, err?.message)
    return NextResponse.json({ error: 'Agent unavailable' }, { status: 503 })
  }
}
