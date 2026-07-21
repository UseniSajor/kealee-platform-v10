import { getSupabaseAdmin } from '@/lib/supabase-server'

interface ContactInquiryInput {
  name: string
  email: string
  phone?: string | null
  message?: string | null
  source: string
  budgetRange?: string | null
  timeline?: string | null
  metadata?: Record<string, unknown>
}

/**
 * Stores contact leads in contact_inquiries when available. Older production
 * schemas do not have that table, so fall back to public_intake_leads instead
 * of silently dropping the lead.
 */
export async function storeContactInquiry(input: ContactInquiryInput): Promise<boolean> {
  const supabase = getSupabaseAdmin()
  const metadata = {
    ...(input.metadata ?? {}),
    inquirySource: input.source,
    inquiryMessage: input.message ?? null,
    inquiryTimeline: input.timeline ?? null,
  }

  const { error: inquiryError } = await supabase.from('contact_inquiries').insert({
    name: input.name,
    email: input.email,
    phone: input.phone ?? null,
    message: input.message ?? null,
    budget_range: input.budgetRange ?? null,
    timeline: input.timeline ?? null,
    source: input.source,
    metadata,
  })

  if (!inquiryError) return true
  if (inquiryError.code !== 'PGRST205' && !inquiryError.message.includes('contact_inquiries')) {
    console.warn('[contact-inquiry] primary insert failed:', inquiryError.message)
  }

  const { error: fallbackError } = await supabase.from('public_intake_leads').insert({
    project_path: input.source.replace(/[^a-z0-9]+/gi, '_').toLowerCase(),
    client_name: input.name || 'Prospective client',
    contact_email: input.email,
    contact_phone: input.phone ?? null,
    project_address: 'Not provided',
    budget_range: input.budgetRange ?? 'Not provided',
    source: input.source,
    status: 'new',
    requires_payment: false,
    payment_amount: 0,
    metadata,
  })

  if (fallbackError) {
    console.error('[contact-inquiry] fallback insert failed:', fallbackError.message)
    return false
  }

  return true
}
