/**
 * Reddit Ads Lead Capture Integration
 * 
 * Reddit ads + lead form integration
 * - Capture leads from Reddit ads
 * - Route to GHL + Phase 1 scoring
 * - Track ROI by subreddit
 * - Measure engagement by community
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createOrUpdateContact } from '@/lib/marketing/ghl-client'
import { calculateLeadScore } from '@/lib/marketing/lead-scorer'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

const REDDIT_API_KEY = process.env.REDDIT_API_KEY ?? ''

export interface RedditLeadData {
  name: string
  email: string
  phone?: string
  subreddit: string                 // Which subreddit ad was on
  subreddit_category?: string       // Category (DIY, HomeImprovement, etc.)
  service_interest?: string         // What they're interested in
  budget?: string
  message?: string
  ad_campaign_id?: string
  timestamp: string
  engagement_level?: string         // high, medium, low (time on ad)
}

/**
 * POST /api/webhooks/reddit-leads
 * 
 * Receives leads from Reddit ads
 * - Extract lead data + subreddit info
 * - Score immediately (Phase 1)
 * - Create GHL contact
 * - Track by subreddit for ROI
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RedditLeadData

    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log(`Reddit lead: ${body.name} (r/${body.subreddit})`)

    // ── Create intake lead record ───────────────────────────────────────

    const { data: inserted, error: insertErr } = await supabase
      .from('public_intake_leads')
      .insert({
        name: body.name,
        email: body.email,
        phone_number: body.phone,
        source: 'reddit',
        source_channel: 'reddit',
        form_data: {
          subreddit: body.subreddit,
          subreddit_category: body.subreddit_category,
          service_interest: body.service_interest,
          budget: body.budget,
          message: body.message,
          ad_campaign_id: body.ad_campaign_id,
          engagement_level: body.engagement_level,
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

    const scoreResult = calculateLeadScore({
      source: 'reddit',
      budget: body.budget ? parseInt(body.budget.replace(/\D/g, '')) : undefined,
      timeline: 'unknown',
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

    // ── Create GHL contact ────────────────────────────────────────────

    try {
      const ghlContact = await createOrUpdateContact({
        email: body.email,
        firstName: body.name.split(' ')[0],
        lastName: body.name.split(' ').slice(1).join(' '),
        phone: body.phone,
        source: 'reddit',
        tags: [
          'reddit',
          scoreResult.tag,
          body.subreddit || 'unknown-subreddit',
          body.subreddit_category || 'unknown-category',
        ],
        customFields: [
          { key: 'subreddit', field_value: body.subreddit },
          { key: 'subreddit_category', field_value: body.subreddit_category || 'N/A' },
          { key: 'engagement_level', field_value: body.engagement_level || 'medium' },
          { key: 'lead_source', field_value: 'reddit' },
          { key: 'kealee_intake_id', field_value: leadId },
        ],
      })

      // Update lead with GHL contact ID
      await supabase
        .from('public_intake_leads')
        .update({ ghl_contact_id: ghlContact.id })
        .eq('id', leadId)

      console.log(`GHL contact created: ${ghlContact.id}`)
    } catch (ghlErr) {
      console.error('GHL contact creation failed:', ghlErr)
    }

    // ── Track Reddit performance ───────────────────────────────────────

    const { data: existing } = await supabase
      .from('reddit_performance')
      .select('*')
      .eq('subreddit', body.subreddit)
      .eq('category', body.subreddit_category || 'uncategorized')
      .limit(1)

    if (existing?.[0]) {
      // Update existing record
      await supabase
        .from('reddit_performance')
        .update({
          leads_count: existing[0].leads_count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing[0].id)
    } else {
      // Create new record
      await supabase
        .from('reddit_performance')
        .insert({
          subreddit: body.subreddit,
          category: body.subreddit_category || 'uncategorized',
          leads_count: 1,
          ad_campaign_id: body.ad_campaign_id,
        })
    }

    return NextResponse.json({
      success: true,
      leadId,
      ghlContactId: undefined,
      score: scoreResult.score,
      tag: scoreResult.tag,
    })
  } catch (err) {
    console.error('Reddit webhook error:', err)
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    )
  }
}
