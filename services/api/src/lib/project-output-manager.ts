/**
 * ProjectOutput Manager Service
 * Updates ProjectOutput records with persisted deliverable URLs
 * Bridges between deliverable generation and database persistence
 */

import { prismaAny } from '../utils/prisma-helper'

export interface ProjectOutputUpdateOptions {
  projectOutputId: string
  serviceType: 'concept' | 'estimation' | 'permit'
  deliveryStatus: 'pending' | 'generating' | 'persisted' | 'failed'
  resultJson?: Record<string, any>
  pdfUrl?: string
  conceptImageUrls?: string[]
  estimationPdfUrl?: string
  permitFileUrls?: string[]
  fileMetadata?: Record<string, any>
}

/**
 * Update ProjectOutput with persisted deliverable URLs
 * Called after successful upload to Supabase Storage
 */
export async function updateProjectOutputWithDeliverables(
  opts: ProjectOutputUpdateOptions
): Promise<void> {
  try {
    const updateData: any = {
      deliveryStatus: opts.deliveryStatus,
      serviceType: opts.serviceType,
    }

    // Set PDF URL based on service type
    if (opts.pdfUrl) {
      updateData.pdfUrl = opts.pdfUrl
      updateData.downloadUrl = opts.pdfUrl
    }

    // Set concept-specific fields
    if (opts.conceptImageUrls) {
      updateData.conceptImageUrls = opts.conceptImageUrls
    }

    // Set estimation-specific fields
    if (opts.estimationPdfUrl) {
      updateData.estimationPdfUrl = opts.estimationPdfUrl
    }

    // Set permit-specific fields
    if (opts.permitFileUrls) {
      updateData.permitFileUrls = opts.permitFileUrls
    }

    // Update file metadata
    if (opts.fileMetadata) {
      updateData.fileMetadata = opts.fileMetadata
    }

    // Update result JSON if provided
    if (opts.resultJson) {
      updateData.resultJson = opts.resultJson
    }

    // Mark completion time
    if (opts.deliveryStatus === 'persisted') {
      updateData.completedAt = new Date()
    }

    await prismaAny.projectOutput.update({
      where: { id: opts.projectOutputId },
      data: updateData,
    })

    console.log(
      `[ProjectOutput] Updated ${opts.projectOutputId} with deliverables (${opts.serviceType})`
    )
  } catch (err: any) {
    console.error('[ProjectOutput] Failed to update with deliverables:', err?.message)
    // Non-blocking: don't throw
  }
}

/**
 * Create ProjectOutput record for a new deliverable request
 */
export async function createProjectOutput(
  data: {
    projectId?: string
    intakeId?: string
    orderId?: string
    serviceType: 'concept' | 'estimation' | 'permit'
    status?: 'pending' | 'generating' | 'completed' | 'failed'
    metadata?: Record<string, any>
  }
): Promise<string> {
  try {
    const output = await prismaAny.projectOutput.create({
      data: {
        projectId: data.projectId,
        intakeId: data.intakeId,
        orderId: data.orderId,
        type: data.serviceType,
        serviceType: data.serviceType,
        status: data.status || 'pending',
        deliveryStatus: 'pending',
        metadata: data.metadata,
      },
      select: { id: true },
    })

    return output.id
  } catch (err: any) {
    console.error('[ProjectOutput] Failed to create record:', err?.message)
    throw err
  }
}

/**
 * Get ProjectOutput with deliverables
 */
export async function getProjectOutputWithDeliverables(
  projectOutputId: string
): Promise<any> {
  try {
    return await prismaAny.projectOutput.findUnique({
      where: { id: projectOutputId },
      select: {
        id: true,
        status: true,
        type: true,
        serviceType: true,
        deliveryStatus: true,
        resultJson: true,
        pdfUrl: true,
        downloadUrl: true,
        conceptImageUrls: true,
        estimationPdfUrl: true,
        permitFileUrls: true,
        fileMetadata: true,
        generatedAt: true,
        completedAt: true,
      },
    })
  } catch (err: any) {
    console.error('[ProjectOutput] Failed to fetch record:', err?.message)
    return null
  }
}
