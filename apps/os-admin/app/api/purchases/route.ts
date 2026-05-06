import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function GET() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ purchases: [], live: false })
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })

  const { data, error } = await supabase
    .from('public_intake_leads')
    .select('id, project_path, client_name, contact_email, contact_phone, project_address, status, payment_amount, created_at, form_data')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    return NextResponse.json({ purchases: [], live: false, error: error.message })
  }

  return NextResponse.json({ purchases: data ?? [], live: true })
}
