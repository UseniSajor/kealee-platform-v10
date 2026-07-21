import {NextRequest, NextResponse} from 'next/server';
import {JurisdictionStaff} from '@permits/src/types/jurisdiction-staff';

// Mock data - replace with database queries
const staffMembers: JurisdictionStaff[] = [];

export async function GET(
  request: NextRequest,
  {params}: {params: {jurisdictionId: string}}
) {
  try {
    const {jurisdictionId} = params;
    const staff = staffMembers.filter(s => s.jurisdictionId === jurisdictionId);
    return NextResponse.json(staff);
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
    const {jurisdictionId} = params;
    const body = await request.json();
    
    const newStaff: JurisdictionStaff = {
      id: `staff-${Date.now()}`,
      jurisdictionId,
      userId: body.userId,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      employeeId: body.employeeId,
      role: body.role,
      disciplines: body.disciplines || [],
      certifications: body.certifications || [],
      currentWorkload: 0,
      maxWorkload: body.maxWorkload || 25,
      isActive: body.isActive !== false,
      reviewsCompleted: 0,
      inspectionsCompleted: 0,
      workingHours: body.workingHours || {
        monday: {start: '09:00', end: '17:00'},
        tuesday: {start: '09:00', end: '17:00'},
        wednesday: {start: '09:00', end: '17:00'},
        thursday: {start: '09:00', end: '17:00'},
        friday: {start: '09:00', end: '17:00'},
      },
      timezone: body.timezone || 'America/New_York',
      vacationDates: [],
      trainingRecords: [],
      certifications: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    staffMembers.push(newStaff);
    return NextResponse.json(newStaff, {status: 201});
  } catch (error) {
    console.error('Error creating staff:', error);
    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
}
