import {NextRequest, NextResponse} from 'next/server';
import {workloadBalancerService} from '@permits/src/services/jurisdiction-staff/workload-balancer';
import {JurisdictionStaff} from '@permits/src/types/jurisdiction-staff';

// Mock data
const staffMembers: JurisdictionStaff[] = [];

export async function POST(
  request: NextRequest,
  {params}: {params: {jurisdictionId: string; staffId: string}}
) {
  try {
    const {jurisdictionId} = params;
    const body = await request.json();

    // Get all staff for jurisdiction
    const allStaff = staffMembers.filter(s => s.jurisdictionId === jurisdictionId);

    // Use workload balancer to find best assignment
    const assignment = await workloadBalancerService.assignWork(allStaff, {
      permitId: body.permitId,
      inspectionId: body.inspectionId,
      reviewId: body.reviewId,
      discipline: body.discipline,
      priority: body.priority || 'medium',
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      estimatedHours: body.estimatedHours,
      location: body.location,
      excludeStaffIds: body.excludeStaffIds,
    });

    if (!assignment) {
      return NextResponse.json(
        {error: 'No available staff member found'},
        {status: 404}
      );
    }

    // Update staff workload
    const staffIndex = staffMembers.findIndex(s => s.id === assignment.staffId);
    if (staffIndex >= 0) {
      staffMembers[staffIndex] = {
        ...staffMembers[staffIndex],
        currentWorkload: staffMembers[staffIndex].currentWorkload + 1,
      };
    }

    return NextResponse.json({
      success: true,
      assignment,
      staffId: assignment.staffId,
    });
  } catch (error) {
    console.error('Error assigning work:', error);
    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
}
