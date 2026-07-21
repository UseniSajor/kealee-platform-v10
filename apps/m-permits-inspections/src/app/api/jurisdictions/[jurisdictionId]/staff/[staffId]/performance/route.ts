import {NextRequest, NextResponse} from 'next/server';
import {performanceMetricsService} from '@/services/jurisdiction-staff/performance-metrics';
import {JurisdictionStaff} from '@/types/jurisdiction-staff';

// Mock data
const staffMembers: JurisdictionStaff[] = [];

export async function GET(
  request: NextRequest,
  {params}: {params: {jurisdictionId: string; staffId: string}}
) {
  try {
    const {staffId} = params;
    const {searchParams} = new URL(request.url);
    const period = (searchParams.get('period') || 'monthly') as 'daily' | 'weekly' | 'monthly' | 'yearly';

    const staff = staffMembers.find(s => s.id === staffId);
    if (!staff) {
      return NextResponse.json({error: 'Staff not found'}, {status: 404});
    }

    const metrics = await performanceMetricsService.calculateMetrics(staff, period);
    const dashboard = await performanceMetricsService.getDashboardData(staff);

    return NextResponse.json({
      metrics,
      dashboard,
    });
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
}
