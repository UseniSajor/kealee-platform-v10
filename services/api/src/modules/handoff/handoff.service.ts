import { prisma } from '@kealee/database'
import { NotFoundError, AuthorizationError, ValidationError } from '../../errors/app.error'
import { ProjectStatus } from '@prisma/client'

export const handoffService = {
  /**
   * Generate project completion package (Prompt 3.8)
   */
  async generateHandoffPackage(projectId: string, userId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: { select: { id: true } },
        contracts: true,
        milestones: {
          include: {
            evidence: true,
            paymentTransactions: true,
          },
        },
        closeoutChecklist: {
          include: {
            items: {
              include: {
                attachments: true,
              },
            },
          },
        },
        escrow: {
          include: {
            transactions: true,
          },
        },
      },
    })

    if (!project) throw new NotFoundError('Project', projectId)
    if (project.ownerId !== userId) {
      throw new AuthorizationError('Only project owner can generate handoff package')
    }

    if (project.status !== ProjectStatus.COMPLETED) {
      throw new ValidationError(`Project must be COMPLETED to generate handoff package (current: ${project.status})`)
    }

    // Check if package already exists
    let package_ = await prisma.handoffPackage.findUnique({
      where: { projectId },
      include: {
        documentBundles: {
          include: {
            documents: true,
          },
        },
      },
    })

    if (package_ && package_.status === 'READY') {
      return package_
    }

    // Create or update package
    if (!package_) {
      package_ = await prisma.handoffPackage.create({
        data: {
          projectId,
          status: 'GENERATING',
        },
        include: {
          documentBundles: {
            include: {
              documents: true,
            },
          },
        },
      })
    } else {
      // Increment version for regeneration
      package_ = await prisma.handoffPackage.update({
        where: { id: package_.id },
        data: {
          status: 'GENERATING',
          version: { increment: 1 },
        },
        include: {
          documentBundles: {
            include: {
              documents: true,
            },
          },
        },
      })
    }

    // Generate document bundles
    const bundles = await this.generateDocumentBundles(package_.id, project)

    // Update package status to READY
    package_ = await prisma.handoffPackage.update({
      where: { id: package_.id },
      data: {
        status: 'READY',
        generatedAt: new Date(),
        // TODO: Generate actual ZIP file and upload to S3/storage
        // downloadUrl: await generateZipPackage(package_.id, bundles),
        // downloadExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
      include: {
        documentBundles: {
          include: {
            documents: true,
          },
        },
      },
    })

    // Create satisfaction survey
    await this.createSatisfactionSurvey(package_.id, projectId)

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: 'Project',
        entityId: projectId,
        action: 'HANDOFF_PACKAGE_GENERATED',
        details: {
          packageId: package_.id,
          version: package_.version,
        },
        userId: userId,
        reason: 'Project completion package generated',
      },
    })

    // Create event
    await prisma.event.create({
      data: {
        entityType: 'Project',
        entityId: projectId,
        type: 'HANDOFF_PACKAGE_READY',
        payload: {
          packageId: package_.id,
        },
        userId: userId,
      },
    })

    return package_
  },

  /**
   * Generate document bundles for handoff package (Prompt 3.8)
   */
  async generateDocumentBundles(packageId: string, project: any) {
    const bundles: any[] = []

    // 1. Contracts Bundle
    if (project.contracts && project.contracts.length > 0) {
      const contractBundle = await prisma.documentBundle.create({
        data: {
          packageId,
          type: 'CONTRACTS',
          title: 'Contract Documents',
          description: 'All signed contracts and agreements',
          fileCount: project.contracts.length,
        },
      })

      for (const contract of project.contracts) {
        await prisma.bundleDocument.create({
          data: {
            bundleId: contractBundle.id,
            documentType: 'contract',
            title: `Contract Agreement - ${contract.id}`,
            url: contract.docusignEnvelopeId
              ? `https://demo.docusign.com/envelopes/${contract.docusignEnvelopeId}`
              : `#contract-${contract.id}`,
            fileName: `contract-${contract.id}.pdf`,
            mimeType: 'application/pdf',
            description: `Contract for ${project.name}`,
            relatedEntityId: contract.id,
            relatedEntityType: 'ContractAgreement',
            documentCreatedAt: contract.createdAt,
          },
        })
      }

      bundles.push(contractBundle)
    }

    // 2. Permits Bundle (placeholder - will be populated when Permit model is integrated)
    const permitBundle = await prisma.documentBundle.create({
      data: {
        packageId,
        type: 'PERMITS',
        title: 'Permit Documents',
        description: 'All building permits and approvals',
        fileCount: 0, // TODO: Count actual permits when Permit model exists
      },
    })
    bundles.push(permitBundle)

    // 3. Inspections Bundle (placeholder - will be populated when Inspection model is integrated)
    const inspectionBundle = await prisma.documentBundle.create({
      data: {
        packageId,
        type: 'INSPECTIONS',
        title: 'Inspection Reports',
        description: 'All inspection reports and certificates',
        fileCount: 0, // TODO: Count actual inspections when Inspection model exists
      },
    })
    bundles.push(inspectionBundle)

    // 4. Payments Bundle
    if (project.escrow && project.escrow.transactions) {
      const paymentBundle = await prisma.documentBundle.create({
        data: {
          packageId,
          type: 'PAYMENTS',
          title: 'Payment Records',
          description: 'All payment transactions and receipts',
          fileCount: project.escrow.transactions.length,
        },
      })

      for (const transaction of project.escrow.transactions) {
        await prisma.bundleDocument.create({
          data: {
            bundleId: paymentBundle.id,
            documentType: 'payment_receipt',
            title: `Payment - ${transaction.type} - $${Number(transaction.amount).toFixed(2)}`,
            url: `#payment-${transaction.id}`,
            fileName: `payment-${transaction.id}.pdf`,
            mimeType: 'application/pdf',
            description: `${transaction.type} payment of $${Number(transaction.amount).toFixed(2)}`,
            relatedEntityId: transaction.id,
            relatedEntityType: 'EscrowTransaction',
            createdAt: transaction.createdAt,
          },
        })
      }

      bundles.push(paymentBundle)
    }

    // 5. Warranties Bundle
    if (project.closeoutChecklist) {
      const warrantyItems = project.closeoutChecklist.items.filter(
        (item: any) => item.type === 'WARRANTY_COLLECTION' && item.attachments.length > 0
      )

      if (warrantyItems.length > 0) {
        const warrantyBundle = await prisma.documentBundle.create({
          data: {
            packageId,
            type: 'WARRANTIES',
            title: 'Warranty Documentation',
            description: 'All warranty documents and information',
            fileCount: warrantyItems.reduce((sum: number, item: any) => sum + item.attachments.length, 0),
          },
        })

        for (const item of warrantyItems) {
          for (const attachment of item.attachments) {
            await prisma.bundleDocument.create({
              data: {
                bundleId: warrantyBundle.id,
                documentType: 'warranty',
                title: attachment.fileName || 'Warranty Document',
                url: attachment.url,
                fileName: attachment.fileName,
                mimeType: attachment.mimeType || null,
                sizeBytes: attachment.sizeBytes || null,
                description: `Warranty document from closeout checklist`,
                relatedEntityId: attachment.id,
                relatedEntityType: 'CloseoutAttachment',
                documentCreatedAt: attachment.uploadedAt,
              },
            })
          }
        }

        bundles.push(warrantyBundle)
      }
    }

    // 6. Photos Bundle (from milestone evidence)
    const photoEvidence = project.milestones
      .flatMap((m: any) => m.evidence || [])
      .filter((e: any) => e.type === 'PHOTO' || e.mimeType?.startsWith('image/'))

    if (photoEvidence.length > 0) {
      const photoBundle = await prisma.documentBundle.create({
        data: {
          packageId,
          type: 'PHOTOS',
          title: 'Project Photos',
          description: 'All project photos and documentation',
          fileCount: photoEvidence.length,
        },
      })

      for (const evidence of photoEvidence) {
        await prisma.bundleDocument.create({
          data: {
            bundleId: photoBundle.id,
            documentType: 'photo',
            title: evidence.description || `Photo - ${evidence.id}`,
            url: evidence.url,
            fileName: evidence.fileName,
            mimeType: evidence.mimeType || 'image/jpeg',
            sizeBytes: evidence.sizeBytes || null,
            description: `Project photo from milestone evidence`,
            relatedEntityId: evidence.id,
            relatedEntityType: 'Evidence',
            createdAt: evidence.uploadedAt,
          },
        })
      }

      bundles.push(photoBundle)
    }

    // 7. Closeout Bundle
    if (project.closeoutChecklist) {
      const closeoutAttachments = project.closeoutChecklist.items.flatMap(
        (item: any) => item.attachments || []
      )

      if (closeoutAttachments.length > 0) {
        const closeoutBundle = await prisma.documentBundle.create({
          data: {
            packageId,
            type: 'CLOSEOUT',
            title: 'Closeout Documents',
            description: 'Final closeout checklist and documents',
            fileCount: closeoutAttachments.length,
          },
        })

        for (const attachment of closeoutAttachments) {
          await prisma.bundleDocument.create({
            data: {
              bundleId: closeoutBundle.id,
              documentType: 'closeout_document',
              title: attachment.fileName || 'Closeout Document',
              url: attachment.url,
              fileName: attachment.fileName,
              mimeType: attachment.mimeType || null,
              sizeBytes: attachment.sizeBytes || null,
              description: `Closeout document`,
              relatedEntityId: attachment.id,
              relatedEntityType: 'CloseoutAttachment',
              createdAt: attachment.uploadedAt,
            },
          })
        }

        bundles.push(closeoutBundle)
      }
    }

    return bundles
  },

  /**
   * Get handoff package (Prompt 3.8)
   */
  async getHandoffPackage(projectId: string, userId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: { select: { id: true } },
      },
    })

    if (!project) throw new NotFoundError('Project', projectId)
    if (project.ownerId !== userId) {
      throw new AuthorizationError('Only project owner can view handoff package')
    }

    const package_ = await prisma.handoffPackage.findUnique({
      where: { projectId },
      include: {
        documentBundles: {
          include: {
            documents: {
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { type: 'asc' },
        },
        satisfactionSurvey: true,
      },
    })

    return package_
  },

  /**
   * Mark package as delivered (Prompt 3.8)
   */
  async deliverHandoffPackage(projectId: string, userId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: { select: { id: true } },
      },
    })

    if (!project) throw new NotFoundError('Project', projectId)
    if (project.ownerId !== userId) {
      throw new AuthorizationError('Only project owner can deliver handoff package')
    }

    const package_ = await prisma.handoffPackage.findUnique({
      where: { projectId },
    })

    if (!package_) {
      throw new NotFoundError('HandoffPackage', projectId)
    }

    const updated = await prisma.handoffPackage.update({
      where: { id: package_.id },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date(),
      },
    })

    // Send satisfaction survey email (TODO: Integrate with email service)
    // await emailService.sendSatisfactionSurvey(project.ownerId, package_.id)

    return updated
  },

  /**
   * Record package download (Prompt 3.8)
   */
  async recordDownload(projectId: string, userId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: { select: { id: true } },
      },
    })

    if (!project) throw new NotFoundError('Project', projectId)
    if (project.ownerId !== userId) {
      throw new AuthorizationError('Only project owner can download handoff package')
    }

    const package_ = await prisma.handoffPackage.findUnique({
      where: { projectId },
    })

    if (!package_) {
      throw new NotFoundError('HandoffPackage', projectId)
    }

    const updated = await prisma.handoffPackage.update({
      where: { id: package_.id },
      data: {
        status: 'DOWNLOADED',
        downloadedAt: new Date(),
        downloadCount: { increment: 1 },
      },
    })

    return updated
  },

  /**
   * Create satisfaction survey (Prompt 3.8)
   */
  async createSatisfactionSurvey(packageId: string, projectId: string) {
    const existing = await prisma.satisfactionSurvey.findUnique({
      where: { packageId },
    })

    if (existing) {
      return existing
    }

    const survey = await prisma.satisfactionSurvey.create({
      data: {
        packageId,
        projectId,
        status: 'PENDING',
      },
    })

    return survey
  },

  /**
   * Get satisfaction survey (Prompt 3.8)
   */
  async getSatisfactionSurvey(packageId: string, userId: string) {
    const survey = await prisma.satisfactionSurvey.findUnique({
      where: { packageId },
      include: {
        project: {
          select: {
            ownerId: true,
          },
        },
      },
    })

    if (!survey) throw new NotFoundError('SatisfactionSurvey', packageId)
    if (survey.project.ownerId !== userId) {
      throw new AuthorizationError('Only project owner can view satisfaction survey')
    }

    return survey
  },

  /**
   * Submit satisfaction survey (Prompt 3.8)
   */
  async submitSatisfactionSurvey(
    packageId: string,
    userId: string,
    input: {
      overallRating: number
      communicationRating?: number
      qualityRating?: number
      timelinessRating?: number
      valueRating?: number
      whatWentWell?: string
      whatCouldImprove?: string
      additionalComments?: string
      wouldRecommend?: boolean
      recommendationReason?: string
    }
  ) {
    const survey = await prisma.satisfactionSurvey.findUnique({
      where: { packageId },
      include: {
        project: {
          select: {
            ownerId: true,
          },
        },
      },
    })

    if (!survey) throw new NotFoundError('SatisfactionSurvey', packageId)
    if (survey.project.ownerId !== userId) {
      throw new AuthorizationError('Only project owner can submit satisfaction survey')
    }

    if (survey.status === 'COMPLETED') {
      throw new ValidationError('Survey has already been completed')
    }

    const updated = await prisma.satisfactionSurvey.update({
      where: { id: survey.id },
      data: {
        status: 'COMPLETED',
        startedAt: survey.startedAt || new Date(),
        completedAt: new Date(),
        overallRating: input.overallRating,
        communicationRating: input.communicationRating || null,
        qualityRating: input.qualityRating || null,
        timelinessRating: input.timelinessRating || null,
        valueRating: input.valueRating || null,
        whatWentWell: input.whatWentWell || null,
        whatCouldImprove: input.whatCouldImprove || null,
        additionalComments: input.additionalComments || null,
        wouldRecommend: input.wouldRecommend || null,
        recommendationReason: input.recommendationReason || null,
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: 'Project',
        entityId: survey.projectId,
        action: 'SATISFACTION_SURVEY_COMPLETED',
        details: {
          surveyId: survey.id,
          overallRating: input.overallRating,
        },
        userId: userId,
        reason: 'Satisfaction survey submitted',
      },
    })

    // Create event
    await prisma.event.create({
      data: {
        entityType: 'Project',
        entityId: survey.projectId,
        type: 'SATISFACTION_SURVEY_COMPLETED',
        payload: {
          surveyId: survey.id,
          overallRating: input.overallRating,
        },
        userId: userId,
      },
    })

    return updated
  },

  /**
   * Start satisfaction survey (Prompt 3.8)
   */
  async startSatisfactionSurvey(packageId: string, userId: string) {
    const survey = await prisma.satisfactionSurvey.findUnique({
      where: { packageId },
      include: {
        project: {
          select: {
            ownerId: true,
          },
        },
      },
    })

    if (!survey) throw new NotFoundError('SatisfactionSurvey', packageId)
    if (survey.project.ownerId !== userId) {
      throw new AuthorizationError('Only project owner can start satisfaction survey')
    }

    if (survey.status === 'COMPLETED') {
      throw new ValidationError('Survey has already been completed')
    }

    const updated = await prisma.satisfactionSurvey.update({
      where: { id: survey.id },
      data: {
        status: 'IN_PROGRESS',
        sentAt: survey.sentAt || new Date(),
        startedAt: new Date(),
      },
    })

    return updated
  },
}
