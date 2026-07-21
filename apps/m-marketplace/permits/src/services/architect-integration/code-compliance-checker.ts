/**
 * Code Compliance Checker Service
 * Pre-check code compliance against jurisdiction rules
 */

import {createClient} from '@permits/src/lib/supabase/client';

export interface CodeRule {
  id: string;
  jurisdictionId: string;
  codeType: 'BUILDING' | 'ZONING' | 'FIRE' | 'ENERGY' | 'ACCESSIBILITY';
  ruleNumber: string;
  title: string;
  description: string;
  category: string;
  applicableTo: string[]; // Permit types
  severity: 'INFO' | 'WARNING' | 'ERROR';
}

export interface ComplianceCheck {
  ruleId: string;
  ruleNumber: string;
  title: string;
  status: 'PASS' | 'FAIL' | 'WARNING' | 'UNKNOWN';
  message: string;
  severity: 'INFO' | 'WARNING' | 'ERROR';
  evidence?: string; // Reference to document/page
}

export interface ComplianceReport {
  permitId?: string;
  designProjectId: string;
  jurisdictionId: string;
  overallStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'REVIEW_REQUIRED';
  checks: ComplianceCheck[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
    unknown: number;
  };
  generatedAt: Date;
}

export class CodeComplianceCheckerService {
  /**
   * Pre-check code compliance for design project
   */
  async checkCompliance(
    designProjectId: string,
    jurisdictionId: string,
    permitType: string
  ): Promise<ComplianceReport> {
    const supabase = createClient();

    // Get jurisdiction code rules
    const rules = await this.getJurisdictionRules(jurisdictionId, permitType);

    // Get design project data
    const designData = await this.getDesignProjectData(designProjectId);

    // Perform compliance checks
    const checks: ComplianceCheck[] = [];

    for (const rule of rules) {
      const check = await this.checkRule(rule, designData);
      checks.push(check);
    }

    // Calculate summary
    const summary = {
      total: checks.length,
      passed: checks.filter(c => c.status === 'PASS').length,
      failed: checks.filter(c => c.status === 'FAIL').length,
      warnings: checks.filter(c => c.status === 'WARNING').length,
      unknown: checks.filter(c => c.status === 'UNKNOWN').length,
    };

    // Determine overall status
    const overallStatus = this.determineOverallStatus(checks);

    return {
      designProjectId,
      jurisdictionId,
      overallStatus,
      checks,
      summary,
      generatedAt: new Date(),
    };
  }

  /**
   * Get jurisdiction code rules
   */
  private async getJurisdictionRules(
    jurisdictionId: string,
    permitType: string
  ): Promise<CodeRule[]> {
    const supabase = createClient();

    // In production, this would query a CodeRule table
    // For now, return common building code rules
    return this.getDefaultRules(jurisdictionId, permitType);
  }

  /**
   * Get default code rules
   */
  private getDefaultRules(jurisdictionId: string, permitType: string): CodeRule[] {
    const rules: CodeRule[] = [];

    // Building code rules
    if (permitType === 'BUILDING' || permitType === 'ROOFING' || permitType === 'ADDITION') {
      rules.push(
        {
          id: 'rule-1',
          jurisdictionId,
          codeType: 'BUILDING',
          ruleNumber: 'R301.1',
          title: 'Minimum Room Dimensions',
          description: 'Habitable rooms shall have minimum ceiling height of 7 feet',
          category: 'DIMENSIONS',
          applicableTo: ['BUILDING', 'ADDITION'],
          severity: 'ERROR',
        },
        {
          id: 'rule-2',
          jurisdictionId,
          codeType: 'BUILDING',
          ruleNumber: 'R302.1',
          title: 'Fire Separation',
          description: 'Required fire separation between dwelling units',
          category: 'FIRE_SAFETY',
          applicableTo: ['BUILDING'],
          severity: 'ERROR',
        },
        {
          id: 'rule-3',
          jurisdictionId,
          codeType: 'ZONING',
          ruleNumber: 'Z-1',
          title: 'Setback Requirements',
          description: 'Minimum setbacks from property lines required',
          category: 'SETBACKS',
          applicableTo: ['BUILDING', 'ADDITION'],
          severity: 'ERROR',
        },
        {
          id: 'rule-4',
          jurisdictionId,
          codeType: 'ENERGY',
          ruleNumber: 'E-1',
          title: 'Energy Code Compliance',
          description: 'Building must meet minimum energy efficiency requirements',
          category: 'ENERGY',
          applicableTo: ['BUILDING', 'ADDITION'],
          severity: 'WARNING',
        }
      );
    }

    // Electrical code rules
    if (permitType === 'ELECTRICAL' || permitType === 'SOLAR') {
      rules.push({
        id: 'rule-5',
        jurisdictionId,
        codeType: 'BUILDING',
        ruleNumber: 'E-1',
        title: 'Electrical Code Compliance',
        description: 'Electrical work must comply with NEC',
        category: 'ELECTRICAL',
        applicableTo: ['ELECTRICAL', 'SOLAR'],
        severity: 'ERROR',
      });
    }

    return rules;
  }

  /**
   * Get design project data
   */
  private async getDesignProjectData(designProjectId: string): Promise<any> {
    const supabase = createClient();

    // Get project data
    const {data: project} = await supabase
      .from('Project')
      .select('*, property:propertyId(*)')
      .eq('id', designProjectId)
      .single();

    // Get deliverables (would include drawings with dimensions, etc.)
    // For now, return project data
    return {
      project,
      squareFootage: project?.property ? await this.estimateSquareFootage(designProjectId) : undefined,
      stories: await this.estimateStories(designProjectId),
    };
  }

  /**
   * Check a single rule
   */
  private async checkRule(rule: CodeRule, designData: any): Promise<ComplianceCheck> {
    // Perform rule-specific checks
    switch (rule.ruleNumber) {
      case 'R301.1':
        return this.checkMinimumRoomDimensions(rule, designData);
      case 'R302.1':
        return this.checkFireSeparation(rule, designData);
      case 'Z-1':
        return this.checkSetbacks(rule, designData);
      case 'E-1':
        return this.checkEnergyCompliance(rule, designData);
      default:
        return {
          ruleId: rule.id,
          ruleNumber: rule.ruleNumber,
          title: rule.title,
          status: 'UNKNOWN',
          message: 'Rule check not implemented',
          severity: rule.severity,
        };
    }
  }

  /**
   * Check minimum room dimensions
   */
  private checkMinimumRoomDimensions(rule: CodeRule, designData: any): ComplianceCheck {
    // In production, this would analyze floor plans
    // For now, return a placeholder
    return {
      ruleId: rule.id,
      ruleNumber: rule.ruleNumber,
      title: rule.title,
      status: 'REVIEW_REQUIRED',
      message: 'Floor plans required for dimension verification',
      severity: rule.severity,
    };
  }

  /**
   * Check fire separation
   */
  private checkFireSeparation(rule: CodeRule, designData: any): ComplianceCheck {
    // In production, this would check for fire-rated assemblies
    return {
      ruleId: rule.id,
      ruleNumber: rule.ruleNumber,
      title: rule.title,
      status: 'REVIEW_REQUIRED',
      message: 'Fire separation details required for review',
      severity: rule.severity,
    };
  }

  /**
   * Check setbacks
   */
  private checkSetbacks(rule: CodeRule, designData: any): ComplianceCheck {
    // In production, this would analyze site plans
    if (!designData.project?.property) {
      return {
        ruleId: rule.id,
        ruleNumber: rule.ruleNumber,
        title: rule.title,
        status: 'FAIL',
        message: 'Property information required for setback verification',
        severity: rule.severity,
      };
    }

    return {
      ruleId: rule.id,
      ruleNumber: rule.ruleNumber,
      title: rule.title,
      status: 'REVIEW_REQUIRED',
      message: 'Site plan required for setback verification',
      severity: rule.severity,
    };
  }

  /**
   * Check energy compliance
   */
  private checkEnergyCompliance(rule: CodeRule, designData: any): ComplianceCheck {
    // In production, this would check for energy calculations
    return {
      ruleId: rule.id,
      ruleNumber: rule.ruleNumber,
      title: rule.title,
      status: 'WARNING',
      message: 'Energy calculations recommended for projects over 1,000 sqft',
      severity: rule.severity,
    };
  }

  /**
   * Determine overall compliance status
   */
  private determineOverallStatus(checks: ComplianceCheck[]): ComplianceReport['overallStatus'] {
    const hasErrors = checks.some(c => c.status === 'FAIL' && c.severity === 'ERROR');
    const hasWarnings = checks.some(c => c.status === 'WARNING' || c.status === 'FAIL');
    const allPassed = checks.every(c => c.status === 'PASS');

    if (hasErrors) {
      return 'NON_COMPLIANT';
    }

    if (hasWarnings || checks.some(c => c.status === 'REVIEW_REQUIRED')) {
      return 'REVIEW_REQUIRED';
    }

    if (allPassed) {
      return 'COMPLIANT';
    }

    return 'REVIEW_REQUIRED';
  }

  /**
   * Estimate square footage (placeholder)
   */
  private async estimateSquareFootage(designProjectId: string): Promise<number | undefined> {
    // In production, this would calculate from floor plans
    return undefined;
  }

  /**
   * Estimate stories (placeholder)
   */
  private async estimateStories(designProjectId: string): Promise<number | undefined> {
    // In production, this would analyze elevations/sections
    return undefined;
  }
}

// Singleton instance
export const codeComplianceCheckerService = new CodeComplianceCheckerService();
