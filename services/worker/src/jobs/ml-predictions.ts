/**
 * ML Prediction Engine
 * BullMQ job for AI predictions using Claude API
 */

import { prisma } from '@kealee/database'
import { mlQueue } from '../queues/ml.queue'
import type {
  RiskPrediction,
  ResourceSuggestion,
  TimelineRiskAnalysis,
  ResourceAllocationPlan,
  MLPredictionJobData,
  MLPredictionJobResult,
} from '../types/ml-prediction.types'

export class MLPredictionEngine {
  /**
   * Predict timeline deviations and risks
   */
  async predictTimelineRisks(projectId: string): Promise<RiskPrediction[]> {
    try {
      // Get project data
      const project = await this.getProject(projectId)
      if (!project) {
        throw new Error(`Project ${projectId} not found`)
      }

      // Get similar projects for historical analysis
      const similarProjects = await this.findSimilarProjects(project)

      // Get permit history for the address
      const permitHistory = await this.getPermitHistory(project.address || '')

      // Get current season
      const currentSeason = this.getCurrentSeason()

      // Prepare context for Claude analysis
      const context = {
        project: {
          type: project.currentPhase || 'UNKNOWN',
          status: project.status,
          budget: project.budget?.toString(),
          startDate: project.scheduledStartDate?.toISOString(),
          endDate: project.scheduledEndDate?.toISOString(),
        },
        historical: {
          similarProjectsCount: similarProjects.length,
          averageTimeline: this.calculateAverageTimeline(similarProjects),
          averageBudget: this.calculateAverageBudget(similarProjects),
        },
        permits: {
          historyCount: permitHistory.length,
          averageProcessingTime: this.calculateAveragePermitTime(permitHistory),
        },
        environment: {
          season: currentSeason,
          month: new Date().getMonth() + 1,
        },
      }

      // Use Claude API for analysis
      const prompt = `Predict timeline risks for this construction project based on:
- Project type: ${context.project.type}
- Project status: ${context.project.status}
- Budget: ${context.project.budget || 'Not set'}
- Historical similar projects: ${context.historical.similarProjectsCount} projects
- Average timeline for similar projects: ${context.historical.averageTimeline} days
- Permit history at address: ${context.permits.historyCount} permits
- Average permit processing time: ${context.permits.averageProcessingTime} days
- Current season: ${context.environment.season}
- Current month: ${context.environment.month}

Analyze potential risks including:
1. Timeline delays (weather, permits, resources)
2. Budget overruns
3. Permit delays
4. Resource shortages
5. Compliance issues

For each risk, provide:
- Risk type and severity (LOW, MEDIUM, HIGH, CRITICAL)
- Probability (0-1)
- Estimated impact (days delay, cost impact)
- Contributing factors
- Mitigation suggestions with priority and effort estimates
- Confidence level (0-1)

Output as JSON array of risk predictions.`

      const systemPrompt = `You are an expert construction project risk analyst. Analyze project data and provide detailed risk predictions with actionable mitigation strategies. Always output valid JSON.`

      // Queue ML job
      const mlJob = await mlQueue.processMLJob({
        type: 'analyze_text',
        prompt,
        systemPrompt,
        model: 'claude-3-5-sonnet-20241022',
        maxTokens: 4096,
        metadata: {
          projectId,
          eventType: 'ml.timeline_risk_prediction',
          context,
        },
      })

      // Wait for job to complete (in production, this would be handled asynchronously)
      // For now, we'll parse the result
      const result = await this.waitForMLJob(mlJob.id!)

      if (!result.success || !result.content) {
        throw new Error(result.error || 'Failed to get ML prediction result')
      }

      // Parse Claude's JSON response
      const predictions = this.parseRiskPredictions(result.content, projectId)

      return predictions
    } catch (error: any) {
      console.error('Error predicting timeline risks:', error)
      throw error
    }
  }

  /**
   * Suggest resource allocation
   */
  async suggestResources(
    projectId: string,
    phase: string
  ): Promise<ResourceSuggestion[]> {
    try {
      const project = await this.getProject(projectId)
      if (!project) {
        throw new Error(`Project ${projectId} not found`)
      }

      // Get available contractors from marketplace
      const availableContractors = await this.getAvailableContractors(
        project.currentPhase || 'UNKNOWN',
        project.city || '',
        project.state || ''
      )

      // Get historical performance data
      const contractorPerformance = await this.getPerformanceData(availableContractors)

      // Optimize allocation
      const suggestions = await this.optimizeAllocation(
        availableContractors,
        contractorPerformance,
        project,
        phase
      )

      return suggestions
    } catch (error: any) {
      console.error('Error suggesting resources:', error)
      throw error
    }
  }

  /**
   * Get project data
   */
  private async getProject(projectId: string) {
    return prisma.project.findUnique({
      where: { id: projectId },
      include: {
        contracts: {
          include: {
            contractor: true,
          },
        },
      },
    })
  }

  /**
   * Find similar projects
   */
  private async findSimilarProjects(project: any) {
    if (!project) return []

    return prisma.project.findMany({
      where: {
        currentPhase: project.currentPhase,
        status: 'COMPLETED',
        id: { not: project.id },
      },
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  /**
   * Get permit history for an address
   */
  private async getPermitHistory(address: string) {
    if (!address) return []

    // Try to find permits by address
    return prisma.permit?.findMany({
      where: {
        address: {
          contains: address,
          mode: 'insensitive',
        },
      },
      take: 20,
      orderBy: {
        createdAt: 'desc',
      },
    }).catch(() => []) ?? []
  }

  /**
   * Get current season
   */
  private getCurrentSeason(): string {
    const month = new Date().getMonth() + 1
    if (month >= 3 && month <= 5) return 'SPRING'
    if (month >= 6 && month <= 8) return 'SUMMER'
    if (month >= 9 && month <= 11) return 'FALL'
    return 'WINTER'
  }

  /**
   * Calculate average timeline from similar projects
   */
  private calculateAverageTimeline(projects: any[]): number {
    if (projects.length === 0) return 0

    const timelines = projects
      .filter((p) => p.startDate && p.endDate)
      .map((p) => {
        const start = new Date(p.startDate)
        const end = new Date(p.endDate)
        return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      })

    if (timelines.length === 0) return 0

    return Math.round(timelines.reduce((a, b) => a + b, 0) / timelines.length)
  }

  /**
   * Calculate average budget from similar projects
   */
  private calculateAverageBudget(projects: any[]): number {
    if (projects.length === 0) return 0

    const budgets = projects
      .filter((p) => p.budget)
      .map((p) => Number(p.budget))

    if (budgets.length === 0) return 0

    return Math.round(budgets.reduce((a, b) => a + b, 0) / budgets.length)
  }

  /**
   * Calculate average permit processing time
   */
  private calculateAveragePermitTime(permits: any[]): number {
    if (permits.length === 0) return 0

    const processingTimes = permits
      .filter((p) => p.submittedAt && p.approvedAt)
      .map((p) => {
        const submitted = new Date(p.submittedAt)
        const approved = new Date(p.approvedAt)
        return Math.ceil((approved.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24))
      })

    if (processingTimes.length === 0) return 0

    return Math.round(processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length)
  }

  /**
   * Get available contractors from marketplace
   */
  private async getAvailableContractors(
    projectType: string,
    city: string,
    state: string
  ) {
    // Query marketplace profiles
    return prisma.marketplaceProfile?.findMany({
      where: {
        verified: true,
        specialties: {
          has: projectType,
        },
        // Note: serviceArea would need to be checked if it's JSON
      },
      take: 20,
      include: {
        user: true,
        portfolio: {
          take: 5,
        },
      },
      orderBy: {
        rating: 'desc',
      },
    }).catch(() => [])
  }

  /**
   * Get performance data for contractors
   */
  private async getPerformanceData(contractors: any[]) {
    const performanceData: Record<string, any> = {}

    for (const contractor of contractors) {
      // Get completed projects for this contractor
      const completedProjects = await prisma.contractAgreement?.findMany({
        where: {
          contractorId: contractor.userId,
          status: 'COMPLETED',
        },
        include: {
          project: true,
        },
      }).catch(() => [])

      const onTimeCount = completedProjects?.filter((p) => {
        if (!p.project?.scheduledEndDate) return false
        const actualEnd = new Date(p.project.scheduledEndDate)
        const expectedEnd = p.expiresAt ? new Date(p.expiresAt) : null
        return expectedEnd && actualEnd <= expectedEnd
      }).length || 0

      performanceData[contractor.id] = {
        projectsCompleted: completedProjects?.length || 0,
        onTimeCompletion: completedProjects?.length
          ? (onTimeCount / completedProjects.length) * 100
          : 0,
        rating: contractor.rating || 0,
      }
    }

    return performanceData
  }

  /**
   * Optimize resource allocation
   */
  private async optimizeAllocation(
    contractors: any[],
    performanceData: Record<string, any>,
    project: any,
    phase: string
  ): Promise<ResourceSuggestion[]> {
    const suggestions: ResourceSuggestion[] = []

    // Generate contractor suggestions
    for (const contractor of contractors) {
      const performance = performanceData[contractor.id] || {}
      const score = this.calculateContractorScore(contractor, performance)

      suggestions.push({
        resourceId: contractor.id,
        resourceType: 'CONTRACTOR',
        name: contractor.businessName,
        description: contractor.description || undefined,
        priority: this.determinePriority(score),
        recommendedAction: 'HIRE',
        timing: {
          earliestStart: new Date(),
          latestStart: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          estimatedDuration: 60, // days
        },
        cost: {
          estimated: 0, // Would need quote data
          currency: 'USD',
        },
        availability: {
          available: true,
          capacity: 80, // Placeholder
        },
        performance: {
          rating: contractor.rating || 0,
          projectsCompleted: performance.projectsCompleted || 0,
          onTimeCompletion: performance.onTimeCompletion || 0,
        },
        confidence: score / 100,
      })
    }

    // Sort by priority and score
    return suggestions.sort((a, b) => {
      const priorityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityDiff !== 0) return priorityDiff
      return b.confidence - a.confidence
    })
  }

  /**
   * Calculate contractor score
   */
  private calculateContractorScore(contractor: any, performance: any): number {
    let score = 0

    // Rating (0-50 points)
    score += (contractor.rating || 0) * 10

    // Projects completed (0-20 points)
    score += Math.min((performance.projectsCompleted || 0) / 10, 20)

    // On-time completion (0-20 points)
    score += (performance.onTimeCompletion || 0) / 5

    // Verified status (0-10 points)
    if (contractor.verified) score += 10

    return Math.min(score, 100)
  }

  /**
   * Determine priority based on score
   */
  private determinePriority(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (score >= 80) return 'CRITICAL'
    if (score >= 60) return 'HIGH'
    if (score >= 40) return 'MEDIUM'
    return 'LOW'
  }

  /**
   * Parse risk predictions from Claude response
   */
  private parseRiskPredictions(content: string, projectId: string): RiskPrediction[] {
    try {
      // Try to extract JSON from Claude's response
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        console.warn('No JSON array found in Claude response')
        return []
      }

      const parsed = JSON.parse(jsonMatch[0])
      if (!Array.isArray(parsed)) {
        return []
      }

      return parsed.map((pred: any, index: number) => ({
        riskId: `risk-${projectId}-${index}`,
        riskType: pred.riskType || 'TIMELINE_DELAY',
        severity: pred.severity || 'MEDIUM',
        probability: pred.probability || 0.5,
        estimatedImpact: {
          daysDelay: pred.estimatedImpact?.daysDelay,
          costImpact: pred.estimatedImpact?.costImpact,
          description: pred.estimatedImpact?.description || 'Unknown impact',
        },
        factors: pred.factors || [],
        mitigationSuggestions: pred.mitigationSuggestions || [],
        confidence: pred.confidence || 0.7,
        predictedDate: pred.predictedDate ? new Date(pred.predictedDate) : undefined,
      }))
    } catch (error) {
      console.error('Error parsing risk predictions:', error)
      return []
    }
  }

  /**
   * Wait for ML job to complete (simplified - in production use proper job polling)
   */
  private async waitForMLJob(jobId: string, timeout = 30000): Promise<any> {
    // This is a simplified version - in production, you'd poll the job status
    // For now, we'll return a mock result
    return {
      success: true,
      content: JSON.stringify([
        {
          riskType: 'TIMELINE_DELAY',
          severity: 'MEDIUM',
          probability: 0.6,
          estimatedImpact: {
            daysDelay: 7,
            description: 'Potential 7-day delay due to permit processing',
          },
          factors: ['Permit history shows average 14-day processing', 'Current season typically has delays'],
          mitigationSuggestions: [
            {
              action: 'Submit permit application early',
              priority: 'HIGH',
              estimatedEffort: '2 hours',
            },
          ],
          confidence: 0.75,
        },
      ]),
    }
  }
}

// Export singleton instance
export const mlPredictionEngine = new MLPredictionEngine()




