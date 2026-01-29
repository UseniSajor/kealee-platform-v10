/**
 * Measurement Tools
 * Calculation utilities for construction measurements
 */

import Decimal from 'decimal.js';

export interface Dimensions {
  length?: number;
  width?: number;
  height?: number;
  depth?: number;
  diameter?: number;
  radius?: number;
}

export interface ConversionResult {
  value: number;
  unit: string;
  fromUnit: string;
  toUnit: string;
}

export interface WasteCalculation {
  netQuantity: number;
  wastePercent: number;
  wasteQuantity: number;
  grossQuantity: number;
}

// Unit conversion factors to base units (feet, square feet, cubic feet)
const LINEAR_CONVERSIONS: Record<string, number> = {
  'IN': 1 / 12,
  'FT': 1,
  'YD': 3,
  'M': 3.28084,
  'CM': 0.0328084,
  'MM': 0.00328084,
  'LF': 1,
};

const AREA_CONVERSIONS: Record<string, number> = {
  'SF': 1,
  'SY': 9,
  'SM': 10.7639,
  'SQ': 100, // Roofing square
};

const VOLUME_CONVERSIONS: Record<string, number> = {
  'CF': 1,
  'CY': 27,
  'CM': 35.3147, // Cubic meter
  'GAL': 0.133681,
  'L': 0.0353147,
};

export class MeasurementTools {
  /**
   * Calculate linear measurement
   */
  calculateLinear(
    startPoint: { x: number; y: number },
    endPoint: { x: number; y: number },
    scale: number = 1
  ): number {
    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    return Math.sqrt(dx * dx + dy * dy) * scale;
  }

  /**
   * Calculate area from dimensions
   */
  calculateArea(dimensions: Dimensions, shape: 'RECTANGLE' | 'CIRCLE' | 'TRIANGLE' = 'RECTANGLE'): number {
    switch (shape) {
      case 'RECTANGLE':
        return (dimensions.length || 0) * (dimensions.width || 0);
      case 'CIRCLE':
        if (dimensions.radius) {
          return Math.PI * dimensions.radius * dimensions.radius;
        }
        if (dimensions.diameter) {
          const r = dimensions.diameter / 2;
          return Math.PI * r * r;
        }
        return 0;
      case 'TRIANGLE':
        return 0.5 * (dimensions.length || 0) * (dimensions.height || 0);
      default:
        return 0;
    }
  }

  /**
   * Calculate volume from dimensions
   */
  calculateVolume(
    dimensions: Dimensions,
    shape: 'BOX' | 'CYLINDER' | 'SPHERE' | 'CONE' = 'BOX'
  ): number {
    switch (shape) {
      case 'BOX':
        return (dimensions.length || 0) * (dimensions.width || 0) * (dimensions.height || 0);
      case 'CYLINDER':
        const r = dimensions.radius || (dimensions.diameter ? dimensions.diameter / 2 : 0);
        return Math.PI * r * r * (dimensions.height || 0);
      case 'SPHERE':
        const rs = dimensions.radius || (dimensions.diameter ? dimensions.diameter / 2 : 0);
        return (4 / 3) * Math.PI * rs * rs * rs;
      case 'CONE':
        const rc = dimensions.radius || (dimensions.diameter ? dimensions.diameter / 2 : 0);
        return (1 / 3) * Math.PI * rc * rc * (dimensions.height || 0);
      default:
        return 0;
    }
  }

  /**
   * Calculate perimeter
   */
  calculatePerimeter(dimensions: Dimensions, shape: 'RECTANGLE' | 'CIRCLE' = 'RECTANGLE'): number {
    switch (shape) {
      case 'RECTANGLE':
        return 2 * ((dimensions.length || 0) + (dimensions.width || 0));
      case 'CIRCLE':
        if (dimensions.radius) {
          return 2 * Math.PI * dimensions.radius;
        }
        if (dimensions.diameter) {
          return Math.PI * dimensions.diameter;
        }
        return 0;
      default:
        return 0;
    }
  }

  /**
   * Calculate polygon area from vertices
   */
  calculatePolygonArea(vertices: { x: number; y: number }[], scale: number = 1): number {
    if (vertices.length < 3) return 0;

    let area = 0;
    const n = vertices.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += vertices[i].x * vertices[j].y;
      area -= vertices[j].x * vertices[i].y;
    }

    return Math.abs(area / 2) * scale * scale;
  }

  /**
   * Convert between linear units
   */
  convertLinear(value: number, fromUnit: string, toUnit: string): ConversionResult {
    const fromFactor = LINEAR_CONVERSIONS[fromUnit.toUpperCase()] || 1;
    const toFactor = LINEAR_CONVERSIONS[toUnit.toUpperCase()] || 1;
    const inFeet = value * fromFactor;
    const result = inFeet / toFactor;

    return {
      value: result,
      unit: toUnit,
      fromUnit,
      toUnit,
    };
  }

  /**
   * Convert between area units
   */
  convertArea(value: number, fromUnit: string, toUnit: string): ConversionResult {
    const fromFactor = AREA_CONVERSIONS[fromUnit.toUpperCase()] || 1;
    const toFactor = AREA_CONVERSIONS[toUnit.toUpperCase()] || 1;
    const inSqFt = value * fromFactor;
    const result = inSqFt / toFactor;

    return {
      value: result,
      unit: toUnit,
      fromUnit,
      toUnit,
    };
  }

  /**
   * Convert between volume units
   */
  convertVolume(value: number, fromUnit: string, toUnit: string): ConversionResult {
    const fromFactor = VOLUME_CONVERSIONS[fromUnit.toUpperCase()] || 1;
    const toFactor = VOLUME_CONVERSIONS[toUnit.toUpperCase()] || 1;
    const inCubicFt = value * fromFactor;
    const result = inCubicFt / toFactor;

    return {
      value: result,
      unit: toUnit,
      fromUnit,
      toUnit,
    };
  }

  /**
   * Calculate waste/overage
   */
  calculateWaste(netQuantity: number, wastePercent: number): WasteCalculation {
    const wasteQuantity = netQuantity * (wastePercent / 100);
    const grossQuantity = netQuantity + wasteQuantity;

    return {
      netQuantity,
      wastePercent,
      wasteQuantity,
      grossQuantity,
    };
  }

  /**
   * Calculate board feet
   */
  calculateBoardFeet(length: number, width: number, thickness: number): number {
    // length in feet, width in inches, thickness in inches
    return (length * width * thickness) / 12;
  }

  /**
   * Calculate concrete yards from dimensions
   */
  calculateConcreteYards(
    length: number,
    width: number,
    thickness: number,
    unit: 'IN' | 'FT' = 'FT'
  ): number {
    let thicknessInFeet = thickness;
    if (unit === 'IN') {
      thicknessInFeet = thickness / 12;
    }

    const cubicFeet = length * width * thicknessInFeet;
    return cubicFeet / 27;
  }

  /**
   * Calculate roofing squares
   */
  calculateRoofingSquares(area: number, pitch?: number): { squares: number; adjustedArea: number } {
    let adjustedArea = area;

    // Adjust for roof pitch if provided
    if (pitch) {
      // Pitch is rise over 12 (e.g., 6/12 pitch = 6)
      const pitchFactor = Math.sqrt(1 + (pitch / 12) * (pitch / 12));
      adjustedArea = area * pitchFactor;
    }

    return {
      squares: adjustedArea / 100,
      adjustedArea,
    };
  }

  /**
   * Calculate wall area with openings deducted
   */
  calculateWallArea(
    length: number,
    height: number,
    openings: { width: number; height: number }[]
  ): { grossArea: number; openingsArea: number; netArea: number } {
    const grossArea = length * height;
    const openingsArea = openings.reduce((sum, o) => sum + o.width * o.height, 0);
    const netArea = grossArea - openingsArea;

    return {
      grossArea,
      openingsArea,
      netArea,
    };
  }

  /**
   * Calculate stud count for wall framing
   */
  calculateStudCount(
    wallLength: number,
    spacing: number = 16,
    addForCorners: number = 0,
    addForOpenings: number = 0
  ): number {
    // spacing in inches
    const spacingFeet = spacing / 12;
    const baseStuds = Math.ceil(wallLength / spacingFeet) + 1;
    return baseStuds + addForCorners + addForOpenings;
  }

  /**
   * Calculate paint coverage
   */
  calculatePaintCoverage(
    area: number,
    coats: number = 2,
    coveragePerGallon: number = 350
  ): { gallons: number; area: number; coats: number } {
    const totalArea = area * coats;
    const gallons = totalArea / coveragePerGallon;

    return {
      gallons: Math.ceil(gallons * 10) / 10, // Round up to nearest 0.1
      area,
      coats,
    };
  }

  /**
   * Calculate drywall sheets needed
   */
  calculateDrywallSheets(
    area: number,
    sheetSize: { width: number; height: number } = { width: 4, height: 8 },
    wastePercent: number = 10
  ): { sheets: number; sheetArea: number; totalArea: number } {
    const sheetArea = sheetSize.width * sheetSize.height;
    const sheetsNeeded = area / sheetArea;
    const withWaste = sheetsNeeded * (1 + wastePercent / 100);

    return {
      sheets: Math.ceil(withWaste),
      sheetArea,
      totalArea: area,
    };
  }

  /**
   * Calculate flooring material needed
   */
  calculateFlooring(
    area: number,
    materialType: 'TILE' | 'PLANK' | 'ROLL' = 'TILE',
    options?: {
      tileSize?: { width: number; height: number };
      plankCoverage?: number;
      rollWidth?: number;
      wastePercent?: number;
    }
  ): { quantity: number; unit: string; waste: number } {
    const wastePercent = options?.wastePercent || 10;
    const grossArea = area * (1 + wastePercent / 100);

    switch (materialType) {
      case 'TILE': {
        const tileSize = options?.tileSize || { width: 12, height: 12 };
        const tileSF = (tileSize.width * tileSize.height) / 144; // Convert to SF
        return {
          quantity: Math.ceil(grossArea / tileSF),
          unit: 'EA',
          waste: wastePercent,
        };
      }
      case 'PLANK': {
        const coverage = options?.plankCoverage || 20; // SF per box
        return {
          quantity: Math.ceil(grossArea / coverage),
          unit: 'BOX',
          waste: wastePercent,
        };
      }
      case 'ROLL': {
        const rollWidth = options?.rollWidth || 12; // feet
        const linearFeet = grossArea / rollWidth;
        return {
          quantity: Math.ceil(linearFeet),
          unit: 'LF',
          waste: wastePercent,
        };
      }
    }
  }

  /**
   * Parse scale string (e.g., "1/4" = 1'-0"")
   */
  parseScale(scaleString: string): number {
    // Common architectural scales
    const scales: Record<string, number> = {
      '1/8" = 1\'-0"': 96,
      '1/8"=1\'-0"': 96,
      '3/16" = 1\'-0"': 64,
      '1/4" = 1\'-0"': 48,
      '1/4"=1\'-0"': 48,
      '3/8" = 1\'-0"': 32,
      '1/2" = 1\'-0"': 24,
      '3/4" = 1\'-0"': 16,
      '1" = 1\'-0"': 12,
      '1-1/2" = 1\'-0"': 8,
      '3" = 1\'-0"': 4,
      '1:100': 100,
      '1:50': 50,
      '1:20': 20,
      '1:10': 10,
    };

    const normalized = scaleString.replace(/\s+/g, '');
    return scales[normalized] || scales[scaleString] || 48; // Default to 1/4" scale
  }

  /**
   * Round to construction precision
   */
  roundToFraction(
    value: number,
    precision: '1/16' | '1/8' | '1/4' | '1/2' | '1' = '1/8'
  ): { feet: number; inches: number; fraction: string; display: string } {
    const precisionMap: Record<string, number> = {
      '1/16': 16,
      '1/8': 8,
      '1/4': 4,
      '1/2': 2,
      '1': 1,
    };

    const divisor = precisionMap[precision];
    const feet = Math.floor(value);
    const remainingInches = (value - feet) * 12;
    const wholeInches = Math.floor(remainingInches);
    const fractionPart = remainingInches - wholeInches;
    const roundedFraction = Math.round(fractionPart * divisor) / divisor;

    let adjustedInches = wholeInches;
    let adjustedFraction = roundedFraction;
    let adjustedFeet = feet;

    // Handle overflow
    if (roundedFraction >= 1) {
      adjustedInches += 1;
      adjustedFraction = 0;
    }
    if (adjustedInches >= 12) {
      adjustedFeet += 1;
      adjustedInches = 0;
    }

    // Format fraction display
    let fractionStr = '';
    if (adjustedFraction > 0) {
      const numerator = Math.round(adjustedFraction * divisor);
      fractionStr = `${numerator}/${divisor}`;
    }

    const display = `${adjustedFeet}'-${adjustedInches}${fractionStr ? ' ' + fractionStr : ''}"`;

    return {
      feet: adjustedFeet,
      inches: adjustedInches,
      fraction: fractionStr,
      display,
    };
  }
}

export const measurementTools = new MeasurementTools();
