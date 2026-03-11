/**
 * GoHighLevel (GHL) Adapter — CRM integration
 * Migrated from ad-hoc services/api/src/modules/integrations/ghl/
 */

import { IntegrationAdapter, type AdapterHealthCheck } from '../adapter';

export interface GHLContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  tags?: string[];
  customFields?: Record<string, string>;
}

export interface GHLOpportunity {
  id: string;
  name: string;
  pipelineId: string;
  stageId: string;
  contactId: string;
  monetaryValue?: number;
  status: string;
}

export class GHLAdapter extends IntegrationAdapter {
  constructor() {
    super({
      name: 'ghl',
      baseUrl: process.env.GHL_BASE_URL ?? 'https://services.leadconnectorhq.com',
      apiKey: process.env.GHL_API_KEY,
      timeout: 15000,
    });
  }

  async healthCheck(): Promise<AdapterHealthCheck> {
    const start = Date.now();
    try {
      await this.request('GET', '/contacts/?limit=1');
      return {
        name: this.name,
        healthy: true,
        latencyMs: Date.now() - start,
        lastChecked: new Date().toISOString(),
      };
    } catch (err) {
      return {
        name: this.name,
        healthy: false,
        latencyMs: Date.now() - start,
        lastChecked: new Date().toISOString(),
        error: String(err),
      };
    }
  }

  async createContact(data: Partial<GHLContact>): Promise<GHLContact> {
    return this.request<GHLContact>('POST', '/contacts/', {
      ...data,
      locationId: process.env.GHL_LOCATION_ID,
    });
  }

  async updateContact(id: string, data: Partial<GHLContact>): Promise<GHLContact> {
    return this.request<GHLContact>('PUT', `/contacts/${id}`, data);
  }

  async getContact(id: string): Promise<GHLContact> {
    return this.request<GHLContact>('GET', `/contacts/${id}`);
  }

  async createOpportunity(data: Partial<GHLOpportunity>): Promise<GHLOpportunity> {
    return this.request<GHLOpportunity>('POST', '/opportunities/', {
      ...data,
      pipelineId: data.pipelineId ?? process.env.GHL_PIPELINE_ID,
    });
  }

  async updateOpportunityStage(id: string, stageId: string): Promise<GHLOpportunity> {
    return this.request<GHLOpportunity>('PUT', `/opportunities/${id}`, { stageId });
  }

  async syncContactFromUser(userData: {
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    tags?: string[];
  }): Promise<GHLContact> {
    return this.createContact({
      firstName: userData.firstName ?? '',
      lastName: userData.lastName ?? '',
      email: userData.email,
      phone: userData.phone,
      tags: [...(userData.tags ?? []), 'kealee-user'],
    });
  }
}
