/**
 * KEALEE COMMAND CENTER - MONEY UTILITIES
 * Currency formatting and financial calculations
 */

/**
 * Format amount as currency
 */
export function formatCurrency(
  amount: number,
  options: {
    currency?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string {
  const {
    currency = 'USD',
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
  } = options;

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);
}

/**
 * Format amount with detailed decimals (for line items)
 */
export function formatCurrencyDetailed(amount: number): string {
  return formatCurrency(amount, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format amount in compact notation (e.g., $1.2M)
 */
export function formatCurrencyCompact(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`;
  }
  return formatCurrency(amount);
}

/**
 * Calculate percentage
 */
export function calculatePercentage(part: number, whole: number): number {
  if (whole === 0) return 0;
  return Math.round((part / whole) * 100 * 10) / 10;
}

/**
 * Calculate variance between actual and budgeted
 */
export function calculateVariance(
  actual: number,
  budgeted: number
): {
  amount: number;
  percentage: number;
  status: 'under' | 'on-track' | 'over';
} {
  const amount = actual - budgeted;
  const percentage = calculatePercentage(amount, budgeted);

  let status: 'under' | 'on-track' | 'over';
  if (percentage < -5) {
    status = 'under';
  } else if (percentage > 5) {
    status = 'over';
  } else {
    status = 'on-track';
  }

  return { amount, percentage, status };
}

/**
 * Calculate margin
 */
export function calculateMargin(
  revenue: number,
  cost: number
): {
  grossMargin: number;
  grossMarginPercent: number;
} {
  const grossMargin = revenue - cost;
  const grossMarginPercent = revenue > 0 ? calculatePercentage(grossMargin, revenue) : 0;

  return { grossMargin, grossMarginPercent };
}

/**
 * Calculate contingency amount
 */
export function calculateContingency(
  budget: number,
  contingencyPercent: number = 10
): number {
  return budget * (contingencyPercent / 100);
}

/**
 * Budget tracking summary
 */
export interface BudgetSummary {
  totalBudget: number;
  spent: number;
  committed: number;
  remaining: number;
  percentSpent: number;
  percentCommitted: number;
  percentRemaining: number;
  variance: {
    amount: number;
    percentage: number;
    status: 'under' | 'on-track' | 'over';
  };
  projectedTotal: number;
  projectedVariance: number;
}

/**
 * Calculate budget summary
 */
export function calculateBudgetSummary(
  totalBudget: number,
  spent: number,
  committed: number,
  percentComplete: number
): BudgetSummary {
  const remaining = totalBudget - spent - committed;
  const percentSpent = calculatePercentage(spent, totalBudget);
  const percentCommitted = calculatePercentage(committed, totalBudget);
  const percentRemaining = calculatePercentage(remaining, totalBudget);

  // Calculate expected spend at this point
  const expectedSpend = totalBudget * (percentComplete / 100);
  const variance = calculateVariance(spent, expectedSpend);

  // Project total spend based on burn rate
  const burnRate = percentComplete > 0 ? spent / percentComplete : 0;
  const projectedTotal = burnRate * 100;
  const projectedVariance = projectedTotal - totalBudget;

  return {
    totalBudget,
    spent,
    committed,
    remaining,
    percentSpent,
    percentCommitted,
    percentRemaining,
    variance,
    projectedTotal,
    projectedVariance,
  };
}

/**
 * Cost category breakdown
 */
export interface CostCategory {
  name: string;
  budgeted: number;
  spent: number;
  committed: number;
  remaining: number;
  variance: number;
  variancePercent: number;
}

/**
 * Calculate cost breakdown by category
 */
export function calculateCostBreakdown(
  categories: Array<{ name: string; budgeted: number; spent: number; committed: number }>
): CostCategory[] {
  return categories.map(cat => {
    const remaining = cat.budgeted - cat.spent - cat.committed;
    const variance = cat.spent - cat.budgeted;
    const variancePercent = calculatePercentage(variance, cat.budgeted);

    return {
      name: cat.name,
      budgeted: cat.budgeted,
      spent: cat.spent,
      committed: cat.committed,
      remaining,
      variance,
      variancePercent,
    };
  });
}

/**
 * Calculate retainage amount
 */
export function calculateRetainage(
  invoiceAmount: number,
  retainagePercent: number = 10
): {
  retainageAmount: number;
  netPayable: number;
} {
  const retainageAmount = invoiceAmount * (retainagePercent / 100);
  const netPayable = invoiceAmount - retainageAmount;

  return { retainageAmount, netPayable };
}

/**
 * Calculate markup
 */
export function calculateMarkup(
  cost: number,
  markupPercent: number
): {
  markupAmount: number;
  sellingPrice: number;
} {
  const markupAmount = cost * (markupPercent / 100);
  const sellingPrice = cost + markupAmount;

  return { markupAmount, sellingPrice };
}

/**
 * Round to cents
 */
export function roundToCents(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Sum array of amounts
 */
export function sumAmounts(amounts: number[]): number {
  return roundToCents(amounts.reduce((sum, amt) => sum + amt, 0));
}

/**
 * Calculate change order impact on budget
 */
export function calculateChangeOrderImpact(
  originalBudget: number,
  changeOrderAmount: number,
  existingChangeOrders: number = 0
): {
  newBudget: number;
  totalChangeOrders: number;
  changeOrderPercent: number;
  isMaterialChange: boolean;
} {
  const totalChangeOrders = existingChangeOrders + changeOrderAmount;
  const newBudget = originalBudget + totalChangeOrders;
  const changeOrderPercent = calculatePercentage(totalChangeOrders, originalBudget);

  // Material change if > 10% of original budget
  const isMaterialChange = Math.abs(changeOrderPercent) > 10;

  return {
    newBudget,
    totalChangeOrders,
    changeOrderPercent,
    isMaterialChange,
  };
}
