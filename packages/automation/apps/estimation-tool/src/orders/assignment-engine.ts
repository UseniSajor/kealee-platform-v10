/**
 * Assignment Engine
 * Intelligent work order assignment
 *
 * Note: This module uses the Estimate model with metadata to store order information,
 * and User model with metadata to store estimator information since dedicated models
 * (EstimationOrder, Estimator) do not exist in the schema.
 */

import { PrismaClient, Estimate, User } from '@prisma/client';
import { randomUUID as uuid } from 'crypto';
import { EstimationOrder, OrderType, OrderPriority } from './order-manager.js';

const prisma = new PrismaClient();

export interface Estimator {
  id: string;
  name: string;
  email: string;
  skills: EstimatorSkill[];
  capacity: EstimatorCapacity;
  preferences: EstimatorPreferences;
  performance: EstimatorPerformance;
  isActive: boolean;
}

export interface EstimatorSkill {
  category: string;
  proficiency: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  yearsExperience: number;
}

export interface EstimatorCapacity {
  maxHoursPerWeek: number;
  currentHours: number;
  availableHours: number;
  pendingOrders: number;
}

export interface EstimatorPreferences {
  preferredTypes?: OrderType[];
  preferredCategories?: string[];
  maxOrdersAtOnce?: number;
}

export interface EstimatorPerformance {
  completedOrders: number;
  averageAccuracy: number;
  averageCompletionTime: number;
  onTimeRate: number;
  lastAssignment?: Date;
}

export interface AssignmentResult {
  success: boolean;
  orderId: string;
  assignedTo?: string;
  assignedTeam?: string;
  reason: string;
  alternatives?: {
    estimatorId: string;
    score: number;
    reason: string;
  }[];
}

export interface AssignmentCriteria {
  prioritizeExperience?: boolean;
  prioritizeAvailability?: boolean;
  prioritizePerformance?: boolean;
  requiredSkills?: string[];
  preferredEstimators?: string[];
  excludeEstimators?: string[];
}

/**
 * Metadata structure stored in User.metadata for estimator info
 */
interface EstimatorMetadata {
  isEstimator?: boolean;
  skills?: EstimatorSkill[];
  capacity?: EstimatorCapacity;
  preferences?: EstimatorPreferences;
  performance?: EstimatorPerformance;
}

/**
 * Metadata structure stored in Estimate.metadata for order info
 */
interface OrderMetadata {
  orderInfo?: {
    type: OrderType;
    priority: OrderPriority;
    assignedTo?: string;
    assignedTeam?: string;
    dueDate?: string;
    estimatedHours?: number;
    actualHours?: number;
    notes?: string[];
    deliverables?: unknown[];
    scope?: {
      divisions?: string[];
      complexity?: string;
    };
  };
}

export class AssignmentEngine {
  /**
   * Auto-assign order to best available estimator
   */
  async autoAssign(
    order: EstimationOrder,
    criteria?: AssignmentCriteria
  ): Promise<AssignmentResult> {
    // Get available estimators
    const estimators = await this.getAvailableEstimators(
      order.organizationId,
      criteria
    );

    if (estimators.length === 0) {
      return {
        success: false,
        orderId: order.id,
        reason: 'No available estimators found',
        alternatives: [],
      };
    }

    // Score each estimator
    const scoredEstimators = estimators.map((estimator: Estimator) => ({
      estimator,
      score: this.calculateAssignmentScore(estimator, order, criteria),
    }));

    // Sort by score (highest first)
    scoredEstimators.sort((a: { estimator: Estimator; score: number }, b: { estimator: Estimator; score: number }) => b.score - a.score);

    const bestMatch = scoredEstimators[0];

    // Update the estimate's metadata with assignment info
    // Since EstimationOrder doesn't exist, we use Estimate with metadata
    const estimate = await prisma.estimate.findUnique({
      where: { id: order.id },
    });

    if (estimate) {
      const currentMetadata = (estimate.metadata as OrderMetadata) || {};
      const updatedMetadata: OrderMetadata = {
        ...currentMetadata,
        orderInfo: {
          ...currentMetadata.orderInfo,
          type: order.type,
          priority: order.priority,
          assignedTo: bestMatch.estimator.id,
          notes: [
            ...(currentMetadata.orderInfo?.notes || []),
            `Auto-assigned to ${bestMatch.estimator.name} (score: ${bestMatch.score.toFixed(2)})`,
          ],
        },
      };

      await prisma.estimate.update({
        where: { id: order.id },
        data: {
          preparedById: bestMatch.estimator.id,
          status: 'IN_PROGRESS_ESTIMATE',
          metadata: updatedMetadata as object,
        },
      });
    }

    // Update estimator capacity
    await this.updateEstimatorCapacity(bestMatch.estimator.id, order.estimatedHours || 0);

    return {
      success: true,
      orderId: order.id,
      assignedTo: bestMatch.estimator.id,
      reason: `Assigned to ${bestMatch.estimator.name} - best match based on skills and availability`,
      alternatives: scoredEstimators.slice(1, 4).map((s: { estimator: Estimator; score: number }) => ({
        estimatorId: s.estimator.id,
        score: s.score,
        reason: this.getAssignmentReason(s.estimator, order),
      })),
    };
  }

  /**
   * Suggest assignments for multiple orders
   */
  async suggestAssignments(
    orderIds: string[],
    organizationId: string
  ): Promise<{
    suggestions: {
      orderId: string;
      orderTitle: string;
      suggestedEstimator: string;
      estimatorName: string;
      score: number;
      reason: string;
    }[];
    unassignable: { orderId: string; reason: string }[];
  }> {
    // Fetch estimates that represent orders
    const estimates = await prisma.estimate.findMany({
      where: { id: { in: orderIds } },
    });

    const estimators = await this.getAvailableEstimators(organizationId);

    const suggestions: {
      orderId: string;
      orderTitle: string;
      suggestedEstimator: string;
      estimatorName: string;
      score: number;
      reason: string;
    }[] = [];

    const unassignable: { orderId: string; reason: string }[] = [];

    // Track assignments to balance load
    const assignmentCount = new Map<string, number>();

    for (const estimate of estimates) {
      // Convert estimate to order-like structure
      const orderFromEstimate = this.estimateToOrder(estimate);

      // Find best available estimator
      let bestMatch: { estimator: Estimator; score: number } | null = null;

      for (const estimator of estimators) {
        // Skip if estimator has too many pending
        const currentAssignments = assignmentCount.get(estimator.id) || 0;
        if (currentAssignments >= (estimator.preferences.maxOrdersAtOnce || 5)) {
          continue;
        }

        const score = this.calculateAssignmentScore(
          estimator,
          orderFromEstimate,
          undefined
        );

        // Reduce score based on pending assignments
        const adjustedScore = score - currentAssignments * 0.1;

        if (!bestMatch || adjustedScore > bestMatch.score) {
          bestMatch = { estimator, score: adjustedScore };
        }
      }

      if (bestMatch) {
        suggestions.push({
          orderId: estimate.id,
          orderTitle: estimate.name,
          suggestedEstimator: bestMatch.estimator.id,
          estimatorName: bestMatch.estimator.name,
          score: bestMatch.score,
          reason: this.getAssignmentReason(
            bestMatch.estimator,
            orderFromEstimate
          ),
        });

        // Track assignment
        assignmentCount.set(
          bestMatch.estimator.id,
          (assignmentCount.get(bestMatch.estimator.id) || 0) + 1
        );
      } else {
        unassignable.push({
          orderId: estimate.id,
          reason: 'No available estimators with capacity',
        });
      }
    }

    return { suggestions, unassignable };
  }

  /**
   * Rebalance assignments
   */
  async rebalanceAssignments(organizationId: string): Promise<{
    rebalanced: number;
    moves: { orderId: string; from: string; to: string; reason: string }[];
  }> {
    // Get current assignments (estimates with preparedById set and in progress)
    const assignedEstimates = await prisma.estimate.findMany({
      where: {
        organizationId,
        status: 'IN_PROGRESS_ESTIMATE',
        preparedById: { not: null },
      },
    });

    const estimators = await this.getAvailableEstimators(organizationId);

    // Calculate current load per estimator
    const loadMap = new Map<string, number>();
    for (const estimate of assignedEstimates) {
      if (estimate.preparedById) {
        const metadata = estimate.metadata as OrderMetadata;
        const hours = metadata?.orderInfo?.estimatedHours || 0;
        loadMap.set(
          estimate.preparedById,
          (loadMap.get(estimate.preparedById) || 0) + hours
        );
      }
    }

    // Find overloaded and underloaded estimators
    const loadValues = Array.from(loadMap.values());
    const avgLoad = loadValues.reduce((sum: number, l: number) => sum + l, 0) /
      (loadMap.size || 1);

    const overloaded = estimators.filter((e: Estimator) => (loadMap.get(e.id) || 0) > avgLoad * 1.3);
    const underloaded = estimators.filter((e: Estimator) => (loadMap.get(e.id) || 0) < avgLoad * 0.7);

    const moves: { orderId: string; from: string; to: string; reason: string }[] = [];

    // Try to move orders from overloaded to underloaded
    for (const overEst of overloaded) {
      const overEstimates = assignedEstimates.filter((e: Estimate) => e.preparedById === overEst.id);

      for (const estimate of overEstimates) {
        // Find suitable underloaded estimator
        for (const underEst of underloaded) {
          const orderFromEstimate = this.estimateToOrder(estimate);
          const score = this.calculateAssignmentScore(
            underEst,
            orderFromEstimate,
            undefined
          );

          if (score > 0.5) {
            // Move the order - update estimate
            const currentMetadata = (estimate.metadata as OrderMetadata) || {};
            const updatedMetadata: OrderMetadata = {
              ...currentMetadata,
              orderInfo: {
                type: currentMetadata.orderInfo?.type || 'NEW_ESTIMATE',
                priority: currentMetadata.orderInfo?.priority || 'MEDIUM',
                ...currentMetadata.orderInfo,
                assignedTo: underEst.id,
                notes: [
                  ...(currentMetadata.orderInfo?.notes || []),
                  `Rebalanced from ${overEst.name} to ${underEst.name}`,
                ],
              },
            };

            await prisma.estimate.update({
              where: { id: estimate.id },
              data: {
                preparedById: underEst.id,
                metadata: updatedMetadata as object,
              },
            });

            moves.push({
              orderId: estimate.id,
              from: overEst.id,
              to: underEst.id,
              reason: 'Load balancing',
            });

            // Update tracking
            const estMetadata = estimate.metadata as OrderMetadata;
            const estHours = estMetadata?.orderInfo?.estimatedHours || 0;
            loadMap.set(overEst.id, (loadMap.get(overEst.id) || 0) - estHours);
            loadMap.set(underEst.id, (loadMap.get(underEst.id) || 0) + estHours);

            break;
          }
        }
      }
    }

    return { rebalanced: moves.length, moves };
  }

  /**
   * Get estimator workload
   */
  async getEstimatorWorkload(
    estimatorId: string
  ): Promise<{
    estimator: Estimator;
    currentOrders: {
      id: string;
      title: string;
      type: OrderType;
      priority: OrderPriority;
      dueDate?: Date;
      estimatedHours?: number;
    }[];
    totalHours: number;
    utilizationPercent: number;
  }> {
    const estimator = await this.getEstimator(estimatorId);
    if (!estimator) {
      throw new Error('Estimator not found');
    }

    const estimates = await prisma.estimate.findMany({
      where: {
        preparedById: estimatorId,
        status: { in: ['IN_PROGRESS_ESTIMATE', 'UNDER_REVIEW_ESTIMATE'] },
      },
    });

    const currentOrders = estimates.map((e: Estimate) => {
      const metadata = e.metadata as OrderMetadata;
      return {
        id: e.id,
        title: e.name,
        type: (metadata?.orderInfo?.type || 'NEW_ESTIMATE') as OrderType,
        priority: (metadata?.orderInfo?.priority || 'MEDIUM') as OrderPriority,
        dueDate: metadata?.orderInfo?.dueDate ? new Date(metadata.orderInfo.dueDate) : undefined,
        estimatedHours: metadata?.orderInfo?.estimatedHours,
      };
    });

    const totalHours = currentOrders.reduce((sum: number, o: { estimatedHours?: number }) => sum + (o.estimatedHours || 0), 0);
    const utilizationPercent = (totalHours / estimator.capacity.maxHoursPerWeek) * 100;

    return {
      estimator,
      currentOrders,
      totalHours,
      utilizationPercent,
    };
  }

  /**
   * Get team workload
   */
  async getTeamWorkload(
    organizationId: string
  ): Promise<{
    totalOrders: number;
    totalHours: number;
    estimators: {
      id: string;
      name: string;
      orders: number;
      hours: number;
      utilization: number;
    }[];
    capacity: { total: number; used: number; available: number };
  }> {
    const estimators = await this.getAvailableEstimators(organizationId);

    const estimates = await prisma.estimate.findMany({
      where: {
        organizationId,
        status: { in: ['IN_PROGRESS_ESTIMATE', 'UNDER_REVIEW_ESTIMATE'] },
      },
    });

    const estimatorStats = estimators.map((est: Estimator) => {
      const estEstimates = estimates.filter((e: Estimate) => e.preparedById === est.id);
      const hours = estEstimates.reduce((sum: number, e: Estimate) => {
        const metadata = e.metadata as OrderMetadata;
        return sum + (metadata?.orderInfo?.estimatedHours || 0);
      }, 0);

      return {
        id: est.id,
        name: est.name,
        orders: estEstimates.length,
        hours,
        utilization: (hours / est.capacity.maxHoursPerWeek) * 100,
      };
    });

    const totalCapacity = estimators.reduce(
      (sum: number, e: Estimator) => sum + e.capacity.maxHoursPerWeek,
      0
    );
    const usedCapacity = estimatorStats.reduce((sum: number, e: { hours: number }) => sum + e.hours, 0);

    return {
      totalOrders: estimates.length,
      totalHours: usedCapacity,
      estimators: estimatorStats,
      capacity: {
        total: totalCapacity,
        used: usedCapacity,
        available: totalCapacity - usedCapacity,
      },
    };
  }

  /**
   * Get available estimators
   * Uses User model with metadata containing estimator information
   */
  private async getAvailableEstimators(
    organizationId: string,
    criteria?: AssignmentCriteria
  ): Promise<Estimator[]> {
    // Get org members for the organization
    const orgMembers = await prisma.orgMember.findMany({
      where: {
        orgId: organizationId,
      },
      include: {
        user: true,
      },
    });

    // Filter users who are estimators (based on metadata)
    const estimatorUsers = orgMembers
      .filter((om) => {
        const metadata = om.user.metadata as EstimatorMetadata | null;
        return metadata?.isEstimator === true;
      })
      .filter((om) => {
        if (criteria?.excludeEstimators && criteria.excludeEstimators.length > 0) {
          return !criteria.excludeEstimators.includes(om.userId);
        }
        return true;
      })
      .map((om) => om.user);

    // Filter by required skills if specified
    let filtered = estimatorUsers.map((u: User) => this.mapToEstimator(u));

    if (criteria?.requiredSkills && criteria.requiredSkills.length > 0) {
      filtered = filtered.filter((e: Estimator) =>
        criteria.requiredSkills!.every((skill: string) =>
          e.skills.some((s: EstimatorSkill) => s.category === skill)
        )
      );
    }

    // Filter by availability
    filtered = filtered.filter((e: Estimator) => e.capacity.availableHours > 0);

    // Sort by preference if specified
    if (criteria?.preferredEstimators && criteria.preferredEstimators.length > 0) {
      filtered.sort((a: Estimator, b: Estimator) => {
        const aPreferred = criteria.preferredEstimators!.includes(a.id) ? 0 : 1;
        const bPreferred = criteria.preferredEstimators!.includes(b.id) ? 0 : 1;
        return aPreferred - bPreferred;
      });
    }

    return filtered;
  }

  /**
   * Get single estimator
   */
  private async getEstimator(estimatorId: string): Promise<Estimator | null> {
    const user = await prisma.user.findUnique({
      where: { id: estimatorId },
    });

    if (!user) return null;

    const metadata = user.metadata as EstimatorMetadata | null;
    if (!metadata?.isEstimator) return null;

    return this.mapToEstimator(user);
  }

  /**
   * Calculate assignment score
   */
  private calculateAssignmentScore(
    estimator: Estimator,
    order: EstimationOrder,
    criteria?: AssignmentCriteria
  ): number {
    let score = 0;

    // Availability score (0-30 points)
    const availabilityRatio = estimator.capacity.availableHours /
      (order.estimatedHours || 8);
    score += Math.min(30, availabilityRatio * 10);

    // Skill match score (0-30 points)
    const requiredCategory = order.scope?.divisions?.[0]?.substring(0, 2);
    if (requiredCategory) {
      const skill = estimator.skills.find((s: EstimatorSkill) => s.category === requiredCategory);
      if (skill) {
        const proficiencyScores = { BEGINNER: 10, INTERMEDIATE: 20, ADVANCED: 25, EXPERT: 30 };
        score += proficiencyScores[skill.proficiency] || 0;
      }
    } else {
      score += 15; // Default if no specific category
    }

    // Performance score (0-20 points)
    score += estimator.performance.onTimeRate * 0.1;
    score += estimator.performance.averageAccuracy * 0.1;

    // Preference match (0-10 points)
    if (estimator.preferences.preferredTypes?.includes(order.type)) {
      score += 10;
    }

    // Load balancing (0-10 points) - prefer less loaded estimators
    const loadRatio = estimator.capacity.currentHours / estimator.capacity.maxHoursPerWeek;
    score += (1 - loadRatio) * 10;

    // Apply criteria weights
    if (criteria?.prioritizeExperience) {
      const maxExperience = Math.max(...estimator.skills.map((s: EstimatorSkill) => s.yearsExperience));
      score += maxExperience * 2;
    }

    if (criteria?.prioritizePerformance) {
      score += estimator.performance.averageAccuracy * 0.2;
    }

    return score;
  }

  /**
   * Get assignment reason
   */
  private getAssignmentReason(estimator: Estimator, order: EstimationOrder): string {
    const reasons: string[] = [];

    if (estimator.capacity.availableHours > (order.estimatedHours || 8)) {
      reasons.push('Good availability');
    }

    const requiredCategory = order.scope?.divisions?.[0]?.substring(0, 2);
    if (requiredCategory) {
      const skill = estimator.skills.find((s: EstimatorSkill) => s.category === requiredCategory);
      if (skill && ['ADVANCED', 'EXPERT'].includes(skill.proficiency)) {
        reasons.push(`Expert in ${skill.category}`);
      }
    }

    if (estimator.performance.onTimeRate > 90) {
      reasons.push('High on-time rate');
    }

    if (estimator.preferences.preferredTypes?.includes(order.type)) {
      reasons.push('Preferred work type');
    }

    return reasons.length > 0 ? reasons.join(', ') : 'Available';
  }

  /**
   * Update estimator capacity
   */
  private async updateEstimatorCapacity(
    estimatorId: string,
    hoursAdded: number
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: estimatorId },
    });

    if (!user) return;

    const metadata = (user.metadata as EstimatorMetadata) || {};
    const capacity = metadata.capacity || {
      maxHoursPerWeek: 40,
      currentHours: 0,
      availableHours: 40,
      pendingOrders: 0,
    };

    const updatedMetadata: EstimatorMetadata = {
      ...metadata,
      capacity: {
        ...capacity,
        currentHours: capacity.currentHours + hoursAdded,
        availableHours: capacity.availableHours - hoursAdded,
        pendingOrders: capacity.pendingOrders + 1,
      },
    };

    await prisma.user.update({
      where: { id: estimatorId },
      data: {
        metadata: updatedMetadata as object,
      },
    });
  }

  /**
   * Map User record to Estimator
   */
  private mapToEstimator(record: User): Estimator {
    const metadata = (record.metadata as EstimatorMetadata) || {};
    return {
      id: record.id,
      name: record.name || record.email || 'Unknown',
      email: record.email || '',
      skills: metadata.skills || [],
      capacity: metadata.capacity || {
        maxHoursPerWeek: 40,
        currentHours: 0,
        availableHours: 40,
        pendingOrders: 0,
      },
      preferences: metadata.preferences || {},
      performance: metadata.performance || {
        completedOrders: 0,
        averageAccuracy: 90,
        averageCompletionTime: 8,
        onTimeRate: 90,
      },
      isActive: record.status === 'ACTIVE',
    };
  }

  /**
   * Convert Estimate to EstimationOrder for compatibility
   */
  private estimateToOrder(estimate: Estimate): EstimationOrder {
    const metadata = (estimate.metadata as OrderMetadata) || {};
    const orderInfo: OrderMetadata['orderInfo'] = metadata.orderInfo;

    return {
      id: estimate.id,
      organizationId: estimate.organizationId,
      projectId: estimate.projectId || '',
      bidRequestId: estimate.bidRequestId || undefined,
      type: (orderInfo?.type || 'NEW_ESTIMATE') as OrderType,
      priority: (orderInfo?.priority || 'MEDIUM') as OrderPriority,
      status: this.mapEstimateStatusToOrderStatus(estimate.status),
      title: estimate.name,
      description: estimate.description || undefined,
      scope: {
        divisions: orderInfo?.scope?.divisions,
        complexity: orderInfo?.scope?.complexity as 'SIMPLE' | 'MODERATE' | 'COMPLEX' | undefined,
      },
      assignedTo: estimate.preparedById || undefined,
      assignedTeam: undefined,
      dueDate: orderInfo?.dueDate ? new Date(orderInfo.dueDate) : undefined,
      estimatedHours: orderInfo?.estimatedHours,
      actualHours: orderInfo?.actualHours,
      estimateId: estimate.id,
      deliverables: (orderInfo?.deliverables || []) as EstimationOrder['deliverables'],
      notes: orderInfo?.notes || [],
      metadata: metadata as Record<string, unknown>,
      createdAt: estimate.createdAt,
      updatedAt: estimate.updatedAt,
      createdBy: estimate.preparedById || '',
      completedAt: estimate.approvedAt || undefined,
    };
  }

  /**
   * Map Estimate status to Order status
   */
  private mapEstimateStatusToOrderStatus(status: string): EstimationOrder['status'] {
    const statusMap: Record<string, EstimationOrder['status']> = {
      'DRAFT_ESTIMATE': 'DRAFT',
      'IN_PROGRESS_ESTIMATE': 'IN_PROGRESS',
      'UNDER_REVIEW_ESTIMATE': 'REVIEW',
      'PENDING_APPROVAL_ESTIMATE': 'REVIEW',
      'APPROVED_ESTIMATE': 'COMPLETED',
      'SENT_ESTIMATE': 'COMPLETED',
      'ACCEPTED_ESTIMATE': 'COMPLETED',
      'REJECTED_ESTIMATE': 'CANCELLED',
      'EXPIRED_ESTIMATE': 'CANCELLED',
      'SUPERSEDED': 'CANCELLED',
      'ARCHIVED_ESTIMATE': 'COMPLETED',
    };
    return statusMap[status] || 'PENDING';
  }
}

export const assignmentEngine = new AssignmentEngine();
