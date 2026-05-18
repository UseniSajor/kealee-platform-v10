/**
 * GET /api/deliverables
 *
 * Returns the authenticated user's concept deliverables from
 * public_intake_leads (filtered by contact_email from the Supabase session).
 * Uses service_role key to bypass RLS.
 */
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function GET() {
  // ── Get authenticated user from session ─────────────────────────────────────
  const cookieStore = cookies()
  const supabaseSession = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )

  const { data: { session } } = await supabaseSession.auth.getSession()

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userEmail = session.user.email

  // ── Query public_intake_leads by contact_email ──────────────────────────────
  const { data, error } = await supabaseAdmin
    .from('public_intake_leads')
    .select('id, client_name, project_path, status, budget_range, project_address, created_at, updated_at, form_data')
    .eq('contact_email', userEmail)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // ── Shape response — extract conceptOutput summary from form_data ───────────
  const deliverables = (data ?? []).map((row: any) => {
    const fd  = (row.form_data ?? {}) as Record<string, any>
    const co  = (fd.conceptOutput ?? null) as Record<string, any> | null

    return {
      id:              row.id,
      clientName:      row.client_name,
      projectPath:     row.project_path,
      projectLabel:    (row.project_path as string)
                         ?.replace(/_/g, ' ')
                         ?.replace(/\b\w/g, (c: string) => c.toUpperCase()) ?? 'Project',
      address:         row.project_address ?? fd.projectAddress ?? null,
      budgetRange:     row.budget_range ?? fd.budgetRange ?? null,
      status:          row.status as string,
      createdAt:       row.created_at,
      updatedAt:       row.updated_at,
      // Concept package fields (populated after generation)
      conceptPackageId: co?.conceptPackageId ?? null,
      pdfUrl:           co?.pdfUrl ?? null,
      generatedAt:      co?.generatedAt ?? null,
    }
  })

  return NextResponse.json({ deliverables })
}
