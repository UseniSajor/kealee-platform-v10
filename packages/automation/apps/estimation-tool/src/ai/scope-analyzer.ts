/**
 * Scope Analyzer
 * AI-powered scope analysis and validation
 */

import { PrismaClient } from '@prisma/client';
import { v4 as uuid } from 'uuid';
import Anthropic from '@anthropic-ai/sdk';

const prisma = new PrismaClient();

export interface ScopeAnalysisResult {
  id: string;
  estimateId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  completeness: CompletenessAnalysis;
  gaps: ScopeGap[];
  risks: ScopeRisk[];
  recommendations: ScopeRecommendation[];
  confidence: number;
  analyzedAt: Date;
}

export interface CompletenessAnalysis {
  overallScore: number;
  categoryScores: {
    category: string;
    score: number;
    missingItems: string[];
  }[];
  coveredAreas: string[];
  uncoveredAreas: string[];
}

export interface ScopeGap {
  id: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  description: string;
  suggestedItems: {
    code: string;
    name: string;
    estimatedCost: number;
  }[];
  potentialCostImpact: number;
}

export interface ScopeRisk {
  id: string;
  type: RiskType;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  likelihood: number;
  costImpact: number;
  mitigation: string;
}

export type RiskType =
  | 'SCOPE_CREEP'
  | 'INCOMPLETE_SCOPE'
  | 'UNCLEAR_REQUIREMENTS'
  | 'QUANTITY_VARIANCE'
  | 'PRICE_VOLATILITY'
  | 'COORDINATION_ISSUE'
  | 'SCHEDULE_RISK'
  | 'PERMIT_RISK'
  | 'SITE_CONDITIONS'
  | 'OTHER';

export interface ScopeRecommendation {
  id: string;
  type: 'ADD_ITEM' | 'ADJUST_QUANTITY' | 'CLARIFY_SCOPE' | 'REVIEW_PRICING' | 'GENERAL';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  actionItems: string[];
  estimatedBenefit: string;
}

export interface ScopeValidationRules {
  requiredCategories?: string[];
  minimumItems?: Record<string, number>;
  requiredRelationships?: {
    ifPresent: string;
    mustInclude: string[];
  }[];
}

export class ScopeAnalyzer {
  private anthropic: Anthropic | null = null;

  constructor() {
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }
  }

  /**
   * Analyze estimate scope
   */
  async analyzeScope(
    estimateId: string,
    options?: {
      projectType?: string;
      validationRules?: ScopeValidationRules;
      compareWithSimilar?: boolean;
    }
  ): Promise<ScopeAnalysisResult> {
    const result: ScopeAnalysisResult = {
      id: uuid(),
      estimateId,
      status: 'PROCESSING',
      completeness: {
        overallScore: 0,
        categoryScores: [],
        coveredAreas: [],
        uncoveredAreas: [],
      },
      gaps: [],
      risks: [],
      recommendations: [],
      confidence: 0,
      analyzedAt: new Date(),
    };

    try {
      // Get estimate data
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

      // Analyze completeness
      result.completeness = await this.analyzeCompleteness(
        estimate,
        options?.projectType,
        options?.validationRules
      );

      // Identify gaps
      result.gaps = await this.identifyGaps(estimate, options?.projectType);

      // Assess risks
      result.risks = await this.assessRisks(estimate);

      // Generate recommendations
      result.recommendations = await this.generateRecommendations(
        estimate,
        result.completeness,
        result.gaps,
        result.risks
      );

      // Compare with similar estimates if requested
      if (options?.compareWithSimilar) {
        const comparison = await this.compareWithSimilar(estimate);
        result.recommendations.push(...comparison.recommendations);
      }

      // Calculate overall confidence
      result.confidence = this.calculateConfidence(result);

      result.status = 'COMPLETED';

      // Save analysis result
      await this.saveAnalysisResult(result);

    } catch (error) {
      result.status = 'FAILED';
      console.error('Scope analysis failed:', error);
    }

    return result;
  }

  /**
   * Analyze scope completeness
   */
  private async analyzeCompleteness(
    estimate: any,
    projectType?: string,
    rules?: ScopeValidationRules
  ): Promise<CompletenessAnalysis> {
    const categoryScores: CompletenessAnalysis['categoryScores'] = [];
    const coveredAreas: string[] = [];
    const uncoveredAreas: string[] = [];

    // Default required categories for building construction
    const requiredCategories = rules?.requiredCategories || [
      '01', '02', '03', '05', '06', '07', '08', '09', '22', '23', '26',
    ];

    // Analyze each required category
    for (const catCode of requiredCategories) {
      const section = estimate.sections.find(
        (s: any) => s.csiCode?.startsWith(catCode)
      );

      if (section && section.lineItems.length > 0) {
        coveredAreas.push(section.name);
        categoryScores.push({
          category: section.name,
          score: Math.min(100, section.lineItems.length * 10),
          missingItems: [],
        });
      } else {
        uncoveredAreas.push(this.getCategoryName(catCode));
        categoryScores.push({
          category: this.getCategoryName(catCode),
          score: 0,
          missingItems: this.getTypicalItems(catCode),
        });
      }
    }

    // Calculate overall score
    const overallScore = categoryScores.reduce((sum, c) => sum + c.score, 0) / categoryScores.length;

    return {
      overallScore,
      categoryScores,
      coveredAreas,
      uncoveredAreas,
    };
  }

  /**
   * Identify scope gaps
   */
  private async identifyGaps(estimate: any, projectType?: string): Promise<ScopeGap[]> {
    const gaps: ScopeGap[] = [];

    // Check for common missing items based on what's included
    const hasConcreteWork = estimate.sections.some(
      (s: any) => s.csiCode?.startsWith('03') && s.lineItems.length > 0
    );
    const hasFraming = estimate.sections.some(
      (s: any) => s.csiCode?.startsWith('06') && s.lineItems.length > 0
    );
    const hasFinishes = estimate.sections.some(
      (s: any) => s.csiCode?.startsWith('09') && s.lineItems.length > 0
    );
    const hasMEP = estimate.sections.some(
      (s: any) => ['22', '23', '26'].some(code => s.csiCode?.startsWith(code)) && s.lineItems.length > 0
    );

    // If has concrete but no rebar
    if (hasConcreteWork) {
      const concreteSection = estimate.sections.find(
        (s: any) => s.csiCode?.startsWith('03')
      );
      const hasRebar = concreteSection?.lineItems.some(
        (i: any) => i.name.toLowerCase().includes('rebar') || i.name.toLowerCase().includes('reinforc')
      );

      if (!hasRebar) {
        gaps.push({
          id: uuid(),
          severity: 'HIGH',
          category: '03 - Concrete',
          description: 'Concrete work present but reinforcing steel appears to be missing',
          suggestedItems: [
            { code: '03 21 00', name: 'Reinforcing Steel', estimatedCost: 5000 },
            { code: '03 21 05', name: 'Rebar Accessories', estimatedCost: 500 },
          ],
          potentialCostImpact: 5500,
        });
      }
    }

    // If has framing but no insulation
    if (hasFraming && !estimate.sections.some(
      (s: any) => s.csiCode?.startsWith('07') && s.lineItems.some(
        (i: any) => i.name.toLowerCase().includes('insulation')
      )
    )) {
      gaps.push({
        id: uuid(),
        severity: 'MEDIUM',
        category: '07 - Thermal & Moisture Protection',
        description: 'Framing present but insulation appears to be missing',
        suggestedItems: [
          { code: '07 21 00', name: 'Building Insulation', estimatedCost: 3000 },
          { code: '07 26 00', name: 'Vapor Retarders', estimatedCost: 500 },
        ],
        potentialCostImpact: 3500,
      });
    }

    // If has finishes but no paint
    if (hasFinishes) {
      const finishSection = estimate.sections.find(
        (s: any) => s.csiCode?.startsWith('09')
      );
      const hasPaint = finishSection?.lineItems.some(
        (i: any) => i.name.toLowerCase().includes('paint') || i.code?.startsWith('09 91')
      );

      if (!hasPaint) {
        gaps.push({
          id: uuid(),
          severity: 'MEDIUM',
          category: '09 - Finishes',
          description: 'Finish work present but painting appears to be missing',
          suggestedItems: [
            { code: '09 91 00', name: 'Interior Painting', estimatedCost: 8000 },
            { code: '09 93 00', name: 'Exterior Painting', estimatedCost: 4000 },
          ],
          potentialCostImpact: 12000,
        });
      }
    }

    // Check for general requirements
    const hasGeneralReqs = estimate.sections.some(
      (s: any) => s.csiCode?.startsWith('01') && s.lineItems.length > 0
    );

    if (!hasGeneralReqs) {
      gaps.push({
        id: uuid(),
        severity: 'HIGH',
        category: '01 - General Requirements',
        description: 'General requirements/conditions are missing',
        suggestedItems: [
          { code: '01 50 00', name: 'Temporary Facilities', estimatedCost: 15000 },
          { code: '01 52 00', name: 'Construction Equipment', estimatedCost: 8000 },
          { code: '01 56 00', name: 'Temporary Barriers', estimatedCost: 3000 },
        ],
        potentialCostImpact: 26000,
      });
    }

    return gaps;
  }

  /**
   * Assess scope risks
   */
  private async assessRisks(estimate: any): Promise<ScopeRisk[]> {
    const risks: ScopeRisk[] = [];
    // Use flat fields from Estimate model instead of nested 'totals'
    const directCost = Number(estimate.subtotalDirect) || 0;
    const laborCost = Number(estimate.subtotalLabor) || 0;
    const contingencyPercent = Number(estimate.contingencyPercent) || 0;

    // Check for high concentration in single category
    for (const section of estimate.sections) {
      // Use flat fields from EstimateSection
      const sectionDirectCost = Number(section.subtotalDirect) || 0;
      const sectionPercent = directCost > 0
        ? (sectionDirectCost / directCost) * 100
        : 0;

      if (sectionPercent > 40) {
        risks.push({
          id: uuid(),
          type: 'SCOPE_CREEP',
          severity: 'MEDIUM',
          description: `Section "${section.name}" represents ${sectionPercent.toFixed(1)}% of total cost - high concentration increases risk`,
          likelihood: 0.4,
          costImpact: sectionDirectCost * 0.1,
          mitigation: 'Consider detailed breakdown and multiple quotes for this scope',
        });
      }
    }

    // Check for labor-heavy estimates
    if (laborCost && directCost) {
      const laborPercent = (laborCost / directCost) * 100;
      if (laborPercent > 50) {
        risks.push({
          id: uuid(),
          type: 'PRICE_VOLATILITY',
          severity: 'HIGH',
          description: `Labor costs are ${laborPercent.toFixed(1)}% of direct costs - vulnerable to labor rate changes`,
          likelihood: 0.6,
          costImpact: laborCost * 0.1,
          mitigation: 'Include adequate contingency for labor, verify current market rates',
        });
      }
    }

    // Check for low contingency
    if (contingencyPercent < 5) {
      risks.push({
        id: uuid(),
        type: 'INCOMPLETE_SCOPE',
        severity: 'HIGH',
        description: `Contingency of ${contingencyPercent}% may be insufficient for unforeseen conditions`,
        likelihood: 0.7,
        costImpact: directCost * 0.05,
        mitigation: 'Consider increasing contingency to 5-10% based on project complexity',
      });
    }

    // Check for missing MEP coordination
    const hasMechanical = estimate.sections.some((s: any) => s.csiCode?.startsWith('23'));
    const hasElectrical = estimate.sections.some((s: any) => s.csiCode?.startsWith('26'));
    const hasPlumbing = estimate.sections.some((s: any) => s.csiCode?.startsWith('22'));

    if ((hasMechanical || hasElectrical || hasPlumbing) &&
        !(hasMechanical && hasElectrical && hasPlumbing)) {
      risks.push({
        id: uuid(),
        type: 'COORDINATION_ISSUE',
        severity: 'MEDIUM',
        description: 'Incomplete MEP scope may indicate missing coordination requirements',
        likelihood: 0.5,
        costImpact: directCost * 0.03,
        mitigation: 'Verify all MEP disciplines are included and coordinated',
      });
    }

    return risks;
  }

  /**
   * Generate recommendations
   */
  private async generateRecommendations(
    estimate: any,
    completeness: CompletenessAnalysis,
    gaps: ScopeGap[],
    risks: ScopeRisk[]
  ): Promise<ScopeRecommendation[]> {
    const recommendations: ScopeRecommendation[] = [];

    // Recommendations based on completeness
    if (completeness.overallScore < 50) {
      recommendations.push({
        id: uuid(),
        type: 'CLARIFY_SCOPE',
        priority: 'HIGH',
        title: 'Scope Definition Needs Improvement',
        description: `Completeness score of ${completeness.overallScore.toFixed(0)}% indicates significant scope gaps`,
        actionItems: [
          'Review project drawings and specifications thoroughly',
          'Confirm scope with project owner/architect',
          'Add missing categories identified in analysis',
        ],
        estimatedBenefit: 'Prevent scope-related claims and change orders',
      });
    }

    // Recommendations based on gaps
    for (const gap of gaps.filter(g => g.severity === 'HIGH')) {
      recommendations.push({
        id: uuid(),
        type: 'ADD_ITEM',
        priority: 'HIGH',
        title: `Address Gap: ${gap.category}`,
        description: gap.description,
        actionItems: gap.suggestedItems.map(
          i => `Add ${i.name} (Est. $${i.estimatedCost.toLocaleString()})`
        ),
        estimatedBenefit: `Avoid potential $${gap.potentialCostImpact.toLocaleString()} in change orders`,
      });
    }

    // Recommendations based on risks
    for (const risk of risks.filter(r => r.severity === 'HIGH')) {
      recommendations.push({
        id: uuid(),
        type: 'GENERAL',
        priority: 'HIGH',
        title: `Mitigate Risk: ${risk.type.replace('_', ' ')}`,
        description: risk.description,
        actionItems: [risk.mitigation],
        estimatedBenefit: `Reduce potential cost impact of $${risk.costImpact.toLocaleString()}`,
      });
    }

    // General recommendations
    // Use flat fields from Estimate model instead of nested 'totals'
    const overheadPercent = Number(estimate.overheadPercent) || 0;
    const profitPercent = Number(estimate.profitPercent) || 0;
    const markupTotal = overheadPercent + profitPercent;
    if (markupTotal < 5) {
      recommendations.push({
        id: uuid(),
        type: 'REVIEW_PRICING',
        priority: 'MEDIUM',
        title: 'Review Markup Strategy',
        description: `Current markup of ${markupTotal}% may be below market standards`,
        actionItems: [
          'Review competitive landscape for this project type',
          'Ensure all indirect costs are captured',
          'Consider market conditions and project complexity',
        ],
        estimatedBenefit: 'Maintain healthy profit margins',
      });
    }

    return recommendations;
  }

  /**
   * Compare with similar estimates
   */
  private async compareWithSimilar(estimate: any): Promise<{
    similarEstimates: { id: string; name: string; total: number }[];
    recommendations: ScopeRecommendation[];
  }> {
    // Find similar estimates from same organization
    // Use correct EstimateStatus enum values
    const similar = await prisma.estimate.findMany({
      where: {
        organizationId: estimate.organizationId,
        type: estimate.type,
        id: { not: estimate.id },
        status: { in: ['APPROVED_ESTIMATE', 'SENT_ESTIMATE', 'ACCEPTED_ESTIMATE'] },
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    const recommendations: ScopeRecommendation[] = [];

    if (similar.length > 0) {
      // Use flat totalCost field instead of nested totals.grandTotal
      const avgTotal = similar.reduce(
        (sum, e) => sum + (Number(e.totalCost) || 0),
        0
      ) / similar.length;

      const currentTotal = Number(estimate.totalCost) || 0;
      const variance = avgTotal > 0 ? ((currentTotal - avgTotal) / avgTotal) * 100 : 0;

      if (Math.abs(variance) > 20) {
        recommendations.push({
          id: uuid(),
          type: 'REVIEW_PRICING',
          priority: 'MEDIUM',
          title: 'Cost Variance from Similar Projects',
          description: `This estimate is ${variance > 0 ? 'higher' : 'lower'} than similar projects by ${Math.abs(variance).toFixed(1)}%`,
          actionItems: [
            'Review scope differences between projects',
            'Verify quantity takeoffs',
            'Check for missing or extra scope items',
          ],
          estimatedBenefit: 'Ensure competitive and accurate pricing',
        });
      }
    }

    return {
      similarEstimates: similar.map(e => ({
        id: e.id,
        name: e.name,
        total: Number(e.totalCost) || 0,
      })),
      recommendations,
    };
  }

  /**
   * Calculate overall confidence
   */
  private calculateConfidence(result: ScopeAnalysisResult): number {
    let confidence = 100;

    // Reduce confidence based on completeness
    confidence -= (100 - result.completeness.overallScore) * 0.3;

    // Reduce confidence based on gaps
    confidence -= result.gaps.filter(g => g.severity === 'HIGH').length * 10;
    confidence -= result.gaps.filter(g => g.severity === 'MEDIUM').length * 5;

    // Reduce confidence based on risks
    confidence -= result.risks.filter(r => r.severity === 'HIGH').length * 8;
    confidence -= result.risks.filter(r => r.severity === 'MEDIUM').length * 4;

    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Get category name from code
   */
  private getCategoryName(code: string): string {
    const names: Record<string, string> = {
      '01': 'General Requirements',
      '02': 'Existing Conditions',
      '03': 'Concrete',
      '04': 'Masonry',
      '05': 'Metals',
      '06': 'Wood, Plastics & Composites',
      '07': 'Thermal & Moisture Protection',
      '08': 'Openings',
      '09': 'Finishes',
      '10': 'Specialties',
      '22': 'Plumbing',
      '23': 'HVAC',
      '26': 'Electrical',
    };
    return names[code] || `Division ${code}`;
  }

  /**
   * Get typical items for category
   */
  private getTypicalItems(code: string): string[] {
    const items: Record<string, string[]> = {
      '01': ['Temporary Facilities', 'Project Management', 'Cleanup'],
      '03': ['Concrete Forming', 'Concrete Placement', 'Reinforcing'],
      '06': ['Rough Carpentry', 'Finish Carpentry', 'Casework'],
      '07': ['Insulation', 'Roofing', 'Flashing'],
      '08': ['Doors', 'Windows', 'Hardware'],
      '09': ['Drywall', 'Painting', 'Flooring'],
      '22': ['Plumbing Fixtures', 'Piping', 'Water Heater'],
      '23': ['HVAC Equipment', 'Ductwork', 'Controls'],
      '26': ['Electrical Service', 'Wiring', 'Fixtures'],
    };
    return items[code] || [];
  }

  /**
   * Save analysis result
   * Store in estimate.metadata or aiNotes since scopeAnalysis table may not exist
   */
  private async saveAnalysisResult(result: ScopeAnalysisResult): Promise<void> {
    // Get current estimate to preserve existing metadata
    const estimate = await prisma.estimate.findUnique({
      where: { id: result.estimateId },
      select: { metadata: true },
    });

    const currentMetadata = (estimate?.metadata as Record<string, any>) || {};

    // Store scope analysis in metadata.scopeAnalysis
    await prisma.estimate.update({
      where: { id: result.estimateId },
      data: {
        metadata: {
          ...currentMetadata,
          scopeAnalysis: {
            id: result.id,
            status: result.status,
            completeness: result.completeness,
            gaps: result.gaps,
            risks: result.risks,
            recommendations: result.recommendations,
            confidence: result.confidence,
            analyzedAt: result.analyzedAt.toISOString(),
          },
        } as any,
      },
    });
  }
}

export const scopeAnalyzer = new ScopeAnalyzer();
