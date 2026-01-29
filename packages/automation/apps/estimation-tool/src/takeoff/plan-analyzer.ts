/**
 * Plan Analyzer
 * AI-powered construction plan analysis
 *
 * Note: Analysis results are stored in-memory and can be exported to/imported from
 * Estimate.metadata for persistence.
 */

import { v4 as uuid } from 'uuid';

// In-memory storage for plan analysis results (keyed by analysis ID)
const analysisStore = new Map<string, PlanAnalysisRecord>();

interface PlanAnalysisRecord {
  id: string;
  planId: string;
  status: string;
  elements: DetectedElement[];
  rooms: RoomAnalysis[];
  materials: MaterialEstimate[];
  warnings: AnalysisWarning[];
  confidence: number;
  metadata?: PlanMetadata;
  processedAt?: Date;
  createdAt: Date;
}

export interface AnalysisResult {
  id: string;
  planId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  detectedElements: DetectedElement[];
  roomAnalysis: RoomAnalysis[];
  materialEstimates: MaterialEstimate[];
  warnings: AnalysisWarning[];
  confidence: number;
  processedAt?: Date;
}

export interface DetectedElement {
  id: string;
  type: ElementType;
  name: string;
  bounds: BoundingBox;
  measurements: ElementMeasurements;
  attributes: Record<string, unknown>;
  confidence: number;
  layer?: string;
  floor?: string;
}

export type ElementType =
  | 'WALL'
  | 'DOOR'
  | 'WINDOW'
  | 'ROOM'
  | 'STAIR'
  | 'COLUMN'
  | 'BEAM'
  | 'SLAB'
  | 'FOOTING'
  | 'ROOF'
  | 'CEILING'
  | 'FLOOR'
  | 'FIXTURE'
  | 'EQUIPMENT'
  | 'DUCT'
  | 'PIPE'
  | 'CONDUIT'
  | 'PANEL'
  | 'ANNOTATION'
  | 'DIMENSION'
  | 'SYMBOL'
  | 'OTHER';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

export interface ElementMeasurements {
  length?: number;
  width?: number;
  height?: number;
  area?: number;
  volume?: number;
  perimeter?: number;
  unit: string;
}

export interface RoomAnalysis {
  id: string;
  name: string;
  type: RoomType;
  floor: string;
  area: number;
  perimeter: number;
  height?: number;
  doors: number;
  windows: number;
  fixtures: string[];
  finishes: RoomFinishes;
}

export type RoomType =
  | 'LIVING'
  | 'BEDROOM'
  | 'BATHROOM'
  | 'KITCHEN'
  | 'DINING'
  | 'OFFICE'
  | 'GARAGE'
  | 'UTILITY'
  | 'STORAGE'
  | 'HALLWAY'
  | 'STAIRWELL'
  | 'LOBBY'
  | 'CONFERENCE'
  | 'MECHANICAL'
  | 'ELECTRICAL'
  | 'OTHER';

export interface RoomFinishes {
  floor?: string;
  wall?: string;
  ceiling?: string;
  baseboard?: string;
  trim?: string;
}

export interface MaterialEstimate {
  category: string;
  material: string;
  quantity: number;
  unit: string;
  source: string[];
  confidence: number;
}

export interface AnalysisWarning {
  type: 'ERROR' | 'WARNING' | 'INFO';
  code: string;
  message: string;
  location?: BoundingBox;
  element?: string;
}

export interface PlanMetadata {
  title?: string;
  projectName?: string;
  sheetNumber?: string;
  scale?: string;
  author?: string;
  date?: string;
  revision?: string;
  discipline?: 'ARCHITECTURAL' | 'STRUCTURAL' | 'MECHANICAL' | 'ELECTRICAL' | 'PLUMBING' | 'CIVIL';
}

export class PlanAnalyzer {
  /**
   * Analyze a construction plan
   */
  async analyzePlan(
    planId: string,
    planData: Buffer | string,
    options?: {
      extractMaterials?: boolean;
      analyzeRooms?: boolean;
      detectScale?: boolean;
      floor?: string;
    }
  ): Promise<AnalysisResult> {
    const result: AnalysisResult = {
      id: uuid(),
      planId,
      status: 'PROCESSING',
      detectedElements: [],
      roomAnalysis: [],
      materialEstimates: [],
      warnings: [],
      confidence: 0,
    };

    try {
      // Extract plan metadata
      const metadata = await this.extractMetadata(planData);

      // Detect scale if not provided
      let scale = 1;
      if (options?.detectScale) {
        scale = await this.detectScale(planData);
      }

      // Detect elements in the plan
      const elements = await this.detectElements(planData, scale, options?.floor);
      result.detectedElements = elements;

      // Analyze rooms if requested
      if (options?.analyzeRooms) {
        result.roomAnalysis = await this.analyzeRooms(elements);
      }

      // Estimate materials if requested
      if (options?.extractMaterials) {
        result.materialEstimates = await this.estimateMaterials(elements, result.roomAnalysis);
      }

      // Calculate overall confidence
      result.confidence = this.calculateConfidence(elements);

      result.status = 'COMPLETED';
      result.processedAt = new Date();

      // Save analysis result
      await this.saveAnalysisResult(result, metadata);

    } catch (error) {
      result.status = 'FAILED';
      result.warnings.push({
        type: 'ERROR',
        code: 'ANALYSIS_FAILED',
        message: String(error),
      });
    }

    return result;
  }

  /**
   * Extract metadata from plan
   */
  private async extractMetadata(planData: Buffer | string): Promise<PlanMetadata> {
    // In production, this would parse PDF/DWG metadata
    // For now, return empty metadata
    return {
      discipline: 'ARCHITECTURAL',
    };
  }

  /**
   * Detect scale from plan
   */
  private async detectScale(planData: Buffer | string): Promise<number> {
    // In production, this would:
    // 1. Look for scale annotations
    // 2. Analyze dimension patterns
    // 3. Compare known element sizes (doors, etc.)
    // Default to 1/4" = 1'-0" (48)
    return 48;
  }

  /**
   * Detect elements in the plan
   */
  private async detectElements(
    planData: Buffer | string,
    scale: number,
    floor?: string
  ): Promise<DetectedElement[]> {
    // In production, this would use:
    // 1. Computer vision / ML models
    // 2. CAD file parsing (DWG/DXF)
    // 3. PDF vector extraction
    // 4. Symbol recognition

    // Return sample elements for demonstration
    return this.generateSampleElements(scale, floor);
  }

  /**
   * Generate sample elements (placeholder for ML detection)
   */
  private generateSampleElements(scale: number, floor?: string): DetectedElement[] {
    const elements: DetectedElement[] = [];

    // Sample walls
    const wallConfigs = [
      { x: 0, y: 0, length: 40, height: 9, type: 'EXTERIOR' },
      { x: 40, y: 0, length: 30, height: 9, type: 'EXTERIOR' },
      { x: 0, y: 0, length: 30, height: 9, type: 'EXTERIOR' },
      { x: 15, y: 0, length: 15, height: 9, type: 'INTERIOR' },
    ];

    for (const wall of wallConfigs) {
      elements.push({
        id: uuid(),
        type: 'WALL',
        name: `${wall.type} Wall`,
        bounds: { x: wall.x, y: wall.y, width: wall.length, height: 0.5 },
        measurements: {
          length: wall.length,
          height: wall.height,
          area: wall.length * wall.height,
          unit: 'FT',
        },
        attributes: { wallType: wall.type },
        confidence: 0.85,
        floor: floor || '1',
      });
    }

    // Sample doors
    const doorConfigs = [
      { x: 10, y: 0, width: 3, height: 7, type: 'ENTRY' },
      { x: 20, y: 15, width: 2.67, height: 6.67, type: 'INTERIOR' },
      { x: 35, y: 0, width: 6, height: 7, type: 'SLIDING' },
    ];

    for (const door of doorConfigs) {
      elements.push({
        id: uuid(),
        type: 'DOOR',
        name: `${door.type} Door`,
        bounds: { x: door.x, y: door.y, width: door.width, height: 0.25 },
        measurements: {
          width: door.width,
          height: door.height,
          unit: 'FT',
        },
        attributes: { doorType: door.type },
        confidence: 0.9,
        floor: floor || '1',
      });
    }

    // Sample windows
    const windowConfigs = [
      { x: 5, y: 0, width: 4, height: 4 },
      { x: 25, y: 0, width: 6, height: 5 },
      { x: 15, y: 30, width: 3, height: 3 },
    ];

    for (const window of windowConfigs) {
      elements.push({
        id: uuid(),
        type: 'WINDOW',
        name: 'Window',
        bounds: { x: window.x, y: window.y, width: window.width, height: 0.5 },
        measurements: {
          width: window.width,
          height: window.height,
          area: window.width * window.height,
          unit: 'FT',
        },
        attributes: {},
        confidence: 0.88,
        floor: floor || '1',
      });
    }

    // Sample rooms
    const roomConfigs = [
      { name: 'Living Room', type: 'LIVING', x: 0, y: 0, w: 20, l: 15 },
      { name: 'Kitchen', type: 'KITCHEN', x: 20, y: 0, w: 15, l: 12 },
      { name: 'Master Bedroom', type: 'BEDROOM', x: 0, y: 15, w: 15, l: 12 },
      { name: 'Bathroom', type: 'BATHROOM', x: 15, y: 15, w: 8, l: 8 },
    ];

    for (const room of roomConfigs) {
      elements.push({
        id: uuid(),
        type: 'ROOM',
        name: room.name,
        bounds: { x: room.x, y: room.y, width: room.w, height: room.l },
        measurements: {
          length: room.l,
          width: room.w,
          area: room.w * room.l,
          perimeter: 2 * (room.w + room.l),
          unit: 'FT',
        },
        attributes: { roomType: room.type },
        confidence: 0.82,
        floor: floor || '1',
      });
    }

    return elements;
  }

  /**
   * Analyze rooms from detected elements
   */
  private async analyzeRooms(elements: DetectedElement[]): Promise<RoomAnalysis[]> {
    const rooms: RoomAnalysis[] = [];
    const roomElements = elements.filter(e => e.type === 'ROOM');
    const doors = elements.filter(e => e.type === 'DOOR');
    const windows = elements.filter(e => e.type === 'WINDOW');

    for (const room of roomElements) {
      const roomType = (room.attributes.roomType as RoomType) || 'OTHER';
      const bounds = room.bounds;

      // Count doors and windows in room
      const roomDoors = doors.filter(d => this.isInBounds(d.bounds, bounds)).length;
      const roomWindows = windows.filter(w => this.isInBounds(w.bounds, bounds)).length;

      // Determine finishes based on room type
      const finishes = this.getDefaultFinishes(roomType);

      rooms.push({
        id: room.id,
        name: room.name,
        type: roomType,
        floor: room.floor || '1',
        area: room.measurements.area || 0,
        perimeter: room.measurements.perimeter || 0,
        height: room.measurements.height || 9,
        doors: roomDoors,
        windows: roomWindows,
        fixtures: this.getDefaultFixtures(roomType),
        finishes,
      });
    }

    return rooms;
  }

  /**
   * Check if element is within bounds
   */
  private isInBounds(element: BoundingBox, container: BoundingBox): boolean {
    return (
      element.x >= container.x &&
      element.y >= container.y &&
      element.x + element.width <= container.x + container.width &&
      element.y + element.height <= container.y + container.height
    );
  }

  /**
   * Get default finishes for room type
   */
  private getDefaultFinishes(roomType: RoomType): RoomFinishes {
    const finishMap: Record<RoomType, RoomFinishes> = {
      LIVING: { floor: 'Hardwood', wall: 'Paint', ceiling: 'Drywall', baseboard: 'Wood' },
      BEDROOM: { floor: 'Carpet', wall: 'Paint', ceiling: 'Drywall', baseboard: 'Wood' },
      BATHROOM: { floor: 'Tile', wall: 'Tile/Paint', ceiling: 'Drywall', baseboard: 'Tile' },
      KITCHEN: { floor: 'Tile', wall: 'Paint', ceiling: 'Drywall', baseboard: 'Wood' },
      DINING: { floor: 'Hardwood', wall: 'Paint', ceiling: 'Drywall', baseboard: 'Wood' },
      OFFICE: { floor: 'Carpet', wall: 'Paint', ceiling: 'Drywall', baseboard: 'Wood' },
      GARAGE: { floor: 'Concrete', wall: 'Drywall', ceiling: 'Open' },
      UTILITY: { floor: 'Tile', wall: 'Paint', ceiling: 'Drywall' },
      STORAGE: { floor: 'Concrete', wall: 'Paint', ceiling: 'Drywall' },
      HALLWAY: { floor: 'Hardwood', wall: 'Paint', ceiling: 'Drywall', baseboard: 'Wood' },
      STAIRWELL: { floor: 'Hardwood', wall: 'Paint', ceiling: 'Drywall' },
      LOBBY: { floor: 'Tile', wall: 'Paint', ceiling: 'Drywall', baseboard: 'Tile' },
      CONFERENCE: { floor: 'Carpet', wall: 'Paint', ceiling: 'ACT' },
      MECHANICAL: { floor: 'Concrete', wall: 'CMU', ceiling: 'Open' },
      ELECTRICAL: { floor: 'Concrete', wall: 'CMU', ceiling: 'Open' },
      OTHER: { floor: 'TBD', wall: 'TBD', ceiling: 'TBD' },
    };

    return finishMap[roomType] || finishMap.OTHER;
  }

  /**
   * Get default fixtures for room type
   */
  private getDefaultFixtures(roomType: RoomType): string[] {
    const fixtureMap: Record<RoomType, string[]> = {
      LIVING: ['Ceiling Light', 'Outlets', 'Switch'],
      BEDROOM: ['Ceiling Light', 'Outlets', 'Switch', 'Closet Light'],
      BATHROOM: ['Toilet', 'Lavatory', 'Tub/Shower', 'Vanity Light', 'Exhaust Fan'],
      KITCHEN: ['Sink', 'Dishwasher', 'Range Hood', 'Outlets', 'Lights'],
      DINING: ['Chandelier', 'Outlets'],
      OFFICE: ['Ceiling Light', 'Outlets', 'Data Outlets'],
      GARAGE: ['Garage Door Opener', 'Outlets', 'Light'],
      UTILITY: ['Washer Connection', 'Dryer Connection', 'Utility Sink'],
      STORAGE: ['Light'],
      HALLWAY: ['Ceiling Light', 'Smoke Detector'],
      STAIRWELL: ['Stair Light', 'Smoke Detector'],
      LOBBY: ['Ceiling Light', 'Outlets'],
      CONFERENCE: ['Ceiling Lights', 'Data Outlets', 'AV Equipment'],
      MECHANICAL: ['Equipment', 'Drainage'],
      ELECTRICAL: ['Panels', 'Outlets'],
      OTHER: [],
    };

    return fixtureMap[roomType] || [];
  }

  /**
   * Estimate materials from elements
   */
  private async estimateMaterials(
    elements: DetectedElement[],
    rooms: RoomAnalysis[]
  ): Promise<MaterialEstimate[]> {
    const estimates: MaterialEstimate[] = [];

    // Framing materials
    const walls = elements.filter(e => e.type === 'WALL');
    const totalWallLength = walls.reduce((sum, w) => sum + (w.measurements.length || 0), 0);
    const avgWallHeight = 9;

    // Studs (16" OC)
    const studCount = Math.ceil(totalWallLength / (16 / 12)) + walls.length;
    estimates.push({
      category: 'FRAMING',
      material: '2x4 Studs',
      quantity: studCount,
      unit: 'EA',
      source: walls.map(w => w.id),
      confidence: 0.8,
    });

    // Top/Bottom plates
    estimates.push({
      category: 'FRAMING',
      material: '2x4 Plates',
      quantity: Math.ceil(totalWallLength * 3),
      unit: 'LF',
      source: walls.map(w => w.id),
      confidence: 0.85,
    });

    // Drywall
    const totalWallArea = totalWallLength * avgWallHeight;
    const drywallSheets = Math.ceil(totalWallArea / 32) * 1.1; // 10% waste
    estimates.push({
      category: 'DRYWALL',
      material: '1/2" Drywall (4x8)',
      quantity: Math.ceil(drywallSheets),
      unit: 'EA',
      source: walls.map(w => w.id),
      confidence: 0.82,
    });

    // Doors
    const doors = elements.filter(e => e.type === 'DOOR');
    estimates.push({
      category: 'DOORS',
      material: 'Interior Door (Pre-hung)',
      quantity: doors.filter(d => d.attributes.doorType === 'INTERIOR').length,
      unit: 'EA',
      source: doors.map(d => d.id),
      confidence: 0.9,
    });
    estimates.push({
      category: 'DOORS',
      material: 'Entry Door',
      quantity: doors.filter(d => d.attributes.doorType === 'ENTRY').length,
      unit: 'EA',
      source: doors.map(d => d.id),
      confidence: 0.9,
    });

    // Windows
    const windows = elements.filter(e => e.type === 'WINDOW');
    estimates.push({
      category: 'WINDOWS',
      material: 'Window Unit',
      quantity: windows.length,
      unit: 'EA',
      source: windows.map(w => w.id),
      confidence: 0.88,
    });

    // Flooring by room type
    for (const room of rooms) {
      const floorMaterial = room.finishes.floor || 'TBD';
      const existingEstimate = estimates.find(
        e => e.category === 'FLOORING' && e.material === floorMaterial
      );

      if (existingEstimate) {
        existingEstimate.quantity += room.area;
        existingEstimate.source.push(room.id);
      } else {
        estimates.push({
          category: 'FLOORING',
          material: floorMaterial,
          quantity: room.area,
          unit: 'SF',
          source: [room.id],
          confidence: 0.75,
        });
      }
    }

    // Paint
    const totalPaintArea = rooms.reduce((sum, r) => {
      return sum + r.perimeter * (r.height || 9);
    }, 0);
    estimates.push({
      category: 'PAINT',
      material: 'Interior Paint',
      quantity: Math.ceil(totalPaintArea / 350), // 350 SF per gallon
      unit: 'GAL',
      source: rooms.map(r => r.id),
      confidence: 0.78,
    });

    return estimates;
  }

  /**
   * Calculate overall confidence
   */
  private calculateConfidence(elements: DetectedElement[]): number {
    if (elements.length === 0) return 0;
    const total = elements.reduce((sum, e) => sum + e.confidence, 0);
    return total / elements.length;
  }

  /**
   * Save analysis result to in-memory store
   */
  private async saveAnalysisResult(
    result: AnalysisResult,
    metadata: PlanMetadata
  ): Promise<void> {
    const record: PlanAnalysisRecord = {
      id: result.id,
      planId: result.planId,
      status: result.status,
      elements: result.detectedElements,
      rooms: result.roomAnalysis,
      materials: result.materialEstimates,
      warnings: result.warnings,
      confidence: result.confidence,
      metadata,
      processedAt: result.processedAt,
      createdAt: new Date(),
    };
    analysisStore.set(result.id, record);
  }

  /**
   * Get analysis result by ID
   */
  async getAnalysisResult(analysisId: string): Promise<AnalysisResult | null> {
    const record = analysisStore.get(analysisId);
    if (!record) return null;

    return {
      id: record.id,
      planId: record.planId,
      status: record.status as AnalysisResult['status'],
      detectedElements: record.elements || [],
      roomAnalysis: record.rooms || [],
      materialEstimates: record.materials || [],
      warnings: record.warnings || [],
      confidence: record.confidence,
      processedAt: record.processedAt,
    };
  }

  /**
   * Export analysis data for storage in Estimate.metadata
   */
  exportToMetadata(analysisId: string): PlanAnalysisRecord | null {
    return analysisStore.get(analysisId) || null;
  }

  /**
   * Import analysis data from Estimate.metadata
   */
  importFromMetadata(data: PlanAnalysisRecord): void {
    analysisStore.set(data.id, data);
  }

  /**
   * Clear all in-memory data
   */
  clearAll(): void {
    analysisStore.clear();
  }

  /**
   * List all analysis results
   */
  listAnalysisResults(planId?: string): AnalysisResult[] {
    const results: AnalysisResult[] = [];
    for (const record of analysisStore.values()) {
      if (planId && record.planId !== planId) continue;
      results.push({
        id: record.id,
        planId: record.planId,
        status: record.status as AnalysisResult['status'],
        detectedElements: record.elements || [],
        roomAnalysis: record.rooms || [],
        materialEstimates: record.materials || [],
        warnings: record.warnings || [],
        confidence: record.confidence,
        processedAt: record.processedAt,
      });
    }
    return results;
  }

  /**
   * Compare two plan versions
   */
  async comparePlans(
    analysisId1: string,
    analysisId2: string
  ): Promise<{
    added: DetectedElement[];
    removed: DetectedElement[];
    modified: { before: DetectedElement; after: DetectedElement }[];
    materialChanges: { material: string; before: number; after: number; change: number }[];
  }> {
    const [result1, result2] = await Promise.all([
      this.getAnalysisResult(analysisId1),
      this.getAnalysisResult(analysisId2),
    ]);

    if (!result1 || !result2) {
      throw new Error('Analysis results not found');
    }

    const elements1 = new Map(result1.detectedElements.map(e => [e.id, e]));
    const elements2 = new Map(result2.detectedElements.map(e => [e.id, e]));

    const added = result2.detectedElements.filter(e => !elements1.has(e.id));
    const removed = result1.detectedElements.filter(e => !elements2.has(e.id));
    const modified: { before: DetectedElement; after: DetectedElement }[] = [];

    for (const [id, elem2] of elements2) {
      const elem1 = elements1.get(id);
      if (elem1 && this.hasElementChanged(elem1, elem2)) {
        modified.push({ before: elem1, after: elem2 });
      }
    }

    // Compare material estimates
    const materials1 = new Map(
      result1.materialEstimates.map(m => [m.material, m.quantity])
    );
    const materials2 = new Map(
      result2.materialEstimates.map(m => [m.material, m.quantity])
    );

    const allMaterials = new Set([...materials1.keys(), ...materials2.keys()]);
    const materialChanges: { material: string; before: number; after: number; change: number }[] = [];

    for (const material of allMaterials) {
      const before = materials1.get(material) || 0;
      const after = materials2.get(material) || 0;
      if (before !== after) {
        materialChanges.push({
          material,
          before,
          after,
          change: after - before,
        });
      }
    }

    return { added, removed, modified, materialChanges };
  }

  /**
   * Check if element has changed
   */
  private hasElementChanged(elem1: DetectedElement, elem2: DetectedElement): boolean {
    return (
      elem1.measurements.area !== elem2.measurements.area ||
      elem1.measurements.length !== elem2.measurements.length ||
      elem1.bounds.x !== elem2.bounds.x ||
      elem1.bounds.y !== elem2.bounds.y
    );
  }
}

export const planAnalyzer = new PlanAnalyzer();
