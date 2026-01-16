// ============================================================
// SYNC PERMIT STATUS
// Sync with jurisdiction portal/API
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
      // Sync via API
      // TODO: Implement actual API sync based on integration type
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
        endpoint: integration.endpoints.checkStatus || '',
        method: 'GET',
        action: 'CHECK_STATUS',
        permitId: params.id,
        success: true,
        statusCode: 200,
        responsePayload: syncResult,
      });

      return NextResponse.json({ success: true, data: syncResult });
    } else {
      // Manual sync - would scrape portal or check email
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
  // Placeholder for actual API integration
  // Would use integration.apiUrl, apiKey, etc. to make request
  return {
    status: 'UNDER_REVIEW',
    permitNumber: permit.jurisdictionRefNumber || undefined,
  };
}
