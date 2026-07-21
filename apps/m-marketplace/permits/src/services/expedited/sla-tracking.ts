/**
 * SLA Tracking Service
 * Guaranteed turnaround time tracking
 */

import {createClient} from '@permits/src/lib/supabase/client';

export interface SLATracking {
  permitId: string;
  permitNumber: string;
  serviceLevel: 'STANDARD' | 'EXPEDITED' | 'RUSH';
  guaranteedCompletionTime: Date;
  actualCompletionTime?: Date;
  onTrack: boolean;
  hoursRemaining?: number;
  hoursElapsed: number;
  status: 'ON_TRACK' | 'AT_RISK' | 'BREACHED';
  breachReason?: string;
}

export interface SLAStatus {
  permitId: string;
  onTrack: boolean;
  status: 'ON_TRACK' | 'AT_RISK' | 'BREACHED';
  hoursRemaining?: number;
  hoursElapsed: number;
  guaranteedCompletionTime: Date;
  actualCompletionTime?: Date;
  breachReason?: string;
  eligibleForRefund: boolean;
}

export class SLATrackingService {
  /**
   * Track SLA for expedited permit
   */
  async trackSLA(permitId: string): Promise<SLATracking> {
    const supabase = createClient();

    // Get permit
    const {data: permit} = await supabase
      .from('Permit')
      .select('id, permitNumber, expedited, expeditedFee, submittedAt, reviewStartedAt, approvedAt, status')
      .eq('id', permitId)
      .single();

    if (!permit) {
      throw new Error('Permit not found');
    }

    if (!permit.expedited) {
      throw new Error('Permit is not expedited');
    }

    // Determine service level and turnaround time
    const serviceLevel = permit.expeditedFee && permit.expeditedFee > 0
      ? this.determineServiceLevel(permit.expeditedFee)
      : 'EXPEDITED';

    const turnaroundHours = serviceLevel === 'RUSH' ? 48 : 72;

    // Calculate guaranteed completion time
    const startTime = permit.reviewStartedAt
      ? new Date(permit.reviewStartedAt)
      : permit.submittedAt
      ? new Date(permit.submittedAt)
      : new Date();

    const guaranteedCompletionTime = new Date(startTime);
    guaranteedCompletionTime.setHours(
      guaranteedCompletionTime.getHours() + turnaroundHours
    );

    // Calculate elapsed time
    const now = new Date();
    const hoursElapsed = Math.floor(
      (now.getTime() - startTime.getTime()) / (1000 * 60 * 60)
    );

    // Calculate remaining time
    const hoursRemaining = Math.max(
      0,
      Math.floor((guaranteedCompletionTime.getTime() - now.getTime()) / (1000 * 60 * 60))
    );

    // Determine status
    let status: 'ON_TRACK' | 'AT_RISK' | 'BREACHED';
    let onTrack: boolean;
    let breachReason: string | undefined;

    if (permit.approvedAt) {
      // Already completed
      const actualCompletionTime = new Date(permit.approvedAt);
      const actualHours = Math.floor(
        (actualCompletionTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
      );

      if (actualHours <= turnaroundHours) {
        status = 'ON_TRACK';
        onTrack = true;
      } else {
        status = 'BREACHED';
        onTrack = false;
        breachReason = `Completed in ${actualHours} hours, exceeded ${turnaroundHours} hour guarantee`;
      }
    } else {
      // Still in progress
      if (hoursElapsed >= turnaroundHours) {
        status = 'BREACHED';
        onTrack = false;
        breachReason = `SLA breached: ${hoursElapsed} hours elapsed, ${turnaroundHours} hour guarantee`;
      } else if (hoursRemaining <= 12) {
        status = 'AT_RISK';
        onTrack = true;
      } else {
        status = 'ON_TRACK';
        onTrack = true;
      }
    }

    return {
      permitId: permit.id,
      permitNumber: permit.permitNumber,
      serviceLevel,
      guaranteedCompletionTime,
      actualCompletionTime: permit.approvedAt ? new Date(permit.approvedAt) : undefined,
      onTrack,
      hoursRemaining: hoursRemaining > 0 ? hoursRemaining : undefined,
      hoursElapsed,
      status,
      breachReason,
    };
  }

  /**
   * Check if SLA is breached and eligible for refund
   */
  async checkSLAStatus(permitId: string): Promise<SLAStatus> {
    const tracking = await this.trackSLA(permitId);

    const eligibleForRefund = tracking.status === 'BREACHED' && !tracking.actualCompletionTime;

    return {
      permitId: tracking.permitId,
      onTrack: tracking.onTrack,
      status: tracking.status,
      hoursRemaining: tracking.hoursRemaining,
      hoursElapsed: tracking.hoursElapsed,
      guaranteedCompletionTime: tracking.guaranteedCompletionTime,
      actualCompletionTime: tracking.actualCompletionTime,
      breachReason: tracking.breachReason,
      eligibleForRefund,
    };
  }

  /**
   * Determine service level from fee
   */
  private determineServiceLevel(expeditedFee: number): 'EXPEDITED' | 'RUSH' {
    // If fee is 25% of base, it's RUSH; otherwise EXPEDITED
    // This is a simplified check - in production would compare to base fee
    return expeditedFee > 1000 ? 'RUSH' : 'EXPEDITED';
  }

  /**
   * Get all expedited permits with SLA status
   */
  async getExpeditedPermitsWithSLA(
    jurisdictionId?: string
  ): Promise<SLATracking[]> {
    const supabase = createClient();

    let query = supabase
      .from('Permit')
      .select('id, permitNumber, expedited, submittedAt, reviewStartedAt, approvedAt')
      .eq('expedited', true)
      .in('status', ['SUBMITTED', 'UNDER_REVIEW', 'CORRECTIONS_REQUIRED', 'RESUBMITTED']);

    if (jurisdictionId) {
      query = query.eq('jurisdictionId', jurisdictionId);
    }

    const {data: permits} = await query;

    if (!permits || permits.length === 0) {
      return [];
    }

    const slaTrackings: SLATracking[] = [];

    for (const permit of permits) {
      try {
        const tracking = await this.trackSLA(permit.id);
        slaTrackings.push(tracking);
      } catch (error) {
        console.error(`Failed to track SLA for permit ${permit.id}:`, error);
      }
    }

    return slaTrackings;
  }

  /**
   * Get at-risk or breached permits
   */
  async getAtRiskPermits(jurisdictionId?: string): Promise<SLATracking[]> {
    const allPermits = await this.getExpeditedPermitsWithSLA(jurisdictionId);

    return allPermits.filter(p => p.status === 'AT_RISK' || p.status === 'BREACHED');
  }
}

// Singleton instance
export const slaTrackingService = new SLATrackingService();
