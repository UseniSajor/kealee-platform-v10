import OpenAI from 'openai';
import {
  AIReviewConfig,
  AIReviewResult,
  AIFinding,
  PermitReviewRequest,
  FindingSeverity,
} from '../types/ai-review.types';

/**
 * AI Review Service
 * Provides AI-powered permit review and analysis
 */
export class AIReviewService {
  private openai: OpenAI | null = null;
  private config: AIReviewConfig;

  constructor(config: AIReviewConfig) {
    this.config = config;
    
    // Only initialize OpenAI if API key is provided
    if (config.openaiApiKey && config.openaiApiKey !== '') {
      try {
        this.openai = new OpenAI({
          apiKey: config.openaiApiKey,
        });
      } catch (error) {
        console.warn('OpenAI initialization failed:', error);
      }
    }
  }

  /**
   * Review a permit application using AI
   */
  async reviewPermit(request: PermitReviewRequest): Promise<AIReviewResult> {
    try {
      // If no OpenAI client, return mock data for development
      if (!this.openai) {
        return this.getMockReviewResult(request);
      }

      // Build jurisdiction context
      const jurisdictionContext = this.buildJurisdictionContext(request.jurisdictionId);

      // Analyze each document
      const allFindings: AIFinding[] = [];

      // Analyze plans
      for (const plan of request.plans) {
        const findings = await this.analyzePlan(plan, jurisdictionContext, request.permitType);
        allFindings.push(...findings);
      }

      // Analyze documents
      for (const doc of request.documents) {
        const findings = await this.analyzeDocument(doc, jurisdictionContext, request.permitType);
        allFindings.push(...findings);
      }

      // Calculate summary
      const summary = this.calculateSummary(allFindings);

      return {
        success: true,
        data: {
          reviewId: `review_${Date.now()}`,
          findings: allFindings,
          summary,
          overallScore: this.calculateOverallScore(allFindings),
          recommendations: this.generateRecommendations(allFindings),
          estimatedReviewTime: this.estimateReviewTime(allFindings),
        },
      };
    } catch (error) {
      console.error('AI Review error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Analyze a plan document
   */
  private async analyzePlan(
    plan: any,
    jurisdictionContext: string,
    permitType: string
  ): Promise<AIFinding[]> {
    if (!this.openai) return [];

    // In a real implementation, this would analyze the plan image/PDF
    // For now, return empty findings
    return [];
  }

  /**
   * Analyze a document
   */
  private async analyzeDocument(
    document: any,
    jurisdictionContext: string,
    permitType: string
  ): Promise<AIFinding[]> {
    if (!this.openai) return [];

    // In a real implementation, this would analyze the document
    // For now, return empty findings
    return [];
  }

  /**
   * Build jurisdiction-specific context for AI
   */
  private buildJurisdictionContext(jurisdictionId: string): string {
    const jurisdictionConfig = this.config.jurisdictionConfigs.find(
      (j) => j.jurisdictionId === jurisdictionId
    );

    if (!jurisdictionConfig) {
      return 'No specific jurisdiction requirements found.';
    }

    return `
Jurisdiction: ${jurisdictionConfig.jurisdictionName}
Code References: ${jurisdictionConfig.codeReferences.join(', ')}
Special Requirements: ${jurisdictionConfig.specialRequirements.join(', ')}
    `.trim();
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(findings: AIFinding[]) {
    return {
      totalFindings: findings.length,
      criticalCount: findings.filter((f) => f.severity === 'critical').length,
      majorCount: findings.filter((f) => f.severity === 'major').length,
      minorCount: findings.filter((f) => f.severity === 'minor').length,
      informationalCount: findings.filter((f) => f.severity === 'informational').length,
    };
  }

  /**
   * Calculate overall compliance score (0-100)
   */
  private calculateOverallScore(findings: AIFinding[]): number {
    if (findings.length === 0) return 100;

    const weights = {
      critical: 20,
      major: 10,
      minor: 5,
      informational: 1,
    };

    const totalDeductions = findings.reduce((sum, finding) => {
      return sum + weights[finding.severity];
    }, 0);

    return Math.max(0, 100 - totalDeductions);
  }

  /**
   * Generate recommendations based on findings
   */
  private generateRecommendations(findings: AIFinding[]): string[] {
    const recommendations: string[] = [];

    const criticalFindings = findings.filter((f) => f.severity === 'critical');
    if (criticalFindings.length > 0) {
      recommendations.push(
        `Address ${criticalFindings.length} critical issue(s) before submission`
      );
    }

    const majorFindings = findings.filter((f) => f.severity === 'major');
    if (majorFindings.length > 0) {
      recommendations.push(
        `Review and fix ${majorFindings.length} major issue(s) to avoid delays`
      );
    }

    if (findings.length === 0) {
      recommendations.push('Application looks good! Ready for submission.');
    }

    return recommendations;
  }

  /**
   * Estimate review time in minutes
   */
  private estimateReviewTime(findings: AIFinding[]): number {
    // Base time + time per finding
    return 15 + findings.length * 3;
  }

  /**
   * Get mock review result for development/testing
   */
  private getMockReviewResult(request: PermitReviewRequest): AIReviewResult {
    const mockFindings: AIFinding[] = [
      {
        id: 'finding_1',
        category: 'Code Compliance',
        severity: 'major',
        title: 'Missing fire egress calculation',
        description: 'Floor plan does not show adequate fire egress calculations for occupancy load.',
        codeReference: 'IBC 2021 Section 1006.2.1',
        suggestedFix: 'Add egress capacity calculations based on occupancy load',
        location: {
          page: 2,
          section: 'Floor Plan - Level 1',
        },
      },
      {
        id: 'finding_2',
        category: 'Structural',
        severity: 'minor',
        title: 'Beam size notation unclear',
        description: 'Structural beam dimensions are difficult to read on sheet S-1',
        suggestedFix: 'Enlarge or clarify beam size annotations',
        location: {
          page: 5,
          section: 'Structural Plan',
        },
      },
      {
        id: 'finding_3',
        category: 'Documentation',
        severity: 'informational',
        title: 'Consider adding energy calculations',
        description: 'Energy compliance calculations would strengthen application',
        suggestedFix: 'Include Title 24 energy calculations if applicable',
      },
    ];

    const summary = this.calculateSummary(mockFindings);

    return {
      success: true,
      data: {
        reviewId: `mock_review_${Date.now()}`,
        findings: mockFindings,
        summary,
        overallScore: this.calculateOverallScore(mockFindings),
        recommendations: this.generateRecommendations(mockFindings),
        estimatedReviewTime: 30,
      },
    };
  }
}
