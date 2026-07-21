import {NextRequest, NextResponse} from 'next/server';
import {jurisdictionOnboardingService} from '@permits/src/services/jurisdiction/onboarding-service';
import {createServerClient as createClient} from '@permits/src/lib/supabase/server';

/**
 * POST /api/jurisdictions/onboard
 * Complete jurisdiction onboarding
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {data: {user}} = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const body = await request.json();
    
    // Get or find admin user by email
    let adminUserId = body.adminUserId;
    if (!adminUserId && body.adminEmail) {
      const {data: adminUser} = await supabase
        .from('User')
        .select('id')
        .eq('email', body.adminEmail)
        .single();

      if (!adminUser) {
        return NextResponse.json(
          {error: `User with email ${body.adminEmail} not found. Please sign up first.`},
          {status: 400}
        );
      }

      adminUserId = adminUser.id;
    }

    // Complete onboarding
    const result = await jurisdictionOnboardingService.onboardJurisdiction({
      ...body,
      adminUserId: adminUserId || user.id,
      adminEmail: body.adminEmail || user.email || '',
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Onboarding error:', error);
    return NextResponse.json(
      {error: error.message || 'Internal server error'},
      {status: 500}
    );
  }
}
