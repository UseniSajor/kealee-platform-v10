/**
 * Public Documents Service
 * Document viewing (approved plans, inspection results)
 */

import {createClient} from '@permits/src/lib/supabase/client';

export interface PublicDocument {
  id: string;
  name: string;
  type: string;
  description?: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  approved: boolean;
  approvedAt?: Date;
}

export interface InspectionResultDocument {
  inspectionId: string;
  inspectionNumber: string;
  inspectionType: string;
  completedDate: Date;
  result: string;
  photos: Array<{
    id: string;
    fileUrl: string;
    caption?: string;
    location?: string;
  }>;
  hasReport: boolean;
}

export class PublicDocumentsService {
  /**
   * Get public documents for permit
   */
  async getPublicDocuments(permitId: string): Promise<PublicDocument[]> {
    const supabase = createClient();

    // Get approved documents only
    const {data: documents} = await supabase
      .from('PermitDocument')
      .select('*')
      .eq('permitId', permitId)
      .eq('reviewed', true)
      .order('uploadedAt', {ascending: false});

    if (!documents) {
      return [];
    }

    // Only return documents for approved/issued permits
    const {data: permit} = await supabase
      .from('Permit')
      .select('status')
      .eq('id', permitId)
      .single();

    if (!permit) {
      return [];
    }

    // Only show documents for approved/issued/active/completed permits
    const publicStatuses = ['APPROVED', 'ISSUED', 'ACTIVE', 'COMPLETED'];
    if (!publicStatuses.includes(permit.status)) {
      return [];
    }

    return documents.map(doc => ({
      id: doc.id,
      name: doc.name,
      type: doc.type,
      description: doc.description || undefined,
      fileUrl: doc.fileUrl,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      uploadedAt: new Date(doc.uploadedAt),
      approved: doc.reviewed || false,
      approvedAt: doc.reviewedAt ? new Date(doc.reviewedAt) : undefined,
    }));
  }

  /**
   * Get public inspection results
   */
  async getPublicInspectionResults(
    permitId: string
  ): Promise<InspectionResultDocument[]> {
    const supabase = createClient();

    // Get completed inspections only
    const {data: inspections} = await supabase
      .from('Inspection')
      .select('id, inspectionNumber, type, completedAt, result')
      .eq('permitId', permitId)
      .eq('status', 'COMPLETED')
      .order('completedAt', {ascending: false});

    if (!inspections || inspections.length === 0) {
      return [];
    }

    // Get photos for each inspection
    const inspectionIds = inspections.map(i => i.id);
    const {data: photos} = await supabase
      .from('InspectionPhoto')
      .select('*')
      .in('inspectionId', inspectionIds);

    return inspections.map(inspection => {
      const inspectionPhotos = photos?.filter(p => p.inspectionId === inspection.id) || [];

      return {
        inspectionId: inspection.id,
        inspectionNumber: inspection.inspectionNumber,
        inspectionType: inspection.type,
        completedDate: new Date(inspection.completedAt!),
        result: inspection.result || 'COMPLETED',
        photos: inspectionPhotos.map(p => ({
          id: p.id,
          fileUrl: p.fileUrl,
          caption: p.caption || undefined,
          location: p.location || undefined,
        })),
        hasReport: inspection.result !== null,
      };
    });
  }

  /**
   * Get document by ID (with permission check)
   */
  async getPublicDocument(
    permitId: string,
    documentId: string
  ): Promise<PublicDocument | null> {
    const documents = await this.getPublicDocuments(permitId);
    return documents.find(d => d.id === documentId) || null;
  }

  /**
   * Check if permit documents are publicly viewable
   */
  async isPermitPubliclyViewable(permitId: string): Promise<boolean> {
    const supabase = createClient();

    const {data: permit} = await supabase
      .from('Permit')
      .select('status')
      .eq('id', permitId)
      .single();

    if (!permit) {
      return false;
    }

    // Draft permits are not publicly viewable
    if (permit.status === 'DRAFT') {
      return false;
    }

    return true;
  }
}

// Singleton instance
export const publicDocumentsService = new PublicDocumentsService();
