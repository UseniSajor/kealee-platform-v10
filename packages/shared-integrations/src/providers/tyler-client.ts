// ============================================================
// TYLER API CLIENT
// Integration with Tyler Technologies (EnerGov, etc.)
// ============================================================

import { BaseAPIClient } from './base-client';
import { IntegrationConfig, IntegrationResult, PermitSubmissionData, StatusCheckResult } from '../types';
import axios from 'axios';

export class TylerClient extends BaseAPIClient {
  private apiVersion: string = 'v1';

  constructor(config: IntegrationConfig) {
    super(config);
  }

  /**
   * Authenticate with Tyler API
   */
  async authenticate(): Promise<boolean> {
    try {
      if (!this.config.oauthConfig) {
        // Try API key authentication
        if (this.config.apiKey) {
          this.accessToken = this.config.apiKey;
          return true;
        }
        throw new Error('OAuth2 or API key required for Tyler');
      }

      const response = await axios.post(
        this.config.oauthConfig.tokenUrl,
        {
          grant_type: 'client_credentials',
          client_id: this.config.oauthConfig.clientId,
          client_secret: this.config.oauthConfig.clientSecret,
          scope: this.config.oauthConfig.scope.join(' '),
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
      console.error('Tyler authentication error:', error);
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

      // Transform to Tyler format
      const tylerData = this.transformToTylerFormat(data);

      const response = await this.retry(async () => {
        return await this.client.post(
          `/api/${this.apiVersion}/permits`,
          tylerData,
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
          permitNumber: response.data.permitNumber,
          permitId: response.data.id,
          confirmationNumber: response.data.confirmationNumber,
          submittedAt: new Date(),
        },
        tier: 'API',
        provider: 'TYLER',
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Tyler submission failed',
        tier: 'API',
        provider: 'TYLER',
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
          `/api/${this.apiVersion}/permits/${permitNumber}`,
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
          permitNumber: response.data.permitNumber,
          status: this.mapTylerStatus(response.data.status),
          lastUpdated: new Date(response.data.lastModifiedDate || response.data.createdDate),
          comments: response.data.comments || [],
        },
        tier: 'API',
        provider: 'TYLER',
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Status check failed',
        tier: 'API',
        provider: 'TYLER',
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
          `/api/${this.apiVersion}/permits/${permitNumber}/documents`,
          {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
            },
          }
        );
      });

      const documents = (response.data.documents || []).map((doc: any) => ({
        id: doc.id,
        name: doc.name,
        type: doc.documentType,
        url: doc.downloadUrl,
        uploadedAt: doc.uploadedDate,
      }));

      return {
        success: true,
        data: documents,
        tier: 'API',
        provider: 'TYLER',
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get documents',
        tier: 'API',
        provider: 'TYLER',
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Transform Kealee data to Tyler format
   */
  transformToJurisdiction(data: PermitSubmissionData): any {
    return this.transformToTylerFormat(data);
  }

  /**
   * Transform Tyler data to Kealee format
   */
  transformFromJurisdiction(data: any): any {
    return {
      permitNumber: data.permitNumber,
      status: this.mapTylerStatus(data.status),
      submittedAt: data.submittedDate ? new Date(data.submittedDate) : undefined,
      approvedAt: data.approvedDate ? new Date(data.approvedDate) : undefined,
      jurisdictionRefNumber: data.permitNumber,
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
        throw new Error('Failed to authenticate with Tyler');
      }
    }
  }

  /**
   * Transform to Tyler API format
   */
  private transformToTylerFormat(data: PermitSubmissionData): any {
    return {
      permitType: this.mapPermitTypeToTyler(data.permitType),
      projectDescription: data.formData.scope || '',
      estimatedValue: data.formData.valuation || 0,
      applicant: {
        firstName: data.formData.applicantName?.split(' ')[0] || '',
        lastName: data.formData.applicantName?.split(' ').slice(1).join(' ') || '',
        email: data.formData.applicantEmail || '',
        phone: data.formData.applicantPhone || '',
      },
      property: {
        address: data.formData.address || '',
        city: data.formData.city || '',
        state: data.formData.state || '',
        zipCode: data.formData.zip || '',
        parcelNumber: data.formData.parcelNumber || '',
      },
      customFields: this.buildCustomFields(data.formData),
    };
  }

  /**
   * Map permit type to Tyler format
   */
  private mapPermitTypeToTyler(permitType: string): string {
    const mapping: Record<string, string> = {
      BUILDING: 'Building',
      ELECTRICAL: 'Electrical',
      PLUMBING: 'Plumbing',
      MECHANICAL: 'Mechanical',
    };
    return mapping[permitType] || permitType;
  }

  /**
   * Map Tyler status to Kealee status
   */
  private mapTylerStatus(tylerStatus?: string): string {
    if (!tylerStatus) return 'UNKNOWN';

    const mapping: Record<string, string> = {
      'Submitted': 'SUBMITTED',
      'Under Review': 'UNDER_REVIEW',
      'Approved': 'APPROVED',
      'Issued': 'ISSUED',
      'Rejected': 'REJECTED',
    };

    return mapping[tylerStatus] || tylerStatus.toUpperCase().replace(/\s+/g, '_');
  }

  /**
   * Build custom fields
   */
  private buildCustomFields(formData: Record<string, any>): Record<string, any> {
    const fields: Record<string, any> = {};
    
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== 'scope' && key !== 'valuation' && key !== 'address') {
        fields[key] = value;
      }
    });

    return fields;
  }
}
