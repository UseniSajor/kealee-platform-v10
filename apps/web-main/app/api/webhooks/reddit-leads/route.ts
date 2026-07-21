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
import { calculateLeadScore } from '@/lib/marketing/lead-scorer'
import { parseBudgetRange, syncLeadToCrms } from '@/lib/marketing/crm-dispatcher'

export const dynamic = 'force-dynamic'

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
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

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

    const cleanBudget = parseBudgetRange(body.budget)
    const scoreResult = calculateLeadScore({
      source: 'reddit',
      budget: cleanBudget,
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

    // ── Sync to CRMs dynamically ─────────────────────────────────────

    try {
      const syncResult = await syncLeadToCrms({
        leadId,
        email: body.email,
        name: body.name,
        phone: body.phone || undefined,
        source: 'reddit',
        serviceType: body.service_interest || undefined,
        budget: body.budget || undefined,
        timeline: 'unknown',
        score: scoreResult.score,
        tag: scoreResult.tag,
        customFields: {
          subreddit: body.subreddit || '',
          subreddit_category: body.subreddit_category || 'N/A',
          engagement_level: body.engagement_level || 'medium',
        }
      })

      const primaryContactId = syncResult.ghl?.id || syncResult.hubspot?.id

      if (primaryContactId) {
        await supabase
          .from('public_intake_leads')
          .update({ ghl_contact_id: primaryContactId })
          .eq('id', leadId)
      }

      console.log(`Reddit lead synced. Primary ID: ${primaryContactId}`)
    } catch (crmErr) {
      console.error('CRM sync failed for Reddit lead:', crmErr)
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
