/**
 * API Client for Estimation Tool
 * Connects to backend estimation-tool package
 */

import { createBrowserClient } from '@supabase/ssr';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  private async getAuthHeader(): Promise<Record<string, string>> {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        return { 'Authorization': `Bearer ${session.access_token}` };
      }
    } catch {
      // Auth not available, proceed without token
    }
    return {};
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const authHeaders = await this.getAuthHeader();
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        return {
          success: false,
          error: error.message || 'An error occurred',
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Estimates
  async getEstimates(params?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
    projectId?: string;
  }) {
    if (params?.projectId) {
      return this.request(`/estimation/project/${params.projectId}`);
    }
    const filteredParams: Record<string, string> = {};
    if (params?.search) filteredParams.search = params.search;
    if (params?.status && params.status !== 'all') filteredParams.status = params.status;
    if (params?.page) filteredParams.page = String(params.page);
    if (params?.limit) filteredParams.limit = String(params.limit);
    const query = new URLSearchParams(filteredParams).toString();
    return this.request(`/estimation/project${query ? `?${query}` : ''}`);
  }

  async getEstimate(id: string) {
    return this.request(`/estimation/project/${id}`);
  }

  async createEstimate(data: any) {
    return this.request('/estimation/estimate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEstimate(id: string, data: any) {
    return this.request(`/estimation/estimate/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEstimate(id: string) {
    return this.request(`/estimation/estimate/${id}`, {
      method: 'DELETE',
    });
  }

  async exportEstimate(id: string, format: 'pdf' | 'excel' | 'csv') {
    // Export is handled client-side
    return this.request(`/estimation/estimate/${id}`);
  }

  // AI Features - Scope Analysis
  async analyzeScope(description: string) {
    return this.request('/api/v1/scope-analysis/analyze', {
      method: 'POST',
      body: JSON.stringify({ description }),
    });
  }

  async getProjectTypes() {
    return this.request('/api/v1/scope-analysis/project-types');
  }

  async predictCost(estimateData: any) {
    return this.request('/estimation/estimate', {
      method: 'POST',
      body: JSON.stringify({ ...estimateData, predictOnly: true }),
    });
  }

  async suggestAssemblies(projectType: string, location: string) {
    return this.request(`/api/v1/assemblies?projectType=${encodeURIComponent(projectType)}&location=${encodeURIComponent(location)}`);
  }

  async valueEngineer(estimateId: string) {
    return this.request(`/estimation/estimate/${estimateId}`, {
      method: 'POST',
      body: JSON.stringify({ action: 'value-engineer' }),
    });
  }

  // Assemblies
  async getAssemblies(params?: {
    search?: string;
    category?: string;
    page?: number;
  }) {
    const filteredParams: Record<string, string> = {};
    if (params?.search) filteredParams.search = params.search;
    if (params?.category) filteredParams.category = params.category;
    if (params?.page) filteredParams.page = String(params.page);
    const query = new URLSearchParams(filteredParams).toString();
    return this.request(`/api/v1/assemblies${query ? `?${query}` : ''}`);
  }

  async getAssembly(code: string) {
    return this.request(`/api/v1/assemblies/${encodeURIComponent(code)}`);
  }

  async createAssembly(data: any) {
    return this.request('/api/v1/assemblies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Cost Database
  async getMaterials(params?: { search?: string; division?: string }) {
    const filteredParams: Record<string, string> = {};
    if (params?.search) filteredParams.search = params.search;
    if (params?.division) filteredParams.division = params.division;
    const query = new URLSearchParams(filteredParams).toString();
    return this.request(`/estimation/data/materials${query ? `?${query}` : ''}`);
  }

  async getLaborRates(location?: string) {
    return this.request(
      `/estimation/data/labor-rates${location ? `?location=${encodeURIComponent(location)}` : ''}`
    );
  }

  async getEquipmentRates() {
    return this.request('/estimation/data/equipment-rates');
  }

  // Takeoff
  async uploadPlan(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const authHeaders = await this.getAuthHeader();
    return fetch(`${this.baseUrl}/estimation/takeoff/upload`, {
      method: 'POST',
      headers: {
        ...authHeaders,
      },
      body: formData,
    }).then((res) => res.json());
  }

  async extractQuantities(planId: string) {
    return this.request(`/estimation/takeoff/${planId}/extract`, {
      method: 'POST',
    });
  }

  // Stats / Metrics
  async getStats() {
    return this.request('/estimation/metrics');
  }
}

export const apiClient = new ApiClient();
