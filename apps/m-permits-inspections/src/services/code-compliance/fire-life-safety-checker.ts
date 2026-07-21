/**
 * Fire and Life Safety Review Tools Service
 * Fire and life safety code compliance checking
 */

import {codeBookIntegrationService} from './code-book-integration';
import {dimensionCheckerService, DimensionMeasurement} from './dimension-checker';

export interface FireLifeSafetyRequirement {
  id: string;
  codeSection: string; // "IBC 1006", "NFPA 101", "IBC 703", etc.
  title: string;
  category: 'EGRESS' | 'FIRE_RATING' | 'SPRINKLERS' | 'ALARMS' | 'EXIT_SIGNS' | 'OCCUPANCY';
  requirements: {
    parameter: string;
    minimum?: number;
    maximum?: number;
    required?: number;
    unit: string;
  }[];
}

export interface FireLifeSafetyCheck {
  requirementId: string;
  codeSection: string;
  category: FireLifeSafetyRequirement['category'];
  compliant: boolean;
  checks: Array<{
    parameter: string;
    actualValue?: number;
    requiredValue?: number;
    compliant: boolean;
    message: string;
  }>;
  overallMessage: string;
  severity: 'MINOR' | 'MAJOR' | 'CRITICAL';
}

export class FireLifeSafetyCheckerService {
  private requirements: FireLifeSafetyRequirement[] = [];

  constructor() {
    this.initializeFireLifeSafetyRequirements();
  }

  /**
   * Check fire and life safety compliance
   */
  async checkFireLifeSafetyCompliance(
    requirementId: string,
    measurements: Record<string, DimensionMeasurement | number>
  ): Promise<FireLifeSafetyCheck> {
    const requirement = this.requirements.find(r => r.id === requirementId);
    
    if (!requirement) {
      throw new Error(`Fire/life safety requirement ${requirementId} not found`);
    }

    const checks = requirement.requirements.map(req => {
      const measurement = measurements[req.parameter];
      let actualValue: number | undefined;
      
      if (typeof measurement === 'number') {
        actualValue = measurement;
      } else if (measurement && 'measuredValue' in measurement) {
        actualValue = measurement.measuredValue;
      }

      if (actualValue === undefined) {
        return {
          parameter: req.parameter,
          compliant: false,
          message: `Value for ${req.parameter} not provided`,
        };
      }

      let compliant = true;
      let message = '';

      if (req.minimum !== undefined) {
        compliant = actualValue >= req.minimum;
        message = compliant
          ? `${req.parameter}: ${actualValue} ${req.unit} meets minimum of ${req.minimum} ${req.unit}`
          : `${req.parameter}: ${actualValue} ${req.unit} is below minimum of ${req.minimum} ${req.unit}`;
      } else if (req.maximum !== undefined) {
        compliant = actualValue <= req.maximum;
        message = compliant
          ? `${req.parameter}: ${actualValue} ${req.unit} meets maximum of ${req.maximum} ${req.unit}`
          : `${req.parameter}: ${actualValue} ${req.unit} exceeds maximum of ${req.maximum} ${req.unit}`;
      } else if (req.required !== undefined) {
        const tolerance = 0.01;
        compliant = Math.abs(actualValue - req.required) < tolerance;
        message = compliant
          ? `${req.parameter}: ${actualValue} ${req.unit} meets required value of ${req.required} ${req.unit}`
          : `${req.parameter}: ${actualValue} ${req.unit} does not match required value of ${req.required} ${req.unit}`;
      }

      return {
        parameter: req.parameter,
        actualValue,
        requiredValue: req.minimum || req.maximum || req.required,
        compliant,
        message,
      };
    });

    const allCompliant = checks.every(c => c.compliant);
    
    // Fire/life safety requirements are always critical when non-compliant
    const severity = allCompliant
      ? 'MINOR'
      : 'CRITICAL';

    const overallMessage = allCompliant
      ? `${requirement.title}: All requirements met`
      : `${requirement.title}: ${checks.filter(c => !c.compliant).length} requirement(s) not met - CRITICAL`;

    return {
      requirementId: requirement.id,
      codeSection: requirement.codeSection,
      category: requirement.category,
      compliant: allCompliant,
      checks,
      overallMessage,
      severity,
    };
  }

  /**
   * Check egress requirements (IBC 1006)
   */
  async checkEgress(
    egressWidth: DimensionMeasurement,
    occupancyLoad: number,
    travelDistance?: DimensionMeasurement
  ): Promise<FireLifeSafetyCheck> {
    const measurements: Record<string, DimensionMeasurement | number> = {
      egressWidth,
      occupancyLoad,
    };

    if (travelDistance) {
      measurements.travelDistance = travelDistance;
    }

    return this.checkFireLifeSafetyCompliance('ibc-1006-egress', measurements);
  }

  /**
   * Check fire rating requirements (IBC 703)
   */
  async checkFireRating(
    assemblyType: string,
    requiredRating: number,
    providedRating: number
  ): Promise<FireLifeSafetyCheck> {
    return this.checkFireLifeSafetyCompliance('ibc-703-fire-rating', {
      requiredRating,
      providedRating,
    });
  }

  /**
   * Check sprinkler requirements (NFPA 13)
   */
  async checkSprinklers(
    occupancyType: string,
    hasSprinklers: boolean,
    coverageArea?: number
  ): Promise<FireLifeSafetyCheck> {
    const measurements: Record<string, DimensionMeasurement | number> = {
      hasSprinklers: hasSprinklers ? 1 : 0,
    };

    if (coverageArea !== undefined) {
      measurements.coverageArea = coverageArea;
    }

    return this.checkFireLifeSafetyCompliance('nfpa-13-sprinklers', measurements);
  }

  /**
   * Check exit sign requirements (NFPA 101)
   */
  async checkExitSigns(
    exitSignCount: number,
    requiredCount: number,
    illuminationLevel?: number
  ): Promise<FireLifeSafetyCheck> {
    const measurements: Record<string, DimensionMeasurement | number> = {
      exitSignCount,
      requiredCount,
    };

    if (illuminationLevel !== undefined) {
      measurements.illuminationLevel = illuminationLevel;
    }

    return this.checkFireLifeSafetyCompliance('nfpa-101-exit-signs', measurements);
  }

  /**
   * Initialize fire and life safety requirements
   */
  private initializeFireLifeSafetyRequirements() {
    this.requirements = [
      // Egress Requirements (IBC 1006)
      {
        id: 'ibc-1006-egress',
        codeSection: 'IBC 1006.2',
        title: 'Egress Width Requirements',
        category: 'EGRESS',
        requirements: [
          {
            parameter: 'egressWidth',
            minimum: 44, // inches (absolute minimum)
            unit: 'inches',
          },
          {
            parameter: 'occupancyLoad',
            minimum: 1,
            unit: 'persons',
          },
          {
            parameter: 'travelDistance',
            maximum: 200, // feet (for most occupancies)
            unit: 'feet',
          },
        ],
      },
      // Fire Rating (IBC 703)
      {
        id: 'ibc-703-fire-rating',
        codeSection: 'IBC 703',
        title: 'Fire-Resistance Rating',
        category: 'FIRE_RATING',
        requirements: [
          {
            parameter: 'providedRating',
            minimum: 0, // Will be checked against required
            unit: 'hours',
          },
          {
            parameter: 'requiredRating',
            minimum: 0,
            unit: 'hours',
          },
        ],
      },
      // Sprinklers (NFPA 13)
      {
        id: 'nfpa-13-sprinklers',
        codeSection: 'NFPA 13',
        title: 'Automatic Sprinkler Systems',
        category: 'SPRINKLERS',
        requirements: [
          {
            parameter: 'hasSprinklers',
            required: 1,
            unit: 'boolean',
          },
        ],
      },
      // Exit Signs (NFPA 101)
      {
        id: 'nfpa-101-exit-signs',
        codeSection: 'NFPA 101',
        title: 'Exit Signage Requirements',
        category: 'EXIT_SIGNS',
        requirements: [
          {
            parameter: 'exitSignCount',
            minimum: 0, // Will be checked against required
            unit: 'count',
          },
          {
            parameter: 'requiredCount',
            minimum: 1,
            unit: 'count',
          },
          {
            parameter: 'illuminationLevel',
            minimum: 5, // foot-candles
            unit: 'foot-candles',
          },
        ],
      },
    ];
  }

  /**
   * Get all fire and life safety requirements
   */
  getRequirements(): FireLifeSafetyRequirement[] {
    return this.requirements;
  }

  /**
   * Get requirements by category
   */
  getRequirementsByCategory(category: FireLifeSafetyRequirement['category']): FireLifeSafetyRequirement[] {
    return this.requirements.filter(r => r.category === category);
  }
}

// Singleton instance
export const fireLifeSafetyCheckerService = new FireLifeSafetyCheckerService();
