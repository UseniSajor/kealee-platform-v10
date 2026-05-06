import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

// Severity mapping by intake status
function statusToSeverity(status: string): string {
  if (status === 'paid') return 'success'
  if (status === 'processing') return 'info'
  if (status === 'error') return 'error'
  return 'info'
}

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Graceful fallback if env vars aren't set
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ events: [], live: false })
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })

  const { data, error } = await supabase
    .from('public_intake_leads')
    .select('id, project_path, client_name, contact_email, status, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ events: [], live: false, error: error.message })
  }

  const events = (data ?? []).map((intake: {
    id: string
    project_path: string
    client_name: string
    contact_email: string
    status: string
    created_at: string
  }) => {
    const label = intake.project_path.replace(/_/g, ' ')
    const isPaid = intake.status === 'paid'
    return {
      id: intake.id,
      timestamp: intake.created_at,
      source: isPaid ? 'stripe' : 'web',
      type: isPaid ? 'webhook' : 'intake',
      message: isPaid
        ? `checkout.session.completed — ${label} · ${intake.client_name}`
        : `New intake submitted: ${label} · ${intake.client_name}`,
      severity: statusToSeverity(intake.status),
    }
  })

  return NextResponse.json({ events, live: true })
}
