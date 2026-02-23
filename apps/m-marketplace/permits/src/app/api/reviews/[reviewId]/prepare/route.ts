import {NextRequest, NextResponse} from 'next/server';
import {checklistGeneratorService} from '@permits/src/services/review-preparation/checklist-generator';
import {codeLinkerService} from '@permits/src/services/review-preparation/code-linker';
import {createClient} from '@permits/src/lib/supabase/client';

/**
 * POST /api/reviews/:reviewId/prepare
 * Prepare review with checklist and code links
 */
export async function POST(
  request: NextRequest,
  {params}: {params: {reviewId: string}}
) {
  try {
    const {reviewId} = params;
    const supabase = createClient();

    // Get review
    const {data: review} = await supabase
      .from('PermitReview')
      .select('permitId, discipline, permit:permitId(type)')
      .eq('id', reviewId)
      .single();

    if (!review) {
      return NextResponse.json({error: 'Review not found'}, {status: 404});
    }

    // Generate checklist
    const checklist = await checklistGeneratorService.generateChecklist(
      review.permitId,
      reviewId,
      review.discipline,
      (review.permit as any)?.type || ''
    );

    // Save checklist
    await checklistGeneratorService.saveChecklist(checklist);

    // Link design elements to code
    const codeLinks = await codeLinkerService.linkDesignElements(
      review.permitId,
      reviewId,
      review.discipline
    );

    return NextResponse.json({
      success: true,
      checklist: {
        items: checklist.items.length,
        completed: checklist.completed,
        total: checklist.total,
      },
      codeLinks: codeLinks.length,
    });
  } catch (error: any) {
    console.error('Review preparation error:', error);
    return NextResponse.json(
      {error: error.message || 'Internal server error'},
      {status: 500}
    );
  }
}
