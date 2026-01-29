/**
 * Assembly Calculator
 * Calculate assembly costs with various adjustments
 */

import Decimal from 'decimal.js';
import { Assembly, AssemblyComponent } from './assembly-builder.js';
import { regionalAdjustmentManager } from '../cost-database/regional-adjustment.js';

export interface AssemblyCalculation {
  assembly: Assembly;
  quantity: number;
  unit: string;
  baseCost: CostBreakdown;
  adjustedCost: CostBreakdown;
  adjustments: Adjustment[];
  finalCost: Decimal;
  unitCost: Decimal;
  laborHours: Decimal;
  duration: number; // days
}

export interface CostBreakdown {
  material: Decimal;
  labor: Decimal;
  equipment: Decimal;
  subtotal: Decimal;
  markup: Decimal;
  total: Decimal;
}

export interface Adjustment {
  name: string;
  type: 'MULTIPLIER' | 'FIXED' | 'PERCENTAGE';
  value: Decimal;
  appliedTo: 'MATERIAL' | 'LABOR' | 'EQUIPMENT' | 'SUBTOTAL' | 'TOTAL';
  amount: Decimal;
}

export interface CalculationOptions {
  quantity?: number;
  regionalLocation?: { state: string; city?: string };
  markup?: number;
  contingency?: number;
  productionRate?: number; // override assembly productionRate
  laborRateMultiplier?: number;
  materialPriceMultiplier?: number;
  roundTo?: number;
  adjustments?: Array<{
    name: string;
    type: Adjustment['type'];
    value: number;
    appliedTo: Adjustment['appliedTo'];
  }>;
}

export class AssemblyCalculator {
  /**
   * Calculate assembly cost
   */
  async calculate(
    assembly: Assembly,
    options?: CalculationOptions
  ): Promise<AssemblyCalculation> {
    const quantity = options?.quantity || 1;
    const adjustments: Adjustment[] = [];

    // Calculate base costs
    let materialCost = assembly.materialCost.times(quantity);
    let laborCost = assembly.laborCost.times(quantity);
    let equipmentCost = assembly.equipmentCost.times(quantity);

    // Apply labor rate multiplier
    if (options?.laborRateMultiplier) {
      const multiplier = new Decimal(options.laborRateMultiplier);
      const adjustment = laborCost.times(multiplier.minus(1));
      adjustments.push({
        name: 'Labor Rate Adjustment',
        type: 'MULTIPLIER',
        value: multiplier,
        appliedTo: 'LABOR',
        amount: adjustment,
      });
      laborCost = laborCost.times(multiplier);
    }

    // Apply material price multiplier
    if (options?.materialPriceMultiplier) {
      const multiplier = new Decimal(options.materialPriceMultiplier);
      const adjustment = materialCost.times(multiplier.minus(1));
      adjustments.push({
        name: 'Material Price Adjustment',
        type: 'MULTIPLIER',
        value: multiplier,
        appliedTo: 'MATERIAL',
        amount: adjustment,
      });
      materialCost = materialCost.times(multiplier);
    }

    // Apply regional adjustments
    if (options?.regionalLocation) {
      const regionalAdj = await regionalAdjustmentManager.adjustEstimate(
        {
          materialCost: materialCost.toNumber(),
          laborCost: laborCost.toNumber(),
          equipmentCost: equipmentCost.toNumber(),
        },
        { state: 'US' }, // Base from national average
        options.regionalLocation
      );

      if (!regionalAdj.overallFactor.equals(1)) {
        adjustments.push({
          name: `Regional Adjustment (${options.regionalLocation.state})`,
          type: 'MULTIPLIER',
          value: regionalAdj.overallFactor,
          appliedTo: 'TOTAL',
          amount: regionalAdj.totalAdjusted.minus(
            materialCost.plus(laborCost).plus(equipmentCost)
          ),
        });

        materialCost = regionalAdj.materialCost.adjustedCost;
        laborCost = regionalAdj.laborCost.adjustedCost;
        equipmentCost = regionalAdj.equipmentCost.adjustedCost;
      }
    }

    // Calculate subtotal
    let subtotal = materialCost.plus(laborCost).plus(equipmentCost);

    // Apply custom adjustments
    if (options?.adjustments) {
      for (const adj of options.adjustments) {
        const adjustment = this.applyAdjustment(
          adj,
          materialCost,
          laborCost,
          equipmentCost,
          subtotal
        );
        adjustments.push(adjustment);

        switch (adj.appliedTo) {
          case 'MATERIAL':
            materialCost = materialCost.plus(adjustment.amount);
            break;
          case 'LABOR':
            laborCost = laborCost.plus(adjustment.amount);
            break;
          case 'EQUIPMENT':
            equipmentCost = equipmentCost.plus(adjustment.amount);
            break;
          case 'SUBTOTAL':
          case 'TOTAL':
            subtotal = subtotal.plus(adjustment.amount);
            break;
        }
      }
    }

    // Recalculate subtotal after adjustments
    subtotal = materialCost.plus(laborCost).plus(equipmentCost);

    // Apply markup
    let markup = new Decimal(0);
    if (options?.markup) {
      markup = subtotal.times(options.markup / 100);
      adjustments.push({
        name: 'Markup',
        type: 'PERCENTAGE',
        value: new Decimal(options.markup),
        appliedTo: 'SUBTOTAL',
        amount: markup,
      });
    }

    // Apply contingency
    let contingency = new Decimal(0);
    if (options?.contingency) {
      contingency = subtotal.plus(markup).times(options.contingency / 100);
      adjustments.push({
        name: 'Contingency',
        type: 'PERCENTAGE',
        value: new Decimal(options.contingency),
        appliedTo: 'TOTAL',
        amount: contingency,
      });
    }

    // Calculate final cost
    let finalCost = subtotal.plus(markup).plus(contingency);

    // Round if specified
    if (options?.roundTo) {
      finalCost = finalCost.toDecimalPlaces(options.roundTo, Decimal.ROUND_HALF_UP);
    }

    // Calculate labor hours and duration
    const laborHours = assembly.laborHours.times(quantity);
    const productionRate = options?.productionRate || assembly.productionRate || 1;
    const duration = Math.ceil(quantity / productionRate);

    // Build base cost breakdown
    const baseCost: CostBreakdown = {
      material: assembly.materialCost.times(quantity),
      labor: assembly.laborCost.times(quantity),
      equipment: assembly.equipmentCost.times(quantity),
      subtotal: assembly.unitCost.times(quantity),
      markup: new Decimal(0),
      total: assembly.unitCost.times(quantity),
    };

    // Build adjusted cost breakdown
    const adjustedCost: CostBreakdown = {
      material: materialCost,
      labor: laborCost,
      equipment: equipmentCost,
      subtotal,
      markup,
      total: finalCost,
    };

    return {
      assembly,
      quantity,
      unit: assembly.unit,
      baseCost,
      adjustedCost,
      adjustments,
      finalCost,
      unitCost: quantity > 0 ? finalCost.dividedBy(quantity) : new Decimal(0),
      laborHours,
      duration,
    };
  }

  /**
   * Calculate multiple assemblies
   */
  async calculateMultiple(
    assemblies: { assembly: Assembly; quantity: number }[],
    options?: Omit<CalculationOptions, 'quantity'>
  ): Promise<{
    calculations: AssemblyCalculation[];
    totals: CostBreakdown;
    totalLaborHours: Decimal;
    totalDuration: number;
  }> {
    const calculations = await Promise.all(
      assemblies.map(({ assembly, quantity }) =>
        this.calculate(assembly, { ...options, quantity })
      )
    );

    const totals: CostBreakdown = {
      material: new Decimal(0),
      labor: new Decimal(0),
      equipment: new Decimal(0),
      subtotal: new Decimal(0),
      markup: new Decimal(0),
      total: new Decimal(0),
    };

    let totalLaborHours = new Decimal(0);
    let totalDuration = 0;

    for (const calc of calculations) {
      totals.material = totals.material.plus(calc.adjustedCost.material);
      totals.labor = totals.labor.plus(calc.adjustedCost.labor);
      totals.equipment = totals.equipment.plus(calc.adjustedCost.equipment);
      totals.subtotal = totals.subtotal.plus(calc.adjustedCost.subtotal);
      totals.markup = totals.markup.plus(calc.adjustedCost.markup);
      totals.total = totals.total.plus(calc.finalCost);
      totalLaborHours = totalLaborHours.plus(calc.laborHours);
      totalDuration = Math.max(totalDuration, calc.duration);
    }

    return {
      calculations,
      totals,
      totalLaborHours,
      totalDuration,
    };
  }

  /**
   * Compare calculation scenarios
   */
  async compareScenarios(
    assembly: Assembly,
    quantity: number,
    scenarios: {
      name: string;
      options: CalculationOptions;
    }[]
  ): Promise<
    {
      name: string;
      calculation: AssemblyCalculation;
      vsBase: {
        difference: Decimal;
        percentChange: number;
      };
    }[]
  > {
    const baseCalc = await this.calculate(assembly, { quantity });

    const results = await Promise.all(
      scenarios.map(async (scenario) => {
        const calc = await this.calculate(assembly, {
          quantity,
          ...scenario.options,
        });

        const difference = calc.finalCost.minus(baseCalc.finalCost);
        const percentChange = baseCalc.finalCost.gt(0)
          ? difference.dividedBy(baseCalc.finalCost).times(100).toNumber()
          : 0;

        return {
          name: scenario.name,
          calculation: calc,
          vsBase: { difference, percentChange },
        };
      })
    );

    return results;
  }

  /**
   * Calculate component cost
   */
  calculateComponentCost(
    component: AssemblyComponent,
    quantity: number = 1,
    options?: {
      wasteOverride?: number;
      unitCostOverride?: number;
    }
  ): {
    quantity: Decimal;
    unitCost: Decimal;
    wasteFactor: Decimal;
    grossQuantity: Decimal;
    totalCost: Decimal;
  } {
    const componentQty = component.quantity.times(quantity);
    const unitCost = options?.unitCostOverride
      ? new Decimal(options.unitCostOverride)
      : component.unitCost;
    const wastePercent = options?.wasteOverride ?? component.wastePercent ?? 0;
    const wasteFactor = new Decimal(1 + wastePercent / 100);
    const grossQuantity = componentQty.times(wasteFactor);
    const totalCost = grossQuantity.times(unitCost);

    return {
      quantity: componentQty,
      unitCost,
      wasteFactor,
      grossQuantity,
      totalCost,
    };
  }

  /**
   * Get cost per unit breakdown
   */
  getCostPerUnit(
    calculation: AssemblyCalculation
  ): {
    material: Decimal;
    labor: Decimal;
    equipment: Decimal;
    markup: Decimal;
    total: Decimal;
  } {
    const qty = calculation.quantity || 1;
    return {
      material: calculation.adjustedCost.material.dividedBy(qty),
      labor: calculation.adjustedCost.labor.dividedBy(qty),
      equipment: calculation.adjustedCost.equipment.dividedBy(qty),
      markup: calculation.adjustedCost.markup.dividedBy(qty),
      total: calculation.unitCost,
    };
  }

  /**
   * Apply adjustment to costs
   */
  private applyAdjustment(
    adj: {
      name: string;
      type: Adjustment['type'];
      value: number;
      appliedTo: Adjustment['appliedTo'];
    },
    material: Decimal,
    labor: Decimal,
    equipment: Decimal,
    subtotal: Decimal
  ): Adjustment {
    const value = new Decimal(adj.value);
    let base: Decimal;

    switch (adj.appliedTo) {
      case 'MATERIAL':
        base = material;
        break;
      case 'LABOR':
        base = labor;
        break;
      case 'EQUIPMENT':
        base = equipment;
        break;
      case 'SUBTOTAL':
      case 'TOTAL':
        base = subtotal;
        break;
    }

    let amount: Decimal;
    switch (adj.type) {
      case 'MULTIPLIER':
        amount = base.times(value.minus(1));
        break;
      case 'PERCENTAGE':
        amount = base.times(value.dividedBy(100));
        break;
      case 'FIXED':
        amount = value;
        break;
    }

    return {
      name: adj.name,
      type: adj.type,
      value,
      appliedTo: adj.appliedTo,
      amount,
    };
  }
}

export const assemblyCalculator = new AssemblyCalculator();
