import {NextRequest, NextResponse} from 'next/server';
import {createServerClient} from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  {params}: {params: {id: string}}
) {
  try {
    const supabase = await createServerClient();
    const {data: {user}} = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const {id} = params;
    const {data, error} = await supabase
      .from('Permit')
      .select('*')
      .eq('id', id)
      .eq('status', 'DRAFT')
      .single();

    if (error || !data) {
      return NextResponse.json({error: 'Draft not found'}, {status: 404});
    }

    // Verify ownership
    if (data.clientId !== user.id) {
      return NextResponse.json({error: 'Not authorized'}, {status: 403});
    }

    const draft = {
      id: data.id,
      userId: data.clientId,
      data: {
        permitType: data.permitType,
        scope: data.scope,
        address: data.address,
        applicantName: data.applicantName,
        applicantEmail: data.applicantEmail,
        applicantPhone: data.applicantPhone,
        applicantType: data.applicantType,
        jurisdictionId: data.jurisdictionId,
        projectId: data.projectId,
        valuation: data.valuation,
      },
      currentStep: 0,
      progress: 10,
      savedAt: data.updatedAt,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      jurisdictionId: data.jurisdictionId,
      permitType: data.permitType,
    };

    return NextResponse.json(draft);
  } catch (error) {
    console.error('Error fetching draft:', error);
    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
}

export async function DELETE(
  request: NextRequest,
  {params}: {params: {id: string}}
) {
  try {
    const supabase = await createServerClient();
    const {data: {user}} = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const {id} = params;

    // Verify ownership before deleting
    const {data: existing} = await supabase
      .from('Permit')
      .select('clientId')
      .eq('id', id)
      .eq('status', 'DRAFT')
      .single();

    if (!existing) {
      return NextResponse.json({error: 'Draft not found'}, {status: 404});
    }

    if (existing.clientId !== user.id) {
      return NextResponse.json({error: 'Not authorized'}, {status: 403});
    }

    const {error} = await supabase
      .from('Permit')
      .delete()
      .eq('id', id)
      .eq('status', 'DRAFT');

    if (error) {
      console.error('Error deleting draft:', error);
      return NextResponse.json({error: 'Failed to delete draft'}, {status: 500});
    }

    return NextResponse.json({success: true});
  } catch (error) {
    console.error('Error deleting draft:', error);
    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
}
