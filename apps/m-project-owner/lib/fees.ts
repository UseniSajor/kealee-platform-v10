/**
 * Platform Fee Calculation
 * 3% platform fee on all milestone payments
 */

const PLATFORM_FEE_PERCENTAGE = 0.03 // 3%

/**
 * Calculate platform fee from milestone amount
 */
export function calculatePlatformFee(milestoneAmount: number): number {
  return Math.round(milestoneAmount * PLATFORM_FEE_PERCENTAGE * 100) / 100
}

/**
 * Calculate contractor payout (97% of milestone amount)
 */
export function calculateContractorPayout(milestoneAmount: number): number {
  const fee = calculatePlatformFee(milestoneAmount)
  return Math.round((milestoneAmount - fee) * 100) / 100
}

/**
 * Calculate split payment amounts
 */
export function calculatePaymentSplit(milestoneAmount: number): {
  total: number
  platformFee: number
  contractorPayout: number
} {
  const platformFee = calculatePlatformFee(milestoneAmount)
  const contractorPayout = calculateContractorPayout(milestoneAmount)
  
  return {
    total: milestoneAmount,
    platformFee,
    contractorPayout,
  }
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}
