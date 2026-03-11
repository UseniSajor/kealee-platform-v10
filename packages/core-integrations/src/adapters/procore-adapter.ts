/**
 * Procore Adapter — Construction management integration
 */

import { IntegrationAdapter, type AdapterHealthCheck } from '../adapter';

export class ProcoreAdapter extends IntegrationAdapter {
  constructor() {
    super({
      name: 'procore',
      baseUrl: process.env.PROCORE_BASE_URL ?? 'https://api.procore.com/rest/v1.0',
      apiKey: process.env.PROCORE_ACCESS_TOKEN,
      timeout: 20000,
    });
  }

  async healthCheck(): Promise<AdapterHealthCheck> {
    const start = Date.now();
    try {
      await this.request('GET', '/me');
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

  async getProjects(companyId: string) {
    return this.request('GET', `/companies/${companyId}/projects`);
  }

  async getProject(projectId: string) {
    return this.request('GET', `/projects/${projectId}`);
  }

  async getRFIs(projectId: string) {
    return this.request('GET', `/projects/${projectId}/rfis`);
  }

  async getSubmittals(projectId: string) {
    return this.request('GET', `/projects/${projectId}/submittals`);
  }

  async getDailyLogs(projectId: string, date: string) {
    return this.request('GET', `/projects/${projectId}/daily_logs?log_date=${date}`);
  }
}
