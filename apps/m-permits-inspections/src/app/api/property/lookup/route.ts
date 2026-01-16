import {NextRequest, NextResponse} from 'next/server';
import {propertyLookupService} from '@/services/permit-application/property-lookup';

export async function GET(request: NextRequest) {
  try {
    const {searchParams} = new URL(request.url);
    const address = searchParams.get('address');
    const parcel = searchParams.get('parcel');
    const jurisdictionId = searchParams.get('jurisdictionId') || undefined;

    if (address) {
      const data = await propertyLookupService.lookupByAddress(address, jurisdictionId);
      return NextResponse.json(data);
    }

    if (parcel) {
      const data = await propertyLookupService.lookupByParcel(parcel, jurisdictionId);
      return NextResponse.json(data);
    }

    return NextResponse.json({error: 'Address or parcel number required'}, {status: 400});
  } catch (error) {
    console.error('Property lookup error:', error);
    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
}
