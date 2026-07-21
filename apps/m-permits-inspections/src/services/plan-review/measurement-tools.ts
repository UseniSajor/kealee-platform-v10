/**
 * Measurement Tools Service
 * Measurement tools for code compliance checking
 */

export interface Measurement {
  id: string;
  type: 'distance' | 'area' | 'angle' | 'dimension';
  pageNumber: number;
  points: Array<{x: number; y: number}>;
  value: number;
  unit: 'inches' | 'feet' | 'meters' | 'degrees';
  scale?: number; // Drawing scale (e.g., 1/4" = 1'-0")
  codeRequirement?: {
    codeSection: string;
    minimum?: number;
    maximum?: number;
    required?: number;
  };
  compliance: 'COMPLIANT' | 'NON_COMPLIANT' | 'UNKNOWN';
  createdBy: string;
  createdAt: Date;
}

export class MeasurementToolsService {
  /**
   * Create measurement
   */
  createMeasurement(
    measurement: Omit<Measurement, 'id' | 'createdAt'>
  ): Measurement {
    return {
      ...measurement,
      id: `measure-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      createdAt: new Date(),
    };
  }

  /**
   * Calculate distance between two points
   */
  calculateDistance(
    point1: {x: number; y: number},
    point2: {x: number; y: number},
    scale?: number
  ): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Apply scale if provided
    if (scale) {
      return distance * scale;
    }

    return distance;
  }

  /**
   * Calculate area from polygon points
   */
  calculateArea(
    points: Array<{x: number; y: number}>,
    scale?: number
  ): number {
    if (points.length < 3) {
      return 0;
    }

    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }

    area = Math.abs(area) / 2;

    // Apply scale if provided
    if (scale) {
      area = area * scale * scale;
    }

    return area;
  }

  /**
   * Calculate angle between three points
   */
  calculateAngle(
    point1: {x: number; y: number},
    vertex: {x: number; y: number},
    point2: {x: number; y: number}
  ): number {
    const v1x = point1.x - vertex.x;
    const v1y = point1.y - vertex.y;
    const v2x = point2.x - vertex.x;
    const v2y = point2.y - vertex.y;

    const dot = v1x * v2x + v1y * v2y;
    const mag1 = Math.sqrt(v1x * v1x + v1y * v1y);
    const mag2 = Math.sqrt(v2x * v2x + v2y * v2y);

    const cosAngle = dot / (mag1 * mag2);
    const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle)));

    return (angle * 180) / Math.PI; // Convert to degrees
  }

  /**
   * Check code compliance for measurement
   */
  checkCompliance(measurement: Measurement): 'COMPLIANT' | 'NON_COMPLIANT' | 'UNKNOWN' {
    if (!measurement.codeRequirement) {
      return 'UNKNOWN';
    }

    const req = measurement.codeRequirement;

    // Check minimum
    if (req.minimum !== undefined && measurement.value < req.minimum) {
      return 'NON_COMPLIANT';
    }

    // Check maximum
    if (req.maximum !== undefined && measurement.value > req.maximum) {
      return 'NON_COMPLIANT';
    }

    // Check required value
    if (req.required !== undefined && Math.abs(measurement.value - req.required) > 0.01) {
      return 'NON_COMPLIANT';
    }

    return 'COMPLIANT';
  }

  /**
   * Parse scale notation
   */
  parseScale(scaleNotation: string): number | null {
    // Parse formats like "1/4\" = 1'-0\"", "1:100", "1/8\" = 1'-0\""
    const match = scaleNotation.match(/(\d+)\/(\d+)"\s*=\s*(\d+)'-(\d+)"/);
    if (match) {
      const numerator = parseFloat(match[1]);
      const denominator = parseFloat(match[2]);
      const feet = parseFloat(match[3]);
      const inches = parseFloat(match[4] || '0');

      const drawingInches = numerator / denominator;
      const realInches = feet * 12 + inches;

      return realInches / drawingInches;
    }

    // Parse "1:100" format
    const ratioMatch = scaleNotation.match(/(\d+):(\d+)/);
    if (ratioMatch) {
      return parseFloat(ratioMatch[2]) / parseFloat(ratioMatch[1]);
    }

    return null;
  }

  /**
   * Convert measurement to different unit
   */
  convertUnit(
    value: number,
    fromUnit: Measurement['unit'],
    toUnit: Measurement['unit']
  ): number {
    // Convert to inches first
    let inches = value;
    switch (fromUnit) {
      case 'feet':
        inches = value * 12;
        break;
      case 'meters':
        inches = value * 39.3701;
        break;
      case 'inches':
        break;
      case 'degrees':
        return value; // Degrees don't convert
    }

    // Convert from inches to target unit
    switch (toUnit) {
      case 'inches':
        return inches;
      case 'feet':
        return inches / 12;
      case 'meters':
        return inches / 39.3701;
      case 'degrees':
        return value;
    }

    return value;
  }
}

// Singleton instance
export const measurementToolsService = new MeasurementToolsService();
