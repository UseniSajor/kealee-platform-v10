import {NextRequest, NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {expeditedFeeCalculatorService} from '@/services/expedited/fee-calculator';
import {expeditedReviewerAssignmentService} from '@/services/expedited/reviewer-assignment';
import {conciergeServiceManager} from '@/services/expedited/concierge-service';

/**
 * POST /api/permits/:id/expedited/activate
 * Activate expedited processing for permit
 */
export async function POST(
  request: NextRequest,
  {params}: {params: {id: string}}
) {
  try {
    const permitId = params.id;
    const body = await request.json();

    const {serviceLevel, basePermitFee, conciergeServices} = body;

    const supabase = createClient();

    // Calculate expedited fee
    const feeCalculation = await expeditedFeeCalculatorService.calculateExpeditedFee(
      permitId,
      {
        serviceLevel: serviceLevel || 'EXPEDITED',
        basePermitFee: basePermitFee || 0,
      }
    );

    // Update permit with expedited status
    await supabase
      .from('Permit')
      .update({
        expedited: true,
        expeditedFee: feeCalculation.expeditedFee,
      })
      .eq('id', permitId);

    // Assign dedicated reviewers
    const {data: permit} = await supabase
      .from('Permit')
      .select('type')
      .eq('id', permitId)
      .single();

    const disciplines = getDisciplinesForPermitType(permit?.type || 'BUILDING');
    const reviewerAssignment = await expeditedReviewerAssignmentService.assignDedicatedReviewers(
      permitId,
      disciplines
    );

    // Activate concierge service if requested
    let conciergeService = null;
    if (conciergeServices && conciergeServices.length > 0) {
      conciergeService = await conciergeServiceManager.activateConciergeService(
        permitId,
        conciergeServices
      );
    }

    return NextResponse.json({
      feeCalculation,
      reviewerAssignment,
      conciergeService,
    });
  } catch (error: any) {
    console.error('Expedited activation error:', error);
    return NextResponse.json(
      {error: error.message || 'Internal server error'},
      {status: 500}
    );
  }
}

/**
 * Get disciplines for permit type
 */
function getDisciplinesForPermitType(permitType: string): string[] {
  const mapping: Record<string, string[]> = {
    BUILDING: ['BUILDING', 'ZONING'],
    ELECTRICAL: ['ELECTRICAL'],
    PLUMBING: ['PLUMBING'],
    MECHANICAL: ['MECHANICAL'],
  };

  return mapping[permitType] || ['BUILDING'];
}
