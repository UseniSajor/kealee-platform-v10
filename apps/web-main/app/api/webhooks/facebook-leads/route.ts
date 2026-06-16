/**
 * Facebook Lead Ads Integration
 *
 * Phase 3: Native sync from Facebook → GHL (bypassing Supabase middleman for speed)
 *
 * Webhook from Meta receives lead form submissions and:
 * 1. Creates GHL contact with all lead fields
 * 2. Tags with service type + lead source
 * 3. Initiates GHL SMS workflow if configured
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { triggerWorkflow } from '@/lib/marketing/ghl-client'
import { isGhlEnabled } from '@/lib/marketing/ghl-enabled'
import { calculateLeadScore } from '@/lib/marketing/lead-scorer'
import { parseBudgetRange, syncLeadToCrms } from '@/lib/marketing/crm-dispatcher'

export const dynamic = 'force-dynamic'

const FACEBOOK_PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN ?? ''
const META_WEBHOOK_VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN ?? ''
const GHL_WORKFLOW_ID_SMS_QUAL = process.env.GHL_WORKFLOW_ID_SMS_QUAL ?? ''

export interface FacebookLeadData {
  email: string
  first_name: string
  last_name: string
  phone_number: string
  service_type?: string    // 'concept' | 'estimate' | 'permit'
  budget?: string
  timeline?: string
  form_name?: string       // Form ID from Meta
}

/**
 * POST /api/webhooks/facebook-leads
 *
 * Receives webhook from Facebook Lead Ads form submission
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Verify webhook signature (optional, recommended for production)
    const signature = req.headers.get('x-hub-signature-256') || ''
    if (META_WEBHOOK_VERIFY_TOKEN) {
      if (!verifyMetaWebhook(body, signature)) {
        console.warn('Facebook webhook signature mismatch')
        return NextResponse.json(
          { error: 'Signature mismatch' },
          { status: 401 }
        )
      }
    }

    // Handle webhook challenge (subscription verification)
    if (body.challenge) {
      return NextResponse.json({ challenge: body.challenge })
    }

    // Process lead submission
    const { entry } = body
    if (!entry || !Array.isArray(entry)) {
      return NextResponse.json({ received: false }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let processed = 0
    for (const e of entry) {
      for (const messaging of e.messaging || []) {
        const leadData = extractLeadData(messaging)
        if (leadData) {
          const result = await processFacebookLead(supabase, leadData)
          if (result) processed++
        }
      }
    }

    return NextResponse.json({
      received: true,
      processed,
    })
  } catch (err) {
    console.error('Facebook webhook error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}

/**
 * GET /api/webhooks/facebook-leads
 *
 * Webhook subscription verification
 */
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get('hub.mode')
  const token = req.nextUrl.searchParams.get('hub.verify_token')
  const challenge = req.nextUrl.searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === META_WEBHOOK_VERIFY_TOKEN) {
    return NextResponse.json(challenge)
  }

  return NextResponse.json(
    { error: 'Verification failed' },
    { status: 403 }
  )
}

/**
 * Verify Meta webhook signature
 */
function verifyMetaWebhook(body: any, signature: string): boolean {
  if (!META_WEBHOOK_VERIFY_TOKEN) return true

  try {
    const hmac = crypto
      .createHmac('sha256', META_WEBHOOK_VERIFY_TOKEN)
      .update(JSON.stringify(body))
      .digest('hex')

    return `sha256=${hmac}` === signature
  } catch {
    return false
  }
}

/**
 * Extract lead data from Facebook messaging webhook
 */
function extractLeadData(messaging: any): FacebookLeadData | null {
  // This depends on your specific Facebook Lead Ads form structure
  // Placeholder implementation
  const leadGen = messaging.messaging_events?.[0]?.lead_gen

  if (!leadGen) return null

  const fields = leadGen.field_data || {}
  const fieldMap: Record<string, string> = {}

  for (const field of fields) {
    fieldMap[field.name] = field.value
  }

  return {
    email: fieldMap['email'] || '',
    first_name: fieldMap['first_name'] || '',
    last_name: fieldMap['last_name'] || '',
    phone_number: fieldMap['phone_number'] || '',
    service_type: fieldMap['service_type'],
    budget: fieldMap['budget'],
    timeline: fieldMap['timeline'],
    form_name: leadGen.form_id,
  }
}

/**
 * Process Facebook Lead: Save to DB, score, and sync to CRM
 */
async function processFacebookLead(supabase: any, leadData: FacebookLeadData): Promise<boolean> {
  try {
    if (!leadData.email) {
      console.warn('Facebook lead missing email, skipping')
      return false
    }

    const name = `${leadData.first_name || ''} ${leadData.last_name || ''}`.trim() || 'Unknown'
    const cleanBudget = parseBudgetRange(leadData.budget)

    // ── 1. Save to Supabase public_intake_leads first ──────────────────
    const { data: inserted, error: insertErr } = await supabase
      .from('public_intake_leads')
      .insert({
        project_path: leadData.service_type || 'kitchen_remodel',
        client_name: name,
        contact_email: leadData.email,
        contact_phone: leadData.phone_number || null,
        source: 'facebook',
        source_channel: 'facebook',
        status: 'new',
        requires_payment: true,
        payment_amount: 0,
        facebook_lead_id: leadData.form_name || null,
        form_data: {
          budget: leadData.budget || null,
          timeline: leadData.timeline || null,
          serviceType: leadData.service_type || null,
          facebookFormId: leadData.form_name || null,
        },
      })
      .select('id')
      .single()

    if (insertErr || !inserted) {
      console.error('Facebook lead insert to Supabase failed:', insertErr)
    }

    const leadId = inserted?.id || `fb_${Date.now()}`

    // ── 2. Calculate score (Phase 1) ─────────────────────────────────
    const scoreResult = calculateLeadScore({
      source: 'facebook',
      budget: cleanBudget,
      timeline: leadData.timeline || 'unknown',
      service: leadData.service_type || 'unknown',
      phone: leadData.phone_number || undefined,
    })

    // Update lead with score
    if (inserted?.id) {
      await supabase
        .from('public_intake_leads')
        .update({
          lead_score: scoreResult.score,
          routing_tag: scoreResult.tag,
          lead_tier: scoreResult.tag,
        })
        .eq('id', leadId)
    }

    // ── 3. Call CRM Dispatcher (HubSpot + GHL) ────────────────────────
    const syncResult = await syncLeadToCrms({
      leadId,
      email: leadData.email,
      name,
      phone: leadData.phone_number || undefined,
      source: 'facebook-lead-ads',
      serviceType: leadData.service_type || undefined,
      budget: leadData.budget || undefined,
      timeline: leadData.timeline || undefined,
      score: scoreResult.score,
      tag: scoreResult.tag,
      customFields: {
        facebook_form_id: leadData.form_name || '',
      }
    })

    const primaryContactId = syncResult.ghl?.id || syncResult.hubspot?.id

    if (primaryContactId && inserted?.id) {
      await supabase
        .from('public_intake_leads')
        .update({ ghl_contact_id: primaryContactId })
        .eq('id', leadId)
    }

    // If GHL is enabled, trigger SMS qualification workflow
    if (isGhlEnabled() && syncResult.ghl?.id && GHL_WORKFLOW_ID_SMS_QUAL) {
      try {
        await triggerWorkflow({
          contactId: syncResult.ghl.id,
          workflowId: GHL_WORKFLOW_ID_SMS_QUAL,
          eventData: {
            service: leadData.service_type || 'unknown',
            budget: leadData.budget || 'N/A',
          },
        })
      } catch (workflowErr) {
        console.error('GHL workflow trigger failed:', workflowErr)
      }
    }

    return true
  } catch (err) {
    console.error('processFacebookLead error:', err)
    return false
  }
}
