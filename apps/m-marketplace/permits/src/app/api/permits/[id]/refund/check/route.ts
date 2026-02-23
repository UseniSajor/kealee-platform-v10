import {NextRequest, NextResponse} from 'next/server';
import {refundPolicyService} from '@permits/src/services/expedited/refund-policy';

/**
 * GET /api/permits/:permitId/refund/check
 * Check refund eligibility
 */
export async function GET(
  request: NextRequest,
  {params}: {params: {permitId: string}}
) {
  try {
    const {permitId} = params;

    const eligibility = await refundPolicyService.checkRefundEligibility(permitId);

    return NextResponse.json(eligibility);
  } catch (error: any) {
    console.error('Refund check error:', error);
    return NextResponse.json(
      {error: error.message || 'Internal server error'},
      {status: 500}
    );
  }
}

/**
 * POST /api/permits/:permitId/refund/request
 * Request refund
 */
export async function POST(
  request: NextRequest,
  {params}: {params: {permitId: string}}
) {
  try {
    const {permitId} = params;
    const body = await request.json();

    const refundRequest = await refundPolicyService.requestRefund(
      permitId,
      body.requestedBy
    );

    return NextResponse.json(refundRequest);
  } catch (error: any) {
    console.error('Refund request error:', error);
    return NextResponse.json(
      {error: error.message || 'Internal server error'},
      {status: 500}
    );
  }
}
