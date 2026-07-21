/**
 * @kealee/core-bim — Clash Detector
 *
 * Performs basic clash detection between BIM elements using bounding box
 * intersection (hard clashes), proximity checks (soft clashes), and
 * clearance validation. Designed for early-stage coordination checks
 * before full model-based clash detection in dedicated BIM software.
 *
 * This service is framework-agnostic and can run server-side.
 */

import type {
  BIMElementData,
  BoundingBox,
  ClashResult,
  ClashType,
  ClashSeverity,
  ClashDetectionOptions,
  Vector3,
  BIMElementType,
  BuildingSystem,
} from './types';
import { ELEMENT_SYSTEM_MAP } from './types';

/** Default options for clash detection */
const DEFAULT_OPTIONS: Required<ClashDetectionOptions> = {
  softClashTolerance: 0.05, // 50mm
  clearanceDistance: 0.15, // 150mm
  crossSystemOnly: false,
  includeTypes: [],
  excludeTypes: [],
};

/**
 * ClashDetector — Detects spatial conflicts between BIM elements.
 *
 * @example
 * ```ts
 * const detector = new ClashDetector();
 *
 * // Detect all clash types
 * const clashes = detector.detectClashes(elements, {
 *   crossSystemOnly: true,
 *   softClashTolerance: 0.05,
 *   clearanceDistance: 0.15,
 * });
 *
 * // Filter by severity
 * const critical = clashes.filter(c => c.severity === 'CRITICAL');
 * ```
 */
export class ClashDetector {
  /**
   * Detect clashes between all provided BIM elements.
   *
   * Performs three types of checks:
   * 1. **Hard clashes** — Bounding boxes overlap (elements physically intersect)
   * 2. **Soft clashes** — Elements are within tolerance distance (near-misses)
   * 3. **Clearance violations** — Required clearance distances not maintained
   *
   * @param elements - Array of BIM elements to check.
   * @param options - Detection options (tolerances, filters, etc.).
   * @returns Array of ClashResult for each detected conflict.
   */
  detectClashes(
    elements: BIMElementData[],
    options?: ClashDetectionOptions
  ): ClashResult[] {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    // Apply type filters
    const filtered = this.applyFilters(elements, opts);

    const clashes: ClashResult[] = [];

    // O(n^2) pairwise comparison — acceptable for early-stage checks
    // with typical element counts (< 10,000 elements)
    for (let i = 0; i < filtered.length; i++) {
      for (let j = i + 1; j < filtered.length; j++) {
        const a = filtered[i];
        const b = filtered[j];

        // Skip same-system pairs if cross-system only
        if (opts.crossSystemOnly) {
          const systemA = this.getSystem(a);
          const systemB = this.getSystem(b);
          if (systemA === systemB) continue;
        }

        // Check for hard clash (bounding box intersection)
        if (this.boxesIntersect(a.boundingBox, b.boundingBox)) {
          clashes.push(this.createClashResult(a, b, 'HARD'));
          continue;
        }

        // Check for soft clash (within tolerance)
        const distance = this.boxDistance(a.boundingBox, b.boundingBox);
        if (distance <= opts.softClashTolerance) {
          clashes.push(
            this.createClashResult(a, b, 'SOFT', distance)
          );
          continue;
        }

        // Check for clearance violation
        if (distance <= opts.clearanceDistance) {
          clashes.push(
            this.createClashResult(a, b, 'CLEARANCE', distance)
          );
        }
      }
    }

    // Sort by severity (CRITICAL first)
    return clashes.sort((a, b) => {
      const severityOrder: Record<ClashSeverity, number> = {
        CRITICAL: 0,
        MAJOR: 1,
        MINOR: 2,
        INFO: 3,
      };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  /**
   * Detect hard clashes only (bounding box intersections).
   * Faster than full detectClashes when only physical overlaps matter.
   *
   * @param elements - Array of BIM elements.
   * @returns Array of hard clash results.
   */
  detectHardClashes(elements: BIMElementData[]): ClashResult[] {
    return this.detectClashes(elements, {
      softClashTolerance: 0,
      clearanceDistance: 0,
    });
  }

  /**
   * Check if two specific elements clash.
   *
   * @param elementA - First element.
   * @param elementB - Second element.
   * @param options - Detection options.
   * @returns A ClashResult if a clash is detected, or null.
   */
  checkPair(
    elementA: BIMElementData,
    elementB: BIMElementData,
    options?: ClashDetectionOptions
  ): ClashResult | null {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    if (this.boxesIntersect(elementA.boundingBox, elementB.boundingBox)) {
      return this.createClashResult(elementA, elementB, 'HARD');
    }

    const distance = this.boxDistance(elementA.boundingBox, elementB.boundingBox);

    if (distance <= opts.softClashTolerance) {
      return this.createClashResult(elementA, elementB, 'SOFT', distance);
    }

    if (distance <= opts.clearanceDistance) {
      return this.createClashResult(elementA, elementB, 'CLEARANCE', distance);
    }

    return null;
  }

  /**
   * Get clash statistics from a set of results.
   *
   * @param clashes - Array of clash results.
   * @returns Summary statistics.
   */
  summarize(clashes: ClashResult[]): {
    total: number;
    byType: Record<ClashType, number>;
    bySeverity: Record<ClashSeverity, number>;
    affectedElements: number;
  } {
    const byType: Record<ClashType, number> = { HARD: 0, SOFT: 0, CLEARANCE: 0 };
    const bySeverity: Record<ClashSeverity, number> = {
      CRITICAL: 0,
      MAJOR: 0,
      MINOR: 0,
      INFO: 0,
    };
    const affectedIds = new Set<string>();

    for (const clash of clashes) {
      byType[clash.clashType]++;
      bySeverity[clash.severity]++;
      affectedIds.add(clash.elementA.id);
      affectedIds.add(clash.elementB.id);
    }

    return {
      total: clashes.length,
      byType,
      bySeverity,
      affectedElements: affectedIds.size,
    };
  }

  // -------------------------------------------------------------------------
  // Private — Geometry math
  // -------------------------------------------------------------------------

  /**
   * Check if two axis-aligned bounding boxes intersect.
   */
  private boxesIntersect(a: BoundingBox, b: BoundingBox): boolean {
    return (
      a.min.x <= b.max.x &&
      a.max.x >= b.min.x &&
      a.min.y <= b.max.y &&
      a.max.y >= b.min.y &&
      a.min.z <= b.max.z &&
      a.max.z >= b.min.z
    );
  }

  /**
   * Compute the minimum distance between two axis-aligned bounding boxes.
   * Returns 0 if the boxes overlap.
   */
  private boxDistance(a: BoundingBox, b: BoundingBox): number {
    const dx = Math.max(0, Math.max(a.min.x - b.max.x, b.min.x - a.max.x));
    const dy = Math.max(0, Math.max(a.min.y - b.max.y, b.min.y - a.max.y));
    const dz = Math.max(0, Math.max(a.min.z - b.max.z, b.min.z - a.max.z));
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Compute the center point of a bounding box.
   */
  private boxCenter(box: BoundingBox): Vector3 {
    return {
      x: (box.min.x + box.max.x) / 2,
      y: (box.min.y + box.max.y) / 2,
      z: (box.min.z + box.max.z) / 2,
    };
  }

  /**
   * Compute the midpoint between two bounding box centers.
   */
  private midpoint(a: BoundingBox, b: BoundingBox): Vector3 {
    const ca = this.boxCenter(a);
    const cb = this.boxCenter(b);
    return {
      x: (ca.x + cb.x) / 2,
      y: (ca.y + cb.y) / 2,
      z: (ca.z + cb.z) / 2,
    };
  }

  // -------------------------------------------------------------------------
  // Private — Classification
  // -------------------------------------------------------------------------

  /**
   * Determine severity based on clash type and the systems involved.
   */
  private classifySeverity(
    clashType: ClashType,
    elementA: BIMElementData,
    elementB: BIMElementData
  ): ClashSeverity {
    const systemA = this.getSystem(elementA);
    const systemB = this.getSystem(elementB);
    const crossSystem = systemA !== systemB;

    switch (clashType) {
      case 'HARD':
        // Hard clashes between different systems are critical
        if (crossSystem) return 'CRITICAL';
        // Hard clashes within the same system are major
        // (may be intentional — e.g., wall-slab connection)
        if (this.isLikelyConnection(elementA, elementB)) return 'INFO';
        return 'MAJOR';

      case 'SOFT':
        return crossSystem ? 'MAJOR' : 'MINOR';

      case 'CLEARANCE':
        return 'MINOR';

      default:
        return 'INFO';
    }
  }

  /**
   * Check if two elements are likely an intentional connection
   * (e.g., column-beam, wall-slab).
   */
  private isLikelyConnection(
    a: BIMElementData,
    b: BIMElementData
  ): boolean {
    const connectionPairs: [BIMElementType, BIMElementType][] = [
      ['COLUMN', 'BEAM'],
      ['COLUMN', 'SLAB'],
      ['WALL', 'SLAB'],
      ['WALL', 'BEAM'],
      ['BEAM', 'SLAB'],
      ['FOOTING', 'COLUMN'],
      ['FOOTING', 'WALL'],
      ['PILE', 'FOOTING'],
    ];

    return connectionPairs.some(
      ([typeA, typeB]) =>
        (a.elementType === typeA && b.elementType === typeB) ||
        (a.elementType === typeB && b.elementType === typeA)
    );
  }

  /**
   * Get the building system for an element.
   */
  private getSystem(element: BIMElementData): BuildingSystem {
    return element.system ?? ELEMENT_SYSTEM_MAP[element.elementType] ?? 'OTHER';
  }

  /**
   * Create a clash result record.
   */
  private createClashResult(
    elementA: BIMElementData,
    elementB: BIMElementData,
    clashType: ClashType,
    distance?: number
  ): ClashResult {
    const severity = this.classifySeverity(clashType, elementA, elementB);
    const location = this.midpoint(elementA.boundingBox, elementB.boundingBox);

    const typeLabel = clashType === 'HARD' ? 'intersection' : clashType === 'SOFT' ? 'proximity' : 'clearance violation';
    const description = `${clashType} clash (${typeLabel}): ${elementA.name} [${elementA.elementType}] vs ${elementB.name} [${elementB.elementType}]`;

    return {
      elementA,
      elementB,
      clashType,
      severity,
      location,
      distance,
      description,
    };
  }

  /**
   * Apply type inclusion/exclusion filters to elements.
   */
  private applyFilters(
    elements: BIMElementData[],
    opts: Required<ClashDetectionOptions>
  ): BIMElementData[] {
    let filtered = elements;

    if (opts.includeTypes.length > 0) {
      const includeSet = new Set(opts.includeTypes);
      filtered = filtered.filter((e) => includeSet.has(e.elementType));
    }

    if (opts.excludeTypes.length > 0) {
      const excludeSet = new Set(opts.excludeTypes);
      filtered = filtered.filter((e) => !excludeSet.has(e.elementType));
    }

    return filtered;
  }
}
