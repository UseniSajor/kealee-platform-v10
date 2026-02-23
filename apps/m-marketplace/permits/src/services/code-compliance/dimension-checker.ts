/**
 * Automated Dimension Checking Service
 * Automated dimension checking on drawings
 */

import {measurementToolsService} from '@permits/src/services/plan-review/measurement-tools';
import {codeBookIntegrationService} from './code-book-integration';

export interface DimensionMeasurement {
  id: string;
  documentId: string;
  pageNumber: number;
  type: 'DISTANCE' | 'AREA' | 'HEIGHT' | 'WIDTH' | 'DEPTH';
  name: string; // "Egress Width", "Ceiling Height", "Room Area"
  points: Array<{x: number; y: number}>;
  measuredValue: number;
  unit: 'inches' | 'feet' | 'meters';
  scale?: number; // Drawing scale
  codeReference?: string; // Code section this measurement relates to
}

export interface DimensionComplianceCheck {
  measurementId: string;
  measurementName: string;
  codeSection: string;
  measuredValue: number;
  requiredValue?: number;
  minimumValue?: number;
  maximumValue?: number;
  compliant: boolean;
  variance?: number;
  variancePercent?: number;
  message: string;
  severity: 'MINOR' | 'MAJOR' | 'CRITICAL';
}

export class DimensionCheckerService {
  /**
   * Check dimension compliance
   */
  async checkDimensionCompliance(
    measurement: DimensionMeasurement,
    codeBook: string,
    sectionNumber: string
  ): Promise<DimensionComplianceCheck> {
    // Get code requirement
    const complianceCheck = await codeBookIntegrationService.checkCompliance(
      codeBook,
      sectionNumber,
      'dimension',
      measurement.measuredValue
    );

    // Convert units if needed
    let measuredValue = measurement.measuredValue;
    if (complianceCheck.requirement.unit !== measurement.unit) {
      measuredValue = measurementToolsService.convertUnit(
        measurement.measuredValue,
        measurement.unit,
        complianceCheck.requirement.unit as any
      );
    }

    // Calculate variance
    const requiredValue = complianceCheck.requiredValue;
    const variance = requiredValue
      ? Math.abs(measuredValue - requiredValue)
      : undefined;
    const variancePercent = requiredValue && variance
      ? (variance / requiredValue) * 100
      : undefined;

    // Determine minimum/maximum based on requirement type
    let minimumValue: number | undefined;
    let maximumValue: number | undefined;

    if (complianceCheck.requirement.type === 'MINIMUM') {
      minimumValue = requiredValue;
    } else if (complianceCheck.requirement.type === 'MAXIMUM') {
      maximumValue = requiredValue;
    }

    return {
      measurementId: measurement.id,
      measurementName: measurement.name,
      codeSection: complianceCheck.sectionNumber,
      measuredValue,
      requiredValue,
      minimumValue,
      maximumValue,
      compliant: complianceCheck.compliant,
      variance,
      variancePercent,
      message: complianceCheck.message,
      severity: complianceCheck.severity,
    };
  }

  /**
   * Check multiple dimensions
   */
  async checkMultipleDimensions(
    measurements: DimensionMeasurement[],
    codeBook: string,
    sectionNumber: string
  ): Promise<DimensionComplianceCheck[]> {
    const checks: DimensionComplianceCheck[] = [];

    for (const measurement of measurements) {
      try {
        const check = await this.checkDimensionCompliance(
          measurement,
          codeBook,
          sectionNumber
        );
        checks.push(check);
      } catch (error) {
        console.error(`Failed to check dimension ${measurement.id}:`, error);
      }
    }

    return checks;
  }

  /**
   * Check egress width compliance
   */
  async checkEgressWidth(
    measurement: DimensionMeasurement,
    occupancyLoad: number
  ): Promise<DimensionComplianceCheck> {
    // IBC Section 1006: Egress width based on occupancy load
    // 0.3 inches per person (min 44 inches)
    const minWidthPerPerson = 0.3; // inches
    const absoluteMinimum = 44; // inches

    const requiredWidth = Math.max(
      absoluteMinimum,
      occupancyLoad * minWidthPerPerson
    );

    const compliant = measurement.measuredValue >= requiredWidth;
    const variance = Math.abs(measurement.measuredValue - requiredWidth);
    const variancePercent = (variance / requiredWidth) * 100;

    const severity: 'MINOR' | 'MAJOR' | 'CRITICAL' =
      !compliant && variancePercent > 10 ? 'CRITICAL' :
      !compliant && variancePercent > 5 ? 'MAJOR' : 'MINOR';

    return {
      measurementId: measurement.id,
      measurementName: 'Egress Width',
      codeSection: 'IBC 1006.2',
      measuredValue: measurement.measuredValue,
      minimumValue: requiredWidth,
      compliant,
      variance,
      variancePercent,
      message: `Egress width: ${measurement.measuredValue} inches. Required: ${requiredWidth} inches (based on occupancy load of ${occupancyLoad} persons).`,
      severity,
    };
  }

  /**
   * Check ceiling height compliance
   */
  async checkCeilingHeight(
    measurement: DimensionMeasurement,
    roomType: string = 'Habitable Space'
  ): Promise<DimensionComplianceCheck> {
    // IBC Section 1208: Minimum ceiling heights
    // Habitable space: 7'6" min
    // Bathroom: 7'0" min
    const minimums: Record<string, number> = {
      'Habitable Space': 90, // inches (7'6")
      'Bathroom': 84, // inches (7'0")
      'Corridor': 84, // inches (7'0")
      'Basement': 84, // inches (7'0")
    };

    const requiredHeight = minimums[roomType] || minimums['Habitable Space'];

    const compliant = measurement.measuredValue >= requiredHeight;
    const variance = Math.abs(measurement.measuredValue - requiredHeight);
    const variancePercent = (variance / requiredHeight) * 100;

    const severity: 'MINOR' | 'MAJOR' | 'CRITICAL' =
      !compliant && variancePercent > 10 ? 'CRITICAL' :
      !compliant ? 'MAJOR' : 'MINOR';

    return {
      measurementId: measurement.id,
      measurementName: `Ceiling Height - ${roomType}`,
      codeSection: 'IBC 1208.2',
      measuredValue: measurement.measuredValue,
      minimumValue: requiredHeight,
      compliant,
      variance,
      variancePercent,
      message: `Ceiling height: ${measurement.measuredValue} inches. Required minimum: ${requiredHeight} inches (${requiredHeight / 12} feet) for ${roomType}.`,
      severity,
    };
  }

  /**
   * Check room area compliance
   */
  async checkRoomArea(
    measurement: DimensionMeasurement,
    roomType: string = 'Habitable Room'
  ): Promise<DimensionComplianceCheck> {
    // IBC Section 1208: Minimum room dimensions
    // Habitable room: 70 sq ft min, 7' min dimension
    const minimums: Record<string, number> = {
      'Habitable Room': 1008, // sq inches (70 sq ft)
      'Bedroom': 1008, // sq inches
      'Kitchen': 864, // sq inches (6 sq ft work area)
      'Bathroom': 360, // sq inches (2.5 sq ft)
    };

    const requiredArea = minimums[roomType] || minimums['Habitable Room'];

    // Convert to square inches if needed
    let measuredArea = measurement.measuredValue;
    if (measurement.unit === 'feet') {
      measuredArea = measurement.measuredValue * 144; // sq inches
    } else if (measurement.unit === 'meters') {
      measuredArea = measurement.measuredValue * 1550; // sq inches
    }

    const compliant = measuredArea >= requiredArea;
    const variance = Math.abs(measuredArea - requiredArea);
    const variancePercent = (variance / requiredArea) * 100;

    const severity: 'MINOR' | 'MAJOR' | 'CRITICAL' =
      !compliant && variancePercent > 20 ? 'CRITICAL' :
      !compliant && variancePercent > 10 ? 'MAJOR' : 'MINOR';

    return {
      measurementId: measurement.id,
      measurementName: `Room Area - ${roomType}`,
      codeSection: 'IBC 1208.1',
      measuredValue: measuredArea,
      minimumValue: requiredArea,
      compliant,
      variance,
      variancePercent,
      message: `Room area: ${(measuredArea / 144).toFixed(1)} sq ft. Required minimum: ${(requiredArea / 144).toFixed(1)} sq ft for ${roomType}.`,
      severity,
    };
  }
}

// Singleton instance
export const dimensionCheckerService = new DimensionCheckerService();
