/**
 * GET /api/site-plan/:intakeId/document[?documentId=<id>]
 *
 * Serves the customer's site-plan PDF, or — with `documentId` — one of the
 * engineering data exports (DXF, LandXML, GeoJSON) the render stage produced
 * beside it.
 *
 * `documentId` is always intersected with `projectId = intakeId`, so it can
 * only ever reach a document belonging to the order the caller has already
 * been authorised for. It is a selector within that order, never a way out of
 * it.
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

/** Content type from the stored filename. The `documents` row does not carry one. */
function contentTypeFor(filename: string): { type: string; inline: boolean } {
  const lower = filename.toLowerCase()
  if (lower.endsWith('.dxf')) return { type: 'image/vnd.dxf', inline: false }
  if (lower.endsWith('.geojson')) return { type: 'application/geo+json', inline: false }
  if (lower.endsWith('.xml')) return { type: 'application/xml', inline: false }
  return { type: 'application/pdf', inline: true }
}

export async function GET(
  req: Request,
  { params }: { params: { intakeId: string } },
) {
  const { intakeId } = params
  const requestedDocumentId = new URL(req.url).searchParams.get('documentId')
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
  const preferredId = requestedDocumentId ?? deliverable?.document?.id

  let query = supabaseAdmin
    .from('documents')
    .select('id, name, content, fileUrl, format')
    .eq('projectId', intakeId)
    .like('category', 'site-plan%')
    .order('createdAt', { ascending: false })
    .limit(1)
  if (preferredId) query = query.eq('id', preferredId)

  let { data: docs } = await query
  if ((!docs || docs.length === 0) && requestedDocumentId) {
    // An explicit request that does not resolve is a 404. Falling back to the
    // PDF here would hand back a different file under the name of the one
    // that was asked for.
    return Response.json({ error: 'That file is not part of this order.' }, { status: 404 })
  }
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
  const { type, inline } = contentTypeFor(filename)
  return new Response(Buffer.from(content.data, 'base64'), {
    headers: {
      'Content-Type': type,
      // A CAD file rendered inline is a wall of text. It downloads.
      'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
