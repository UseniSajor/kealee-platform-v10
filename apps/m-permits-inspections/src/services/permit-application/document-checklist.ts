/**
 * Document Checklist Service
 * Manages required documents for permit applications
 */

export interface RequiredDocument {
  id: string;
  type: DocumentType;
  name: string;
  description: string;
  required: boolean;
  conditional?: {
    permitType?: string[];
    valuationMin?: number;
    squareFootageMin?: number;
    projectType?: string[];
  };
  fileTypes: string[]; // ['pdf', 'dwg', 'jpg']
  maxSize: number; // MB
  guidance?: string;
  exampleUrl?: string;
  uploaded: boolean;
  fileId?: string;
  fileName?: string;
}

export type DocumentType =
  | 'SITE_PLAN'
  | 'FLOOR_PLAN'
  | 'ELEVATION'
  | 'STRUCTURAL_CALCS'
  | 'ELECTRICAL_DIAGRAM'
  | 'PLUMBING_DIAGRAM'
  | 'MECHANICAL_DIAGRAM'
  | 'ENERGY_CALC'
  | 'SOILS_REPORT'
  | 'SURVEY'
  | 'PHOTOS'
  | 'CONTRACTOR_LICENSE'
  | 'INSURANCE'
  | 'OTHER';

export interface DocumentChecklist {
  permitType: string;
  documents: RequiredDocument[];
  completed: number;
  required: number;
  optional: number;
}

export class DocumentChecklistService {
  /**
   * Get required documents for permit type
   */
  getRequiredDocuments(
    permitType: string,
    options?: {
      valuation?: number;
      squareFootage?: number;
      projectType?: string;
    }
  ): RequiredDocument[] {
    const allDocuments = this.getAllDocumentTemplates();
    
    return allDocuments
      .filter(doc => this.isDocumentRequired(doc, permitType, options))
      .map(doc => ({
        ...doc,
        uploaded: false,
      }));
  }

  /**
   * Check if document is required based on conditions
   */
  private isDocumentRequired(
    doc: RequiredDocument,
    permitType: string,
    options?: {
      valuation?: number;
      squareFootage?: number;
      projectType?: string;
    }
  ): boolean {
    // Always required if marked as required
    if (doc.required) {
      // Check conditional requirements
      if (doc.conditional) {
        // Check permit type
        if (doc.conditional.permitType && !doc.conditional.permitType.includes(permitType)) {
          return false;
        }

        // Check valuation
        if (doc.conditional.valuationMin && (!options?.valuation || options.valuation < doc.conditional.valuationMin)) {
          return false;
        }

        // Check square footage
        if (doc.conditional.squareFootageMin && (!options?.squareFootage || options.squareFootage < doc.conditional.squareFootageMin)) {
          return false;
        }

        // Check project type
        if (doc.conditional.projectType && (!options?.projectType || !doc.conditional.projectType.includes(options.projectType))) {
          return false;
        }
      }

      return true;
    }

    return false;
  }

  /**
   * Get document checklist status
   */
  getChecklistStatus(documents: RequiredDocument[]): DocumentChecklist {
    const required = documents.filter(d => d.required);
    const uploaded = documents.filter(d => d.uploaded);
    const completed = uploaded.filter(d => d.required).length;

    return {
      permitType: documents[0]?.type || '',
      documents,
      completed,
      required: required.length,
      optional: documents.length - required.length,
    };
  }

  /**
   * Validate uploaded file
   */
  validateFile(
    file: File,
    document: RequiredDocument
  ): {valid: boolean; error?: string} {
    // Check file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !document.fileTypes.includes(fileExtension)) {
      return {
        valid: false,
        error: `File type .${fileExtension} not allowed. Accepted types: ${document.fileTypes.join(', ')}`,
      };
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > document.maxSize) {
      return {
        valid: false,
        error: `File size (${fileSizeMB.toFixed(2)}MB) exceeds maximum (${document.maxSize}MB)`,
      };
    }

    return {valid: true};
  }

  /**
   * Get upload guidance for document type
   */
  getUploadGuidance(documentType: DocumentType): string {
    const guidance: Record<DocumentType, string> = {
      SITE_PLAN: 'Upload a site plan showing property boundaries, existing structures, and proposed work. PDF or DWG format preferred.',
      FLOOR_PLAN: 'Upload floor plans showing room layouts, dimensions, and proposed changes. Scale should be clearly indicated.',
      ELEVATION: 'Upload elevation drawings showing exterior views of the building. Include all sides if applicable.',
      STRUCTURAL_CALCS: 'Upload structural calculations prepared by a licensed engineer. Must be signed and sealed.',
      ELECTRICAL_DIAGRAM: 'Upload electrical diagrams showing panel locations, circuits, and load calculations.',
      PLUMBING_DIAGRAM: 'Upload plumbing diagrams showing fixture locations, pipe sizes, and water/sewer connections.',
      MECHANICAL_DIAGRAM: 'Upload HVAC diagrams showing equipment locations, ductwork, and load calculations.',
      ENERGY_CALC: 'Upload energy calculations showing compliance with local energy codes.',
      SOILS_REPORT: 'Upload geotechnical report prepared by a licensed engineer.',
      SURVEY: 'Upload property survey showing boundaries, easements, and existing structures.',
      PHOTOS: 'Upload photos of existing conditions. Include multiple angles and close-ups of relevant areas.',
      CONTRACTOR_LICENSE: 'Upload copy of current contractor license. Must be valid and not expired.',
      INSURANCE: 'Upload certificate of insurance. Must show adequate coverage and be current.',
      OTHER: 'Upload any additional documents required for this permit type.',
    };

    return guidance[documentType] || 'Upload the required document in PDF format.';
  }

  /**
   * Get all document templates
   */
  private getAllDocumentTemplates(): RequiredDocument[] {
    return [
      {
        id: 'doc-site-plan',
        type: 'SITE_PLAN',
        name: 'Site Plan',
        description: 'Property site plan showing boundaries and proposed work',
        required: true,
        fileTypes: ['pdf', 'dwg', 'jpg', 'png'],
        maxSize: 50,
        guidance: 'Site plan should show property boundaries, existing structures, setbacks, and proposed construction.',
      },
      {
        id: 'doc-floor-plan',
        type: 'FLOOR_PLAN',
        name: 'Floor Plans',
        description: 'Floor plans for all affected levels',
        required: true,
        conditional: {
          permitType: ['BUILDING', 'ELECTRICAL', 'PLUMBING', 'MECHANICAL'],
        },
        fileTypes: ['pdf', 'dwg'],
        maxSize: 50,
        guidance: 'Floor plans should be to scale and show all rooms, dimensions, and proposed changes.',
      },
      {
        id: 'doc-elevation',
        type: 'ELEVATION',
        name: 'Elevation Drawings',
        description: 'Exterior elevation views',
        required: true,
        conditional: {
          permitType: ['BUILDING'],
          squareFootageMin: 500,
        },
        fileTypes: ['pdf', 'dwg', 'jpg'],
        maxSize: 30,
        guidance: 'Show all exterior elevations with dimensions and materials.',
      },
      {
        id: 'doc-structural',
        type: 'STRUCTURAL_CALCS',
        name: 'Structural Calculations',
        description: 'Engineer-stamped structural calculations',
        required: false,
        conditional: {
          permitType: ['BUILDING'],
          valuationMin: 50000,
        },
        fileTypes: ['pdf'],
        maxSize: 20,
        guidance: 'Must be prepared and sealed by a licensed structural engineer.',
      },
      {
        id: 'doc-electrical',
        type: 'ELECTRICAL_DIAGRAM',
        name: 'Electrical Diagram',
        description: 'Electrical system diagram',
        required: true,
        conditional: {
          permitType: ['ELECTRICAL'],
        },
        fileTypes: ['pdf', 'dwg'],
        maxSize: 20,
        guidance: 'Show panel locations, circuit layouts, and load calculations.',
      },
      {
        id: 'doc-plumbing',
        type: 'PLUMBING_DIAGRAM',
        name: 'Plumbing Diagram',
        description: 'Plumbing system diagram',
        required: true,
        conditional: {
          permitType: ['PLUMBING'],
        },
        fileTypes: ['pdf', 'dwg'],
        maxSize: 20,
        guidance: 'Show fixture locations, pipe sizes, and connections.',
      },
      {
        id: 'doc-mechanical',
        type: 'MECHANICAL_DIAGRAM',
        name: 'Mechanical/HVAC Diagram',
        description: 'HVAC system diagram',
        required: true,
        conditional: {
          permitType: ['MECHANICAL', 'HVAC'],
        },
        fileTypes: ['pdf', 'dwg'],
        maxSize: 20,
        guidance: 'Show equipment locations, ductwork, and load calculations.',
      },
      {
        id: 'doc-energy',
        type: 'ENERGY_CALC',
        name: 'Energy Calculations',
        description: 'Energy code compliance calculations',
        required: false,
        conditional: {
          permitType: ['BUILDING'],
          squareFootageMin: 1000,
        },
        fileTypes: ['pdf', 'xls', 'xlsx'],
        maxSize: 10,
        guidance: 'Energy calculations showing compliance with local energy codes.',
      },
      {
        id: 'doc-soils',
        type: 'SOILS_REPORT',
        name: 'Soils Report',
        description: 'Geotechnical report',
        required: false,
        conditional: {
          permitType: ['BUILDING', 'GRADING'],
          valuationMin: 100000,
        },
        fileTypes: ['pdf'],
        maxSize: 20,
        guidance: 'Must be prepared by a licensed geotechnical engineer.',
      },
      {
        id: 'doc-survey',
        type: 'SURVEY',
        name: 'Property Survey',
        description: 'Current property survey',
        required: false,
        conditional: {
          permitType: ['BUILDING', 'GRADING'],
          squareFootageMin: 2000,
        },
        fileTypes: ['pdf', 'dwg'],
        maxSize: 30,
        guidance: 'Survey should be current (within 1 year) and show boundaries, easements, and existing structures.',
      },
      {
        id: 'doc-contractor-license',
        type: 'CONTRACTOR_LICENSE',
        name: 'Contractor License',
        description: 'Valid contractor license',
        required: true,
        conditional: {
          projectType: ['contractor'],
        },
        fileTypes: ['pdf', 'jpg', 'png'],
        maxSize: 5,
        guidance: 'Upload a clear copy of your current contractor license. License must be valid and not expired.',
      },
      {
        id: 'doc-insurance',
        type: 'INSURANCE',
        name: 'Certificate of Insurance',
        description: 'Current insurance certificate',
        required: true,
        conditional: {
          projectType: ['contractor'],
        },
        fileTypes: ['pdf'],
        maxSize: 5,
        guidance: 'Certificate must be current and show adequate coverage amounts as required by jurisdiction.',
      },
    ];
  }
}

// Singleton instance
export const documentChecklistService = new DocumentChecklistService();
