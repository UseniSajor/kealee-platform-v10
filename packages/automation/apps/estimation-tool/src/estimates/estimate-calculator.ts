/**
 * Estimate Calculator
 * Calculate totals, markups, and adjustments
 */

import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';
import { EstimateTotals, EstimateSettings } from './estimate-builder.js';

const prisma = new PrismaClient();

export interface CalculationOptions {
  applyMarkup?: boolean;
  applyContingency?: boolean;
  applyOverhead?: boolean;
  applyProfit?: boolean;
  applyTax?: boolean;
  applyBond?: boolean;
  applyInsurance?: boolean;
  applyPermit?: boolean;
  regionalAdjustment?: number;
  customMarkups?: { name: string; percent: number }[];
}

export interface CalculationResult {
  totals: EstimateTotals;
  breakdown: CostBreakdown;
  adjustments: AdjustmentDetail[];
  warnings: string[];
}

export interface CostBreakdown {
  directCosts: {
    material: { amount: number; percent: number };
    labor: { amount: number; percent: number };
    equipment: { amount: number; percent: number };
    subcontractor: { amount: number; percent: number };
    other: { amount: number; percent: number };
  };
  indirectCosts: {
    markup: { amount: number; percent: number };
    contingency: { amount: number; percent: number };
    overhead: { amount: number; percent: number };
    profit: { amount: number; percent: number };
    bond: { amount: number; percent: number };
    insurance: { amount: number; percent: number };
    permit: { amount: number; percent: number };
    tax: { amount: number; percent: number };
  };
}

export interface AdjustmentDetail {
  name: string;
  type: 'MARKUP' | 'CONTINGENCY' | 'OVERHEAD' | 'PROFIT' | 'TAX' | 'OTHER';
  baseAmount: number;
  rate: number;
  amount: number;
}

export class EstimateCalculator {
  /**
   * Calculate estimate totals
   */
  async calculateEstimate(
    estimateId: string,
    options?: CalculationOptions
  ): Promise<CalculationResult> {
    const estimate = await prisma.estimate.findUnique({
      where: { id: estimateId },
      include: {
        sections: {
          include: {
            lineItems: true,
          },
        },
      },
    });

    if (!estimate) {
      throw new Error('Estimate not found');
    }

    // Settings are stored in metadata, not as a direct field
    const metadata = (estimate.metadata as Record<string, unknown>) || {};
    const settings = (metadata.settings as EstimateSettings) || {
      defaultMarkup: 0,
      defaultContingency: 5,
      includeTax: false,
      taxRate: Number(estimate.taxRate) || 0,
      roundTo: 2,
      showUnitCosts: true,
      groupByDivision: true,
      defaultWastePercent: 10,
      laborBurdenRate: 35,
      overheadPercent: Number(estimate.overheadPercent) || 10,
      profitPercent: Number(estimate.profitPercent) || 10,
    };
    const warnings: string[] = [];
    const adjustments: AdjustmentDetail[] = [];

    // Calculate direct costs from line items
    let materialCost = new Decimal(0);
    let laborCost = new Decimal(0);
    let equipmentCost = new Decimal(0);
    let subcontractorCost = new Decimal(0);
    let otherCost = new Decimal(0);

    for (const section of estimate.sections) {
      for (const item of section.lineItems) {
        // Use correct field names: materialCostAmt, equipmentCostAmt
        materialCost = materialCost.plus(item.materialCostAmt || 0);
        laborCost = laborCost.plus(item.laborCost || 0);
        equipmentCost = equipmentCost.plus(item.equipmentCostAmt || 0);
        subcontractorCost = subcontractorCost.plus(item.subcontractorCost || 0);

        // Calculate other costs (total - known costs)
        const knownCosts = new Decimal(item.materialCostAmt || 0)
          .plus(item.laborCost || 0)
          .plus(item.equipmentCostAmt || 0)
          .plus(item.subcontractorCost || 0);
        const totalCost = new Decimal(item.totalCost || 0);
        if (totalCost.greaterThan(knownCosts)) {
          otherCost = otherCost.plus(totalCost.minus(knownCosts));
        }
      }
    }

    // Apply regional adjustment if provided
    if (options?.regionalAdjustment && options.regionalAdjustment !== 1) {
      const factor = new Decimal(options.regionalAdjustment);
      materialCost = materialCost.times(factor);
      laborCost = laborCost.times(factor);
      equipmentCost = equipmentCost.times(factor);
    }

    const directCost = materialCost
      .plus(laborCost)
      .plus(equipmentCost)
      .plus(subcontractorCost)
      .plus(otherCost);

    let subtotal = directCost;
    let markupAmount = new Decimal(0);
    let contingencyAmount = new Decimal(0);
    let overheadAmount = new Decimal(0);
    let profitAmount = new Decimal(0);
    let bondCost = new Decimal(0);
    let insuranceCost = new Decimal(0);
    let permitCost = new Decimal(0);
    let taxAmount = new Decimal(0);

    // Apply markup
    if (options?.applyMarkup !== false && settings.defaultMarkup > 0) {
      markupAmount = subtotal.times(settings.defaultMarkup / 100);
      subtotal = subtotal.plus(markupAmount);
      adjustments.push({
        name: 'Markup',
        type: 'MARKUP',
        baseAmount: directCost.toNumber(),
        rate: settings.defaultMarkup,
        amount: markupAmount.toNumber(),
      });
    }

    // Apply custom markups
    if (options?.customMarkups) {
      for (const markup of options.customMarkups) {
        const amount = subtotal.times(markup.percent / 100);
        subtotal = subtotal.plus(amount);
        markupAmount = markupAmount.plus(amount);
        adjustments.push({
          name: markup.name,
          type: 'MARKUP',
          baseAmount: subtotal.minus(amount).toNumber(),
          rate: markup.percent,
          amount: amount.toNumber(),
        });
      }
    }

    // Apply contingency
    if (options?.applyContingency !== false && settings.defaultContingency > 0) {
      contingencyAmount = subtotal.times(settings.defaultContingency / 100);
      subtotal = subtotal.plus(contingencyAmount);
      adjustments.push({
        name: 'Contingency',
        type: 'CONTINGENCY',
        baseAmount: subtotal.minus(contingencyAmount).toNumber(),
        rate: settings.defaultContingency,
        amount: contingencyAmount.toNumber(),
      });
    }

    // Apply overhead
    if (options?.applyOverhead !== false && settings.overheadPercent > 0) {
      overheadAmount = subtotal.times(settings.overheadPercent / 100);
      subtotal = subtotal.plus(overheadAmount);
      adjustments.push({
        name: 'Overhead',
        type: 'OVERHEAD',
        baseAmount: subtotal.minus(overheadAmount).toNumber(),
        rate: settings.overheadPercent,
        amount: overheadAmount.toNumber(),
      });
    }

    // Apply profit
    if (options?.applyProfit !== false && settings.profitPercent > 0) {
      profitAmount = subtotal.times(settings.profitPercent / 100);
      subtotal = subtotal.plus(profitAmount);
      adjustments.push({
        name: 'Profit',
        type: 'PROFIT',
        baseAmount: subtotal.minus(profitAmount).toNumber(),
        rate: settings.profitPercent,
        amount: profitAmount.toNumber(),
      });
    }

    // Apply tax
    if (options?.applyTax !== false && settings.includeTax && settings.taxRate > 0) {
      // Tax typically applies to materials only
      taxAmount = materialCost.times(settings.taxRate / 100);
      subtotal = subtotal.plus(taxAmount);
      adjustments.push({
        name: 'Sales Tax',
        type: 'TAX',
        baseAmount: materialCost.toNumber(),
        rate: settings.taxRate,
        amount: taxAmount.toNumber(),
      });
    }

    const grandTotal = subtotal;

    // Build totals
    const totals: EstimateTotals = {
      directCost: directCost.toDecimalPlaces(settings.roundTo).toNumber(),
      materialCost: materialCost.toDecimalPlaces(settings.roundTo).toNumber(),
      laborCost: laborCost.toDecimalPlaces(settings.roundTo).toNumber(),
      equipmentCost: equipmentCost.toDecimalPlaces(settings.roundTo).toNumber(),
      subcontractorCost: subcontractorCost.toDecimalPlaces(settings.roundTo).toNumber(),
      otherCost: otherCost.toDecimalPlaces(settings.roundTo).toNumber(),
      subtotal: directCost.toDecimalPlaces(settings.roundTo).toNumber(),
      markup: settings.defaultMarkup,
      markupAmount: markupAmount.toDecimalPlaces(settings.roundTo).toNumber(),
      contingency: settings.defaultContingency,
      contingencyAmount: contingencyAmount.toDecimalPlaces(settings.roundTo).toNumber(),
      overhead: settings.overheadPercent,
      overheadAmount: overheadAmount.toDecimalPlaces(settings.roundTo).toNumber(),
      profit: settings.profitPercent,
      profitAmount: profitAmount.toDecimalPlaces(settings.roundTo).toNumber(),
      bondCost: bondCost.toDecimalPlaces(settings.roundTo).toNumber(),
      insuranceCost: insuranceCost.toDecimalPlaces(settings.roundTo).toNumber(),
      permitCost: permitCost.toDecimalPlaces(settings.roundTo).toNumber(),
      tax: settings.taxRate,
      taxAmount: taxAmount.toDecimalPlaces(settings.roundTo).toNumber(),
      grandTotal: grandTotal.toDecimalPlaces(settings.roundTo).toNumber(),
    };

    // Build breakdown
    const breakdown = this.buildBreakdown(totals);

    // Generate warnings
    if (directCost.equals(0)) {
      warnings.push('Estimate has no direct costs');
    }
    if (laborCost.greaterThan(materialCost.times(2))) {
      warnings.push('Labor costs are unusually high relative to materials');
    }

    // Update estimate with calculated totals (flat fields, not nested 'totals' object)
    await prisma.estimate.update({
      where: { id: estimateId },
      data: {
        subtotalMaterial: totals.materialCost,
        subtotalLabor: totals.laborCost,
        subtotalEquipment: totals.equipmentCost,
        subtotalSubcontractor: totals.subcontractorCost,
        subtotalOther: totals.otherCost,
        subtotalDirect: totals.directCost,
        overhead: totals.overheadAmount,
        overheadPercent: totals.overhead,
        profit: totals.profitAmount,
        profitPercent: totals.profit,
        contingency: totals.contingencyAmount,
        contingencyPercent: totals.contingency,
        bondCost: totals.bondCost,
        permitFees: totals.permitCost,
        insuranceCost: totals.insuranceCost,
        taxRate: totals.tax,
        salesTax: totals.taxAmount,
        totalCost: totals.grandTotal,
        updatedAt: new Date(),
      },
    });

    // Update section totals
    await this.updateSectionTotals(estimateId);

    return { totals, breakdown, adjustments, warnings };
  }

  /**
   * Build cost breakdown
   */
  private buildBreakdown(totals: EstimateTotals): CostBreakdown {
    const grandTotal = totals.grandTotal || 1;

    return {
      directCosts: {
        material: {
          amount: totals.materialCost,
          percent: (totals.materialCost / grandTotal) * 100,
        },
        labor: {
          amount: totals.laborCost,
          percent: (totals.laborCost / grandTotal) * 100,
        },
        equipment: {
          amount: totals.equipmentCost,
          percent: (totals.equipmentCost / grandTotal) * 100,
        },
        subcontractor: {
          amount: totals.subcontractorCost,
          percent: (totals.subcontractorCost / grandTotal) * 100,
        },
        other: {
          amount: totals.otherCost,
          percent: (totals.otherCost / grandTotal) * 100,
        },
      },
      indirectCosts: {
        markup: {
          amount: totals.markupAmount,
          percent: (totals.markupAmount / grandTotal) * 100,
        },
        contingency: {
          amount: totals.contingencyAmount,
          percent: (totals.contingencyAmount / grandTotal) * 100,
        },
        overhead: {
          amount: totals.overheadAmount,
          percent: (totals.overheadAmount / grandTotal) * 100,
        },
        profit: {
          amount: totals.profitAmount,
          percent: (totals.profitAmount / grandTotal) * 100,
        },
        bond: {
          amount: totals.bondCost,
          percent: (totals.bondCost / grandTotal) * 100,
        },
        insurance: {
          amount: totals.insuranceCost,
          percent: (totals.insuranceCost / grandTotal) * 100,
        },
        permit: {
          amount: totals.permitCost,
          percent: (totals.permitCost / grandTotal) * 100,
        },
        tax: {
          amount: totals.taxAmount,
          percent: (totals.taxAmount / grandTotal) * 100,
        },
      },
    };
  }

  /**
   * Update section totals
   */
  private async updateSectionTotals(estimateId: string): Promise<void> {
    const sections = await prisma.estimateSection.findMany({
      where: { estimateId },
      include: { lineItems: true },
    });

    for (const section of sections) {
      let totalCost = new Decimal(0);
      let materialCost = new Decimal(0);
      let laborCost = new Decimal(0);
      let equipmentCost = new Decimal(0);
      let subcontractorCost = new Decimal(0);
      let otherCost = new Decimal(0);

      for (const item of section.lineItems) {
        // Use correct field names: materialCostAmt, equipmentCostAmt
        materialCost = materialCost.plus(item.materialCostAmt || 0);
        laborCost = laborCost.plus(item.laborCost || 0);
        equipmentCost = equipmentCost.plus(item.equipmentCostAmt || 0);
        subcontractorCost = subcontractorCost.plus(item.subcontractorCost || 0);
        totalCost = totalCost.plus(item.totalCost || 0);
      }

      // Calculate other costs
      const knownCosts = materialCost.plus(laborCost).plus(equipmentCost).plus(subcontractorCost);
      if (totalCost.greaterThan(knownCosts)) {
        otherCost = totalCost.minus(knownCosts);
      }

      // Use flat fields for EstimateSection, NOT nested 'totals' object
      await prisma.estimateSection.update({
        where: { id: section.id },
        data: {
          subtotalMaterial: materialCost.toNumber(),
          subtotalLabor: laborCost.toNumber(),
          subtotalEquipment: equipmentCost.toNumber(),
          subtotalSubcontractor: subcontractorCost.toNumber(),
          subtotalOther: otherCost.toNumber(),
          total: totalCost.toNumber(),
          updatedAt: new Date(),
        },
      });
    }
  }

  /**
   * Calculate line item cost
   */
  calculateLineItemCost(
    quantity: number,
    unitCost: number,
    options?: {
      wastePercent?: number;
      markup?: number;
      laborRate?: number;
      laborHours?: number;
      equipmentRate?: number;
      equipmentHours?: number;
    }
  ): {
    netQuantity: number;
    grossQuantity: number;
    materialCost: number;
    laborCost: number;
    equipmentCost: number;
    totalCost: number;
  } {
    const wastePercent = options?.wastePercent || 0;
    const grossQuantity = quantity * (1 + wastePercent / 100);
    const materialCost = new Decimal(grossQuantity).times(unitCost);

    const laborCost = options?.laborRate && options?.laborHours
      ? new Decimal(options.laborRate).times(options.laborHours)
      : new Decimal(0);

    const equipmentCost = options?.equipmentRate && options?.equipmentHours
      ? new Decimal(options.equipmentRate).times(options.equipmentHours)
      : new Decimal(0);

    let totalCost = materialCost.plus(laborCost).plus(equipmentCost);

    if (options?.markup) {
      totalCost = totalCost.times(1 + options.markup / 100);
    }

    return {
      netQuantity: quantity,
      grossQuantity,
      materialCost: materialCost.toNumber(),
      laborCost: laborCost.toNumber(),
      equipmentCost: equipmentCost.toNumber(),
      totalCost: totalCost.toNumber(),
    };
  }

  /**
   * Compare two estimates
   */
  async compareEstimates(
    estimateId1: string,
    estimateId2: string
  ): Promise<{
    estimate1: { id: string; name: string; total: number };
    estimate2: { id: string; name: string; total: number };
    difference: number;
    percentDifference: number;
    categoryComparison: {
      category: string;
      estimate1: number;
      estimate2: number;
      difference: number;
    }[];
    itemComparison: {
      code: string;
      name: string;
      estimate1Qty: number;
      estimate2Qty: number;
      estimate1Cost: number;
      estimate2Cost: number;
      qtyDifference: number;
      costDifference: number;
    }[];
  }> {
    const [est1, est2] = await Promise.all([
      prisma.estimate.findUnique({
        where: { id: estimateId1 },
        include: {
          sections: {
            include: { lineItems: true },
          },
        },
      }),
      prisma.estimate.findUnique({
        where: { id: estimateId2 },
        include: {
          sections: {
            include: { lineItems: true },
          },
        },
      }),
    ]);

    if (!est1 || !est2) {
      throw new Error('One or both estimates not found');
    }

    // Use flat fields instead of nested 'totals' object
    const total1 = Number(est1.totalCost) || 0;
    const total2 = Number(est2.totalCost) || 0;

    const difference = total2 - total1;
    const percentDifference = total1 ? (difference / total1) * 100 : 0;

    // Category comparison - use csiCode instead of code
    const categoryMap = new Map<string, { est1: number; est2: number }>();

    for (const section of est1.sections) {
      const code = section.csiCode?.substring(0, 2) || 'OTHER';
      const existing = categoryMap.get(code) || { est1: 0, est2: 0 };
      existing.est1 += Number(section.total) || 0;
      categoryMap.set(code, existing);
    }

    for (const section of est2.sections) {
      const code = section.csiCode?.substring(0, 2) || 'OTHER';
      const existing = categoryMap.get(code) || { est1: 0, est2: 0 };
      existing.est2 += Number(section.total) || 0;
      categoryMap.set(code, existing);
    }

    const categoryComparison = Array.from(categoryMap.entries()).map(
      ([category, values]) => ({
        category,
        estimate1: values.est1,
        estimate2: values.est2,
        difference: values.est2 - values.est1,
      })
    );

    // Item comparison - use csiCode instead of code, description instead of name
    const itemMap = new Map<
      string,
      {
        name: string;
        est1Qty: number;
        est2Qty: number;
        est1Cost: number;
        est2Cost: number;
      }
    >();

    for (const section of est1.sections) {
      for (const item of section.lineItems) {
        const itemCode = item.csiCode || item.id;
        const existing = itemMap.get(itemCode) || {
          name: item.description,
          est1Qty: 0,
          est2Qty: 0,
          est1Cost: 0,
          est2Cost: 0,
        };
        existing.est1Qty += Number(item.quantity) || 0;
        existing.est1Cost += Number(item.totalCost) || 0;
        itemMap.set(itemCode, existing);
      }
    }

    for (const section of est2.sections) {
      for (const item of section.lineItems) {
        const itemCode = item.csiCode || item.id;
        const existing = itemMap.get(itemCode) || {
          name: item.description,
          est1Qty: 0,
          est2Qty: 0,
          est1Cost: 0,
          est2Cost: 0,
        };
        existing.est2Qty += Number(item.quantity) || 0;
        existing.est2Cost += Number(item.totalCost) || 0;
        itemMap.set(itemCode, existing);
      }
    }

    const itemComparison = Array.from(itemMap.entries())
      .map(([code, values]) => ({
        code,
        name: values.name,
        estimate1Qty: values.est1Qty,
        estimate2Qty: values.est2Qty,
        estimate1Cost: values.est1Cost,
        estimate2Cost: values.est2Cost,
        qtyDifference: values.est2Qty - values.est1Qty,
        costDifference: values.est2Cost - values.est1Cost,
      }))
      .filter(
        item => item.qtyDifference !== 0 || item.costDifference !== 0
      );

    return {
      estimate1: { id: est1.id, name: est1.name, total: total1 },
      estimate2: { id: est2.id, name: est2.name, total: total2 },
      difference,
      percentDifference,
      categoryComparison,
      itemComparison,
    };
  }

  /**
   * What-if analysis
   */
  async whatIfAnalysis(
    estimateId: string,
    scenarios: {
      name: string;
      adjustments: {
        type: 'MATERIAL' | 'LABOR' | 'EQUIPMENT' | 'MARKUP' | 'CONTINGENCY';
        percentChange: number;
      }[];
    }[]
  ): Promise<{
    baseline: number;
    scenarios: {
      name: string;
      total: number;
      difference: number;
      percentChange: number;
    }[];
  }> {
    const estimate = await prisma.estimate.findUnique({
      where: { id: estimateId },
    });

    if (!estimate) {
      throw new Error('Estimate not found');
    }

    // Use flat fields instead of nested 'totals' object
    const baseline = Number(estimate.totalCost) || 0;
    const materialCost = Number(estimate.subtotalMaterial) || 0;
    const laborCost = Number(estimate.subtotalLabor) || 0;
    const equipmentCost = Number(estimate.subtotalEquipment) || 0;
    const directCost = Number(estimate.subtotalDirect) || 0;

    const results = scenarios.map(scenario => {
      let adjustedTotal = new Decimal(baseline);

      for (const adjustment of scenario.adjustments) {
        switch (adjustment.type) {
          case 'MATERIAL':
            const materialChange = new Decimal(materialCost)
              .times(adjustment.percentChange / 100);
            adjustedTotal = adjustedTotal.plus(materialChange);
            break;
          case 'LABOR':
            const laborChange = new Decimal(laborCost)
              .times(adjustment.percentChange / 100);
            adjustedTotal = adjustedTotal.plus(laborChange);
            break;
          case 'EQUIPMENT':
            const equipChange = new Decimal(equipmentCost)
              .times(adjustment.percentChange / 100);
            adjustedTotal = adjustedTotal.plus(equipChange);
            break;
          case 'MARKUP':
            const markupChange = new Decimal(directCost)
              .times(adjustment.percentChange / 100);
            adjustedTotal = adjustedTotal.plus(markupChange);
            break;
          case 'CONTINGENCY':
            const contingencyChange = new Decimal(directCost)
              .times(adjustment.percentChange / 100);
            adjustedTotal = adjustedTotal.plus(contingencyChange);
            break;
        }
      }

      const total = adjustedTotal.toNumber();
      return {
        name: scenario.name,
        total,
        difference: total - baseline,
        percentChange: baseline > 0 ? ((total - baseline) / baseline) * 100 : 0,
      };
    });

    return { baseline, scenarios: results };
  }
}

export const estimateCalculator = new EstimateCalculator();
