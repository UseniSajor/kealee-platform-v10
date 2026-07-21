import {NextRequest, NextResponse} from 'next/server';
import {codeComplianceCheckerService} from '@/services/architect-integration/code-compliance-checker';

/**
 * POST /api/architect-integration/check-compliance
 * Pre-check code compliance for design project
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {designProjectId, jurisdictionId, permitType} = body;

    if (!designProjectId || !jurisdictionId || !permitType) {
      return NextResponse.json(
        {error: 'Missing required fields: designProjectId, jurisdictionId, permitType'},
        {status: 400}
      );
    }

    // Check compliance
    const report = await codeComplianceCheckerService.checkCompliance(
      designProjectId,
      jurisdictionId,
      permitType
    );

    return NextResponse.json(report);
  } catch (error: any) {
    console.error('Compliance check error:', error);
    return NextResponse.json(
      {error: error.message || 'Internal server error'},
      {status: 500}
    );
  }
}
