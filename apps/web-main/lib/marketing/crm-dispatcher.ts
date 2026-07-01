import { createOrUpdateContact as createOrUpdateGhlContact } from './ghl-client'
import { isGhlEnabled } from './ghl-enabled'
import { isEnterpriseCrmEnabled } from './crm-enterprise'
import { createOrUpdateContact as createOrUpdateHubspotContact, HubSpotContact } from './hubspot-client'

export interface CrmSyncInput {
  leadId: string
  email: string
  name?: string
  phone?: string
  source?: string
  serviceType?: string
  budget?: string | number
  timeline?: string
  score?: number
  tag?: string
  tags?: string[]
  customFields?: Record<string, string>
}

export interface CrmSyncResult {
  hubspot?: { id?: string; success: boolean; error?: string }
  ghl?: { id?: string; success: boolean; error?: string }
}

/**
 * Parse a budget string (e.g. "$5,000 - $10,000", "10k-20k", "under 50k", "$15,000")
 * and extract a clean numeric value (typically the lower bound or only value).
 */
export function parseBudgetRange(budgetString: string | number | undefined | null): number | undefined {
  if (budgetString === undefined || budgetString === null) return undefined
  if (typeof budgetString === 'number') return budgetString

  const str = budgetString.trim().toLowerCase()
  if (!str) return undefined

  // Replace abbreviations like "k" with "000"
  // E.g., "10k-20k" -> "10000-20000"
  let cleaned = str.replace(/(\d+)\s*k/g, '$1000')

  // Find all numeric groups
  const matches = cleaned.match(/\d[\d,.]*/g)
  if (!matches || matches.length === 0) return undefined

  // Parse first match as number (stripping commas/decimals)
  const numbers = matches.map(m => parseInt(m.replace(/[,.]/g, ''), 10)).filter(n => !isNaN(n))
  if (numbers.length === 0) return undefined

  return numbers[0]
}

/**
 * Synchronize a lead dynamically to both GoHighLevel and HubSpot CRM systems
 * depending on what API credentials are configured in the environment.
 */
export async function syncLeadToCrms(input: CrmSyncInput): Promise<CrmSyncResult> {
  if (!isEnterpriseCrmEnabled()) {
    return {}
  }

  const result: CrmSyncResult = {}
  const firstName = input.name ? input.name.split(' ')[0] : undefined
  const lastName = input.name ? input.name.split(' ').slice(1).join(' ') : undefined
  const cleanBudget = parseBudgetRange(input.budget)

  // ── 1. Sync to GoHighLevel (GHL) if enabled ─────────────────────────────
  if (isGhlEnabled()) {
    try {
      const ghlCustomFields = [
        { key: 'lead_source', field_value: input.source || 'kealee-web' },
        { key: 'kealee_intake_id', field_value: input.leadId },
        { key: 'budget', field_value: input.budget ? String(input.budget) : 'N/A' },
        { key: 'timeline', field_value: input.timeline || 'N/A' },
      ]

      // Add custom fields if provided
      if (input.customFields) {
        for (const [key, value] of Object.entries(input.customFields)) {
          ghlCustomFields.push({ key, field_value: value })
        }
      }

      const ghlContact = await createOrUpdateGhlContact({
        email: input.email,
        firstName,
        lastName,
        phone: input.phone,
        source: input.source,
        tags: [
          input.source || 'kealee-web',
          input.tag || 'pending',
          input.serviceType || 'unknown',
          ...(input.tags ?? []),
        ],
        customFields: ghlCustomFields,
      })

      if (ghlContact) {
        result.ghl = { id: ghlContact.id, success: true }
      } else {
        result.ghl = { success: false, error: 'GHL contact sync returned null' }
      }
    } catch (err) {
      console.error('CRM Dispatcher GHL Sync error:', err)
      result.ghl = { success: false, error: err instanceof Error ? err.message : String(err) }
    }
  }

  // ── 2. Sync to HubSpot if enterprise CRM + configured ───────────────────
  const hubspotKey = process.env.HUBSPOT_API_KEY || process.env.HUBSPOT_ACCESS_TOKEN
  if (isEnterpriseCrmEnabled() && hubspotKey?.trim()) {
    try {
      const hsProperties: HubSpotContact = {
        email: input.email,
        firstname: firstName,
        lastname: lastName,
        phone: input.phone,
        lead_source: input.source || 'kealee-web',
        hs_lead_status: input.tag,
        lifecyclestage: input.tag === 'hot' ? 'subscriber' : 'lead',
        budget: cleanBudget ? `$${cleanBudget}` : 'N/A',
        timeline: input.timeline || 'N/A',
        project_type: input.serviceType || 'unknown',
        lead_score: input.score,
        hot_lead: input.tag === 'hot',
        kealee_intake_id: input.leadId,
      }

      // Add custom fields to properties if provided
      if (input.customFields) {
        for (const [key, value] of Object.entries(input.customFields)) {
          hsProperties[key] = value
        }
      }

      const hsContact = await createOrUpdateHubspotContact(input.email, hsProperties)
      if (hsContact) {
        result.hubspot = { id: hsContact.id, success: true }
      } else {
        result.hubspot = { success: false, error: 'HubSpot contact sync returned null' }
      }
    } catch (err) {
      console.error('CRM Dispatcher HubSpot Sync error:', err)
      result.hubspot = { success: false, error: err instanceof Error ? err.message : String(err) }
    }
  }

  return result
}
