import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError, ValidationError } from '../../errors/app.error'
import { auditService } from '../audit/audit.service'
import { eventService } from '../events/event.service'
import { randomUUID } from 'crypto'
import { extname } from 'path'

// AIA Folder structure defaults
const AIA_FOLDER_STRUCTURE = [
  { name: 'A-Architectural', folderType: 'A_ARCHITECTURAL', order: 1 },
  { name: 'S-Structural', folderType: 'S_STRUCTURAL', order: 2 },
  { name: 'M-Mechanical', folderType: 'M_MECHANICAL', order: 3 },
  { name: 'E-Electrical', folderType: 'E_ELECTRICAL', order: 4 },
  { name: 'P-Plumbing', folderType: 'P_PLUMBING', order: 5 },
  { name: 'C-Civil', folderType: 'C_CIVIL', order: 6 },
  { name: 'L-Landscape', folderType: 'L_LANDSCAPE', order: 7 },
  { name: 'I-Interiors', folderType: 'I_INTERIORS', order: 8 },
  { name: 'Specifications', folderType: 'SPECIFICATIONS', order: 9 },
  { name: 'Reports', folderType: 'REPORTS', order: 10 },
  { name: 'Calculations', folderType: 'CALCULATIONS', order: 11 },
  { name: 'Models', folderType: 'MODELS', order: 12 },
]

// File type detection based on extension
function detectFileType(fileName: string, mimeType?: string): {
  type: 'PDF' | 'DWG' | 'RVT' | 'SKP' | 'DXF' | 'IFC' | 'IMAGE' | 'DOCUMENT' | 'OTHER'
  mimeType: string
} {
  const ext = extname(fileName).toLowerCase()
  const mime = mimeType || ''

  // PDF
  if (ext === '.pdf' || mime.includes('pdf')) {
    return { type: 'PDF', mimeType: mime || 'application/pdf' }
  }

  // DWG (AutoCAD)
  if (ext === '.dwg' || mime.includes('dwg')) {
    return { type: 'DWG', mimeType: mime || 'application/acad' }
  }

  // RVT (Revit)
  if (ext === '.rvt' || mime.includes('rvt')) {
    return { type: 'RVT', mimeType: mime || 'application/x-revit' }
  }

  // SKP (SketchUp)
  if (ext === '.skp' || mime.includes('skp')) {
    return { type: 'SKP', mimeType: mime || 'application/vnd.sketchup.skp' }
  }

  // DXF
  if (ext === '.dxf' || mime.includes('dxf')) {
    return { type: 'DXF', mimeType: mime || 'application/dxf' }
  }

  // IFC
  if (ext === '.ifc' || mime.includes('ifc')) {
    return { type: 'IFC', mimeType: mime || 'application/ifc' }
  }

  // Images
  if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'].includes(ext) || mime.startsWith('image/')) {
    return { type: 'IMAGE', mimeType: mime || 'image/jpeg' }
  }

  // Documents
  if (['.doc', '.docx', '.xls', '.xlsx', '.txt', '.rtf'].includes(ext) || mime.includes('document') || mime.includes('msword') || mime.includes('spreadsheet')) {
    return { type: 'DOCUMENT', mimeType: mime || 'application/octet-stream' }
  }

  return { type: 'OTHER', mimeType: mime || 'application/octet-stream' }
}

export const designFileService = {
  /**
   * Initialize AIA folder structure for a design project
   */
  async initializeAIAFolders(designProjectId: string) {
    const existing = await prismaAny.designFolder.findFirst({
      where: { designProjectId },
    })

    if (existing) {
      return // Already initialized
    }

    const folders = await prismaAny.$transaction(
      AIA_FOLDER_STRUCTURE.map((folder) =>
        prismaAny.designFolder.create({
          data: {
            designProjectId,
            name: folder.name,
            folderType: folder.folderType as any,
            path: folder.name,
            order: folder.order,
          },
        })
      )
    )

    return folders
  },

  /**
   * Create a folder
   */
  async createFolder(data: {
    designProjectId: string
    name: string
    parentFolderId?: string
    folderType?: string
    userId: string
  }) {
    // Build path
    let path = data.name
    if (data.parentFolderId) {
      const parent = await prismaAny.designFolder.findUnique({
        where: { id: data.parentFolderId },
      })
      if (!parent) {
        throw new NotFoundError('DesignFolder', data.parentFolderId)
      }
      path = `${parent.path}/${data.name}`
    }

    const folder = await prismaAny.designFolder.create({
      data: {
        designProjectId: data.designProjectId,
        parentFolderId: data.parentFolderId,
        name: data.name,
        folderType: data.folderType as any,
        path,
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'DESIGN_FOLDER_CREATED',
      entityType: 'DesignFolder',
      entityId: folder.id,
      userId: data.userId,
      reason: `Folder created: ${data.name}`,
      after: {
        name: data.name,
        path,
      },
    })

    return folder
  },

  /**
   * Upload a file (creates new version if file exists)
   */
  async uploadFile(data: {
    designProjectId: string
    folderId?: string
    fileName: string
    fileSize: number
    mimeType?: string
    fileUrl: string
    thumbnailUrl?: string
    description?: string
    tags?: string[]
    userId: string
  }) {
    // Detect file type
    const { type, mimeType } = detectFileType(data.fileName, data.mimeType)

    // Check if file with same name exists
    const existingFile = await prismaAny.designFile.findFirst({
      where: {
        designProjectId: data.designProjectId,
        folderId: data.folderId || null,
        fileName: data.fileName,
        isLatestVersion: true,
      },
    })

    let file
    let versionNumber = 1

    if (existingFile) {
      // Create new version
      versionNumber = existingFile.versionNumber + 1

      // Mark old version as not latest
      await prismaAny.designFile.update({
        where: { id: existingFile.id },
        data: { isLatestVersion: false },
      })

      // Create new version
      file = await prismaAny.designFile.create({
        data: {
          designProjectId: data.designProjectId,
          folderId: data.folderId,
          fileName: data.fileName,
          originalFileName: data.fileName,
          fileType: type,
          fileSize: BigInt(data.fileSize),
          mimeType,
          fileUrl: data.fileUrl,
          thumbnailUrl: data.thumbnailUrl,
          versionNumber,
          isLatestVersion: true,
          previousVersionId: existingFile.id,
          description: data.description,
          tags: data.tags || [],
          uploadedById: data.userId,
        },
      })
    } else {
      // Create new file
      file = await prismaAny.designFile.create({
        data: {
          designProjectId: data.designProjectId,
          folderId: data.folderId,
          fileName: data.fileName,
          originalFileName: data.fileName,
          fileType: type,
          fileSize: BigInt(data.fileSize),
          mimeType,
          fileUrl: data.fileUrl,
          thumbnailUrl: data.thumbnailUrl,
          versionNumber: 1,
          isLatestVersion: true,
          description: data.description,
          tags: data.tags || [],
          uploadedById: data.userId,
        },
      })
    }

    // Log audit
    await auditService.recordAudit({
      action: existingFile ? 'DESIGN_FILE_VERSIONED' : 'DESIGN_FILE_UPLOADED',
      entityType: 'DesignFile',
      entityId: file.id,
      userId: data.userId,
      reason: existingFile ? `New version ${versionNumber} uploaded` : `File uploaded: ${data.fileName}`,
      after: {
        fileName: data.fileName,
        versionNumber,
        fileType: type,
      },
    })

    // Log event
    await eventService.recordEvent({
      type: existingFile ? 'DESIGN_FILE_VERSIONED' : 'DESIGN_FILE_UPLOADED',
      entityType: 'DesignFile',
      entityId: file.id,
      userId: data.userId,
      payload: {
        fileName: data.fileName,
        versionNumber,
        fileType: type,
        designProjectId: data.designProjectId,
      },
    })

    return file
  },

  /**
   * Bulk upload files
   */
  async bulkUploadFiles(data: {
    designProjectId: string
    folderId?: string
    files: Array<{
      fileName: string
      fileSize: number
      mimeType?: string
      fileUrl: string
      thumbnailUrl?: string
    }>
    userId: string
  }) {
    const uploadedFiles = []

    for (const fileData of data.files) {
      const file = await this.uploadFile({
        designProjectId: data.designProjectId,
        folderId: data.folderId,
        fileName: fileData.fileName,
        fileSize: fileData.fileSize,
        mimeType: fileData.mimeType,
        fileUrl: fileData.fileUrl,
        thumbnailUrl: fileData.thumbnailUrl,
        userId: data.userId,
        metadata: fileData.metadata as any,
      })
      uploadedFiles.push(file)
    }

    return uploadedFiles
  },

  /**
   * Check out a file
   */
  async checkOutFile(fileId: string, userId: string, comment?: string) {
    const file = await prismaAny.designFile.findUnique({
      where: { id: fileId },
    })

    if (!file) {
      throw new NotFoundError('DesignFile', fileId)
    }

    if (file.checkedOutById && file.checkedOutById !== userId) {
      throw new ValidationError('File is already checked out by another user')
    }

    if (file.lockedById && file.lockedById !== userId) {
      throw new ValidationError('File is locked by another user')
    }

    const updated = await prismaAny.designFile.update({
      where: { id: fileId },
      data: {
        checkedOutById: userId,
        checkedOutAt: new Date(),
        checkOutComment: comment,
        // Auto-lock when checking out
        lockedById: userId,
        lockedAt: new Date(),
        lockReason: 'Checked out for editing',
      },
    })

    // Log access
    await prismaAny.designFileAccess.create({
      data: {
        fileId,
        userId,
        action: 'CHECKED_OUT',
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'DESIGN_FILE_CHECKED_OUT',
      entityType: 'DesignFile',
      entityId: fileId,
      userId,
      reason: comment || 'File checked out',
      after: {
        checkedOutById: userId,
        checkedOutAt: updated.checkedOutAt,
        lockedById: userId,
      },
    })

    return updated
  },

  /**
   * Check in a file
   */
  async checkInFile(fileId: string, userId: string, newFileUrl?: string) {
    const file = await prismaAny.designFile.findUnique({
      where: { id: fileId },
    })

    if (!file) {
      throw new NotFoundError('DesignFile', fileId)
    }

    if (file.checkedOutById !== userId) {
      throw new ValidationError('You do not have this file checked out')
    }

    const updateData: any = {
      checkedOutById: null,
      checkedOutAt: null,
      checkOutComment: null,
      lockedById: null,
      lockedAt: null,
      lockReason: null,
    }

    // If new file URL provided, create new version
    if (newFileUrl) {
      const { type, mimeType } = detectFileType(file.fileName, file.mimeType || undefined)
      const versionNumber = file.versionNumber + 1

      // Mark old version as not latest
      await prismaAny.designFile.update({
        where: { id: fileId },
        data: { isLatestVersion: false, ...updateData },
      })

      // Create new version
      const newVersion = await prismaAny.designFile.create({
        data: {
          designProjectId: file.designProjectId,
          folderId: file.folderId,
          fileName: file.fileName,
          originalFileName: file.originalFileName,
          fileType: type,
          fileSize: file.fileSize,
          mimeType: mimeType || file.mimeType,
          fileUrl: newFileUrl,
          thumbnailUrl: file.thumbnailUrl,
          versionNumber,
          isLatestVersion: true,
          previousVersionId: fileId,
          description: file.description,
          tags: file.tags,
          uploadedById: userId,
        },
      })

      // Log access
      await prismaAny.designFileAccess.create({
        data: {
          fileId: newVersion.id,
          userId,
          action: 'CHECKED_IN',
        },
      })

      // Log audit
      await auditService.recordAudit({
        action: 'DESIGN_FILE_CHECKED_IN',
        entityType: 'DesignFile',
        entityId: newVersion.id,
        userId,
        reason: 'File checked in with new version',
        after: {
          versionNumber,
          fileUrl: newFileUrl,
        },
      })

      return newVersion
    } else {
      // Just check in without new version
      const updated = await prismaAny.designFile.update({
        where: { id: fileId },
        data: updateData,
      })

      // Log access
      await prismaAny.designFileAccess.create({
        data: {
          fileId,
          userId,
          action: 'CHECKED_IN',
        },
      })

      // Log audit
      await auditService.recordAudit({
        action: 'DESIGN_FILE_CHECKED_IN',
        entityType: 'DesignFile',
        entityId: fileId,
        userId,
        reason: 'File checked in',
        after: updateData,
      })

      return updated
    }
  },

  /**
   * Lock a file
   */
  async lockFile(fileId: string, userId: string, reason?: string) {
    const file = await prismaAny.designFile.findUnique({
      where: { id: fileId },
    })

    if (!file) {
      throw new NotFoundError('DesignFile', fileId)
    }

    if (file.lockedById && file.lockedById !== userId) {
      throw new ValidationError('File is already locked by another user')
    }

    const updated = await prismaAny.designFile.update({
      where: { id: fileId },
      data: {
        lockedById: userId,
        lockedAt: new Date(),
        lockReason: reason,
      },
    })

    // Log access
    await prismaAny.designFileAccess.create({
      data: {
        fileId,
        userId,
        action: 'LOCKED',
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'DESIGN_FILE_LOCKED',
      entityType: 'DesignFile',
      entityId: fileId,
      userId,
      reason: reason || 'File locked',
      after: {
        lockedById: userId,
        lockedAt: updated.lockedAt,
      },
    })

    return updated
  },

  /**
   * Unlock a file
   */
  async unlockFile(fileId: string, userId: string) {
    const file = await prismaAny.designFile.findUnique({
      where: { id: fileId },
    })

    if (!file) {
      throw new NotFoundError('DesignFile', fileId)
    }

    if (file.lockedById !== userId) {
      throw new ValidationError('You do not have permission to unlock this file')
    }

    const updated = await prismaAny.designFile.update({
      where: { id: fileId },
      data: {
        lockedById: null,
        lockedAt: null,
        lockReason: null,
      },
    })

    // Log access
    await prismaAny.designFileAccess.create({
      data: {
        fileId,
        userId,
        action: 'UNLOCKED',
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'DESIGN_FILE_UNLOCKED',
      entityType: 'DesignFile',
      entityId: fileId,
      userId,
      reason: 'File unlocked',
      after: {
        lockedById: null,
      },
    })

    return updated
  },

  /**
   * Get file with version history
   */
  async getFile(fileId: string) {
    const file = await prismaAny.designFile.findUnique({
      where: { id: fileId },
      include: {
        checkedOutBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        lockedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        previousVersion: true,
      },
    })

    if (!file) {
      throw new NotFoundError('DesignFile', fileId)
    }

    // Get all versions
    const versions = await this.getFileVersions(fileId)

    return {
      ...file,
      versions,
    }
  },

  /**
   * Get file version history
   */
  async getFileVersions(fileId: string) {
    // Find the root version (oldest)
    let current = await prismaAny.designFile.findUnique({
      where: { id: fileId },
    })

    if (!current) {
      return []
    }

    // Traverse back to find root
    while (current.previousVersionId) {
      const prev = await prismaAny.designFile.findUnique({
        where: { id: current.previousVersionId },
      })
      if (!prev) break
      current = prev
    }

    // Collect all versions forward
    const versions = [current]
    let next = current

    while (true) {
      const newer = await prismaAny.designFile.findFirst({
        where: { previousVersionId: next.id },
      })
      if (!newer) break
      versions.push(newer)
      next = newer
    }

    return versions
  },

  /**
   * List files in a folder/project
   */
  async listFiles(designProjectId: string, folderId?: string) {
    const where: any = {
      designProjectId,
      isLatestVersion: true,
    }

    if (folderId) {
      where.folderId = folderId
    } else {
      where.folderId = null
    }

    const files = await prismaAny.designFile.findMany({
      where,
      include: {
        checkedOutBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        lockedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { fileName: 'asc' },
    })

    return files
  },

  /**
   * List folders in a project
   */
  async listFolders(designProjectId: string, parentFolderId?: string) {
    const where: any = {
      designProjectId,
    }

    if (parentFolderId) {
      where.parentFolderId = parentFolderId
    } else {
      where.parentFolderId = null
    }

    const folders = await prismaAny.designFolder.findMany({
      where,
      include: {
        _count: {
          select: {
            files: true,
            subFolders: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    })

    return folders
  },

  /**
   * Record file access (view/download)
   */
  async recordFileAccess(fileId: string, userId: string, action: 'VIEWED' | 'DOWNLOADED', ipAddress?: string, userAgent?: string) {
    await prismaAny.designFileAccess.create({
      data: {
        fileId,
        userId,
        action,
        ipAddress,
        userAgent,
      },
    })
  },
}
