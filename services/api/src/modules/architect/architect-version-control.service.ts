/**
 * Architect Version Control Service
 * Enhanced version control for design files
 */

import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError, ValidationError } from '../../errors/app.error'
import { auditService } from '../audit/audit.service'
import { eventService } from '../events/event.service'
import { architectFileUploadService } from './architect-file-upload.service'

class ArchitectVersionControlService {
  /**
   * Create new version of a file
   */
  async createFileVersion(
    fileId: string,
    newFileKey: string,
    newFileUrl: string,
    userId: string,
    changeDescription?: string
  ) {
    const file = await prismaAny.designFile.findUnique({
      where: { id: fileId },
    })

    if (!file) {
      throw new NotFoundError('DesignFile', fileId)
    }

    // Get current version
    const currentVersion = file.version

    // Create new version
    const newVersion = await prismaAny.designFileVersion.create({
      data: {
        designFileId: fileId,
        version: currentVersion + 1,
        fileKey: newFileKey,
        fileUrl: newFileUrl,
        fileSize: file.fileSize,
        uploadedBy: userId,
        changeDescription: changeDescription || `Version ${currentVersion + 1}`,
      },
    })

    // Update file to new version
    await prismaAny.designFile.update({
      where: { id: fileId },
      data: {
        version: currentVersion + 1,
        fileKey: newFileKey,
        fileUrl: newFileUrl,
      },
    })

    // Create audit log
    await auditService.recordAudit({
      action: 'FILE_VERSION_CREATED',
      entityType: 'DesignFile',
      entityId: fileId,
      userId,
      reason: `New version created: ${changeDescription || `Version ${currentVersion + 1}`}`,
      after: {
        version: currentVersion + 1,
        fileKey: newFileKey,
      },
    })

    // Create event
    await eventService.recordEvent({
      entityType: 'DesignFile',
      entityId: fileId,
      type: 'FILE_VERSION_CREATED',
      payload: {
        version: currentVersion + 1,
        changeDescription,
      },
      userId,
    })

    return newVersion
  }

  /**
   * Get version history for a file
   */
  async getFileVersionHistory(fileId: string, userId: string) {
    const file = await prismaAny.designFile.findUnique({
      where: { id: fileId },
      include: {
        designProject: {
          include: {
            teamMembers: {
              where: { userId },
            },
          },
        },
      },
    })

    if (!file) {
      throw new NotFoundError('DesignFile', fileId)
    }

    // Check access
    const isTeamMember = file.designProject.teamMembers.length > 0
    if (!isTeamMember) {
      const ownerProject = await prismaAny.project.findUnique({
        where: { id: file.designProject.projectId || '' },
        select: { ownerId: true },
      })
      if (ownerProject?.ownerId !== userId) {
        throw new ValidationError('Access denied')
      }
    }

    const versions = await prismaAny.designFileVersion.findMany({
      where: { designFileId: fileId },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { version: 'desc' },
    })

    return {
      file: {
        id: file.id,
        fileName: file.fileName,
        currentVersion: file.version,
      },
      versions: versions.map((v) => ({
        id: v.id,
        version: v.version,
        fileUrl: v.fileUrl,
        fileSize: v.fileSize,
        changeDescription: v.changeDescription,
        uploadedBy: v.uploadedBy,
        createdAt: v.createdAt,
      })),
    }
  }

  /**
   * Rollback to previous version
   */
  async rollbackToVersion(
    fileId: string,
    targetVersion: number,
    userId: string,
    reason?: string
  ) {
    const file = await prismaAny.designFile.findUnique({
      where: { id: fileId },
    })

    if (!file) {
      throw new NotFoundError('DesignFile', fileId)
    }

    if (targetVersion >= file.version) {
      throw new ValidationError('Cannot rollback to current or future version')
    }

    // Get target version
    const targetVersionRecord = await prismaAny.designFileVersion.findFirst({
      where: {
        designFileId: fileId,
        version: targetVersion,
      },
    })

    if (!targetVersionRecord) {
      throw new NotFoundError('DesignFileVersion', `${fileId}-v${targetVersion}`)
    }

    // Create new version pointing to old file (rollback)
    const rollbackVersion = await prismaAny.designFileVersion.create({
      data: {
        designFileId: fileId,
        version: file.version + 1,
        fileKey: targetVersionRecord.fileKey,
        fileUrl: targetVersionRecord.fileUrl,
        fileSize: targetVersionRecord.fileSize,
        uploadedBy: userId,
        changeDescription: reason || `Rollback to version ${targetVersion}`,
      },
    })

    // Update file to rollback version
    await prismaAny.designFile.update({
      where: { id: fileId },
      data: {
        version: file.version + 1,
        fileKey: targetVersionRecord.fileKey,
        fileUrl: targetVersionRecord.fileUrl,
      },
    })

    // Create audit log
    await auditService.recordAudit({
      action: 'FILE_ROLLBACK',
      entityType: 'DesignFile',
      entityId: fileId,
      userId,
      reason: `Rolled back to version ${targetVersion}: ${reason || ''}`,
      before: {
        version: file.version,
      },
      after: {
        version: file.version + 1,
        rolledBackTo: targetVersion,
      },
    })

    return rollbackVersion
  }

  /**
   * Compare two versions
   */
  async compareVersions(
    fileId: string,
    version1: number,
    version2: number,
    userId: string
  ) {
    const file = await prismaAny.designFile.findUnique({
      where: { id: fileId },
    })

    if (!file) {
      throw new NotFoundError('DesignFile', fileId)
    }

    const versions = await prismaAny.designFileVersion.findMany({
      where: {
        designFileId: fileId,
        version: {
          in: [version1, version2],
        },
      },
      orderBy: { version: 'asc' },
    })

    if (versions.length !== 2) {
      throw new ValidationError('Both versions must exist')
    }

    return {
      fileId,
      version1: {
        version: versions[0].version,
        fileUrl: versions[0].fileUrl,
        fileSize: versions[0].fileSize,
        changeDescription: versions[0].changeDescription,
        createdAt: versions[0].createdAt,
      },
      version2: {
        version: versions[1].version,
        fileUrl: versions[1].fileUrl,
        fileSize: versions[1].fileSize,
        changeDescription: versions[1].changeDescription,
        createdAt: versions[1].createdAt,
      },
      differences: {
        sizeChange: versions[1].fileSize - versions[0].fileSize,
        timeDiff: versions[1].createdAt.getTime() - versions[0].createdAt.getTime(),
      },
    }
  }
}

export const architectVersionControlService = new ArchitectVersionControlService()
