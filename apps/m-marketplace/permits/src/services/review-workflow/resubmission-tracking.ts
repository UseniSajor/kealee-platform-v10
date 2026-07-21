/**
 * Resubmission Tracking Service
 * Tracks resubmissions with version comparison
 */

import {createClient} from '@permits/src/lib/supabase/client';
import {documentVersioningService} from '@permits/src/services/document-management/document-versioning';
import {drawingComparisonService} from '@permits/src/services/plan-review/drawing-comparison';

export interface Resubmission {
  id: string;
  permitId: string;
  originalSubmissionId: string;
  resubmissionNumber: number;
  submittedAt: Date;
  submittedBy: string;
  reason: string; // 'CORRECTIONS' | 'REVISIONS' | 'ADDITIONAL_INFO'
  status: 'PENDING_REVIEW' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';
  documents: ResubmissionDocument[];
  correctionsAddressed: string[]; // Correction IDs
  reviewStartedAt?: Date;
  reviewCompletedAt?: Date;
}

export interface ResubmissionDocument {
  documentId: string;
  originalVersion: number;
  newVersion: number;
  changes: string[];
  comparison?: any;
}

export interface ResubmissionComparison {
  resubmissionId: string;
  documentComparisons: Array<{
    documentId: string;
    originalVersion: number;
    newVersion: number;
    differences: number;
    similarity: number;
    changes: string[];
  }>;
  correctionsAddressed: number;
  correctionsRemaining: number;
  overallStatus: 'IMPROVED' | 'NO_CHANGE' | 'DEGRADED';
}

export class ResubmissionTrackingService {
  /**
   * Create resubmission
   */
  async createResubmission(
    permitId: string,
    originalSubmissionId: string,
    reason: string,
    submittedBy: string,
    documentIds: string[],
    correctionsAddressed: string[]
  ): Promise<Resubmission> {
    const supabase = createClient();

    // Get resubmission number
    const {data: existing} = await supabase
      .from('Resubmission')
      .select('resubmissionNumber')
      .eq('permitId', permitId)
      .order('resubmissionNumber', {ascending: false})
      .limit(1);

    const resubmissionNumber = existing && existing.length > 0
      ? existing[0].resubmissionNumber + 1
      : 1;

    // Get document versions
    const documents: ResubmissionDocument[] = [];
    for (const docId of documentIds) {
      const versions = await documentVersioningService.getDocumentVersions(docId);
      if (versions.length > 0) {
        const latest = versions[versions.length - 1];
        documents.push({
          documentId: docId,
          originalVersion: 1, // Would track original submission version
          newVersion: latest.version,
          changes: [],
        });
      }
    }

    const resubmission: Resubmission = {
      id: `resub-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      permitId,
      originalSubmissionId,
      resubmissionNumber,
      submittedAt: new Date(),
      submittedBy,
      reason,
      status: 'PENDING_REVIEW',
      documents,
      correctionsAddressed,
    };

    // Save to database
    await supabase.from('Resubmission').insert({
      id: resubmission.id,
      permitId: resubmission.permitId,
      originalSubmissionId: resubmission.originalSubmissionId,
      resubmissionNumber: resubmission.resubmissionNumber,
      submittedAt: resubmission.submittedAt.toISOString(),
      submittedBy: resubmission.submittedBy,
      reason: resubmission.reason,
      status: resubmission.status,
      documents: resubmission.documents,
      correctionsAddressed: resubmission.correctionsAddressed,
    });

    return resubmission;
  }

  /**
   * Get resubmissions for permit
   */
  async getResubmissions(permitId: string): Promise<Resubmission[]> {
    const supabase = createClient();

    const {data: resubmissions} = await supabase
      .from('Resubmission')
      .select('*')
      .eq('permitId', permitId)
      .order('resubmissionNumber', {ascending: true});

    if (!resubmissions) {
      return [];
    }

    return resubmissions.map(r => ({
      id: r.id,
      permitId: r.permitId,
      originalSubmissionId: r.originalSubmissionId,
      resubmissionNumber: r.resubmissionNumber,
      submittedAt: new Date(r.submittedAt),
      submittedBy: r.submittedBy,
      reason: r.reason,
      status: r.status,
      documents: r.documents || [],
      correctionsAddressed: r.correctionsAddressed || [],
      reviewStartedAt: r.reviewStartedAt ? new Date(r.reviewStartedAt) : undefined,
      reviewCompletedAt: r.reviewCompletedAt ? new Date(r.reviewCompletedAt) : undefined,
    }));
  }

  /**
   * Compare resubmission with original
   */
  async compareResubmission(resubmissionId: string): Promise<ResubmissionComparison> {
    const supabase = createClient();

    const {data: resubmission} = await supabase
      .from('Resubmission')
      .select('*')
      .eq('id', resubmissionId)
      .single();

    if (!resubmission) {
      throw new Error('Resubmission not found');
    }

    // Compare each document
    const documentComparisons = [];
    for (const doc of resubmission.documents || []) {
      try {
        const comparison = await drawingComparisonService.compareDrawings(
          doc.documentId,
          doc.originalVersion,
          doc.newVersion
        );

        documentComparisons.push({
          documentId: doc.documentId,
          originalVersion: doc.originalVersion,
          newVersion: doc.newVersion,
          differences: comparison.differences.length,
          similarity: comparison.similarity,
          changes: comparison.differences.map(d => d.description),
        });
      } catch (error) {
        // Document comparison failed
        documentComparisons.push({
          documentId: doc.documentId,
          originalVersion: doc.originalVersion,
          newVersion: doc.newVersion,
          differences: 0,
          similarity: 0,
          changes: [],
        });
      }
    }

    // Get corrections
    const {data: allCorrections} = await supabase
      .from('PermitCorrection')
      .select('id, resolved')
      .eq('permitId', resubmission.permitId);

    const totalCorrections = allCorrections?.length || 0;
    const correctionsAddressed = resubmission.correctionsAddressed?.length || 0;
    const correctionsRemaining = totalCorrections - correctionsAddressed;

    // Determine overall status
    let overallStatus: 'IMPROVED' | 'NO_CHANGE' | 'DEGRADED' = 'NO_CHANGE';
    if (correctionsAddressed > 0 && documentComparisons.some(c => c.differences > 0)) {
      overallStatus = 'IMPROVED';
    } else if (documentComparisons.some(c => c.similarity < 0.5)) {
      overallStatus = 'DEGRADED';
    }

    return {
      resubmissionId,
      documentComparisons,
      correctionsAddressed,
      correctionsRemaining,
      overallStatus,
    };
  }

  /**
   * Start review of resubmission
   */
  async startResubmissionReview(resubmissionId: string): Promise<void> {
    const supabase = createClient();

    await supabase
      .from('Resubmission')
      .update({
        status: 'IN_REVIEW',
        reviewStartedAt: new Date().toISOString(),
      })
      .eq('id', resubmissionId);
  }

  /**
   * Complete resubmission review
   */
  async completeResubmissionReview(
    resubmissionId: string,
    approved: boolean
  ): Promise<void> {
    const supabase = createClient();

    await supabase
      .from('Resubmission')
      .update({
        status: approved ? 'APPROVED' : 'REJECTED',
        reviewCompletedAt: new Date().toISOString(),
      })
      .eq('id', resubmissionId);
  }

  /**
   * Get resubmission history for permit
   */
  async getResubmissionHistory(permitId: string): Promise<{
    totalResubmissions: number;
    latestResubmission?: Resubmission;
    resubmissions: Resubmission[];
  }> {
    const resubmissions = await this.getResubmissions(permitId);

    return {
      totalResubmissions: resubmissions.length,
      latestResubmission: resubmissions[resubmissions.length - 1],
      resubmissions,
    };
  }
}

// Singleton instance
export const resubmissionTrackingService = new ResubmissionTrackingService();
