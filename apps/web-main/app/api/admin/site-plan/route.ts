/**
 * GET  /api/admin/site-plan            — every site-plan order with its workflow state
 * POST /api/admin/site-plan            — { intakeId } activate (or resume) the engine
 *                                        workflow for a paid site-plan order
 *
 * Activation normally happens in the Stripe webhook. Orders paid before that
 * existed, or whose activation FAILED, have no workflow and sit in the manual
 * queue forever; this is how staff start them. It calls the same entry point
 * the webhook calls, so a paid order gets exactly the treatment a new one
 * would — nothing is hand-written into the workflow tables.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireCommandCenterApi } from '@/lib/command-center-api-auth'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { prisma } from '@kealee/database'
import { isSitePlanOrder } from '@/lib/site-plan-rules'
import { activateSitePlanForOrder, sitePlanWorkflowFormData } from '@/lib/site-plan-workflow'

export const dynamic = 'force-dynamic'

const SITE_PLAN_PATHS = ['preliminary_site_plan', 'verified_site_feasibility', 'permit_site_plan']
const PAID = ['paid', 'processing', 'concept_ready', 'delivered']

export interface AdminSitePlanRow {
  intakeId: string
  productKey: string
  clientName: string | null
  contactEmail: string | null
  projectAddress: string | null
  status: string
  orderStatus: string | null
  fulfillmentStatus: string | null
  paidAt: string | null
  workflowId: string | null
  workflowDisposition: string | null
  currentStage: string | null
  workflowStatus: string | null
  delivered: boolean
  reviewState: string | null
  submissionState: string | null
  countyCommentCount: number
  countyCommentsIngested: number
}

export async function GET(req: NextRequest) {
  const denied = await requireCommandCenterApi(req)
  if (denied) return denied

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('public_intake_leads')
    .select('id, project_path, client_name, contact_email, project_address, status, paid_at, form_data')
    .in('project_path', SITE_PLAN_PATHS)
    .in('status', PAID)
    .order('paid_at', { ascending: false })
    .limit(200)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const ids = (data ?? []).map(r => r.id as string)
  const workflows = ids.length
    ? await prisma.sitePlanWorkflow.findMany({
        where: { orderId: { in: ids } },
        select: { id: true, orderId: true, currentStage: true, status: true },
      })
    : []
  const byOrder = new Map(workflows.map(w => [w.orderId, w]))

  const rows: AdminSitePlanRow[] = (data ?? []).map(r => {
    const fd = (r.form_data ?? {}) as Record<string, unknown>
    const wf = byOrder.get(r.id as string)
    const comments = Array.isArray(fd.sitePlanCountyComments) ? fd.sitePlanCountyComments.length : 0
    const ingested = Array.isArray(fd.sitePlanCountyCommentsIngested) ? fd.sitePlanCountyCommentsIngested.length : 0
    return {
      intakeId: r.id as string,
      productKey: r.project_path as string,
      clientName: (r.client_name as string) ?? null,
      contactEmail: (r.contact_email as string) ?? null,
      projectAddress: (r.project_address as string) ?? null,
      status: r.status as string,
      orderStatus: (fd.orderStatus as string) ?? null,
      fulfillmentStatus: (fd.fulfillmentStatus as string) ?? null,
      paidAt: (r.paid_at as string) ?? null,
      workflowId: wf?.id ?? (fd.sitePlanWorkflowId as string) ?? null,
      workflowDisposition: (fd.sitePlanWorkflowDisposition as string) ?? null,
      currentStage: wf ? String(wf.currentStage) : null,
      workflowStatus: wf ? String(wf.status) : null,
      delivered: Boolean(fd.sitePlanDeliverable),
      reviewState: ((fd.sitePlanReview as { state?: string })?.state) ?? null,
      submissionState: ((fd.sitePlanSubmission as { state?: string })?.state) ?? null,
      countyCommentCount: comments,
      countyCommentsIngested: ingested,
    }
  })

  return NextResponse.json({ rows })
}

export async function POST(req: NextRequest) {
  const denied = await requireCommandCenterApi(req)
  if (denied) return denied

  const body = (await req.json().catch(() => ({}))) as { intakeId?: unknown }
  const intakeId = typeof body.intakeId === 'string' ? body.intakeId : ''
  if (!intakeId) return NextResponse.json({ error: 'intakeId required' }, { status: 400 })

  const supabase = getSupabaseAdmin()
  const { data: intake } = await supabase
    .from('public_intake_leads')
    .select('id, project_path, status, form_data')
    .eq('id', intakeId)
    .maybeSingle()
  if (!intake) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  const projectPath = intake.project_path as string
  if (!isSitePlanOrder(projectPath)) {
    return NextResponse.json({ error: `${projectPath} is not a site-plan product` }, { status: 400 })
  }
  if (!PAID.includes(intake.status as string)) {
    return NextResponse.json({ error: `Order is ${intake.status}; only paid orders are activated` }, { status: 409 })
  }

  const formData = (intake.form_data ?? {}) as Record<string, unknown>
  const activation = await activateSitePlanForOrder({
    projectId: intakeId,
    orderId: intakeId,
    productId: projectPath,
    isSitePlan: true,
    formData,
  })

  await supabase
    .from('public_intake_leads')
    .update({
      form_data: {
        ...formData,
        ...sitePlanWorkflowFormData(activation),
        sitePlanActivatedByStaffAt: new Date().toISOString(),
      },
    })
    .eq('id', intakeId)

  return NextResponse.json({
    intakeId,
    disposition: activation.disposition,
    workflowId: activation.workflowId,
    enqueued: activation.enqueued,
    summary: activation.summary,
  }, { status: activation.disposition === 'FAILED' ? 500 : 200 })
}
