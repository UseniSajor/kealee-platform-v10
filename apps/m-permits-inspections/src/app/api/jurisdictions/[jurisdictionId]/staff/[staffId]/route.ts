import {NextRequest, NextResponse} from 'next/server';
import {createServerClient} from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  {params}: {params: {jurisdictionId: string; staffId: string}}
) {
  try {
    const supabase = await createServerClient();
    const {data: {user}} = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const {staffId, jurisdictionId} = params;
    const {data, error} = await supabase
      .from('JurisdictionStaff')
      .select('*')
      .eq('id', staffId)
      .eq('jurisdictionId', jurisdictionId)
      .single();

    if (error || !data) {
      return NextResponse.json({error: 'Staff not found'}, {status: 404});
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
}

export async function PUT(
  request: NextRequest,
  {params}: {params: {jurisdictionId: string; staffId: string}}
) {
  try {
    const supabase = await createServerClient();
    const {data: {user}} = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const {staffId, jurisdictionId} = params;
    const body = await request.json();

    // Remove fields that shouldn't be directly updated
    const {id, createdAt, ...updateFields} = body;

    const {data, error} = await supabase
      .from('JurisdictionStaff')
      .update(updateFields)
      .eq('id', staffId)
      .eq('jurisdictionId', jurisdictionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating staff:', error);
      return NextResponse.json({error: 'Staff not found or update failed'}, {status: 404});
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating staff:', error);
    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
}

export async function DELETE(
  request: NextRequest,
  {params}: {params: {jurisdictionId: string; staffId: string}}
) {
  try {
    const supabase = await createServerClient();
    const {data: {user}} = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const {staffId, jurisdictionId} = params;

    // Soft delete - mark as inactive
    const {data, error} = await supabase
      .from('JurisdictionStaff')
      .update({isActive: false})
      .eq('id', staffId)
      .eq('jurisdictionId', jurisdictionId)
      .select()
      .single();

    if (error) {
      console.error('Error deactivating staff:', error);
      return NextResponse.json({error: 'Staff not found'}, {status: 404});
    }

    return NextResponse.json({success: true});
  } catch (error) {
    console.error('Error deleting staff:', error);
    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
}
