/**
 * Automatic Correction List Generator Service
 * Generates correction lists from review comments
 */

import {createClient} from '@permits/src/lib/supabase/client';
import {commentConsolidationService} from './comment-consolidation';

export interface PermitCorrection {
  id: string;
  permitId: string;
  description: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  discipline: string;
  codeReference?: string;
  pageNumber?: number;
  coordinateX?: number;
  coordinateY?: number;
  relatedCommentIds: string[];
  issuedAt: Date;
  dueDate?: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: string;
}

export interface CorrectionList {
  permitId: string;
  corrections: PermitCorrection[];
  summary: {
    total: number;
    byPriority: Record<string, number>;
    byCategory: Record<string, number>;
    byDiscipline: Record<string, number>;
  };
  generatedAt: Date;
}

export class CorrectionListGeneratorService {
  /**
   * Generate correction list from review comments
   */
  async generateCorrectionList(permitId: string): Promise<CorrectionList> {
    const supabase = createClient();

    // Get consolidated comments
    const comments = await commentConsolidationService.generateConsolidatedList(permitId);

    // Filter to corrections (MAJOR and CRITICAL severity)
    const correctionComments = comments.filter(
      c => c.severity === 'MAJOR' || c.severity === 'CRITICAL'
    );

    // Group by category
    const corrections: PermitCorrection[] = correctionComments.map(c => ({
      id: `correction-${c.id}`,
      permitId,
      description: c.comment,
      category: this.categorizeComment(c.comment),
      priority: c.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
      discipline: c.discipline,
      codeReference: c.codeReference,
      pageNumber: c.pageNumber,
      coordinateX: c.coordinateX,
      coordinateY: c.coordinateY,
      relatedCommentIds: [c.id],
      issuedAt: new Date(),
      resolved: false,
    }));

    // Generate summary
    const summary = {
      total: corrections.length,
      byPriority: this.countBy(corrections, 'priority'),
      byCategory: this.countBy(corrections, 'category'),
      byDiscipline: this.countBy(corrections, 'discipline'),
    };

    // Save corrections to database
    for (const correction of corrections) {
      await supabase.from('PermitCorrection').upsert({
        id: correction.id,
        permitId: correction.permitId,
        description: correction.description,
        category: correction.category,
        priority: correction.priority,
        issuedAt: correction.issuedAt.toISOString(),
        resolved: correction.resolved,
      });
    }

    return {
      permitId,
      corrections,
      summary,
      generatedAt: new Date(),
    };
  }

  /**
   * Categorize comment based on content
   */
  private categorizeComment(comment: string): string {
    const commentLower = comment.toLowerCase();

    // Life Safety
    if (
      commentLower.includes('egress') ||
      commentLower.includes('exit') ||
      commentLower.includes('fire') ||
      commentLower.includes('sprinkler') ||
      commentLower.includes('alarm')
    ) {
      return 'Life Safety';
    }

    // Structural
    if (
      commentLower.includes('structural') ||
      commentLower.includes('load') ||
      commentLower.includes('foundation') ||
      commentLower.includes('beam') ||
      commentLower.includes('column')
    ) {
      return 'Structural';
    }

    // Accessibility
    if (
      commentLower.includes('accessible') ||
      commentLower.includes('ada') ||
      commentLower.includes('ramp') ||
      commentLower.includes('handrail')
    ) {
      return 'Accessibility';
    }

    // Zoning
    if (
      commentLower.includes('setback') ||
      commentLower.includes('zoning') ||
      commentLower.includes('height') ||
      commentLower.includes('lot coverage')
    ) {
      return 'Zoning';
    }

    // Electrical
    if (
      commentLower.includes('electrical') ||
      commentLower.includes('service') ||
      commentLower.includes('circuit') ||
      commentLower.includes('nec')
    ) {
      return 'Electrical';
    }

    // Plumbing
    if (
      commentLower.includes('plumbing') ||
      commentLower.includes('fixture') ||
      commentLower.includes('pipe') ||
      commentLower.includes('ipc')
    ) {
      return 'Plumbing';
    }

    // Mechanical
    if (
      commentLower.includes('mechanical') ||
      commentLower.includes('hvac') ||
      commentLower.includes('duct')
    ) {
      return 'Mechanical';
    }

    // Drawing Quality
    if (
      commentLower.includes('dimension') ||
      commentLower.includes('scale') ||
      commentLower.includes('missing') ||
      commentLower.includes('unclear')
    ) {
      return 'Drawing Quality';
    }

    return 'General';
  }

  /**
   * Count items by property
   */
  private countBy<T>(items: T[], property: keyof T): Record<string, number> {
    const counts: Record<string, number> = {};
    items.forEach(item => {
      const value = String(item[property]);
      counts[value] = (counts[value] || 0) + 1;
    });
    return counts;
  }

  /**
   * Get correction list for permit
   */
  async getCorrectionList(permitId: string): Promise<CorrectionList> {
    const supabase = createClient();

    const {data: corrections} = await supabase
      .from('PermitCorrection')
      .select('*')
      .eq('permitId', permitId)
      .order('priority', {ascending: false})
      .order('issuedAt', {ascending: true});

    if (!corrections || corrections.length === 0) {
      return {
        permitId,
        corrections: [],
        summary: {
          total: 0,
          byPriority: {},
          byCategory: {},
          byDiscipline: {},
        },
        generatedAt: new Date(),
      };
    }

    const mappedCorrections: PermitCorrection[] = corrections.map(c => ({
      id: c.id,
      permitId: c.permitId,
      description: c.description,
      category: c.category,
      priority: c.priority,
      discipline: c.discipline || 'UNKNOWN',
      codeReference: c.codeReference,
      pageNumber: c.pageNumber,
      coordinateX: c.coordinateX,
      coordinateY: c.coordinateY,
      relatedCommentIds: c.relatedCommentIds || [],
      issuedAt: new Date(c.issuedAt),
      dueDate: c.dueDate ? new Date(c.dueDate) : undefined,
      resolved: c.resolved || false,
      resolvedAt: c.resolvedAt ? new Date(c.resolvedAt) : undefined,
      resolvedBy: c.resolvedBy,
      resolution: c.resolution,
    }));

    const summary = {
      total: mappedCorrections.length,
      byPriority: this.countBy(mappedCorrections, 'priority'),
      byCategory: this.countBy(mappedCorrections, 'category'),
      byDiscipline: this.countBy(mappedCorrections, 'discipline'),
    };

    return {
      permitId,
      corrections: mappedCorrections,
      summary,
      generatedAt: new Date(),
    };
  }

  /**
   * Mark correction as resolved
   */
  async resolveCorrection(
    correctionId: string,
    resolution: string,
    resolvedBy: string
  ): Promise<void> {
    const supabase = createClient();

    await supabase
      .from('PermitCorrection')
      .update({
        resolved: true,
        resolvedAt: new Date().toISOString(),
        resolvedBy,
        resolution,
      })
      .eq('id', correctionId);
  }
}

// Singleton instance
export const correctionListGeneratorService = new CorrectionListGeneratorService();
