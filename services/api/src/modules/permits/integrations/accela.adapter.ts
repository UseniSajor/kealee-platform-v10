/**
 * Accela Permit Adapter
 *
 * Supports: DC, Montgomery County MD, Prince George's County MD, Arlington VA, Alexandria VA
 * Accela (Tyler Technologies) is primary permit management system for DC DMV region
 * API: RESTful with OAuth2 authentication
 */

import {
  PermitAdapter,
  PermitApplicationInput,
  PermitStatusOutput,
  DocumentUploadInput,
  DocumentUploadOutput,
} from './permit.adapter'

export class AccelaPermitAdapter implements PermitAdapter {
  name = 'accela'
  jurisdictions = ['dc', 'montgomery_md', 'prince_georges_md', 'arlington_va', 'alexandria_va']

  private baseUrls: Record<string, string> = {
    dc: 'https://permitsdc.dc.gov/api/v3',
    montgomery_md: 'https://permittingservices.montgomerycountymd.gov/api/v3',
    prince_georges_md: 'https://dpie.mypgc.us/api/v3',
    arlington_va: 'https://permit.arlingtonva.us/api/v3',
    alexandria_va: 'https://aca.alexandriava.gov/api/v3',
  }

  private apiKeys: Record<string, string> = {
    dc: process.env.ACCELA_API_KEY_DC || '',
    montgomery_md: process.env.ACCELA_API_KEY_MONTGOMERY || '',
    prince_georges_md: process.env.ACCELA_API_KEY_PG || '',
    arlington_va: process.env.ACCELA_API_KEY_ARLINGTON || '',
    alexandria_va: process.env.ACCELA_API_KEY_ALEXANDRIA || '',
  }

  async isAvailable(): Promise<boolean> {
    // Check if at least one jurisdiction has valid API key
    const hasKey = Object.values(this.apiKeys).some((key) => key && key.length > 0)
    if (!hasKey) return false

    // Verify connectivity to at least one jurisdiction
    try {
      const testJurisdiction = Object.entries(this.apiKeys).find(([_, key]) => key)?.[0]
      if (!testJurisdiction) return false

      const resp = await fetch(`${this.baseUrls[testJurisdiction]}/health`, {
        headers: { Authorization: `Bearer ${this.apiKeys[testJurisdiction]}` },
        signal: AbortSignal.timeout(5000),
      })
      return resp.ok
    } catch {
      return false
    }
  }

  async getPermitStatus(permitNumber: string, address?: string): Promise<PermitStatusOutput> {
    // Infer jurisdiction from permit number or fall back to lookup by address
    let jurisdiction: string | null = this.inferJurisdictionFromPermit(permitNumber)

    if (!jurisdiction && address) {
      // Use address-based jurisdiction detection
      jurisdiction = this.detectJurisdictionFromAddress(address)
    }

    if (!jurisdiction || !this.apiKeys[jurisdiction]) {
      return {
        permitNumber,
        status: 'unknown',
        statusSummary: 'Could not determine jurisdiction or API not configured',
        reviewNotes: [],
        nextSteps: [],
        reviewersAssigned: [],
        source: 'fallback',
        isAvailable: false,
      }
    }

    try {
      const baseUrl = this.baseUrls[jurisdiction]
      const apiKey = this.apiKeys[jurisdiction]

      const resp = await fetch(`${baseUrl}/records/${permitNumber}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      })

      if (!resp.ok) {
        return {
          permitNumber,
          status: 'unknown',
          statusSummary: `Permit not found in ${jurisdiction} system`,
          reviewNotes: [],
          nextSteps: [`Check ${jurisdiction} permit portal directly`],
          reviewersAssigned: [],
          source: 'fallback',
          isAvailable: false,
        }
      }

      const record = await resp.json()

      return {
        permitNumber,
        status: this.mapAccelaStatus(record.statusValue || 'UNKNOWN'),
        statusSummary: record.displayDescription || 'No status description available',
        filedDate: record.fileDate,
        issuedDate: record.issueDate,
        expirationDate: record.expireDate,
        reviewNotes: record.comments?.map((c: any) => c.text) || [],
        nextSteps: this.generateNextSteps(record.statusValue),
        reviewersAssigned: record.assignedTo?.map((a: any) => a.name) || [],
        lastStatusChangeDate: record.statusDate,
        source: 'live',
        isAvailable: true,
      }
    } catch (err) {
      console.error('[accela] Failed to get permit status:', err)
      return {
        permitNumber,
        status: 'unknown',
        statusSummary: 'Failed to fetch from Accela API. Try again later.',
        reviewNotes: [],
        nextSteps: ['Check jurisdiction permit portal', 'Contact permit office directly'],
        reviewersAssigned: [],
        source: 'fallback',
        isAvailable: false,
      }
    }
  }

  async submitPermitApplication(input: PermitApplicationInput): Promise<{ permitNumber: string; success: boolean; message: string }> {
    const jurisdiction = this.detectJurisdictionFromAddress(input.address)

    if (!jurisdiction || !this.apiKeys[jurisdiction]) {
      return {
        permitNumber: '',
        success: false,
        message: `API not configured for ${input.jurisdictionCode}`,
      }
    }

    try {
      const baseUrl = this.baseUrls[jurisdiction]
      const apiKey = this.apiKeys[jurisdiction]

      const resp = await fetch(`${baseUrl}/records`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recordType: this.mapPermitType(input.permitType),
          address: input.address,
          description: input.projectDescription,
          estimatedValue: input.estimatedValue,
          contacts: [
            {
              name: input.applicantName,
              email: input.applicantEmail,
              phone: input.applicantPhone,
              contactType: 'Applicant',
            },
          ],
        }),
        signal: AbortSignal.timeout(15000),
      })

      if (!resp.ok) {
        return {
          permitNumber: '',
          success: false,
          message: `Failed to submit application: ${resp.statusText}`,
        }
      }

      const record = await resp.json()
      return {
        permitNumber: record.id,
        success: true,
        message: `Application submitted successfully. Reference: ${record.id}`,
      }
    } catch (err) {
      console.error('[accela] Failed to submit permit:', err)
      return {
        permitNumber: '',
        success: false,
        message: 'Failed to submit application. Contact jurisdiction directly.',
      }
    }
  }

  async uploadDocuments(input: DocumentUploadInput): Promise<DocumentUploadOutput> {
    const jurisdiction = this.detectJurisdictionFromAddress(input.jurisdictionCode)

    if (!jurisdiction || !this.apiKeys[jurisdiction]) {
      return {
        success: false,
        uploadedCount: 0,
        failedCount: input.documents.length,
        details: input.documents.map((doc) => ({
          filename: doc.filename,
          success: false,
          error: 'Jurisdiction not configured',
        })),
      }
    }

    try {
      const baseUrl = this.baseUrls[jurisdiction]
      const apiKey = this.apiKeys[jurisdiction]

      const uploadPromises = input.documents.map(async (doc) => {
        try {
          const formData = new FormData()
          formData.append('file', new Blob([doc.buffer], { type: doc.mimetype }), doc.filename)

          const resp = await fetch(`${baseUrl}/records/${input.permitNumber}/documents`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
            body: formData,
            signal: AbortSignal.timeout(30000),
          })

          if (resp.ok) {
            const result = await resp.json()
            return { filename: doc.filename, success: true, remoteId: result.id }
          } else {
            return { filename: doc.filename, success: false, error: resp.statusText }
          }
        } catch (err) {
          return { filename: doc.filename, success: false, error: String(err) }
        }
      })

      const results = await Promise.all(uploadPromises)
      const successCount = results.filter((r) => r.success).length

      return {
        success: successCount > 0,
        uploadedCount: successCount,
        failedCount: input.documents.length - successCount,
        details: results,
      }
    } catch (err) {
      console.error('[accela] Failed to upload documents:', err)
      return {
        success: false,
        uploadedCount: 0,
        failedCount: input.documents.length,
        details: input.documents.map((doc) => ({
          filename: doc.filename,
          success: false,
          error: 'Upload failed',
        })),
      }
    }
  }

  async getFees(permitType: string): Promise<Array<{ name: string; amount: number; required: boolean }>> {
    // Mock fee structure - would be fetched from Accela API in production
    const feeMap: Record<string, Array<{ name: string; amount: number; required: boolean }>> = {
      BUILDING: [
        { name: 'Application Fee', amount: 75, required: true },
        { name: 'Plan Review', amount: 150, required: true },
        { name: 'Inspection Fee', amount: 50, required: true },
      ],
      ELECTRICAL: [
        { name: 'Electrical Permit', amount: 45, required: true },
        { name: 'Plan Review', amount: 60, required: true },
      ],
      PLUMBING: [
        { name: 'Plumbing Permit', amount: 45, required: true },
        { name: 'Plan Review', amount: 60, required: true },
      ],
      MECHANICAL: [
        { name: 'Mechanical Permit', amount: 50, required: true },
        { name: 'Plan Review', amount: 75, required: true },
      ],
    }

    return feeMap[permitType] || []
  }

  async getRequiredDocuments(permitType: string): Promise<string[]> {
    const docMap: Record<string, string[]> = {
      BUILDING: [
        'Site Plan',
        'Floor Plans',
        'Elevations',
        'Structural Calculations',
        'Energy Compliance',
        'Proof of Ownership',
      ],
      ELECTRICAL: [
        'Electrical Plans',
        'Load Calculations',
        'Panel Schedule',
        'Single-Line Diagram',
      ],
      PLUMBING: [
        'Plumbing Plans',
        'Fixture Unit Calculations',
        'Water Supply Sizing',
        'Isometric Diagram',
      ],
      MECHANICAL: ['Mechanical Plans', 'HVAC Load Calculations', 'Equipment Specifications', 'Duct Layout'],
    }

    return docMap[permitType] || []
  }

  private inferJurisdictionFromPermit(permitNumber: string): string | null {
    // Accela permit numbers often contain jurisdiction prefix
    if (permitNumber.startsWith('DC-')) return 'dc'
    if (permitNumber.startsWith('MC-')) return 'montgomery_md'
    if (permitNumber.startsWith('PG-')) return 'prince_georges_md'
    if (permitNumber.startsWith('AR-')) return 'arlington_va'
    if (permitNumber.startsWith('AX-')) return 'alexandria_va'
    return null
  }

  private detectJurisdictionFromAddress(address: string): string | null {
    const a = address.toLowerCase()
    if (a.includes(', dc') || a.includes('washington, d.c') || a.includes('washington dc')) return 'dc'
    if (a.includes('montgomery') && a.includes('md')) return 'montgomery_md'
    if (a.includes('prince george') && a.includes('md')) return 'prince_georges_md'
    if (a.includes('arlington') && a.includes('va')) return 'arlington_va'
    if (a.includes('alexandria') && a.includes('va')) return 'alexandria_va'
    return null
  }

  private mapAccelaStatus(
    status: string,
  ): 'not_filed' | 'submitted' | 'under_review' | 'approved' | 'issued' | 'expired' | 'revoked' | 'closed' | 'unknown' {
    const statusMap: Record<string, any> = {
      SUBMIT: 'submitted',
      REVIEW: 'under_review',
      APPROVED: 'approved',
      ISSUED: 'issued',
      EXPIRED: 'expired',
      REVOKED: 'revoked',
      COMPLETED: 'closed',
    }
    return statusMap[status] || 'unknown'
  }

  private mapPermitType(permitType: string): string {
    const typeMap: Record<string, string> = {
      BUILDING: 'Building Permit',
      ELECTRICAL: 'Electrical Permit',
      PLUMBING: 'Plumbing Permit',
      MECHANICAL: 'Mechanical Permit',
      DEMOLITION: 'Demolition Permit',
      ZONING: 'Zoning Permit',
    }
    return typeMap[permitType] || permitType
  }

  private generateNextSteps(status: string): string[] {
    const steps: Record<string, string[]> = {
      SUBMIT: ['Schedule plan review appointment', 'Upload required documents'],
      REVIEW: ['Wait for plan reviewer contact', 'Prepare to address comments'],
      APPROVED: ['Pay fees if not already paid', 'Schedule inspections', 'Obtain final permit'],
      ISSUED: ['Begin work per permit conditions', 'Schedule required inspections'],
      EXPIRED: ['Renew permit or reapply', 'Check local renewal deadlines'],
      COMPLETED: ['Maintain compliance documentation', 'File final closeout'],
    }
    return steps[status] || ['Contact jurisdiction for next steps']
  }
}
