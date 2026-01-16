// ============================================================
// PLAN ANALYSIS - ELEMENT DETECTOR
// Detect and classify architectural elements in plans
// ============================================================

import { VisionEngine } from './vision-engine';
import { AIResult, PlanImage, DetectedElement } from '../../types';

export class ElementDetector {
  private visionEngine: VisionEngine;

  constructor(visionEngine: VisionEngine) {
    this.visionEngine = visionEngine;
  }

  /**
   * Detect all elements in plan images
   */
  async detectAllElements(
    images: PlanImage[]
  ): Promise<AIResult<DetectedElement[]>> {
    return this.visionEngine.detectElements(images);
  }

  /**
   * Detect specific element types
   */
  async detectElementTypes(
    images: PlanImage[],
    types: DetectedElement['type'][]
  ): Promise<AIResult<DetectedElement[]>> {
    const result = await this.visionEngine.detectElements(images, types);
    
    if (result.success && result.data) {
      // Filter to only requested types
      const filtered = result.data.filter(elem => types.includes(elem.type));
      return {
        ...result,
        data: filtered
      };
    }

    return result;
  }

  /**
   * Detect rooms and their properties
   */
  async detectRooms(
    images: PlanImage[]
  ): Promise<AIResult<DetectedElement[]>> {
    const result = await this.detectElementTypes(images, ['room']);
    
    if (result.success && result.data) {
      // Enhance room data with area calculations if dimensions available
      const enhanced = result.data.map(room => {
        if (room.dimensions && room.dimensions.length >= 2) {
          // Calculate area from dimensions (simplified)
          const length = room.dimensions[0]?.value || 0;
          const width = room.dimensions[1]?.value || 0;
          const area = length * width;
          
          return {
            ...room,
            metadata: {
              ...room.metadata,
              calculatedArea: area
            }
          };
        }
        return room;
      });

      return {
        ...result,
        data: enhanced
      };
    }

    return result;
  }

  /**
   * Detect openings (doors, windows)
   */
  async detectOpenings(
    images: PlanImage[]
  ): Promise<AIResult<DetectedElement[]>> {
    return this.detectElementTypes(images, ['door', 'window']);
  }

  /**
   * Detect structural elements
   */
  async detectStructuralElements(
    images: PlanImage[]
  ): Promise<AIResult<DetectedElement[]>> {
    return this.detectElementTypes(images, ['wall']);
  }

  /**
   * Detect fixtures and equipment
   */
  async detectFixtures(
    images: PlanImage[]
  ): Promise<AIResult<DetectedElement[]>> {
    return this.detectElementTypes(images, ['fixture']);
  }

  /**
   * Count elements by type
   */
  countElementsByType(
    elements: DetectedElement[]
  ): Record<DetectedElement['type'], number> {
    const counts: Record<string, number> = {};

    elements.forEach(elem => {
      counts[elem.type] = (counts[elem.type] || 0) + 1;
    });

    return counts as Record<DetectedElement['type'], number>;
  }

  /**
   * Find elements by label/name
   */
  findElementsByLabel(
    elements: DetectedElement[],
    searchTerm: string
  ): DetectedElement[] {
    const term = searchTerm.toLowerCase();
    return elements.filter(elem => 
      elem.label?.toLowerCase().includes(term)
    );
  }

  /**
   * Find elements in a specific area
   */
  findElementsInArea(
    elements: DetectedElement[],
    area: {
      x: number;
      y: number;
      width: number;
      height: number;
      page: number;
    }
  ): DetectedElement[] {
    return elements.filter(elem => {
      if (elem.location.page !== area.page) return false;

      // Check if element overlaps with area
      const elemRight = elem.location.x + elem.location.width;
      const elemBottom = elem.location.y + elem.location.height;
      const areaRight = area.x + area.width;
      const areaBottom = area.y + area.height;

      return !(
        elem.location.x > areaRight ||
        elemRight < area.x ||
        elem.location.y > areaBottom ||
        elemBottom < area.y
      );
    });
  }

  /**
   * Validate element completeness
   */
  validateElementCompleteness(
    elements: DetectedElement[],
    requiredTypes: DetectedElement['type'][]
  ): {
    missing: DetectedElement['type'][];
    found: DetectedElement['type'][];
  } {
    const found = new Set<DetectedElement['type']>();
    
    elements.forEach(elem => {
      found.add(elem.type);
    });

    const missing = requiredTypes.filter(type => !found.has(type));

    return {
      missing,
      found: Array.from(found)
    };
  }
}
