/**
 * PDF Markup Service
 * PDF markup tools with coordinate tracking
 */

import {createClient} from '@permits/src/lib/supabase/client';

export interface MarkupTool {
  id: string;
  type: 'arrow' | 'rectangle' | 'circle' | 'line' | 'text' | 'highlight' | 'stamp';
  color: string;
  strokeWidth: number;
  opacity: number;
}

export interface MarkupAnnotation {
  id: string;
  reviewId: string;
  documentId: string;
  pageNumber: number;
  tool: MarkupTool;
  coordinates: {
    x: number;
    y: number;
    width?: number;
    height?: number;
    points?: Array<{x: number; y: number}>;
  };
  comment?: string;
  codeReference?: string;
  severity?: 'MINOR' | 'MAJOR' | 'CRITICAL';
  createdBy: string;
  createdAt: Date;
}

export interface MarkupLayer {
  id: string;
  name: string;
  visible: boolean;
  annotations: MarkupAnnotation[];
}

export class PDFMarkupService {
  /**
   * Create markup annotation
   */
  async createAnnotation(
    reviewId: string,
    documentId: string,
    annotation: Omit<MarkupAnnotation, 'id' | 'createdAt'>
  ): Promise<MarkupAnnotation> {
    const supabase = createClient();

    const annotationWithId: MarkupAnnotation = {
      ...annotation,
      id: `markup-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      createdAt: new Date(),
    };

    // Store annotation
    await supabase.from('ReviewMarkup').insert({
      id: annotationWithId.id,
      reviewId: annotationWithId.reviewId,
      documentId: annotationWithId.documentId,
      pageNumber: annotationWithId.pageNumber,
      toolType: annotationWithId.tool.type,
      toolColor: annotationWithId.tool.color,
      toolStrokeWidth: annotationWithId.tool.strokeWidth,
      toolOpacity: annotationWithId.tool.opacity,
      coordinates: annotationWithId.coordinates,
      comment: annotationWithId.comment,
      codeReference: annotationWithId.codeReference,
      severity: annotationWithId.severity,
      createdBy: annotationWithId.createdBy,
      createdAt: annotationWithId.createdAt.toISOString(),
    });

    return annotationWithId;
  }

  /**
   * Get annotations for document
   */
  async getAnnotations(
    reviewId: string,
    documentId: string
  ): Promise<MarkupAnnotation[]> {
    const supabase = createClient();

    const {data: markups} = await supabase
      .from('ReviewMarkup')
      .select('*')
      .eq('reviewId', reviewId)
      .eq('documentId', documentId)
      .order('pageNumber', {ascending: true})
      .order('createdAt', {ascending: true});

    if (!markups) {
      return [];
    }

    return markups.map(this.mapAnnotation);
  }

  /**
   * Get annotations by page
   */
  async getAnnotationsByPage(
    reviewId: string,
    documentId: string,
    pageNumber: number
  ): Promise<MarkupAnnotation[]> {
    const annotations = await this.getAnnotations(reviewId, documentId);
    return annotations.filter(a => a.pageNumber === pageNumber);
  }

  /**
   * Update annotation
   */
  async updateAnnotation(
    annotationId: string,
    updates: Partial<MarkupAnnotation>
  ): Promise<void> {
    const supabase = createClient();

    const updateData: any = {};
    if (updates.comment !== undefined) updateData.comment = updates.comment;
    if (updates.severity !== undefined) updateData.severity = updates.severity;
    if (updates.codeReference !== undefined) updateData.codeReference = updates.codeReference;
    if (updates.coordinates) updateData.coordinates = updates.coordinates;

    await supabase
      .from('ReviewMarkup')
      .update(updateData)
      .eq('id', annotationId);
  }

  /**
   * Delete annotation
   */
  async deleteAnnotation(annotationId: string): Promise<void> {
    const supabase = createClient();

    await supabase.from('ReviewMarkup').delete().eq('id', annotationId);
  }

  /**
   * Map database record to annotation
   */
  private mapAnnotation(record: any): MarkupAnnotation {
    return {
      id: record.id,
      reviewId: record.reviewId,
      documentId: record.documentId,
      pageNumber: record.pageNumber,
      tool: {
        id: record.toolType,
        type: record.toolType,
        color: record.toolColor,
        strokeWidth: record.toolStrokeWidth,
        opacity: record.toolOpacity,
      },
      coordinates: record.coordinates,
      comment: record.comment,
      codeReference: record.codeReference,
      severity: record.severity,
      createdBy: record.createdBy,
      createdAt: new Date(record.createdAt),
    };
  }

  /**
   * Export annotations as PDF overlay
   */
  async exportAnnotationsAsOverlay(
    reviewId: string,
    documentId: string
  ): Promise<string> {
    // In production, would generate PDF overlay with annotations
    // For now, return JSON representation
    const annotations = await this.getAnnotations(reviewId, documentId);
    return JSON.stringify(annotations, null, 2);
  }
}

// Singleton instance
export const pdfMarkupService = new PDFMarkupService();
