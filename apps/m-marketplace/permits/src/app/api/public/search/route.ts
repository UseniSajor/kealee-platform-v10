import {NextRequest, NextResponse} from 'next/server';
import {permitSearchService} from '@permits/src/services/public-portal/permit-search';

/**
 * GET /api/public/search
 * Search permits (public endpoint)
 */
export async function GET(request: NextRequest) {
  try {
    const {searchParams} = new URL(request.url);
    const query = searchParams.get('q') || '';
    const searchType = (searchParams.get('type') ||
      'ALL') as 'ADDRESS' | 'PERMIT_NUMBER' | 'OWNER' | 'PARCEL' | 'ALL';
    const jurisdictionId = searchParams.get('jurisdictionId') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    if (!query) {
      return NextResponse.json(
        {error: 'Search query required'},
        {status: 400}
      );
    }

    const result = await permitSearchService.searchPermits(
      {
        query,
        searchType,
        jurisdictionId,
      },
      page,
      pageSize
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json(
      {error: error.message || 'Internal server error'},
      {status: 500}
    );
  }
}
