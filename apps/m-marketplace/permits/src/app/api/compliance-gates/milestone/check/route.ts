import {NextRequest, NextResponse} from 'next/server';
import {milestoneGateService} from '@permits/src/services/compliance-gates/milestone-gate';

/**
 * POST /api/compliance-gates/milestone/check
 * Check if milestone can be approved (called by Project Owner module)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {milestoneId, projectId} = body;

    if (!milestoneId || !projectId) {
      return NextResponse.json(
        {error: 'milestoneId and projectId required'},
        {status: 400}
      );
    }

    const check = await milestoneGateService.checkMilestoneApproval(milestoneId, projectId);

    return NextResponse.json(check);
  } catch (error: any) {
    console.error('Milestone gate check error:', error);
    return NextResponse.json(
      {error: error.message || 'Internal server error'},
      {status: 500}
    );
  }
}
