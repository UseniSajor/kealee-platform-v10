/**
 * Correction Tracking Service
 * Correction tracking with photo evidence
 */

import {createClient} from '@/lib/supabase/client';

export interface InspectionCorrection {
  id: string;
  inspectionId: string;
  description: string;
  location?: string;
  category: string;
  severity: 'MINOR' | 'MAJOR' | 'CRITICAL';
  mustFixBefore?: string; // Next inspection type
  photoEvidence?: Array<{
    fileUrl: string;
    caption?: string;
  }>;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionNotes?: string;
  createdAt: Date;
}

export interface CorrectionResolution {
  correctionId: string;
  resolved: boolean;
  resolutionNotes?: string;
  resolutionPhotos?: Array<{
    fileUrl: string;
    caption?: string;
  }>;
  resolvedBy: string;
  resolvedAt: Date;
}

export class CorrectionTrackerService {
  /**
   * Get corrections for inspection
   */
  async getInspectionCorrections(
    inspectionId: string
  ): Promise<InspectionCorrection[]> {
    const supabase = createClient();

    // Get corrections
    const {data: corrections} = await supabase
      .from('InspectionCorrection')
      .select('*')
      .eq('inspectionId', inspectionId)
      .order('severity', {ascending: false})
      .order('createdAt', {ascending: true});

    if (!corrections) {
      return [];
    }

    // Get photos for corrections (in production, would link photos to corrections)
    const {data: photos} = await supabase
      .from('InspectionPhoto')
      .select('*')
      .eq('inspectionId', inspectionId);

    return corrections.map(correction => {
      // Filter photos that match correction location/description
      const relatedPhotos = photos?.filter(
        photo => photo.caption?.toLowerCase().includes(correction.description.toLowerCase()) ||
                 photo.location === correction.location
      ) || [];

      return {
        id: correction.id,
        inspectionId: correction.inspectionId,
        description: correction.description,
        location: correction.location || undefined,
        category: correction.category,
        severity: correction.severity,
        mustFixBefore: correction.mustFixBefore || undefined,
        photoEvidence: relatedPhotos.map(p => ({
          fileUrl: p.fileUrl,
          caption: p.caption || undefined,
        })),
        resolved: correction.resolved || false,
        resolvedAt: correction.resolvedAt ? new Date(correction.resolvedAt) : undefined,
        resolvedBy: correction.resolvedBy || undefined,
        resolutionNotes: correction.resolutionNotes || undefined,
        createdAt: new Date(correction.createdAt),
      };
    });
  }

  /**
   * Add photo evidence to correction
   */
  async addCorrectionPhoto(
    correctionId: string,
    fileUrl: string,
    caption?: string
  ): Promise<void> {
    const supabase = createClient();

    // Get correction to get inspection ID
    const {data: correction} = await supabase
      .from('InspectionCorrection')
      .select('inspectionId, location')
      .eq('id', correctionId)
      .single();

    if (!correction) {
      throw new Error('Correction not found');
    }

    // Add photo to inspection
    await supabase.from('InspectionPhoto').insert({
      inspectionId: correction.inspectionId,
      fileUrl,
      caption: caption || `Correction evidence: ${correctionId}`,
      location: correction.location || undefined,
    });
  }

  /**
   * Resolve correction
   */
  async resolveCorrection(
    resolution: CorrectionResolution
  ): Promise<void> {
    const supabase = createClient();

    // Update correction
    await supabase
      .from('InspectionCorrection')
      .update({
        resolved: resolution.resolved,
        resolvedAt: resolution.resolvedAt.toISOString(),
        resolvedBy: resolution.resolvedBy,
        resolutionNotes: resolution.resolutionNotes,
      })
      .eq('id', resolution.correctionId);

    // Add resolution photos if provided
    if (resolution.resolutionPhotos && resolution.resolutionPhotos.length > 0) {
      // Get correction to get inspection ID
      const {data: correction} = await supabase
        .from('InspectionCorrection')
        .select('inspectionId, location')
        .eq('id', resolution.correctionId)
        .single();

      if (correction) {
        for (const photo of resolution.resolutionPhotos) {
          await supabase.from('InspectionPhoto').insert({
            inspectionId: correction.inspectionId,
            fileUrl: photo.fileUrl,
            caption: photo.caption || `Correction resolved: ${resolution.correctionId}`,
            location: correction.location || undefined,
          });
        }
      }
    }
  }

  /**
   * Get unresolved corrections for permit
   */
  async getUnresolvedCorrections(permitId: string): Promise<InspectionCorrection[]> {
    const supabase = createClient();

    // Get all inspections for permit
    const {data: inspections} = await supabase
      .from('Inspection')
      .select('id')
      .eq('permitId', permitId);

    if (!inspections || inspections.length === 0) {
      return [];
    }

    const inspectionIds = inspections.map(i => i.id);

    // Get unresolved corrections
    const {data: corrections} = await supabase
      .from('InspectionCorrection')
      .select('*')
      .in('inspectionId', inspectionIds)
      .eq('resolved', false)
      .order('severity', {ascending: false})
      .order('createdAt', {ascending: true});

    if (!corrections) {
      return [];
    }

    // Get photos
    const {data: photos} = await supabase
      .from('InspectionPhoto')
      .select('*')
      .in('inspectionId', inspectionIds);

    return corrections.map(correction => {
      const relatedPhotos = photos?.filter(
        photo => photo.inspectionId === correction.inspectionId &&
                 (photo.caption?.toLowerCase().includes(correction.description.toLowerCase()) ||
                  photo.location === correction.location)
      ) || [];

      return {
        id: correction.id,
        inspectionId: correction.inspectionId,
        description: correction.description,
        location: correction.location || undefined,
        category: correction.category,
        severity: correction.severity,
        mustFixBefore: correction.mustFixBefore || undefined,
        photoEvidence: relatedPhotos.map(p => ({
          fileUrl: p.fileUrl,
          caption: p.caption || undefined,
        })),
        resolved: false,
        createdAt: new Date(correction.createdAt),
      };
    });
  }

  /**
   * Get corrections blocking next inspection
   */
  async getBlockingCorrections(
    permitId: string,
    nextInspectionType: string
  ): Promise<InspectionCorrection[]> {
    const unresolved = await this.getUnresolvedCorrections(permitId);

    // Filter corrections that must be fixed before next inspection
    return unresolved.filter(
      correction =>
        correction.mustFixBefore === nextInspectionType ||
        correction.severity === 'CRITICAL'
    );
  }
}

// Singleton instance
export const correctionTrackerService = new CorrectionTrackerService();
