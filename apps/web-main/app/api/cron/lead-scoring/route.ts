import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { type LeadData } from '@/lib/marketing/lead-scorer'
import {
  scoreLeadWithIntelligence,
  mapIntakeRowToLeadInput,
  intelligenceMetadataUpdate,
  intelligenceCrmExtras,
} from '@/lib/marketing/intelligence-scorer'
import { alertHotLead } from '@/lib/marketing/twilio-client'
import { sendLeadToSlack } from '@/lib/marketing/slack-client'
import { parseBudgetRange, syncLeadToCrms } from '@/lib/marketing/crm-dispatcher'
import { isGhlEnabled } from '@/lib/marketing/ghl-enabled'
import { isEnterpriseCrmEnabled } from '@/lib/marketing/crm-enterprise'
import { verifyCronRequest } from '@/lib/cron-auth'

export const dynamic = 'force-dynamic'

/**
 * POST /api/cron/lead-scoring
 *
 * Runs every 5 minutes to:
 * 1. Score new leads (status = 'new')
 * 2. Send SMS alert if lead is hot
 * 3. Create HubSpot contact
 * 4. Update intake_leads.lead_score + routing_tag
 * 5. When enabled: run v30 intelligence agents + PropertyTwin/LeadTwin persistence
 */
export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const cronDenied = verifyCronRequest(req)
  if (cronDenied) return cronDenied

  try {
    // ── Fetch unscored leads ──────────────────────────────────────────────
    const { data: unscored, error: fetchErr } = await supabase
      .from('public_intake_leads')
      .select('*')
      .eq('status', 'new')
      .is('lead_score', null)
      .limit(50)

    if (fetchErr) throw new Error(`Fetch unscored: ${fetchErr.message}`)

    if (!unscored || unscored.length === 0) {
      return NextResponse.json({
        processed: 0,
        hotCount: 0,
        message: 'No new leads to score',
      })
    }

    let hotCount = 0
    const results: unknown[] = []

    for (const lead of unscored) {
      try {
        // ── Extract lead data ───────────────────────────────────────────
        const formData = lead.form_data || {}
        const leadData: LeadData = {
          source: lead.source || formData.source,
          budget: formData.budget ? parseBudgetRange(formData.budget) : undefined,
          timeline: formData.timeline,
          service: lead.service_type || formData.serviceType,
          hasPhoto: lead.area_photo_url ? true : false,
          hasDocuments: formData.attachment_urls && formData.attachment_urls.length > 0,
          phone: lead.phone_number,
        }

        // ── Calculate score (legacy + intelligence blend) ───────────────
        const intakeInput = mapIntakeRowToLeadInput(lead, formData)
        const scoreResult = await scoreLeadWithIntelligence(leadData, intakeInput)
        const isHot = scoreResult.tag === 'hot'
        const intelMeta = intelligenceMetadataUpdate(scoreResult)
        const crmExtras = intelligenceCrmExtras(scoreResult)

        if (isHot) hotCount++

        // ── Update intake_leads ────────────────────────────────────────
        const { error: updateErr } = await supabase
          .from('public_intake_leads')
          .update({
            lead_score: scoreResult.score,
            routing_tag: scoreResult.tag,
            lead_tier: scoreResult.tag,
            ...(intelMeta ?? {}),
          })
          .eq('id', lead.id)

        if (updateErr) throw new Error(`Update score: ${updateErr.message}`)

        // ── If hot: send SMS alert ────────────────────────────────────
        if (isHot) {
          void sendLeadToSlack({
            leadId: lead.id,
            leadName: lead.client_name || lead.name || 'Unknown',
            leadService: leadData.service || lead.project_path || 'Unknown',
            leadBudget: lead.budget_range || (leadData.budget ? `$${leadData.budget}` : 'N/A'),
            leadScore: scoreResult.score,
            routingTag: scoreResult.tag,
          })

          const smsResult = await alertHotLead({
            name: lead.client_name || lead.name || 'Unknown',
            service: leadData.service || 'Unknown',
            budget: leadData.budget ? `$${leadData.budget}` : 'N/A',
            timeline: leadData.timeline || 'N/A',
            intakePath: `/intake/${lead.id}`,
            email: lead.contact_email || lead.email,
          })

          // Log SMS result
          if (smsResult.success) {
            const { error: smsLogErr } = await supabase
              .from('sms_alert_log')
              .insert({
                intake_id: lead.id,
                message: `Alert sent for ${lead.name}`,
                status: 'sent',
                twilio_message_id: smsResult.messageId,
              })
            if (smsLogErr) console.error('SMS log error:', smsLogErr)

            // Update sms_alert_sent_at
            const { error: smsUpdateErr } = await supabase
              .from('public_intake_leads')
              .update({ sms_alert_sent_at: new Date().toISOString() })
              .eq('id', lead.id)
            if (smsUpdateErr) console.error('Update sms_alert_sent_at error:', smsUpdateErr)
          } else {
            console.error(`SMS alert failed for ${lead.id}:`, smsResult.error)
            const { error: smsFailLogErr } = await supabase
              .from('sms_alert_log')
              .insert({
                intake_id: lead.id,
                message: `Alert failed for ${lead.name}`,
                status: 'failed',
                error_message: smsResult.error,
              })
            if (smsFailLogErr) console.error('SMS log error:', smsFailLogErr)
          }
        }

        // ── CRM sync (enterprise) or native Kealee drip ───────────────────
        const leadEmail = lead.contact_email || lead.email
        try {
          if (isEnterpriseCrmEnabled() && leadEmail) {
            const hasHubspot = Boolean(process.env.HUBSPOT_API_KEY || process.env.HUBSPOT_ACCESS_TOKEN)
            const hasGhl = isGhlEnabled()

            if (hasHubspot || hasGhl) {
            const syncResult = await syncLeadToCrms({
              leadId: lead.id,
              email: leadEmail,
              name: lead.client_name || lead.name || 'Unknown',
              phone: lead.phone_number || undefined,
              source: lead.source || formData.source || 'kealee-web',
              serviceType: lead.service_type || formData.serviceType || undefined,
              budget: formData.budget || undefined,
              timeline: leadData.timeline || undefined,
              score: scoreResult.score,
              tag: scoreResult.tag,
              customFields: crmExtras.customFields,
              tags: crmExtras.tags,
            })

            const primaryContactId = syncResult.ghl?.id || syncResult.hubspot?.id

            if (primaryContactId) {
              await supabase
                .from('public_intake_leads')
                .update({ ghl_contact_id: primaryContactId })
                .eq('id', lead.id)

              if (scoreResult.intelligence && syncResult.ghl?.id) {
                try {
                  const { scheduleIntelligenceNurtureIfEligible } = await import(
                    '@/lib/marketing/intelligence-nurture'
                  )
                  await scheduleIntelligenceNurtureIfEligible({
                    leadId: lead.id,
                    ghlContactId: syncResult.ghl.id,
                    intelligence: scoreResult.intelligence,
                    email: leadEmail,
                    name: lead.client_name || lead.name,
                    address: lead.project_address,
                    projectPath: lead.project_path,
                  })
                } catch (nurtureErr) {
                  console.warn(`[lead-scoring] intelligence nurture skipped for ${lead.id}:`, nurtureErr)
                }
              }
            }

            // Log CRM Sync results
            if (syncResult.ghl) {
              const { error: ghlLogErr } = await supabase
                .from('ghl_sync_log')
                .insert({
                  intake_id: lead.id,
                  ghl_contact_id: syncResult.ghl.id || null,
                  action: syncResult.ghl.success ? 'create' : 'error',
                  ghl_response: syncResult.ghl,
                  error_message: syncResult.ghl.error || null,
                })
              if (ghlLogErr) console.error('GHL sync log error:', ghlLogErr)
            }

            if (syncResult.hubspot) {
              const { error: hsLogErr } = await supabase
                .from('ghl_sync_log')
                .insert({
                  intake_id: lead.id,
                  ghl_contact_id: syncResult.hubspot.id || null,
                  action: syncResult.hubspot.success ? 'create' : 'error',
                  ghl_response: syncResult.hubspot,
                  error_message: syncResult.hubspot.error || null,
                })
              if (hsLogErr) console.error('HubSpot sync log error:', hsLogErr)
            }
            }
          } else if (leadEmail && scoreResult.intelligence) {
            try {
              const { scheduleIntelligenceNurtureIfEligible } = await import(
                '@/lib/marketing/intelligence-nurture'
              )
              await scheduleIntelligenceNurtureIfEligible({
                leadId: lead.id,
                intelligence: scoreResult.intelligence,
                email: leadEmail,
                name: lead.client_name || lead.name,
                address: lead.project_address,
                projectPath: lead.project_path,
              })
            } catch (nurtureErr) {
              console.warn(`[lead-scoring] native nurture skipped for ${lead.id}:`, nurtureErr)
            }
          }
        } catch (crmErr) {
          console.error(`CRM sync failed for ${lead.id}:`, crmErr)
          const { error: hsErrLogErr } = await supabase
            .from('ghl_sync_log')
            .insert({
              intake_id: lead.id,
              action: 'error',
              error_message: crmErr instanceof Error ? crmErr.message : String(crmErr),
            })
          if (hsErrLogErr) console.error('CRM sync error log failed:', hsErrLogErr)
        }

        results.push({
          id: lead.id,
          score: scoreResult.score,
          tag: scoreResult.tag,
          isHot,
          mode: scoreResult.mode,
          intelligenceSegment: scoreResult.intelligence?.audienceSegment,
        })
      } catch (err) {
        console.error(`Lead scoring error for ${lead.id}:`, err)
        results.push({
          id: lead.id,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }

    return NextResponse.json({
      processed: unscored.length,
      hotCount,
      results,
    })
  } catch (err) {
    console.error('Lead scoring cron error:', err)
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    )
  }
}

/** Vercel Cron invokes GET — delegate to POST handler. */
export async function GET(req: NextRequest) {
  return POST(req)
}
