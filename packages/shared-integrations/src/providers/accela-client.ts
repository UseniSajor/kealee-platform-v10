// ============================================================
// ACCELA API CLIENT
// Integration with Accela Civic Platform
// ============================================================

import { BaseAPIClient } from './base-client';
import { IntegrationConfig, IntegrationResult, PermitSubmissionData, StatusCheckResult } from '../types';
import axios from 'axios';

export class AccelaClient extends BaseAPIClient {
  private tokenUrl: string;
  private apiVersion: string = 'v4';

  constructor(config: IntegrationConfig) {
    super(config);
    this.tokenUrl = config.oauthConfig?.tokenUrl || `${config.apiUrl}/oauth2/token`;
  }

  /**
   * Authenticate with Accela using OAuth2 client credentials
   */
  async authenticate(): Promise<boolean> {
    try {
      if (!this.config.oauthConfig) {
        throw new Error('OAuth2 configuration required for Accela');
      }

      const response = await axios.post(
        this.tokenUrl,
        new URLSearchParams({
          grant_type: 'client_credentials',
          scope: this.config.oauthConfig.scope.join(' '),
        }),
        {
          auth: {
            username: this.config.oauthConfig.clientId,
            password: this.config.oauthConfig.clientSecret,
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      const expiresIn = response.data.expires_in || 3600;
      this.tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

      return true;
    } catch (error) {
      console.error('Accela authentication error:', error);
      return false;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<boolean> {
    return this.authenticate();
  }

  /**
   * Submit permit application
   */
  async submitPermit(data: PermitSubmissionData): Promise<IntegrationResult> {
    const startTime = Date.now();

    try {
      await this.ensureAuthenticated();

      // Transform data to Accela format
      const accelaData = this.transformToAccelaFormat(data);

      // Submit via Accela API
      const response = await this.retry(async () => {
        return await this.client.post(
          `/${this.apiVersion}/records`,
          accelaData,
          {
            headers: {
              'x-accela-appid': this.config.clientId || '',
            },
          }
        );
      });

      const permitNumber = response.data.result?.recordNumber;
      const recordId = response.data.result?.id;

      return {
        success: true,
        data: {
          permitNumber,
          recordId,
          confirmationNumber: recordId,
          submittedAt: new Date(),
        },
        tier: 'API',
        provider: 'ACCELA',
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Accela submission failed',
        tier: 'API',
        provider: 'ACCELA',
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Check permit status
   */
  async checkStatus(permitNumber: string): Promise<IntegrationResult<StatusCheckResult>> {
    const startTime = Date.now();

    try {
      await this.ensureAuthenticated();

      const response = await this.retry(async () => {
        return await this.client.get(
          `/${this.apiVersion}/records`,
          {
            params: {
              recordNumber: permitNumber,
            },
            headers: {
              'x-accela-appid': this.config.clientId || '',
            },
          }
        );
      });

      const record = response.data.result?.[0];
      if (!record) {
        throw new Error('Permit not found');
      }

      return {
        success: true,
        data: {
          permitNumber: record.recordNumber,
          status: this.mapAccelaStatus(record.status?.value),
          lastUpdated: new Date(record.modifiedDate || record.createdDate),
          comments: record.comments?.map((c: any) => c.comment) || [],
        },
        tier: 'API',
        provider: 'ACCELA',
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Status check failed',
        tier: 'API',
        provider: 'ACCELA',
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Get permit documents
   */
  async getDocuments(permitNumber: string): Promise<IntegrationResult> {
    const startTime = Date.now();

    try {
      await this.ensureAuthenticated();

      // First get record ID
      const statusResult = await this.checkStatus(permitNumber);
      if (!statusResult.success || !statusResult.data) {
        throw new Error('Could not find permit');
      }

      // Get documents for record
      const response = await this.retry(async () => {
        return await this.client.get(
          `/${this.apiVersion}/records/${permitNumber}/documents`,
          {
            headers: {
              'x-accela-appid': this.config.clientId || '',
            },
          }
        );
      });

      const documents = (response.data.result || []).map((doc: any) => ({
        id: doc.id,
        name: doc.name,
        type: doc.type?.value,
        url: doc.url,
        uploadedAt: doc.uploadedDate,
      }));

      return {
        success: true,
        data: documents,
        tier: 'API',
        provider: 'ACCELA',
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get documents',
        tier: 'API',
        provider: 'ACCELA',
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Transform Kealee data to Accela format
   */
  transformToJurisdiction(data: PermitSubmissionData): any {
    return this.transformToAccelaFormat(data);
  }

  /**
   * Transform Accela data to Kealee format
   */
  transformFromJurisdiction(data: any): any {
    return {
      permitNumber: data.recordNumber,
      status: this.mapAccelaStatus(data.status?.value),
      submittedAt: data.createdDate ? new Date(data.createdDate) : undefined,
      approvedAt: data.approvedDate ? new Date(data.approvedDate) : undefined,
      jurisdictionRefNumber: data.recordNumber,
      metadata: data,
    };
  }

  /**
   * Ensure authenticated before API calls
   */
  private async ensureAuthenticated(): Promise<void> {
    if (!this.accessToken || (this.tokenExpiresAt && this.tokenExpiresAt <= new Date())) {
      const authenticated = await this.authenticate();
      if (!authenticated) {
        throw new Error('Failed to authenticate with Accela');
      }
    }
  }

  /**
   * Transform to Accela API format
   */
  private transformToAccelaFormat(data: PermitSubmissionData): any {
    return {
      record: {
        type: {
          value: this.mapPermitTypeToAccela(data.permitType),
        },
        customId: data.permitId,
        description: data.formData.scope || '',
        address: {
          street: data.formData.address || '',
          city: data.formData.city || '',
          state: data.formData.state || '',
          zip: data.formData.zip || '',
        },
        contacts: [
          {
            type: {
              value: 'Applicant',
            },
            person: {
              firstName: data.formData.applicantName?.split(' ')[0] || '',
              lastName: data.formData.applicantName?.split(' ').slice(1).join(' ') || '',
              email: data.formData.applicantEmail || '',
              phone: data.formData.applicantPhone || '',
            },
          },
        ],
        customForms: this.buildCustomForms(data.formData),
      },
    };
  }

  /**
   * Map Kealee permit type to Accela type
   */
  private mapPermitTypeToAccela(permitType: string): string {
    const mapping: Record<string, string> = {
      BUILDING: 'Building Permit',
      ELECTRICAL: 'Electrical Permit',
      PLUMBING: 'Plumbing Permit',
      MECHANICAL: 'Mechanical Permit',
      FIRE: 'Fire Permit',
    };
    return mapping[permitType] || permitType;
  }

  /**
   * Map Accela status to Kealee status
   */
  private mapAccelaStatus(accelaStatus?: string): string {
    if (!accelaStatus) return 'UNKNOWN';

    const mapping: Record<string, string> = {
      'Pending': 'SUBMITTED',
      'In Review': 'UNDER_REVIEW',
      'Approved': 'APPROVED',
      'Issued': 'ISSUED',
      'Rejected': 'REJECTED',
      'Cancelled': 'CANCELLED',
    };

    return mapping[accelaStatus] || accelaStatus.toUpperCase().replace(/\s+/g, '_');
  }

  /**
   * Build Accela custom forms from form data
   */
  private buildCustomForms(formData: Record<string, any>): any[] {
    // Transform form fields to Accela custom form format
    const forms: any[] = [];
    
    // Example: Build valuation form
    if (formData.valuation) {
      forms.push({
        id: 'Valuation',
        fields: [
          {
            id: 'ValuationAmount',
            value: formData.valuation.toString(),
          },
        ],
      });
    }

    return forms;
  }
}
