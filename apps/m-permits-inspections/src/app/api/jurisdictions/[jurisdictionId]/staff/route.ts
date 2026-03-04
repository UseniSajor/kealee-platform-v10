import {NextRequest, NextResponse} from 'next/server';
import {createServerClient} from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  {params}: {params: {jurisdictionId: string}}
) {
  try {
    const supabase = await createServerClient();
    const {data: {user}} = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const {jurisdictionId} = params;
    const {searchParams} = new URL(request.url);
    const activeOnly = searchParams.get('active') !== 'false';

    let query = supabase
      .from('JurisdictionStaff')
      .select('*')
      .eq('jurisdictionId', jurisdictionId);

    if (activeOnly) {
      query = query.eq('isActive', true);
    }

    const {data, error} = await query.order('lastName', {ascending: true});

    if (error) {
      console.error('Error fetching staff:', error);
      return NextResponse.json({error: 'Failed to fetch staff'}, {status: 500});
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
}

export async function POST(
  request: NextRequest,
  {params}: {params: {jurisdictionId: string}}
) {
  try {
    const supabase = await createServerClient();
    const {data: {user}} = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const {jurisdictionId} = params;
    const body = await request.json();

    const {data, error} = await supabase
      .from('JurisdictionStaff')
      .insert({
        jurisdictionId,
        userId: body.userId || null,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone || null,
        employeeId: body.employeeId || null,
        role: body.role,
        disciplines: body.disciplines || [],
        certifications: body.certifications || [],
        currentWorkload: 0,
        maxWorkload: body.maxWorkload || 25,
        isActive: body.isActive !== false,
        workingHours: body.workingHours || {
          monday: {start: '09:00', end: '17:00'},
          tuesday: {start: '09:00', end: '17:00'},
          wednesday: {start: '09:00', end: '17:00'},
          thursday: {start: '09:00', end: '17:00'},
          friday: {start: '09:00', end: '17:00'},
        },
        timezone: body.timezone || 'America/New_York',
        hiredDate: body.hiredDate || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating staff:', error);
      return NextResponse.json({error: error.message || 'Failed to create staff'}, {status: 500});
    }

    return NextResponse.json(data, {status: 201});
  } catch (error) {
    console.error('Error creating staff:', error);
    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
}
