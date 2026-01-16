/**
 * Refund Policy Service
 * Performance guarantee with refund policy
 */

import {createClient} from '@/lib/supabase/client';
import {slaTrackingService} from './sla-tracking';

export interface RefundEligibility {
  permitId: string;
  permitNumber: string;
  eligible: boolean;
  reason: string;
  expeditedFee: number;
  refundAmount: number;
  refundPercentage: number; // 0-100%
  slaStatus: 'ON_TRACK' | 'AT_RISK' | 'BREACHED';
  breachDetails?: {
    guaranteedHours: number;
    actualHours?: number;
    breachHours: number;
  };
}

export interface RefundRequest {
  permitId: string;
  requestedBy: string;
  reason: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED';
  requestedAt: Date;
  processedAt?: Date;
}

export class RefundPolicyService {
  /**
   * Check refund eligibility
   */
  async checkRefundEligibility(permitId: string): Promise<RefundEligibility> {
    const supabase = createClient();

    // Get permit
    const {data: permit} = await supabase
      .from('Permit')
      .select('id, permitNumber, expedited, expeditedFee, status')
      .eq('id', permitId)
      .single();

    if (!permit) {
      throw new Error('Permit not found');
    }

    if (!permit.expedited || !permit.expeditedFee) {
      return {
        permitId: permit.id,
        permitNumber: permit.permitNumber,
        eligible: false,
        reason: 'Permit is not expedited',
        expeditedFee: 0,
        refundAmount: 0,
        refundPercentage: 0,
        slaStatus: 'ON_TRACK',
      };
    }

    // Check SLA status
    const slaStatus = await slaTrackingService.checkSLAStatus(permitId);

    // Determine eligibility
    let eligible = false;
    let reason = '';
    let refundPercentage = 0;

    if (slaStatus.status === 'BREACHED' && slaStatus.eligibleForRefund) {
      eligible = true;
      reason = `SLA breached: ${slaStatus.breachReason}`;
      refundPercentage = 100; // Full refund for SLA breach
    } else if (slaStatus.status === 'BREACHED' && slaStatus.actualCompletionTime) {
      // Completed but breached
      const breachHours = slaStatus.hoursElapsed - (slaStatus.guaranteedCompletionTime.getTime() - new Date(slaStatus.actualCompletionTime).getTime()) / (1000 * 60 * 60);
      
      if (breachHours > 24) {
        eligible = true;
        reason = `SLA breached by ${Math.round(breachHours)} hours`;
        refundPercentage = 50; // Partial refund for significant breach
      } else {
        eligible = false;
        reason = `SLA breached by ${Math.round(breachHours)} hours (less than 24 hours - no refund)`;
        refundPercentage = 0;
      }
    } else {
      eligible = false;
      reason = 'SLA not breached or permit completed on time';
      refundPercentage = 0;
    }

    const refundAmount = Math.round((permit.expeditedFee * refundPercentage) / 100);

    return {
      permitId: permit.id,
      permitNumber: permit.permitNumber,
      eligible,
      reason,
      expeditedFee: permit.expeditedFee,
      refundAmount,
      refundPercentage,
      slaStatus: slaStatus.status,
      breachDetails: slaStatus.status === 'BREACHED'
        ? {
            guaranteedHours: Math.floor(
              (slaStatus.guaranteedCompletionTime.getTime() - new Date(slaStatus.actualCompletionTime || Date.now()).getTime()) / (1000 * 60 * 60)
            ),
            actualHours: slaStatus.actualCompletionTime
              ? slaStatus.hoursElapsed
              : undefined,
            breachHours: slaStatus.hoursElapsed - (slaStatus.guaranteedCompletionTime.getTime() - Date.now()) / (1000 * 60 * 60),
          }
        : undefined,
    };
  }

  /**
   * Request refund
   */
  async requestRefund(
    permitId: string,
    requestedBy: string
  ): Promise<RefundRequest> {
    const eligibility = await this.checkRefundEligibility(permitId);

    if (!eligibility.eligible) {
      throw new Error(`Refund not eligible: ${eligibility.reason}`);
    }

    const supabase = createClient();

    // Create refund request
    const {data: refundRequest} = await supabase
      .from('RefundRequest')
      .insert({
        permitId,
        requestedBy,
        reason: eligibility.reason,
        amount: eligibility.refundAmount,
        status: 'PENDING',
        requestedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (!refundRequest) {
      throw new Error('Failed to create refund request');
    }

    // Notify jurisdiction staff
    await this.notifyRefundRequest(permitId, refundRequest.id);

    return {
      permitId: refundRequest.permitId,
      requestedBy: refundRequest.requestedBy,
      reason: refundRequest.reason,
      amount: refundRequest.amount,
      status: refundRequest.status,
      requestedAt: new Date(refundRequest.requestedAt),
      processedAt: refundRequest.processedAt ? new Date(refundRequest.processedAt) : undefined,
    };
  }

  /**
   * Process refund
   */
  async processRefund(
    refundRequestId: string,
    approved: boolean,
    processedBy: string
  ): Promise<void> {
    const supabase = createClient();

    const {data: refundRequest} = await supabase
      .from('RefundRequest')
      .select('*, permit:Permit(applicantId)')
      .eq('id', refundRequestId)
      .single();

    if (!refundRequest) {
      throw new Error('Refund request not found');
    }

    await supabase
      .from('RefundRequest')
      .update({
        status: approved ? 'APPROVED' : 'REJECTED',
        processedAt: new Date().toISOString(),
        processedBy,
      })
      .eq('id', refundRequestId);

    if (approved) {
      // Process payment refund (would integrate with payment processor)
      await this.processPaymentRefund(
        refundRequest.permitId,
        refundRequest.amount,
        refundRequest.permit.applicantId
      );
    }
  }

  /**
   * Process payment refund (mock - would integrate with Stripe, etc.)
   */
  private async processPaymentRefund(
    permitId: string,
    amount: number,
    applicantId: string
  ): Promise<void> {
    // In production, would call payment processor API (Stripe refund, etc.)
    console.log(`Processing refund of $${amount} for permit ${permitId} to applicant ${applicantId}`);
  }

  /**
   * Notify jurisdiction staff of refund request
   */
  private async notifyRefundRequest(permitId: string, refundRequestId: string): Promise<void> {
    // In production, would send notification
    console.log(`Refund request ${refundRequestId} created for permit ${permitId}`);
  }
}

// Singleton instance
export const refundPolicyService = new RefundPolicyService();
