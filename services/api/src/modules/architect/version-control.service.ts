import { prisma } from '@kealee/database'
import { NotFoundError, ValidationError } from '../../errors/app.error'
import { auditService } from '../audit/audit.service'
import { eventService } from '../events/event.service'

export const versionControlService = {
  /**
   * Create a new branch
   */
  async createBranch(data: {
    designProjectId: string
    name: string
    description?: string
    baseBranchId?: string
    baseVersionId?: string
    createdById: string
  }) {
    // Validate branch name uniqueness
    const existing = await prisma.versionBranch.findUnique({
      where: {
        designProjectId_name: {
          designProjectId: data.designProjectId,
          name: data.name,
        },
      },
    })

    if (existing) {
      throw new ValidationError(`Branch "${data.name}" already exists`)
    }

    // Validate base branch if provided
    if (data.baseBranchId) {
      const baseBranch = await prisma.versionBranch.findUnique({
        where: { id: data.baseBranchId },
      })

      if (!baseBranch) {
        throw new NotFoundError('VersionBranch', data.baseBranchId)
      }

      if (baseBranch.designProjectId !== data.designProjectId) {
        throw new ValidationError('Base branch must be from the same project')
      }
    }

    const branch = await prisma.versionBranch.create({
      data: {
        designProjectId: data.designProjectId,
        name: data.name,
        description: data.description,
        baseBranchId: data.baseBranchId,
        baseVersionId: data.baseVersionId,
        createdById: data.createdById,
        status: 'ACTIVE',
        isDefault: false,
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
      action: 'VERSION_BRANCH_CREATED',
      entityType: 'VersionBranch',
      entityId: branch.id,
      userId: data.createdById,
      reason: `Branch created: ${data.name}`,
      after: {
        name: data.name,
        baseBranchId: data.baseBranchId,
      },
    })

    return branch
  },

  /**
   * Get default branch or create one
   */
  async getOrCreateDefaultBranch(designProjectId: string, createdById: string) {
    let defaultBranch = await prisma.versionBranch.findFirst({
      where: {
        designProjectId,
        isDefault: true,
        status: 'ACTIVE',
      },
    })

    if (!defaultBranch) {
      defaultBranch = await prisma.versionBranch.create({
        data: {
          designProjectId,
          name: 'main',
          description: 'Default branch',
          isDefault: true,
          status: 'ACTIVE',
          createdById,
        },
      })
    }

    return defaultBranch
  },

  /**
   * List branches
   */
  async listBranches(designProjectId: string, filters?: {
    status?: string
    includeMerged?: boolean
  }) {
    const where: any = {
      designProjectId,
    }

    if (filters?.status) {
      where.status = filters.status
    } else if (!filters?.includeMerged) {
      where.status = { not: 'MERGED' }
    }

    const branches = await prisma.versionBranch.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            versions: true,
          },
        },
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return branches
  },

  /**
   * Get branch with versions
   */
  async getBranch(branchId: string) {
    const branch = await prisma.versionBranch.findUnique({
      where: { id: branchId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        versions: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        _count: {
          select: {
            versions: true,
          },
        },
      },
    })

    if (!branch) {
      throw new NotFoundError('VersionBranch', branchId)
    }

    return branch
  },

  /**
   * Create a version (snapshot)
   */
  async createVersion(data: {
    designProjectId: string
    branchId: string
    versionNumber: string
    versionName?: string
    description?: string
    versionTag?: string
    customTagName?: string
    fileSnapshots?: any
    sheetSnapshots?: any
    modelSnapshots?: any
    createdById: string
  }) {
    // Validate branch
    const branch = await prisma.versionBranch.findUnique({
      where: { id: data.branchId },
    })

    if (!branch) {
      throw new NotFoundError('VersionBranch', data.branchId)
    }

    if (branch.designProjectId !== data.designProjectId) {
      throw new ValidationError('Branch must be from the same project')
    }

    if (branch.status !== 'ACTIVE') {
      throw new ValidationError('Cannot create version on inactive branch')
    }

    // Get current file/sheet/model states
    const files = await prisma.designFile.findMany({
      where: { designProjectId: data.designProjectId },
      select: { id: true, versionNumber: true },
    })

    const sheets = await prisma.drawingSheet.findMany({
      where: { designProjectId: data.designProjectId },
      select: { id: true },
    })

    const models = await prisma.bIMModel.findMany({
      where: { designProjectId: data.designProjectId },
      select: { id: true, versionNumber: true },
    })

    const fileSnapshots = data.fileSnapshots || files.map((f) => ({
      fileId: f.id,
      fileVersion: f.versionNumber || 1,
    }))

    const sheetSnapshots = data.sheetSnapshots || sheets.map((s) => ({
      sheetId: s.id,
      sheetVersion: 1, // Sheets don't have version numbers yet
    }))

    const modelSnapshots = data.modelSnapshots || models.map((m) => ({
      modelId: m.id,
      modelVersion: m.versionNumber || 1,
    }))

    const isTagged = !!data.versionTag

    const version = await prisma.designVersion.create({
      data: {
        designProjectId: data.designProjectId,
        branchId: data.branchId,
        versionNumber: data.versionNumber,
        versionName: data.versionName,
        description: data.description,
        versionTag: data.versionTag as any,
        customTagName: data.customTagName,
        fileSnapshots: fileSnapshots as any,
        sheetSnapshots: sheetSnapshots as any,
        modelSnapshots: modelSnapshots as any,
        isTagged,
        isLocked: false,
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
      action: 'DESIGN_VERSION_CREATED',
      entityType: 'DesignVersion',
      entityId: version.id,
      userId: data.createdById,
      reason: data.description || `Version ${data.versionNumber} created`,
      after: {
        versionNumber: data.versionNumber,
        versionTag: data.versionTag,
        branchId: data.branchId,
      },
    })

    return version
  },

  /**
   * Get version
   */
  async getVersion(versionId: string) {
    const version = await prisma.designVersion.findUnique({
      where: { id: versionId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    })

    if (!version) {
      throw new NotFoundError('DesignVersion', versionId)
    }

    return version
  },

  /**
   * List versions
   */
  async listVersions(designProjectId: string, filters?: {
    branchId?: string
    versionTag?: string
    isTagged?: boolean
  }) {
    const where: any = {
      designProjectId,
    }

    if (filters?.branchId) {
      where.branchId = filters.branchId
    }

    if (filters?.versionTag) {
      where.versionTag = filters.versionTag
    }

    if (filters?.isTagged !== undefined) {
      where.isTagged = filters.isTagged
    }

    const versions = await prisma.designVersion.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return versions
  },

  /**
   * Compare two versions
   */
  async compareVersions(data: {
    designProjectId: string
    fromVersionId: string
    toVersionId: string
    createdById: string
  }) {
    const fromVersion = await prisma.designVersion.findUnique({
      where: { id: data.fromVersionId },
    })

    const toVersion = await prisma.designVersion.findUnique({
      where: { id: data.toVersionId },
    })

    if (!fromVersion || !toVersion) {
      throw new NotFoundError('DesignVersion', fromVersion ? data.toVersionId : data.fromVersionId)
    }

    if (fromVersion.designProjectId !== data.designProjectId || toVersion.designProjectId !== data.designProjectId) {
      throw new ValidationError('Both versions must be from the same project')
    }

    // Check if comparison already exists
    let comparison = await prisma.designVersionComparison.findUnique({
      where: {
        fromVersionId_toVersionId: {
          fromVersionId: data.fromVersionId,
          toVersionId: data.toVersionId,
        },
      },
    })

    if (comparison) {
      return comparison
    }

    // Extract file/sheet/model IDs from snapshots
    const fromFiles = (fromVersion.fileSnapshots as any[]) || []
    const toFiles = (toVersion.fileSnapshots as any[]) || []

    const fromFileIds = new Set(fromFiles.map((f: any) => f.fileId))
    const toFileIds = new Set(toFiles.map((f: any) => f.fileId))

    const changedFiles: string[] = []
    let filesAdded = 0
    let filesModified = 0
    let filesDeleted = 0

    // Find added files
    toFileIds.forEach((fileId) => {
      if (!fromFileIds.has(fileId)) {
        changedFiles.push(fileId)
        filesAdded++
      }
    })

    // Find modified and deleted files
    fromFileIds.forEach((fileId) => {
      if (!toFileIds.has(fileId)) {
        changedFiles.push(fileId)
        filesDeleted++
      } else {
        const fromFile = fromFiles.find((f: any) => f.fileId === fileId)
        const toFile = toFiles.find((f: any) => f.fileId === fileId)
        if (fromFile?.fileVersion !== toFile?.fileVersion) {
          changedFiles.push(fileId)
          filesModified++
        }
      }
    })

    // Similar logic for sheets and models
    const fromSheets = (fromVersion.sheetSnapshots as any[]) || []
    const toSheets = (toVersion.sheetSnapshots as any[]) || []
    const changedSheets: string[] = []
    let sheetsAdded = 0
    let sheetsModified = 0
    let sheetsDeleted = 0

    const fromSheetIds = new Set(fromSheets.map((s: any) => s.sheetId))
    const toSheetIds = new Set(toSheets.map((s: any) => s.sheetId))

    toSheetIds.forEach((sheetId) => {
      if (!fromSheetIds.has(sheetId)) {
        changedSheets.push(sheetId)
        sheetsAdded++
      }
    })

    fromSheetIds.forEach((sheetId) => {
      if (!toSheetIds.has(sheetId)) {
        changedSheets.push(sheetId)
        sheetsDeleted++
      } else {
        const fromSheet = fromSheets.find((s: any) => s.sheetId === sheetId)
        const toSheet = toSheets.find((s: any) => s.sheetId === sheetId)
        if (fromSheet?.sheetVersion !== toSheet?.sheetVersion) {
          changedSheets.push(sheetId)
          sheetsModified++
        }
      }
    })

    const fromModels = (fromVersion.modelSnapshots as any[]) || []
    const toModels = (toVersion.modelSnapshots as any[]) || []
    const changedModels: string[] = []
    const fromModelIds = new Set(fromModels.map((m: any) => m.modelId))
    const toModelIds = new Set(toModels.map((m: any) => m.modelId))

    toModelIds.forEach((modelId) => {
      if (!fromModelIds.has(modelId)) {
        changedModels.push(modelId)
      }
    })

    fromModelIds.forEach((modelId) => {
      if (!toModelIds.has(modelId)) {
        changedModels.push(modelId)
      } else {
        const fromModel = fromModels.find((m: any) => m.modelId === modelId)
        const toModel = toModels.find((m: any) => m.modelId === modelId)
        if (fromModel?.modelVersion !== toModel?.modelVersion) {
          changedModels.push(modelId)
        }
      }
    })

    // Create comparison data
    const comparisonData = {
      files: {
        added: Array.from(toFileIds).filter((id) => !fromFileIds.has(id)),
        modified: changedFiles.filter((id) => fromFileIds.has(id) && toFileIds.has(id)),
        deleted: Array.from(fromFileIds).filter((id) => !toFileIds.has(id)),
      },
      sheets: {
        added: Array.from(toSheetIds).filter((id) => !fromSheetIds.has(id)),
        modified: changedSheets.filter((id) => fromSheetIds.has(id) && toSheetIds.has(id)),
        deleted: Array.from(fromSheetIds).filter((id) => !toSheetIds.has(id)),
      },
      models: {
        added: Array.from(toModelIds).filter((id) => !fromModelIds.has(id)),
        modified: changedModels.filter((id) => fromModelIds.has(id) && toModelIds.has(id)),
        deleted: Array.from(fromModelIds).filter((id) => !toModelIds.has(id)),
      },
    }

    const diffSummary = `Files: +${filesAdded} ~${filesModified} -${filesDeleted} | Sheets: +${sheetsAdded} ~${sheetsModified} -${sheetsDeleted}`

    comparison = await prisma.designVersionComparison.create({
      data: {
        designProjectId: data.designProjectId,
        fromVersionId: data.fromVersionId,
        toVersionId: data.toVersionId,
        comparisonData: comparisonData as any,
        changedFiles,
        changedSheets,
        changedModels,
        filesAdded,
        filesModified,
        filesDeleted,
        sheetsAdded,
        sheetsModified,
        sheetsDeleted,
        diffSummary,
        createdById: data.createdById,
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'VERSION_COMPARISON_CREATED',
      entityType: 'DesignVersionComparison',
      entityId: comparison.id,
      userId: data.createdById,
      reason: `Compared versions ${fromVersion.versionNumber} and ${toVersion.versionNumber}`,
      after: {
        filesChanged: changedFiles.length,
        sheetsChanged: changedSheets.length,
      },
    })

    return comparison
  },

  /**
   * Get comparison
   */
  async getComparison(comparisonId: string) {
    const comparison = await prisma.designVersionComparison.findUnique({
      where: { id: comparisonId },
      include: {
        fromVersion: {
          select: {
            id: true,
            versionNumber: true,
            versionName: true,
          },
        },
        toVersion: {
          select: {
            id: true,
            versionNumber: true,
            versionName: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!comparison) {
      throw new NotFoundError('DesignVersionComparison', comparisonId)
    }

    return comparison
  },

  /**
   * Merge branch
   */
  async mergeBranch(data: {
    designProjectId: string
    sourceBranchId: string
    targetBranchId: string
    mergeDescription?: string
    conflictResolution?: string
    resolvedConflicts?: any
    createdById: string
  }) {
    const sourceBranch = await prisma.versionBranch.findUnique({
      where: { id: data.sourceBranchId },
    })

    const targetBranch = await prisma.versionBranch.findUnique({
      where: { id: data.targetBranchId },
    })

    if (!sourceBranch || !targetBranch) {
      throw new NotFoundError('VersionBranch', sourceBranch ? data.targetBranchId : data.sourceBranchId)
    }

    if (sourceBranch.designProjectId !== data.designProjectId || targetBranch.designProjectId !== data.designProjectId) {
      throw new ValidationError('Both branches must be from the same project')
    }

    if (sourceBranch.status !== 'ACTIVE') {
      throw new ValidationError('Source branch must be active')
    }

    if (targetBranch.status !== 'ACTIVE') {
      throw new ValidationError('Target branch must be active')
    }

    // Get latest versions from both branches
    const sourceLatest = await prisma.designVersion.findFirst({
      where: {
        branchId: data.sourceBranchId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const targetLatest = await prisma.designVersion.findFirst({
      where: {
        branchId: data.targetBranchId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Detect conflicts (simplified - would need more sophisticated conflict detection)
    const hasConflicts = false // Placeholder - would check for actual conflicts
    const conflictFiles: string[] = [] // Placeholder

    const merge = await prisma.branchMerge.create({
      data: {
        designProjectId: data.designProjectId,
        sourceBranchId: data.sourceBranchId,
        targetBranchId: data.targetBranchId,
        mergeStatus: hasConflicts ? 'CONFLICT' : 'PENDING',
        mergeDescription: data.mergeDescription,
        hasConflicts,
        conflictFiles,
        conflictResolution: data.conflictResolution as any,
        resolvedConflicts: data.resolvedConflicts as any,
        createdById: data.createdById,
      },
    })

    // If no conflicts, proceed with merge
    if (!hasConflicts) {
      // Create merged version (simplified - would merge actual file states)
      const mergedVersion = await this.createVersion({
        designProjectId: data.designProjectId,
        branchId: data.targetBranchId,
        versionNumber: `${targetLatest?.versionNumber || '1.0.0'}-merged`,
        versionName: `Merged from ${sourceBranch.name}`,
        description: data.mergeDescription || `Merged branch ${sourceBranch.name} into ${targetBranch.name}`,
        createdById: data.createdById,
      })

      // Update merge record
      await prisma.branchMerge.update({
        where: { id: merge.id },
        data: {
          mergeStatus: 'COMPLETED',
          resultVersionId: mergedVersion.id,
          completedById: data.createdById,
        },
      })

      // Mark source branch as merged
      await prisma.versionBranch.update({
        where: { id: data.sourceBranchId },
        data: {
          status: 'MERGED',
          mergedAt: new Date(),
          mergedById: data.createdById,
          mergedIntoBranchId: data.targetBranchId,
        },
      })
    }

    // Log audit
    await auditService.recordAudit({
      action: 'BRANCH_MERGE_CREATED',
      entityType: 'BranchMerge',
      entityId: merge.id,
      userId: data.createdById,
      reason: `Merge from ${sourceBranch.name} to ${targetBranch.name}`,
      after: {
        mergeStatus: merge.mergeStatus,
        hasConflicts,
      },
    })

    return merge
  },

  /**
   * Resolve merge conflicts
   */
  async resolveMergeConflicts(mergeId: string, data: {
    conflictResolution: string
    resolvedConflicts: any
    userId: string
  }) {
    const merge = await prisma.branchMerge.findUnique({
      where: { id: mergeId },
    })

    if (!merge) {
      throw new NotFoundError('BranchMerge', mergeId)
    }

    if (merge.mergeStatus !== 'CONFLICT') {
      throw new ValidationError('Merge does not have conflicts to resolve')
    }

    // Create merged version after conflict resolution
    const targetBranch = await prisma.versionBranch.findUnique({
      where: { id: merge.targetBranchId },
    })

    if (!targetBranch) {
      throw new NotFoundError('VersionBranch', merge.targetBranchId)
    }

    const mergedVersion = await this.createVersion({
      designProjectId: merge.designProjectId,
      branchId: merge.targetBranchId,
      versionNumber: `merged-${Date.now()}`,
      versionName: 'Merged (conflicts resolved)',
      description: 'Merged with conflict resolution',
      createdById: data.userId,
    })

    // Update merge
    const updated = await prisma.branchMerge.update({
      where: { id: mergeId },
      data: {
        mergeStatus: 'COMPLETED',
        conflictResolution: data.conflictResolution as any,
        resolvedConflicts: data.resolvedConflicts as any,
        resultVersionId: mergedVersion.id,
        completedById: data.userId,
      },
    })

    // Mark source branch as merged
    await prisma.versionBranch.update({
      where: { id: merge.sourceBranchId },
      data: {
        status: 'MERGED',
        mergedAt: new Date(),
        mergedById: data.userId,
        mergedIntoBranchId: merge.targetBranchId,
      },
    })

    return updated
  },

  /**
   * Rollback to version
   */
  async rollbackToVersion(data: {
    designProjectId: string
    fromVersionId: string
    toVersionId: string
    rollbackReason?: string
    rollbackNotes?: string
    createBackup?: boolean
    createdById: string
  }) {
    const fromVersion = await prisma.designVersion.findUnique({
      where: { id: data.fromVersionId },
    })

    const toVersion = await prisma.designVersion.findUnique({
      where: { id: data.toVersionId },
    })

    if (!fromVersion || !toVersion) {
      throw new NotFoundError('DesignVersion', fromVersion ? data.toVersionId : data.fromVersionId)
    }

    if (fromVersion.designProjectId !== data.designProjectId || toVersion.designProjectId !== data.designProjectId) {
      throw new ValidationError('Both versions must be from the same project')
    }

    // Create backup if requested
    let backupVersionId: string | undefined
    if (data.createBackup) {
      const backupVersion = await this.createVersion({
        designProjectId: data.designProjectId,
        branchId: fromVersion.branchId,
        versionNumber: `${fromVersion.versionNumber}-backup`,
        versionName: `Backup before rollback`,
        description: 'Backup created before rollback',
        createdById: data.createdById,
      })
      backupVersionId = backupVersion.id
    }

    // Get affected items from comparison
    const comparison = await this.compareVersions({
      designProjectId: data.designProjectId,
      fromVersionId: data.toVersionId,
      toVersionId: data.fromVersionId,
      createdById: data.createdById,
    })

    const affectedFiles = comparison.changedFiles || []
    const affectedSheets = comparison.changedSheets || []
    const affectedModels = comparison.changedModels || []

    // Create rollback record
    const rollback = await prisma.versionRollback.create({
      data: {
        designProjectId: data.designProjectId,
        fromVersionId: data.fromVersionId,
        toVersionId: data.toVersionId,
        rollbackReason: data.rollbackReason,
        rollbackNotes: data.rollbackNotes,
        affectedFiles,
        affectedSheets,
        affectedModels,
        backupVersionId,
        createdById: data.createdById,
      },
    })

    // TODO: Actually restore file/sheet/model states to the target version
    // This would involve:
    // 1. Restoring file versions from DesignFileVersion
    // 2. Restoring sheet states
    // 3. Restoring model states
    // 4. Updating current versions

    // Log audit
    await auditService.recordAudit({
      action: 'VERSION_ROLLBACK_CREATED',
      entityType: 'VersionRollback',
      entityId: rollback.id,
      userId: data.createdById,
      reason: data.rollbackReason || `Rollback to version ${toVersion.versionNumber}`,
      after: {
        fromVersion: fromVersion.versionNumber,
        toVersion: toVersion.versionNumber,
        affectedFiles: affectedFiles.length,
      },
    })

    // Log event
    await eventService.recordEvent({
      type: 'VERSION_ROLLBACK',
      entityType: 'VersionRollback',
      entityId: rollback.id,
      userId: data.createdById,
      payload: {
        designProjectId: data.designProjectId,
        fromVersionId: data.fromVersionId,
        toVersionId: data.toVersionId,
      },
    })

    return rollback
  },

  /**
   * Get rollback history
   */
  async getRollbackHistory(designProjectId: string) {
    const rollbacks = await prisma.versionRollback.findMany({
      where: { designProjectId },
      include: {
        fromVersion: {
          select: {
            id: true,
            versionNumber: true,
            versionName: true,
          },
        },
        toVersion: {
          select: {
            id: true,
            versionNumber: true,
            versionName: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return rollbacks
  },
}
