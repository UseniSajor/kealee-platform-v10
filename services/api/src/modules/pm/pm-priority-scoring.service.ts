import { prismaAny } from '../../utils/prisma-helper'

interface TaskPriorityFactors {
  dueDate?: Date | null
  source: 'GC' | 'Homeowner' | 'Permit' | 'Escrow'
  estimatedEffort: number
  complianceBlockers?: number
  overdueDays?: number
  projectValue?: number
  clientTier?: 'A' | 'B' | 'C' | 'D'
}

/**
 * Automated priority scoring algorithm
 * Calculates priority score (0-100) based on multiple factors
 */
export const pmPriorityScoringService = {
  /**
   * Calculate priority score for a task
   * Higher score = higher priority
   */
  calculatePriorityScore(factors: TaskPriorityFactors): {
    score: number
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
    reasons: string[]
  } {
    let score = 0
    const reasons: string[] = []

    // Factor 1: Due date urgency (0-40 points)
    if (factors.dueDate) {
      const now = new Date()
      const due = new Date(factors.dueDate)
      const hoursUntilDue = (due.getTime() - now.getTime()) / (1000 * 60 * 60)

      if (hoursUntilDue < 0) {
        // Overdue
        const overdueHours = Math.abs(hoursUntilDue)
        score += Math.min(40, 20 + overdueHours * 2) // Max 40 points for overdue
        reasons.push(`Overdue by ${Math.round(overdueHours)} hours`)
      } else if (hoursUntilDue < 24) {
        // Due within 24 hours
        score += 35
        reasons.push('Due within 24 hours')
      } else if (hoursUntilDue < 48) {
        // Due within 48 hours
        score += 25
        reasons.push('Due within 48 hours')
      } else if (hoursUntilDue < 168) {
        // Due within 1 week
        score += 15
        reasons.push('Due within 1 week')
      }
    }

    // Factor 2: Source importance (0-20 points)
    const sourceWeights: Record<TaskPriorityFactors['source'], number> = {
      GC: 20, // GC projects are highest value
      Escrow: 15, // Escrow releases are time-sensitive
      Permit: 12, // Permits block construction
      Homeowner: 8, // Homeowner projects are important but less urgent
    }
    score += sourceWeights[factors.source] || 0
    reasons.push(`${factors.source} source (${sourceWeights[factors.source]} points)`)

    // Factor 3: Compliance blockers (0-20 points)
    if (factors.complianceBlockers && factors.complianceBlockers > 0) {
      score += Math.min(20, factors.complianceBlockers * 5)
      reasons.push(`${factors.complianceBlockers} compliance blocker(s)`)
    }

    // Factor 4: Client tier (0-10 points)
    const tierWeights: Record<string, number> = {
      A: 10,
      B: 7,
      C: 4,
      D: 2,
    }
    if (factors.clientTier) {
      score += tierWeights[factors.clientTier] || 0
      reasons.push(`Tier ${factors.clientTier} client`)
    }

    // Factor 5: Project value (0-10 points)
    if (factors.projectValue) {
      if (factors.projectValue > 500000) {
        score += 10
        reasons.push('High-value project (>$500k)')
      } else if (factors.projectValue > 200000) {
        score += 7
        reasons.push('Medium-value project (>$200k)')
      } else if (factors.projectValue > 50000) {
        score += 4
        reasons.push('Standard project (>$50k)')
      }
    }

    // Normalize score to 0-100
    score = Math.min(100, Math.max(0, score))

    // Determine priority level
    let priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
    if (score >= 70) {
      priority = 'CRITICAL'
    } else if (score >= 50) {
      priority = 'HIGH'
    } else if (score >= 30) {
      priority = 'MEDIUM'
    } else {
      priority = 'LOW'
    }

    return { score, priority, reasons }
  },

  /**
   * Recalculate priorities for all tasks and update queue
   */
  async recalculateTaskPriorities(userId: string) {
    // Get all active tasks for the user
    const tasks = await prismaAny.task.findMany({
      where: {
        assignedTo: userId,
        status: { in: ['pending', 'in_progress'] },
      },
      include: {
        project: {
          include: {
            client: true,
          },
        },
      },
    })

    // Calculate priority for each task
    const prioritizedTasks = tasks.map((task: any) => {
      const factors: TaskPriorityFactors = {
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        source: 'Homeowner', // Default, would need to determine from task metadata
        estimatedEffort: task.estimatedTime || 30,
        clientTier: (task.project?.client as any)?.packageTier,
        projectValue: task.project?.budget,
      }

      const result = this.calculatePriorityScore(factors)
      return {
        taskId: task.id,
        ...result,
      }
    })

    // Sort by priority score (highest first)
    prioritizedTasks.sort((a: any, b: any) => b.score - a.score)

    return prioritizedTasks
  },
}


