import type { RefundReason, RefundResult } from './types.js';

const REFUND_POLICIES: Record<RefundReason, { percentage: number; message: string }> = {
  contractor_quality_issue: {
    percentage: 50,
    message: '50% refund approved for contractor quality concern. The remaining 50% covers costs already incurred.',
  },
  project_cancelled: {
    percentage: 75,
    message: '75% refund for project cancellation. 25% is retained to cover platform setup and administrative costs.',
  },
  service_not_provided: {
    percentage: 100,
    message: 'Full 100% refund approved as the service was not provided.',
  },
};

export function calculateRefund(originalAmount: number, reason: RefundReason): RefundResult {
  const policy = REFUND_POLICIES[reason];
  const refundAmount = originalAmount * (policy.percentage / 100);

  return {
    approved: true,
    reason,
    refundAmount,
    originalAmount,
    refundPercentage: policy.percentage,
    message: policy.message,
  };
}
