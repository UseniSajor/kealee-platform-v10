import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

const escapeHtml = (value: unknown) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;')

export async function GET(_request: Request, { params }: { params: Promise<{ intakeId: string }> }) {
  const cookieStore = cookies()
  const sessionClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await sessionClient.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { intakeId } = await params
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
  const { data, error } = await admin
    .from('public_intake_leads')
    .select('id, client_name, contact_email, project_address, form_data')
    .eq('id', intakeId)
    .eq('contact_email', user.email.toLowerCase())
    .eq('project_path', 'home-project-readiness-review')
    .single()
  if (error || !data) return NextResponse.json({ error: 'Report not found' }, { status: 404 })

  const report = (data.form_data as { projectClarityReport?: {
    title?: string
    preparedAt?: string
    projectSummary?: string
    readinessStatus?: string
    observations?: string[]
    recommendedServices?: Array<{ name: string; reason: string }>
    nextActions?: string[]
  } })?.projectClarityReport
  if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 })

  const list = (items: string[] = []) => `<ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(report.title)}</title><style>body{font-family:Arial,sans-serif;color:#10233e;max-width:820px;margin:48px auto;padding:0 28px;line-height:1.55}h1,h2{color:#0f766e}section{border:1px solid #99d5cc;border-radius:14px;padding:18px;margin:18px 0}small{color:#64748b}li{margin:8px 0}.status{background:#fef9c3;border-color:#eab308}</style></head><body><small>Kealee · Free Project Clarity Review</small><h1>${escapeHtml(report.title)}</h1><p><strong>Prepared for:</strong> ${escapeHtml(data.client_name)}<br><strong>Property:</strong> ${escapeHtml(data.project_address)}<br><strong>Prepared:</strong> ${escapeHtml(report.preparedAt)}</p><section class="status"><h2>Readiness status</h2><p>${escapeHtml(report.readinessStatus)}</p></section><section><h2>Project summary</h2><p>${escapeHtml(report.projectSummary)}</p></section><section><h2>What we found</h2>${list(report.observations)}</section><section><h2>Recommended Kealee services</h2>${(report.recommendedServices ?? []).map(service => `<h3>${escapeHtml(service.name)}</h3><p>${escapeHtml(service.reason)}</p>`).join('')}</section><section><h2>Next actions</h2>${list(report.nextActions)}</section></body></html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="kealee-project-clarity-${intakeId}.html"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
