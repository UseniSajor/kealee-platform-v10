import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const PAID_STATUSES = new Set(['paid', 'concept_ready', 'processing', 'delivered'])

export async function verifyIntakeAccessForSession(intakeId: string): Promise<
  | { ok: true; email: string }
  | { ok: false; status: number; error: string }
> {
  const cookieStore = cookies()
  const supabaseSession = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    },
  )

  const { data: { session } } = await supabaseSession.auth.getSession()
  if (!session?.user?.email) {
    return { ok: false, status: 401, error: 'Authentication required' }
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  const { data: intake, error } = await supabaseAdmin
    .from('public_intake_leads')
    .select('id, contact_email, status, form_data')
    .eq('id', intakeId)
    .single()

  if (error || !intake) {
    return { ok: false, status: 404, error: 'Intake not found' }
  }

  const contactEmail = (intake.contact_email as string | null)?.toLowerCase()
  if (contactEmail && contactEmail !== session.user.email.toLowerCase()) {
    return { ok: false, status: 403, error: 'Access denied' }
  }

  if (!PAID_STATUSES.has(intake.status as string)) {
    return { ok: false, status: 402, error: 'Payment required' }
  }

  return { ok: true, email: session.user.email }
}

export async function loadIntakeForPdf(intakeId: string) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  const { data: intake, error } = await supabaseAdmin
    .from('public_intake_leads')
    .select(
      'id, project_path, client_name, contact_email, contact_phone, project_address, budget_range, status, form_data',
    )
    .eq('id', intakeId)
    .single()

  if (error || !intake) return null
  return intake
}
