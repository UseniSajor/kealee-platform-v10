/**
 * Code Linker Service
 * Link design elements to code sections
 */

import {createClient} from '@/lib/supabase/client';
import {documentIndexingService} from '@/services/document-management/document-indexer';

export interface CodeReference {
  codeType: 'IBC' | 'NEC' | 'IPC' | 'IMC' | 'IECC' | 'ADA' | 'ZONING' | 'LOCAL';
  section: string;
  title: string;
  description: string;
  url?: string;
}

export interface DesignElement {
  id: string;
  type: string;
  location: {
    pageNumber?: number;
    coordinateX?: number;
    coordinateY?: number;
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
  description: string;
  codeReferences: CodeReference[];
}

export interface CodeLink {
  elementId: string;
  codeReference: CodeReference;
  confidence: number; // 0-1
  method: 'automatic' | 'manual' | 'template';
  linkedBy?: string;
  linkedAt: Date;
}

export class CodeLinkerService {
  /**
   * Link design elements to code sections
   */
  async linkDesignElements(
    permitId: string,
    reviewId: string,
    discipline: string
  ): Promise<CodeLink[]> {
    const supabase = createClient();

    // Get permit documents
    const {data: documents} = await supabase
      .from('PermitDocument')
      .select('*')
      .eq('permitId', permitId);

    if (!documents) {
      return [];
    }

    // Get indexed document metadata
    const links: CodeLink[] = [];

    for (const doc of documents) {
      // Extract design elements from document
      const elements = await this.extractDesignElements(doc, discipline);

      // Link each element to code sections
      for (const element of elements) {
        const elementLinks = await this.linkElementToCode(element, discipline);
        links.push(...elementLinks);
      }
    }

    // Store links
    await this.storeCodeLinks(reviewId, links);

    return links;
  }

  /**
   * Extract design elements from document
   */
  private async extractDesignElements(
    document: any,
    discipline: string
  ): Promise<DesignElement[]> {
    const elements: DesignElement[] = [];

    // In production, this would parse the PDF/DWG to extract:
    // - Walls, doors, windows
    // - Electrical panels, circuits
    // - Plumbing fixtures, pipes
    // - Structural members
    // - etc.

    // For now, create placeholder elements based on document type
    if (document.type === 'FLOOR_PLAN') {
      elements.push({
        id: `element-${document.id}-1`,
        type: 'WALL',
        location: {pageNumber: 1},
        description: 'Exterior wall',
        codeReferences: [],
      });
      elements.push({
        id: `element-${document.id}-2`,
        type: 'DOOR',
        location: {pageNumber: 1},
        description: 'Exit door',
        codeReferences: [],
      });
    }

    if (document.type === 'ELECTRICAL_DIAGRAM' && discipline === 'ELECTRICAL') {
      elements.push({
        id: `element-${document.id}-3`,
        type: 'ELECTRICAL_PANEL',
        location: {pageNumber: 1},
        description: 'Main electrical panel',
        codeReferences: [],
      });
    }

    return elements;
  }

  /**
   * Link element to code sections
   */
  private async linkElementToCode(
    element: DesignElement,
    discipline: string
  ): Promise<CodeLink[]> {
    const links: CodeLink[] = [];

    // Get applicable code references for element type
    const codeRefs = this.getCodeReferencesForElement(element.type, discipline);

    for (const codeRef of codeRefs) {
      links.push({
        elementId: element.id,
        codeReference: codeRef,
        confidence: this.calculateConfidence(element, codeRef),
        method: 'automatic',
        linkedAt: new Date(),
      });
    }

    return links;
  }

  /**
   * Get code references for element type
   */
  private getCodeReferencesForElement(
    elementType: string,
    discipline: string
  ): CodeReference[] {
    const references: CodeReference[] = [];

    // Building elements
    if (elementType === 'WALL' && discipline === 'BUILDING') {
      references.push({
        codeType: 'IBC',
        section: 'Section 703',
        title: 'Fire-Resistance Ratings',
        description: 'Fire-rated wall assemblies',
      });
      references.push({
        codeType: 'IBC',
        section: 'Section 1405',
        title: 'Exterior Wall Coverings',
        description: 'Exterior wall covering requirements',
      });
    }

    if (elementType === 'DOOR' && discipline === 'BUILDING') {
      references.push({
        codeType: 'IBC',
        section: 'Section 1008',
        title: 'Doors, Gates and Turnstiles',
        description: 'Door requirements for egress',
      });
      references.push({
        codeType: 'ADA',
        section: 'Section 404',
        title: 'Doors, Doorways, and Gates',
        description: 'Accessible door requirements',
      });
    }

    // Electrical elements
    if (elementType === 'ELECTRICAL_PANEL' && discipline === 'ELECTRICAL') {
      references.push({
        codeType: 'NEC',
        section: 'Article 408',
        title: 'Switchboards, Switchgear, and Panelboards',
        description: 'Panelboard requirements',
      });
      references.push({
        codeType: 'NEC',
        section: 'Article 220',
        title: 'Branch-Circuit, Feeder, and Service Calculations',
        description: 'Load calculations',
      });
    }

    // Plumbing elements
    if (elementType === 'FIXTURE' && discipline === 'PLUMBING') {
      references.push({
        codeType: 'IPC',
        section: 'Section 403',
        title: 'Minimum Plumbing Facilities',
        description: 'Fixture requirements',
      });
    }

    return references;
  }

  /**
   * Calculate confidence for code link
   */
  private calculateConfidence(
    element: DesignElement,
    codeRef: CodeReference
  ): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence if element description matches code title
    const elementLower = element.description.toLowerCase();
    const codeTitleLower = codeRef.title.toLowerCase();

    if (elementLower.includes(codeTitleLower.split(' ')[0])) {
      confidence += 0.3;
    }

    // Increase confidence if element type matches
    if (this.elementTypeMatchesCode(element.type, codeRef)) {
      confidence += 0.2;
    }

    return Math.min(1.0, confidence);
  }

  /**
   * Check if element type matches code
   */
  private elementTypeMatchesCode(elementType: string, codeRef: CodeReference): boolean {
    const typeLower = elementType.toLowerCase();
    const titleLower = codeRef.title.toLowerCase();

    // Simple matching logic
    if (typeLower.includes('wall') && titleLower.includes('wall')) {
      return true;
    }
    if (typeLower.includes('door') && titleLower.includes('door')) {
      return true;
    }
    if (typeLower.includes('electrical') && codeRef.codeType === 'NEC') {
      return true;
    }
    if (typeLower.includes('plumbing') && codeRef.codeType === 'IPC') {
      return true;
    }

    return false;
  }

  /**
   * Store code links
   */
  private async storeCodeLinks(reviewId: string, links: CodeLink[]): Promise<void> {
    const supabase = createClient();

    for (const link of links) {
      await supabase.from('CodeLink').insert({
        id: `link-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        reviewId,
        elementId: link.elementId,
        codeType: link.codeReference.codeType,
        codeSection: link.codeReference.section,
        codeTitle: link.codeReference.title,
        confidence: link.confidence,
        method: link.method,
        linkedBy: link.linkedBy,
        linkedAt: link.linkedAt.toISOString(),
      });
    }
  }

  /**
   * Get code links for review
   */
  async getCodeLinks(reviewId: string): Promise<CodeLink[]> {
    const supabase = createClient();

    const {data: links} = await supabase
      .from('CodeLink')
      .select('*')
      .eq('reviewId', reviewId);

    if (!links) {
      return [];
    }

    return links.map(this.mapCodeLink);
  }

  /**
   * Map code link from database
   */
  private mapCodeLink(record: any): CodeLink {
    return {
      elementId: record.elementId,
      codeReference: {
        codeType: record.codeType,
        section: record.codeSection,
        title: record.codeTitle,
        description: record.codeDescription || '',
        url: record.codeUrl,
      },
      confidence: record.confidence,
      method: record.method,
      linkedBy: record.linkedBy,
      linkedAt: new Date(record.linkedAt),
    };
  }

  /**
   * Add manual code link
   */
  async addManualLink(
    reviewId: string,
    elementId: string,
    codeReference: CodeReference,
    userId: string
  ): Promise<CodeLink> {
    const link: CodeLink = {
      elementId,
      codeReference,
      confidence: 1.0, // Manual links have full confidence
      method: 'manual',
      linkedBy: userId,
      linkedAt: new Date(),
    };

    await this.storeCodeLinks(reviewId, [link]);

    return link;
  }
}

// Singleton instance
export const codeLinkerService = new CodeLinkerService();
