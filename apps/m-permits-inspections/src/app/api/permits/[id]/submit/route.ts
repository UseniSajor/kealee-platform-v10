// ============================================================
// SUBMIT PERMIT API
// Submit permit to jurisdiction
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { submittedVia = 'PORTAL' } = body;

    // Get permit
    const { data: permit, error: permitError } = await supabase
      .from('Permit')
      .select('*')
      .eq('id', params.id)
      .single();

    if (permitError) throw permitError;

    // Create submission record
    const { data: submission, error: submissionError } = await supabase
      .from('PermitSubmission')
      .insert({
        permitId: params.id,
        submissionType: 'INITIAL',
        submittedVia,
        submittedBy: session.user.id,
        documents: {
          plans: permit.plans || [],
          calculations: permit.calculations || [],
          reports: permit.reports || [],
        },
        formData: body.formData || {},
      })
      .select()
      .single();

    if (submissionError) throw submissionError;

    // Update permit status
    const { error: updateError } = await supabase
      .from('Permit')
      .update({
        kealeeStatus: 'SUBMITTED',
        submittedAt: new Date().toISOString(),
        submittedVia,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', params.id);

    if (updateError) throw updateError;

    // Create permit event
    await supabase.from('PermitEvent').insert({
      permitId: params.id,
      userId: session.user.id,
      eventType: 'SUBMITTED',
      description: `Permit submitted via ${submittedVia}`,
      metadata: { submissionId: submission.id },
      source: 'USER',
    });

    // TODO: If jurisdiction has API integration, submit via API
    // Otherwise, mark as submitted and jurisdiction will process manually

    return NextResponse.json({
      success: true,
      data: {
        submissionId: submission.id,
        confirmationNumber: submission.confirmationNumber,
      },
    });
  } catch (error) {
    console.error('Error submitting permit:', error);
    return NextResponse.json(
      { error: 'Failed to submit permit' },
      { status: 500 }
    );
  }
}
