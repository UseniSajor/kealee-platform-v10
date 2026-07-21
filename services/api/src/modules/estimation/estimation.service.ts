/**
 * KEALEE OS-PM - ESTIMATION SERVICE
 * Integration with Command Center Estimation Engine (APP-15)
 *
 * This service proxies estimation requests to the Command Center
 * and handles project-estimation lifecycle integration.
 */

import axios, { AxiosInstance } from 'axios'
import { prismaAny } from '../../utils/prisma-helper'
import { auditService } from '../audit/audit.service'
import { eventService } from '../events/event.service'
import { NotFoundError, ValidationError } from '../../errors/app.error'
import { syncQuoteRequest } from '../integrations/ghl/ghl-sync'

// Command Center API client
const commandCenter: AxiosInstance = axios.create({
  baseURL: process.env.COMMAND_CENTER_URL || 'http://localhost:3001/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Types matching Command Center estimation module
export interface EstimateRequest {
  projectId?: string
  projectType: 'RESIDENTIAL_NEW' | 'RESIDENTIAL_REMODEL' | 'COMMERCIAL' | 'MIXED_USE' | 'REPAIR' | 'CHANGE_ORDER'
  squareFootage: number
  location: {
    city: string
    state: string
    zipCode: string
    lat?: number
    lng?: number
  }
  complexity?: 'BASIC' | 'STANDARD' | 'PREMIUM' | 'LUXURY'
  customRequirements?: string[]
  includePermits?: boolean
  includeContingency?: boolean
  contingencyPercent?: number
}

export interface LaborEstimate {
  projectType: string
  trades: Array<{
    trade: string
    hours: number
    rate: number
    total: number
  }>
  totalLaborCost: number
  totalHours: number
}

export interface MaterialEstimate {
  categories: Array<{
    category: string
    items: Array<{
      name: string
      quantity: number
      unit: string
      unitCost: number
      total: number
    }>
    subtotal: number
  }>
  totalMaterialCost: number
}

export interface TimelineEstimate {
  phases: Array<{
    phase: string
    name: string
    duration: number
    dependencies: string[]
    milestones: string[]
  }>
  totalDays: number
  estimatedStartDate?: Date
  estimatedEndDate?: Date
}

export interface FullEstimate {
  id: string
  projectId?: string
  labor: LaborEstimate
  materials: MaterialEstimate
  timeline: TimelineEstimate
  subtotal: number
  contingency: number
  total: number
  generatedAt: Date
  validUntil: Date
  confidence: number
}

export interface ServiceTicket {
  id: string
  type: string
  status: string
  priority: string
  clientName: string
  projectId?: string
  description: string
  estimateId?: string
  assignedTo?: string
  createdAt: Date
  updatedAt: Date
}

export const estimationService = {
  /**
   * Generate a full estimate for a project
   */
  async generateEstimate(request: EstimateRequest, userId: string): Promise<FullEstimate> {
    try {
      const response = await commandCenter.post('/estimation/estimate', request)
      const estimate = response.data as FullEstimate

      // If linked to a project, update project with estimate info
      if (request.projectId) {
        await this.linkEstimateToProject(request.projectId, estimate, userId)
      }

      // Log audit
      await auditService.recordAudit({
        action: 'ESTIMATE_GENERATED',
        entityType: 'Estimate',
        entityId: estimate.id,
        userId,
        reason: `Generated estimate for ${request.projectType}`,
        before: null,
        after: {
          estimateId: estimate.id,
          projectId: request.projectId,
          total: estimate.total,
          confidence: estimate.confidence,
        },
      })

      return estimate
    } catch (error: any) {
      console.error('Failed to generate estimate:', error.response?.data || error.message)
      throw new ValidationError(
        error.response?.data?.error || 'Failed to generate estimate from Command Center'
      )
    }
  },

  /**
   * Get labor estimate only
   */
  async getLaborEstimate(
    projectType: string,
    trades: string[],
    squareFootage: number,
    complexity: string = 'STANDARD'
  ): Promise<LaborEstimate> {
    const response = await commandCenter.post('/estimation/labor', {
      projectType,
      trades,
      squareFootage,
      complexity,
    })
    return response.data
  },

  /**
   * Get materials estimate with AI-generated list
   */
  async getMaterialsEstimate(
    projectType: string,
    scope: string,
    squareFootage: number
  ): Promise<MaterialEstimate> {
    const response = await commandCenter.post('/estimation/materials', {
      projectType,
      scope,
      squareFootage,
    })
    return response.data
  },

  /**
   * Get timeline estimate with phases
   */
  async getTimelineEstimate(
    projectType: string,
    squareFootage: number,
    complexity: string = 'STANDARD'
  ): Promise<TimelineEstimate> {
    const response = await commandCenter.post('/estimation/timeline', {
      projectType,
      squareFootage,
      complexity,
    })
    return response.data
  },

  /**
   * Create a service ticket
   */
  async createServiceTicket(
    ticketData: {
      type: string
      priority?: string
      clientName: string
      projectId?: string
      description: string
      siteAddress?: object
    },
    userId: string
  ): Promise<ServiceTicket> {
    const response = await commandCenter.post('/estimation/tickets', ticketData)
    const ticket = response.data as ServiceTicket

    // Log event
    await eventService.recordEvent({
      type: 'SERVICE_TICKET_CREATED',
      entityType: 'ServiceTicket',
      entityId: ticket.id,
      userId,
      payload: {
        ticketId: ticket.id,
        type: ticket.type,
        priority: ticket.priority,
        projectId: ticket.projectId,
      },
    })

    // Sync quote request to GHL CRM (fire-and-forget)
    const user = await prismaAny.user.findUnique({ where: { id: userId }, select: { email: true, name: true } })
    if (user?.email) {
      syncQuoteRequest({
        email: user.email,
        name: ticketData.clientName || user.name || '',
        serviceType: ticketData.type,
        source: 'Kealee Estimation',
        pipelineId: process.env.GHL_PIPELINE_ID || '',
        quoteRequestedStageId: process.env.GHL_QUOTE_REQUESTED_STAGE_ID || '',
      }).catch(() => {})
    }

    return ticket
  },

  /**
   * Get service ticket by ID
   */
  async getServiceTicket(ticketId: string): Promise<ServiceTicket> {
    const response = await commandCenter.get(`/estimation/tickets/${ticketId}`)
    return response.data
  },

  /**
   * Update service ticket status (transition)
   */
  async transitionTicket(
    ticketId: string,
    newStatus: string,
    metadata: Record<string, unknown> = {},
    userId: string
  ): Promise<ServiceTicket> {
    const beforeTicket = await this.getServiceTicket(ticketId)

    const response = await commandCenter.post(`/estimation/tickets/${ticketId}/transition`, {
      newStatus,
      ...metadata,
    })
    const ticket = response.data as ServiceTicket

    // Log audit
    await auditService.recordAudit({
      action: 'SERVICE_TICKET_TRANSITION',
      entityType: 'ServiceTicket',
      entityId: ticketId,
      userId,
      reason: `Transitioned from ${beforeTicket.status} to ${newStatus}`,
      before: { status: beforeTicket.status },
      after: { status: ticket.status, ...metadata },
    })

    return ticket
  },

  /**
   * Link an estimate to a project in the main database
   */
  async linkEstimateToProject(
    projectId: string,
    estimate: FullEstimate,
    userId: string
  ): Promise<void> {
    // Verify project exists
    const project = await prismaAny.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, budgetTotal: true },
    })

    if (!project) {
      throw new NotFoundError('Project', projectId)
    }

    // Update project with estimate total as budget if not set
    if (!project.budgetTotal) {
      await prismaAny.project.update({
        where: { id: projectId },
        data: {
          budgetTotal: estimate.total,
        },
      })
    }

    // Store estimate reference (using project metadata or a separate table)
    // For now, we'll record this as an event
    await eventService.recordEvent({
      type: 'ESTIMATE_LINKED_TO_PROJECT',
      entityType: 'Project',
      entityId: projectId,
      userId,
      payload: {
        estimateId: estimate.id,
        estimateTotal: estimate.total,
        laborCost: estimate.labor.totalLaborCost,
        materialsCost: estimate.materials.totalMaterialCost,
        contingency: estimate.contingency,
        timeline: estimate.timeline.totalDays,
        confidence: estimate.confidence,
        validUntil: estimate.validUntil,
      },
    })
  },

  /**
   * Get estimate for a project from Command Center
   */
  async getProjectEstimate(projectId: string): Promise<FullEstimate | null> {
    try {
      const response = await commandCenter.get(`/estimation/project/${projectId}`)
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null
      }
      throw error
    }
  },

  /**
   * Create project intake from service ticket
   * Creates both a service ticket and optionally a draft project
   */
  async createProjectIntake(
    intakeData: {
      clientName: string
      clientEmail?: string
      clientPhone?: string
      projectType: string
      description: string
      location: {
        address: string
        city: string
        state: string
        zipCode: string
      }
      squareFootage?: number
      estimatedBudget?: number
      preferredStartDate?: string
    },
    userId: string,
    orgId?: string
  ): Promise<{ ticket: ServiceTicket; estimate?: FullEstimate }> {
    // Create service ticket
    const ticket = await this.createServiceTicket(
      {
        type: 'NEW_PROJECT_INTAKE',
        priority: 'NORMAL',
        clientName: intakeData.clientName,
        description: intakeData.description,
        siteAddress: intakeData.location,
      },
      userId
    )

    // Generate quick estimate if square footage provided
    let estimate: FullEstimate | undefined
    if (intakeData.squareFootage) {
      try {
        estimate = await this.generateEstimate(
          {
            projectType: intakeData.projectType as any,
            squareFootage: intakeData.squareFootage,
            location: {
              city: intakeData.location.city,
              state: intakeData.location.state,
              zipCode: intakeData.location.zipCode,
            },
            complexity: 'STANDARD',
            includePermits: true,
            includeContingency: true,
          },
          userId
        )

        // Link estimate to ticket
        await this.transitionTicket(
          ticket.id,
          'ESTIMATION',
          { estimateId: estimate.id, estimateTotal: estimate.total },
          userId
        )
      } catch (error) {
        console.warn('Failed to auto-generate estimate for intake:', error)
      }
    }

    return { ticket, estimate }
  },

  /**
   * Get all service tickets for a project
   */
  async getProjectTickets(projectId: string): Promise<ServiceTicket[]> {
    const response = await commandCenter.get('/estimation/tickets', {
      params: { projectId },
    })
    return response.data.tickets || []
  },

  /**
   * Get estimation dashboard metrics
   */
  async getDashboardMetrics(): Promise<{
    activeTickets: number
    pendingEstimates: number
    completedThisMonth: number
    averageEstimateAccuracy: number
  }> {
    const response = await commandCenter.get('/estimation/metrics')
    return response.data
  },
}
