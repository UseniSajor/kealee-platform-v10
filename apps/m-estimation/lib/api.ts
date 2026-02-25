/**
 * API Client for Estimation Tool
 * Connects to backend estimation-tool package
 */

import { supabase } from '@kealee/auth/client';

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
    return this.request(`/estimation/estimate/${id}`);
  }

  async createEstimate(data: any) {
    return this.request('/estimation/estimates', {
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
    return this.request('/estimation/ai/scope-analysis', {
      method: 'POST',
      body: JSON.stringify({ description }),
    });
  }

  async getProjectTypes() {
    return this.request('/estimation/ai/project-types');
  }

  async predictCost(estimateData: any) {
    return this.request('/estimation/ai/cost-prediction', {
      method: 'POST',
      body: JSON.stringify(estimateData),
    });
  }

  async suggestAssemblies(projectType: string, location: string) {
    return this.request('/estimation/ai/suggest-assemblies', {
      method: 'POST',
      body: JSON.stringify({ projectType, location }),
    });
  }

  async valueEngineer(estimateId: string) {
    return this.request('/estimation/ai/value-engineering', {
      method: 'POST',
      body: JSON.stringify({ estimateId }),
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
    return this.request(`/estimation/assemblies${query ? `?${query}` : ''}`);
  }

  async getAssembly(code: string) {
    return this.request(`/estimation/assemblies/${encodeURIComponent(code)}`);
  }

  async createAssembly(data: any) {
    return this.request('/estimation/assemblies', {
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

  // Assemblies - Extended
  async getAssemblyById(id: string) {
    return this.request(`/estimation/assemblies/${encodeURIComponent(id)}`);
  }

  async updateAssembly(id: string, data: any) {
    return this.request(`/estimation/assemblies/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAssembly(id: string) {
    return this.request(`/estimation/assemblies/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  async getAssemblyTemplates() {
    return this.request('/estimation/assembly-library/templates');
  }

  async createFromTemplate(templateCode: string) {
    return this.request('/estimation/assembly-library/create-from-template', {
      method: 'POST',
      body: JSON.stringify({ templateCode }),
    });
  }

  // Cost Database - Extended
  async getCostDatabases() {
    return this.request('/estimation/databases');
  }

  async getRegionalIndices() {
    return this.request('/estimation/regional-indices');
  }

  // Takeoff - Extended
  async getTakeoffs() {
    return this.request('/estimation/takeoffs');
  }

  async getTakeoff(id: string) {
    return this.request(`/estimation/takeoffs/${id}`);
  }

  async createTakeoff(data: any) {
    return this.request('/estimation/takeoffs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async addMeasurement(takeoffId: string, data: any) {
    return this.request(`/estimation/takeoffs/${takeoffId}/measurements`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTakeoffSummary(id: string) {
    return this.request(`/estimation/takeoffs/${id}/summary`);
  }

  // AI - Extended
  async aiScopeAnalysis(data: { description: string; projectType?: string }) {
    return this.request('/estimation/ai/scope-analysis', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async aiCostPrediction(data: any) {
    return this.request('/estimation/ai/cost-prediction', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async aiValueEngineering(estimateId: string) {
    return this.request('/estimation/ai/value-engineering', {
      method: 'POST',
      body: JSON.stringify({ estimateId }),
    });
  }

  async aiCompareEstimates(estimateIds: string[]) {
    return this.request('/estimation/ai/compare-estimates', {
      method: 'POST',
      body: JSON.stringify({ estimateIds }),
    });
  }

  async aiBenchmark(estimateId: string) {
    return this.request('/estimation/ai/benchmark', {
      method: 'POST',
      body: JSON.stringify({ estimateId }),
    });
  }

  // Marketing / Leads
  async submitEstimationLead(data: any) {
    return this.request('/estimation/leads', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Stats / Metrics
  async getStats() {
    return this.request('/estimation/metrics');
  }

  // ========================================================================
  // Cost Book Import
  // ========================================================================

  // Upload a CSV cost book file
  async importCostBookCSV(
    file: File,
    type: 'materials' | 'labor' | 'equipment' | 'assemblies',
    costDatabaseId?: string,
    overwrite?: boolean
  ) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    if (costDatabaseId) formData.append('costDatabaseId', costDatabaseId);
    if (overwrite) formData.append('overwrite', 'true');

    const authHeaders = await this.getAuthHeader();
    try {
      const response = await fetch(`${this.baseUrl}/estimation/cost-code-pdf-import/import/csv`, {
        method: 'POST',
        headers: { ...authHeaders },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        return { success: false, error: error.error || error.message || 'Upload failed' };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Bulk import from JSON
  async importCostBookJSON(
    costDatabaseId: string,
    type: 'materials' | 'labor' | 'equipment' | 'assemblies',
    items: any[],
    overwrite?: boolean
  ) {
    return this.request('/estimation/cost-code-pdf-import/import/json', {
      method: 'POST',
      body: JSON.stringify({ costDatabaseId, type, items, overwrite }),
    });
  }

  // Download CSV template
  async getCostBookTemplate(type: 'materials' | 'labor' | 'equipment' | 'assemblies') {
    const authHeaders = await this.getAuthHeader();
    try {
      const response = await fetch(
        `${this.baseUrl}/estimation/cost-code-pdf-import/import/template/${type}`,
        { headers: { ...authHeaders } }
      );
      if (!response.ok) return { success: false, error: 'Failed to download template' };
      const text = await response.text();
      return { success: true, data: text };
    } catch {
      return { success: false, error: 'Network error' };
    }
  }

  // Create a new cost database
  async createCostDatabase(data: {
    name: string;
    description?: string;
    region: string;
    type: 'CUSTOM' | 'IMPORTED';
    version: string;
    source?: string;
  }) {
    return this.request('/estimation/cost-code-pdf-import/databases', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // List cost databases (with item counts)
  async listCostDatabases(params?: { region?: string; type?: string }) {
    const filteredParams: Record<string, string> = {};
    if (params?.region) filteredParams.region = params.region;
    if (params?.type) filteredParams.type = params.type;
    const query = new URLSearchParams(filteredParams).toString();
    return this.request(`/estimation/cost-code-pdf-import/databases${query ? `?${query}` : ''}`);
  }

  // ========================================================================
  // PDF Cost Code Import
  // ========================================================================

  // Upload a PDF cost book for AI extraction
  async importCostBookPDF(
    file: File,
    options?: {
      costDatabaseId?: string;
      name?: string;
      region?: string;
    }
  ) {
    const formData = new FormData();
    formData.append('file', file);
    if (options?.costDatabaseId) formData.append('costDatabaseId', options.costDatabaseId);
    if (options?.name) formData.append('name', options.name);
    if (options?.region) formData.append('region', options.region);

    const authHeaders = await this.getAuthHeader();
    try {
      const response = await fetch(`${this.baseUrl}/estimation/cost-code-pdf-import/pdf/upload`, {
        method: 'POST',
        headers: { ...authHeaders },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        return { success: false, error: error.error || error.message || 'Upload failed' };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // List PDF import jobs
  async listImportJobs(params?: { page?: number; limit?: number; status?: string }) {
    const filteredParams: Record<string, string> = {};
    if (params?.page) filteredParams.page = String(params.page);
    if (params?.limit) filteredParams.limit = String(params.limit);
    if (params?.status) filteredParams.status = params.status;
    const query = new URLSearchParams(filteredParams).toString();
    return this.request(`/estimation/cost-code-pdf-import/pdf/jobs${query ? `?${query}` : ''}`);
  }

  // Get single import job status
  async getImportJob(jobId: string) {
    return this.request(`/estimation/cost-code-pdf-import/pdf/jobs/${jobId}`);
  }

  // Delete an import job
  async deleteImportJob(jobId: string) {
    return this.request(`/estimation/cost-code-pdf-import/pdf/jobs/${jobId}`, {
      method: 'DELETE',
    });
  }

  // Get cost database detail
  async getCostDatabase(id: string) {
    return this.request(`/estimation/cost-code-pdf-import/databases/${id}`);
  }

  // Get paginated items from a cost database
  async getCostDatabaseItems(
    id: string,
    params?: {
      type?: 'materials' | 'labor' | 'equipment' | 'assemblies';
      search?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const filteredParams: Record<string, string> = {};
    if (params?.type) filteredParams.type = params.type;
    if (params?.search) filteredParams.search = params.search;
    if (params?.page) filteredParams.page = String(params.page);
    if (params?.limit) filteredParams.limit = String(params.limit);
    const query = new URLSearchParams(filteredParams).toString();
    return this.request(`/estimation/cost-code-pdf-import/databases/${id}/items${query ? `?${query}` : ''}`);
  }
  // ========================================================================
  // CTC (Construction Task Catalog)
  // ========================================================================

  // Upload CTC PDF for specialized import
  async importCTCPdf(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const authHeaders = await this.getAuthHeader();
    try {
      const response = await fetch(`${this.baseUrl}/estimation/cost-code-pdf-import/pdf/upload-ctc`, {
        method: 'POST',
        headers: { ...authHeaders },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        return { success: false, error: error.error || error.message || 'CTC upload failed' };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Search CTC tasks
  async searchCTCTasks(params: {
    query?: string;
    division?: string;
    category?: string;
    modifiersOnly?: boolean;
    page?: number;
    limit?: number;
  }) {
    return this.request('/estimation/ctc/search', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Get CTC divisions with task counts
  async getCTCDivisions() {
    return this.request('/estimation/ctc/divisions');
  }

  // Get a specific CTC task with modifiers
  async getCTCTask(taskNumber: string) {
    return this.request(`/estimation/ctc/tasks/${encodeURIComponent(taskNumber)}`);
  }

  // Create estimate from CTC tasks
  async createCTCEstimate(data: {
    name: string;
    projectName?: string;
    projectAddress?: string;
    tasks: Array<{ ctcTaskNumber: string; quantity: number; modifiers?: string[] }>;
    overheadPercent?: number;
    profitPercent?: number;
    contingencyPercent?: number;
  }) {
    return this.request('/estimation/ctc/estimate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ========================================================================
  // AI Takeoff
  // ========================================================================

  // Upload plans for AI takeoff
  async uploadAITakeoff(file: File, estimateId?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (estimateId) formData.append('estimateId', estimateId);

    const authHeaders = await this.getAuthHeader();
    try {
      const response = await fetch(`${this.baseUrl}/estimation/ai-takeoff/upload`, {
        method: 'POST',
        headers: { ...authHeaders },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        return { success: false, error: error.error || error.message || 'Takeoff upload failed' };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Get AI takeoff job status
  async getAITakeoffJob(jobId: string) {
    return this.request(`/estimation/ai-takeoff/${jobId}`);
  }

  // Confirm AI takeoff results
  async confirmAITakeoff(jobId: string, data: {
    estimateId?: string;
    adjustments?: Array<{ ctcTaskNumber: string; adjustedQuantity?: number; excluded?: boolean }>;
  }) {
    return this.request(`/estimation/ai-takeoff/${jobId}/confirm`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ========================================================================
  // Project Wizard
  // ========================================================================

  async createProjectWizard(data: {
    projectName: string;
    projectType: string;
    description?: string;
    location: { address: string; city: string; state: string; zipCode: string };
    squareFootage?: number;
    clientName?: string;
    clientEmail?: string;
    estimateSource?: 'ctc' | 'marketplace' | 'manual' | 'ai-takeoff';
    ctcTasks?: Array<{ ctcTaskNumber: string; quantity: number; modifiers?: string[] }>;
    takeoffJobId?: string;
    createBidRequest?: boolean;
    bidDueDate?: string;
    overheadPercent?: number;
    profitPercent?: number;
    contingencyPercent?: number;
  }) {
    return this.request('/estimation/project-wizard', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient();
