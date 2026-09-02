import { requireAssignedReview, reviewDb } from '@/lib/engineer-review'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workflowId: string; documentId: string }> },
) {
  const { workflowId, documentId } = await params
  try {
    const { assignment } = await requireAssignedReview(workflowId)
    if (!['ACTIVE', 'REVISION_REQUIRED', 'COMPLETED'].includes(assignment.status)) {
      return Response.json({ error: 'Review assignment is not active.' }, { status: 403 })
    }

    const workflow = await reviewDb.sitePlanWorkflow.findUnique({
      where: { id: workflowId }, select: { projectId: true },
    })
    const document = await reviewDb.document.findFirst({
      where: { id: documentId, projectId: workflow?.projectId, category: { startsWith: 'site-plan' } },
    })
    if (!document) return Response.json({ error: 'Document not found.' }, { status: 404 })

    const content = (document.content ?? {}) as { encoding?: string; data?: string }
    if (content.encoding !== 'base64' || !content.data) {
      if (document.fileUrl) return Response.redirect(document.fileUrl)
      return Response.json({ error: 'Document content is unavailable.' }, { status: 409 })
    }
    const filename = String(document.name).replace(/[^a-zA-Z0-9._-]/g, '-')
    return new Response(Buffer.from(content.data, 'base64'), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch {
    return Response.json({ error: 'Not authorized for this review.' }, { status: 403 })
  }
}
