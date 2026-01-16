/**
 * Permit Application Creator Service
 * One-click permit application creation from design
 */

import {createClient} from '@/lib/supabase/client';
import {designExportService, PermitPackage} from './design-export';
import {sheetOrganizerService} from './sheet-organizer';
import {codeComplianceCheckerService} from './code-compliance-checker';
import {documentStorageService} from '@/services/document-management/document-storage';

export interface PermitApplicationRequest {
  designProjectId: string;
  jurisdictionId: string;
  permitType: string;
  options?: {
    includeCalculations?: boolean;
    includeShopDrawings?: boolean;
    expedited?: boolean;
    preCheckCompliance?: boolean;
  };
}

export interface PermitApplicationResult {
  permitId: string;
  permitNumber: string;
  trackingNumber: string;
  status: string;
  complianceReport?: any;
  documentsUploaded: number;
  submittedAt: Date;
}

export class PermitApplicationCreatorService {
  /**
   * Create permit application from design project
   */
  async createPermitApplication(
    request: PermitApplicationRequest,
    userId: string
  ): Promise<PermitApplicationResult> {
    const supabase = createClient();

    // Step 1: Export permit package
    const permitPackage = await designExportService.exportPermitPackage(
      request.designProjectId,
      request.jurisdictionId,
      request.options
    );

    // Step 2: Organize sheets
    const {data: deliverables} = await supabase
      .from('DesignDeliverable')
      .select('*')
      .eq('designProjectId', request.designProjectId);

    const organizedSheets = deliverables
      ? await sheetOrganizerService.organizeSheets(deliverables as any)
      : [];

    // Step 3: Pre-check compliance (optional)
    let complianceReport;
    if (request.options?.preCheckCompliance) {
      complianceReport = await codeComplianceCheckerService.checkCompliance(
        request.designProjectId,
        request.jurisdictionId,
        request.permitType
      );
    }

    // Step 4: Get or create property
    const propertyId = await this.getOrCreateProperty(permitPackage.extractedData);

    // Step 5: Create permit record
    const permit = await this.createPermitRecord(
      {
        ...permitPackage,
        propertyId,
        permitType: request.permitType,
        expedited: request.options?.expedited || false,
      },
      userId
    );

    // Step 6: Upload documents
    const documentsUploaded = await this.uploadPermitDocuments(
      permit.id,
      permitPackage.documents,
      userId
    );

    // Step 7: Link design project to permit
    await this.linkDesignProjectToPermit(request.designProjectId, permit.id);

    // Step 8: Generate tracking number
    const trackingNumber = designExportService.generateTrackingNumber(permit.id);

    // Step 9: Update permit with tracking number
    await supabase
      .from('Permit')
      .update({trackingNumber})
      .eq('id', permit.id);

    return {
      permitId: permit.id,
      permitNumber: permit.permitNumber,
      trackingNumber,
      status: permit.status,
      complianceReport,
      documentsUploaded,
      submittedAt: new Date(),
    };
  }

  /**
   * Get or create property
   */
  private async getOrCreateProperty(
    extractedData: PermitPackage['extractedData']
  ): Promise<string> {
    const supabase = createClient();

    if (!extractedData.address) {
      throw new Error('Property address is required');
    }

    // Try to find existing property
    const {data: existing} = await supabase
      .from('Property')
      .select('id')
      .eq('address', extractedData.address)
      .limit(1)
      .single();

    if (existing) {
      return existing.id;
    }

    // Create new property
    const {data: newProperty, error} = await supabase
      .from('Property')
      .insert({
        address: extractedData.address,
        city: this.extractCity(extractedData.address),
        state: this.extractState(extractedData.address),
        zip: this.extractZip(extractedData.address),
        country: 'US',
      })
      .select('id')
      .single();

    if (error || !newProperty) {
      throw new Error('Failed to create property');
    }

    return newProperty.id;
  }

  /**
   * Create permit record
   */
  private async createPermitRecord(
    permitPackage: PermitPackage & {
      propertyId: string;
      permitType: string;
      expedited: boolean;
    },
    userId: string
  ): Promise<{id: string; permitNumber: string; status: string}> {
    const supabase = createClient();

    // Generate permit number
    const permitNumber = await this.generatePermitNumber(
      permitPackage.jurisdictionId,
      permitPackage.permitType
    );

    // Create permit
    const {data: permit, error} = await supabase
      .from('Permit')
      .insert({
        permitNumber,
        jurisdictionId: permitPackage.jurisdictionId,
        propertyId: permitPackage.propertyId,
        type: permitPackage.permitType,
        description: permitPackage.extractedData.projectName || 'Permit from design project',
        valuation: permitPackage.extractedData.valuation
          ? permitPackage.extractedData.valuation.toString()
          : '0',
        applicantId: userId,
        applicantType: 'ARCHITECT',
        status: 'SUBMITTED',
        submittedAt: new Date().toISOString(),
        expedited: permitPackage.expedited,
      })
      .select('id, permitNumber, status')
      .single();

    if (error || !permit) {
      throw new Error('Failed to create permit');
    }

    return permit;
  }

  /**
   * Upload permit documents
   */
  private async uploadPermitDocuments(
    permitId: string,
    documents: PermitPackage['documents'],
    userId: string
  ): Promise<number> {
    let uploaded = 0;

    for (const doc of documents) {
      try {
        // Fetch file from URL
        const response = await fetch(doc.fileUrl);
        const blob = await response.blob();

        // Store document
        await documentStorageService.storeDocument(permitId, blob, {
          documentType: doc.type,
          name: doc.name,
          uploadedBy: userId,
          encrypted: false,
        });

        uploaded++;
      } catch (error) {
        console.error(`Failed to upload document ${doc.name}:`, error);
      }
    }

    return uploaded;
  }

  /**
   * Link design project to permit
   */
  private async linkDesignProjectToPermit(
    designProjectId: string,
    permitId: string
  ): Promise<void> {
    const supabase = createClient();

    // Store relationship (would be in a DesignProjectPermit table)
    await supabase.from('PermitEvent').insert({
      permitId,
      type: 'DESIGN_PROJECT_LINKED',
      description: `Linked to design project ${designProjectId}`,
      metadata: {
        designProjectId,
      },
    });
  }

  /**
   * Generate permit number
   */
  private async generatePermitNumber(
    jurisdictionId: string,
    permitType: string
  ): Promise<string> {
    const supabase = createClient();

    // Get jurisdiction code
    const {data: jurisdiction} = await supabase
      .from('Jurisdiction')
      .select('code')
      .eq('id', jurisdictionId)
      .single();

    const code = jurisdiction?.code || 'JUR';

    // Get year
    const year = new Date().getFullYear().toString().slice(-2);

    // Get type prefix
    const typePrefix = permitType.substring(0, 3).toUpperCase();

    // Get sequence number
    const {data: count} = await supabase
      .from('Permit')
      .select('id', {count: 'exact', head: true})
      .eq('jurisdictionId', jurisdictionId)
      .like('permitNumber', `${code}-${year}-${typePrefix}-%`);

    const sequence = ((count || 0) + 1).toString().padStart(4, '0');

    return `${code}-${year}-${typePrefix}-${sequence}`;
  }

  /**
   * Extract city from address
   */
  private extractCity(address: string): string {
    // Simple extraction - in production, use geocoding
    const parts = address.split(',');
    return parts.length > 1 ? parts[parts.length - 2].trim() : '';
  }

  /**
   * Extract state from address
   */
  private extractState(address: string): string {
    const parts = address.split(',');
    if (parts.length > 1) {
      const stateZip = parts[parts.length - 1].trim();
      const stateMatch = stateZip.match(/([A-Z]{2})/);
      return stateMatch ? stateMatch[1] : '';
    }
    return '';
  }

  /**
   * Extract ZIP from address
   */
  private extractZip(address: string): string {
    const zipMatch = address.match(/\b(\d{5}(?:-\d{4})?)\b/);
    return zipMatch ? zipMatch[1] : '';
  }
}

// Singleton instance
export const permitApplicationCreatorService = new PermitApplicationCreatorService();
