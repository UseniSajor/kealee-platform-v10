import {NextRequest, NextResponse} from 'next/server';
import {createClient} from '@permits/src/lib/supabase/server';
import {smartSchedulerService} from '@permits/src/services/inspection-scheduling/smart-scheduler';
import {conflictDetectorService} from '@permits/src/services/inspection-scheduling/conflict-detector';
import {inspectionSequencingService} from '@permits/src/services/inspection-scheduling/inspection-sequencing';

/**
 * POST /api/inspections/:inspectionId/schedule
 * Schedule inspection with smart scheduling
 */
export async function POST(
  request: NextRequest,
  {params}: {params: {inspectionId: string}}
) {
  try {
    const {inspectionId} = params;
    const body = await request.json();

    const {inspectorId, scheduledDate, scheduledTime, options = {}} = body;

    // Get inspection details
    const supabase = createClient();
    const {data: inspection} = await supabase
      .from('Inspection')
      .select('*, permit:Permit(location)')
      .eq('id', inspectionId)
      .single();

    if (!inspection) {
      return NextResponse.json({error: 'Inspection not found'}, {status: 404});
    }

    // Check sequence prerequisites
    const sequenceCheck = await inspectionSequencingService.checkInspectionSequence(
      inspection.permitId,
      inspection.type
    );

    if (!sequenceCheck.canProceed) {
      return NextResponse.json(
        {
          error: 'Inspection cannot proceed',
          missingPrerequisites: sequenceCheck.missingPrerequisites,
          blockers: sequenceCheck.blockers,
        },
        {status: 400}
      );
    }

    // Check conflicts
    const conflictCheck = await conflictDetectorService.checkSchedulingConflicts(
      inspectionId,
      inspectorId,
      new Date(scheduledDate),
      scheduledTime,
      options.estimatedDuration || 60,
      inspection.permit?.location
    );

    if (conflictCheck.hasConflicts) {
      return NextResponse.json(
        {
          error: 'Scheduling conflicts detected',
          conflicts: conflictCheck.conflicts,
          warnings: conflictCheck.warnings,
        },
        {status: 409}
      );
    }

    // Schedule inspection
    const scheduled = await smartSchedulerService.scheduleInspection(
      inspectionId,
      inspectorId,
      new Date(scheduledDate),
      scheduledTime
    );

    return NextResponse.json({
      ...scheduled,
      warnings: conflictCheck.warnings,
    });
  } catch (error: any) {
    console.error('Scheduling error:', error);
    return NextResponse.json(
      {error: error.message || 'Internal server error'},
      {status: 500}
    );
  }
}
