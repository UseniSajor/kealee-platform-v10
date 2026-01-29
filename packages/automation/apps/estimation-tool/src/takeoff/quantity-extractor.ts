/**
 * Quantity Extractor
 * Extract quantities from plans and measurements
 *
 * Note: Extraction results are stored in-memory and can be exported to/imported from
 * Estimate.metadata for persistence.
 */

import { v4 as uuid } from 'uuid';
import Decimal from 'decimal.js';
import { DetectedElement, RoomAnalysis, MaterialEstimate, planAnalyzer } from './plan-analyzer.js';
import { measurementTools } from './measurement-tools.js';

// In-memory storage for extraction results (keyed by extraction ID)
const extractionStore = new Map<string, ExtractionRecord>();

interface ExtractionRecord {
  id: string;
  projectId: string;
  status: string;
  items: QuantityItem[];
  summary: ExtractionSummary;
  warnings: string[];
  createdAt: Date;
  completedAt?: Date;
}

export interface QuantityItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  quantity: number;
  unit: string;
  wastePercent: number;
  grossQuantity: number;
  source: QuantitySource;
  elements: string[];
  confidence: number;
  notes?: string;
}

export interface QuantitySource {
  type: 'PLAN_ANALYSIS' | 'MANUAL_TAKEOFF' | 'CALCULATION' | 'IMPORT';
  analysisId?: string;
  takeoffId?: string;
  formula?: string;
}

export interface ExtractionResult {
  id: string;
  projectId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  items: QuantityItem[];
  summary: ExtractionSummary;
  warnings: string[];
  createdAt: Date;
  completedAt?: Date;
}

export interface ExtractionSummary {
  totalItems: number;
  categoryCounts: Record<string, number>;
  highConfidenceCount: number;
  lowConfidenceCount: number;
  manualReviewRequired: number;
}

export interface QuantityRule {
  id: string;
  name: string;
  elementType: string;
  outputCode: string;
  outputName: string;
  category: string;
  formula: string;
  unit: string;
  wastePercent: number;
  conditions?: QuantityCondition[];
  isActive: boolean;
}

export interface QuantityCondition {
  field: string;
  operator: 'EQ' | 'NE' | 'GT' | 'GTE' | 'LT' | 'LTE' | 'CONTAINS' | 'STARTS_WITH';
  value: string | number;
}

export class QuantityExtractor {
  private defaultRules: QuantityRule[] = [];

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Initialize default extraction rules
   */
  private initializeDefaultRules(): void {
    this.defaultRules = [
      // Wall framing
      {
        id: 'FRAMING-STUD',
        name: 'Wall Studs',
        elementType: 'WALL',
        outputCode: '06 11 10.10',
        outputName: 'Wood Studs 2x4',
        category: 'FRAMING',
        formula: 'CEIL(length / 1.33) + 1',
        unit: 'EA',
        wastePercent: 5,
        isActive: true,
      },
      {
        id: 'FRAMING-PLATE',
        name: 'Wall Plates',
        elementType: 'WALL',
        outputCode: '06 11 10.20',
        outputName: 'Wood Plates 2x4',
        category: 'FRAMING',
        formula: 'length * 3',
        unit: 'LF',
        wastePercent: 5,
        isActive: true,
      },
      // Drywall
      {
        id: 'DRYWALL-WALL',
        name: 'Wall Drywall',
        elementType: 'WALL',
        outputCode: '09 29 10.30',
        outputName: 'Gypsum Board 1/2"',
        category: 'DRYWALL',
        formula: 'area * 2',
        unit: 'SF',
        wastePercent: 10,
        isActive: true,
      },
      // Doors
      {
        id: 'DOOR-INTERIOR',
        name: 'Interior Door',
        elementType: 'DOOR',
        outputCode: '08 14 16.10',
        outputName: 'Interior Door Pre-hung',
        category: 'DOORS',
        formula: '1',
        unit: 'EA',
        wastePercent: 0,
        conditions: [{ field: 'attributes.doorType', operator: 'EQ', value: 'INTERIOR' }],
        isActive: true,
      },
      {
        id: 'DOOR-ENTRY',
        name: 'Entry Door',
        elementType: 'DOOR',
        outputCode: '08 14 13.10',
        outputName: 'Entry Door',
        category: 'DOORS',
        formula: '1',
        unit: 'EA',
        wastePercent: 0,
        conditions: [{ field: 'attributes.doorType', operator: 'EQ', value: 'ENTRY' }],
        isActive: true,
      },
      // Windows
      {
        id: 'WINDOW-STD',
        name: 'Standard Window',
        elementType: 'WINDOW',
        outputCode: '08 52 10.10',
        outputName: 'Vinyl Window Double-Hung',
        category: 'WINDOWS',
        formula: '1',
        unit: 'EA',
        wastePercent: 0,
        isActive: true,
      },
      // Flooring
      {
        id: 'FLOOR-TILE',
        name: 'Tile Flooring',
        elementType: 'ROOM',
        outputCode: '09 30 13.10',
        outputName: 'Ceramic Floor Tile',
        category: 'FLOORING',
        formula: 'area',
        unit: 'SF',
        wastePercent: 10,
        conditions: [{ field: 'finishes.floor', operator: 'EQ', value: 'Tile' }],
        isActive: true,
      },
      {
        id: 'FLOOR-HARDWOOD',
        name: 'Hardwood Flooring',
        elementType: 'ROOM',
        outputCode: '09 64 23.10',
        outputName: 'Hardwood Flooring Oak',
        category: 'FLOORING',
        formula: 'area',
        unit: 'SF',
        wastePercent: 8,
        conditions: [{ field: 'finishes.floor', operator: 'EQ', value: 'Hardwood' }],
        isActive: true,
      },
      {
        id: 'FLOOR-CARPET',
        name: 'Carpet Flooring',
        elementType: 'ROOM',
        outputCode: '09 68 13.10',
        outputName: 'Carpet Residential',
        category: 'FLOORING',
        formula: 'area',
        unit: 'SY',
        wastePercent: 5,
        conditions: [{ field: 'finishes.floor', operator: 'EQ', value: 'Carpet' }],
        isActive: true,
      },
      // Paint
      {
        id: 'PAINT-WALL',
        name: 'Wall Paint',
        elementType: 'ROOM',
        outputCode: '09 91 23.10',
        outputName: 'Interior Paint 2 Coats',
        category: 'PAINT',
        formula: 'perimeter * height',
        unit: 'SF',
        wastePercent: 5,
        isActive: true,
      },
      {
        id: 'PAINT-CEILING',
        name: 'Ceiling Paint',
        elementType: 'ROOM',
        outputCode: '09 91 23.20',
        outputName: 'Ceiling Paint',
        category: 'PAINT',
        formula: 'area',
        unit: 'SF',
        wastePercent: 5,
        isActive: true,
      },
    ];
  }

  /**
   * Extract quantities from plan analysis
   */
  async extractFromAnalysis(
    projectId: string,
    analysisId: string,
    options?: {
      customRules?: QuantityRule[];
      mergeCategories?: boolean;
      minConfidence?: number;
    }
  ): Promise<ExtractionResult> {
    const result: ExtractionResult = {
      id: uuid(),
      projectId,
      status: 'PROCESSING',
      items: [],
      summary: {
        totalItems: 0,
        categoryCounts: {},
        highConfidenceCount: 0,
        lowConfidenceCount: 0,
        manualReviewRequired: 0,
      },
      warnings: [],
      createdAt: new Date(),
    };

    try {
      // Get plan analysis from in-memory store
      const analysis = await planAnalyzer.getAnalysisResult(analysisId);

      if (!analysis) {
        throw new Error('Plan analysis not found');
      }

      const elements = analysis.detectedElements || [];
      const rooms = analysis.roomAnalysis || [];
      const rules = options?.customRules || this.defaultRules;

      // Apply extraction rules
      for (const rule of rules) {
        if (!rule.isActive) continue;

        const ruleElements = elements.filter(e => e.type === rule.elementType);
        const items = await this.applyRule(rule, ruleElements, rooms, analysisId);

        for (const item of items) {
          // Apply minimum confidence filter
          if (options?.minConfidence && item.confidence < options.minConfidence) {
            result.warnings.push(
              `Item ${item.code} below confidence threshold (${item.confidence})`
            );
            continue;
          }

          // Merge same-code items if enabled
          if (options?.mergeCategories) {
            const existing = result.items.find(i => i.code === item.code);
            if (existing) {
              existing.quantity += item.quantity;
              existing.grossQuantity += item.grossQuantity;
              existing.elements.push(...item.elements);
              continue;
            }
          }

          result.items.push(item);
        }
      }

      // Update summary
      result.summary = this.calculateSummary(result.items);
      result.status = 'COMPLETED';
      result.completedAt = new Date();

      // Save extraction result
      await this.saveExtractionResult(result);

    } catch (error) {
      result.status = 'FAILED';
      result.warnings.push(String(error));
    }

    return result;
  }

  /**
   * Apply extraction rule to elements
   */
  private async applyRule(
    rule: QuantityRule,
    elements: DetectedElement[],
    rooms: RoomAnalysis[],
    analysisId: string
  ): Promise<QuantityItem[]> {
    const items: QuantityItem[] = [];

    // Handle room-based rules
    if (rule.elementType === 'ROOM') {
      for (const room of rooms) {
        if (!this.matchesConditions(room, rule.conditions)) continue;

        const quantity = this.evaluateFormula(rule.formula, {
          area: room.area,
          perimeter: room.perimeter,
          height: room.height || 9,
        });

        const waste = measurementTools.calculateWaste(quantity, rule.wastePercent);

        items.push({
          id: uuid(),
          code: rule.outputCode,
          name: rule.outputName,
          category: rule.category,
          quantity: waste.netQuantity,
          unit: rule.unit,
          wastePercent: rule.wastePercent,
          grossQuantity: waste.grossQuantity,
          source: { type: 'PLAN_ANALYSIS', analysisId, formula: rule.formula },
          elements: [room.id],
          confidence: 0.8,
          notes: `From room: ${room.name}`,
        });
      }
    } else {
      // Handle element-based rules
      for (const element of elements) {
        if (!this.matchesConditions(element, rule.conditions)) continue;

        const quantity = this.evaluateFormula(rule.formula, {
          length: element.measurements.length || 0,
          width: element.measurements.width || 0,
          height: element.measurements.height || 0,
          area: element.measurements.area || 0,
          perimeter: element.measurements.perimeter || 0,
        });

        const waste = measurementTools.calculateWaste(quantity, rule.wastePercent);

        items.push({
          id: uuid(),
          code: rule.outputCode,
          name: rule.outputName,
          category: rule.category,
          quantity: waste.netQuantity,
          unit: rule.unit,
          wastePercent: rule.wastePercent,
          grossQuantity: waste.grossQuantity,
          source: { type: 'PLAN_ANALYSIS', analysisId, formula: rule.formula },
          elements: [element.id],
          confidence: element.confidence,
          notes: `From element: ${element.name}`,
        });
      }
    }

    return items;
  }

  /**
   * Check if item matches conditions
   */
  private matchesConditions(
    item: DetectedElement | RoomAnalysis,
    conditions?: QuantityCondition[]
  ): boolean {
    if (!conditions || conditions.length === 0) return true;

    for (const condition of conditions) {
      const value = this.getNestedValue(item as unknown as Record<string, unknown>, condition.field);
      if (!this.evaluateCondition(value, condition.operator, condition.value)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current: unknown, key: string) => {
      if (current && typeof current === 'object' && key in current) {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj as unknown);
  }

  /**
   * Evaluate condition
   */
  private evaluateCondition(
    value: unknown,
    operator: QuantityCondition['operator'],
    target: string | number
  ): boolean {
    switch (operator) {
      case 'EQ':
        return value === target;
      case 'NE':
        return value !== target;
      case 'GT':
        return Number(value) > Number(target);
      case 'GTE':
        return Number(value) >= Number(target);
      case 'LT':
        return Number(value) < Number(target);
      case 'LTE':
        return Number(value) <= Number(target);
      case 'CONTAINS':
        return String(value).includes(String(target));
      case 'STARTS_WITH':
        return String(value).startsWith(String(target));
      default:
        return false;
    }
  }

  /**
   * Evaluate formula
   */
  private evaluateFormula(formula: string, variables: Record<string, number>): number {
    // Simple formula evaluation
    let expression = formula;

    // Replace variables
    for (const [key, value] of Object.entries(variables)) {
      expression = expression.replace(new RegExp(key, 'gi'), String(value));
    }

    // Handle functions
    expression = expression.replace(/CEIL\(([^)]+)\)/gi, (_, expr) => {
      return String(Math.ceil(this.evaluateExpression(expr)));
    });

    expression = expression.replace(/FLOOR\(([^)]+)\)/gi, (_, expr) => {
      return String(Math.floor(this.evaluateExpression(expr)));
    });

    expression = expression.replace(/ROUND\(([^)]+)\)/gi, (_, expr) => {
      return String(Math.round(this.evaluateExpression(expr)));
    });

    return this.evaluateExpression(expression);
  }

  /**
   * Evaluate mathematical expression
   */
  private evaluateExpression(expr: string): number {
    try {
      // Safe evaluation using Decimal.js
      const result = new Decimal(expr.replace(/[^0-9+\-*/().]/g, '')).toNumber();
      if (isNaN(result)) {
        // Fallback to simple evaluation
        const sanitized = expr.replace(/[^0-9+\-*/().]/g, '');
        return Function(`"use strict"; return (${sanitized})`)();
      }
      return result;
    } catch {
      return 0;
    }
  }

  /**
   * Calculate extraction summary
   */
  private calculateSummary(items: QuantityItem[]): ExtractionSummary {
    const summary: ExtractionSummary = {
      totalItems: items.length,
      categoryCounts: {},
      highConfidenceCount: 0,
      lowConfidenceCount: 0,
      manualReviewRequired: 0,
    };

    for (const item of items) {
      // Count by category
      summary.categoryCounts[item.category] =
        (summary.categoryCounts[item.category] || 0) + 1;

      // Count by confidence
      if (item.confidence >= 0.8) {
        summary.highConfidenceCount++;
      } else if (item.confidence < 0.6) {
        summary.lowConfidenceCount++;
        summary.manualReviewRequired++;
      }
    }

    return summary;
  }

  /**
   * Save extraction result to in-memory store
   */
  private async saveExtractionResult(result: ExtractionResult): Promise<void> {
    const record: ExtractionRecord = {
      id: result.id,
      projectId: result.projectId,
      status: result.status,
      items: result.items,
      summary: result.summary,
      warnings: result.warnings,
      createdAt: result.createdAt,
      completedAt: result.completedAt,
    };
    extractionStore.set(result.id, record);
  }

  /**
   * Get extraction result
   */
  async getExtractionResult(extractionId: string): Promise<ExtractionResult | null> {
    const record = extractionStore.get(extractionId);
    if (!record) return null;

    return {
      id: record.id,
      projectId: record.projectId,
      status: record.status as ExtractionResult['status'],
      items: record.items || [],
      summary: record.summary || {
        totalItems: 0,
        categoryCounts: {},
        highConfidenceCount: 0,
        lowConfidenceCount: 0,
        manualReviewRequired: 0,
      },
      warnings: record.warnings || [],
      createdAt: record.createdAt,
      completedAt: record.completedAt,
    };
  }

  /**
   * Export extraction data for storage in Estimate.metadata
   */
  exportToMetadata(extractionId: string): ExtractionRecord | null {
    return extractionStore.get(extractionId) || null;
  }

  /**
   * Import extraction data from Estimate.metadata
   */
  importFromMetadata(data: ExtractionRecord): void {
    extractionStore.set(data.id, data);
  }

  /**
   * Clear all in-memory data
   */
  clearAll(): void {
    extractionStore.clear();
  }

  /**
   * List all extraction results
   */
  listExtractionResults(projectId?: string): ExtractionResult[] {
    const results: ExtractionResult[] = [];
    for (const record of extractionStore.values()) {
      if (projectId && record.projectId !== projectId) continue;
      results.push({
        id: record.id,
        projectId: record.projectId,
        status: record.status as ExtractionResult['status'],
        items: record.items || [],
        summary: record.summary || {
          totalItems: 0,
          categoryCounts: {},
          highConfidenceCount: 0,
          lowConfidenceCount: 0,
          manualReviewRequired: 0,
        },
        warnings: record.warnings || [],
        createdAt: record.createdAt,
        completedAt: record.completedAt,
      });
    }
    return results;
  }

  /**
   * Merge multiple extractions
   */
  async mergeExtractions(
    projectId: string,
    extractionIds: string[]
  ): Promise<ExtractionResult> {
    const extractions = await Promise.all(
      extractionIds.map(id => this.getExtractionResult(id))
    );

    const result: ExtractionResult = {
      id: uuid(),
      projectId,
      status: 'COMPLETED',
      items: [],
      summary: {
        totalItems: 0,
        categoryCounts: {},
        highConfidenceCount: 0,
        lowConfidenceCount: 0,
        manualReviewRequired: 0,
      },
      warnings: [],
      createdAt: new Date(),
      completedAt: new Date(),
    };

    // Merge items with same code
    const itemMap = new Map<string, QuantityItem>();

    for (const extraction of extractions) {
      if (!extraction) continue;

      for (const item of extraction.items) {
        const existing = itemMap.get(item.code);
        if (existing) {
          existing.quantity += item.quantity;
          existing.grossQuantity += item.grossQuantity;
          existing.elements.push(...item.elements);
          existing.confidence = Math.min(existing.confidence, item.confidence);
        } else {
          itemMap.set(item.code, { ...item, id: uuid() });
        }
      }
    }

    result.items = Array.from(itemMap.values());
    result.summary = this.calculateSummary(result.items);

    await this.saveExtractionResult(result);

    return result;
  }

  /**
   * Export quantities to estimate format
   */
  async exportToEstimate(
    extractionId: string,
    options?: {
      includeZeroQuantities?: boolean;
      groupByCategory?: boolean;
    }
  ): Promise<{
    items: Array<{
      code: string;
      name: string;
      category: string;
      quantity: number;
      unit: string;
      takeoffQuantity: number;
      wastePercent: number;
    }>;
  }> {
    const extraction = await this.getExtractionResult(extractionId);
    if (!extraction) {
      throw new Error('Extraction not found');
    }

    let items = extraction.items;

    // Filter zero quantities
    if (!options?.includeZeroQuantities) {
      items = items.filter(i => i.grossQuantity > 0);
    }

    // Sort by category if grouping
    if (options?.groupByCategory) {
      items.sort((a, b) => a.category.localeCompare(b.category));
    }

    return {
      items: items.map(item => ({
        code: item.code,
        name: item.name,
        category: item.category,
        quantity: item.grossQuantity,
        unit: item.unit,
        takeoffQuantity: item.quantity,
        wastePercent: item.wastePercent,
      })),
    };
  }

  /**
   * Get default extraction rules
   */
  getDefaultRules(): QuantityRule[] {
    return [...this.defaultRules];
  }

  /**
   * Add custom rule
   */
  addCustomRule(rule: QuantityRule): void {
    this.defaultRules.push(rule);
  }
}

export const quantityExtractor = new QuantityExtractor();
