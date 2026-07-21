/**
 * Design Export Service
 * Export permit-ready documents from design projects
 */

import {createClient} from '@/lib/supabase/client';

export interface DesignProject {
  id: string;
  projectId: string;
  name: string;
  address?: string;
  propertyId?: string;
  ownerId: string;
  architectId?: string;
  engineerId?: string;
  status: string;
  deliverables?: DesignDeliverable[];
}

export interface DesignDeliverable {
  id: string;
  designProjectId: string;
  type: 'DD' | 'CD' | 'SD' | 'OTHER'; // Design Development, Construction Documents, Shop Drawings
  name: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
  version: number;
  sheetType?: string; // 'SITE_PLAN', 'FLOOR_PLAN', 'ELEVATION', etc.
  sheetNumber?: string;
}

export interface PermitPackage {
  permitId?: string;
  designProjectId: string;
  projectId: string;
  jurisdictionId: string;
  documents: PermitDocument[];
  extractedData: {
    address?: string;
    ownerName?: string;
    contractorName?: string;
    projectName?: string;
    valuation?: number;
    squareFootage?: number;
  };
  submittedAt: Date;
  trackingNumber?: string;
}

export interface PermitDocument {
  type: string;
  name: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  sheetNumber?: string;
  sheetType?: string;
  version: number;
  sourceDeliverableId?: string;
}

export class DesignExportService {
  /**
   * Export permit-ready documents from design project
   */
  async exportPermitPackage(
    designProjectId: string,
    jurisdictionId: string,
    options?: {
      includeCalculations?: boolean;
      includeShopDrawings?: boolean;
      filterBySheetType?: boolean;
    }
  ): Promise<PermitPackage> {
    const supabase = createClient();

    // Fetch design project
    const designProject = await this.getDesignProject(designProjectId);
    if (!designProject) {
      throw new Error('Design project not found');
    }

    // Fetch deliverables
    const deliverables = await this.getDesignDeliverables(designProjectId);

    // Extract permit-required documents
    const permitDocuments = await this.extractPermitDocuments(
      deliverables,
      options
    );

    // Extract project data
    const extractedData = await this.extractProjectData(designProject);

    // Get project information
    const {data: project} = await supabase
      .from('Project')
      .select('*')
      .eq('id', designProject.projectId)
      .single();

    return {
      designProjectId,
      projectId: designProject.projectId,
      jurisdictionId,
      documents: permitDocuments,
      extractedData: {
        ...extractedData,
        address: project?.propertyId
          ? await this.getPropertyAddress(project.propertyId)
          : designProject.address,
      },
      submittedAt: new Date(),
    };
  }

  /**
   * Get design project
   */
  private async getDesignProject(designProjectId: string): Promise<DesignProject | null> {
    const supabase = createClient();

    // In production, this would query the DesignProject table
    // For now, return mock data structure
    const {data: project} = await supabase
      .from('Project')
      .select('*')
      .eq('id', designProjectId)
      .single();

    if (!project) {
      return null;
    }

    return {
      id: designProjectId,
      projectId: project.id,
      name: project.name,
      ownerId: project.ownerId,
      status: project.status,
    };
  }

  /**
   * Get design deliverables
   */
  private async getDesignDeliverables(designProjectId: string): Promise<DesignDeliverable[]> {
    const supabase = createClient();

    // In production, this would query the DesignDeliverable table
    // For now, return empty array (would be populated from actual design system)
    return [];
  }

  /**
   * Extract permit-required documents from deliverables
   */
  private async extractPermitDocuments(
    deliverables: DesignDeliverable[],
    options?: {
      includeCalculations?: boolean;
      includeShopDrawings?: boolean;
      filterBySheetType?: boolean;
    }
  ): Promise<PermitDocument[]> {
    const permitDocuments: PermitDocument[] = [];

    // Map deliverables to permit document types
    for (const deliverable of deliverables) {
      // Skip if not construction documents
      if (deliverable.type !== 'CD' && deliverable.type !== 'SD') {
        continue;
      }

      // Skip shop drawings if not requested
      if (deliverable.type === 'SD' && !options?.includeShopDrawings) {
        continue;
      }

      // Determine permit document type from sheet type
      const permitDocType = this.mapSheetTypeToPermitDocType(deliverable.sheetType);

      if (permitDocType) {
        permitDocuments.push({
          type: permitDocType,
          name: deliverable.name,
          fileUrl: deliverable.fileUrl,
          fileSize: deliverable.fileSize,
          mimeType: this.getMimeType(deliverable.fileType),
          sheetNumber: deliverable.sheetNumber,
          sheetType: deliverable.sheetType,
          version: deliverable.version,
          sourceDeliverableId: deliverable.id,
        });
      }
    }

    // Add calculation sheets if requested
    if (options?.includeCalculations) {
      const calculations = deliverables.filter(d => 
        d.name.toLowerCase().includes('calc') ||
        d.name.toLowerCase().includes('calculation')
      );

      for (const calc of calculations) {
        permitDocuments.push({
          type: 'STRUCTURAL_CALCS',
          name: calc.name,
          fileUrl: calc.fileUrl,
          fileSize: calc.fileSize,
          mimeType: this.getMimeType(calc.fileType),
          version: calc.version,
          sourceDeliverableId: calc.id,
        });
      }
    }

    return permitDocuments;
  }

  /**
   * Map sheet type to permit document type
   */
  private mapSheetTypeToPermitDocType(sheetType?: string): string | null {
    const mapping: Record<string, string> = {
      SITE_PLAN: 'SITE_PLAN',
      FLOOR_PLAN: 'FLOOR_PLAN',
      ELEVATION: 'ELEVATION',
      SECTION: 'ELEVATION',
      DETAIL: 'OTHER',
      STRUCTURAL: 'STRUCTURAL_CALCS',
      ELECTRICAL: 'OTHER',
      PLUMBING: 'OTHER',
      MECHANICAL: 'OTHER',
    };

    return sheetType ? mapping[sheetType] || 'OTHER' : null;
  }

  /**
   * Get MIME type from file type
   */
  private getMimeType(fileType: string): string {
    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      dwg: 'application/acad',
      dxf: 'application/dxf',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
    };

    return mimeTypes[fileType.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Extract project data from design project
   */
  private async extractProjectData(designProject: DesignProject): Promise<PermitPackage['extractedData']> {
    const supabase = createClient();

    // Get project details
    const {data: project} = await supabase
      .from('Project')
      .select('*, owner:ownerId(name, email), property:propertyId(*)')
      .eq('id', designProject.projectId)
      .single();

    if (!project) {
      return {};
    }

    // Get owner name
    const ownerName = (project.owner as any)?.name;

    // Get property address
    const address = (project.property as any)?.address || designProject.address;

    // Get contractor from contracts
    const {data: contract} = await supabase
      .from('ContractAgreement')
      .select('contractor:contractorId(name)')
      .eq('projectId', designProject.projectId)
      .eq('status', 'SIGNED')
      .limit(1)
      .single();

    const contractorName = (contract?.contractor as any)?.name;

    return {
      address,
      ownerName,
      contractorName,
      projectName: project.name,
      valuation: project.budget ? Number(project.budget) : undefined,
    };
  }

  /**
   * Get property address
   */
  private async getPropertyAddress(propertyId: string): Promise<string | undefined> {
    const supabase = createClient();

    const {data: property} = await supabase
      .from('Property')
      .select('address, city, state, zip')
      .eq('id', propertyId)
      .single();

    if (!property) {
      return undefined;
    }

    return `${property.address}, ${property.city}, ${property.state} ${property.zip}`;
  }

  /**
   * Generate tracking number
   */
  generateTrackingNumber(permitId: string): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `TRK-${timestamp}-${random}`;
  }
}

// Singleton instance
export const designExportService = new DesignExportService();
