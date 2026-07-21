// ============================================================
// SYNC PERMIT STATUS
// Sync with jurisdiction portal/API
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

    // Get permit and jurisdiction
    const { data: permit, error: permitError } = await supabase
      .from('Permit')
      .select('*, Jurisdiction(*)')
      .eq('id', params.id)
      .single();

    if (permitError) throw permitError;

    const jurisdiction = (permit as any).Jurisdiction;

    // Check if jurisdiction has API integration
    const { data: integration } = await supabase
      .from('APIIntegration')
      .select('*')
      .eq('jurisdictionId', permit.jurisdictionId)
      .eq('isActive', true)
      .single();

    if (integration) {
      // Sync via the jurisdiction's API integration
      const syncResult = await syncViaAPI(integration, permit);

      // Update permit with synced status
      await supabase
        .from('Permit')
        .update({
          jurisdictionStatus: syncResult.status,
          jurisdictionRefNumber: syncResult.permitNumber,
          lastSyncedAt: new Date().toISOString(),
        })
        .eq('id', params.id);

      // Log API call
      await supabase.from('APICall').insert({
        integrationId: integration.id,
        endpoint: integration.endpoints?.checkStatus || `${integration.apiUrl}/status`,
        method: 'GET',
        action: 'CHECK_STATUS',
        permitId: params.id,
        success: syncResult.success,
        statusCode: syncResult.httpStatus || 200,
        responsePayload: syncResult,
      });

      return NextResponse.json({ success: true, data: syncResult });
    } else {
      // Try to sync via the backend permit routing status endpoint
      const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      try {
        const routingResponse = await fetch(
          `${API_URL}/permits/permits/${params.id}/routing-status`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (routingResponse.ok) {
          const routingStatus = await routingResponse.json();

          // Update local permit record with routing status
          await supabase
            .from('Permit')
            .update({
              lastSyncedAt: new Date().toISOString(),
            })
            .eq('id', params.id);

          return NextResponse.json({
            success: true,
            data: {
              status: routingStatus.overallStatus || 'PENDING',
              routings: routingStatus.routings || [],
              syncSource: 'backend_routing',
            },
          });
        }
      } catch (routingError) {
        console.error('Backend routing sync failed:', routingError);
      }

      return NextResponse.json({
        success: false,
        message: 'No API integration available. Manual sync required.',
      });
    }
  } catch (error) {
    console.error('Status sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync status' },
      { status: 500 }
    );
  }
}

async function syncViaAPI(integration: any, permit: any) {
  const statusEndpoint = integration.endpoints?.checkStatus || '/permits/status';
  const apiUrl = `${integration.apiUrl}${statusEndpoint}`;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authentication based on integration type
    if (integration.apiKey) {
      headers['X-API-Key'] = integration.apiKey;
    }
    if (integration.clientId && integration.clientSecret) {
      headers['Authorization'] = `Basic ${Buffer.from(
        `${integration.clientId}:${integration.clientSecret}`
      ).toString('base64')}`;
    }

    // Build query with permit identifiers
    const permitRef = permit.jurisdictionRefNumber || permit.id;
    const response = await fetch(`${apiUrl}?permitId=${permitRef}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      return {
        success: false,
        status: permit.jurisdictionStatus || 'UNKNOWN',
        permitNumber: permit.jurisdictionRefNumber || undefined,
        httpStatus: response.status,
        error: `API returned status ${response.status}`,
      };
    }

    const data = await response.json();

    // Map the external API response using field mappings from the integration config
    const fieldMappings = integration.fieldMappings || {};
    const statusField = fieldMappings.status || 'status';
    const permitNumberField = fieldMappings.permitNumber || 'permitNumber';

    return {
      success: true,
      status: data[statusField] || 'UNDER_REVIEW',
      permitNumber: data[permitNumberField] || permit.jurisdictionRefNumber || undefined,
      httpStatus: response.status,
      rawResponse: data,
    };
  } catch (error: any) {
    console.error('API sync error:', error);
    return {
      success: false,
      status: permit.jurisdictionStatus || 'UNKNOWN',
      permitNumber: permit.jurisdictionRefNumber || undefined,
      error: error.message,
    };
  }
}
