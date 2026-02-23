import {NextRequest, NextResponse} from 'next/server';
import {VideoInspection} from '@permits/src/types/video-inspection';

// Mock data - replace with database queries
const inspections: VideoInspection[] = [];

export async function GET(request: NextRequest) {
  try {
    const {searchParams} = new URL(request.url);
    const inspectionId = searchParams.get('id');
    const permitId = searchParams.get('permitId');

    if (inspectionId) {
      const inspection = inspections.find((i) => i.id === inspectionId);
      if (!inspection) {
        return NextResponse.json({error: 'Inspection not found'}, {status: 404});
      }
      return NextResponse.json(inspection);
    }

    if (permitId) {
      const filtered = inspections.filter((i) => i.permitId === permitId);
      return NextResponse.json(filtered);
    }

    return NextResponse.json(inspections);
  } catch (error) {
    console.error('Error fetching video inspections:', error);
    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const inspection: VideoInspection = {
      id: `video-inspection-${Date.now()}`,
      inspectionId: body.inspectionId,
      permitId: body.permitId,
      scheduledAt: new Date(body.scheduledAt),
      status: 'scheduled',
      participants: body.participants || [],
      checklist: body.checklist || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    inspections.push(inspection);
    return NextResponse.json(inspection, {status: 201});
  } catch (error) {
    console.error('Error creating video inspection:', error);
    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
}
