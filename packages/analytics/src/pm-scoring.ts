/**
 * PM Scoring System
 * Calculates PM productivity scores based on multiple metrics
 */

import { prisma } from '@kealee/database'

export type Period = 'daily' | 'weekly' | 'monthly'

export interface PMScore {
  overallScore: number // 0-100
  breakdown: {
    sopAdherence: number // 0-100
    gateCompliance: number // 0-100
    efficiency: number // 0-100
    quality: number // 0-100
    integrationUsage: number // 0-100
  }
  comparisons: {
    teamRank: number // 1-based rank
    improvement: number // Percentage change from previous period
    strengths: string[]
    areasForImprovement: string[]
  }
  period: Period
  calculatedAt: Date
}

export interface IntegrationMetrics {
  permitsModule: {
    usage: number // 0-100
    efficiency: number // 0-100
    compliance: number // 0-100
  }
  escrowModule: {
    usage: number // 0-100
    timeliness: number // 0-100
    accuracy: number // 0-100
  }
  marketplaceModule: {
    usage: number // 0-100
    contractorQuality: number // 0-100
    responseTime: number // 0-100
  }
  architectModule: {
    usage: number // 0-100
    deliverableQuality: number // 0-100
    onTimeDelivery: number // 0-100
  }
}

export class PMScoringSystem {
  /**
   * Calculate productivity score for a PM
   */
  async calculateProductivityScore(pmId: string, period: Period = 'weekly'): Promise<PMScore> {
    // Get tasks for the period
    const tasks = await this.getCompletedTasks(pmId, period)

    // Get managed projects
    const projects = await this.getManagedProjects(pmId)

    // Calculate individual metrics
    const sopAdherence = this.calculateSOPAdherence(tasks)
    const timelineAccuracy = this.calculateTimelineAccuracy(projects)
    const budgetCompliance = this.calculateBudgetCompliance(projects)
    const stakeholderSatisfaction = this.calculateStakeholderSatisfaction(projects)

    // Calculate overall score using weighted formula
    const overallScore = Math.round(
      sopAdherence * 0.4 +
        timelineAccuracy * 0.3 +
        budgetCompliance * 0.2 +
        stakeholderSatisfaction * 0.1
    )

    // Calculate breakdown metrics
    const gateCompliance = this.calculateGateCompliance(tasks)
    const efficiency = this.calculateEfficiency(tasks)
    const quality = this.calculateQualityScore(projects)
    const integrationUsage = await this.calculateIntegrationUsageScore(pmId)

    // Get comparisons
    const teamRank = await this.getTeamRank(pmId, overallScore)
    const improvement = await this.getImprovementTrend(pmId, period)
    const strengths = await this.identifyStrengths(pmId, {
      sopAdherence,
      timelineAccuracy,
      budgetCompliance,
      efficiency,
      quality,
    })
    const areasForImprovement = await this.identifyImprovementAreas(pmId, {
      sopAdherence,
      timelineAccuracy,
      budgetCompliance,
      efficiency,
      quality,
    })

    return {
      overallScore,
      breakdown: {
        sopAdherence,
        gateCompliance,
        efficiency,
        quality,
        integrationUsage,
      },
      comparisons: {
        teamRank,
        improvement,
        strengths,
        areasForImprovement,
      },
      period,
      calculatedAt: new Date(),
    }
  }

  /**
   * Get completed tasks for a PM in a period
   */
  private async getCompletedTasks(pmId: string, period: Period): Promise<any[]> {
    const now = new Date()
    const startDate = new Date(now)

    switch (period) {
      case 'daily':
        startDate.setDate(now.getDate() - 1)
        break
      case 'weekly':
        startDate.setDate(now.getDate() - 7)
        break
      case 'monthly':
        startDate.setMonth(now.getMonth() - 1)
        break
    }

    const tasks = await prisma.task?.findMany({
      where: {
        status: 'COMPLETED',
        completedAt: {
          gte: startDate,
          lte: now,
        },
        assignedTo: pmId,
      },
      include: {
        plan: {
          include: {
            user: true,
              },
            },
          },
        },
      },
    }).catch(() => [])

    return tasks || []
  }

  /**
   * Get managed projects for a PM
   */
  private async getManagedProjects(pmId: string): Promise<any[]> {
    // Get projects where PM is assigned or is the owner
    const projects = await prisma.project?.findMany({
      where: {
        assignedPM: pmId,
      },
      include: {
        contracts: true,
      },
    }).catch(() => [])

    return projects || []
  }

  /**
   * Calculate SOP adherence score
   */
  private calculateSOPAdherence(tasks: any[]): number {
    if (tasks.length === 0) return 0

    // Check if tasks have required SOP steps completed
    // In a real system, this would check SOPCompletion records
    const tasksWithSOP = tasks.filter((task) => {
      // Placeholder: assume 80% of tasks have SOP compliance
      return Math.random() > 0.2
    })

    return Math.round((tasksWithSOP.length / tasks.length) * 100)
  }

  /**
   * Calculate timeline accuracy
   */
  private calculateTimelineAccuracy(projects: any[]): number {
    if (projects.length === 0) return 0

    let onTimeCount = 0

    for (const project of projects) {
      if (project.endDate && project.startDate) {
        const plannedDuration = new Date(project.endDate).getTime() - new Date(project.startDate).getTime()
        const actualDuration = Date.now() - new Date(project.startDate).getTime()

        // If project is completed, use actual end date
        if (project.status === 'COMPLETED' && project.endDate) {
          const actualEnd = new Date(project.endDate).getTime()
          const actualDuration = actualEnd - new Date(project.startDate).getTime()
          const variance = Math.abs(actualDuration - plannedDuration) / plannedDuration

          // Within 10% variance is considered on-time
          if (variance <= 0.1) {
            onTimeCount++
          }
        } else {
          // For active projects, check if we're on track
          const progress = actualDuration / plannedDuration
          if (progress <= 1.1) {
            // Within 10% of planned timeline
            onTimeCount++
          }
        }
      }
    }

    return Math.round((onTimeCount / projects.length) * 100)
  }

  /**
   * Calculate budget compliance
   */
  private calculateBudgetCompliance(projects: any[]): number {
    if (projects.length === 0) return 0

    let withinBudgetCount = 0

    for (const project of projects) {
      if (project.budget) {
        // Calculate total spent from contracts
        const totalSpent = project.contracts?.reduce((sum: number, contract: any) => {
          return sum + Number(contract.amount || 0)
        }, 0) || 0

        const budget = Number(project.budget)
        const variance = Math.abs(totalSpent - budget) / budget

        // Within 5% variance is considered within budget
        if (variance <= 0.05 || totalSpent <= budget) {
          withinBudgetCount++
        }
      }
    }

    return Math.round((withinBudgetCount / projects.length) * 100)
  }

  /**
   * Calculate stakeholder satisfaction
   */
  private calculateStakeholderSatisfaction(projects: any[]): number {
    if (projects.length === 0) return 0

    // In a real system, this would query satisfaction surveys or ratings
    // For now, use a placeholder based on project status
    const activeProjects = projects.filter((p) => p.status !== 'CANCELLED' && p.status !== 'COMPLETED')
    const completionRate = projects.filter((p) => p.status === 'COMPLETED').length / projects.length

    // Higher completion rate and more active projects = higher satisfaction
    return Math.round((completionRate * 0.6 + (activeProjects.length / projects.length) * 0.4) * 100)
  }

  /**
   * Calculate gate compliance
   */
  private calculateGateCompliance(tasks: any[]): number {
    if (tasks.length === 0) return 0

    // Check if tasks passed required gates before completion
    // In a real system, this would check WorkflowGate records
    const tasksWithGates = tasks.filter((task) => {
      // Placeholder: assume 85% of tasks have gate compliance
      return Math.random() > 0.15
    })

    return Math.round((tasksWithGates.length / tasks.length) * 100)
  }

  /**
   * Calculate efficiency
   */
  private calculateEfficiency(tasks: any[]): number {
    if (tasks.length === 0) return 0

    // Calculate average time to complete tasks
    // In a real system, this would use actual time tracking
    const avgCompletionTime = tasks.reduce((sum, task) => {
      if (task.completedAt && task.createdAt) {
        const duration = new Date(task.completedAt).getTime() - new Date(task.createdAt).getTime()
        return sum + duration
      }
      return sum
    }, 0) / tasks.length

    // Normalize to 0-100 (shorter time = higher efficiency)
    // Assume ideal completion time is 2 days
    const idealTime = 2 * 24 * 60 * 60 * 1000
    const efficiency = Math.max(0, 100 - ((avgCompletionTime - idealTime) / idealTime) * 100)

    return Math.round(Math.min(100, Math.max(0, efficiency)))
  }

  /**
   * Calculate quality score
   */
  private calculateQualityScore(projects: any[]): number {
    if (projects.length === 0) return 0

    // Quality based on:
    // - Low number of disputes/issues
    // - High completion rate
    // - Good readiness item completion

    const completedProjects = projects.filter((p) => p.status === 'COMPLETED').length
    const completionRate = completedProjects / projects.length

    // Check readiness item completion
    const readinessCompletion = projects.reduce((sum, project) => {
      const items = project.readinessItems || []
      const completed = items.filter((item: any) => item.completed).length
      return sum + (items.length > 0 ? completed / items.length : 1)
    }, 0) / projects.length

    return Math.round((completionRate * 0.6 + readinessCompletion * 0.4) * 100)
  }

  /**
   * Calculate integration usage score
   */
  private async calculateIntegrationUsageScore(pmId: string): Promise<number> {
    const integrationMetrics = await this.calculateIntegrationUsage(pmId)

    // Average all module usage scores
    const avgUsage =
      (integrationMetrics.permitsModule.usage +
        integrationMetrics.escrowModule.usage +
        integrationMetrics.marketplaceModule.usage +
        integrationMetrics.architectModule.usage) /
      4

    return Math.round(avgUsage)
  }

  /**
   * Calculate integration usage metrics
   */
  async calculateIntegrationUsage(pmId: string): Promise<IntegrationMetrics> {
    return {
      permitsModule: {
        usage: await this.getPermitModuleUsage(pmId),
        efficiency: await this.calculatePermitEfficiency(pmId),
        compliance: await this.checkPermitCompliance(pmId),
      },
      escrowModule: {
        usage: await this.getEscrowModuleUsage(pmId),
        timeliness: await this.calculateEscrowTimeliness(pmId),
        accuracy: await this.calculateEscrowAccuracy(pmId),
      },
      marketplaceModule: {
        usage: await this.getMarketplaceModuleUsage(pmId),
        contractorQuality: await this.calculateContractorQuality(pmId),
        responseTime: await this.calculateMarketplaceResponseTime(pmId),
      },
      architectModule: {
        usage: await this.getArchitectModuleUsage(pmId),
        deliverableQuality: await this.calculateDeliverableQuality(pmId),
        onTimeDelivery: await this.calculateOnTimeDelivery(pmId),
      },
    }
  }

  /**
   * Get permit module usage
   */
  private async getPermitModuleUsage(pmId: string): Promise<number> {
    const projects = await this.getManagedProjects(pmId)
    const permits = await prisma.permitApplication?.findMany({
      where: {
        projectId: {
          in: projects.map((p) => p.id),
        },
      },
    }).catch(() => [])

    // Usage = percentage of projects with permits
    return projects.length > 0 ? Math.round((permits?.length || 0) / projects.length * 100) : 0
  }

  /**
   * Calculate permit efficiency
   */
  private async calculatePermitEfficiency(pmId: string): Promise<number> {
    const projects = await this.getManagedProjects(pmId)
    const permits = await prisma.permitApplication?.findMany({
      where: {
        projectId: {
          in: projects.map((p) => p.id),
        },
        status: {
          in: ['APPROVED', 'ISSUED'],
        },
      },
    }).catch(() => [])

    const allPermits = await prisma.permitApplication?.findMany({
      where: {
        projectId: {
          in: projects.map((p) => p.id),
        },
      },
    }).catch(() => [])

    // Efficiency = percentage of permits approved
    return allPermits && allPermits.length > 0
      ? Math.round(((permits?.length || 0) / allPermits.length) * 100)
      : 0
  }

  /**
   * Check permit compliance
   */
  private async checkPermitCompliance(pmId: string): Promise<number> {
    const projects = await this.getManagedProjects(pmId)
    const permits = await prisma.permitApplication?.findMany({
      where: {
        projectId: {
          in: projects.map((p) => p.id),
        },
        status: {
          notIn: ['REJECTED', 'CANCELLED'],
        },
      },
    }).catch(() => [])

    // Compliance = percentage of permits not rejected
    return permits && permits.length > 0 ? 85 : 0 // Placeholder
  }

  /**
   * Get escrow module usage
   */
  private async getEscrowModuleUsage(pmId: string): Promise<number> {
    const projects = await this.getManagedProjects(pmId)
    const escrows = await (prisma as any).escrowAccount?.findMany({
      where: {
        projectId: {
          in: projects.map((p) => p.id),
        },
      },
    }).catch(() => [])

    return projects.length > 0 ? Math.round(((escrows?.length || 0) / projects.length) * 100) : 0
  }

  /**
   * Calculate escrow timeliness
   */
  private async calculateEscrowTimeliness(pmId: string): Promise<number> {
    // Check if escrow releases are on time
    // Placeholder: assume 90% timeliness
    return 90
  }

  /**
   * Calculate escrow accuracy
   */
  private async calculateEscrowAccuracy(pmId: string): Promise<number> {
    // Check if escrow amounts match contracts
    // Placeholder: assume 95% accuracy
    return 95
  }

  /**
   * Get marketplace module usage
   */
  private async getMarketplaceModuleUsage(pmId: string): Promise<number> {
    const projects = await this.getManagedProjects(pmId)
    const contracts = await prisma.contractAgreement?.findMany({
      where: {
        projectId: {
          in: projects.map((p) => p.id),
        },
      },
    }).catch(() => [])

    return projects.length > 0 ? Math.round(((contracts?.length || 0) / projects.length) * 100) : 0
  }

  /**
   * Calculate contractor quality
   */
  private async calculateContractorQuality(pmId: string): Promise<number> {
    // Based on contractor ratings and performance
    // Placeholder: assume 85% quality
    return 85
  }

  /**
   * Calculate marketplace response time
   */
  private async calculateMarketplaceResponseTime(pmId: string): Promise<number> {
    // Average response time to contractor quotes
    // Placeholder: assume 80% (good response time)
    return 80
  }

  /**
   * Get architect module usage
   */
  private async getArchitectModuleUsage(pmId: string): Promise<number> {
    // Check if projects use architect services
    // Placeholder: assume 60% usage
    return 60
  }

  /**
   * Calculate deliverable quality
   */
  private async calculateDeliverableQuality(pmId: string): Promise<number> {
    // Based on deliverable approval rates
    // Placeholder: assume 88% quality
    return 88
  }

  /**
   * Calculate on-time delivery
   */
  private async calculateOnTimeDelivery(pmId: string): Promise<number> {
    // Percentage of deliverables delivered on time
    // Placeholder: assume 82% on-time
    return 82
  }

  /**
   * Get team rank
   */
  private async getTeamRank(pmId: string, score: number): Promise<number> {
    // Get all PMs and their scores
    const allPMs = await prisma.user?.findMany({
      where: {
        // Filter for PMs (would need role check)
      },
      take: 100,
    }).catch(() => [])

    // Calculate scores for all PMs (simplified - in production would cache)
    const pmScores = await Promise.all(
      (allPMs || []).slice(0, 10).map(async (pm) => {
        const pmScore = await this.calculateProductivityScore(pm.id, 'weekly')
        return { pmId: pm.id, score: pmScore.overallScore }
      })
    )

    // Sort by score descending
    pmScores.sort((a, b) => b.score - a.score)

    // Find rank
    const rank = pmScores.findIndex((p) => p.pmId === pmId) + 1

    return rank || 1
  }

  /**
   * Get improvement trend
   */
  private async getImprovementTrend(pmId: string, period: Period): Promise<number> {
    // Compare current period with previous period
    const currentScore = await this.calculateProductivityScore(pmId, period)

    // Get previous period
    let previousPeriod: Period
    switch (period) {
      case 'daily':
        previousPeriod = 'daily' // Compare with yesterday
        break
      case 'weekly':
        previousPeriod = 'weekly' // Compare with last week
        break
      case 'monthly':
        previousPeriod = 'monthly' // Compare with last month
        break
    }

    // In a real system, would fetch historical scores
    // For now, return placeholder
    return 5.2 // 5.2% improvement
  }

  /**
   * Identify strengths
   */
  private async identifyStrengths(
    pmId: string,
    metrics: {
      sopAdherence: number
      timelineAccuracy: number
      budgetCompliance: number
      efficiency: number
      quality: number
    }
  ): Promise<string[]> {
    const strengths: string[] = []

    if (metrics.sopAdherence >= 85) {
      strengths.push('Excellent SOP adherence')
    }
    if (metrics.timelineAccuracy >= 85) {
      strengths.push('Strong timeline management')
    }
    if (metrics.budgetCompliance >= 90) {
      strengths.push('Outstanding budget control')
    }
    if (metrics.efficiency >= 80) {
      strengths.push('High task efficiency')
    }
    if (metrics.quality >= 85) {
      strengths.push('Consistent quality delivery')
    }

    return strengths.length > 0 ? strengths : ['Continuing to develop skills']
  }

  /**
   * Identify improvement areas
   */
  private async identifyImprovementAreas(
    pmId: string,
    metrics: {
      sopAdherence: number
      timelineAccuracy: number
      budgetCompliance: number
      efficiency: number
      quality: number
    }
  ): Promise<string[]> {
    const areas: string[] = []

    if (metrics.sopAdherence < 75) {
      areas.push('Improve SOP compliance and documentation')
    }
    if (metrics.timelineAccuracy < 75) {
      areas.push('Better timeline estimation and tracking')
    }
    if (metrics.budgetCompliance < 80) {
      areas.push('Enhance budget monitoring and control')
    }
    if (metrics.efficiency < 70) {
      areas.push('Optimize task completion workflows')
    }
    if (metrics.quality < 75) {
      areas.push('Focus on quality assurance processes')
    }

    return areas.length > 0 ? areas : ['Maintain current performance levels']
  }
}

// Export singleton instance
export const pmScoringSystem = new PMScoringSystem()

