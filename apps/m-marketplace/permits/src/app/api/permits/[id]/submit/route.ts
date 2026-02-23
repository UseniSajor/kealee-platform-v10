// ============================================================
// SUBMIT PERMIT API
// Submit permit to jurisdiction
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@permits/src/lib/supabase/server';

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

    // Check if jurisdiction has API integration and submit via API
    const { data: integration } = await supabase
      .from('APIIntegration')
      .select('*')
      .eq('jurisdictionId', permit.jurisdictionId)
      .eq('isActive', true)
      .single();

    let apiSubmitResult = null;

    if (integration) {
      // Submit via the jurisdiction's API integration
      try {
        const submitEndpoint = integration.endpoints?.submit || '/permits/submit';
        const apiUrl = `${integration.apiUrl}${submitEndpoint}`;

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (integration.apiKey) {
          headers['X-API-Key'] = integration.apiKey;
        }
        if (integration.clientId && integration.clientSecret) {
          headers['Authorization'] = `Basic ${Buffer.from(
            `${integration.clientId}:${integration.clientSecret}`
          ).toString('base64')}`;
        }

        // Map permit data using field mappings
        const fieldMappings = integration.fieldMappings || {};
        const submitPayload: Record<string, any> = {
          permitType: permit.permitType,
          address: permit.address,
          applicantName: permit.applicantName,
          applicantEmail: permit.applicantEmail,
          valuation: permit.valuation,
          scope: permit.scope,
          documents: permit.plans || [],
        };

        // Apply field mappings
        const mappedPayload: Record<string, any> = {};
        for (const [internalField, externalField] of Object.entries(fieldMappings)) {
          if (submitPayload[internalField] !== undefined) {
            mappedPayload[externalField as string] = submitPayload[internalField];
          }
        }
        const finalPayload = Object.keys(mappedPayload).length > 0 ? mappedPayload : submitPayload;

        const apiResponse = await fetch(apiUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(finalPayload),
        });

        const apiData = await apiResponse.json().catch(() => ({}));

        // Log the API call
        await supabase.from('APICall').insert({
          integrationId: integration.id,
          endpoint: submitEndpoint,
          method: 'POST',
          action: 'SUBMIT_APPLICATION',
          permitId: params.id,
          success: apiResponse.ok,
          statusCode: apiResponse.status,
          requestPayload: finalPayload,
          responsePayload: apiData,
        });

        if (apiResponse.ok) {
          apiSubmitResult = apiData;

          // Update permit with external reference number
          const refNumberField = fieldMappings.permitNumber || 'permitNumber';
          const externalRef = apiData[refNumberField] || apiData.referenceNumber || apiData.id;

          if (externalRef) {
            await supabase
              .from('Permit')
              .update({
                jurisdictionRefNumber: externalRef,
                jurisdictionStatus: 'SUBMITTED',
                submittedVia: 'API',
              })
              .eq('id', params.id);
          }
        }
      } catch (apiError) {
        console.error('API submission error (non-fatal):', apiError);
        // Non-fatal: permit is still marked as submitted in our system
      }
    }

    // Also trigger routing via the backend routing service
    const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    try {
      await fetch(`${API_URL}/permits/permits/${params.id}/route`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (routingError) {
      console.error('Backend routing trigger error (non-fatal):', routingError);
    }

    return NextResponse.json({
      success: true,
      data: {
        submissionId: submission.id,
        confirmationNumber: submission.confirmationNumber,
        apiSubmitResult: apiSubmitResult || undefined,
        submittedViaApi: !!apiSubmitResult,
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
