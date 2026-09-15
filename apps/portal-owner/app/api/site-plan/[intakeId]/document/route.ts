/**
 * GET /api/site-plan/:intakeId/document
 *
 * Serves the customer's site-plan PDF.
 *
 * The engine stores the rendered sheet set in the `documents` table with
 * `projectId = intakeId` and a `site-plan*` category, bytes base64-encoded in
 * `content` (see services/worker/src/siteplan/capabilities.ts). The only
 * other reader was the engineer-review route on web-main; the customer who
 * paid for the plan had no way to open it.
 *
 * Access is the same rule as every other package: the signed-in Clerk email
 * must match the order's contact email and the order must be paid.
 */
import { createClient } from '@supabase/supabase-js'
import { verifyIntakeAccessForSession } from '@/lib/verify-intake-access'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: { intakeId: string } },
) {
  const { intakeId } = params
  if (!intakeId) return Response.json({ error: 'Missing intakeId' }, { status: 400 })

  const access = await verifyIntakeAccessForSession(intakeId)
  if (!access.ok) return Response.json({ error: access.error }, { status: access.status })

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  // Prefer the document the delivery record names; fall back to the newest
  // site-plan document on the project so a record written before the id was
  // recorded still resolves.
  const { data: intake } = await supabaseAdmin
    .from('public_intake_leads')
    .select('form_data')
    .eq('id', intakeId)
    .single()
  const deliverable = (intake?.form_data as Record<string, unknown> | null)?.sitePlanDeliverable as
    | { document?: { id?: string } }
    | undefined
  const preferredId = deliverable?.document?.id

  let query = supabaseAdmin
    .from('documents')
    .select('id, name, content, fileUrl, format')
    .eq('projectId', intakeId)
    .like('category', 'site-plan%')
    .order('createdAt', { ascending: false })
    .limit(1)
  if (preferredId) query = query.eq('id', preferredId)

  let { data: docs } = await query
  if ((!docs || docs.length === 0) && preferredId) {
    ;({ data: docs } = await supabaseAdmin
      .from('documents')
      .select('id, name, content, fileUrl, format')
      .eq('projectId', intakeId)
      .like('category', 'site-plan%')
      .order('createdAt', { ascending: false })
      .limit(1))
  }

  const doc = docs?.[0]
  if (!doc) return Response.json({ error: 'Your site plan is not available yet.' }, { status: 404 })

  const content = (doc.content ?? {}) as { encoding?: string; data?: string }
  if (content.encoding !== 'base64' || !content.data) {
    if (doc.fileUrl) return Response.redirect(doc.fileUrl)
    return Response.json({ error: 'Site plan content is unavailable.' }, { status: 409 })
  }

  const filename = String(doc.name || `site-plan-${intakeId}.pdf`).replace(/[^a-zA-Z0-9._-]/g, '-')
  return new Response(Buffer.from(content.data, 'base64'), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
