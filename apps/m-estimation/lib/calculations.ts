/**
 * Client-side calculation utilities for estimates
 */

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  type: 'material' | 'labor' | 'equipment' | 'other';
}

export interface Section {
  id: string;
  division: string;
  name: string;
  lineItems: LineItem[];
  subtotal: number;
}

export interface EstimateSettings {
  overheadPercent?: number;
  overheadAmount?: number;
  profitPercent?: number;
  profitAmount?: number;
  contingencyPercent?: number;
  taxPercent?: number;
}

export interface CostBreakdown {
  materialCost: number;
  laborCost: number;
  equipmentCost: number;
  otherCost: number;
  subtotal: number;
  overhead: number;
  profit: number;
  contingency: number;
  subtotalWithMarkup: number;
  tax: number;
  total: number;
}

/**
 * Calculate line item total
 */
export function calculateLineItemTotal(item: LineItem): number {
  return item.quantity * item.unitCost;
}

/**
 * Calculate section subtotal
 */
export function calculateSectionSubtotal(section: Section): number {
  return section.lineItems.reduce(
    (sum, item) => sum + calculateLineItemTotal(item),
    0
  );
}

/**
 * Calculate cost breakdown by type
 */
export function calculateCostBreakdown(
  sections: Section[],
  settings: EstimateSettings = {}
): CostBreakdown {
  // Get all line items
  const allItems = sections.flatMap((s) => s.lineItems);

  // Calculate costs by type
  const materialCost = allItems
    .filter((i) => i.type === 'material')
    .reduce((sum, item) => sum + calculateLineItemTotal(item), 0);

  const laborCost = allItems
    .filter((i) => i.type === 'labor')
    .reduce((sum, item) => sum + calculateLineItemTotal(item), 0);

  const equipmentCost = allItems
    .filter((i) => i.type === 'equipment')
    .reduce((sum, item) => sum + calculateLineItemTotal(item), 0);

  const otherCost = allItems
    .filter((i) => i.type === 'other')
    .reduce((sum, item) => sum + calculateLineItemTotal(item), 0);

  const subtotal = materialCost + laborCost + equipmentCost + otherCost;

  // Calculate overhead
  let overhead = 0;
  if (settings.overheadAmount) {
    overhead = settings.overheadAmount;
  } else if (settings.overheadPercent) {
    overhead = subtotal * (settings.overheadPercent / 100);
  }

  // Calculate profit
  let profit = 0;
  const subtotalWithOverhead = subtotal + overhead;
  if (settings.profitAmount) {
    profit = settings.profitAmount;
  } else if (settings.profitPercent) {
    profit = subtotalWithOverhead * (settings.profitPercent / 100);
  }

  // Calculate contingency
  let contingency = 0;
  if (settings.contingencyPercent) {
    contingency = subtotalWithOverhead * (settings.contingencyPercent / 100);
  }

  const subtotalWithMarkup = subtotalWithOverhead + profit + contingency;

  // Calculate tax
  let tax = 0;
  if (settings.taxPercent) {
    tax = subtotalWithMarkup * (settings.taxPercent / 100);
  }

  const total = subtotalWithMarkup + tax;

  return {
    materialCost,
    laborCost,
    equipmentCost,
    otherCost,
    subtotal,
    overhead,
    profit,
    contingency,
    subtotalWithMarkup,
    tax,
    total,
  };
}

/**
 * Calculate percentage of total
 */
export function calculatePercentOfTotal(
  amount: number,
  total: number
): number {
  if (total === 0) return 0;
  return (amount / total) * 100;
}

/**
 * Calculate unit cost from total
 */
export function calculateUnitCost(totalCost: number, quantity: number): number {
  if (quantity === 0) return 0;
  return totalCost / quantity;
}

/**
 * Apply markup to cost
 */
export function applyMarkup(cost: number, markupPercent: number): number {
  return cost * (1 + markupPercent / 100);
}

/**
 * Calculate margin from markup
 */
export function marginFromMarkup(markupPercent: number): number {
  return (markupPercent / (100 + markupPercent)) * 100;
}

/**
 * Calculate markup from margin
 */
export function markupFromMargin(marginPercent: number): number {
  return (marginPercent / (100 - marginPercent)) * 100;
}
