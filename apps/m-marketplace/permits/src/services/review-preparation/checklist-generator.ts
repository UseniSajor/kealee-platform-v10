/**
 * Checklist Generator Service
 * Pre-populate review checklists from design metadata
 */

import {createClient} from '@permits/src/lib/supabase/client';
import {documentIndexingService} from '@permits/src/services/document-management/document-indexer';

export interface ChecklistItem {
  id: string;
  category: string;
  item: string;
  description?: string;
  required: boolean;
  checked: boolean;
  notes?: string;
  codeReference?: string;
  documentReference?: string;
  pageNumber?: number;
}

export interface ReviewChecklist {
  permitId: string;
  reviewId: string;
  discipline: string;
  permitType: string;
  items: ChecklistItem[];
  completed: number;
  total: number;
  generatedAt: Date;
}

export class ChecklistGeneratorService {
  /**
   * Generate review checklist from design metadata
   */
  async generateChecklist(
    permitId: string,
    reviewId: string,
    discipline: string,
    permitType: string
  ): Promise<ReviewChecklist> {
    const supabase = createClient();

    // Get permit data
    const {data: permit} = await supabase
      .from('Permit')
      .select('*, documents:PermitDocument(*)')
      .eq('id', permitId)
      .single();

    if (!permit) {
      throw new Error('Permit not found');
    }

    // Get base checklist template
    const baseChecklist = this.getBaseChecklist(permitType, discipline);

    // Get design metadata if available
    const designMetadata = await this.getDesignMetadata(permitId);

    // Pre-populate checklist from metadata
    const items = await this.populateChecklistItems(
      baseChecklist,
      designMetadata,
      permit.documents || []
    );

    const completed = items.filter(i => i.checked).length;

    return {
      permitId,
      reviewId,
      discipline,
      permitType,
      items,
      completed,
      total: items.length,
      generatedAt: new Date(),
    };
  }

  /**
   * Get base checklist template
   */
  private getBaseChecklist(permitType: string, discipline: string): Array<{
    category: string;
    item: string;
    description?: string;
    required: boolean;
    codeReference?: string;
  }> {
    const checklists: Record<string, Record<string, Array<{
      category: string;
      item: string;
      description?: string;
      required: boolean;
      codeReference?: string;
    }>>> = {
      BUILDING: {
        ZONING: [
          {
            category: 'Setbacks',
            item: 'Front setback compliance',
            description: 'Verify minimum front setback requirements',
            required: true,
            codeReference: 'Zoning Code Section 3.1',
          },
          {
            category: 'Setbacks',
            item: 'Side setback compliance',
            description: 'Verify minimum side setback requirements',
            required: true,
            codeReference: 'Zoning Code Section 3.2',
          },
          {
            category: 'Setbacks',
            item: 'Rear setback compliance',
            description: 'Verify minimum rear setback requirements',
            required: true,
            codeReference: 'Zoning Code Section 3.3',
          },
          {
            category: 'Use',
            item: 'Permitted use verification',
            description: 'Verify proposed use is permitted in zoning district',
            required: true,
            codeReference: 'Zoning Code Section 2.1',
          },
          {
            category: 'Height',
            item: 'Maximum height compliance',
            description: 'Verify building height does not exceed maximum',
            required: true,
            codeReference: 'Zoning Code Section 4.1',
          },
        ],
        BUILDING: [
          {
            category: 'Life Safety',
            item: 'Egress requirements',
            description: 'Verify adequate means of egress',
            required: true,
            codeReference: 'IBC Section 1006',
          },
          {
            category: 'Life Safety',
            item: 'Fire separation',
            description: 'Verify fire-rated assemblies',
            required: true,
            codeReference: 'IBC Section 703',
          },
          {
            category: 'Structural',
            item: 'Structural calculations',
            description: 'Review structural calculations',
            required: true,
            codeReference: 'IBC Section 1603',
          },
          {
            category: 'Accessibility',
            item: 'ADA compliance',
            description: 'Verify accessibility requirements',
            required: true,
            codeReference: 'ADA Standards Section 206',
          },
          {
            category: 'Energy',
            item: 'Energy code compliance',
            description: 'Verify energy efficiency requirements',
            required: false,
            codeReference: 'IECC Section C401',
          },
        ],
        STRUCTURAL: [
          {
            category: 'Loads',
            item: 'Dead and live loads',
            description: 'Verify load calculations',
            required: true,
            codeReference: 'IBC Section 1607',
          },
          {
            category: 'Materials',
            item: 'Material specifications',
            description: 'Verify material specifications',
            required: true,
            codeReference: 'IBC Section 2303',
          },
          {
            category: 'Connections',
            item: 'Connection details',
            description: 'Review connection details',
            required: true,
            codeReference: 'IBC Section 2304',
          },
        ],
      },
      ELECTRICAL: {
        ELECTRICAL: [
          {
            category: 'Service',
            item: 'Service size adequacy',
            description: 'Verify electrical service size',
            required: true,
            codeReference: 'NEC Article 220',
          },
          {
            category: 'Wiring',
            item: 'Wiring methods',
            description: 'Verify wiring methods comply with code',
            required: true,
            codeReference: 'NEC Article 300',
          },
          {
            category: 'Grounding',
            item: 'Grounding and bonding',
            description: 'Verify grounding system',
            required: true,
            codeReference: 'NEC Article 250',
          },
        ],
      },
      PLUMBING: {
        PLUMBING: [
          {
            category: 'Fixtures',
            item: 'Fixture count and location',
            description: 'Verify fixture requirements',
            required: true,
            codeReference: 'IPC Section 403',
          },
          {
            category: 'Drainage',
            item: 'Drainage system',
            description: 'Verify drainage system design',
            required: true,
            codeReference: 'IPC Section 701',
          },
          {
            category: 'Water Supply',
            item: 'Water supply system',
            description: 'Verify water supply design',
            required: true,
            codeReference: 'IPC Section 604',
          },
        ],
      },
    };

    return checklists[permitType]?.[discipline] || [];
  }

  /**
   * Get design metadata
   */
  private async getDesignMetadata(permitId: string): Promise<any> {
    const supabase = createClient();

    // Get permit events to find design project link
    const {data: events} = await supabase
      .from('PermitEvent')
      .select('metadata')
      .eq('permitId', permitId)
      .eq('type', 'DESIGN_PROJECT_LINKED')
      .limit(1)
      .single();

    if (!events) {
      return null;
    }

    const metadata = (events as any).metadata;
    const designProjectId = metadata?.designProjectId;

    if (!designProjectId) {
      return null;
    }

    // Get indexed documents for this permit
    const {data: documents} = await supabase
      .from('PermitDocument')
      .select('*')
      .eq('permitId', permitId);

    // Extract metadata from documents
    const extractedData: any = {};
    if (documents) {
      for (const doc of documents) {
        // In production, would query indexed document metadata
        // For now, return basic structure
      }
    }

    return {
      designProjectId,
      extractedData,
    };
  }

  /**
   * Populate checklist items from metadata
   */
  private async populateChecklistItems(
    baseChecklist: Array<{
      category: string;
      item: string;
      description?: string;
      required: boolean;
      codeReference?: string;
    }>,
    designMetadata: any,
    documents: any[]
  ): Promise<ChecklistItem[]> {
    const items: ChecklistItem[] = [];

    for (const baseItem of baseChecklist) {
      const item: ChecklistItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        category: baseItem.category,
        item: baseItem.item,
        description: baseItem.description,
        required: baseItem.required,
        checked: false,
        codeReference: baseItem.codeReference,
      };

      // Pre-populate based on metadata
      if (designMetadata?.extractedData) {
        // Check if item can be auto-checked from metadata
        item.checked = this.canAutoCheckItem(baseItem, designMetadata.extractedData, documents);
        
        // Add document reference if available
        const docRef = this.findDocumentReference(baseItem, documents);
        if (docRef) {
          item.documentReference = docRef.id;
          item.pageNumber = docRef.pageNumber;
        }
      }

      items.push(item);
    }

    return items;
  }

  /**
   * Check if item can be auto-checked
   */
  private canAutoCheckItem(
    item: any,
    extractedData: any,
    documents: any[]
  ): boolean {
    // Simple logic - in production, would use more sophisticated matching
    const itemLower = item.item.toLowerCase();

    // Check for required documents
    if (itemLower.includes('calculations') && documents.some(d => d.type === 'STRUCTURAL_CALCS')) {
      return true;
    }

    if (itemLower.includes('site plan') && documents.some(d => d.type === 'SITE_PLAN')) {
      return true;
    }

    if (itemLower.includes('floor plan') && documents.some(d => d.type === 'FLOOR_PLAN')) {
      return true;
    }

    return false;
  }

  /**
   * Find document reference for checklist item
   */
  private findDocumentReference(
    item: any,
    documents: any[]
  ): {id: string; pageNumber?: number} | null {
    const itemLower = item.item.toLowerCase();

    // Match document type to item
    if (itemLower.includes('site plan')) {
      const doc = documents.find(d => d.type === 'SITE_PLAN');
      return doc ? {id: doc.id} : null;
    }

    if (itemLower.includes('floor plan')) {
      const doc = documents.find(d => d.type === 'FLOOR_PLAN');
      return doc ? {id: doc.id} : null;
    }

    if (itemLower.includes('calculations')) {
      const doc = documents.find(d => d.type === 'STRUCTURAL_CALCS');
      return doc ? {id: doc.id} : null;
    }

    return null;
  }

  /**
   * Save checklist
   */
  async saveChecklist(checklist: ReviewChecklist): Promise<void> {
    const supabase = createClient();

    // Store checklist items
    for (const item of checklist.items) {
      await supabase.from('ReviewChecklistItem').insert({
        id: item.id,
        reviewId: checklist.reviewId,
        category: item.category,
        item: item.item,
        description: item.description,
        required: item.required,
        checked: item.checked,
        notes: item.notes,
        codeReference: item.codeReference,
        documentReference: item.documentReference,
        pageNumber: item.pageNumber,
      });
    }
  }

  /**
   * Get checklist for review
   */
  async getChecklist(reviewId: string): Promise<ReviewChecklist | null> {
    const supabase = createClient();

    const {data: review} = await supabase
      .from('PermitReview')
      .select('permitId, discipline, permit:permitId(type)')
      .eq('id', reviewId)
      .single();

    if (!review) {
      return null;
    }

    const {data: items} = await supabase
      .from('ReviewChecklistItem')
      .select('*')
      .eq('reviewId', reviewId)
      .order('category', {ascending: true});

    if (!items) {
      return null;
    }

    return {
      permitId: review.permitId,
      reviewId,
      discipline: review.discipline,
      permitType: (review.permit as any)?.type || '',
      items: items.map(this.mapChecklistItem),
      completed: items.filter(i => i.checked).length,
      total: items.length,
      generatedAt: new Date(),
    };
  }

  /**
   * Map checklist item from database
   */
  private mapChecklistItem(record: any): ChecklistItem {
    return {
      id: record.id,
      category: record.category,
      item: record.item,
      description: record.description,
      required: record.required,
      checked: record.checked,
      notes: record.notes,
      codeReference: record.codeReference,
      documentReference: record.documentReference,
      pageNumber: record.pageNumber,
    };
  }
}

// Singleton instance
export const checklistGeneratorService = new ChecklistGeneratorService();
