/**
 * AdminApiClient
 * Type-safe API client for admin operations
 * 
 * Uses Clerk for authentication.
 */

import { getClerkToken } from '../clerk-token';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.kealee.com';

export class AdminApiClient {
  static async request<T = unknown>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const token = await getClerkToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (response.status === 401) {
      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/signin';
      }
      throw new Error('Authentication required');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        error: `HTTP ${response.status}` 
      }));
      throw new Error(error.message || error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  static async getUsers<T = unknown>(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.search) query.set('search', params.search);
    if (params?.role) query.set('role', params.role);
    if (params?.status) query.set('status', params.status);
    
    return this.request<T>(`/users?${query.toString()}`);
  }

  static async createUser(userData: {
    email: string;
    name: string;
    role: string;
    department?: string;
    password?: string;
  }) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  static async updateUser(userId: string, updates: {
    name?: string;
    role?: string;
    department?: string;
    status?: string;
    metadata?: Record<string, any>;
  }) {
    return this.request(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  static async deleteUser(userId: string) {
    return this.request(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // ============================================================================
  // SUBSCRIPTION MANAGEMENT
  // ============================================================================

  static async getSubscriptions(params?: {
    page?: number;
    limit?: number;
    status?: string;
    plan?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.status) query.set('status', params.status);
    if (params?.plan) query.set('plan', params.plan);
    
    return this.request(`/billing/subscriptions?${query.toString()}`);
  }

  static async updateSubscription(subscriptionId: string, updates: {
    status?: string;
    cancelAtPeriodEnd?: boolean;
    metadata?: Record<string, any>;
  }) {
    return this.request(`/billing/subscriptions/${subscriptionId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // ============================================================================
  // BILLING DASHBOARD
  // ============================================================================

  static async getBillingStats<T = unknown>(dateRange?: { start: string; end: string }) {
    const query = new URLSearchParams();
    if (dateRange?.start) query.set('start', dateRange.start);
    if (dateRange?.end) query.set('end', dateRange.end);
    
    return this.request<T>(`/billing/stats?${query.toString()}`);
  }

  static async getRevenueReport<T = unknown>(params: {
    startDate: string;
    endDate: string;
    groupBy: 'day' | 'week' | 'month';
  }) {
    const query = new URLSearchParams({
      startDate: params.startDate,
      endDate: params.endDate,
      groupBy: params.groupBy,
    });
    
    return this.request<T>(`/billing/reports/revenue?${query.toString()}`);
  }

  // ============================================================================
  // ANALYTICS DASHBOARD
  // ============================================================================

  static async getAnalytics(params?: {
    startDate?: string;
    endDate?: string;
    metrics?: string[];
  }) {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.metrics) query.set('metrics', params.metrics.join(','));
    
    return this.request(`/events/stats?${query.toString()}`);
  }

  // ============================================================================
  // SUPPORT TICKETS
  // ============================================================================

  static async getTickets(params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    assigneeId?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.status) query.set('status', params.status);
    if (params?.priority) query.set('priority', params.priority);
    if (params?.assigneeId) query.set('assigneeId', params.assigneeId);
    
    return this.request(`/ops-services/service-requests?${query.toString()}`);
  }

  static async updateTicket(ticketId: string, updates: {
    status?: string;
    priority?: string;
    assigneeId?: string;
    response?: string;
  }) {
    return this.request(`/ops-services/service-requests/${ticketId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // ============================================================================
  // SYSTEM LOGS
  // ============================================================================

  static async getLogs(params?: {
    page?: number;
    limit?: number;
    level?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.level) query.set('type', params.level);
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    
    return this.request(`/events?${query.toString()}`);
  }

  // ============================================================================
  // CONFIGURATION SETTINGS
  // ============================================================================

  static async getSettings<T = unknown>() {
    return this.request<T>('/admin/settings');
  }

  static async updateSettings(settings: Record<string, any>) {
    return this.request('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // ============================================================================
  // ROLE PERMISSIONS
  // ============================================================================

  static async getRoles() {
    return this.request('/rbac/roles');
  }

  static async updateRole(roleId: string, permissions: string[]) {
    return this.request(`/rbac/roles/${roleId}`, {
      method: 'PATCH',
      body: JSON.stringify({ permissions }),
    });
  }

  // ============================================================================
  // EMAIL TEMPLATES
  // ============================================================================

  static async getEmailTemplates() {
    return this.request('/admin/email-templates');
  }

  static async updateEmailTemplate(templateId: string, updates: {
    subject?: string;
    body?: string;
    isActive?: boolean;
  }) {
    return this.request(`/admin/email-templates/${templateId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // ============================================================================
  // API KEYS MANAGEMENT
  // ============================================================================

  static async getApiKeys() {
    return this.request('/api-keys');
  }

  static async createApiKey(name: string, permissions: string[]) {
    return this.request('/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name, permissions }),
    });
  }

  static async revokeApiKey(apiKeyId: string) {
    return this.request(`/api-keys/${apiKeyId}/revoke`, {
      method: 'POST',
    });
  }

  // ============================================================================
  // AUDIT LOGS
  // ============================================================================

  static async getAuditLogs(params?: {
    page?: number;
    limit?: number;
    action?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.action) query.set('action', params.action);
    if (params?.userId) query.set('userId', params.userId);
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    
    return this.request(`/audit?${query.toString()}`);
  }
}
