/**
 * Nextdoor Lead Capture Integration
 * 
 * Nextdoor ads + lead form integration
 * - Capture leads from Nextdoor ads
 * - Route to GHL + Phase 1 scoring
 * - Track ROI by neighborhood
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calculateLeadScore } from '@/lib/marketing/lead-scorer'
import { parseBudgetRange, syncLeadToCrms } from '@/lib/marketing/crm-dispatcher'

export const dynamic = 'force-dynamic'

const NEXTDOOR_API_KEY = process.env.NEXTDOOR_API_KEY ?? ''

export interface NextdoorLeadData {
  name: string
  email: string
  phone?: string
  neighborhood: string          // User's neighborhood
  city: string
  state: string
  zip_code: string
  service_interest?: string     // What they're interested in
  budget?: string
  message?: string
  ad_campaign_id?: string
  timestamp: string
}

/**
 * POST /api/webhooks/nextdoor-leads
 * 
 * Receives leads from Nextdoor ads
 * - Extract lead data
 * - Score immediately (Phase 1)
 * - Create GHL contact
 * - Track by neighborhood for ROI
 */
export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const body = (await req.json()) as NextdoorLeadData

    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log(`Nextdoor lead: ${body.name} (${body.neighborhood}, ${body.city})`)

    // ── Create intake lead record ───────────────────────────────────────

    const { data: inserted, error: insertErr } = await supabase
      .from('public_intake_leads')
      .insert({
        name: body.name,
        email: body.email,
        phone_number: body.phone,
        source: 'nextdoor',
        source_channel: 'nextdoor',
        form_data: {
          neighborhood: body.neighborhood,
          city: body.city,
          state: body.state,
          zip_code: body.zip_code,
          service_interest: body.service_interest,
          budget: body.budget,
          message: body.message,
          ad_campaign_id: body.ad_campaign_id,
        },
        status: 'new',
      })
      .select('id')

    if (insertErr || !inserted?.[0]) {
      console.error('Lead insert error:', insertErr)
      return NextResponse.json(
        { error: 'Failed to create lead' },
        { status: 500 }
      )
    }

    const leadId = inserted[0].id

    // ── Score lead immediately ─────────────────────────────────────────

    const cleanBudget = parseBudgetRange(body.budget)
    const scoreResult = calculateLeadScore({
      source: 'nextdoor',
      budget: cleanBudget,
      timeline: 'unknown',  // Nextdoor doesn't always have this
      service: body.service_interest || 'unknown',
    })

    // ── Update lead with score ─────────────────────────────────────────

    await supabase
      .from('public_intake_leads')
      .update({
        lead_score: scoreResult.score,
        routing_tag: scoreResult.tag,
      })
      .eq('id', leadId)

    // ── Sync to CRMs dynamically ─────────────────────────────────────

    try {
      const syncResult = await syncLeadToCrms({
        leadId,
        email: body.email,
        name: body.name,
        phone: body.phone || undefined,
        source: 'nextdoor',
        serviceType: body.service_interest || undefined,
        budget: body.budget || undefined,
        timeline: 'unknown',
        score: scoreResult.score,
        tag: scoreResult.tag,
        customFields: {
          neighborhood: body.neighborhood || '',
          city: body.city || '',
          state: body.state || '',
          zip_code: body.zip_code || '',
        }
      })

      const primaryContactId = syncResult.ghl?.id || syncResult.hubspot?.id

      if (primaryContactId) {
        await supabase
          .from('public_intake_leads')
          .update({ ghl_contact_id: primaryContactId })
          .eq('id', leadId)
      }

      console.log(`Nextdoor lead synced. Primary ID: ${primaryContactId}`)
    } catch (crmErr) {
      console.error('CRM sync failed for Nextdoor lead:', crmErr)
    }

    // ── Track Nextdoor performance ────────────────────────────────────

    const { data: existing } = await supabase
      .from('nextdoor_performance')
      .select('*')
      .eq('neighborhood', body.neighborhood)
      .eq('city', body.city)
      .limit(1)

    if (existing?.[0]) {
      // Update existing record
      await supabase
        .from('nextdoor_performance')
        .update({
          leads_count: existing[0].leads_count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing[0].id)
    } else {
      // Create new record
      await supabase
        .from('nextdoor_performance')
        .insert({
          neighborhood: body.neighborhood,
          city: body.city,
          state: body.state,
          zip_code: body.zip_code,
          leads_count: 1,
          ad_campaign_id: body.ad_campaign_id,
        })
    }

    return NextResponse.json({
      success: true,
      leadId,
      ghlContactId: undefined,  // Set in background
      score: scoreResult.score,
      tag: scoreResult.tag,
    })
  } catch (err) {
    console.error('Nextdoor webhook error:', err)
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    )
  }
}
