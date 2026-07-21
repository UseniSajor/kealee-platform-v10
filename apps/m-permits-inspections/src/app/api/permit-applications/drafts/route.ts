import {NextRequest, NextResponse} from 'next/server';
import {createServerClient} from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {data: {user}} = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const {searchParams} = new URL(request.url);
    const userId = searchParams.get('userId') || user.id;

    const {data, error} = await supabase
      .from('Permit')
      .select('id, permitType, scope, jurisdictionId, createdAt, updatedAt, address, applicantName')
      .eq('clientId', userId)
      .eq('status', 'DRAFT')
      .order('updatedAt', {ascending: false});

    if (error) {
      console.error('Error fetching drafts:', error);
      return NextResponse.json({error: 'Failed to fetch drafts'}, {status: 500});
    }

    // Map to SavedApplication-compatible format
    const drafts = (data || []).map(permit => ({
      id: permit.id,
      userId,
      data: {},
      currentStep: 0,
      progress: 10,
      savedAt: permit.updatedAt,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      jurisdictionId: permit.jurisdictionId,
      permitType: permit.permitType,
    }));

    return NextResponse.json(drafts);
  } catch (error) {
    console.error('Error fetching drafts:', error);
    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {data: {user}} = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const body = await request.json();

    // Create a draft permit from the wizard data
    const {data, error} = await supabase
      .from('Permit')
      .insert({
        clientId: user.id,
        status: 'DRAFT',
        kealeeStatus: 'DRAFT',
        permitType: body.permitType || body.data?.permitType || 'BUILDING',
        scope: body.data?.scope || 'Draft application',
        address: body.data?.address || '',
        applicantName: body.data?.applicantName || user.email || '',
        applicantEmail: body.data?.applicantEmail || user.email || '',
        applicantPhone: body.data?.applicantPhone || '',
        applicantType: body.data?.applicantType || 'OWNER',
        applicantId: user.id,
        jurisdictionId: body.jurisdictionId || body.data?.jurisdictionId,
        projectId: body.data?.projectId,
        pmUserId: user.id,
        valuation: body.data?.valuation || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating draft:', error);
      return NextResponse.json({error: error.message || 'Failed to create draft'}, {status: 500});
    }

    const draft = {
      id: data.id,
      userId: user.id,
      data: body.data || {},
      currentStep: body.currentStep || 0,
      progress: body.progress || 0,
      savedAt: data.createdAt,
      expiresAt: body.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      jurisdictionId: data.jurisdictionId,
      permitType: data.permitType,
    };

    return NextResponse.json(draft, {status: 201});
  } catch (error) {
    console.error('Error saving draft:', error);
    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
}
