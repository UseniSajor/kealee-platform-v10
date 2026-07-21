/**
 * Accessibility Requirement Verification Service
 * ADA Standards and accessibility requirement verification
 */

import {codeBookIntegrationService} from './code-book-integration';
import {dimensionCheckerService, DimensionMeasurement} from './dimension-checker';

export interface AccessibilityRequirement {
  id: string;
  codeSection: string; // "ADA 206.2.1", "ADA 403.5", etc.
  title: string;
  description: string;
  type: 'ROUTE' | 'DOOR' | 'RAMP' | 'STAIR' | 'BATHROOM' | 'PARKING' | 'SIGNAGE';
  requirements: {
    parameter: string;
    minimum?: number;
    maximum?: number;
    required?: number;
    unit: string;
  }[];
}

export interface AccessibilityCheck {
  requirementId: string;
  requirementTitle: string;
  codeSection: string;
  type: AccessibilityRequirement['type'];
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

export class AccessibilityCheckerService {
  private requirements: AccessibilityRequirement[] = [];

  constructor() {
    this.initializeAccessibilityRequirements();
  }

  /**
   * Check accessibility compliance
   */
  async checkAccessibilityCompliance(
    requirementId: string,
    measurements: Record<string, DimensionMeasurement>
  ): Promise<AccessibilityCheck> {
    const requirement = this.requirements.find(r => r.id === requirementId);
    
    if (!requirement) {
      throw new Error(`Accessibility requirement ${requirementId} not found`);
    }

    const checks = requirement.requirements.map(req => {
      const measurement = measurements[req.parameter];
      
      if (!measurement) {
        return {
          parameter: req.parameter,
          compliant: false,
          message: `Measurement for ${req.parameter} not provided`,
        };
      }

      let compliant = true;
      let message = '';

      if (req.minimum !== undefined) {
        compliant = measurement.measuredValue >= req.minimum;
        message = compliant
          ? `${req.parameter}: ${measurement.measuredValue} ${measurement.unit} meets minimum of ${req.minimum} ${req.unit}`
          : `${req.parameter}: ${measurement.measuredValue} ${measurement.unit} is below minimum of ${req.minimum} ${req.unit}`;
      } else if (req.maximum !== undefined) {
        compliant = measurement.measuredValue <= req.maximum;
        message = compliant
          ? `${req.parameter}: ${measurement.measuredValue} ${measurement.unit} meets maximum of ${req.maximum} ${req.unit}`
          : `${req.parameter}: ${measurement.measuredValue} ${measurement.unit} exceeds maximum of ${req.maximum} ${req.unit}`;
      } else if (req.required !== undefined) {
        const tolerance = 0.01;
        compliant = Math.abs(measurement.measuredValue - req.required) < tolerance;
        message = compliant
          ? `${req.parameter}: ${measurement.measuredValue} ${measurement.unit} meets required value of ${req.required} ${req.unit}`
          : `${req.parameter}: ${measurement.measuredValue} ${measurement.unit} does not match required value of ${req.required} ${req.unit}`;
      }

      return {
        parameter: req.parameter,
        actualValue: measurement.measuredValue,
        requiredValue: req.minimum || req.maximum || req.required,
        compliant,
        message,
      };
    });

    const allCompliant = checks.every(c => c.compliant);
    const severity = allCompliant
      ? 'MINOR'
      : checks.some(c => !c.compliant && requirement.type === 'ROUTE' || requirement.type === 'DOOR')
      ? 'CRITICAL'
      : 'MAJOR';

    const overallMessage = allCompliant
      ? `${requirement.title}: All requirements met`
      : `${requirement.title}: ${checks.filter(c => !c.compliant).length} requirement(s) not met`;

    return {
      requirementId: requirement.id,
      requirementTitle: requirement.title,
      codeSection: requirement.codeSection,
      type: requirement.type,
      compliant: allCompliant,
      checks,
      overallMessage,
      severity,
    };
  }

  /**
   * Check accessible route (ADA 206.2.1)
   */
  async checkAccessibleRoute(
    width: DimensionMeasurement,
    slope?: DimensionMeasurement
  ): Promise<AccessibilityCheck> {
    const measurements: Record<string, DimensionMeasurement> = {
      width,
    };

    if (slope) {
      measurements.slope = slope;
    }

    return this.checkAccessibilityCompliance('ada-206-route', measurements);
  }

  /**
   * Check door clearance (ADA 404.2)
   */
  async checkDoorClearance(
    clearWidth: DimensionMeasurement,
    clearHeight: DimensionMeasurement
  ): Promise<AccessibilityCheck> {
    return this.checkAccessibilityCompliance('ada-404-door', {
      clearWidth,
      clearHeight,
    });
  }

  /**
   * Check ramp (ADA 405)
   */
  async checkRamp(
    slope: DimensionMeasurement,
    width: DimensionMeasurement,
    landingLength?: DimensionMeasurement
  ): Promise<AccessibilityCheck> {
    const measurements: Record<string, DimensionMeasurement> = {
      slope,
      width,
    };

    if (landingLength) {
      measurements.landingLength = landingLength;
    }

    return this.checkAccessibilityCompliance('ada-405-ramp', measurements);
  }

  /**
   * Check accessible bathroom (ADA 603)
   */
  async checkAccessibleBathroom(
    clearFloorSpace: DimensionMeasurement,
    grabBarHeight?: DimensionMeasurement,
    sinkHeight?: DimensionMeasurement
  ): Promise<AccessibilityCheck> {
    const measurements: Record<string, DimensionMeasurement> = {
      clearFloorSpace,
    };

    if (grabBarHeight) {
      measurements.grabBarHeight = grabBarHeight;
    }

    if (sinkHeight) {
      measurements.sinkHeight = sinkHeight;
    }

    return this.checkAccessibilityCompliance('ada-603-bathroom', measurements);
  }

  /**
   * Check accessible parking (ADA 208)
   */
  async checkAccessibleParking(
    spaceWidth: DimensionMeasurement,
    accessAisleWidth?: DimensionMeasurement
  ): Promise<AccessibilityCheck> {
    const measurements: Record<string, DimensionMeasurement> = {
      spaceWidth,
    };

    if (accessAisleWidth) {
      measurements.accessAisleWidth = accessAisleWidth;
    }

    return this.checkAccessibilityCompliance('ada-208-parking', measurements);
  }

  /**
   * Initialize accessibility requirements
   */
  private initializeAccessibilityRequirements() {
    this.requirements = [
      // Accessible Route (ADA 206.2.1)
      {
        id: 'ada-206-route',
        codeSection: 'ADA 206.2.1',
        title: 'Accessible Route Width',
        description: 'Accessible routes must have a minimum clear width of 36 inches',
        type: 'ROUTE',
        requirements: [
          {
            parameter: 'width',
            minimum: 36, // inches
            unit: 'inches',
          },
          {
            parameter: 'slope',
            maximum: 5, // percent
            unit: 'percent',
          },
        ],
      },
      // Door Clearance (ADA 404.2)
      {
        id: 'ada-404-door',
        codeSection: 'ADA 404.2',
        title: 'Door Clearance',
        description: 'Doors must have minimum clear width of 32 inches and clear height of 80 inches',
        type: 'DOOR',
        requirements: [
          {
            parameter: 'clearWidth',
            minimum: 32, // inches
            unit: 'inches',
          },
          {
            parameter: 'clearHeight',
            minimum: 80, // inches
            unit: 'inches',
          },
        ],
      },
      // Ramp (ADA 405)
      {
        id: 'ada-405-ramp',
        codeSection: 'ADA 405',
        title: 'Ramp Requirements',
        description: 'Ramps must have maximum slope of 8.33%, minimum width of 36 inches, and landings at intervals',
        type: 'RAMP',
        requirements: [
          {
            parameter: 'slope',
            maximum: 8.33, // percent
            unit: 'percent',
          },
          {
            parameter: 'width',
            minimum: 36, // inches
            unit: 'inches',
          },
          {
            parameter: 'landingLength',
            minimum: 60, // inches
            unit: 'inches',
          },
        ],
      },
      // Accessible Bathroom (ADA 603)
      {
        id: 'ada-603-bathroom',
        codeSection: 'ADA 603',
        title: 'Accessible Bathroom',
        description: 'Bathrooms must have minimum clear floor space and grab bar heights',
        type: 'BATHROOM',
        requirements: [
          {
            parameter: 'clearFloorSpace',
            minimum: 60, // inches (5 feet) square
            unit: 'inches',
          },
          {
            parameter: 'grabBarHeight',
            required: 33, // inches to 36 inches
            unit: 'inches',
          },
          {
            parameter: 'sinkHeight',
            maximum: 34, // inches
            unit: 'inches',
          },
        ],
      },
      // Accessible Parking (ADA 208)
      {
        id: 'ada-208-parking',
        codeSection: 'ADA 208',
        title: 'Accessible Parking',
        description: 'Accessible parking spaces must have minimum width and access aisle',
        type: 'PARKING',
        requirements: [
          {
            parameter: 'spaceWidth',
            minimum: 96, // inches (8 feet) for van spaces
            unit: 'inches',
          },
          {
            parameter: 'accessAisleWidth',
            minimum: 60, // inches (5 feet)
            unit: 'inches',
          },
        ],
      },
    ];
  }

  /**
   * Get all accessibility requirements
   */
  getRequirements(): AccessibilityRequirement[] {
    return this.requirements;
  }

  /**
   * Get requirement by type
   */
  getRequirementsByType(type: AccessibilityRequirement['type']): AccessibilityRequirement[] {
    return this.requirements.filter(r => r.type === type);
  }
}

// Singleton instance
export const accessibilityCheckerService = new AccessibilityCheckerService();
