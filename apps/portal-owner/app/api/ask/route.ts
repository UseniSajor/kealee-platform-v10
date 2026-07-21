/**
 * Proxies to web-main /api/ask so the owner portal ask rail works without CORS.
 * Enriches the request with customer order context before forwarding.
 */
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function webMainBase(): string {
  return (process.env.NEXT_PUBLIC_WEB_MAIN_URL ?? 'https://kealee.com').replace(/\/$/, '')
}

/** Build a concise customer context string from deliverables API response. */
function buildCustomerContext(data: {
  deliverables?: Array<{
    tierLabel?: string
    projectPath?: string
    projectLabel?: string
    uiStatus?: string
    pdfUrl?: string | null
  }>
  ownedProducts?: string[]
}): string {
  const deliverables = data.deliverables ?? []
  const owned = data.ownedProducts ?? []

  if (deliverables.length === 0) return ''

  const orderSummary = deliverables
    .slice(0, 3)
    .map((d) => {
      const parts = [
        d.tierLabel ?? 'Concept Package',
        d.projectLabel ? `(${d.projectLabel})` : '',
        d.uiStatus ? `status: ${d.uiStatus}` : '',
        d.pdfUrl ? 'PDF ready' : '',
      ].filter(Boolean)
      return parts.join(' ')
    })
    .join('; ')

  const ownedStr = owned.length > 0 ? `Owned services: ${owned.join(', ')}.` : 'No additional services purchased yet.'

  return `Customer orders: ${orderSummary}. ${ownedStr}`
}

export async function POST(req: NextRequest) {
  const upstream = `${webMainBase()}/api/ask`

  try {
    const rawBody = await req.text()
    let enrichedBody = rawBody

    // Attempt to inject customer order context
    try {
      const parsed = JSON.parse(rawBody) as {
        query?: string
        context?: string
        messages?: unknown[]
        stream?: boolean
      }

      // Fetch customer's deliverables using the session cookie
      const delivRes = await fetch(new URL('/api/deliverables', req.url), {
        headers: { cookie: req.headers.get('cookie') ?? '' },
      })

      if (delivRes.ok) {
        const delivData = await delivRes.json() as {
          deliverables?: Array<{
            tierLabel?: string
            projectPath?: string
            projectLabel?: string
            uiStatus?: string
            pdfUrl?: string | null
          }>
          ownedProducts?: string[]
        }
        const customerContext = buildCustomerContext(delivData)
        if (customerContext) {
          const baseContext = parsed.context ?? 'portal-owner'
          parsed.context = `${baseContext} | ${customerContext}`
          enrichedBody = JSON.stringify(parsed)
        }
      }
    } catch {
      // If enrichment fails for any reason, fall through to proxy original body
    }

    const res = await fetch(upstream, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: enrichedBody,
    })

    const contentType = res.headers.get('content-type') ?? 'text/plain; charset=utf-8'
    return new Response(res.body, { status: res.status, headers: { 'Content-Type': contentType } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Ask proxy failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
