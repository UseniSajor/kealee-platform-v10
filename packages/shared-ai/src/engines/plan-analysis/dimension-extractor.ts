// ============================================================
// PLAN ANALYSIS - DIMENSION EXTRACTOR
// Specialized dimension extraction from plans
// ============================================================

import { VisionEngine } from './vision-engine';
import { AIResult, PlanImage, Dimension } from '../../types';

export class DimensionExtractor {
  private visionEngine: VisionEngine;

  constructor(visionEngine: VisionEngine) {
    this.visionEngine = visionEngine;
  }

  /**
   * Extract all dimensions from plan images
   */
  async extractAllDimensions(
    images: PlanImage[]
  ): Promise<AIResult<Dimension[]>> {
    return this.visionEngine.extractDimensions(images);
  }

  /**
   * Extract dimensions for specific elements
   */
  async extractElementDimensions(
    images: PlanImage[],
    elements: string[]
  ): Promise<AIResult<Dimension[]>> {
    return this.visionEngine.extractDimensions(images, elements);
  }

  /**
   * Extract room dimensions
   */
  async extractRoomDimensions(
    images: PlanImage[]
  ): Promise<AIResult<Dimension[]>> {
    const prompt = 'Extract all room dimensions including length, width, and area for each labeled room.';
    const result = await this.visionEngine.analyzePlans(images, prompt);
    
    if (result.success && result.data) {
      // Flatten room dimensions
      const roomDims: Dimension[] = [];
      if (result.data.rooms) {
        result.data.rooms.forEach(room => {
          roomDims.push(...room.dimensions);
        });
      }
      
      return {
        ...result,
        data: roomDims
      };
    }

    return {
      success: false,
      error: result.error
    };
  }

  /**
   * Extract structural dimensions (walls, beams, etc.)
   */
  async extractStructuralDimensions(
    images: PlanImage[]
  ): Promise<AIResult<Dimension[]>> {
    const elements = ['wall', 'beam', 'column', 'foundation', 'slab'];
    return this.extractElementDimensions(images, elements);
  }

  /**
   * Extract opening dimensions (doors, windows)
   */
  async extractOpeningDimensions(
    images: PlanImage[]
  ): Promise<AIResult<Dimension[]>> {
    const elements = ['door', 'window', 'opening'];
    return this.extractElementDimensions(images, elements);
  }

  /**
   * Validate dimensions against code requirements
   */
  validateDimensions(
    dimensions: Dimension[],
    requirements: {
      min?: number;
      max?: number;
      unit?: Dimension['unit'];
    }[]
  ): {
    valid: Dimension[];
    invalid: Array<{ dimension: Dimension; reason: string }>;
  } {
    const valid: Dimension[] = [];
    const invalid: Array<{ dimension: Dimension; reason: string }> = [];

    dimensions.forEach(dim => {
      const requirement = requirements.find(req => 
        !req.unit || req.unit === dim.unit
      );

      if (!requirement) {
        valid.push(dim); // No requirement = valid
        return;
      }

      // Convert to common unit for comparison (simplified - would need proper conversion)
      const value = dim.value;
      const min = requirement.min;
      const max = requirement.max;

      if (min !== undefined && value < min) {
        invalid.push({
          dimension: dim,
          reason: `Value ${value} is below minimum ${min}`
        });
      } else if (max !== undefined && value > max) {
        invalid.push({
          dimension: dim,
          reason: `Value ${value} exceeds maximum ${max}`
        });
      } else {
        valid.push(dim);
      }
    });

    return { valid, invalid };
  }
}
