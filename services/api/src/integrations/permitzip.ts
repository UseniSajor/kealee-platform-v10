/**
 * PermitZIP Integration
 * Integration with PermitZIP for jurisdiction data and permit processing
 */

import axios from 'axios';

const PERMITZIP_API_URL = process.env.PERMITZIP_API_URL || 'https://api.permitzip.com/v1';
const PERMITZIP_API_KEY = process.env.PERMITZIP_API_KEY;

interface PermitZIPJurisdiction {
  id: string;
  name: string;
  state: string;
  county: string;
  city: string;
  contactInfo: {
    phone: string;
    email: string;
    website: string;
  };
  processingTimes: {
    building: number;
    electrical: number;
    mechanical: number;
    plumbing: number;
  };
  fees: {
    building: number;
    electrical: number;
    mechanical: number;
    plumbing: number;
  };
}

export class PermitZIPService {
  private apiKey: string;

  constructor() {
    if (!PERMITZIP_API_KEY) {
      console.warn('⚠️  PermitZIP API key not configured');
    }
    this.apiKey = PERMITZIP_API_KEY || '';
  }

  /**
   * Search jurisdictions
   */
  async searchJurisdictions(query: {
    state?: string;
    city?: string;
    zipCode?: string;
  }): Promise<PermitZIPJurisdiction[]> {
    if (!this.apiKey) {
      throw new Error('PermitZIP API key not configured');
    }

    try {
      const response = await axios.get(`${PERMITZIP_API_URL}/jurisdictions/search`, {
        params: query,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data.jurisdictions || [];
    } catch (error) {
      console.error('PermitZIP API error:', error);
      throw error;
    }
  }

  /**
   * Get jurisdiction details
   */
  async getJurisdiction(jurisdictionId: string): Promise<PermitZIPJurisdiction | null> {
    if (!this.apiKey) {
      throw new Error('PermitZIP API key not configured');
    }

    try {
      const response = await axios.get(
        `${PERMITZIP_API_URL}/jurisdictions/${jurisdictionId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('PermitZIP API error:', error);
      return null;
    }
  }

  /**
   * Submit permit application via PermitZIP
   */
  async submitPermit(permitData: {
    jurisdictionId: string;
    permitType: string;
    documents: string[];
    applicantInfo: any;
  }): Promise<{ confirmationNumber: string; status: string }> {
    if (!this.apiKey) {
      throw new Error('PermitZIP API key not configured');
    }

    try {
      const response = await axios.post(
        `${PERMITZIP_API_URL}/permits/submit`,
        permitData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        confirmationNumber: response.data.confirmationNumber,
        status: response.data.status,
      };
    } catch (error) {
      console.error('PermitZIP submission error:', error);
      throw error;
    }
  }

  /**
   * Check permit status
   */
  async checkPermitStatus(confirmationNumber: string): Promise<{
    status: string;
    lastUpdate: Date;
    comments: string[];
  }> {
    if (!this.apiKey) {
      throw new Error('PermitZIP API key not configured');
    }

    try {
      const response = await axios.get(
        `${PERMITZIP_API_URL}/permits/${confirmationNumber}/status`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      return {
        status: response.data.status,
        lastUpdate: new Date(response.data.lastUpdate),
        comments: response.data.comments || [],
      };
    } catch (error) {
      console.error('PermitZIP status check error:', error);
      throw error;
    }
  }

  /**
   * Sync jurisdiction database
   */
  async syncJurisdictionDatabase(): Promise<number> {
    if (!this.apiKey) {
      throw new Error('PermitZIP API key not configured');
    }

    console.log('🔄 Syncing jurisdiction database from PermitZIP...');

    try {
      // Get all jurisdictions from PermitZIP
      const response = await axios.get(`${PERMITZIP_API_URL}/jurisdictions`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        params: {
          limit: 10000, // Get all
        },
      });

      const jurisdictions = response.data.jurisdictions || [];
      console.log(`📥 Retrieved ${jurisdictions.length} jurisdictions`);

      // TODO: Import into Prisma database
      // This would be implemented based on your data model

      return jurisdictions.length;
    } catch (error) {
      console.error('PermitZIP sync error:', error);
      throw error;
    }
  }
}

export const permitZIPService = new PermitZIPService();
