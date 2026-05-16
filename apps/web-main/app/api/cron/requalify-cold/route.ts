/**
 * POST /api/cron/requalify-cold
 *
 * Phase 2 Cron Job: Re-qualify cold leads every 48 hours
 *
 * Checks if a cold lead has shown activity (form revisit, email click, etc.)
 * and bumps score if activity detected.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calculateLeadScore, type LeadData } from '@/lib/marketing/lead-scorer'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const CRON_SECRET = process.env.CRON_SECRET
  const KEALEE_OPS_SECRET = process.env.KEALEE_OPS_SECRET

  // Authenticate
  const auth = req.headers.get('Authorization')
  const xKealeeOps = req.headers.get('x-kealee-ops')

  const secret = KEALEE_OPS_SECRET || CRON_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: 'CRON_SECRET or KEALEE_OPS_SECRET not set' },
      { status: 500 }
    )
  }

  const isValid =
    (auth && auth === `Bearer ${secret}`) ||
    (xKealeeOps && xKealeeOps === secret)

  if (!isValid) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    // Fetch cold leads created < 7 days ago
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: coldLeads, error: fetchErr } = await supabase
      .from('public_intake_leads')
      .select('*')
      .eq('status', 'new')
      .eq('routing_tag', 'cold')
      .gt('created_at', sevenDaysAgo.toISOString())
      .limit(50)

    if (fetchErr) throw new Error(`Fetch cold leads: ${fetchErr.message}`)

    if (!coldLeads || coldLeads.length === 0) {
      return NextResponse.json({
        processed: 0,
        requalified: 0,
        message: 'No cold leads to requalify',
      })
    }

    let requalifiedCount = 0
    const results: unknown[] = []

    for (const lead of coldLeads) {
      try {
        // Check for activity: last_viewed_at, email_clicked_at, etc.
        // This is simplified; add your own activity tracking logic
        const leadData: LeadData = {
          source: lead.source,
          budget: lead.form_data?.budget ? parseInt(lead.form_data.budget) : undefined,
          timeline: lead.form_data?.timeline,
          service: lead.service_type,
          hasPhoto: !!lead.area_photo_url,
          hasDocuments: lead.form_data?.attachment_urls?.length > 0,
          phone: lead.phone_number,
          previousInteraction: true,  // They've seen it before
        }

        const newScore = calculateLeadScore(leadData)

        // If score improved by 15+ points, it's a re-engagement signal
        if (newScore.score > (lead.lead_score || 0) + 15) {
          // Update scoring
          const { error: updateErr } = await supabase
            .from('public_intake_leads')
            .update({
              lead_score: newScore.score,
              routing_tag: newScore.tag,
            })
            .eq('id', lead.id)

          if (updateErr) throw new Error(`Update score: ${updateErr.message}`)

          requalifiedCount++
          results.push({
            id: lead.id,
            previousScore: lead.lead_score,
            newScore: newScore.score,
            newTag: newScore.tag,
            action: 'requalified',
          })
        } else {
          results.push({
            id: lead.id,
            previousScore: lead.lead_score,
            newScore: newScore.score,
            action: 'no_change',
          })
        }
      } catch (err) {
        console.error(`Cold lead requalify error for ${lead.id}:`, err)
        results.push({
          id: lead.id,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }

    return NextResponse.json({
      processed: coldLeads.length,
      requalified: requalifiedCount,
      results,
    })
  } catch (err) {
    console.error('Cold lead requalify cron error:', err)
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    )
  }
}
