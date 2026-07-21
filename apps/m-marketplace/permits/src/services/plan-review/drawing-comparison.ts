/**
 * Drawing Comparison Service
 * Comparison tools between drawing sets
 */

import {createClient} from '@permits/src/lib/supabase/client';
import {documentVersioningService} from '@permits/src/services/document-management/document-versioning';

export interface DrawingComparison {
  documentId1: string;
  documentId2: string;
  version1: number;
  version2: number;
  differences: DrawingDifference[];
  similarity: number; // 0-1
  comparedAt: Date;
}

export interface DrawingDifference {
  id: string;
  type: 'added' | 'removed' | 'modified' | 'moved';
  pageNumber: number;
  location: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  description: string;
  severity: 'MINOR' | 'MAJOR' | 'CRITICAL';
}

export class DrawingComparisonService {
  /**
   * Compare two drawing versions
   */
  async compareDrawings(
    documentId: string,
    version1: number,
    version2: number
  ): Promise<DrawingComparison> {
    const v1 = await documentVersioningService.getVersion(documentId, version1);
    const v2 = await documentVersioningService.getVersion(documentId, version2);

    if (!v1 || !v2) {
      throw new Error('One or both versions not found');
    }

    // Compare document versions
    const versionComparison = await documentVersioningService.compareVersions(
      documentId,
      version1,
      version2
    );

    // Extract differences from text comparison
    const differences = this.extractDifferences(versionComparison);

    // Calculate similarity
    const similarity = versionComparison.similarity;

    return {
      documentId1: documentId,
      documentId2: documentId,
      version1,
      version2,
      differences,
      similarity,
      comparedAt: new Date(),
    };
  }

  /**
   * Compare two different documents
   */
  async compareDocuments(
    documentId1: string,
    documentId2: string
  ): Promise<DrawingComparison> {
    const supabase = createClient();

    // Get documents
    const {data: doc1} = await supabase
      .from('PermitDocument')
      .select('*')
      .eq('id', documentId1)
      .single();

    const {data: doc2} = await supabase
      .from('PermitDocument')
      .select('*')
      .eq('id', documentId2)
      .single();

    if (!doc1 || !doc2) {
      throw new Error('One or both documents not found');
    }

    // In production, would use PDF comparison library or image diff
    // For now, return basic comparison
    const differences: DrawingDifference[] = [];
    const similarity = 0.8; // Placeholder

    return {
      documentId1,
      documentId2,
      version1: 1,
      version2: 1,
      differences,
      similarity,
      comparedAt: new Date(),
    };
  }

  /**
   * Extract differences from version comparison
   */
  private extractDifferences(comparison: any): DrawingDifference[] {
    const differences: DrawingDifference[] = [];

    // Added elements
    comparison.added.forEach((item: string, index: number) => {
      differences.push({
        id: `diff-added-${index}`,
        type: 'added',
        pageNumber: 1, // Would extract from actual comparison
        location: {x: 0, y: 0},
        description: `Added: ${item.substring(0, 50)}`,
        severity: 'MINOR',
      });
    });

    // Removed elements
    comparison.removed.forEach((item: string, index: number) => {
      differences.push({
        id: `diff-removed-${index}`,
        type: 'removed',
        pageNumber: 1,
        location: {x: 0, y: 0},
        description: `Removed: ${item.substring(0, 50)}`,
        severity: 'MAJOR',
      });
    });

    // Modified elements
    comparison.modified.forEach((item: string, index: number) => {
      differences.push({
        id: `diff-modified-${index}`,
        type: 'modified',
        pageNumber: 1,
        location: {x: 0, y: 0},
        description: `Modified: ${item.substring(0, 50)}`,
        severity: 'MAJOR',
      });
    });

    return differences;
  }

  /**
   * Get comparison summary
   */
  getComparisonSummary(comparison: DrawingComparison): {
    totalDifferences: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    pagesAffected: number[];
  } {
    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    const pagesAffected = new Set<number>();

    comparison.differences.forEach(diff => {
      byType[diff.type] = (byType[diff.type] || 0) + 1;
      bySeverity[diff.severity] = (bySeverity[diff.severity] || 0) + 1;
      pagesAffected.add(diff.pageNumber);
    });

    return {
      totalDifferences: comparison.differences.length,
      byType,
      bySeverity,
      pagesAffected: Array.from(pagesAffected).sort(),
    };
  }
}

// Singleton instance
export const drawingComparisonService = new DrawingComparisonService();
