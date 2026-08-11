import { NextRequest, NextResponse } from 'next/server'
import { storeContactInquiry } from '@/lib/contact-inquiry-store'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { getOwnerPortalBaseUrl } from '@/lib/owner-portal-urls'
import { buildProjectClarityReport } from '@/lib/project-clarity-report'

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const name = String(form.get('name') ?? '').trim()
  const email = String(form.get('email') ?? '').trim().toLowerCase()
  const address = String(form.get('address') ?? '').trim()
  const projectDescription = String(form.get('projectDescription') ?? '').trim()
  const serviceKey = String(form.get('serviceKey') ?? 'project-planning').trim()
  const serviceName = String(form.get('serviceName') ?? serviceKey).trim()
  if (!name || !email || !address || !projectDescription || form.get('consent') !== 'yes') return NextResponse.json({ error: 'Please complete the required fields and contact consent.' }, { status: 400 })
  if (serviceKey === 'home-project-readiness-review') {
    const intakeId = crypto.randomUUID()
    const budgetRange = String(form.get('budgetRange') ?? '')
    const timeline = String(form.get('timeline') ?? '')
    const report = buildProjectClarityReport({ address, projectDescription, budgetRange, timeline })
    const { error } = await getSupabaseAdmin().from('public_intake_leads').insert({
      id: intakeId,
      project_path: 'home-project-readiness-review',
      client_name: name,
      contact_email: email,
      contact_phone: String(form.get('phone') ?? '') || null,
      project_address: address,
      budget_range: budgetRange || 'Not provided',
      source: 'free_project_clarity_review',
      status: 'concept_ready',
      requires_payment: false,
      payment_amount: 0,
      form_data: { projectDescription, timeline, projectClarityReport: report, paymentTaken: false },
      metadata: { serviceKey, serviceName, freeEntryService: true, feedsPaidPlatformServices: true },
    })
    if (error) return NextResponse.json({ error: 'The free report could not be saved.' }, { status: 500 })
    const downloadPath = `/api/project-clarity/${intakeId}/download`
    const portalDownloadUrl = `${getOwnerPortalBaseUrl()}/login?next=${encodeURIComponent(downloadPath)}`
    return NextResponse.json({ ok: true, intakeId, report, portalDownloadUrl })
  }
  const ok = await storeContactInquiry({ name, email, phone: String(form.get('phone') ?? '') || null, source: `service_request_${serviceKey}`, budgetRange: String(form.get('budgetRange') ?? '') || null, timeline: String(form.get('timeline') ?? '') || null, message: projectDescription, metadata: { serviceKey, serviceName, projectAddress: address, contactPreference: String(form.get('contactPreference') ?? 'Email'), productionStatus: 'NEW_REQUEST', automationAllowed: false, architectureVersion: 'v30', executionMode: 'manual_controlled', paymentTaken: false } })
  if (!ok) return NextResponse.json({ error: 'The request could not be saved.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
