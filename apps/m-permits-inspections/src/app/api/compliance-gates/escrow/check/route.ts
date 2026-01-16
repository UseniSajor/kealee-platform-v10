import {NextRequest, NextResponse} from 'next/server';
import {escrowReleaseGateService} from '@/services/compliance-gates/escrow-gate';

/**
 * POST /api/compliance-gates/escrow/check
 * Check if escrow release can proceed (called by Finance & Trust module)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {releaseId, projectId, milestoneId} = body;

    if (!releaseId || !projectId) {
      return NextResponse.json(
        {error: 'releaseId and projectId required'},
        {status: 400}
      );
    }

    const check = await escrowReleaseGateService.checkEscrowRelease(
      releaseId,
      projectId,
      milestoneId
    );

    return NextResponse.json(check);
  } catch (error: any) {
    console.error('Escrow gate check error:', error);
    return NextResponse.json(
      {error: error.message || 'Internal server error'},
      {status: 500}
    );
  }
}
