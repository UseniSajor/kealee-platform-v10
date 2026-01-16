import {NextRequest, NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {resultsManagerService} from '@/services/inspection-results/results-manager';
import {inspectionNotificationsService} from '@/services/inspection-results/inspection-notifications';
import {reinspectionAutomationService} from '@/services/inspection-results/reinspection-automation';
import {milestoneIntegrationService} from '@/services/inspection-results/milestone-integration';

/**
 * POST /api/inspections/:inspectionId/results
 * Record inspection results
 */
export async function POST(
  request: NextRequest,
  {params}: {params: {inspectionId: string}}
) {
  try {
    const {inspectionId} = params;
    const body = await request.json();

    // Record results
    const result = await resultsManagerService.recordInspectionResult({
      inspectionId,
      result: body.result,
      notes: body.notes,
      checklistItems: body.checklistItems,
      photos: body.photos,
      corrections: body.corrections,
      completedBy: body.completedBy,
      completedAt: new Date(),
    });

    // Send result notification
    await inspectionNotificationsService.sendResultNotification(inspectionId);

    // Send corrections notification if any
    if (body.corrections && body.corrections.length > 0) {
      await inspectionNotificationsService.sendCorrectionsNotification(
        inspectionId,
        body.corrections.map((c: any) => ({
          id: c.id || 'new',
          description: c.description,
          severity: c.severity,
        }))
      );
    }

    // Check milestone blocks
    const supabase = createClient();
    const {data: inspection} = await supabase
      .from('Inspection')
      .select('permitId')
      .eq('id', inspectionId)
      .single();

    if (inspection) {
      // Notify milestone integration (would check relevant milestones)
      // For now, just log
      console.log(`Checking milestone blocks for permit ${inspection.permitId}`);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Result recording error:', error);
    return NextResponse.json(
      {error: error.message || 'Internal server error'},
      {status: 500}
    );
  }
}

/**
 * GET /api/inspections/:inspectionId/results
 * Get inspection results
 */
export async function GET(
  request: NextRequest,
  {params}: {params: {inspectionId: string}}
) {
  try {
    const {inspectionId} = params;

    const result = await resultsManagerService.getInspectionResult(inspectionId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Get result error:', error);
    return NextResponse.json(
      {error: error.message || 'Internal server error'},
      {status: 500}
    );
  }
}
