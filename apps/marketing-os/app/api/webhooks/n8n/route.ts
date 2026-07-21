import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { JOB_TYPES } from '@/lib/domain'
import { enqueueMarketingJob } from '@/lib/queue'
import { getSupabaseAdmin } from '@/lib/supabase'

const EventSchema = z.object({
  eventId: z.string().min(4),
  type: z.enum(JOB_TYPES),
  input: z.record(z.string(), z.unknown()).default({}),
  idempotencyKey: z.string().min(8),
})

export async function POST(request: NextRequest) {
  const secret = process.env.MARKETING_OS_N8N_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: 'Webhook is not configured' }, { status: 503 })
  const raw = await request.text()
  const received = request.headers.get('x-kealee-signature') ?? ''
  const expected = createHmac('sha256', secret).update(raw).digest('hex')
  const valid = /^[a-f0-9]{64}$/i.test(received)
    && timingSafeEqual(Buffer.from(received, 'hex'), Buffer.from(expected, 'hex'))
  let payload: unknown
  try {
    payload = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }
  const parsed = EventSchema.safeParse(payload)

  if (parsed.success) {
    await getSupabaseAdmin().from('marketing_os_webhook_events').upsert({
      provider: 'n8n',
      event_id: parsed.data.eventId,
      event_type: parsed.data.type,
      signature_valid: valid,
      payload: parsed.data,
    }, { onConflict: 'provider,event_id' })
  }
  if (!valid) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  try {
    const queued = await enqueueMarketingJob({
      type: parsed.data.type,
      actorId: 'n8n',
      input: parsed.data.input,
      idempotencyKey: parsed.data.idempotencyKey,
      approvalMode: 'risk_based',
    })
    await getSupabaseAdmin().from('marketing_os_webhook_events').update({
      processed_at: new Date().toISOString(),
    }).eq('provider', 'n8n').eq('event_id', parsed.data.eventId)
    return NextResponse.json(queued, { status: 202 })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await getSupabaseAdmin().from('marketing_os_webhook_events').update({
      processing_error: message,
    }).eq('provider', 'n8n').eq('event_id', parsed.data.eventId)
    return NextResponse.json({ error: message }, { status: 503 })
  }
}
