/**
 * BuildingConnected Integration
 * Integration for contractor/subcontractor network and jurisdiction data
 */

import axios from 'axios';
import { prisma } from '@kealee/database';

const BC_API_URL = process.env.BUILDINGCONNECTED_API_URL || 'https://api.buildingconnected.com/v1';
const BC_API_KEY = process.env.BUILDINGCONNECTED_API_KEY;

interface BCJurisdiction {
  id: string;
  name: string;
  location: {
    state: string;
    county: string;
    city: string;
  };
  contact: {
    phone: string;
    email: string;
    website: string;
    portalUrl?: string;
  };
  metadata: {
    avgProcessingDays: number;
    approvalRate: number;
    permitVolume: number;
  };
}

export class BuildingConnectedService {
  private apiKey: string;

  constructor() {
    if (!BC_API_KEY) {
      console.warn('⚠️  BuildingConnected API key not configured');
    }
    this.apiKey = BC_API_KEY || '';
  }

  /**
   * Get jurisdiction by location
   */
  async findJurisdiction(location: {
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  }): Promise<BCJurisdiction | null> {
    if (!this.apiKey) {
      console.warn('BuildingConnected not configured, skipping');
      return null;
    }

    try {
      const response = await axios.post(
        `${BC_API_URL}/jurisdictions/lookup`,
        location,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.jurisdiction || null;
    } catch (error) {
      console.error('BuildingConnected API error:', error);
      return null;
    }
  }

  /**
   * Get all available jurisdictions
   */
  async getAllJurisdictions(): Promise<BCJurisdiction[]> {
    if (!this.apiKey) {
      return [];
    }

    try {
      const response = await axios.get(`${BC_API_URL}/jurisdictions`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      return response.data.jurisdictions || [];
    } catch (error) {
      console.error('BuildingConnected API error:', error);
      return [];
    }
  }

  /**
   * Get contractors for jurisdiction
   */
  async getContractorsForJurisdiction(
    jurisdictionId: string
  ): Promise<any[]> {
    if (!this.apiKey) {
      return [];
    }

    try {
      const response = await axios.get(
        `${BC_API_URL}/jurisdictions/${jurisdictionId}/contractors`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      return response.data.contractors || [];
    } catch (error) {
      console.error('BuildingConnected contractors API error:', error);
      return [];
    }
  }

  /**
   * Sync jurisdiction data to local database
   */
  async syncJurisdictions(): Promise<number> {
    console.log('🔄 Syncing jurisdictions from BuildingConnected...');

    const jurisdictions = await this.getAllJurisdictions();
    console.log(`📥 Retrieved ${jurisdictions.length} jurisdictions`);

    // Import jurisdiction data into Prisma
    let importedCount = 0;
    for (const j of jurisdictions) {
      try {
        await prisma.jurisdiction.upsert({
          where: { code: 'BC-' + j.location.state + '-' + j.id },
          update: {
            name: j.name,
            state: j.location.state,
            county: j.location.county || null,
            city: j.location.city || null,
            apiUrl: j.contact.portalUrl || null,
            portalUrl: j.contact.website || null,
          },
          create: {
            code: 'BC-' + j.location.state + '-' + j.id,
            name: j.name,
            state: j.location.state,
            county: j.location.county || null,
            city: j.location.city || null,
            integrationType: 'API_DIRECT',
            apiUrl: j.contact.portalUrl || null,
            portalUrl: j.contact.website || null,
            requiredDocuments: [],
            feeSchedule: {},
            formTemplates: [],
          },
        });
        importedCount++;
      } catch (err) {
        console.error('Failed to import jurisdiction ' + j.id + ':', err);
      }
    }

    console.log('Imported ' + importedCount + ' of ' + jurisdictions.length + ' jurisdictions');
    return importedCount;
  }
}

export const buildingConnectedService = new BuildingConnectedService();
