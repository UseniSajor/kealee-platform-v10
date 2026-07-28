/**
 * Measurements API — Record and retrieve measurements from mobile LiDAR capture
 * Handles MeasurementSession creation, Measurement storage, and SMS/email confirmations
 */

import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { PrismaClient } from '@prisma/client'
import { sendMeasurementConfirmation as sendMeasurementEmail } from '@/lib/services/resend'
import { sendMeasurementConfirmation as sendMeasurementSMS } from '@/lib/services/twilio'

const prisma = new PrismaClient()

export interface MeasurementData {
  projectId?: string
  intakeId?: string
  distance: number
  unit: 'mm' | 'cm' | 'inches' | 'feet' | 'meters'
  method: 'lidar_direct' | 'tof_sensor' | 'reference_object' | 'ai_detection' | 'perspective_estimation'
  accuracy?: 'high' | 'medium' | 'low'
  confidence: number
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

    if (!body.distance || !body.unit || !body.method) {
      return NextResponse.json(
        { error: 'Missing required fields: distance, unit, method' },
        { status: 400 }
      )
    }

    const supabaseAuth = createRouteHandlerClient({ cookies })
    const { data: { user: sessionUser } } = await supabaseAuth.auth.getUser()
    const userId = sessionUser?.id || null

    // Create or get active measurement session
    let sessionRecord = await prisma.measurementSession.findFirst({
      where: {
        userId: userId,
        projectId: body.projectId || undefined,
        endedAt: null,
      },
    })

    if (!sessionRecord) {
      sessionRecord = await prisma.measurementSession.create({
        data: {
          userId: userId,
          projectId: body.projectId || undefined,
          deviceModel: body.metadata?.deviceModel || 'Unknown',
          capabilities: {},
        },
      })
    }

    // Record measurement
    const measurement = await prisma.measurement.create({
      data: {
        sessionId: sessionRecord.id,
        distance: body.distance,
        unit: body.unit,
        method: body.method,
        accuracy: body.accuracy || 'medium',
        confidence: Math.min(100, Math.max(0, body.confidence)),
        projectId: body.projectId || undefined,
        intakeId: body.intakeId || undefined,
        userId: userId,
        metadata: body.metadata || {},
        recordedAt: new Date(body.timestamp),
      },
    })

    console.log('[Measurement] Recorded:', {
      id: measurement.id,
      method: measurement.method,
      distance: `${measurement.distance}${measurement.unit}`,
      confidence: measurement.confidence,
    })

    // Send confirmations
    if (sessionUser) {
      try {
        if (sessionUser.email) {
          await sendMeasurementEmail(
            sessionUser.email,
            body.distance,
            body.unit,
            body.confidence,
            body.method,
            body.projectId
          )
        }
        if (sessionUser.phone) {
          await sendMeasurementSMS(
            sessionUser.phone,
            body.distance,
            body.unit,
            body.confidence
          )
        }
      } catch (notificationError) {
        console.error('[Measurements] Failed to send confirmation:', notificationError)
      }
    }

    return NextResponse.json({
      success: true,
      measurementId: measurement.id,
      sessionId: sessionRecord.id,
      recorded: {
        distance: measurement.distance,
        unit: measurement.unit,
        method: measurement.method,
        confidence: measurement.confidence,
      },
    })
  } catch (error) {
    console.error('[Measurements API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to record measurement' },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    const intakeId = searchParams.get('intakeId')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!projectId && !intakeId) {
      return NextResponse.json(
        { error: 'Either projectId or intakeId required' },
        { status: 400 }
      )
    }

    const measurements = await prisma.measurement.findMany({
      where: {
        OR: [
          { projectId: projectId || undefined },
          { intakeId: intakeId || undefined },
        ],
      },
      orderBy: { recordedAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({
      success: true,
      measurements,
      count: measurements.length,
    })
  } catch (error) {
    console.error('[Measurements GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve measurements' },
      { status: 500 }
    )
  }
}
