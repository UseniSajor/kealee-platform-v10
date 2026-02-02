/**
 * API Client for Estimation Tool
 * Connects to backend estimation-tool package
 */

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

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json();
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
  }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/api/estimates${query ? `?${query}` : ''}`);
  }

  async getEstimate(id: string) {
    return this.request(`/api/estimates/${id}`);
  }

  async createEstimate(data: any) {
    return this.request('/api/estimates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEstimate(id: string, data: any) {
    return this.request(`/api/estimates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEstimate(id: string) {
    return this.request(`/api/estimates/${id}`, {
      method: 'DELETE',
    });
  }

  async exportEstimate(id: string, format: 'pdf' | 'excel' | 'csv') {
    return this.request(`/api/estimates/${id}/export?format=${format}`);
  }

  // AI Features
  async analyzeScope(description: string) {
    return this.request('/api/ai/analyze-scope', {
      method: 'POST',
      body: JSON.stringify({ description }),
    });
  }

  async predictCost(estimateData: any) {
    return this.request('/api/ai/predict-cost', {
      method: 'POST',
      body: JSON.stringify(estimateData),
    });
  }

  async suggestAssemblies(projectType: string, location: string) {
    return this.request('/api/ai/suggest-assemblies', {
      method: 'POST',
      body: JSON.stringify({ projectType, location }),
    });
  }

  async valueEngineer(estimateId: string) {
    return this.request(`/api/ai/value-engineer/${estimateId}`, {
      method: 'POST',
    });
  }

  // Assemblies
  async getAssemblies(params?: {
    search?: string;
    category?: string;
    page?: number;
  }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/api/assemblies${query ? `?${query}` : ''}`);
  }

  async getAssembly(id: string) {
    return this.request(`/api/assemblies/${id}`);
  }

  async createAssembly(data: any) {
    return this.request('/api/assemblies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Cost Database
  async getMaterials(params?: { search?: string; division?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/api/cost-database/materials${query ? `?${query}` : ''}`);
  }

  async getLaborRates(location?: string) {
    return this.request(
      `/api/cost-database/labor${location ? `?location=${location}` : ''}`
    );
  }

  async getEquipmentRates() {
    return this.request('/api/cost-database/equipment');
  }

  // Takeoff
  async uploadPlan(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return fetch(`${this.baseUrl}/api/takeoff/upload`, {
      method: 'POST',
      body: formData,
    }).then((res) => res.json());
  }

  async extractQuantities(planId: string) {
    return this.request(`/api/takeoff/${planId}/extract`, {
      method: 'POST',
    });
  }

  // Stats
  async getStats() {
    return this.request('/api/stats');
  }
}

export const apiClient = new ApiClient();
