/**
 * Fee Calculator Service
 * Calculates permit fees based on jurisdiction rules and permit type
 */

export interface FeeSchedule {
  baseFees: Record<string, number>; // Base fee by permit type
  valuationRates: Record<string, number>; // Percentage rate by permit type
  squareFootageRates?: Record<string, number>; // Rate per sqft
  minimumFees: Record<string, number>; // Minimum fee by type
  maximumFees?: Record<string, number>; // Maximum fee by type
  flatFees?: Record<string, number>; // Flat fees for specific types
  tieredRates?: Array<{
    min: number;
    max?: number;
    rate: number;
  }>;
}

export interface FeeCalculation {
  baseFee: number;
  valuationFee: number;
  squareFootageFee?: number;
  flatFee?: number;
  subtotal: number;
  expeditedFee?: number;
  total: number;
  breakdown: Array<{description: string; amount: number}>;
}

export class FeeCalculatorService {
  /**
   * Calculate permit fees
   */
  calculateFees(
    feeSchedule: FeeSchedule | any,
    permitType: string,
    valuation: number,
    squareFootage?: number,
    expedited: boolean = false
  ): FeeCalculation {
    const breakdown: Array<{description: string; amount: number}> = [];

    // Get base fee for permit type
    const baseFee = feeSchedule.baseFees?.[permitType] || 
                    feeSchedule.baseFee || 
                    this.getDefaultBaseFee(permitType);
    breakdown.push({description: `Base ${permitType} Permit Fee`, amount: baseFee});

    // Calculate valuation-based fee
    const valuationRate = feeSchedule.valuationRates?.[permitType] || 
                          feeSchedule.percentage || 
                          this.getDefaultValuationRate(permitType);
    let valuationFee = valuation * valuationRate;

    // Apply tiered rates if available
    if (feeSchedule.tieredRates && feeSchedule.tieredRates.length > 0) {
      valuationFee = this.calculateTieredFee(valuation, feeSchedule.tieredRates);
    }

    // Apply minimum fee
    const minimumFee = feeSchedule.minimumFees?.[permitType] || 0;
    if (valuationFee < minimumFee) {
      valuationFee = minimumFee;
    }

    // Apply maximum fee if set
    const maximumFee = feeSchedule.maximumFees?.[permitType];
    if (maximumFee && valuationFee > maximumFee) {
      valuationFee = maximumFee;
    }

    if (valuationFee > 0) {
      breakdown.push({
        description: `Valuation Fee (${(valuationRate * 100).toFixed(2)}% of $${valuation.toLocaleString()})`,
        amount: valuationFee,
      });
    }

    // Calculate square footage fee if applicable
    let squareFootageFee = 0;
    if (squareFootage && feeSchedule.squareFootageRates?.[permitType]) {
      squareFootageFee = squareFootage * feeSchedule.squareFootageRates[permitType];
      breakdown.push({
        description: `Square Footage Fee (${squareFootage} sqft × $${feeSchedule.squareFootageRates[permitType].toFixed(2)})`,
        amount: squareFootageFee,
      });
    }

    // Add flat fees if applicable
    let flatFee = 0;
    if (feeSchedule.flatFees?.[permitType]) {
      flatFee = feeSchedule.flatFees[permitType];
      breakdown.push({
        description: 'Additional Processing Fee',
        amount: flatFee,
      });
    }

    // Calculate subtotal
    const subtotal = baseFee + valuationFee + squareFootageFee + flatFee;

    // Calculate expedited fee (15-25% of subtotal)
    let expeditedFee = 0;
    if (expedited) {
      const expeditedRate = feeSchedule.expeditedRate || 0.20; // Default 20%
      expeditedFee = subtotal * expeditedRate;
      breakdown.push({
        description: `Expedited Processing Fee (${(expeditedRate * 100).toFixed(0)}%)`,
        amount: expeditedFee,
      });
    }

    const total = subtotal + expeditedFee;

    return {
      baseFee,
      valuationFee,
      squareFootageFee: squareFootageFee || undefined,
      flatFee: flatFee || undefined,
      subtotal,
      expeditedFee: expedited ? expeditedFee : undefined,
      total,
      breakdown,
    };
  }

  /**
   * Calculate tiered fee structure
   */
  private calculateTieredFee(
    valuation: number,
    tiers: Array<{min: number; max?: number; rate: number}>
  ): number {
    let totalFee = 0;
    let remainingValue = valuation;

    for (const tier of tiers) {
      if (remainingValue <= 0) break;

      const tierMin = tier.min;
      const tierMax = tier.max || Infinity;
      const tierValue = Math.min(remainingValue, tierMax - tierMin);

      if (tierValue > 0) {
        totalFee += tierValue * tier.rate;
        remainingValue -= tierValue;
      }
    }

    return totalFee;
  }

  /**
   * Get default base fee by permit type
   */
  private getDefaultBaseFee(permitType: string): number {
    const defaults: Record<string, number> = {
      BUILDING: 150,
      ELECTRICAL: 100,
      PLUMBING: 100,
      MECHANICAL: 100,
      FIRE: 75,
      GRADING: 200,
      DEMOLITION: 150,
      SIGN: 50,
      FENCE: 50,
      ROOFING: 75,
      HVAC: 100,
      SOLAR: 150,
      POOL: 200,
    };
    return defaults[permitType] || 100;
  }

  /**
   * Get default valuation rate by permit type
   */
  private getDefaultValuationRate(permitType: string): number {
    const defaults: Record<string, number> = {
      BUILDING: 0.01, // 1%
      ELECTRICAL: 0.005, // 0.5%
      PLUMBING: 0.005,
      MECHANICAL: 0.005,
      FIRE: 0.003, // 0.3%
      GRADING: 0.015, // 1.5%
      DEMOLITION: 0.008, // 0.8%
      SIGN: 0.002, // 0.2%
      FENCE: 0.001, // 0.1%
      ROOFING: 0.003,
      HVAC: 0.005,
      SOLAR: 0.008,
      POOL: 0.01,
    };
    return defaults[permitType] || 0.01;
  }

  /**
   * Estimate fees before full calculation
   */
  estimateFees(
    permitType: string,
    valuation: number,
    squareFootage?: number
  ): {min: number; max: number; estimated: number} {
    const baseFee = this.getDefaultBaseFee(permitType);
    const rate = this.getDefaultValuationRate(permitType);
    const valuationFee = valuation * rate;

    const estimated = baseFee + valuationFee;
    const min = baseFee;
    const max = estimated * 1.5; // 50% buffer

    return {min, max, estimated};
  }
}

// Singleton instance
export const feeCalculatorService = new FeeCalculatorService();
