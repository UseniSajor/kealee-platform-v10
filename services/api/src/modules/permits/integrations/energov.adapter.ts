/**
 * EnerGov Permit Adapter
 *
 * Supports: Loudoun County VA
 * EnerGov (Tyler Technologies) CSS system for permit/licensing
 * API: RESTful with API key authentication
 */

import {
  PermitAdapter,
  PermitApplicationInput,
  PermitStatusOutput,
  DocumentUploadInput,
  DocumentUploadOutput,
} from './permit.adapter'

export class EnerGovPermitAdapter implements PermitAdapter {
  name = 'energov'
  jurisdictions = ['loudoun_va']

  private baseUrl = 'https://energov.loudoun.gov/api/v2'
  private apiKey = process.env.ENERGOV_API_KEY_LOUDOUN || ''

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false

    try {
      const resp = await fetch(`${this.baseUrl}/health`, {
        headers: { 'X-API-Key': this.apiKey },
        signal: AbortSignal.timeout(5000),
      })
      return resp.ok
    } catch {
      return false
    }
  }

  async getPermitStatus(permitNumber: string, address?: string): Promise<PermitStatusOutput> {
    if (!this.apiKey) {
      return {
        permitNumber,
        status: 'unknown',
        statusSummary: 'API not configured for Loudoun County',
        reviewNotes: [],
        nextSteps: [],
        reviewersAssigned: [],
        source: 'fallback',
        isAvailable: false,
      }
    }

    try {
      const resp = await fetch(`${this.baseUrl}/permits/${permitNumber}`, {
        headers: {
          'X-API-Key': this.apiKey,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      })

      if (!resp.ok) {
        return {
          permitNumber,
          status: 'unknown',
          statusSummary: 'Permit not found in Loudoun County system',
          reviewNotes: [],
          nextSteps: ['Check EnerGov portal at energov.loudoun.gov'],
          reviewersAssigned: [],
          source: 'fallback',
          isAvailable: false,
        }
      }

      const permit = await resp.json()

      return {
        permitNumber,
        status: this.mapEnerGovStatus(permit.status),
        statusSummary: permit.statusReason || 'No status description available',
        filedDate: permit.submittedDate,
        issuedDate: permit.issuedDate,
        expirationDate: permit.expirationDate,
        reviewNotes: permit.notes || [],
        nextSteps: this.generateNextSteps(permit.status),
        reviewersAssigned: permit.assignedReviewers?.map((r: any) => r.name) || [],
        lastStatusChangeDate: permit.lastStatusChange,
        source: 'live',
        isAvailable: true,
      }
    } catch (err) {
      console.error('[energov] Failed to get permit status:', err)
      return {
        permitNumber,
        status: 'unknown',
        statusSummary: 'Failed to fetch from EnerGov API. Try again later.',
        reviewNotes: [],
        nextSteps: ['Check EnerGov portal', 'Contact Loudoun County Building Department'],
        reviewersAssigned: [],
        source: 'fallback',
        isAvailable: false,
      }
    }
  }

  async submitPermitApplication(input: PermitApplicationInput): Promise<{ permitNumber: string; success: boolean; message: string }> {
    if (!this.apiKey) {
      return {
        permitNumber: '',
        success: false,
        message: 'API not configured for Loudoun County',
      }
    }

    try {
      const resp = await fetch(`${this.baseUrl}/permits`, {
        method: 'POST',
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: input.permitType,
          propertyAddress: input.address,
          projectDescription: input.projectDescription,
          applicant: {
            name: input.applicantName,
            email: input.applicantEmail,
            phone: input.applicantPhone,
          },
          estimatedProjectCost: input.estimatedValue,
          squareFeetage: input.squareFootage,
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

      const result = await resp.json()
      return {
        permitNumber: result.permitNumber,
        success: true,
        message: `Application submitted successfully. Reference: ${result.permitNumber}`,
      }
    } catch (err) {
      console.error('[energov] Failed to submit permit:', err)
      return {
        permitNumber: '',
        success: false,
        message: 'Failed to submit application. Contact Loudoun County directly.',
      }
    }
  }

  async uploadDocuments(input: DocumentUploadInput): Promise<DocumentUploadOutput> {
    if (!this.apiKey) {
      return {
        success: false,
        uploadedCount: 0,
        failedCount: input.documents.length,
        details: input.documents.map((doc) => ({
          filename: doc.filename,
          success: false,
          error: 'API not configured',
        })),
      }
    }

    try {
      const uploadPromises = input.documents.map(async (doc) => {
        try {
          const formData = new FormData()
          formData.append('file', new Blob([doc.buffer], { type: doc.mimetype }), doc.filename)

          const resp = await fetch(`${this.baseUrl}/permits/${input.permitNumber}/documents`, {
            method: 'POST',
            headers: {
              'X-API-Key': this.apiKey,
            },
            body: formData,
            signal: AbortSignal.timeout(30000),
          })

          if (resp.ok) {
            const result = await resp.json()
            return { filename: doc.filename, success: true, remoteId: result.documentId }
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
      console.error('[energov] Failed to upload documents:', err)
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
    // Mock fee structure - would be fetched from EnerGov API in production
    const feeMap: Record<string, Array<{ name: string; amount: number; required: boolean }>> = {
      BUILDING: [
        { name: 'Building Permit', amount: 100, required: true },
        { name: 'Plan Review', amount: 200, required: true },
        { name: 'Inspection', amount: 75, required: true },
      ],
      ELECTRICAL: [
        { name: 'Electrical License', amount: 60, required: true },
        { name: 'Plan Review', amount: 90, required: true },
      ],
      MECHANICAL: [
        { name: 'HVAC License', amount: 65, required: true },
        { name: 'Plan Review', amount: 100, required: true },
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
        'Structural Plans',
        'MEP Plans',
        'Proof of Ownership',
      ],
      ELECTRICAL: ['Electrical Plans', 'Load Calculations', 'Riser Diagram'],
      PLUMBING: ['Plumbing Plans', 'Water Supply Plan', 'Sewer Plan'],
      MECHANICAL: ['HVAC Plans', 'Load Calculations', 'Equipment Schedules'],
    }

    return docMap[permitType] || []
  }

  private mapEnerGovStatus(
    status: string,
  ): 'not_filed' | 'submitted' | 'under_review' | 'approved' | 'issued' | 'expired' | 'revoked' | 'closed' | 'unknown' {
    const statusMap: Record<string, any> = {
      SUBMITTED: 'submitted',
      INITIAL_REVIEW: 'under_review',
      PLAN_REVIEW: 'under_review',
      APPROVED: 'approved',
      ISSUED: 'issued',
      EXPIRED: 'expired',
      REVOKED: 'revoked',
      COMPLETED: 'closed',
    }
    return statusMap[status] || 'unknown'
  }

  private generateNextSteps(status: string): string[] {
    const steps: Record<string, string[]> = {
      SUBMITTED: ['Wait for assignment to reviewer', 'Prepare for plan review comments'],
      INITIAL_REVIEW: ['Schedule plan review meeting', 'Review preliminary comments'],
      PLAN_REVIEW: ['Address plan review comments', 'Resubmit revised plans'],
      APPROVED: ['Pay remaining fees', 'Schedule final inspection'],
      ISSUED: ['Post permit at job site', 'Call for inspections as needed'],
      EXPIRED: ['Apply for permit renewal', 'Check Loudoun County requirements'],
      COMPLETED: ['Maintain project records', 'File occupancy documentation'],
    }
    return steps[status] || ['Contact Loudoun County for status']
  }
}
