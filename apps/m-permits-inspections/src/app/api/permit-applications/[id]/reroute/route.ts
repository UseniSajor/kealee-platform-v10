import {NextRequest, NextResponse} from 'next/server';
import {applicationRouterService} from '@/services/permit-routing/application-router';
import {notificationService} from '@/services/permit-routing/notification-service';
import {createClient} from '@/lib/supabase/client';

/**
 * POST /api/permit-applications/:id/reroute
 * Re-route a permit application (for corrections/resubmittals)
 */
export async function POST(
  request: NextRequest,
  {params}: {params: {id: string}}
) {
  try {
    const {id} = params;
    const body = await request.json();
    const {excludePreviousReviewers, priority} = body;

    // Re-route application
    const routingResult = await applicationRouterService.rerouteApplication(id, {
      excludePreviousReviewers,
      priority,
    });

    // Update existing reviews or create new ones
    const supabase = createClient();
    
    // Close previous reviews
    await supabase
      .from('PermitReview')
      .update({status: 'COMPLETED_CORRECTIONS_REQUIRED'})
      .eq('permitId', id)
      .in('status', ['ASSIGNED', 'IN_PROGRESS']);

    // Create new review assignments
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
    await notificationService.sendNotification(id, 'REVIEW_STARTED', {
      customMessage: 'Your permit application has been re-routed for review after corrections.',
    });

    return NextResponse.json(routingResult);
  } catch (error: any) {
    console.error('Re-routing error:', error);
    return NextResponse.json(
      {error: error.message || 'Internal server error'},
      {status: 500}
    );
  }
}
