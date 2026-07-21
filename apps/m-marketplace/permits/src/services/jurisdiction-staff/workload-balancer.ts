/**
 * Workload Balancing Service
 * Distributes work evenly among available staff members
 */

import {JurisdictionStaff, WorkloadAssignment, ReviewDiscipline} from '@permits/src/types/jurisdiction-staff';

export interface AssignmentOptions {
  permitId?: string;
  inspectionId?: string;
  reviewId?: string;
  discipline?: ReviewDiscipline;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  estimatedHours?: number;
  location?: {latitude: number; longitude: number};
  excludeStaffIds?: string[];
}

export class WorkloadBalancerService {
  /**
   * Assign work to the best available staff member
   */
  async assignWork(
    staffMembers: JurisdictionStaff[],
    options: AssignmentOptions
  ): Promise<{staffId: string; score: number; reason: string} | null> {
    // Filter eligible staff
    const eligibleStaff = this.filterEligibleStaff(staffMembers, options);

    if (eligibleStaff.length === 0) {
      return null;
    }

    // Score each staff member
    const scoredStaff = eligibleStaff.map(staff => ({
      staff,
      score: this.calculateAssignmentScore(staff, options),
    }));

    // Sort by score (highest first)
    scoredStaff.sort((a, b) => b.score - a.score);

    const bestMatch = scoredStaff[0];

    return {
      staffId: bestMatch.staff.id,
      score: bestMatch.score,
      reason: this.generateAssignmentReason(bestMatch.staff, options),
    };
  }

  /**
   * Filter staff members eligible for assignment
   */
  private filterEligibleStaff(
    staffMembers: JurisdictionStaff[],
    options: AssignmentOptions
  ): JurisdictionStaff[] {
    return staffMembers.filter(staff => {
      // Must be active
      if (!staff.isActive) return false;

      // Exclude specified staff
      if (options.excludeStaffIds?.includes(staff.id)) return false;

      // Check workload capacity
      if (staff.currentWorkload >= staff.maxWorkload) return false;

      // Check discipline match (for reviews)
      if (options.discipline && !staff.disciplines.includes(options.discipline)) {
        return false;
      }

      // Check availability
      if (!this.isAvailable(staff, options.dueDate)) return false;

      return true;
    });
  }

  /**
   * Calculate assignment score for a staff member
   * Higher score = better match
   */
  private calculateAssignmentScore(
    staff: JurisdictionStaff,
    options: AssignmentOptions
  ): number {
    let score = 0;

    // 1. Workload balance (40% weight)
    // Lower workload = higher score
    const workloadRatio = staff.currentWorkload / staff.maxWorkload;
    const workloadScore = (1 - workloadRatio) * 40;
    score += workloadScore;

    // 2. Performance (30% weight)
    // Higher accuracy = higher score
    if (staff.avgAccuracy !== undefined) {
      score += staff.avgAccuracy * 30;
    } else {
      score += 15; // Default if no accuracy data
    }

    // 3. Experience with discipline (20% weight)
    if (options.discipline && staff.disciplines.includes(options.discipline)) {
      score += 20;
    }

    // 4. Average review time (10% weight)
    // Faster reviewers get slightly higher score
    if (staff.avgReviewTime) {
      // Normalize: faster = better (inverse relationship)
      const timeScore = Math.max(0, 10 - (staff.avgReviewTime / 60)); // Convert to hours
      score += timeScore;
    } else {
      score += 5; // Default
    }

    // 5. Location proximity (bonus for inspections)
    if (options.location && options.inspectionId && staff.lastLocation) {
      const distance = this.calculateDistance(
        options.location,
        {
          latitude: staff.lastLocation.latitude,
          longitude: staff.lastLocation.longitude,
        }
      );
      // Closer = better (max 10 bonus points)
      const proximityBonus = Math.max(0, 10 - (distance / 10)); // 10km = 0 bonus
      score += proximityBonus;
    }

    return score;
  }

  /**
   * Check if staff member is available
   */
  private isAvailable(staff: JurisdictionStaff, dueDate?: Date): boolean {
    if (!dueDate) return true;

    // Check if date falls on vacation
    const dueDateOnly = new Date(dueDate.toDateString());
    for (const vacation of staff.vacationDates) {
      if (vacation.approved) {
        const vacStart = new Date(vacation.start.toDateString());
        const vacEnd = new Date(vacation.end.toDateString());
        if (dueDateOnly >= vacStart && dueDateOnly <= vacEnd) {
          return false;
        }
      }
    }

    // Check working hours
    const dayOfWeek = dueDate.getDay();
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek];
    const schedule = staff.workingHours[dayName as keyof typeof staff.workingHours];

    if (!schedule) return false;

    const dueTime = `${dueDate.getHours().toString().padStart(2, '0')}:${dueDate.getMinutes().toString().padStart(2, '0')}`;
    return dueTime >= schedule.start && dueTime <= schedule.end;
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  private calculateDistance(
    point1: {latitude: number; longitude: number},
    point2: {latitude: number; longitude: number}
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(point2.latitude - point1.latitude);
    const dLon = this.deg2rad(point2.longitude - point1.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(point1.latitude)) *
        Math.cos(this.deg2rad(point2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Generate reason for assignment
   */
  private generateAssignmentReason(
    staff: JurisdictionStaff,
    options: AssignmentOptions
  ): string {
    const reasons: string[] = [];

    const workloadPercent = (staff.currentWorkload / staff.maxWorkload) * 100;
    if (workloadPercent < 50) {
      reasons.push('low workload');
    } else if (workloadPercent < 80) {
      reasons.push('moderate workload');
    }

    if (staff.avgAccuracy && staff.avgAccuracy > 0.9) {
      reasons.push('high accuracy');
    }

    if (options.discipline && staff.disciplines.includes(options.discipline)) {
      reasons.push(`specialized in ${options.discipline}`);
    }

    if (options.location && staff.lastLocation) {
      const distance = this.calculateDistance(
        options.location,
        {
          latitude: staff.lastLocation.latitude,
          longitude: staff.lastLocation.longitude,
        }
      );
      if (distance < 10) {
        reasons.push('nearby location');
      }
    }

    return reasons.length > 0
      ? `Assigned based on: ${reasons.join(', ')}`
      : 'Assigned based on availability';
  }

  /**
   * Balance workload across all staff
   */
  async balanceWorkload(
    staffMembers: JurisdictionStaff[],
    assignments: WorkloadAssignment[]
  ): Promise<Array<{staffId: string; fromStaffId: string; reason: string}>> {
    const rebalances: Array<{staffId: string; fromStaffId: string; reason: string}> = [];

    // Calculate average workload
    const activeStaff = staffMembers.filter(s => s.isActive);
    if (activeStaff.length === 0) return rebalances;

    const totalWorkload = activeStaff.reduce((sum, s) => sum + s.currentWorkload, 0);
    const avgWorkload = totalWorkload / activeStaff.length;

    // Find overworked and underworked staff
    const overworked = activeStaff.filter(s => s.currentWorkload > avgWorkload * 1.2);
    const underworked = activeStaff.filter(s => s.currentWorkload < avgWorkload * 0.8);

    // Rebalance assignments
    for (const overworkedStaff of overworked) {
      const excessWorkload = overworkedStaff.currentWorkload - avgWorkload;
      const staffAssignments = assignments.filter(a => a.staffId === overworkedStaff.id);

      // Sort assignments by priority (lowest first for rebalancing)
      staffAssignments.sort((a, b) => {
        const priorityOrder = {low: 0, medium: 1, high: 2, urgent: 3};
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      // Find best recipient for each assignment
      for (const assignment of staffAssignments.slice(0, Math.ceil(excessWorkload))) {
        const bestRecipient = await this.assignWork(underworked, {
          permitId: assignment.permitId,
          inspectionId: assignment.inspectionId,
          reviewId: assignment.reviewId,
          priority: assignment.priority,
          dueDate: assignment.dueDate,
          estimatedHours: assignment.estimatedHours,
        });

        if (bestRecipient) {
          rebalances.push({
            staffId: bestRecipient.staffId,
            fromStaffId: overworkedStaff.id,
            reason: `Rebalancing: ${bestRecipient.reason}`,
          });
        }
      }
    }

    return rebalances;
  }

  /**
   * Get workload statistics
   */
  getWorkloadStats(staffMembers: JurisdictionStaff[]) {
    const activeStaff = staffMembers.filter(s => s.isActive);
    
    if (activeStaff.length === 0) {
      return {
        totalStaff: 0,
        avgWorkload: 0,
        maxWorkload: 0,
        minWorkload: 0,
        utilizationRate: 0,
        overworkedCount: 0,
        underworkedCount: 0,
      };
    }

    const workloads = activeStaff.map(s => s.currentWorkload);
    const maxWorkloads = activeStaff.map(s => s.maxWorkload);
    const totalWorkload = workloads.reduce((sum, w) => sum + w, 0);
    const totalCapacity = maxWorkloads.reduce((sum, w) => sum + w, 0);
    const avgWorkload = totalWorkload / activeStaff.length;
    const utilizationRate = totalCapacity > 0 ? totalWorkload / totalCapacity : 0;

    return {
      totalStaff: activeStaff.length,
      avgWorkload: Math.round(avgWorkload * 100) / 100,
      maxWorkload: Math.max(...workloads),
      minWorkload: Math.min(...workloads),
      utilizationRate: Math.round(utilizationRate * 100) / 100,
      overworkedCount: activeStaff.filter(s => s.currentWorkload >= s.maxWorkload * 0.9).length,
      underworkedCount: activeStaff.filter(s => s.currentWorkload < s.maxWorkload * 0.5).length,
    };
  }
}

// Singleton instance
export const workloadBalancerService = new WorkloadBalancerService();
