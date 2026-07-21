/**
 * Public Document Viewer Service
 * Document viewing (approved plans, inspection results)
 */

import {createClient} from '@/lib/supabase/client';

export interface PublicDocument {
  id: string;
  name: string;
  type: string;
  description?: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  reviewed: boolean;
  approved: boolean; // Only approved documents shown publicly
}

export interface PublicInspectionResult {
  inspectionId: string;
  inspectionNumber: string;
  type: string;
  scheduledDate?: Date;
  completedDate?: Date;
  result?: 'PASS' | 'PASS_WITH_COMMENTS' | 'FAIL' | 'PARTIAL_PASS';
  notes?: string;
  photos?: Array<{
    fileUrl: string;
    caption?: string;
    location?: string;
  }>;
}

export class DocumentViewerService {
  /**
   * Get public documents for permit
   */
  async getPublicDocuments(permitId: string): Promise<PublicDocument[]> {
    const supabase = createClient();

    // Get approved documents
    const {data: documents} = await supabase
      .from('PermitDocument')
      .select('*')
      .eq('permitId', permitId)
      .eq('reviewed', true)
      .order('uploadedAt', {ascending: true});

    if (!documents) {
      return [];
    }

    return documents
      .filter(doc => doc.reviewed) // Only show reviewed documents
      .map(doc => ({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        description: doc.description || undefined,
        fileUrl: doc.fileUrl,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        uploadedAt: new Date(doc.uploadedAt),
        reviewed: doc.reviewed || false,
        approved: doc.reviewed, // Reviewed documents are considered approved for public view
      }));
  }

  /**
   * Get public inspection results
   */
  async getPublicInspectionResults(permitId: string): Promise<PublicInspectionResult[]> {
    const supabase = createClient();

    // Get completed inspections
    const {data: inspections} = await supabase
      .from('Inspection')
      .select('id, inspectionNumber, type, scheduledDate, completedAt, result, notes')
      .eq('permitId', permitId)
      .eq('status', 'COMPLETED')
      .order('completedAt', {ascending: false});

    if (!inspections || inspections.length === 0) {
      return [];
    }

    // Get photos for inspections
    const inspectionIds = inspections.map(i => i.id);
    const {data: photos} = await supabase
      .from('InspectionPhoto')
      .select('*')
      .in('inspectionId', inspectionIds)
      .order('uploadedAt', {ascending: true});

    return inspections.map(inspection => {
      const inspectionPhotos = photos?.filter(p => p.inspectionId === inspection.id) || [];

      return {
        inspectionId: inspection.id,
        inspectionNumber: inspection.inspectionNumber,
        type: inspection.type,
        scheduledDate: inspection.scheduledDate ? new Date(inspection.scheduledDate) : undefined,
        completedDate: inspection.completedAt ? new Date(inspection.completedAt) : undefined,
        result: inspection.result as any,
        notes: inspection.notes || undefined,
        photos: inspectionPhotos.map(p => ({
          fileUrl: p.fileUrl,
          caption: p.caption || undefined,
          location: p.location || undefined,
        })),
      };
    });
  }

  /**
   * Check if document can be viewed publicly
   */
  async canViewDocument(documentId: string, permitId: string): Promise<boolean> {
    const supabase = createClient();

    // Get document
    const {data: document} = await supabase
      .from('PermitDocument')
      .select('reviewed, permitId')
      .eq('id', documentId)
      .single();

    if (!document) {
      return false;
    }

    // Verify permit matches
    if (document.permitId !== permitId) {
      return false;
    }

    // Only reviewed documents can be viewed publicly
    return document.reviewed || false;
  }

  /**
   * Get document download URL (public)
   */
  async getDocumentDownloadUrl(documentId: string, permitId: string): Promise<string | null> {
    const canView = await this.canViewDocument(documentId, permitId);

    if (!canView) {
      return null;
    }

    const supabase = createClient();

    const {data: document} = await supabase
      .from('PermitDocument')
      .select('fileUrl')
      .eq('id', documentId)
      .single();

    return document?.fileUrl || null;
  }
}

// Singleton instance
export const documentViewerService = new DocumentViewerService();
