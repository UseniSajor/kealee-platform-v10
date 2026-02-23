import {NextRequest, NextResponse} from 'next/server';
import {faqResourcesService} from '@permits/src/services/public-portal/faq-resources';

/**
 * GET /api/public/faq
 * Get FAQs
 */
export async function GET(request: NextRequest) {
  try {
    const {searchParams} = new URL(request.url);
    const jurisdictionId = searchParams.get('jurisdictionId') || undefined;
    const category = searchParams.get('category') as any;
    const query = searchParams.get('q') || undefined;

    if (query) {
      const results = await faqResourcesService.searchFAQs(query, jurisdictionId);
      return NextResponse.json(results);
    }

    const faqs = await faqResourcesService.getFAQs(jurisdictionId, category);

    return NextResponse.json(faqs);
  } catch (error: any) {
    console.error('FAQ error:', error);
    return NextResponse.json(
      {error: error.message || 'Internal server error'},
      {status: 500}
    );
  }
}
