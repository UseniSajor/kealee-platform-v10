/**
 * Inspection Results Manager Service
 * Pass/Fail/Partial results with detailed comments
 */

import {createClient} from '@permits/src/lib/supabase/client';

export interface InspectionResultData {
  inspectionId: string;
  result: 'PASS' | 'PASS_WITH_COMMENTS' | 'FAIL' | 'PARTIAL_PASS';
  notes?: string;
  checklistItems?: Array<{
    id: string;
    status: 'PASS' | 'FAIL' | 'NOT_APPLICABLE' | 'NOT_READY';
    notes?: string;
  }>;
  photos?: Array<{
    fileUrl: string;
    caption?: string;
    location?: string;
  }>;
  corrections?: Array<{
    description: string;
    location?: string;
    category: string;
    severity: 'MINOR' | 'MAJOR' | 'CRITICAL';
    mustFixBefore?: string; // Next inspection type
  }>;
  completedBy: string;
  completedAt: Date;
}

export interface InspectionResult {
  inspectionId: string;
  inspectionNumber: string;
  permitId: string;
  type: string;
  result: 'PASS' | 'PASS_WITH_COMMENTS' | 'FAIL' | 'PARTIAL_PASS';
  notes?: string;
  checklistItems: Array<{
    id: string;
    category: string;
    item: string;
    status: 'PASS' | 'FAIL' | 'NOT_APPLICABLE' | 'NOT_READY';
    notes?: string;
  }>;
  photos: Array<{
    id: string;
    fileUrl: string;
    caption?: string;
    location?: string;
    uploadedAt: Date;
  }>;
  corrections: Array<{
    id: string;
    description: string;
    location?: string;
    category: string;
    severity: 'MINOR' | 'MAJOR' | 'CRITICAL';
    mustFixBefore?: string;
    resolved: boolean;
    resolvedAt?: Date;
  }>;
  completedBy: string;
  completedAt: Date;
}

export class ResultsManagerService {
  /**
   * Record inspection results
   */
  async recordInspectionResult(
    resultData: InspectionResultData
  ): Promise<InspectionResult> {
    const supabase = createClient();

    // Update inspection
    await supabase
      .from('Inspection')
      .update({
        status: 'COMPLETED',
        result: resultData.result,
        notes: resultData.notes,
        completedAt: resultData.completedAt.toISOString(),
      })
      .eq('id', resultData.inspectionId);

    // Update checklist items
    if (resultData.checklistItems) {
      for (const item of resultData.checklistItems) {
        await supabase
          .from('InspectionChecklistItem')
          .update({
            status: item.status,
            notes: item.notes,
          })
          .eq('id', item.id);
      }
    }

    // Add photos
    if (resultData.photos) {
      for (const photo of resultData.photos) {
        await supabase.from('InspectionPhoto').insert({
          inspectionId: resultData.inspectionId,
          fileUrl: photo.fileUrl,
          caption: photo.caption,
          location: photo.location,
        });
      }
    }

    // Create corrections
    if (resultData.corrections) {
      for (const correction of resultData.corrections) {
        await supabase.from('InspectionCorrection').insert({
          inspectionId: resultData.inspectionId,
          description: correction.description,
          location: correction.location,
          category: correction.category,
          severity: correction.severity,
          mustFixBefore: correction.mustFixBefore,
          resolved: false,
        });
      }
    }

    // Get complete result
    return this.getInspectionResult(resultData.inspectionId);
  }

  /**
   * Get inspection result
   */
  async getInspectionResult(inspectionId: string): Promise<InspectionResult> {
    const supabase = createClient();

    // Get inspection
    const {data: inspection} = await supabase
      .from('Inspection')
      .select('*, permit:Permit(id)')
      .eq('id', inspectionId)
      .single();

    if (!inspection) {
      throw new Error('Inspection not found');
    }

    // Get checklist items
    const {data: checklistItems} = await supabase
      .from('InspectionChecklistItem')
      .select('*')
      .eq('inspectionId', inspectionId);

    // Get photos
    const {data: photos} = await supabase
      .from('InspectionPhoto')
      .select('*')
      .eq('inspectionId', inspectionId)
      .order('uploadedAt', {ascending: true});

    // Get corrections
    const {data: corrections} = await supabase
      .from('InspectionCorrection')
      .select('*')
      .eq('inspectionId', inspectionId)
      .order('severity', {ascending: false});

    return {
      inspectionId: inspection.id,
      inspectionNumber: inspection.inspectionNumber,
      permitId: inspection.permitId,
      type: inspection.type,
      result: inspection.result || 'PASS',
      notes: inspection.notes || undefined,
      checklistItems: (checklistItems || []).map(item => ({
        id: item.id,
        category: item.category,
        item: item.item,
        status: item.status,
        notes: item.notes || undefined,
      })),
      photos: (photos || []).map(photo => ({
        id: photo.id,
        fileUrl: photo.fileUrl,
        caption: photo.caption || undefined,
        location: photo.location || undefined,
        uploadedAt: new Date(photo.uploadedAt),
      })),
      corrections: (corrections || []).map(correction => ({
        id: correction.id,
        description: correction.description,
        location: correction.location || undefined,
        category: correction.category,
        severity: correction.severity,
        mustFixBefore: correction.mustFixBefore || undefined,
        resolved: correction.resolved || false,
        resolvedAt: correction.resolvedAt ? new Date(correction.resolvedAt) : undefined,
      })),
      completedBy: inspection.inspectorId || '',
      completedAt: inspection.completedAt ? new Date(inspection.completedAt) : new Date(),
    };
  }

  /**
   * Get results summary for permit
   */
  async getPermitResultsSummary(permitId: string): Promise<{
    totalInspections: number;
    completedInspections: number;
    passedInspections: number;
    failedInspections: number;
    partialPassInspections: number;
    pendingInspections: number;
    criticalCorrections: number;
    results: Array<{
      inspectionId: string;
      inspectionNumber: string;
      type: string;
      result: string;
      completedAt?: Date;
      hasCorrections: boolean;
    }>;
  }> {
    const supabase = createClient();

    // Get all inspections for permit
    const {data: inspections} = await supabase
      .from('Inspection')
      .select('id, inspectionNumber, type, status, result, completedAt')
      .eq('permitId', permitId)
      .order('completedAt', {ascending: true});

    if (!inspections) {
      return {
        totalInspections: 0,
        completedInspections: 0,
        passedInspections: 0,
        failedInspections: 0,
        partialPassInspections: 0,
        pendingInspections: 0,
        criticalCorrections: 0,
        results: [],
      };
    }

    // Get correction counts
    const inspectionIds = inspections.map(i => i.id);
    const {data: corrections} = await supabase
      .from('InspectionCorrection')
      .select('inspectionId, severity, resolved')
      .in('inspectionId', inspectionIds);

    const criticalCorrections = corrections?.filter(
      c => c.severity === 'CRITICAL' && !c.resolved
    ).length || 0;

    const completedInspections = inspections.filter(i => i.status === 'COMPLETED');
    const passedInspections = completedInspections.filter(
      i => i.result === 'PASS' || i.result === 'PASS_WITH_COMMENTS'
    );
    const failedInspections = completedInspections.filter(i => i.result === 'FAIL');
    const partialPassInspections = completedInspections.filter(i => i.result === 'PARTIAL_PASS');
    const pendingInspections = inspections.filter(
      i => i.status !== 'COMPLETED' && i.status !== 'CANCELLED'
    );

    const results = inspections.map(inspection => {
      const inspectionCorrections = corrections?.filter(
        c => c.inspectionId === inspection.id && !c.resolved
      ) || [];

      return {
        inspectionId: inspection.id,
        inspectionNumber: inspection.inspectionNumber,
        type: inspection.type,
        result: inspection.result || 'PENDING',
        completedAt: inspection.completedAt ? new Date(inspection.completedAt) : undefined,
        hasCorrections: inspectionCorrections.length > 0,
      };
    });

    return {
      totalInspections: inspections.length,
      completedInspections: completedInspections.length,
      passedInspections: passedInspections.length,
      failedInspections: failedInspections.length,
      partialPassInspections: partialPassInspections.length,
      pendingInspections: pendingInspections.length,
      criticalCorrections,
      results,
    };
  }
}

// Singleton instance
export const resultsManagerService = new ResultsManagerService();
