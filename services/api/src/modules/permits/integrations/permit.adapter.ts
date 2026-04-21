/**
 * Permit API Adapter Interface
 *
 * Defines contract for permit system integrations (Accela, EnerGov, OpenGov, etc)
 * All adapters implement same interface, allowing pluggable integrations.
 */

export interface PermitApplicationInput {
  permitNumber?: string
  permitType: string
  address: string
  jurisdictionCode: string
  applicantName: string
  applicantEmail: string
  applicantPhone?: string
  projectDescription?: string
  estimatedValue?: number
  squareFootage?: number
  documents?: Array<{ filename: string; url: string; type: string }>
}

export interface PermitStatusOutput {
  permitNumber: string
  status: 'not_filed' | 'submitted' | 'under_review' | 'approved' | 'issued' | 'expired' | 'revoked' | 'closed' | 'unknown'
  statusSummary: string
  filedDate?: string
  issuedDate?: string
  expirationDate?: string
  reviewNotes: string[]
  nextSteps: string[]
  reviewersAssigned: string[]
  lastStatusChangeDate?: string
  source: 'live' | 'cached' | 'fallback'
  isAvailable: boolean
}

export interface DocumentUploadInput {
  permitNumber: string
  jurisdictionCode: string
  documents: Array<{ filename: string; mimetype: string; buffer: Buffer }>
}

export interface DocumentUploadOutput {
  success: boolean
  uploadedCount: number
  failedCount: number
  details: Array<{ filename: string; success: boolean; remoteId?: string; error?: string }>
}

export interface PermitAdapter {
  name: string
  jurisdictions: string[] // e.g., ['dc', 'montgomery_md']
  isAvailable: () => Promise<boolean>

  // Retrieve permit status
  getPermitStatus(permitNumber: string, address?: string): Promise<PermitStatusOutput>

  // Submit new permit application
  submitPermitApplication(input: PermitApplicationInput): Promise<{ permitNumber: string; success: boolean; message: string }>

  // Upload documents to existing permit
  uploadDocuments(input: DocumentUploadInput): Promise<DocumentUploadOutput>

  // List fees for jurisdiction/permit type
  getFees(permitType: string): Promise<Array<{ name: string; amount: number; required: boolean }>>

  // List required documents
  getRequiredDocuments(permitType: string): Promise<string[]>
}

/**
 * Fallback adapter - always available, returns mock response with "fallback" source flag
 */
export class FallbackPermitAdapter implements PermitAdapter {
  name = 'fallback'
  jurisdictions = ['*'] // Matches any jurisdiction

  async isAvailable(): Promise<boolean> {
    return true
  }

  async getPermitStatus(permitNumber: string, address?: string): Promise<PermitStatusOutput> {
    return {
      permitNumber,
      status: 'unknown',
      statusSummary: `Status not available via live API. Contact jurisdiction directly for permit #${permitNumber}.`,
      reviewNotes: ['Fallback adapter active — live status unavailable'],
      nextSteps: [`Contact your local building department`, `Visit jurisdiction portal for live status`],
      reviewersAssigned: [],
      source: 'fallback',
      isAvailable: false,
    }
  }

  async submitPermitApplication(input: PermitApplicationInput): Promise<{ permitNumber: string; success: boolean; message: string }> {
    return {
      permitNumber: `FALLBACK-${Date.now()}`,
      success: false,
      message: `API integration for ${input.jurisdictionCode} not available. Submit manually to jurisdiction portal.`,
    }
  }

  async uploadDocuments(input: DocumentUploadInput): Promise<DocumentUploadOutput> {
    return {
      success: false,
      uploadedCount: 0,
      failedCount: input.documents.length,
      details: input.documents.map((doc) => ({
        filename: doc.filename,
        success: false,
        error: 'Fallback adapter — upload not available',
      })),
    }
  }

  async getFees(permitType: string): Promise<Array<{ name: string; amount: number; required: boolean }>> {
    return []
  }

  async getRequiredDocuments(permitType: string): Promise<string[]> {
    return []
  }
}
