// ============================================================
// CODE COMPLIANCE - RULE ENGINE
// Rule-based code compliance checking
// ============================================================

import { CodeRule, ComplianceCheck, Dimension, DetectedElement } from '../../types';

export class RuleEngine {
  private rules: CodeRule[] = [];

  /**
   * Load rules
   */
  loadRules(rules: CodeRule[]): void {
    this.rules = rules;
  }

  /**
   * Check compliance against a single rule
   */
  checkRule(
    rule: CodeRule,
    context: {
      dimensions?: Dimension[];
      elements?: DetectedElement[];
      projectData?: Record<string, any>;
    }
  ): ComplianceCheck {
    const result = this.evaluateRule(rule, context);

    return {
      ruleId: rule.id,
      rule,
      status: result.passed ? 'pass' : 'fail',
      message: result.message,
      confidence: result.confidence,
      evidence: result.evidence,
      suggestedFix: result.suggestedFix
    };
  }

  /**
   * Check compliance against all applicable rules
   */
  checkAllRules(
    context: {
      dimensions?: Dimension[];
      elements?: DetectedElement[];
      projectData?: Record<string, any>;
      permitType?: string;
    }
  ): ComplianceCheck[] {
    const applicableRules = this.getApplicableRules(context.permitType);
    
    return applicableRules.map(rule => this.checkRule(rule, context));
  }

  /**
   * Get rules applicable to permit type
   */
  private getApplicableRules(permitType?: string): CodeRule[] {
    if (!permitType) {
      return this.rules;
    }

    return this.rules.filter(rule => {
      if (!rule.applicableTo || rule.applicableTo.length === 0) {
        return true; // Apply to all if not specified
      }
      return rule.applicableTo.includes(permitType);
    });
  }

  /**
   * Evaluate a rule against context
   */
  private evaluateRule(
    rule: CodeRule,
    context: {
      dimensions?: Dimension[];
      elements?: DetectedElement[];
      projectData?: Record<string, any>;
    }
  ): {
    passed: boolean;
    message: string;
    confidence: number;
    evidence?: string;
    suggestedFix?: string;
  } {
    // Basic rule evaluation logic
    // This would be expanded with more sophisticated rule matching

    // Check for required dimensions
    if (rule.category === 'structural' && context.dimensions) {
      return this.checkStructuralRule(rule, context.dimensions);
    }

    // Check for required elements
    if (rule.category === 'accessibility' && context.elements) {
      return this.checkAccessibilityRule(rule, context.elements);
    }

    // Check fire safety rules
    if (rule.category === 'fire' && context.elements) {
      return this.checkFireSafetyRule(rule, context.elements);
    }

    // Default: needs review
    return {
      passed: false,
      message: `Rule ${rule.section} requires manual review`,
      confidence: 0.5,
      evidence: 'Automated checking not available for this rule type'
    };
  }

  /**
   * Check structural rules
   */
  private checkStructuralRule(
    rule: CodeRule,
    dimensions: Dimension[]
  ): {
    passed: boolean;
    message: string;
    confidence: number;
    evidence?: string;
    suggestedFix?: string;
  } {
    // Example: Check minimum room dimensions
    if (rule.section.includes('301') || rule.description.toLowerCase().includes('minimum')) {
      const roomDims = dimensions.filter(d => 
        d.element.includes('room') || d.element.includes('bedroom')
      );

      if (roomDims.length === 0) {
        return {
          passed: false,
          message: `No room dimensions found. ${rule.section} requires minimum room dimensions.`,
          confidence: 0.7,
          evidence: 'Missing dimension data',
          suggestedFix: 'Add room dimension annotations to plans'
        };
      }

      // Check if any room is too small (example: minimum 70 sq ft)
      const hasSmallRoom = roomDims.some(dim => {
        // Simplified check - would need proper area calculation
        return dim.value < 70;
      });

      if (hasSmallRoom) {
        return {
          passed: false,
          message: `Room dimensions may not meet minimum requirements per ${rule.section}`,
          confidence: 0.8,
          evidence: 'Room dimensions below threshold',
          suggestedFix: 'Verify room dimensions meet minimum code requirements'
        };
      }
    }

    return {
      passed: true,
      message: `Compliant with ${rule.section}`,
      confidence: 0.9
    };
  }

  /**
   * Check accessibility rules
   */
  private checkAccessibilityRule(
    rule: CodeRule,
    elements: DetectedElement[]
  ): {
    passed: boolean;
    message: string;
    confidence: number;
    evidence?: string;
    suggestedFix?: string;
  } {
    // Check for accessible routes, ramps, etc.
    if (rule.description.toLowerCase().includes('ramp') || 
        rule.description.toLowerCase().includes('accessible route')) {
      const ramps = elements.filter(e => 
        e.type === 'other' && 
        (e.label?.toLowerCase().includes('ramp') || 
         e.label?.toLowerCase().includes('accessible'))
      );

      if (ramps.length === 0 && rule.description.toLowerCase().includes('required')) {
        return {
          passed: false,
          message: `Accessible route/ramp may be required per ${rule.section}`,
          confidence: 0.7,
          evidence: 'No accessible route elements detected',
          suggestedFix: 'Add accessible route or verify accessibility requirements'
        };
      }
    }

    return {
      passed: true,
      message: `Accessibility requirements appear met per ${rule.section}`,
      confidence: 0.8
    };
  }

  /**
   * Check fire safety rules
   */
  private checkFireSafetyRule(
    rule: CodeRule,
    elements: DetectedElement[]
  ): {
    passed: boolean;
    message: string;
    confidence: number;
    evidence?: string;
    suggestedFix?: string;
  } {
    // Check for egress windows, exits, etc.
    if (rule.description.toLowerCase().includes('egress') ||
        rule.description.toLowerCase().includes('exit')) {
      const exits = elements.filter(e =>
        e.type === 'door' &&
        (e.label?.toLowerCase().includes('exit') ||
         e.label?.toLowerCase().includes('egress'))
      );

      if (exits.length === 0 && rule.description.toLowerCase().includes('required')) {
        return {
          passed: false,
          message: `Egress requirements per ${rule.section} may not be met`,
          confidence: 0.7,
          evidence: 'No egress doors/windows detected',
          suggestedFix: 'Verify egress requirements are met'
        };
      }
    }

    return {
      passed: true,
      message: `Fire safety requirements appear met per ${rule.section}`,
      confidence: 0.8
    };
  }
}
