/**
 * API Client for m-permits-inspections
 * Centralized API client with authentication and error handling
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiError {
  error: string;
  message: string;
  details?: any;
}

class ApiClient {
  private baseUrl: string;
  private getAuthToken: () => string | null;

  constructor() {
    this.baseUrl = API_URL;
    // Get auth token from Supabase session
    this.getAuthToken = () => {
      if (typeof window === 'undefined') return null;
      // Try to get from localStorage or session
      const session = localStorage.getItem('supabase.auth.token');
      if (session) {
        try {
          const parsed = JSON.parse(session);
          return parsed?.access_token || null;
        } catch {
          return null;
        }
      }
      return null;
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: 'Unknown Error',
        message: `HTTP ${response.status}: ${response.statusText}`,
      }));

      throw new Error(error.message || error.error || 'API request failed');
    }

    return response.json();
  }

  // Permit endpoints
  permits = {
    // Create permit application
    create: async (data: {
      address: string;
      jurisdictionId: string;
      permitTypes: string[];
      projectDetails: Record<string, any>;
      applicantInfo: Record<string, any>;
    }) => {
      return this.request<{ permit: any }>('/api/permits', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    // Get permit by ID
    get: async (id: string) => {
      return this.request<{ permit: any }>(`/api/permits/${id}`);
    },

    // List permits
    list: async (filters?: { status?: string; jurisdictionId?: string }) => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.jurisdictionId) params.append('jurisdictionId', filters.jurisdictionId);
      
      return this.request<{ permits: any[] }>(
        `/api/permits?${params.toString()}`
      );
    },

    // AI review
    aiReview: async (id: string, data?: { documentIds?: string[] }) => {
      return this.request<{ aiReview: any; review: any }>(
        `/api/permits/${id}/ai-review`,
        {
          method: 'POST',
          body: JSON.stringify(data || {}),
        }
      );
    },

    // Submit permit
    submit: async (id: string) => {
      return this.request<{ permit: any }>(`/api/permits/${id}/submit`, {
        method: 'POST',
      });
    },
  };

  // Jurisdiction endpoints
  jurisdictions = {
    // List all jurisdictions
    list: async () => {
      return this.request<{ jurisdictions: any[] }>('/api/jurisdictions');
    },

    // Get jurisdiction by ID
    get: async (id: string) => {
      return this.request<{ jurisdiction: any }>(`/api/jurisdictions/${id}`);
    },
  };

  // Google Places endpoints
  places = {
    // Autocomplete addresses
    autocomplete: async (input: string, options?: {
      location?: { lat: number; lng: number };
      radius?: number;
    }) => {
      return this.request<{ predictions: any[] }>(
        '/api/google-places/autocomplete',
        {
          method: 'POST',
          body: JSON.stringify({ input, ...options }),
        }
      );
    },

    // Geocode address
    geocode: async (address: string) => {
      return this.request<{ result: any }>('/api/google-places/geocode', {
        method: 'POST',
        body: JSON.stringify({ address }),
      });
    },

    // Detect jurisdiction from address
    detectJurisdiction: async (address: string) => {
      return this.request<{ jurisdiction: any }>(
        '/api/google-places/detect-jurisdiction',
        {
          method: 'POST',
          body: JSON.stringify({ address }),
        }
      );
    },
  };

  // File upload endpoints
  files = {
    // Get presigned URL for upload
    getPresignedUrl: async (fileName: string, mimeType: string) => {
      return this.request<{
        url: string;
        key: string;
        fileId: string;
        expiresAt: string;
      }>('/api/files/presigned-url', {
        method: 'POST',
        body: JSON.stringify({ fileName, mimeType }),
      });
    },

    // Complete upload
    completeUpload: async (data: {
      key: string;
      fileName: string;
      mimeType: string;
      size: number;
    }) => {
      return this.request<{ file: any }>('/api/files/complete', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  };
}

export const api = new ApiClient();




