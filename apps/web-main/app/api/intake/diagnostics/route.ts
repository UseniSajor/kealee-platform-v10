/**
 * GET /api/intake/diagnostics?intakeId=<uuid>
 *
 * Ops / smoke: confirm design-intake → Stripe → webhook → concept engine pipeline
 * without relying on email. Requires shared secret header.
 *
 * Example:
 *   curl -sS -H "x-kealee-ops: $KEALEE_OPS_SECRET" \
 *     "https://kealee.com/api/intake/diagnostics?intakeId=<uuid>" | jq .
 *
 * Expect after successful payment + generation:
 *   - status: "paid" then webhook may still show paid; concept engine sets status "concept_ready"
 *   - hasConceptOutput: true when /api/concept/generate completed
 */

import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { SERVICE_DELIVERABLES } from '@/lib/service-deliverables'

function opsAuthOk(req: NextRequest): boolean {
  const secret = process.env.KEALEE_OPS_SECRET ?? ''
  if (!secret) return false
  const header = req.headers.get('x-kealee-ops') ?? ''
  try {
    const a = Buffer.from(header, 'utf8')
    const b = Buffer.from(secret, 'utf8')
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  if (!process.env.KEALEE_OPS_SECRET) {
    return NextResponse.json(
      {
        error: 'KEALEE_OPS_SECRET not set',
        message: 'Set KEALEE_OPS_SECRET in Vercel (Production) to enable diagnostics.',
      },
      { status: 501 }
    )
  }

  if (!opsAuthOk(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const intakeId = req.nextUrl.searchParams.get('intakeId')?.trim()
  if (!intakeId) {
    return NextResponse.json({ error: 'intakeId query parameter is required' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  const { data: row, error } = await supabase
    .from('public_intake_leads')
    .select('id, status, project_path, form_data, updated_at, created_at')
    .eq('id', intakeId)
    .maybeSingle()

  if (error) {
    console.error('[intake/diagnostics]', error.message)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  if (!row) {
    return NextResponse.json({ error: 'Intake not found', intakeId }, { status: 404 })
  }

  const formData = (row.form_data as Record<string, unknown> | null) ?? {}
  const conceptOutput = formData.conceptOutput

  const projectPath = row.project_path as string
  const deliverable = projectPath ? SERVICE_DELIVERABLES[projectPath as keyof typeof SERVICE_DELIVERABLES] : undefined

  return NextResponse.json({
    intakeId: row.id,
    status: row.status,
    projectPath: row.project_path,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    hasConceptOutput: Boolean(conceptOutput),
    conceptGeneratedAt: typeof formData.conceptGeneratedAt === 'string' ? formData.conceptGeneratedAt : null,
    deliverableGeneratesConcept: Boolean(deliverable?.generatesConcept),
    checks: {
      anthropicApiKeyConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
      supabaseConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL),
      stripeWebhookPath: '/api/webhooks/stripe',
    },
    pipelineNotes: [
      'After Stripe Checkout, Stripe sends checkout.session.completed to /api/webhooks/stripe (production URL only).',
      'The success page also POSTs /api/concept/generate for packages with generatesConcept (redundant with webhook trigger).',
      'status "concept_ready" and hasConceptOutput true mean the concept engine wrote output to form_data.',
    ],
  })
}
