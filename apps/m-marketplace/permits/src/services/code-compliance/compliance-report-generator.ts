/**
 * Compliance Report Generator Service
 * Generate comprehensive compliance reports
 */

import {CodeComplianceCheck} from './code-book-integration';
import {DimensionComplianceCheck} from './dimension-checker';
import {AccessibilityCheck} from './accessibility-checker';
import {EnergyCodeCheck} from './energy-code-checker';
import {FireLifeSafetyCheck} from './fire-life-safety-checker';

export interface ComplianceReport {
  permitId: string;
  reportDate: Date;
  overallStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL';
  overallComplianceScore: number; // 0-100
  summary: ComplianceSummary;
  codeBookChecks: CodeComplianceCheck[];
  dimensionChecks: DimensionComplianceCheck[];
  accessibilityChecks: AccessibilityCheck[];
  energyCodeChecks: EnergyCodeCheck[];
  fireLifeSafetyChecks: FireLifeSafetyCheck[];
  criticalIssues: ComplianceIssue[];
  majorIssues: ComplianceIssue[];
  minorIssues: ComplianceIssue[];
  recommendations: string[];
}

export interface ComplianceSummary {
  totalChecks: number;
  compliantChecks: number;
  nonCompliantChecks: number;
  bySeverity: {
    CRITICAL: number;
    MAJOR: number;
    MINOR: number;
  };
  byCategory: Record<string, number>;
}

export interface ComplianceIssue {
  id: string;
  codeSection: string;
  category: string;
  description: string;
  severity: 'MINOR' | 'MAJOR' | 'CRITICAL';
  actualValue?: number;
  requiredValue?: number;
  message: string;
}

export class ComplianceReportGeneratorService {
  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    permitId: string,
    codeBookChecks: CodeComplianceCheck[] = [],
    dimensionChecks: DimensionComplianceCheck[] = [],
    accessibilityChecks: AccessibilityCheck[] = [],
    energyCodeChecks: EnergyCodeCheck[] = [],
    fireLifeSafetyChecks: FireLifeSafetyCheck[] = []
  ): Promise<ComplianceReport> {
    // Collect all issues
    const allIssues = this.collectIssues(
      codeBookChecks,
      dimensionChecks,
      accessibilityChecks,
      energyCodeChecks,
      fireLifeSafetyChecks
    );

    // Separate by severity
    const criticalIssues = allIssues.filter(i => i.severity === 'CRITICAL');
    const majorIssues = allIssues.filter(i => i.severity === 'MAJOR');
    const minorIssues = allIssues.filter(i => i.severity === 'MINOR');

    // Calculate summary
    const totalChecks = codeBookChecks.length +
      dimensionChecks.length +
      accessibilityChecks.length +
      energyCodeChecks.length +
      fireLifeSafetyChecks.length;

    const compliantChecks = codeBookChecks.filter(c => c.compliant).length +
      dimensionChecks.filter(c => c.compliant).length +
      accessibilityChecks.filter(c => c.compliant).length +
      energyCodeChecks.filter(c => c.compliant).length +
      fireLifeSafetyChecks.filter(c => c.compliant).length;

    const nonCompliantChecks = totalChecks - compliantChecks;

    // Calculate compliance score (0-100)
    const overallComplianceScore = totalChecks > 0
      ? Math.round((compliantChecks / totalChecks) * 100)
      : 100;

    // Determine overall status
    const overallStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL' =
      criticalIssues.length > 0
        ? 'NON_COMPLIANT'
        : majorIssues.length > 0
        ? 'PARTIAL'
        : 'COMPLIANT';

    // Generate summary
    const summary: ComplianceSummary = {
      totalChecks,
      compliantChecks,
      nonCompliantChecks,
      bySeverity: {
        CRITICAL: criticalIssues.length,
        MAJOR: majorIssues.length,
        MINOR: minorIssues.length,
      },
      byCategory: this.groupByCategory(allIssues),
    };

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      criticalIssues,
      majorIssues,
      minorIssues
    );

    return {
      permitId,
      reportDate: new Date(),
      overallStatus,
      overallComplianceScore,
      summary,
      codeBookChecks,
      dimensionChecks,
      accessibilityChecks,
      energyCodeChecks,
      fireLifeSafetyChecks,
      criticalIssues,
      majorIssues,
      minorIssues,
      recommendations,
    };
  }

  /**
   * Collect all issues from checks
   */
  private collectIssues(
    codeBookChecks: CodeComplianceCheck[],
    dimensionChecks: DimensionComplianceCheck[],
    accessibilityChecks: AccessibilityCheck[],
    energyCodeChecks: EnergyCodeCheck[],
    fireLifeSafetyChecks: FireLifeSafetyCheck[]
  ): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];

    // Code book checks
    codeBookChecks.forEach(check => {
      if (!check.compliant) {
        issues.push({
          id: `codebook-${check.sectionId}`,
          codeSection: check.sectionNumber,
          category: check.requirement.type,
          description: check.requirement.description,
          severity: check.severity,
          actualValue: check.actualValue,
          requiredValue: check.requiredValue,
          message: check.message,
        });
      }
    });

    // Dimension checks
    dimensionChecks.forEach(check => {
      if (!check.compliant) {
        issues.push({
          id: `dimension-${check.measurementId}`,
          codeSection: check.codeSection,
          category: 'Dimension',
          description: check.measurementName,
          severity: check.severity,
          actualValue: check.measuredValue,
          requiredValue: check.requiredValue || check.minimumValue || check.maximumValue,
          message: check.message,
        });
      }
    });

    // Accessibility checks
    accessibilityChecks.forEach(check => {
      if (!check.compliant) {
        const failedChecks = check.checks.filter(c => !c.compliant);
        failedChecks.forEach(failed => {
          issues.push({
            id: `accessibility-${check.requirementId}-${failed.parameter}`,
            codeSection: check.codeSection,
            category: check.type,
            description: `${check.requirementTitle} - ${failed.parameter}`,
            severity: check.severity,
            actualValue: failed.actualValue,
            requiredValue: failed.requiredValue,
            message: failed.message,
          });
        });
      }
    });

    // Energy code checks
    energyCodeChecks.forEach(check => {
      if (!check.compliant) {
        const failedChecks = check.checks.filter(c => !c.compliant);
        failedChecks.forEach(failed => {
          issues.push({
            id: `energy-${check.requirementId}-${failed.component}`,
            codeSection: check.codeSection,
            category: check.category,
            description: `${failed.component}`,
            severity: check.severity,
            actualValue: failed.actualValue,
            requiredValue: failed.requiredValue,
            message: failed.message,
          });
        });
      }
    });

    // Fire/life safety checks
    fireLifeSafetyChecks.forEach(check => {
      if (!check.compliant) {
        const failedChecks = check.checks.filter(c => !c.compliant);
        failedChecks.forEach(failed => {
          issues.push({
            id: `fire-safety-${check.requirementId}-${failed.parameter}`,
            codeSection: check.codeSection,
            category: check.category,
            description: `${failed.parameter}`,
            severity: check.severity,
            actualValue: failed.actualValue,
            requiredValue: failed.requiredValue,
            message: failed.message,
          });
        });
      }
    });

    return issues;
  }

  /**
   * Group issues by category
   */
  private groupByCategory(issues: ComplianceIssue[]): Record<string, number> {
    const categories: Record<string, number> = {};

    issues.forEach(issue => {
      categories[issue.category] = (categories[issue.category] || 0) + 1;
    });

    return categories;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    criticalIssues: ComplianceIssue[],
    majorIssues: ComplianceIssue[],
    minorIssues: ComplianceIssue[]
  ): string[] {
    const recommendations: string[] = [];

    if (criticalIssues.length > 0) {
      recommendations.push(
        `CRITICAL: Address ${criticalIssues.length} critical compliance issue(s) immediately before proceeding with construction.`
      );
    }

    if (majorIssues.length > 0) {
      recommendations.push(
        `MAJOR: Correct ${majorIssues.length} major compliance issue(s) to ensure code compliance.`
      );
    }

    if (minorIssues.length > 0) {
      recommendations.push(
        `MINOR: Review and address ${minorIssues.length} minor compliance issue(s) for best practices.`
      );
    }

    // Specific recommendations by category
    const categories = new Set([
      ...criticalIssues.map(i => i.category),
      ...majorIssues.map(i => i.category),
    ]);

    if (categories.has('EGRESS')) {
      recommendations.push(
        'Review egress requirements to ensure all occupants can safely exit the building.'
      );
    }

    if (categories.has('FIRE_RATING')) {
      recommendations.push(
        'Verify fire-resistance ratings meet code requirements for building type and occupancy.'
      );
    }

    if (categories.has('ROUTE') || categories.has('DOOR')) {
      recommendations.push(
        'Ensure all accessible routes and doors meet ADA Standards requirements.'
      );
    }

    if (categories.has('INSULATION') || categories.has('WINDOWS')) {
      recommendations.push(
        'Review energy code compliance to ensure building meets minimum efficiency requirements.'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('All compliance checks passed. Proceed with construction.');
    }

    return recommendations;
  }

  /**
   * Export report as PDF
   */
  async exportReportAsPDF(report: ComplianceReport): Promise<string> {
    // In production, would use a PDF generation library like pdfkit or puppeteer
    // For now, return JSON representation
    return JSON.stringify(report, null, 2);
  }

  /**
   * Export report as JSON
   */
  async exportReportAsJSON(report: ComplianceReport): Promise<string> {
    return JSON.stringify(report, null, 2);
  }
}

// Singleton instance
export const complianceReportGeneratorService = new ComplianceReportGeneratorService();
