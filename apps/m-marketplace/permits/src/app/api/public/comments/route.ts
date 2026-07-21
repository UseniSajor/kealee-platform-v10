import {NextRequest, NextResponse} from 'next/server';
import {publicCommentsService} from '@permits/src/services/public-portal/public-comments';

/**
 * POST /api/public/comments
 * Submit public comment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const comment = await publicCommentsService.submitPublicComment({
      permitId: body.permitId,
      authorName: body.authorName,
      authorEmail: body.authorEmail,
      authorPhone: body.authorPhone,
      comment: body.comment,
      category: body.category || 'GENERAL',
      isPublic: body.isPublic !== false, // Default to public
    });

    return NextResponse.json(comment);
  } catch (error: any) {
    console.error('Comment submission error:', error);
    return NextResponse.json(
      {error: error.message || 'Internal server error'},
      {status: 500}
    );
  }
}

/**
 * GET /api/public/comments?permitId=xxx
 * Get public comments for permit
 */
export async function GET(request: NextRequest) {
  try {
    const {searchParams} = new URL(request.url);
    const permitId = searchParams.get('permitId');

    if (!permitId) {
      return NextResponse.json({error: 'permitId required'}, {status: 400});
    }

    const comments = await publicCommentsService.getPublicComments(permitId);

    return NextResponse.json(comments);
  } catch (error: any) {
    console.error('Get comments error:', error);
    return NextResponse.json(
      {error: error.message || 'Internal server error'},
      {status: 500}
    );
  }
}
