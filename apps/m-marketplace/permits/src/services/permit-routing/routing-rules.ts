/**
 * Routing Rules Service
 * Defines rules for routing permit applications to correct review disciplines
 */

import {ReviewDiscipline} from '@permits/src/types/jurisdiction-staff';

export type PermitType =
  | 'BUILDING'
  | 'ELECTRICAL'
  | 'PLUMBING'
  | 'MECHANICAL'
  | 'FIRE'
  | 'GRADING'
  | 'DEMOLITION'
  | 'SIGN'
  | 'FENCE'
  | 'ROOFING'
  | 'HVAC'
  | 'SOLAR'
  | 'POOL';

export interface RoutingRule {
  id: string;
  name: string;
  permitType: PermitType;
  requiredDisciplines: ReviewDiscipline[];
  conditionalDisciplines?: Array<{
    condition: (permit: PermitData) => boolean;
    disciplines: ReviewDiscipline[];
  }>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedHours: number;
  autoApprove?: boolean; // Auto-approve if no issues found
}

export interface PermitData {
  id: string;
  permitType: PermitType;
  subtype?: string;
  valuation: number;
  squareFootage?: number;
  expedited: boolean;
  jurisdictionId: string;
  propertyId: string;
  zoning?: string;
  occupancyType?: string;
  constructionType?: string;
  isResubmission: boolean;
  previousReviewId?: string;
  correctionsRequired?: boolean;
}

export class RoutingRulesService {
  private rules: RoutingRule[] = [];

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Get required disciplines for a permit
   */
  getRequiredDisciplines(permit: PermitData): ReviewDiscipline[] {
    const rule = this.findMatchingRule(permit);
    if (!rule) {
      return this.getDefaultDisciplines(permit.permitType);
    }

    const disciplines = new Set<ReviewDiscipline>(rule.requiredDisciplines);

    // Add conditional disciplines
    if (rule.conditionalDisciplines) {
      for (const conditional of rule.conditionalDisciplines) {
        if (conditional.condition(permit)) {
          conditional.disciplines.forEach(d => disciplines.add(d));
        }
      }
    }

    return Array.from(disciplines);
  }

  /**
   * Get routing priority for permit
   */
  getRoutingPriority(permit: PermitData): 'low' | 'medium' | 'high' | 'urgent' {
    const rule = this.findMatchingRule(permit);
    
    // Expedited permits are always high priority
    if (permit.expedited) {
      return 'urgent';
    }

    // Resubmissions with corrections are high priority
    if (permit.isResubmission && permit.correctionsRequired) {
      return 'high';
    }

    // Large projects are high priority
    if (permit.valuation > 1000000) {
      return 'high';
    }

    return rule?.priority || 'medium';
  }

  /**
   * Get estimated review hours
   */
  getEstimatedHours(permit: PermitData): number {
    const rule = this.findMatchingRule(permit);
    if (!rule) return 4; // Default

    // Adjust based on project size
    let hours = rule.estimatedHours;
    
    if (permit.valuation > 500000) {
      hours *= 1.5;
    }
    if (permit.valuation > 2000000) {
      hours *= 2;
    }

    // Expedited reviews take less time (focused review)
    if (permit.expedited) {
      hours *= 0.7;
    }

    return Math.ceil(hours);
  }

  /**
   * Check if permit can be auto-approved
   */
  canAutoApprove(permit: PermitData): boolean {
    const rule = this.findMatchingRule(permit);
    return rule?.autoApprove || false;
  }

  /**
   * Find matching rule for permit
   */
  private findMatchingRule(permit: PermitData): RoutingRule | undefined {
    return this.rules.find(rule => rule.permitType === permit.permitType);
  }

  /**
   * Get default disciplines for permit type
   */
  private getDefaultDisciplines(permitType: PermitType): ReviewDiscipline[] {
    const defaults: Record<PermitType, ReviewDiscipline[]> = {
      BUILDING: ['ZONING', 'BUILDING', 'STRUCTURAL'],
      ELECTRICAL: ['ELECTRICAL'],
      PLUMBING: ['PLUMBING'],
      MECHANICAL: ['MECHANICAL'],
      FIRE: ['FIRE'],
      GRADING: ['ZONING', 'ENVIRONMENTAL'],
      DEMOLITION: ['ZONING', 'BUILDING'],
      SIGN: ['ZONING'],
      FENCE: ['ZONING'],
      ROOFING: ['BUILDING'],
      HVAC: ['MECHANICAL'],
      SOLAR: ['ELECTRICAL', 'STRUCTURAL'],
      POOL: ['BUILDING', 'PLUMBING', 'ELECTRICAL'],
    };

    return defaults[permitType] || ['BUILDING'];
  }

  /**
   * Initialize default routing rules
   */
  private initializeDefaultRules() {
    this.rules = [
      // Building Permits
      {
        id: 'rule-building-residential',
        name: 'Residential Building Permit',
        permitType: 'BUILDING',
        requiredDisciplines: ['ZONING', 'BUILDING'],
        conditionalDisciplines: [
          {
            condition: (p) => (p.valuation || 0) > 50000,
            disciplines: ['STRUCTURAL'],
          },
          {
            condition: (p) => (p.squareFootage || 0) > 2000,
            disciplines: ['FIRE'],
          },
        ],
        priority: 'medium',
        estimatedHours: 4,
      },
      {
        id: 'rule-building-commercial',
        name: 'Commercial Building Permit',
        permitType: 'BUILDING',
        requiredDisciplines: ['ZONING', 'BUILDING', 'FIRE', 'STRUCTURAL'],
        conditionalDisciplines: [
          {
            condition: (p) => p.occupancyType === 'Industrial',
            disciplines: ['ENVIRONMENTAL'],
          },
        ],
        priority: 'high',
        estimatedHours: 8,
      },
      // Electrical Permits
      {
        id: 'rule-electrical',
        name: 'Electrical Permit',
        permitType: 'ELECTRICAL',
        requiredDisciplines: ['ELECTRICAL'],
        priority: 'medium',
        estimatedHours: 2,
        autoApprove: true, // Simple electrical work can auto-approve
      },
      // Plumbing Permits
      {
        id: 'rule-plumbing',
        name: 'Plumbing Permit',
        permitType: 'PLUMBING',
        requiredDisciplines: ['PLUMBING'],
        priority: 'medium',
        estimatedHours: 2,
        autoApprove: true,
      },
      // Mechanical/HVAC Permits
      {
        id: 'rule-mechanical',
        name: 'Mechanical Permit',
        permitType: 'MECHANICAL',
        requiredDisciplines: ['MECHANICAL'],
        priority: 'medium',
        estimatedHours: 3,
      },
      {
        id: 'rule-hvac',
        name: 'HVAC Permit',
        permitType: 'HVAC',
        requiredDisciplines: ['MECHANICAL'],
        priority: 'medium',
        estimatedHours: 2,
      },
      // Fire Permits
      {
        id: 'rule-fire',
        name: 'Fire Permit',
        permitType: 'FIRE',
        requiredDisciplines: ['FIRE'],
        priority: 'high',
        estimatedHours: 3,
      },
      // Grading Permits
      {
        id: 'rule-grading',
        name: 'Grading Permit',
        permitType: 'GRADING',
        requiredDisciplines: ['ZONING', 'ENVIRONMENTAL'],
        conditionalDisciplines: [
          {
            condition: (p) => (p.valuation || 0) > 100000,
            disciplines: ['BUILDING'],
          },
        ],
        priority: 'medium',
        estimatedHours: 4,
      },
      // Demolition Permits
      {
        id: 'rule-demolition',
        name: 'Demolition Permit',
        permitType: 'DEMOLITION',
        requiredDisciplines: ['ZONING', 'BUILDING'],
        priority: 'high',
        estimatedHours: 3,
      },
      // Solar Permits
      {
        id: 'rule-solar',
        name: 'Solar Permit',
        permitType: 'SOLAR',
        requiredDisciplines: ['ELECTRICAL', 'STRUCTURAL'],
        priority: 'medium',
        estimatedHours: 4,
      },
      // Pool Permits
      {
        id: 'rule-pool',
        name: 'Pool Permit',
        permitType: 'POOL',
        requiredDisciplines: ['BUILDING', 'PLUMBING', 'ELECTRICAL'],
        priority: 'medium',
        estimatedHours: 5,
      },
      // Simple Permits (auto-approve)
      {
        id: 'rule-sign',
        name: 'Sign Permit',
        permitType: 'SIGN',
        requiredDisciplines: ['ZONING'],
        priority: 'low',
        estimatedHours: 1,
        autoApprove: true,
      },
      {
        id: 'rule-fence',
        name: 'Fence Permit',
        permitType: 'FENCE',
        requiredDisciplines: ['ZONING'],
        priority: 'low',
        estimatedHours: 1,
        autoApprove: true,
      },
      {
        id: 'rule-roofing',
        name: 'Roofing Permit',
        permitType: 'ROOFING',
        requiredDisciplines: ['BUILDING'],
        priority: 'medium',
        estimatedHours: 2,
        autoApprove: true,
      },
    ];
  }

  /**
   * Add custom routing rule
   */
  addRule(rule: RoutingRule): void {
    this.rules.push(rule);
  }

  /**
   * Get all rules
   */
  getAllRules(): RoutingRule[] {
    return [...this.rules];
  }
}

// Singleton instance
export const routingRulesService = new RoutingRulesService();
