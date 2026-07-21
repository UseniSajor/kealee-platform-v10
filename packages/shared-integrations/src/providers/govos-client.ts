// ============================================================
// GOVOS API CLIENT
// Integration with GovOS platform
// ============================================================

import { BaseAPIClient } from './base-client';
import { IntegrationConfig, IntegrationResult, PermitSubmissionData, StatusCheckResult } from '../types';
import axios from 'axios';

export class GovOSClient extends BaseAPIClient {
  private apiVersion: string = 'v1';

  constructor(config: IntegrationConfig) {
    super(config);
  }

  /**
   * Authenticate with GovOS API
   */
  async authenticate(): Promise<boolean> {
    try {
      if (!this.config.oauthConfig && !this.config.apiKey) {
        throw new Error('OAuth2 or API key required for GovOS');
      }

      if (this.config.apiKey) {
        // API key authentication
        this.accessToken = this.config.apiKey;
        return true;
      }

      // OAuth2 authentication
      const response = await axios.post(
        this.config.oauthConfig!.tokenUrl,
        {
          grant_type: 'client_credentials',
          client_id: this.config.oauthConfig!.clientId,
          client_secret: this.config.oauthConfig!.clientSecret,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      this.accessToken = response.data.access_token;
      const expiresIn = response.data.expires_in || 3600;
      this.tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

      return true;
    } catch (error) {
      console.error('GovOS authentication error:', error);
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

      const govosData = this.transformToGovOSFormat(data);

      const response = await this.retry(async () => {
        return await this.client.post(
          `/api/${this.apiVersion}/applications`,
          govosData,
          {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
            },
          }
        );
      });

      return {
        success: true,
        data: {
          permitNumber: response.data.applicationNumber,
          applicationId: response.data.id,
          confirmationNumber: response.data.confirmationNumber,
          submittedAt: new Date(),
        },
        tier: 'API',
        provider: 'GOVOS',
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'GovOS submission failed',
        tier: 'API',
        provider: 'GOVOS',
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
          `/api/${this.apiVersion}/applications/${permitNumber}`,
          {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
            },
          }
        );
      });

      return {
        success: true,
        data: {
          permitNumber: response.data.applicationNumber,
          status: this.mapGovOSStatus(response.data.status),
          lastUpdated: new Date(response.data.updatedAt || response.data.createdAt),
          comments: response.data.notes || [],
        },
        tier: 'API',
        provider: 'GOVOS',
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Status check failed',
        tier: 'API',
        provider: 'GOVOS',
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

      const response = await this.retry(async () => {
        return await this.client.get(
          `/api/${this.apiVersion}/applications/${permitNumber}/attachments`,
          {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
            },
          }
        );
      });

      const documents = (response.data.attachments || []).map((doc: any) => ({
        id: doc.id,
        name: doc.fileName,
        type: doc.category,
        url: doc.downloadUrl,
        uploadedAt: doc.uploadedDate,
      }));

      return {
        success: true,
        data: documents,
        tier: 'API',
        provider: 'GOVOS',
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get documents',
        tier: 'API',
        provider: 'GOVOS',
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Transform Kealee data to GovOS format
   */
  transformToJurisdiction(data: PermitSubmissionData): any {
    return this.transformToGovOSFormat(data);
  }

  /**
   * Transform GovOS data to Kealee format
   */
  transformFromJurisdiction(data: any): any {
    return {
      permitNumber: data.applicationNumber,
      status: this.mapGovOSStatus(data.status),
      submittedAt: data.submittedDate ? new Date(data.submittedDate) : undefined,
      approvedAt: data.approvedDate ? new Date(data.approvedDate) : undefined,
      jurisdictionRefNumber: data.applicationNumber,
      metadata: data,
    };
  }

  /**
   * Ensure authenticated
   */
  private async ensureAuthenticated(): Promise<void> {
    if (!this.accessToken || (this.tokenExpiresAt && this.tokenExpiresAt <= new Date())) {
      const authenticated = await this.authenticate();
      if (!authenticated) {
        throw new Error('Failed to authenticate with GovOS');
      }
    }
  }

  /**
   * Transform to GovOS API format
   */
  private transformToGovOSFormat(data: PermitSubmissionData): any {
    return {
      applicationType: this.mapPermitTypeToGovOS(data.permitType),
      description: data.formData.scope || '',
      projectValue: data.formData.valuation || 0,
      applicant: {
        name: data.formData.applicantName || '',
        email: data.formData.applicantEmail || '',
        phone: data.formData.applicantPhone || '',
      },
      property: {
        address: data.formData.address || '',
        city: data.formData.city || '',
        state: data.formData.state || '',
        zip: data.formData.zip || '',
        parcelId: data.formData.parcelNumber || '',
      },
      customData: this.buildCustomData(data.formData),
    };
  }

  /**
   * Map permit type to GovOS format
   */
  private mapPermitTypeToGovOS(permitType: string): string {
    const mapping: Record<string, string> = {
      BUILDING: 'Building Permit',
      ELECTRICAL: 'Electrical Permit',
      PLUMBING: 'Plumbing Permit',
      MECHANICAL: 'Mechanical Permit',
    };
    return mapping[permitType] || permitType;
  }

  /**
   * Map GovOS status to Kealee status
   */
  private mapGovOSStatus(govosStatus?: string): string {
    if (!govosStatus) return 'UNKNOWN';

    const mapping: Record<string, string> = {
      'New': 'SUBMITTED',
      'In Review': 'UNDER_REVIEW',
      'Approved': 'APPROVED',
      'Issued': 'ISSUED',
      'Denied': 'REJECTED',
    };

    return mapping[govosStatus] || govosStatus.toUpperCase().replace(/\s+/g, '_');
  }

  /**
   * Build custom data fields
   */
  private buildCustomData(formData: Record<string, any>): Record<string, any> {
    const custom: Record<string, any> = {};
    
    Object.entries(formData).forEach(([key, value]) => {
      if (!['scope', 'valuation', 'address', 'applicantName', 'applicantEmail', 'applicantPhone'].includes(key)) {
        custom[key] = value;
      }
    });

    return custom;
  }
}
