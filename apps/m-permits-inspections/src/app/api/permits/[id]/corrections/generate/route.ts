import {NextRequest, NextResponse} from 'next/server';
import {correctionListGeneratorService} from '@/services/review-workflow/correction-list-generator';

/**
 * POST /api/permits/:permitId/corrections/generate
 * Generate correction list from review comments
 */
export async function POST(
  request: NextRequest,
  {params}: {params: {permitId: string}}
) {
  try {
    const {permitId} = params;

    const correctionList = await correctionListGeneratorService.generateCorrectionList(permitId);

    return NextResponse.json(correctionList);
  } catch (error: any) {
    console.error('Correction generation error:', error);
    return NextResponse.json(
      {error: error.message || 'Internal server error'},
      {status: 500}
    );
  }
}
