/**
 * Measurements API
 * Handles incoming measurements from mobile capture tool
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

export interface MeasurementData {
  projectId?: string
  intakeId?: string
  distance: number
  unit: 'mm' | 'cm' | 'inches' | 'feet' | 'meters'
  method: 'lidar_direct' | 'tof_sensor' | 'reference_object' | 'ai_detection' | 'perspective_estimation'
  accuracy: 'high' | 'medium' | 'low'
  confidence: number // 0-100
  timestamp: string
  metadata?: {
    deviceModel?: string
    calibrationObject?: string
    perspectiveCorrection?: boolean
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as MeasurementData

    // Validate required fields
    if (!body.distance || !body.unit || !body.method) {
      return NextResponse.json(
        { error: 'Missing required fields: distance, unit, method' },
        { status: 400 }
      )
    }

    // Get session (optional - for authenticated endpoints)
    const session = await getServerSession()

    // Prepare measurement record
    const measurement = {
      distance: body.distance,
      unit: body.unit,
      method: body.method,
      accuracy: body.accuracy,
      confidence: body.confidence,
      timestamp: new Date(body.timestamp),
      metadata: body.metadata || {},
      deviceModel: body.metadata?.deviceModel || 'Unknown',
      sourceApp: 'mobile-capture',
      userId: session?.user?.email || null,
      projectId: body.projectId || null,
      intakeId: body.intakeId || null,
    }

    // Store measurement in database
    // TODO: Wire to Prisma once DB is set up
    // const stored = await prisma.measurement.create({ data: measurement })

    // Log measurement for analytics
    console.log('[Measurement] Recorded:', {
      method: measurement.method,
      distance: `${measurement.distance}${measurement.unit}`,
      confidence: measurement.confidence,
      device: measurement.deviceModel,
    })

    // Trigger any dependent services
    if (body.intakeId) {
      await triggerIntakeUpdate(body.intakeId, measurement)
    }

    return NextResponse.json({
      success: true,
      measurementId: `meas-${Date.now()}`,
      recorded: measurement,
    })
  } catch (error) {
    console.error('[Measurements API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to record measurement' },
      { status: 500 }
    )
  }
}

/**
 * Update intake with measurement data
 */
async function triggerIntakeUpdate(intakeId: string, measurement: any) {
  try {
    // Update intake record with measurement
    // TODO: Prisma update
    // await prisma.intake.update({
    //   where: { id: intakeId },
    //   data: {
    //     measurements: { push: measurement }
    //   }
    // })

    console.log('[Measurements] Updated intake:', intakeId)
  } catch (error) {
    console.error('[Measurements] Failed to update intake:', error)
  }
}
