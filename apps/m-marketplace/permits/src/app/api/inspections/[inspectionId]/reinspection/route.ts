import {NextRequest, NextResponse} from 'next/server';
import {createClient} from '@permits/src/lib/supabase/server';
import {reinspectionAutomationService} from '@permits/src/services/inspection-results/reinspection-automation';
import {inspectionNotificationsService} from '@permits/src/services/inspection-results/inspection-notifications';

/**
 * POST /api/inspections/:inspectionId/reinspection
 * Create reinspection request
 */
export async function POST(
  request: NextRequest,
  {params}: {params: {inspectionId: string}}
) {
  try {
    const {inspectionId} = params;
    const body = await request.json();

    const supabase = createClient();

    // Get inspection details
    const {data: inspection, error: inspectionError} = await supabase
      .from('Inspection')
      .select('permitId, type')
      .eq('id', inspectionId as any)
      .single();

    if (inspectionError || !inspection) {
      return NextResponse.json({error: 'Inspection not found'}, {status: 404});
    }

    // Check if reinspection can be requested
    const canRequest = await reinspectionAutomationService.canRequestReinspection(
      inspectionId,
      (inspection as any).permitId
    );

    if (!canRequest.canRequest) {
      return NextResponse.json(
        {
          error: 'Reinspection cannot be requested',
          reason: canRequest.reason,
          blockingCorrections: canRequest.blockingCorrections,
        },
        {status: 400}
      );
    }

    // Create reinspection
    const reinspection = await reinspectionAutomationService.createReinspectionRequest({
      parentInspectionId: inspectionId,
      permitId: (inspection as any).permitId,
      inspectionType: (inspection as any).type,
      requestedBy: body.requestedBy,
      reason: body.reason || 'CORRECTIONS_COMPLETED',
      correctionsResolved: body.correctionsResolved || [],
    });

    // Send notification if scheduled
    if (reinspection.scheduledDate && reinspection.scheduledTime) {
      await inspectionNotificationsService.sendReinspectionScheduledNotification(
        reinspection.reinspectionId,
        reinspection.scheduledDate,
        reinspection.scheduledTime
      );
    }

    return NextResponse.json(reinspection);
  } catch (error: any) {
    console.error('Reinspection creation error:', error);
    return NextResponse.json(
      {error: error.message || 'Internal server error'},
      {status: 500}
    );
  }
}
