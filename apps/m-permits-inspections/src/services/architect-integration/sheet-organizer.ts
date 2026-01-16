/**
 * Sheet Organizer Service
 * Automatic plan sheet recognition and categorization
 */

import {DesignDeliverable} from './design-export';

export interface OrganizedSheet {
  sheetNumber: string;
  sheetType: SheetType;
  name: string;
  category: SheetCategory;
  fileUrl: string;
  fileSize: number;
  version: number;
  confidence: number; // 0-1
  metadata?: {
    scale?: string;
    date?: string;
    revision?: string;
    discipline?: string;
  };
}

export type SheetType =
  | 'SITE_PLAN'
  | 'FLOOR_PLAN'
  | 'ELEVATION'
  | 'SECTION'
  | 'DETAIL'
  | 'SCHEDULE'
  | 'CALCULATION'
  | 'SPECIFICATION'
  | 'OTHER';

export type SheetCategory =
  | 'ARCHITECTURAL'
  | 'STRUCTURAL'
  | 'ELECTRICAL'
  | 'PLUMBING'
  | 'MECHANICAL'
  | 'CIVIL'
  | 'LANDSCAPE'
  | 'OTHER';

export class SheetOrganizerService {
  /**
   * Organize and categorize plan sheets
   */
  async organizeSheets(deliverables: DesignDeliverable[]): Promise<OrganizedSheet[]> {
    const organized: OrganizedSheet[] = [];

    for (const deliverable of deliverables) {
      const organizedSheet = await this.organizeSheet(deliverable);
      if (organizedSheet) {
        organized.push(organizedSheet);
      }
    }

    // Sort by sheet number
    organized.sort((a, b) => this.compareSheetNumbers(a.sheetNumber, b.sheetNumber));

    return organized;
  }

  /**
   * Organize a single sheet
   */
  private async organizeSheet(deliverable: DesignDeliverable): Promise<OrganizedSheet | null> {
    // Extract sheet information from name
    const sheetInfo = this.parseSheetName(deliverable.name);

    // Determine sheet type
    const sheetType = this.determineSheetType(deliverable.name, deliverable.sheetType);

    // Determine category
    const category = this.determineCategory(deliverable.name, sheetType);

    // Extract metadata
    const metadata = await this.extractSheetMetadata(deliverable);

    return {
      sheetNumber: sheetInfo.number || this.generateSheetNumber(deliverable),
      sheetType,
      name: deliverable.name,
      category,
      fileUrl: deliverable.fileUrl,
      fileSize: deliverable.fileSize,
      version: deliverable.version,
      confidence: this.calculateConfidence(sheetInfo, sheetType, category),
      metadata,
    };
  }

  /**
   * Parse sheet name to extract information
   */
  private parseSheetName(name: string): {
    number?: string;
    type?: string;
    discipline?: string;
    revision?: string;
  } {
    const info: {
      number?: string;
      type?: string;
      discipline?: string;
      revision?: string;
    } = {};

    // Common patterns:
    // "A-101 Floor Plan"
    // "S-201 Structural Details"
    // "E-301 Electrical Plan"
    // "A-101 Rev 2"

    // Extract sheet number (e.g., A-101, S-201)
    const sheetNumberMatch = name.match(/([A-Z])-(\d+)/i);
    if (sheetNumberMatch) {
      info.number = `${sheetNumberMatch[1].toUpperCase()}-${sheetNumberMatch[2]}`;
      info.discipline = sheetNumberMatch[1].toUpperCase();
    }

    // Extract revision
    const revisionMatch = name.match(/rev\s*(\d+)/i);
    if (revisionMatch) {
      info.revision = revisionMatch[1];
    }

    // Extract type keywords
    const typeKeywords = [
      'floor plan',
      'site plan',
      'elevation',
      'section',
      'detail',
      'schedule',
      'calculation',
      'specification',
    ];

    for (const keyword of typeKeywords) {
      if (name.toLowerCase().includes(keyword)) {
        info.type = keyword;
        break;
      }
    }

    return info;
  }

  /**
   * Determine sheet type
   */
  private determineSheetType(name: string, providedType?: string): SheetType {
    if (providedType) {
      return providedType as SheetType;
    }

    const nameLower = name.toLowerCase();

    // Site plan
    if (nameLower.includes('site plan') || nameLower.includes('siteplan')) {
      return 'SITE_PLAN';
    }

    // Floor plan
    if (nameLower.includes('floor plan') || nameLower.includes('floorplan')) {
      return 'FLOOR_PLAN';
    }

    // Elevation
    if (nameLower.includes('elevation')) {
      return 'ELEVATION';
    }

    // Section
    if (nameLower.includes('section')) {
      return 'SECTION';
    }

    // Detail
    if (nameLower.includes('detail')) {
      return 'DETAIL';
    }

    // Schedule
    if (nameLower.includes('schedule')) {
      return 'SCHEDULE';
    }

    // Calculation
    if (nameLower.includes('calc') || nameLower.includes('calculation')) {
      return 'CALCULATION';
    }

    // Specification
    if (nameLower.includes('spec') || nameLower.includes('specification')) {
      return 'SPECIFICATION';
    }

    return 'OTHER';
  }

  /**
   * Determine sheet category (discipline)
   */
  private determineCategory(name: string, sheetType: SheetType): SheetCategory {
    const nameLower = name.toLowerCase();

    // Structural
    if (
      nameLower.includes('structural') ||
      nameLower.includes('struct') ||
      nameLower.startsWith('s-') ||
      sheetType === 'CALCULATION'
    ) {
      return 'STRUCTURAL';
    }

    // Electrical
    if (
      nameLower.includes('electrical') ||
      nameLower.includes('elect') ||
      nameLower.startsWith('e-')
    ) {
      return 'ELECTRICAL';
    }

    // Plumbing
    if (
      nameLower.includes('plumbing') ||
      nameLower.includes('plumb') ||
      nameLower.startsWith('p-')
    ) {
      return 'PLUMBING';
    }

    // Mechanical
    if (
      nameLower.includes('mechanical') ||
      nameLower.includes('hvac') ||
      nameLower.startsWith('m-')
    ) {
      return 'MECHANICAL';
    }

    // Civil
    if (nameLower.includes('civil') || nameLower.includes('grading')) {
      return 'CIVIL';
    }

    // Landscape
    if (nameLower.includes('landscape') || nameLower.includes('landscaping')) {
      return 'LANDSCAPE';
    }

    // Default to architectural
    return 'ARCHITECTURAL';
  }

  /**
   * Extract sheet metadata
   */
  private async extractSheetMetadata(deliverable: DesignDeliverable): Promise<OrganizedSheet['metadata']> {
    // In production, this would parse the PDF/DWG file to extract:
    // - Scale
    // - Date
    // - Revision
    // - Discipline

    // For now, extract from filename
    const metadata: OrganizedSheet['metadata'] = {};

    // Extract revision from name
    const revisionMatch = deliverable.name.match(/rev\s*(\d+)/i);
    if (revisionMatch) {
      metadata.revision = revisionMatch[1];
    }

    // Extract date from name (various formats)
    const dateMatch = deliverable.name.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
    if (dateMatch) {
      metadata.date = dateMatch[1];
    }

    // Extract scale (e.g., "1/4\" = 1'-0\"")
    const scaleMatch = deliverable.name.match(/(\d+\/\d+["']?\s*=\s*\d+['"]-?\d*["']?)/i);
    if (scaleMatch) {
      metadata.scale = scaleMatch[1];
    }

    return metadata;
  }

  /**
   * Generate sheet number if not found
   */
  private generateSheetNumber(deliverable: DesignDeliverable): string {
    // Generate based on type and index
    const prefix = this.getSheetPrefix(deliverable.sheetType);
    const index = Math.floor(Math.random() * 1000);
    return `${prefix}-${index.toString().padStart(3, '0')}`;
  }

  /**
   * Get sheet prefix based on type
   */
  private getSheetPrefix(sheetType?: string): string {
    const prefixMap: Record<string, string> = {
      SITE_PLAN: 'SP',
      FLOOR_PLAN: 'A',
      ELEVATION: 'A',
      SECTION: 'A',
      DETAIL: 'A',
      STRUCTURAL: 'S',
      ELECTRICAL: 'E',
      PLUMBING: 'P',
      MECHANICAL: 'M',
    };

    return sheetType ? prefixMap[sheetType] || 'A' : 'A';
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(
    sheetInfo: {number?: string; type?: string; discipline?: string},
    sheetType: SheetType,
    category: SheetCategory
  ): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence if sheet number found
    if (sheetInfo.number) {
      confidence += 0.2;
    }

    // Increase confidence if type determined
    if (sheetType !== 'OTHER') {
      confidence += 0.2;
    }

    // Increase confidence if category determined
    if (category !== 'OTHER') {
      confidence += 0.1;
    }

    return Math.min(1.0, confidence);
  }

  /**
   * Compare sheet numbers for sorting
   */
  private compareSheetNumbers(a: string, b: string): number {
    // Extract prefix and number
    const aMatch = a.match(/([A-Z]+)-(\d+)/);
    const bMatch = b.match(/([A-Z]+)-(\d+)/);

    if (!aMatch || !bMatch) {
      return a.localeCompare(b);
    }

    const aPrefix = aMatch[1];
    const bPrefix = bMatch[1];
    const aNum = parseInt(aMatch[2]);
    const bNum = parseInt(bMatch[2]);

    // Compare prefixes first
    if (aPrefix !== bPrefix) {
      return aPrefix.localeCompare(bPrefix);
    }

    // Then compare numbers
    return aNum - bNum;
  }

  /**
   * Validate sheet organization
   */
  validateSheetOrganization(sheets: OrganizedSheet[]): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for required sheet types
    const requiredTypes = ['SITE_PLAN', 'FLOOR_PLAN'];
    const foundTypes = new Set(sheets.map(s => s.sheetType));

    for (const required of requiredTypes) {
      if (!foundTypes.has(required)) {
        warnings.push(`Missing required sheet type: ${required}`);
      }
    }

    // Check for duplicate sheet numbers
    const sheetNumbers = sheets.map(s => s.sheetNumber);
    const duplicates = sheetNumbers.filter((num, index) => sheetNumbers.indexOf(num) !== index);

    if (duplicates.length > 0) {
      errors.push(`Duplicate sheet numbers found: ${duplicates.join(', ')}`);
    }

    // Check for low confidence sheets
    const lowConfidence = sheets.filter(s => s.confidence < 0.5);
    if (lowConfidence.length > 0) {
      warnings.push(`${lowConfidence.length} sheet(s) have low confidence scores`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

// Singleton instance
export const sheetOrganizerService = new SheetOrganizerService();
