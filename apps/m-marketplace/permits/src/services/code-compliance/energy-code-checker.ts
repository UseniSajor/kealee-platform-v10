/**
 * Energy Code Compliance Analysis Service
 * Energy code compliance checking (IECC, Title 24, etc.)
 */

import {codeBookIntegrationService} from './code-book-integration';

export interface EnergyCodeRequirement {
  id: string;
  codeSection: string; // "IECC R402.1", "IECC R403.1", etc.
  title: string;
  category: 'INSULATION' | 'WINDOWS' | 'HEATING' | 'COOLING' | 'LIGHTING' | 'ENVELOPE';
  climateZone: string; // "1", "2", "3", etc.
  requirements: {
    component: string; // "Wall R-Value", "Window U-Factor", "Ceiling R-Value"
    parameter: string;
    minimum?: number;
    maximum?: number;
    unit: string;
  }[];
}

export interface EnergyCodeCheck {
  requirementId: string;
  codeSection: string;
  category: EnergyCodeRequirement['category'];
  climateZone: string;
  compliant: boolean;
  checks: Array<{
    component: string;
    actualValue?: number;
    requiredValue?: number;
    compliant: boolean;
    message: string;
  }>;
  overallMessage: string;
  severity: 'MINOR' | 'MAJOR' | 'CRITICAL';
}

export interface BuildingEnvelopeData {
  wallRValue?: number; // R-value
  ceilingRValue?: number; // R-value
  floorRValue?: number; // R-value
  windowUFactor?: number; // U-factor
  windowSHGC?: number; // Solar Heat Gain Coefficient
  airLeakage?: number; // ACH50 (Air Changes per Hour at 50 Pa)
}

export class EnergyCodeCheckerService {
  private requirements: Map<string, EnergyCodeRequirement[]> = new Map();

  constructor() {
    this.initializeEnergyCodeRequirements();
  }

  /**
   * Check energy code compliance
   */
  async checkEnergyCodeCompliance(
    climateZone: string,
    buildingType: string,
    envelopeData: BuildingEnvelopeData
  ): Promise<EnergyCodeCheck[]> {
    const zoneRequirements = this.requirements.get(climateZone) || [];
    const checks: EnergyCodeCheck[] = [];

    for (const requirement of zoneRequirements) {
      const check: EnergyCodeCheck = {
        requirementId: requirement.id,
        codeSection: requirement.codeSection,
        category: requirement.category,
        climateZone,
        compliant: true,
        checks: [],
        overallMessage: '',
        severity: 'MINOR',
      };

      // Check each component
      for (const req of requirement.requirements) {
        let actualValue: number | undefined;
        let compliant = true;
        let message = '';

        // Map component to envelope data
        switch (req.component) {
          case 'Wall R-Value':
            actualValue = envelopeData.wallRValue;
            break;
          case 'Ceiling R-Value':
            actualValue = envelopeData.ceilingRValue;
            break;
          case 'Floor R-Value':
            actualValue = envelopeData.floorRValue;
            break;
          case 'Window U-Factor':
            actualValue = envelopeData.windowUFactor;
            break;
          case 'Window SHGC':
            actualValue = envelopeData.windowSHGC;
            break;
          case 'Air Leakage':
            actualValue = envelopeData.airLeakage;
            break;
        }

        if (actualValue === undefined) {
          compliant = false;
          message = `${req.component}: Value not provided`;
        } else {
          if (req.minimum !== undefined) {
            compliant = actualValue >= req.minimum;
            message = compliant
              ? `${req.component}: ${actualValue} ${req.unit} meets minimum of ${req.minimum} ${req.unit}`
              : `${req.component}: ${actualValue} ${req.unit} is below minimum of ${req.minimum} ${req.unit}`;
          } else if (req.maximum !== undefined) {
            compliant = actualValue <= req.maximum;
            message = compliant
              ? `${req.component}: ${actualValue} ${req.unit} meets maximum of ${req.maximum} ${req.unit}`
              : `${req.component}: ${actualValue} ${req.unit} exceeds maximum of ${req.maximum} ${req.unit}`;
          }
        }

        check.checks.push({
          component: req.component,
          actualValue,
          requiredValue: req.minimum || req.maximum,
          compliant,
          message,
        });

        if (!compliant) {
          check.compliant = false;
        }
      }

      // Determine severity
      const nonCompliantCount = check.checks.filter(c => !c.compliant).length;
      check.severity = check.compliant
        ? 'MINOR'
        : nonCompliantCount > 2
        ? 'CRITICAL'
        : 'MAJOR';

      check.overallMessage = check.compliant
        ? `${requirement.title}: All requirements met`
        : `${requirement.title}: ${nonCompliantCount} requirement(s) not met`;

      checks.push(check);
    }

    return checks;
  }

  /**
   * Check insulation requirements (IECC R402)
   */
  async checkInsulation(
    climateZone: string,
    wallRValue: number,
    ceilingRValue: number,
    floorRValue?: number
  ): Promise<EnergyCodeCheck[]> {
    return this.checkEnergyCodeCompliance(climateZone, 'Residential', {
      wallRValue,
      ceilingRValue,
      floorRValue,
    });
  }

  /**
   * Check window requirements (IECC R402.1.2)
   */
  async checkWindows(
    climateZone: string,
    windowUFactor: number,
    windowSHGC: number
  ): Promise<EnergyCodeCheck[]> {
    return this.checkEnergyCodeCompliance(climateZone, 'Residential', {
      windowUFactor,
      windowSHGC,
    });
  }

  /**
   * Initialize energy code requirements by climate zone
   */
  private initializeEnergyCodeRequirements() {
    // Climate Zone 3 requirements (example)
    this.requirements.set('3', [
      {
        id: 'iecc-r402-insulation',
        codeSection: 'IECC R402.1',
        title: 'Building Thermal Envelope Insulation',
        category: 'INSULATION',
        climateZone: '3',
        requirements: [
          {
            component: 'Wall R-Value',
            parameter: 'rValue',
            minimum: 20,
            unit: 'R-value',
          },
          {
            component: 'Ceiling R-Value',
            parameter: 'rValue',
            minimum: 38,
            unit: 'R-value',
          },
          {
            component: 'Floor R-Value',
            parameter: 'rValue',
            minimum: 19,
            unit: 'R-value',
          },
        ],
      },
      {
        id: 'iecc-r402-windows',
        codeSection: 'IECC R402.1.2',
        title: 'Fenestration U-Factor and SHGC',
        category: 'WINDOWS',
        climateZone: '3',
        requirements: [
          {
            component: 'Window U-Factor',
            parameter: 'uFactor',
            maximum: 0.30,
            unit: 'U-factor',
          },
          {
            component: 'Window SHGC',
            parameter: 'shgc',
            maximum: 0.40,
            unit: 'SHGC',
          },
        ],
      },
      {
        id: 'iecc-r402-air-leakage',
        codeSection: 'IECC R402.4',
        title: 'Air Leakage',
        category: 'ENVELOPE',
        climateZone: '3',
        requirements: [
          {
            component: 'Air Leakage',
            parameter: 'ach50',
            maximum: 3,
            unit: 'ACH50',
          },
        ],
      },
    ]);

    // Climate Zone 4 requirements
    this.requirements.set('4', [
      {
        id: 'iecc-r402-insulation-4',
        codeSection: 'IECC R402.1',
        title: 'Building Thermal Envelope Insulation',
        category: 'INSULATION',
        climateZone: '4',
        requirements: [
          {
            component: 'Wall R-Value',
            parameter: 'rValue',
            minimum: 20,
            unit: 'R-value',
          },
          {
            component: 'Ceiling R-Value',
            parameter: 'rValue',
            minimum: 38,
            unit: 'R-value',
          },
          {
            component: 'Floor R-Value',
            parameter: 'rValue',
            minimum: 30,
            unit: 'R-value',
          },
        ],
      },
    ]);

    // Climate Zone 5 requirements
    this.requirements.set('5', [
      {
        id: 'iecc-r402-insulation-5',
        codeSection: 'IECC R402.1',
        title: 'Building Thermal Envelope Insulation',
        category: 'INSULATION',
        climateZone: '5',
        requirements: [
          {
            component: 'Wall R-Value',
            parameter: 'rValue',
            minimum: 20,
            unit: 'R-value',
          },
          {
            component: 'Ceiling R-Value',
            parameter: 'rValue',
            minimum: 49,
            unit: 'R-value',
          },
          {
            component: 'Floor R-Value',
            parameter: 'rValue',
            minimum: 30,
            unit: 'R-value',
          },
        ],
      },
    ]);
  }

  /**
   * Get requirements for climate zone
   */
  getRequirementsForZone(climateZone: string): EnergyCodeRequirement[] {
    return this.requirements.get(climateZone) || [];
  }

  /**
   * Get climate zone from location
   */
  async getClimateZone(
    state: string,
    county?: string,
    city?: string
  ): Promise<string> {
    // In production, would use a climate zone lookup service/API
    // For now, return default zone 4 (typical for many areas)
    const defaultZones: Record<string, string> = {
      'CA': '3',
      'TX': '2',
      'FL': '2',
      'NY': '5',
      'WA': '4',
      'OR': '4',
    };

    return defaultZones[state] || '4';
  }
}

// Singleton instance
export const energyCodeCheckerService = new EnergyCodeCheckerService();
