import {NextRequest, NextResponse} from 'next/server';
import {subscriptionService} from '@permits/src/services/jurisdiction/subscription-service';

/**
 * GET /api/jurisdictions/:jurisdictionId/subscription
 * Get subscription details
 */
export async function GET(
  request: NextRequest,
  {params}: {params: {jurisdictionId: string}}
) {
  try {
    const {jurisdictionId} = params;

    const subscription = await subscriptionService.getSubscription(jurisdictionId);
    const usage = await subscriptionService.getBillingUsage(jurisdictionId);

    return NextResponse.json({subscription, usage});
  } catch (error: any) {
    console.error('Subscription error:', error);
    return NextResponse.json(
      {error: error.message || 'Internal server error'},
      {status: 500}
    );
  }
}

/**
 * PUT /api/jurisdictions/:jurisdictionId/subscription
 * Update subscription tier
 */
export async function PUT(
  request: NextRequest,
  {params}: {params: {jurisdictionId: string}}
) {
  try {
    const {jurisdictionId} = params;
    const body = await request.json();
    const {tier, stripeCustomerId} = body;

    if (!tier || !['BASIC', 'PRO', 'ENTERPRISE'].includes(tier)) {
      return NextResponse.json({error: 'Invalid tier'}, {status: 400});
    }

    const subscription = await subscriptionService.updateSubscriptionTier(
      jurisdictionId,
      tier,
      {stripeCustomerId}
    );

    return NextResponse.json(subscription);
  } catch (error: any) {
    console.error('Subscription update error:', error);
    return NextResponse.json(
      {error: error.message || 'Internal server error'},
      {status: 500}
    );
  }
}
