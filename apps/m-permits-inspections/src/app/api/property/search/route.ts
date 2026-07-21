import {NextRequest, NextResponse} from 'next/server';
import {propertyLookupService} from '@/services/permit-application/property-lookup';

export async function GET(request: NextRequest) {
  try {
    const {searchParams} = new URL(request.url);
    const query = searchParams.get('q');
    const jurisdictionId = searchParams.get('jurisdictionId') || undefined;

    if (!query) {
      return NextResponse.json({error: 'Search query required'}, {status: 400});
    }

    const results = await propertyLookupService.searchProperties(query, jurisdictionId);
    return NextResponse.json(results);
  } catch (error) {
    console.error('Property search error:', error);
    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
}
