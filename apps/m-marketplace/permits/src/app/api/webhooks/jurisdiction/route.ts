// ============================================================
// WEBHOOK LISTENER
// Receive webhooks from jurisdiction systems
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@permits/src/lib/supabase/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-webhook-signature');
    const eventType = request.headers.get('x-event-type') || 'unknown';

    // Verify webhook signature (if configured)
    // const expectedSignature = crypto
    //   .createHmac('sha256', process.env.WEBHOOK_SECRET || '')
    //   .update(body)
    //   .digest('hex');
    // if (signature !== expectedSignature) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    const payload = JSON.parse(body);
    const supabase = createServerClient();

    // Save webhook event
    const { data: webhookEvent, error: webhookError } = await supabase
      .from('WebhookEvent')
      .insert({
        eventType,
        eventSource: 'JURISDICTION',
        payload,
        signature,
        rawBody: body,
        status: 'PENDING',
      })
      .select()
      .single();

    if (webhookError) {
      console.error('Error saving webhook:', webhookError);
    }

    // Process webhook based on event type
    switch (eventType) {
      case 'permit.status_changed':
        await handlePermitStatusChange(supabase, payload);
        break;
      case 'permit.approved':
        await handlePermitApproved(supabase, payload);
        break;
      case 'inspection.scheduled':
        await handleInspectionScheduled(supabase, payload);
        break;
      case 'inspection.completed':
        await handleInspectionCompleted(supabase, payload);
        break;
      case 'correction.requested':
        await handleCorrectionRequested(supabase, payload);
        break;
      default:
        console.log('Unknown webhook event type:', eventType);
    }

    // Update webhook event status
    if (webhookEvent) {
      await supabase
        .from('WebhookEvent')
        .update({
          status: 'PROCESSED',
          processedAt: new Date().toISOString(),
        })
        .eq('id', webhookEvent.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePermitStatusChange(supabase: any, payload: any) {
  const { permitId, status, jurisdictionRefNumber } = payload;

  if (permitId) {
    await supabase
      .from('Permit')
      .update({
        jurisdictionStatus: status,
        jurisdictionRefNumber: jurisdictionRefNumber || undefined,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', permitId);

    // Create permit event
    await supabase.from('PermitEvent').insert({
      permitId,
      eventType: 'STATUS_CHANGE',
      description: `Status changed to ${status}`,
      metadata: payload,
      source: 'WEBHOOK',
    });
  }
}

async function handlePermitApproved(supabase: any, payload: any) {
  const { permitId, permitNumber, approvedAt } = payload;

  if (permitId) {
    await supabase
      .from('Permit')
      .update({
        kealeeStatus: 'APPROVED',
        jurisdictionStatus: 'APPROVED',
        permitNumber: permitNumber || undefined,
        approvedAt: approvedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .eq('id', permitId);
  }
}

async function handleInspectionScheduled(supabase: any, payload: any) {
  const { inspectionId, scheduledDate, inspectorId, jurisdictionRefNumber } = payload;

  if (inspectionId) {
    await supabase
      .from('Inspection')
      .update({
        scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : undefined,
        inspectorId: inspectorId || undefined,
        jurisdictionRefNumber: jurisdictionRefNumber || undefined,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', inspectionId);
  }
}

async function handleInspectionCompleted(supabase: any, payload: any) {
  const { inspectionId, result, inspectorNotes, deficiencies, completedAt } = payload;

  if (inspectionId) {
    await supabase
      .from('Inspection')
      .update({
        result: result || undefined,
        inspectorNotes: inspectorNotes || undefined,
        deficiencies: deficiencies || undefined,
        completedAt: completedAt ? new Date(completedAt).toISOString() : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .eq('id', inspectionId);
  }
}

async function handleCorrectionRequested(supabase: any, payload: any) {
  const { permitId, correctionText, severity, discipline, dueDate } = payload;

  if (permitId) {
    // Parse correction text using AI if available
    const parsedIssues = [{ description: correctionText, severity }];

    await supabase.from('PermitCorrection').insert({
      permitId,
      source: 'JURISDICTION_EMAIL',
      rawText: correctionText,
      parsedIssues,
      severity: severity || 'MAJOR',
      discipline: discipline || undefined,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      status: 'PENDING',
    });

    // Update permit status
    await supabase
      .from('Permit')
      .update({
        kealeeStatus: 'CORRECTIONS_REQUESTED',
        updatedAt: new Date().toISOString(),
      })
      .eq('id', permitId);
  }
}
