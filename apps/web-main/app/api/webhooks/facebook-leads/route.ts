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
import { createOrUpdateContact, triggerWorkflow } from '@/lib/marketing/ghl-client'

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

    let processed = 0
    for (const e of entry) {
      for (const messaging of e.messaging || []) {
        const leadData = extractLeadData(messaging)
        if (leadData) {
          const result = await syncToGhl(leadData)
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
 * Sync Facebook lead directly to GHL
 */
async function syncToGhl(leadData: FacebookLeadData): Promise<boolean> {
  try {
    if (!leadData.email) {
      console.warn('Facebook lead missing email, skipping GHL sync')
      return false
    }

    // Create or update GHL contact
    const contact = await createOrUpdateContact({
      email: leadData.email,
      firstName: leadData.first_name,
      lastName: leadData.last_name,
      phone: leadData.phone_number,
      source: 'facebook-lead-ads',
      tags: [
        leadData.service_type || 'unknown',
        'facebook',
      ],
      customFields: [
        { key: 'budget', field_value: leadData.budget || 'N/A' },
        { key: 'timeline', field_value: leadData.timeline || 'N/A' },
        { key: 'form_id', field_value: leadData.form_name || '' },
      ],
    })

    // Trigger SMS qualification workflow if configured
    if (GHL_WORKFLOW_ID_SMS_QUAL) {
      await triggerWorkflow({
        contactId: contact.id,
        workflowId: GHL_WORKFLOW_ID_SMS_QUAL,
        eventData: {
          service: leadData.service_type || 'unknown',
          budget: leadData.budget || 'N/A',
        },
      })
    }

    console.log(`Facebook lead synced to GHL: ${contact.id}`)
    return true
  } catch (err) {
    console.error('GHL sync failed:', err)
    return false
  }
}
