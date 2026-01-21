import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError, ValidationError } from '../../errors/app.error'
import { auditService } from '../audit/audit.service'
import { eventService } from '../events/event.service'
import { jurisdictionStaffService } from './jurisdiction-staff.service'
import { jurisdictionConfigService } from './jurisdiction-config.service'

export const permitRoutingService = {
  /**
   * Route permit to review disciplines (rules-based routing)
   */
  async routePermit(permitId: string, data: { routedById: string }) {
    const permit = await prismaAny.permit.findUnique({
      where: { id: permitId },
      include: {
        jurisdiction: {
          select: {
            id: true,
            code: true,
          },
        },
      },
    })

    if (!permit) {
      throw new NotFoundError('Permit', permitId)
    }

    // Get permit type config to determine required disciplines
    const permitTypeConfig = await prismaAny.permitTypeConfig.findUnique({
      where: {
        jurisdictionId_permitType: {
          jurisdictionId: permit.jurisdictionId,
          permitType: permit.type,
        },
      },
    })

    // Get routing rules for this jurisdiction
    const routingRules = await prismaAny.routingRule.findMany({
      where: {
        jurisdictionId: permit.jurisdictionId,
        isActive: true,
      },
      orderBy: {
        priority: 'desc',
      },
    })

    // Evaluate routing rules
    const applicableRules = []
    for (const rule of routingRules) {
      const conditions = rule.conditions as any
      let matches = true

      // Check conditions
      for (const [key, value] of Object.entries(conditions)) {
        if (key === 'permitType' && permit.type !== value) {
          matches = false
          break
        }
        if (key === 'valuation') {
          const val = value as any
          const permitValuation = parseFloat(permit.valuation.toString())
          if (val.min && permitValuation < val.min) {
            matches = false
            break
          }
          if (val.max && permitValuation > val.max) {
            matches = false
            break
          }
        }
        if (key === 'projectType' && permit.subtype !== value) {
          matches = false
          break
        }
      }

      if (matches) {
        applicableRules.push(rule)
      }
    }

    // Determine required disciplines
    let requiredDisciplines: string[] = []
    if (permitTypeConfig) {
      requiredDisciplines = permitTypeConfig.requiredReviewDisciplines || []
    }

    // Apply routing rules
    if (applicableRules.length > 0) {
      const primaryRule = applicableRules[0]
      requiredDisciplines = [
        ...new Set([
          ...requiredDisciplines,
          ...((primaryRule as any).requiredDisciplines || []),
        ]),
      ]
    }

    // If no disciplines found, use default
    if (requiredDisciplines.length === 0) {
      requiredDisciplines = ['BUILDING'] // Default discipline
    }

    // Create routing assignments for each discipline
    const routings = await Promise.all(
      requiredDisciplines.map(async (discipline, index) => {
        // Determine priority
        let priority = 0
        if (permit.expedited) {
          priority = 100 // High priority for expedited
        } else {
          priority = 50 - index * 10 // Decreasing priority
        }

        // Calculate due date (based on discipline estimated review days)
        const reviewDiscipline = await prismaAny.reviewDiscipline.findUnique({
          where: {
            jurisdictionId_disciplineType: {
              jurisdictionId: permit.jurisdictionId,
              disciplineType: discipline,
            },
          },
        })

        let dueDate: Date | undefined
        if (reviewDiscipline?.estimatedReviewDays) {
          dueDate = new Date()
          dueDate.setDate(dueDate.getDate() + reviewDiscipline.estimatedReviewDays)
        }

        const routing = await prismaAny.permitRouting.create({
          data: {
            permitId,
            discipline,
            routingStatus: 'PENDING',
            routingPriority: priority,
            isExpedited: permit.expedited || false,
            dueDate,
          },
        })

        // Auto-assign if enabled
        if (reviewDiscipline?.autoAssign) {
          await this.autoAssignReviewer(routing.id, {
            discipline,
            jurisdictionId: permit.jurisdictionId,
            isExpedited: permit.expedited || false,
            priority,
          })
        }

        return routing
      })
    )

    // Update permit status
    await prismaAny.permit.update({
      where: { id: permitId },
      data: {
        status: 'UNDER_REVIEW',
        reviewStartedAt: new Date(),
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'PERMIT_ROUTED',
      entityType: 'Permit',
      entityId: permitId,
      userId: data.routedById,
      reason: `Permit routed to ${requiredDisciplines.length} discipline(s)`,
      after: {
        disciplines: requiredDisciplines,
        routingCount: routings.length,
      },
    })

    // Send notification
    await this.sendNotification(permitId, {
      notificationType: 'REVIEW_STARTED',
      title: 'Permit Review Started',
      message: `Your permit ${permit.permitNumber} has been routed for review to ${requiredDisciplines.length} discipline(s).`,
      recipientId: permit.applicantId,
    })

    return { routings, disciplines: requiredDisciplines }
  },

  /**
   * Auto-assign reviewer (workload-based distribution)
   */
  async autoAssignReviewer(routingId: string, data: {
    discipline: string
    jurisdictionId: string
    isExpedited?: boolean
    priority?: number
  }) {
    const routing = await prismaAny.permitRouting.findUnique({
      where: { id: routingId },
      include: {
        permit: {
          select: {
            id: true,
            type: true,
            valuation: true,
          },
        },
      },
    })

    if (!routing) {
      throw new NotFoundError('PermitRouting', routingId)
    }

    // Use workload balancing to find best reviewer
    const balanceResult = await (jurisdictionStaffService as any).balanceWorkload(
      data.jurisdictionId,
      {
        assignmentType: 'REVIEW',
        entityId: routing.permitId,
        entityType: 'Permit',
        requiredRole: 'PLAN_REVIEWER',
        requiredSpecialty: data.discipline,
        priority: data.priority || routing.routingPriority,
      }
    )

    if (!balanceResult.recommended) {
      // No available reviewer, leave unassigned
      return routing
    }

    const recommendedStaff = balanceResult.recommended.staff

    // Assign reviewer
    const updated = await prismaAny.permitRouting.update({
      where: { id: routingId },
      data: {
        assignedReviewerId: recommendedStaff.id,
        assignedAt: new Date(),
        routingStatus: 'ROUTED',
      },
    })

    // Create workload assignment
    await (jurisdictionStaffService as any).assignWorkload({
      staffId: recommendedStaff.id,
      jurisdictionId: data.jurisdictionId,
      assignmentType: 'REVIEW',
      entityId: routing.permitId,
      entityType: 'Permit',
      priority: data.priority || routing.routingPriority,
      dueDate: routing.dueDate || undefined,
      assignedById: recommendedStaff.userId, // System assignment
    })

    // Log audit
    await auditService.recordAudit({
      action: 'PERMIT_REVIEWER_ASSIGNED',
      entityType: 'PermitRouting',
      entityId: routingId,
      userId: recommendedStaff.userId,
      reason: `Auto-assigned reviewer: ${data.discipline}`,
      after: {
        assignedReviewerId: recommendedStaff.id,
      },
    })

    return updated
  },

  /**
   * Re-route permit (for corrections and resubmittals)
   */
  async reRoutePermit(permitId: string, data: {
    reason: string
    discipline?: string
    reRoutedById: string
  }) {
    const permit = await prismaAny.permit.findUnique({
      where: { id: permitId },
    })

    if (!permit) {
      throw new NotFoundError('Permit', permitId)
    }

    // Get existing routings
    const existingRoutings = await prismaAny.permitRouting.findMany({
      where: {
        permitId,
        routingStatus: {
          in: ['PENDING', 'ROUTED', 'IN_REVIEW'],
        },
      },
    })

    // Create new routings based on existing ones
    const newRoutings = await Promise.all(
      existingRoutings.map(async (existing: any) => {
        const newRouting = await prismaAny.permitRouting.create({
          data: {
            permitId,
            discipline: data.discipline || existing.discipline,
            routingStatus: 'PENDING',
            routingPriority: existing.routingPriority + 10, // Slightly higher priority for re-routing
            isExpedited: existing.isExpedited,
            previousRoutingId: existing.id,
            reRoutingReason: data.reason,
            reRoutedAt: new Date(),
            dueDate: existing.dueDate,
          },
        })

        // Mark old routing as re-routed
        await prismaAny.permitRouting.update({
          where: { id: existing.id },
          data: {
            routingStatus: 'RE_ROUTED',
          },
        })

        // Auto-assign if discipline specified
        if (data.discipline) {
          await this.autoAssignReviewer(newRouting.id, {
            discipline: data.discipline,
            jurisdictionId: permit.jurisdictionId,
            isExpedited: existing.isExpedited,
            priority: existing.routingPriority + 10,
          })
        }

        return newRouting
      })
    )

    // Update permit status
    await prismaAny.permit.update({
      where: { id: permitId },
      data: {
        status: 'RESUBMITTED',
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'PERMIT_RE_ROUTED',
      entityType: 'Permit',
      entityId: permitId,
      userId: data.reRoutedById,
      reason: `Permit re-routed: ${data.reason}`,
      after: {
        newRoutingCount: newRoutings.length,
      },
    })

    // Send notification
    await this.sendNotification(permitId, {
      notificationType: 'RESUBMITTED',
      title: 'Permit Resubmitted',
      message: `Your permit ${permit.permitNumber} has been resubmitted for review.`,
      recipientId: permit.applicantId,
    })

    return { routings: newRoutings }
  },

  /**
   * Escalate routing (for delayed reviews)
   */
  async escalateRouting(routingId: string, data: {
    reason: string
    escalatedToId?: string
    escalatedById: string
  }) {
    const routing = await prismaAny.permitRouting.findUnique({
      where: { id: routingId },
      include: {
        permit: {
          select: {
            id: true,
            permitNumber: true,
            applicantId: true,
          },
        },
      },
    })

    if (!routing) {
      throw new NotFoundError('PermitRouting', routingId)
    }

    // Determine escalation reason
    let escalationReason: string = 'DELAYED_REVIEW'
    if (routing.dueDate && new Date() > routing.dueDate) {
      escalationReason = 'OVERDUE'
    } else if (!routing.assignedReviewerId) {
      escalationReason = 'NO_ASSIGNMENT'
    }

    // If no escalatedToId, escalate to administrator
    let escalatedToId = data.escalatedToId
    if (!escalatedToId) {
      const admin = await prismaAny.jurisdictionStaff.findFirst({
        where: {
          jurisdictionId: routing.permit.jurisdictionId,
          role: 'ADMINISTRATOR',
          active: true,
        },
        include: {
          user: {
            select: {
              id: true,
            },
          },
        },
      })

      if (admin) {
        escalatedToId = admin.userId
      }
    }

    const updated = await prismaAny.permitRouting.update({
      where: { id: routingId },
      data: {
        isEscalated: true,
        escalationReason: escalationReason as any,
        escalatedAt: new Date(),
        escalatedToId,
        routingStatus: 'ESCALATED',
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'PERMIT_ROUTING_ESCALATED',
      entityType: 'PermitRouting',
      entityId: routingId,
      userId: data.escalatedById,
      reason: `Routing escalated: ${data.reason}`,
      after: {
        escalationReason,
        escalatedToId,
      },
    })

    // Send notification to escalated user
    if (escalatedToId) {
      await this.sendNotification(routing.permitId, {
        notificationType: 'ESCALATION',
        title: 'Permit Review Escalated',
        message: `Permit ${routing.permit.permitNumber} review has been escalated: ${data.reason}`,
        recipientId: escalatedToId,
      })
    }

    return updated
  },

  /**
   * Check for delayed reviews and auto-escalate
   */
  async checkDelayedReviews(jurisdictionId: string) {
    const now = new Date()
    const delayedRoutings = await prismaAny.permitRouting.findMany({
      where: {
        permit: {
          jurisdictionId,
        },
        routingStatus: {
          in: ['PENDING', 'ROUTED', 'IN_REVIEW'],
        },
        isEscalated: false,
        OR: [
          {
            dueDate: {
              lt: now,
            },
          },
          {
            assignedAt: {
              lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
            },
          },
        ],
      },
      include: {
        permit: {
          select: {
            id: true,
            permitNumber: true,
          },
        },
      },
    })

    const escalated = []
    for (const routing of delayedRoutings) {
      try {
        await this.escalateRouting(routing.id, {
          reason: routing.dueDate && new Date() > routing.dueDate
            ? 'Review overdue'
            : 'Review delayed',
          escalatedById: routing.assignedReviewerId || 'system',
        })
        escalated.push(routing.id)
      } catch (error) {
        // Continue with other routings
        console.error(`Failed to escalate routing ${routing.id}:`, error)
      }
    }

    return { escalated, count: escalated.length }
  },

  /**
   * Send notification to applicant
   */
  async sendNotification(permitId: string, data: {
    notificationType: string
    title: string
    message: string
    recipientId: string
    permitApplicationId?: string
  }) {
    const permit = await prismaAny.permit.findUnique({
      where: { id: permitId },
      include: {
        applicant: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    })

    if (!permit) {
      throw new NotFoundError('Permit', permitId)
    }

    const notification = await prismaAny.permitNotification.create({
      data: {
        permitId,
        permitApplicationId: data.permitApplicationId,
        notificationType: data.notificationType,
        title: data.title,
        message: data.message,
        recipientId: data.recipientId,
        recipientEmail: permit.applicant.email,
        inAppSent: true,
        // Email and SMS would be sent via background job
      },
    })

    // Emit event for notification service
    await eventService.recordEvent({
      type: 'PERMIT_NOTIFICATION_CREATED',
      entityType: 'PermitNotification',
      entityId: notification.id,
      userId: data.recipientId,
      payload: {
        permitId,
        notificationType: data.notificationType,
        recipientEmail: permit.applicant.email,
      },
    })

    return notification
  },

  /**
   * Get routing status for permit
   */
  async getRoutingStatus(permitId: string) {
    const permit = await prismaAny.permit.findUnique({
      where: { id: permitId },
      include: {
        routings: {
          include: {
            assignedReviewer: {
              select: {
                id: true,
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
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })

    if (!permit) {
      throw new NotFoundError('Permit', permitId)
    }

    return {
      permit: {
        id: permit.id,
        permitNumber: permit.permitNumber,
        status: permit.status,
      },
      routings: permit.routings,
      summary: {
        total: permit.routings.length,
        pending: permit.routings.filter((r: any) => r.routingStatus === 'PENDING').length,
        inReview: permit.routings.filter((r: any) => r.routingStatus === 'IN_REVIEW').length,
        completed: permit.routings.filter((r: any) => r.routingStatus === 'COMPLETED').length,
        escalated: permit.routings.filter((r: any) => r.isEscalated).length,
      },
    }
  },

  /**
   * Complete routing
   */
  async completeRouting(routingId: string, data: { completedById: string }) {
    const routing = await prismaAny.permitRouting.findUnique({
      where: { id: routingId },
      include: {
        permit: {
          select: {
            id: true,
            permitNumber: true,
            routings: true,
          },
        },
      },
    })

    if (!routing) {
      throw new NotFoundError('PermitRouting', routingId)
    }

    const updated = await prismaAny.permitRouting.update({
      where: { id: routingId },
      data: {
        routingStatus: 'COMPLETED',
        completedAt: new Date(),
        actualCompletionDate: new Date(),
      },
    })

    // Check if all routings are completed
    const allRoutings = routing.permit.routings
      const allCompleted = allRoutings.every(
        (r: any) => r.routingStatus === 'COMPLETED' || r.id === routingId
      )

    if (allCompleted) {
      // All reviews complete, check if permit can be approved
      await prismaAny.permit.update({
        where: { id: routing.permitId },
        data: {
          status: 'APPROVED',
          approvedAt: new Date(),
        },
      })

      // Send notification
      await this.sendNotification(routing.permitId, {
        notificationType: 'APPROVED',
        title: 'Permit Approved',
        message: `Your permit ${routing.permit.permitNumber} has been approved.`,
        recipientId: routing.permit.applicantId,
      })
    }

    // Log audit
    await auditService.recordAudit({
      action: 'PERMIT_ROUTING_COMPLETED',
      entityType: 'PermitRouting',
      entityId: routingId,
      userId: data.completedById,
      reason: `Routing completed: ${routing.discipline}`,
      after: {
        routingStatus: 'COMPLETED',
        allCompleted,
      },
    })

    return updated
  },
}
