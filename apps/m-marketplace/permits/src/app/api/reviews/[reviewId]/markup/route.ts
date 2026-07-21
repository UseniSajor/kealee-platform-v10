import {NextRequest, NextResponse} from 'next/server';
import {pdfMarkupService} from '@permits/src/services/plan-review/pdf-markup';

/**
 * GET /api/reviews/:reviewId/markup
 * Get markup annotations for review
 */
export async function GET(
  request: NextRequest,
  {params}: {params: {reviewId: string}}
) {
  try {
    const {reviewId} = params;
    const {searchParams} = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json({error: 'documentId required'}, {status: 400});
    }

    const annotations = await pdfMarkupService.getAnnotations(reviewId, documentId);

    return NextResponse.json(annotations);
  } catch (error: any) {
    console.error('Markup error:', error);
    return NextResponse.json(
      {error: error.message || 'Internal server error'},
      {status: 500}
    );
  }
}

/**
 * POST /api/reviews/:reviewId/markup
 * Create markup annotation
 */
export async function POST(
  request: NextRequest,
  {params}: {params: {reviewId: string}}
) {
  try {
    const {reviewId} = params;
    const body = await request.json();

    const annotation = await pdfMarkupService.createAnnotation(
      reviewId,
      body.documentId,
      body
    );

    return NextResponse.json(annotation);
  } catch (error: any) {
    console.error('Markup creation error:', error);
    return NextResponse.json(
      {error: error.message || 'Internal server error'},
      {status: 500}
    );
  }
}
