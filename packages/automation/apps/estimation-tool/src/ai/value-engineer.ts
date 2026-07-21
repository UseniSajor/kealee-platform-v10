/**
 * Value Engineer
 * AI-powered value engineering analysis
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID as uuid } from 'crypto';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

export interface ValueEngineeringResult {
  id: string;
  estimateId: string;
  totalPotentialSavings: number;
  opportunities: VEOpportunity[];
  summary: VESummary;
  analyzedAt: Date;
}

export interface VEOpportunity {
  id: string;
  type: VEType;
  category: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  currentCost: number;
  proposedCost: number;
  potentialSavings: number;
  savingsPercent: number;
  affectedItems: {
    code: string;
    name: string;
    currentCost: number;
    proposedCost: number;
  }[];
  considerations: string[];
  implementationNotes: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  approvalRequired: boolean;
}

export type VEType =
  | 'MATERIAL_SUBSTITUTION'
  | 'DESIGN_SIMPLIFICATION'
  | 'SPECIFICATION_REDUCTION'
  | 'QUANTITY_OPTIMIZATION'
  | 'SCOPE_REDUCTION'
  | 'PROCESS_IMPROVEMENT'
  | 'BULK_PROCUREMENT'
  | 'STANDARDIZATION'
  | 'PHASING_ADJUSTMENT';

export interface VESummary {
  totalOpportunities: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
  byCategory: { category: string; savings: number; count: number }[];
  byType: { type: VEType; savings: number; count: number }[];
  implementationComplexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX';
}

export interface VEOptions {
  targetSavingsPercent?: number;
  excludeCategories?: string[];
  excludeTypes?: VEType[];
  considerQuality?: boolean;
  maxRiskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export class ValueEngineer {
  /**
   * Analyze estimate for value engineering opportunities
   */
  async analyzeVE(
    estimateId: string,
    options?: VEOptions
  ): Promise<ValueEngineeringResult> {
    const estimate = await prisma.estimate.findUnique({
      where: { id: estimateId },
      include: {
        sections: {
          include: { lineItems: true },
        },
      },
    });

    if (!estimate) {
      throw new Error('Estimate not found');
    }

    const opportunities: VEOpportunity[] = [];

    // Analyze each section for opportunities
    for (const section of estimate.sections) {
      // Skip excluded categories
      if (options?.excludeCategories?.some(c => section.csiCode?.startsWith(c))) {
        continue;
      }

      const sectionOpportunities = await this.analyzeSectionVE(
        section,
        estimate,
        options
      );
      opportunities.push(...sectionOpportunities);
    }

    // Analyze cross-section opportunities
    const crossSectionOpportunities = await this.analyzeCrossSectionVE(
      estimate,
      options
    );
    opportunities.push(...crossSectionOpportunities);

    // Filter by max risk level
    let filteredOpportunities = opportunities;
    if (options?.maxRiskLevel) {
      const riskLevels = ['LOW', 'MEDIUM', 'HIGH'];
      const maxIndex = riskLevels.indexOf(options.maxRiskLevel);
      filteredOpportunities = opportunities.filter(
        o => riskLevels.indexOf(o.riskLevel) <= maxIndex
      );
    }

    // Filter by excluded types
    if (options?.excludeTypes) {
      filteredOpportunities = filteredOpportunities.filter(
        o => !options.excludeTypes!.includes(o.type)
      );
    }

    // Sort by potential savings
    filteredOpportunities.sort((a, b) => b.potentialSavings - a.potentialSavings);

    // Calculate total potential savings
    const totalPotentialSavings = filteredOpportunities.reduce(
      (sum, o) => sum + o.potentialSavings,
      0
    );

    // Build summary
    const summary = this.buildSummary(filteredOpportunities);

    const result: ValueEngineeringResult = {
      id: uuid(),
      estimateId,
      totalPotentialSavings,
      opportunities: filteredOpportunities,
      summary,
      analyzedAt: new Date(),
    };

    // Save result
    await this.saveVEResult(result);

    return result;
  }

  /**
   * Analyze section for VE opportunities
   */
  private async analyzeSectionVE(
    section: any,
    estimate: any,
    options?: VEOptions
  ): Promise<VEOpportunity[]> {
    const opportunities: VEOpportunity[] = [];
    // Use flat fields from EstimateSection instead of nested 'totals'
    const sectionDirectCost = Number(section.subtotalDirect) || 1;

    // Check for high-cost items
    const highCostItems = section.lineItems.filter(
      (item: any) => {
        const itemCost = Number(item.totalCost) || 0;
        return itemCost / sectionDirectCost > 0.2; // Items > 20% of section cost
      }
    );

    for (const item of highCostItems) {
      // Look for potential material substitutions
      const substitution = await this.findMaterialSubstitution(item, estimate);
      if (substitution) {
        opportunities.push(substitution);
      }

      // Check for quantity optimization
      const quantityOpt = this.checkQuantityOptimization(item);
      if (quantityOpt) {
        opportunities.push(quantityOpt);
      }
    }

    // Check for specification reduction opportunities
    const specReduction = this.checkSpecificationReduction(section);
    if (specReduction) {
      opportunities.push(specReduction);
    }

    return opportunities;
  }

  /**
   * Analyze cross-section VE opportunities
   */
  private async analyzeCrossSectionVE(
    estimate: any,
    options?: VEOptions
  ): Promise<VEOpportunity[]> {
    const opportunities: VEOpportunity[] = [];

    // Check for standardization opportunities
    const standardization = this.checkStandardization(estimate);
    if (standardization) {
      opportunities.push(standardization);
    }

    // Check for bulk procurement
    const bulkProcurement = this.checkBulkProcurement(estimate);
    if (bulkProcurement) {
      opportunities.push(bulkProcurement);
    }

    // Check for process improvements
    const processImprovement = this.checkProcessImprovement(estimate);
    if (processImprovement) {
      opportunities.push(processImprovement);
    }

    return opportunities;
  }

  /**
   * Find material substitution opportunities
   */
  private async findMaterialSubstitution(
    item: any,
    estimate: any
  ): Promise<VEOpportunity | null> {
    const itemCost = Number(item.totalCost) || 0;

    // Look for alternative assemblies
    if (item.assemblyId) {
      // Get the current assembly to find its costDatabaseId
      const currentAssembly = await prisma.assembly.findUnique({
        where: { id: item.assemblyId },
        select: { costDatabaseId: true },
      });

      // Assembly uses costDatabaseId not organizationId, csiCode not category, unitCost not totalCost
      const alternatives = await prisma.assembly.findMany({
        where: {
          costDatabaseId: currentAssembly?.costDatabaseId,
          csiCode: { startsWith: item.code?.substring(0, 5) || '' },
          id: { not: item.assemblyId },
          unitCost: { lt: itemCost * 0.9 },
        },
        take: 3,
        orderBy: { unitCost: 'asc' },
      });

      if (alternatives.length > 0) {
        const bestAlt = alternatives[0];
        const altCost = Number(bestAlt.unitCost) || 0;
        const savings = itemCost - altCost;

        return {
          id: uuid(),
          type: 'MATERIAL_SUBSTITUTION',
          category: item.code?.substring(0, 2) || 'OTHER',
          priority: savings > itemCost * 0.2 ? 'HIGH' : 'MEDIUM',
          title: `Substitute ${item.name}`,
          description: `Replace "${item.name}" with "${bestAlt.name}" for cost savings`,
          currentCost: itemCost,
          proposedCost: altCost,
          potentialSavings: savings,
          savingsPercent: (savings / itemCost) * 100,
          affectedItems: [
            {
              code: item.code,
              name: item.name,
              currentCost: itemCost,
              proposedCost: altCost,
            },
          ],
          considerations: [
            'Verify alternative meets specifications',
            'Check availability and lead time',
            'Confirm with architect/engineer',
          ],
          implementationNotes: `Replace ${item.name} assembly with ${bestAlt.name}`,
          riskLevel: 'MEDIUM',
          approvalRequired: true,
        };
      }
    }

    return null;
  }

  /**
   * Check quantity optimization
   */
  private checkQuantityOptimization(item: any): VEOpportunity | null {
    const quantity = Number(item.quantity) || 0;
    const wastePercent = item.wastePercent || 0;

    // If waste is high, suggest optimization
    if (wastePercent > 15) {
      const currentCost = Number(item.totalCost) || 0;
      const optimizedWaste = 10; // Target waste
      const savings = currentCost * ((wastePercent - optimizedWaste) / 100);

      return {
        id: uuid(),
        type: 'QUANTITY_OPTIMIZATION',
        category: item.code?.substring(0, 2) || 'OTHER',
        priority: 'LOW',
        title: `Reduce waste for ${item.name}`,
        description: `Current waste factor of ${wastePercent}% can potentially be reduced to ${optimizedWaste}%`,
        currentCost,
        proposedCost: currentCost - savings,
        potentialSavings: savings,
        savingsPercent: (savings / currentCost) * 100,
        affectedItems: [
          {
            code: item.code,
            name: item.name,
            currentCost,
            proposedCost: currentCost - savings,
          },
        ],
        considerations: [
          'Requires careful material planning',
          'May need optimized cutting patterns',
          'Coordinate with supplier for custom lengths',
        ],
        implementationNotes: 'Implement material optimization program',
        riskLevel: 'LOW',
        approvalRequired: false,
      };
    }

    return null;
  }

  /**
   * Check specification reduction
   */
  private checkSpecificationReduction(section: any): VEOpportunity | null {
    // Use flat fields from EstimateSection instead of nested 'totals'
    const sectionCost = Number(section.subtotalDirect) || 0;

    // Check for premium specifications that could be reduced
    const premiumItems = section.lineItems.filter((item: any) => {
      const name = item.name.toLowerCase();
      return (
        name.includes('premium') ||
        name.includes('high-end') ||
        name.includes('custom') ||
        name.includes('specialty')
      );
    });

    if (premiumItems.length > 0) {
      const premiumCost = premiumItems.reduce(
        (sum: number, item: any) => sum + (Number(item.totalCost) || 0),
        0
      );
      const estimatedSavings = premiumCost * 0.2; // Assume 20% savings potential

      return {
        id: uuid(),
        type: 'SPECIFICATION_REDUCTION',
        category: section.csiCode?.substring(0, 2) || 'OTHER',
        priority: 'MEDIUM',
        title: `Review premium specifications in ${section.name}`,
        description: `${premiumItems.length} items with premium specifications could be reviewed for standard alternatives`,
        currentCost: premiumCost,
        proposedCost: premiumCost - estimatedSavings,
        potentialSavings: estimatedSavings,
        savingsPercent: 20,
        affectedItems: premiumItems.map((item: any) => ({
          code: item.code,
          name: item.name,
          currentCost: Number(item.totalCost) || 0,
          proposedCost: (Number(item.totalCost) || 0) * 0.8,
        })),
        considerations: [
          'Verify owner requirements allow standard specs',
          'Review life cycle cost implications',
          'Consider maintenance differences',
        ],
        implementationNotes: 'Work with design team to identify acceptable standard alternatives',
        riskLevel: 'MEDIUM',
        approvalRequired: true,
      };
    }

    return null;
  }

  /**
   * Check standardization opportunities
   */
  private checkStandardization(estimate: any): VEOpportunity | null {
    // Find similar items that could be standardized
    const allItems = estimate.sections.flatMap((s: any) => s.lineItems);

    // Group by similar types
    const typeGroups = new Map<string, any[]>();
    for (const item of allItems) {
      const type = item.code?.substring(0, 8) || 'OTHER';
      if (!typeGroups.has(type)) {
        typeGroups.set(type, []);
      }
      typeGroups.get(type)!.push(item);
    }

    // Find groups with multiple variations
    let totalVariations = 0;
    let totalCost = 0;
    const itemsToStandardize: any[] = [];

    for (const [type, items] of Array.from(typeGroups.entries())) {
      if (items.length >= 3) {
        const uniqueCosts = new Set(items.map((i: any) => Number(i.unitCost) || 0));
        if (uniqueCosts.size >= 2) {
          totalVariations += items.length;
          totalCost += items.reduce(
            (sum: number, i: any) => sum + (Number(i.totalCost) || 0),
            0
          );
          itemsToStandardize.push(...items);
        }
      }
    }

    if (totalVariations >= 5) {
      const estimatedSavings = totalCost * 0.05; // 5% savings from standardization

      return {
        id: uuid(),
        type: 'STANDARDIZATION',
        category: 'CROSS-SECTION',
        priority: 'LOW',
        title: 'Standardize similar items',
        description: `${totalVariations} items could benefit from standardization`,
        currentCost: totalCost,
        proposedCost: totalCost - estimatedSavings,
        potentialSavings: estimatedSavings,
        savingsPercent: 5,
        affectedItems: itemsToStandardize.slice(0, 10).map((item: any) => ({
          code: item.code,
          name: item.name,
          currentCost: Number(item.totalCost) || 0,
          proposedCost: (Number(item.totalCost) || 0) * 0.95,
        })),
        considerations: [
          'Reduces procurement complexity',
          'Simplifies inventory management',
          'May require design coordination',
        ],
        implementationNotes: 'Coordinate with design team to standardize similar components',
        riskLevel: 'LOW',
        approvalRequired: false,
      };
    }

    return null;
  }

  /**
   * Check bulk procurement opportunities
   */
  private checkBulkProcurement(estimate: any): VEOpportunity | null {
    // Use flat fields from Estimate model instead of nested 'totals'
    const materialCost = Number(estimate.subtotalMaterial) || 0;

    if (materialCost > 100000) {
      const estimatedSavings = materialCost * 0.03; // 3% bulk discount potential

      return {
        id: uuid(),
        type: 'BULK_PROCUREMENT',
        category: 'PROCUREMENT',
        priority: 'MEDIUM',
        title: 'Negotiate bulk material pricing',
        description: 'Material costs may benefit from bulk procurement negotiations',
        currentCost: materialCost,
        proposedCost: materialCost - estimatedSavings,
        potentialSavings: estimatedSavings,
        savingsPercent: 3,
        affectedItems: [],
        considerations: [
          'Requires early commitment to quantities',
          'May need storage/staging area',
          'Verify supplier capacity',
        ],
        implementationNotes: 'Engage procurement early to negotiate bulk pricing with major suppliers',
        riskLevel: 'LOW',
        approvalRequired: false,
      };
    }

    return null;
  }

  /**
   * Check process improvement opportunities
   */
  private checkProcessImprovement(estimate: any): VEOpportunity | null {
    // Use flat fields from Estimate model instead of nested 'totals'
    const laborCost = Number(estimate.subtotalLabor) || 0;

    if (laborCost > 50000) {
      // Check labor to material ratio
      const materialCost = Number(estimate.subtotalMaterial) || 1;
      const laborRatio = laborCost / materialCost;

      if (laborRatio > 1) {
        const estimatedSavings = laborCost * 0.05; // 5% productivity improvement

        return {
          id: uuid(),
          type: 'PROCESS_IMPROVEMENT',
          category: 'LABOR',
          priority: 'MEDIUM',
          title: 'Improve labor productivity',
          description: 'High labor costs relative to materials suggest process improvement opportunities',
          currentCost: laborCost,
          proposedCost: laborCost - estimatedSavings,
          potentialSavings: estimatedSavings,
          savingsPercent: 5,
          affectedItems: [],
          considerations: [
            'Consider prefabrication options',
            'Evaluate crew composition',
            'Review work sequencing',
          ],
          implementationNotes: 'Develop detailed work plan focusing on labor efficiency',
          riskLevel: 'LOW',
          approvalRequired: false,
        };
      }
    }

    return null;
  }

  /**
   * Build summary
   */
  private buildSummary(opportunities: VEOpportunity[]): VESummary {
    const byCategory = new Map<string, { savings: number; count: number }>();
    const byType = new Map<VEType, { savings: number; count: number }>();

    let highPriority = 0;
    let mediumPriority = 0;
    let lowPriority = 0;

    for (const opp of opportunities) {
      // Priority counts
      if (opp.priority === 'HIGH') highPriority++;
      else if (opp.priority === 'MEDIUM') mediumPriority++;
      else lowPriority++;

      // By category
      const cat = byCategory.get(opp.category) || { savings: 0, count: 0 };
      cat.savings += opp.potentialSavings;
      cat.count++;
      byCategory.set(opp.category, cat);

      // By type
      const typ = byType.get(opp.type) || { savings: 0, count: 0 };
      typ.savings += opp.potentialSavings;
      typ.count++;
      byType.set(opp.type, typ);
    }

    // Determine complexity
    let complexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX' = 'SIMPLE';
    if (opportunities.filter(o => o.approvalRequired).length > opportunities.length / 2) {
      complexity = 'COMPLEX';
    } else if (opportunities.filter(o => o.riskLevel !== 'LOW').length > opportunities.length / 3) {
      complexity = 'MODERATE';
    }

    return {
      totalOpportunities: opportunities.length,
      highPriority,
      mediumPriority,
      lowPriority,
      byCategory: Array.from(byCategory.entries()).map(([category, data]) => ({
        category,
        ...data,
      })),
      byType: Array.from(byType.entries()).map(([type, data]) => ({
        type,
        ...data,
      })),
      implementationComplexity: complexity,
    };
  }

  /**
   * Save VE result
   * Store in estimate.metadata since valueEngineeringAnalysis table may not exist
   */
  private async saveVEResult(result: ValueEngineeringResult): Promise<void> {
    // Get current estimate to preserve existing metadata
    const estimate = await prisma.estimate.findUnique({
      where: { id: result.estimateId },
      select: { metadata: true },
    });

    const currentMetadata = (estimate?.metadata as Record<string, any>) || {};

    // Store VE analysis in metadata.valueEngineering
    await prisma.estimate.update({
      where: { id: result.estimateId },
      data: {
        metadata: {
          ...currentMetadata,
          valueEngineering: {
            id: result.id,
            totalPotentialSavings: result.totalPotentialSavings,
            opportunities: result.opportunities,
            summary: result.summary,
            analyzedAt: result.analyzedAt.toISOString(),
          },
        } as any,
      },
    });
  }
}

export const valueEngineer = new ValueEngineer();
