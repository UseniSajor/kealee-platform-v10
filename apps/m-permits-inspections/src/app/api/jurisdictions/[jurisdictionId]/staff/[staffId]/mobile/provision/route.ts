import {NextRequest, NextResponse} from 'next/server';
import {mobileProvisioningService} from '@/services/jurisdiction-staff/mobile-provisioning';
import {JurisdictionStaff} from '@/types/jurisdiction-staff';

// Mock data
const staffMembers: JurisdictionStaff[] = [];

export async function POST(
  request: NextRequest,
  {params}: {params: {jurisdictionId: string; staffId: string}}
) {
  try {
    const {staffId} = params;
    const body = await request.json();

    const staff = staffMembers.find(s => s.id === staffId);
    if (!staff) {
      return NextResponse.json({error: 'Staff not found'}, {status: 404});
    }

    const result = await mobileProvisioningService.provisionDevice(staff, {
      staffId,
      deviceId: body.deviceId,
      deviceType: body.deviceType,
      deviceName: body.deviceName,
      requestedAt: new Date(),
    });

    if (!result.success) {
      return NextResponse.json(
        {error: 'Staff member is not eligible for mobile access'},
        {status: 400}
      );
    }

    // Update staff record
    const staffIndex = staffMembers.findIndex(s => s.id === staffId);
    if (staffIndex >= 0) {
      staffMembers[staffIndex] = {
        ...staffMembers[staffIndex],
        mobileDeviceId: result.device.id,
        lastActive: new Date(),
      };
    }

    return NextResponse.json({
      success: true,
      device: result.device,
      accessToken: result.accessToken,
    });
  } catch (error) {
    console.error('Error provisioning device:', error);
    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
}

export async function DELETE(
  request: NextRequest,
  {params}: {params: {jurisdictionId: string; staffId: string}}
) {
  try {
    const body = await request.json();
    const {deviceId} = body;

    const success = await mobileProvisioningService.revokeDevice(deviceId);

    if (!success) {
      return NextResponse.json({error: 'Device not found'}, {status: 404});
    }

    return NextResponse.json({success: true});
  } catch (error) {
    console.error('Error revoking device:', error);
    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
}
