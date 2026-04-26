import { prismaAny } from '../../utils/prisma-helper'
import { AuthorizationError, NotFoundError, ValidationError } from '../../errors/app.error'
// Prisma types available through prismaAny
import { readinessService } from '../readiness/readiness.service'
import { auditService } from '../audit/audit.service'
import { eventService } from '../events/event.service'
import { ensureDigitalTwin } from '../../lib/twin/digital-twin.service'

export type CreateProjectInput = {
  ownerId: string
  orgId?: string
  name: string
  description?: string
  category:
    | 'KITCHEN'
    | 'BATHROOM'
    | 'ADDITION'
    | 'NEW_CONSTRUCTION'
    | 'RENOVATION'
    | 'OTHER'
  categoryMetadata?: unknown
  adminOverride?: boolean // Allow direct creation for OS-PM flow (requires audit reason)
  adminReason?: string // Required if adminOverride is true
}

export type UpdateProjectInput = {
  orgId?: string | null
  name?: string
  description?: string | null
  category?:
    | 'KITCHEN'
    | 'BATHROOM'
    | 'ADDITION'
    | 'NEW_CONSTRUCTION'
    | 'RENOVATION'
    | 'OTHER'
  categoryMetadata?: unknown | null
  propertyId?: string | null
  budgetTotal?: number | null
  startDate?: string | null
  endDate?: string | null
  status?: string
}

async function assertProjectAccess(projectId: string, userId: string) {
  const project = await prismaAny.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      ownerId: true,
      memberships: { where: { userId }, select: { id: true } },
    },
  })

  if (!project) throw new NotFoundError('Project', projectId)
  if (project.ownerId === userId) return
  if (project.memberships.length > 0) return

  throw new AuthorizationError('Not allowed to access this project')
}

async function assertProjectOwner(projectId: string, userId: string) {
  const project = await prismaAny.project.findUnique({
    where: { id: projectId },
    select: { id: true, ownerId: true },
  })
  if (!project) throw new NotFoundError('Project', projectId)
  if (project.ownerId !== userId) throw new AuthorizationError('Only the project owner can perform this action')
}

export const projectService = {
  async createProject(input: CreateProjectInput, userId?: string) {
    // Enforce lead-based creation unless admin override
    if (!input.adminOverride) {
      throw new ValidationError(
        'Projects must be created from WON leads. Use POST /projects/from-lead/:leadId instead. ' +
          'For OS-PM flow, set adminOverride=true and provide adminReason.'
      )
    }

    // Admin override requires reason
    if (input.adminOverride && !input.adminReason) {
      throw new ValidationError('adminReason is required when adminOverride is true')
    }

    const project = await prismaAny.project.create({
      data: {
        ownerId: input.ownerId,
        orgId: input.orgId ?? null,
        name: input.name,
        description: input.description ?? null,
        category: input.category,
        categoryMetadata: (input.categoryMetadata as any) ?? null,
        status: 'DRAFT',
        memberships: {
          create: [
            {
              userId: input.ownerId,
              role: 'OWNER',
            },
          ],
        },
      },
    })

    // Ensure DigitalTwin exists for the new project (DDTS enforcement)
    await ensureDigitalTwin(project.id, input.orgId ?? undefined)

    // Log admin override in audit (only after successful creation)
    if (input.adminOverride && userId) {
      await auditService.recordAudit({
        action: 'PROJECT_CREATED_ADMIN_OVERRIDE',
        entityType: 'Project',
        entityId: project.id,
        userId,
        reason: input.adminReason || 'Admin override for direct project creation',
        before: null,
        after: {
          id: project.id,
          name: project.name,
          category: project.category,
          ownerId: project.ownerId,
        },
      })
    }

    return project
  },

  /**
   * Create project from a WON lead
   * This is the primary method for project creation - enforces lead pipeline workflow
   */
  async createProjectFromLead(leadId: string, ownerId: string, orgId?: string, userId?: string) {
    // Fetch lead with related data
    const lead = await prismaAny.lead.findUnique({
      where: { id: leadId },
      include: {
        awardedProfile: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!lead) {
      throw new NotFoundError('Lead', leadId)
    }

    // Validation: Lead stage must be WON
    if (lead.stage !== 'WON') {
      throw new ValidationError(
        `Lead must be in WON stage to create project. Current stage: ${lead.stage}`
      )
    }

    // Validation: Lead.awardedProfileId must exist
    if (!lead.awardedProfileId || !lead.awardedProfile) {
      throw new ValidationError(
        'Lead must have an awarded contractor (awardedProfileId) to create project'
      )
    }

    // Validation: Lead should not already have a project
    if (lead.projectId) {
      throw new ValidationError(
        `Lead already has an associated project: ${lead.projectId}. Cannot create duplicate project.`
      )
    }

    // Verify ownerId exists
    const owner = await prismaAny.user.findUnique({
      where: { id: ownerId },
      select: { id: true, email: true },
    })

    if (!owner) {
      throw new NotFoundError('User', ownerId)
    }

    // Optional: Verify lead email matches owner email (if lead has email)
    if (lead.email && lead.email !== owner.email) {
      // Log warning but don't block - email might have changed
      console.warn(
        `Lead email (${lead.email}) does not match owner email (${owner.email}) for lead ${leadId}`
      )
    }

    // Determine project category from lead.projectType or default to OTHER
    const categoryMap: Record<string, any> = {
      KITCHEN: 'KITCHEN',
      BATHROOM: 'BATHROOM',
      ADDITION: 'ADDITION',
      NEW_CONSTRUCTION: 'NEW_CONSTRUCTION',
      RENOVATION: 'RENOVATION',
    }
    const category = lead.projectType && categoryMap[lead.projectType] ? categoryMap[lead.projectType] : 'OTHER'

    // Compute execution tier from lead.estimatedValue
    // 0–150k => LOW
    // 150k–350k => STANDARD
    // 350k–500k => HIGH
    let executionTier: string = 'STANDARD'
    if (lead.estimatedValue) {
      const value = Number(lead.estimatedValue)
      if (value < 150000) {
        executionTier = 'LOW'
      } else if (value >= 150000 && value < 350000) {
        executionTier = 'STANDARD'
      } else {
        executionTier = 'HIGH'
      }
    }

    // Create project in transaction
    const result = await prismaAny.$transaction(async (tx: any) => {
      // Create project
      const project = await tx.project.create({
        data: {
          ownerId,
          orgId: orgId ?? null,
          name: lead.name || `Project from Lead ${leadId}`,
          description: lead.description ?? null,
          category: category as any,
          categoryMetadata: null,
          budgetTotal: lead.estimatedValue ? (lead.estimatedValue as any) : null,
          executionTier: executionTier,
          status: 'DRAFT',
          memberships: {
            create: [
              {
                userId: ownerId,
                role: 'OWNER',
              },
              // Add contractor as member if awardedProfile exists
              {
                userId: lead.awardedProfile.userId,
                role: 'CONTRACTOR',
              },
            ],
          },
        },
      })

      // Link project to lead
      await tx.lead.update({
        where: { id: leadId },
        data: {
          projectId: project.id,
        },
      })

      return project
    })

    // Ensure DigitalTwin exists for the new project (DDTS enforcement)
    await ensureDigitalTwin(result.id, orgId)

    // Create default readiness checklist (optional)
    try {
      await readinessService.generateProjectReadiness(result.id, ownerId)
    } catch (error: any) {
      // Log but don't fail - readiness checklist creation is optional
      console.warn(`Failed to create default readiness checklist for project ${result.id}:`, error.message)
    }

    // Log audit
    await auditService.recordAudit({
      action: 'PROJECT_CREATED_FROM_LEAD',
      entityType: 'Project',
      entityId: result.id,
      userId: userId || ownerId,
      reason: `Project created from WON lead ${leadId}`,
      before: {
        leadId,
        leadStage: lead.stage,
        leadEstimatedValue: lead.estimatedValue?.toString(),
        leadAwardedProfileId: lead.awardedProfileId,
      },
      after: {
        projectId: result.id,
        projectName: result.name,
        projectCategory: result.category,
        projectStatus: result.status,
        projectExecutionTier: result.executionTier,
        ownerId: result.ownerId,
      },
    })

    // Log event
    await eventService.recordEvent({
      type: 'PROJECT_CREATED_FROM_LEAD',
      entityType: 'Project',
      entityId: result.id,
      userId: userId || ownerId,
      orgId: orgId,
      payload: {
        leadId,
        leadName: lead.name,
        leadStage: lead.stage,
        leadEstimatedValue: lead.estimatedValue?.toString(),
        awardedProfileId: lead.awardedProfileId,
        awardedContractor: lead.awardedProfile.businessName,
        projectId: result.id,
        projectName: result.name,
        projectCategory: result.category,
        projectExecutionTier: result.executionTier,
        ownerId: result.ownerId,
      },
    })

    return result
  },

  async listMyProjects(userId: string) {
    return prismaAny.project.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
    })
  },

  async getProject(projectId: string, userId: string) {
    await assertProjectAccess(projectId, userId)

    const project = await prismaAny.project.findUnique({
      where: { id: projectId },
      include: {
        property: true,
        memberships: { include: { user: true } },
      },
    })

    if (!project) throw new NotFoundError('Project', projectId)
    return project
  },

  async updateProject(projectId: string, userId: string, input: UpdateProjectInput) {
    await assertProjectOwner(projectId, userId)

    // Prompt 1.5: Readiness gate check
    if (input.status === 'READINESS') {
      const gateCheck = await readinessService.checkReadinessGate(projectId)
      if (!gateCheck.canProceed) {
        throw new ValidationError(gateCheck.reason || 'Cannot proceed to READINESS status')
      }
    }

    const project = await prismaAny.project.update({
      where: { id: projectId },
      data: {
        orgId: input.orgId === undefined ? undefined : input.orgId,
        name: input.name,
        description: input.description === undefined ? undefined : input.description,
        category: input.category as any,
        categoryMetadata:
          input.categoryMetadata === undefined ? undefined : (input.categoryMetadata as any),
        propertyId: input.propertyId === undefined ? undefined : input.propertyId,
        budgetTotal:
          input.budgetTotal === undefined
            ? undefined
            : input.budgetTotal === null
              ? null
              : (input.budgetTotal as any),
        startDate: input.startDate === undefined ? undefined : input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate === undefined ? undefined : input.endDate ? new Date(input.endDate) : null,
        status: input.status === undefined ? undefined : (input.status as any),
      },
    })

    return project
  },

  async addMember(projectId: string, ownerId: string, userId: string, role: string) {
    await assertProjectOwner(projectId, ownerId)

    const member = await prismaAny.projectMembership.upsert({
      where: { projectId_userId: { projectId, userId } },
      update: { role },
      create: { projectId, userId, role },
    })

    return member
  },
}

