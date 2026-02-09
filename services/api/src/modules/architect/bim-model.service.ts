import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError, ValidationError } from '../../errors/app.error'
import { auditService } from '../audit/audit.service'
import { eventService } from '../events/event.service'

export const bimModelService = {
  /**
   * Upload/create a new BIM model
   */
  async createModel(data: {
    designProjectId: string
    deliverableId?: string
    name: string
    description?: string
    modelFormat: string
    modelFileId: string
    thumbnailUrl?: string
    uploadedById: string
  }) {
    // Check if file exists
    const file = await prismaAny.designFile.findUnique({
      where: { id: data.modelFileId },
    })

    if (!file) {
      throw new NotFoundError('DesignFile', data.modelFileId)
    }

    // Check if this is a new version of existing model
    const existingModel = await prismaAny.bIMModel.findFirst({
      where: {
        designProjectId: data.designProjectId,
        name: data.name,
        isLatestVersion: true,
      },
    })

    let versionNumber = 1
    let previousVersionId: string | undefined

    if (existingModel) {
      versionNumber = existingModel.versionNumber + 1
      previousVersionId = existingModel.id

      // Mark old version as not latest
      await prismaAny.bIMModel.update({
        where: { id: existingModel.id },
        data: { isLatestVersion: false },
      })
    }

    const model = await prismaAny.bIMModel.create({
      data: {
        designProjectId: data.designProjectId,
        deliverableId: data.deliverableId,
        name: data.name,
        description: data.description,
        modelFormat: data.modelFormat as any,
        modelFileId: data.modelFileId,
        thumbnailUrl: data.thumbnailUrl,
        versionNumber,
        isLatestVersion: true,
        previousVersionId,
        fileSize: file.fileSize,
        conversionStatus: 'PENDING',
        uploadedById: data.uploadedById,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: existingModel ? 'BIM_MODEL_VERSIONED' : 'BIM_MODEL_UPLOADED',
      entityType: 'BIMModel',
      entityId: model.id,
      userId: data.uploadedById,
      reason: existingModel ? `New version ${versionNumber} uploaded` : `Model uploaded: ${data.name}`,
      after: {
        name: data.name,
        modelFormat: data.modelFormat,
        versionNumber,
      },
    })

    // Log event
    await eventService.recordEvent({
      type: existingModel ? 'BIM_MODEL_VERSIONED' : 'BIM_MODEL_UPLOADED',
      entityType: 'BIMModel',
      entityId: model.id,
      userId: data.uploadedById,
      payload: {
        name: data.name,
        modelFormat: data.modelFormat,
        versionNumber,
        designProjectId: data.designProjectId,
      },
    })

    // Enqueue model conversion job (BullMQ integration placeholder)
    try {
      // Attempt to enqueue via BullMQ if available; otherwise log for manual processing
      const { Queue } = await import('bullmq').catch(() => ({ Queue: null }))
      if (Queue) {
        const conversionQueue = new Queue('bim-model-conversion', {
          connection: { host: process.env.REDIS_HOST || 'localhost', port: parseInt(process.env.REDIS_PORT || '6379') },
        })
        await conversionQueue.add('convert-model', {
          modelId: model.id,
          modelFormat: data.modelFormat,
          designProjectId: data.designProjectId,
        })
        await conversionQueue.close()
      } else {
        console.log(`[BIM] Model conversion job queued (placeholder) for model ${model.id}, format: ${data.modelFormat}`)
      }
    } catch (err) {
      console.warn(`[BIM] Failed to enqueue model conversion for ${model.id}:`, err)
    }

    return model
  },

  /**
   * Get model with all related data
   */
  async getModel(modelId: string) {
    const model = await prismaAny.bIMModel.findUnique({
      where: { id: modelId },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        previousVersion: {
          select: {
            id: true,
            name: true,
            versionNumber: true,
          },
        },
        views: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            annotations: true,
            clashDetections: true,
            views: true,
          },
        },
      },
    })

    if (!model) {
      throw new NotFoundError('BIMModel', modelId)
    }

    return model
  },

  /**
   * List models for a project
   */
  async listModels(designProjectId: string, filters?: {
    modelFormat?: string
    deliverableId?: string
    isLatestVersion?: boolean
  }) {
    const where: any = {
      designProjectId,
    }

    if (filters?.modelFormat) {
      where.modelFormat = filters.modelFormat
    }

    if (filters?.deliverableId) {
      where.deliverableId = filters.deliverableId
    }

    if (filters?.isLatestVersion !== undefined) {
      where.isLatestVersion = filters.isLatestVersion
    }

    const models = await prismaAny.bIMModel.findMany({
      where,
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            annotations: true,
            clashDetections: true,
            views: true,
          },
        },
      },
      orderBy: [
        { isLatestVersion: 'desc' },
        { versionNumber: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return models
  },

  /**
   * Create model view (saved view configuration)
   */
  async createView(data: {
    modelId: string
    name: string
    description?: string
    viewType: string
    cameraPosition: any
    viewSettings?: any
    slicePlane?: any
    sliceType?: string
    screenshotUrl?: string
    createdById: string
  }) {
    const model = await prismaAny.bIMModel.findUnique({
      where: { id: data.modelId },
    })

    if (!model) {
      throw new NotFoundError('BIMModel', data.modelId)
    }

    const view = await prismaAny.modelView.create({
      data: {
        modelId: data.modelId,
        name: data.name,
        description: data.description,
        viewType: data.viewType as any,
        cameraPosition: data.cameraPosition as any,
        viewSettings: data.viewSettings as any,
        slicePlane: data.slicePlane as any,
        sliceType: data.sliceType,
        screenshotUrl: data.screenshotUrl,
        createdById: data.createdById,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'MODEL_VIEW_CREATED',
      entityType: 'ModelView',
      entityId: view.id,
      userId: data.createdById,
      reason: `View created: ${data.name}`,
      after: {
        name: data.name,
        viewType: data.viewType,
      },
    })

    return view
  },

  /**
   * Create model annotation
   */
  async createAnnotation(data: {
    modelId: string
    annotationType: string
    title: string
    description?: string
    position: any
    elementId?: string
    elementType?: string
    markupData?: any
    createdById: string
  }) {
    const model = await prismaAny.bIMModel.findUnique({
      where: { id: data.modelId },
    })

    if (!model) {
      throw new NotFoundError('BIMModel', data.modelId)
    }

    const annotation = await prismaAny.modelAnnotation.create({
      data: {
        modelId: data.modelId,
        annotationType: data.annotationType as any,
        title: data.title,
        description: data.description,
        position: data.position as any,
        elementId: data.elementId,
        elementType: data.elementType,
        markupData: data.markupData as any,
        createdById: data.createdById,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'MODEL_ANNOTATION_CREATED',
      entityType: 'ModelAnnotation',
      entityId: annotation.id,
      userId: data.createdById,
      reason: `Annotation created: ${data.title}`,
      after: {
        annotationType: data.annotationType,
        title: data.title,
      },
    })

    return annotation
  },

  /**
   * List annotations for a model
   */
  async listAnnotations(modelId: string, filters?: {
    annotationType?: string
    status?: string
    elementId?: string
  }) {
    const where: any = {
      modelId,
    }

    if (filters?.annotationType) {
      where.annotationType = filters.annotationType
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.elementId) {
      where.elementId = filters.elementId
    }

    const annotations = await prismaAny.modelAnnotation.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        resolvedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return annotations
  },

  /**
   * Resolve annotation
   */
  async resolveAnnotation(annotationId: string, userId: string) {
    const annotation = await prismaAny.modelAnnotation.findUnique({
      where: { id: annotationId },
    })

    if (!annotation) {
      throw new NotFoundError('ModelAnnotation', annotationId)
    }

    const updated = await prismaAny.modelAnnotation.update({
      where: { id: annotationId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolvedById: userId,
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'MODEL_ANNOTATION_RESOLVED',
      entityType: 'ModelAnnotation',
      entityId: annotationId,
      userId,
      reason: 'Annotation resolved',
      after: {
        status: 'RESOLVED',
        resolvedAt: updated.resolvedAt,
      },
    })

    return updated
  },

  /**
   * Run clash detection (placeholder - would integrate with clash detection service)
   */
  async runClashDetection(modelId: string, userId: string) {
    const model = await prismaAny.bIMModel.findUnique({
      where: { id: modelId },
    })

    if (!model) {
      throw new NotFoundError('BIMModel', modelId)
    }

    // Basic rule-based clash detection using model component properties
    const components = await prismaAny.modelComponentProperty.findMany({
      where: { modelId },
    })

    // Detect clashes by checking for overlapping bounding boxes in component properties
    const newClashes: any[] = []
    for (let i = 0; i < components.length; i++) {
      for (let j = i + 1; j < components.length; j++) {
        const propsA = components[i].properties as any
        const propsB = components[j].properties as any
        if (!propsA?.boundingBox || !propsB?.boundingBox) continue

        const boxA = propsA.boundingBox
        const boxB = propsB.boundingBox
        // AABB overlap test
        const overlaps =
          boxA.minX <= boxB.maxX && boxA.maxX >= boxB.minX &&
          boxA.minY <= boxB.maxY && boxA.maxY >= boxB.minY &&
          boxA.minZ <= boxB.maxZ && boxA.maxZ >= boxB.minZ

        if (overlaps) {
          // Check if this clash was already recorded
          const existing = await prismaAny.clashDetection.findFirst({
            where: {
              modelId,
              elementId1: components[i].elementId,
              elementId2: components[j].elementId,
            },
          })
          if (!existing) {
            const clash = await prismaAny.clashDetection.create({
              data: {
                modelId,
                clashType: 'HARD',
                severity: 'MEDIUM',
                elementId1: components[i].elementId,
                elementId2: components[j].elementId,
                elementType1: components[i].componentType || 'UNKNOWN',
                elementType2: components[j].componentType || 'UNKNOWN',
                clashPoint: {
                  x: (boxA.minX + boxB.minX) / 2,
                  y: (boxA.minY + boxB.minY) / 2,
                  z: (boxA.minZ + boxB.minZ) / 2,
                } as any,
                status: 'NEW',
                description: `Potential clash between ${components[i].elementId} and ${components[j].elementId}`,
              },
            })
            newClashes.push(clash)
          }
        }
      }
    }

    // Return all clash records for this model
    const clashes = await prismaAny.clashDetection.findMany({
      where: { modelId },
      include: {
        reviewedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        resolvedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'CLASH_DETECTION_RUN',
      entityType: 'BIMModel',
      entityId: modelId,
      userId,
      reason: 'Clash detection run',
      after: {
        clashCount: clashes.length,
      },
    })

    return clashes
  },

  /**
   * Get clash detections for a model
   */
  async getClashDetections(modelId: string, filters?: {
    status?: string
    severity?: string
  }) {
    const where: any = {
      modelId,
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.severity) {
      where.severity = filters.severity
    }

    const clashes = await prismaAny.clashDetection.findMany({
      where,
      include: {
        reviewedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        resolvedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return clashes
  },

  /**
   * Update clash detection status
   */
  async updateClashStatus(clashId: string, data: {
    status: string
    resolutionNotes?: string
    userId: string
  }) {
    const clash = await prismaAny.clashDetection.findUnique({
      where: { id: clashId },
    })

    if (!clash) {
      throw new NotFoundError('ClashDetection', clashId)
    }

    const updateData: any = {
      status: data.status,
    }

    if (data.status === 'REVIEWED' && !clash.reviewedAt) {
      updateData.reviewedAt = new Date()
      updateData.reviewedById = data.userId
    }

    if (data.status === 'RESOLVED' && !clash.resolvedAt) {
      updateData.resolvedAt = new Date()
      updateData.resolvedById = data.userId
      if (data.resolutionNotes) {
        updateData.resolutionNotes = data.resolutionNotes
      }
    }

    if (data.resolutionNotes && data.status !== 'RESOLVED') {
      updateData.resolutionNotes = data.resolutionNotes
    }

    const updated = await prismaAny.clashDetection.update({
      where: { id: clashId },
      data: updateData,
    })

    // Log audit
    await auditService.recordAudit({
      action: 'CLASH_DETECTION_UPDATED',
      entityType: 'ClashDetection',
      entityId: clashId,
      userId: data.userId,
      reason: `Clash status updated to ${data.status}`,
      after: {
        status: data.status,
      },
    })

    return updated
  },

  /**
   * Get component properties
   */
  async getComponentProperties(modelId: string, elementId?: string) {
    const where: any = {
      modelId,
    }

    if (elementId) {
      where.elementId = elementId
    }

    const properties = await prismaAny.modelComponentProperty.findMany({
      where,
      include: {
        updatedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        lockedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return properties
  },

  /**
   * Update component properties
   */
  async updateComponentProperties(modelId: string, elementId: string, data: {
    properties?: any
    customProperties?: any
    userId: string
  }) {
    const existing = await prismaAny.modelComponentProperty.findUnique({
      where: {
        modelId_elementId: {
          modelId,
          elementId,
        },
      },
    })

    if (existing && existing.isLocked && existing.lockedById !== data.userId) {
      throw new ValidationError('Component is locked by another user')
    }

    const propertyData: any = {
      modelId,
      elementId,
      properties: data.properties || {},
      customProperties: data.customProperties,
      updatedById: data.userId,
    }

    if (existing) {
      propertyData.properties = { ...(existing.properties as any), ...(data.properties || {}) }
      propertyData.customProperties = { ...(existing.customProperties as any || {}), ...(data.customProperties || {}) }
    }

    const property = await prismaAny.modelComponentProperty.upsert({
      where: {
        modelId_elementId: {
          modelId,
          elementId,
        },
      },
      create: propertyData,
      update: {
        properties: propertyData.properties,
        customProperties: propertyData.customProperties,
        updatedById: data.userId,
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'MODEL_COMPONENT_PROPERTY_UPDATED',
      entityType: 'ModelComponentProperty',
      entityId: property.id,
      userId: data.userId,
      reason: `Properties updated for element ${elementId}`,
      after: {
        elementId,
        propertiesUpdated: Object.keys(data.properties || {}).length,
      },
    })

    return property
  },

  /**
   * Compare two model versions
   */
  async compareModels(modelId1: string, modelId2: string) {
    const model1 = await prismaAny.bIMModel.findUnique({
      where: { id: modelId1 },
    })

    const model2 = await prismaAny.bIMModel.findUnique({
      where: { id: modelId2 },
    })

    if (!model1 || !model2) {
      throw new NotFoundError('BIMModel', modelId1 || modelId2)
    }

    if (model1.designProjectId !== model2.designProjectId) {
      throw new ValidationError('Models must be from the same project')
    }

    // Basic model comparison using component properties and version metadata
    const components1 = await prismaAny.modelComponentProperty.findMany({
      where: { modelId: modelId1 },
    })
    const components2 = await prismaAny.modelComponentProperty.findMany({
      where: { modelId: modelId2 },
    })

    const elementIds1 = new Set(components1.map((c: any) => c.elementId))
    const elementIds2 = new Set(components2.map((c: any) => c.elementId))

    const addedElements: string[] = []
    const removedElements: string[] = []
    const modifiedElements: string[] = []

    // Find added elements (in model2 but not model1)
    elementIds2.forEach((id: string) => {
      if (!elementIds1.has(id)) {
        addedElements.push(id)
      }
    })

    // Find removed elements (in model1 but not model2)
    elementIds1.forEach((id: string) => {
      if (!elementIds2.has(id)) {
        removedElements.push(id)
      }
    })

    // Find modified elements (in both, but properties differ)
    elementIds1.forEach((id: string) => {
      if (elementIds2.has(id)) {
        const comp1 = components1.find((c: any) => c.elementId === id)
        const comp2 = components2.find((c: any) => c.elementId === id)
        if (comp1 && comp2 && JSON.stringify(comp1.properties) !== JSON.stringify(comp2.properties)) {
          modifiedElements.push(id)
        }
      }
    })

    const differences = [
      ...addedElements.map((id) => ({ elementId: id, changeType: 'ADDED' })),
      ...removedElements.map((id) => ({ elementId: id, changeType: 'REMOVED' })),
      ...modifiedElements.map((id) => ({ elementId: id, changeType: 'MODIFIED' })),
    ]

    return {
      model1: {
        id: model1.id,
        name: model1.name,
        versionNumber: model1.versionNumber,
      },
      model2: {
        id: model2.id,
        name: model2.name,
        versionNumber: model2.versionNumber,
      },
      differences,
      addedElements,
      removedElements,
      modifiedElements,
      summary: {
        totalDifferences: differences.length,
        added: addedElements.length,
        removed: removedElements.length,
        modified: modifiedElements.length,
      },
    }
  },

  /**
   * Start viewing session
   */
  async startViewingSession(modelId: string, userId: string, isClientReview: boolean = false) {
    const model = await prismaAny.bIMModel.findUnique({
      where: { id: modelId },
    })

    if (!model) {
      throw new NotFoundError('BIMModel', modelId)
    }

    const session = await prismaAny.modelViewingSession.create({
      data: {
        modelId,
        userId,
        isClientReview,
      },
    })

    return session
  },

  /**
   * End viewing session
   */
  async endViewingSession(sessionId: string, data: {
    viewsAccessed?: string[]
    annotationsCreated?: number
    annotationsViewed?: string[]
    reviewCompleted?: boolean
  }) {
    const session = await prismaAny.modelViewingSession.findUnique({
      where: { id: sessionId },
    })

    if (!session) {
      throw new NotFoundError('ModelViewingSession', sessionId)
    }

    const endedAt = new Date()
    const durationSeconds = Math.floor((endedAt.getTime() - session.startedAt.getTime()) / 1000)

    const updated = await prismaAny.modelViewingSession.update({
      where: { id: sessionId },
      data: {
        endedAt,
        durationSeconds,
        viewsAccessed: data.viewsAccessed || session.viewsAccessed,
        annotationsCreated: data.annotationsCreated || session.annotationsCreated,
        annotationsViewed: data.annotationsViewed || session.annotationsViewed,
        reviewCompleted: data.reviewCompleted || session.reviewCompleted,
      },
    })

    return updated
  },
}
