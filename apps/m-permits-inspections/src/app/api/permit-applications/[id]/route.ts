import {NextRequest, NextResponse} from 'next/server';
import {applicationRouterService} from '@/services/permit-routing/application-router';
import {notificationService} from '@/services/permit-routing/notification-service';
import {createClient} from '@/lib/supabase/client';

/**
 * POST /api/permit-applications/:id/route
 * Route a permit application to reviewers
 */
export async function POST(
  request: NextRequest,
  {params}: {params: {id: string}}
) {
  try {
    const {id} = params;
    const body = await request.json();
    const {expedited, excludeStaffIds, forceReassignment} = body;

    // Get permit jurisdiction
    const supabase = createClient();
    const {data: permit} = await supabase
      .from('Permit')
      .select('jurisdictionId, expedited')
      .eq('id', id)
      .single();

    if (!permit) {
      return NextResponse.json({error: 'Permit not found'}, {status: 404});
    }

    // Route application
    const routingResult = await applicationRouterService.routeApplication({
      permitId: id,
      jurisdictionId: permit.jurisdictionId,
      expedited: expedited || permit.expedited,
      excludeStaffIds,
      forceReassignment,
    });

    // Create review assignments in database
    for (const assignment of routingResult.assignments) {
      await supabase.from('PermitReview').insert({
        permitId: id,
        reviewerId: assignment.reviewerId,
        discipline: assignment.discipline,
        status: 'ASSIGNED',
        startedAt: new Date().toISOString(),
        dueDate: assignment.dueDate.toISOString(),
      });
    }

    // Update permit status
    await supabase
      .from('Permit')
      .update({
        status: 'UNDER_REVIEW',
        reviewStartedAt: new Date().toISOString(),
      })
      .eq('id', id);

    // Send notification
    await notificationService.sendNotification(id, 'REVIEW_STARTED');

    return NextResponse.json(routingResult);
  } catch (error: any) {
    console.error('Routing error:', error);
    return NextResponse.json(
      {error: error.message || 'Internal server error'},
      {status: 500}
    );
  }
}
