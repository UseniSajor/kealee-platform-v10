import {NextRequest, NextResponse} from 'next/server';
import {jurisdictionConfigurationService} from '@/services/jurisdiction/configuration-service';

/**
 * GET /api/jurisdictions/:jurisdictionId/configuration
 * Get jurisdiction configuration
 */
export async function GET(
  request: NextRequest,
  {params}: {params: {jurisdictionId: string}}
) {
  try {
    const {jurisdictionId} = params;

    const [feeSchedule, permitTypes, disciplines, zones, rules, holidays, closures] =
      await Promise.all([
        jurisdictionConfigurationService.getFeeSchedule(jurisdictionId),
        Promise.resolve([]), // Would get from settings
        jurisdictionConfigurationService.getReviewDisciplines(jurisdictionId),
        jurisdictionConfigurationService.getInspectorZones(jurisdictionId),
        jurisdictionConfigurationService.getBusinessRules(jurisdictionId),
        jurisdictionConfigurationService.getHolidays(jurisdictionId),
        jurisdictionConfigurationService.getClosurePeriods(jurisdictionId),
      ]);

    return NextResponse.json({
      feeSchedule,
      permitTypes,
      disciplines,
      zones,
      rules,
      holidays,
      closures,
    });
  } catch (error: any) {
    console.error('Configuration error:', error);
    return NextResponse.json(
      {error: error.message || 'Internal server error'},
      {status: 500}
    );
  }
}

/**
 * PUT /api/jurisdictions/:jurisdictionId/configuration/fee-schedule
 * Update fee schedule
 */
export async function PUT(
  request: NextRequest,
  {params}: {params: {jurisdictionId: string}}
) {
  try {
    const {jurisdictionId} = params;
    const {searchParams} = new URL(request.url);
    const configType = searchParams.get('type');

    const body = await request.json();

    switch (configType) {
      case 'fee-schedule':
        await jurisdictionConfigurationService.updateFeeSchedule(jurisdictionId, body);
        break;
      case 'permit-types':
        await jurisdictionConfigurationService.configurePermitTypes(jurisdictionId, body);
        break;
      case 'disciplines':
        await jurisdictionConfigurationService.configureReviewDisciplines(jurisdictionId, body);
        break;
      default:
        return NextResponse.json({error: 'Invalid configuration type'}, {status: 400});
    }

    return NextResponse.json({success: true});
  } catch (error: any) {
    console.error('Configuration update error:', error);
    return NextResponse.json(
      {error: error.message || 'Internal server error'},
      {status: 500}
    );
  }
}
