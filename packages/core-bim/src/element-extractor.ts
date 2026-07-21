/**
 * @kealee/core-bim — Element Extractor
 *
 * Extracts, classifies, and groups BIM elements from a parsed IFC model.
 * Maps IFC entity types to Kealee's BIMElementType taxonomy and assigns
 * building system classifications for downstream use in estimation,
 * scheduling, and compliance checking.
 *
 * This service is framework-agnostic and can run server-side.
 */

import type { IFCParser } from './ifc-parser';
import type {
  BIMElementData,
  BIMElementType,
  BuildingSystem,
  ParsedModel,
} from './types';
import { ELEMENT_SYSTEM_MAP } from './types';

/** Summary statistics for an extracted model */
export interface ExtractionSummary {
  /** Total number of elements extracted */
  totalElements: number;
  /** Count by element type */
  byType: Record<string, number>;
  /** Count by building system */
  bySystem: Record<string, number>;
  /** Count by storey/level */
  byStorey: Record<string, number>;
  /** List of unique storeys found */
  storeys: string[];
}

/** Grouped elements organized by building system */
export interface SystemGroup {
  system: BuildingSystem;
  elements: BIMElementData[];
  count: number;
}

/** Grouped elements organized by storey */
export interface StoreyGroup {
  storey: string;
  elements: BIMElementData[];
  count: number;
}

/**
 * ElementExtractor — Extracts and organizes BIM elements from IFC models.
 *
 * @example
 * ```ts
 * const parser = new IFCParser();
 * await parser.initialize();
 * const model = await parser.parseFile(buffer);
 *
 * const extractor = new ElementExtractor();
 * const elements = await extractor.extractFromIFC(parser, model);
 * const summary = extractor.summarize(elements);
 * const groups = extractor.groupBySystem(elements);
 *
 * parser.dispose();
 * ```
 */
export class ElementExtractor {
  /**
   * Extract all elements from a parsed IFC model using the provided parser.
   *
   * @param ifcParser - An initialized IFCParser instance.
   * @param model - A ParsedModel handle (optional; if omitted, extracts from last parsed model).
   * @returns Array of classified BIMElementData.
   */
  async extractFromIFC(
    ifcParser: IFCParser,
    model?: ParsedModel
  ): Promise<BIMElementData[]> {
    // If a model is provided, extract from it; otherwise the parser works with its current state
    if (!model) {
      throw new Error('A ParsedModel is required for element extraction.');
    }

    const rawElements = ifcParser.extractElements(model);

    // Enrich elements with system classification and storey assignment
    return rawElements.map((element) => this.enrichElement(element));
  }

  /**
   * Classify a single element's building system based on its type.
   *
   * @param elementType - The BIM element type.
   * @returns The building system classification.
   */
  classifySystem(elementType: BIMElementType): BuildingSystem {
    return ELEMENT_SYSTEM_MAP[elementType] ?? 'OTHER';
  }

  /**
   * Generate a summary of extracted elements.
   *
   * @param elements - Array of extracted elements.
   * @returns An ExtractionSummary with counts by type, system, and storey.
   */
  summarize(elements: BIMElementData[]): ExtractionSummary {
    const byType: Record<string, number> = {};
    const bySystem: Record<string, number> = {};
    const byStorey: Record<string, number> = {};
    const storeySet = new Set<string>();

    for (const element of elements) {
      // Count by type
      byType[element.elementType] = (byType[element.elementType] ?? 0) + 1;

      // Count by system
      const system = element.system ?? this.classifySystem(element.elementType);
      bySystem[system] = (bySystem[system] ?? 0) + 1;

      // Count by storey
      const storey = element.storey ?? 'Unassigned';
      byStorey[storey] = (byStorey[storey] ?? 0) + 1;
      storeySet.add(storey);
    }

    return {
      totalElements: elements.length,
      byType,
      bySystem,
      byStorey,
      storeys: Array.from(storeySet).sort(),
    };
  }

  /**
   * Group elements by building system.
   *
   * @param elements - Array of extracted elements.
   * @returns Array of SystemGroup objects, sorted by system name.
   */
  groupBySystem(elements: BIMElementData[]): SystemGroup[] {
    const groups = new Map<BuildingSystem, BIMElementData[]>();

    for (const element of elements) {
      const system = element.system ?? this.classifySystem(element.elementType);
      const group = groups.get(system) ?? [];
      group.push(element);
      groups.set(system, group);
    }

    return Array.from(groups.entries())
      .map(([system, elems]) => ({
        system,
        elements: elems,
        count: elems.length,
      }))
      .sort((a, b) => a.system.localeCompare(b.system));
  }

  /**
   * Group elements by building storey/level.
   *
   * @param elements - Array of extracted elements.
   * @returns Array of StoreyGroup objects, sorted by storey name.
   */
  groupByStorey(elements: BIMElementData[]): StoreyGroup[] {
    const groups = new Map<string, BIMElementData[]>();

    for (const element of elements) {
      const storey = element.storey ?? 'Unassigned';
      const group = groups.get(storey) ?? [];
      group.push(element);
      groups.set(storey, group);
    }

    return Array.from(groups.entries())
      .map(([storey, elems]) => ({
        storey,
        elements: elems,
        count: elems.length,
      }))
      .sort((a, b) => a.storey.localeCompare(b.storey));
  }

  /**
   * Filter elements by type.
   *
   * @param elements - Array of extracted elements.
   * @param types - Element types to include.
   * @returns Filtered array.
   */
  filterByType(
    elements: BIMElementData[],
    types: BIMElementType[]
  ): BIMElementData[] {
    const typeSet = new Set(types);
    return elements.filter((e) => typeSet.has(e.elementType));
  }

  /**
   * Filter elements by building system.
   *
   * @param elements - Array of extracted elements.
   * @param systems - Building systems to include.
   * @returns Filtered array.
   */
  filterBySystem(
    elements: BIMElementData[],
    systems: BuildingSystem[]
  ): BIMElementData[] {
    const systemSet = new Set(systems);
    return elements.filter((e) => {
      const system = e.system ?? this.classifySystem(e.elementType);
      return systemSet.has(system);
    });
  }

  /**
   * Find elements within a bounding box region.
   *
   * @param elements - Array of extracted elements.
   * @param minCorner - Minimum corner of the search region.
   * @param maxCorner - Maximum corner of the search region.
   * @returns Elements whose bounding box intersects the search region.
   */
  filterByRegion(
    elements: BIMElementData[],
    minCorner: { x: number; y: number; z: number },
    maxCorner: { x: number; y: number; z: number }
  ): BIMElementData[] {
    return elements.filter((e) => {
      const bb = e.boundingBox;
      return (
        bb.max.x >= minCorner.x &&
        bb.min.x <= maxCorner.x &&
        bb.max.y >= minCorner.y &&
        bb.min.y <= maxCorner.y &&
        bb.max.z >= minCorner.z &&
        bb.min.z <= maxCorner.z
      );
    });
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  /**
   * Enrich an element with building system classification and additional metadata.
   */
  private enrichElement(element: BIMElementData): BIMElementData {
    return {
      ...element,
      system: element.system ?? this.classifySystem(element.elementType),
    };
  }
}
