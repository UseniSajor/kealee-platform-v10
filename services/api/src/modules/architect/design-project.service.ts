import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError, ValidationError } from '../../errors/app.error'
import { auditService } from '../audit/audit.service'
import { eventService } from '../events/event.service'

export const designProjectService = {
  /**
   * Create a new design project linked to a Project Owner project
   */
  async createDesignProject(data: {
    projectId: string
    name: string
    description?: string
    projectType: 'RESIDENTIAL' | 'COMMERCIAL' | 'INSTITUTIONAL' | 'MIXED_USE'
    userId: string
  }) {
    // Verify the Project Owner project exists
    const project = await prismaAny.project.findUnique({
      where: { id: data.projectId },
      include: {
        owner: true,
        org: true,
      },
    })

    if (!project) {
      throw new NotFoundError('Project', data.projectId)
    }

    // Check if design project already exists for this project
    const existing = await prismaAny.designProject.findUnique({
      where: { projectId: data.projectId },
    })

    if (existing) {
      throw new ValidationError('Design project already exists for this project')
    }

    // Generate unique client access URL
    const clientAccessUrl = `client-${data.projectId.slice(0, 8)}-${Date.now().toString(36)}`

    // Create design project with default phases
    const designProject = await prismaAny.$transaction(async (tx: any) => {
      const dp = await tx.designProject.create({
        data: {
          projectId: data.projectId,
          name: data.name,
          description: data.description,
          projectType: data.projectType,
          budgetTotal: project.budgetTotal ? new prismaAny.Decimal(project.budgetTotal) : null,
          startDate: project.startDate,
          endDate: project.endDate,
          clientAccessUrl,
          clientAccessEnabled: true,
        },
      })

      // Create default phases
      const phases = [
        { phase: 'PRE_DESIGN', name: 'Pre-Design', description: 'Initial project planning and programming' },
        { phase: 'SCHEMATIC_DESIGN', name: 'Schematic Design', description: 'Conceptual design development' },
        { phase: 'DESIGN_DEVELOPMENT', name: 'Design Development', description: 'Detailed design refinement' },
        { phase: 'CONSTRUCTION_DOCUMENTS', name: 'Construction Documents', description: 'Final construction documentation' },
      ]

      for (const phaseData of phases) {
        await tx.designPhaseInstance.create({
          data: {
            designProjectId: dp.id,
            ...phaseData,
            status: 'NOT_STARTED',
            requiresApproval: true,
          },
        })
      }

      // Add creator as Principal by default
      await tx.designTeamMember.create({
        data: {
          designProjectId: dp.id,
          userId: data.userId,
          role: 'PRINCIPAL',
        },
      })

      return dp
    })

    // Log audit
    await auditService.recordAudit({
      action: 'DESIGN_PROJECT_CREATED',
      entityType: 'DesignProject',
      entityId: designProject.id,
      userId: data.userId,
      reason: `Design project created for Project Owner project: ${project.name}`,
      after: {
        projectId: data.projectId,
        projectType: data.projectType,
        name: data.name,
      },
    })

    // Log event
    await eventService.recordEvent({
      type: 'DESIGN_PROJECT_CREATED',
      entityType: 'DesignProject',
      entityId: designProject.id,
      userId: data.userId,
      payload: {
        projectId: data.projectId,
        projectType: data.projectType,
        name: data.name,
      },
    })

    return designProject
  },

  /**
   * Get design project by ID
   */
  async getDesignProject(id: string) {
    const designProject = await prismaAny.designProject.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            org: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        phases: {
          orderBy: { phase: 'asc' },
        },
        teamMembers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!designProject) {
      throw new NotFoundError('DesignProject', id)
    }

    return designProject
  },

  /**
   * List design projects for a user
   */
  async listDesignProjects(userId: string, filters?: {
    projectType?: string
    status?: string
  }) {
    const where: any = {
      teamMembers: {
        some: {
          userId,
        },
      },
    }

    if (filters?.projectType) {
      where.projectType = filters.projectType
    }

    if (filters?.status) {
      where.status = filters.status
    }

    const designProjects = await prismaAny.designProject.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            category: true,
            status: true,
          },
        },
        phases: {
          orderBy: { phase: 'asc' },
        },
        teamMembers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return designProjects
  },

  /**
   * Get available Project Owner projects for linking
   */
  async getAvailableProjects(userId: string) {
    // Get projects where user is owner or member, and no design project exists
    const projects = await prismaAny.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          {
            memberships: {
              some: {
                userId,
              },
            },
          },
        ],
        designProject: null, // No design project linked yet
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        org: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return projects
  },

  /**
   * Add team member to design project
   */
  async addTeamMember(data: {
    designProjectId: string
    userId: string
    role: 'PRINCIPAL' | 'PROJECT_ARCHITECT' | 'DESIGNER' | 'DRAFTER'
    addedByUserId: string
  }) {
    const designProject = await prismaAny.designProject.findUnique({
      where: { id: data.designProjectId },
    })

    if (!designProject) {
      throw new NotFoundError('DesignProject', data.designProjectId)
    }

    // Check if user is already a member
    const existing = await prismaAny.designTeamMember.findUnique({
      where: {
        designProjectId_userId: {
          designProjectId: data.designProjectId,
          userId: data.userId,
        },
      },
    })

    if (existing && !existing.leftAt) {
      throw new ValidationError('User is already a team member')
    }

    const teamMember = await prismaAny.designTeamMember.upsert({
      where: {
        designProjectId_userId: {
          designProjectId: data.designProjectId,
          userId: data.userId,
        },
      },
      update: {
        role: data.role,
        leftAt: null, // Re-activate if previously left
      },
      create: {
        designProjectId: data.designProjectId,
        userId: data.userId,
        role: data.role,
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'DESIGN_TEAM_MEMBER_ADDED',
      entityType: 'DesignTeamMember',
      entityId: teamMember.id,
      userId: data.addedByUserId,
      reason: `Team member added to design project`,
      after: {
        designProjectId: data.designProjectId,
        userId: data.userId,
        role: data.role,
      },
    })

    return teamMember
  },

  /**
   * Update design project
   */
  async updateDesignProject(id: string, data: {
    name?: string
    description?: string
    projectType?: 'RESIDENTIAL' | 'COMMERCIAL' | 'INSTITUTIONAL' | 'MIXED_USE'
    status?: 'DRAFT' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'
    clientAccessEnabled?: boolean
    userId: string
  }) {
    const designProject = await prismaAny.designProject.findUnique({
      where: { id },
    })

    if (!designProject) {
      throw new NotFoundError('DesignProject', id)
    }

    const updated = await prismaAny.designProject.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.projectType && { projectType: data.projectType }),
        ...(data.status && { status: data.status }),
        ...(data.clientAccessEnabled !== undefined && { clientAccessEnabled: data.clientAccessEnabled }),
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'DESIGN_PROJECT_UPDATED',
      entityType: 'DesignProject',
      entityId: id,
      userId: data.userId,
      reason: 'Design project updated',
      before: designProject,
      after: updated,
    })

    return updated
  },
}
