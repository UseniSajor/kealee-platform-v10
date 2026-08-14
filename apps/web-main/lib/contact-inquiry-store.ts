import { getSupabaseAdmin } from '@/lib/supabase-server'

export interface ContactInquiryInput {
  name: string
  email: string
  phone?: string | null
  source: string
  budgetRange?: string | null
  timeline?: string | null
  message: string
  metadata?: Record<string, unknown>
}

/**
 * Persists a contact inquiry to the shared `contact_inquiries` table
 * (same table used by /api/intake/lead, /api/intake/soft-capture, and
 * /api/design-professionals/register). Never throws — returns false on
 * any DB failure so callers can degrade gracefully.
 */
export async function storeContactInquiry(input: ContactInquiryInput): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from('contact_inquiries').insert({
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      message: input.message,
      budget_range: input.budgetRange ?? null,
      timeline: input.timeline ?? null,
      source: input.source,
      metadata: input.metadata ?? {},
    })

    if (error) {
      console.warn('[contact-inquiry-store] insert failed:', error.message)
      return false
    }

    return true
  } catch (err) {
    console.warn('[contact-inquiry-store] DB unavailable:', err)
    return false
  }
}
