/**
 * GET /api/intake/diagnostics?intakeId=<uuid>
 *
 * Ops / smoke: confirm design-intake → Stripe → webhook → concept engine pipeline
 * without relying on email. Auth uses **KEALEE_OPS_SECRET** if set; otherwise the
 * same **CRON_SECRET** as `/api/cron/*` (so you do not need a new Vercel variable
 * if cron is already configured).
 *
 * Example:
 *   curl -sS -H "x-kealee-ops: $CRON_SECRET" \
 *     "https://kealee.com/api/intake/diagnostics?intakeId=<uuid>" | jq .
 *
 * Or Bearer (matches cron style):
 *   curl -sS -H "Authorization: Bearer $CRON_SECRET" "https://kealee.com/api/intake/diagnostics?intakeId=<uuid>"
 *
 * Expect after successful payment + generation:
 *   - status: "paid" then webhook may still show paid; concept engine sets status "concept_ready"
 *   - hasConceptOutput: true when /api/concept/generate completed
 */

import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { SERVICE_DELIVERABLES } from '@/lib/service-deliverables'

function timingSafeEqualString(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, 'utf8')
    const bufB = Buffer.from(b, 'utf8')
    if (bufA.length !== bufB.length) return false
    return timingSafeEqual(bufA, bufB)
  } catch {
    return false
  }
}

/** Distinct non-empty secrets allowed to call diagnostics (ops-only). */
function diagnosticsAuthSecrets(): string[] {
  const raw = [process.env.KEALEE_OPS_SECRET, process.env.CRON_SECRET].filter(
    (s): s is string => Boolean(s && s.trim())
  )
  return [...new Set(raw)]
}

function diagnosticsAuthConfigured(): boolean {
  return diagnosticsAuthSecrets().length > 0
}

function opsAuthOk(req: NextRequest): boolean {
  const secrets = diagnosticsAuthSecrets()
  if (secrets.length === 0) return false

  const header = req.headers.get('x-kealee-ops') ?? ''
  if (header && secrets.some(s => timingSafeEqualString(header, s))) {
    return true
  }

  const auth = req.headers.get('authorization') ?? ''
  const m = /^Bearer\s+(.+)$/i.exec(auth)
  const bearer = m?.[1]?.trim() ?? ''
  if (bearer && secrets.some(s => timingSafeEqualString(bearer, s))) {
    return true
  }

  return false
}

export async function GET(req: NextRequest) {
  if (!diagnosticsAuthConfigured()) {
    return NextResponse.json(
      {
        error: 'Diagnostics auth not configured',
        message:
          'Set CRON_SECRET (already used by /api/cron/*) or optionally KEALEE_OPS_SECRET in Vercel Production for web-main.',
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
