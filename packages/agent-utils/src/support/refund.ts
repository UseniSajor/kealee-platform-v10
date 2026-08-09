/**
 * @kealee/agent-utils/support/refund
 *
 * Platform refund policy calculator.
 *
 * Policies:
 *   contractor_quality_issue  → 50% refund
 *   project_cancelled         → 75% refund
 *   service_not_provided      → 100% refund
 *
 * Source: extracted from bots/keabot-support/src/refund.ts
 * Pure function — no I/O, no LLM, no database.
 * The caller is responsible for initiating the actual Stripe refund.
 */

import type { RefundReason, RefundResult } from './types';

interface RefundPolicy {
  percentage: number;
  message: string;
}

const REFUND_POLICIES: Record<RefundReason, RefundPolicy> = {
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
    approved:          true,
    reason,
    refundAmount,
    originalAmount,
    refundPercentage:  policy.percentage,
    message:           policy.message,
  };
}

export { REFUND_POLICIES };
