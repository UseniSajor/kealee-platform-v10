import {NextRequest, NextResponse} from 'next/server';
import {permitApplicationCreatorService} from '@permits/src/services/architect-integration/permit-application-creator';
import {createServerClient as createClient} from '@permits/src/lib/supabase/server';

/**
 * POST /api/architect-integration/submit-permit-package
 * Submit permit package from design project
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {data: {user}} = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const body = await request.json();
    const {
      designProjectId,
      jurisdictionId,
      permitType,
      options,
    } = body;

    if (!designProjectId || !jurisdictionId || !permitType) {
      return NextResponse.json(
        {error: 'Missing required fields: designProjectId, jurisdictionId, permitType'},
        {status: 400}
      );
    }

    // Create permit application
    const result = await permitApplicationCreatorService.createPermitApplication(
      {
        designProjectId,
        jurisdictionId,
        permitType,
        options,
      },
      user.id
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Permit package submission error:', error);
    return NextResponse.json(
      {error: error.message || 'Internal server error'},
      {status: 500}
    );
  }
}
