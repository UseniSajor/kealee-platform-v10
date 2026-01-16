import {NextRequest, NextResponse} from 'next/server';
import {JurisdictionStaff} from '@/types/jurisdiction-staff';

// Mock data - replace with database queries
const staffMembers: JurisdictionStaff[] = [];

export async function GET(
  request: NextRequest,
  {params}: {params: {jurisdictionId: string; staffId: string}}
) {
  try {
    const {staffId} = params;
    const staff = staffMembers.find(s => s.id === staffId);
    
    if (!staff) {
      return NextResponse.json({error: 'Staff not found'}, {status: 404});
    }
    
    return NextResponse.json(staff);
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
    const {staffId} = params;
    const body = await request.json();
    
    const index = staffMembers.findIndex(s => s.id === staffId);
    if (index === -1) {
      return NextResponse.json({error: 'Staff not found'}, {status: 404});
    }

    staffMembers[index] = {
      ...staffMembers[index],
      ...body,
      updatedAt: new Date(),
    };

    return NextResponse.json(staffMembers[index]);
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
    const {staffId} = params;
    const index = staffMembers.findIndex(s => s.id === staffId);
    
    if (index === -1) {
      return NextResponse.json({error: 'Staff not found'}, {status: 404});
    }

    // Soft delete - mark as inactive
    staffMembers[index] = {
      ...staffMembers[index],
      isActive: false,
      updatedAt: new Date(),
    };

    return NextResponse.json({success: true});
  } catch (error) {
    console.error('Error deleting staff:', error);
    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
}
