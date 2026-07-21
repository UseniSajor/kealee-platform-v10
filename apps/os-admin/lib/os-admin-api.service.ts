/**
 * OS Admin API Service
 * Type-safe API client for admin operations using Supabase Auth
 * 
 * Usage:
 * - Client-side: Use directly (e.g., OsAdminApiService.getUsers())
 * - Server-side: Pass token from getSession() using fetchWithToken()
 */

import { supabase } from './supabase';
import { cookies } from 'next/headers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || 'http://localhost:3001';

export class OsAdminApiService {
  /**
   * Get authentication token from Supabase session
   */
  private static async getAuthToken(): Promise<string | null> {
    try {
      // Client-side: get from session
      if (typeof window !== 'undefined') {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token || null;
      }

      // Server-side: get from cookies
      const cookieStore = await cookies();
      const accessToken = cookieStore.get('sb-access-token')?.value;
      
      if (accessToken) {
        try {
          // If it's JSON, parse it
          const parsed = JSON.parse(accessToken);
          return parsed?.access_token || accessToken;
        } catch {
          // If it's already a string, use it directly
          return accessToken;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  /**
   * Server-side helper: Make authenticated request with explicit token
   * Use this in Server Components or Server Actions
   */
  static async fetchWithToken(endpoint: string, token: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error?.message || error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Make authenticated API request
   */
  private static async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const token = await this.getAuthToken();

    if (!token) {
      throw new Error('Not authenticated');
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error?.message || error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  static async getUsers(params?: { page?: number; limit?: number; search?: string; status?: string; role?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    if (params?.role) query.set('role', params.role);
    
    return this.fetchWithAuth(`/users?${query.toString()}`);
  }

  static async getUser(userId: string) {
    return this.fetchWithAuth(`/users/${userId}`);
  }

  static async createUser(userData: {
    email: string;
    password: string;
    name: string;
    role?: string;
    department?: string;
  }) {
    // User creation is done through auth signup
    // Note: role and department would need to be set after user creation via org membership
    return this.fetchWithAuth('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        name: userData.name,
      }),
    });
  }

  static async updateUser(userId: string, updates: Partial<{
    name: string;
    phone: string;
    avatar: string;
  }>) {
    return this.fetchWithAuth(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // ============================================================================
  // SUBSCRIPTION MANAGEMENT
  // ============================================================================

  static async getSubscriptions(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) {
    // Use the billing subscriptions endpoint
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    
    return this.fetchWithAuth(`/billing/subscriptions${query.toString() ? `?${query.toString()}` : ''}`);
  }

  static async getSubscriptionDetails(subscriptionId: string) {
    return this.fetchWithAuth(`/billing/subscriptions/${subscriptionId}`);
  }

  static async updateSubscription(subscriptionId: string, updates: {
    action: 'cancel' | 'reactivate' | 'upgrade' | 'downgrade';
    newPriceId?: string;
  }) {
    return this.fetchWithAuth(`/billing/subscriptions/${subscriptionId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // ============================================================================
  // BILLING DASHBOARD
  // ============================================================================

  static async getBillingStats(dateRange?: { start: Date; end: Date }) {
    // Use the revenue report endpoint
    const query = new URLSearchParams();
    if (dateRange?.start) query.set('startDate', dateRange.start.toISOString());
    if (dateRange?.end) query.set('endDate', dateRange.end.toISOString());
    
    return this.fetchWithAuth(`/billing/reports/revenue${query.toString() ? `?${query.toString()}` : ''}`);
  }

  static async getRevenueReport(params: {
    startDate: Date;
    endDate: Date;
    groupBy?: 'day' | 'week' | 'month';
  }) {
    const query = new URLSearchParams({
      startDate: params.startDate.toISOString(),
      endDate: params.endDate.toISOString(),
    });
    if (params.groupBy) query.set('groupBy', params.groupBy);
    
    return this.fetchWithAuth(`/billing/reports/revenue?${query.toString()}`);
  }

  static async getSubscriptionMetrics(params?: {
    startDate?: Date;
    endDate?: Date;
  }) {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate.toISOString());
    if (params?.endDate) query.set('endDate', params.endDate.toISOString());
    
    return this.fetchWithAuth(`/billing/reports/subscription-metrics${query.toString() ? `?${query.toString()}` : ''}`);
  }

  // ============================================================================
  // ANALYTICS DASHBOARD
  // ============================================================================

  static async getAnalytics(params?: {
    startDate?: Date;
    endDate?: Date;
    metrics?: string[];
  }) {
    // Use events endpoint for analytics
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate.toISOString());
    if (params?.endDate) query.set('endDate', params.endDate.toISOString());
    if (params?.metrics) query.set('type', params.metrics.join(','));
    
    return this.fetchWithAuth(`/events${query.toString() ? `?${query.toString()}` : ''}`);
  }

  // ============================================================================
  // SUPPORT TICKETS (Service Requests)
  // ============================================================================

  static async getTickets(params?: {
    status?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }) {
    // Use service requests endpoint
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.priority) query.set('priority', params.priority);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    
    return this.fetchWithAuth(`/ops-services/service-requests${query.toString() ? `?${query.toString()}` : ''}`);
  }

  static async updateTicket(ticketId: string, updates: {
    status?: string;
    priority?: string;
    assignedTo?: string;
    response?: string;
  }) {
    // Use service request status update endpoint
    const body: any = {};
    if (updates.status) body.status = updates.status;
    if (updates.assignedTo) body.assignedTo = updates.assignedTo;
    
    return this.fetchWithAuth(`/ops-services/service-requests/${ticketId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  // ============================================================================
  // SYSTEM LOGS (Events)
  // ============================================================================

  static async getLogs(params?: {
    level?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    // Use events endpoint
    const query = new URLSearchParams();
    if (params?.level) query.set('type', params.level);
    if (params?.startDate) query.set('startDate', params.startDate.toISOString());
    if (params?.endDate) query.set('endDate', params.endDate.toISOString());
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    
    return this.fetchWithAuth(`/events${query.toString() ? `?${query.toString()}` : ''}`);
  }

  // ============================================================================
  // CONFIGURATION SETTINGS
  // ============================================================================

  static async getSettings() {
    return this.fetchWithAuth('/admin/settings');
  }

  static async updateSettings(settings: Record<string, any>) {
    return this.fetchWithAuth('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // ============================================================================
  // ROLE PERMISSIONS (RBAC)
  // ============================================================================

  static async getRoles() {
    return this.fetchWithAuth('/rbac/roles');
  }

  static async getRole(roleKey: string) {
    return this.fetchWithAuth(`/rbac/roles/${roleKey}`);
  }

  static async updateRole(roleKey: string, updates: {
    name?: string;
    description?: string;
    permissions?: string[];
  }) {
    return this.fetchWithAuth(`/admin/roles/${roleKey}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  static async createRole(data: {
    key: string;
    name: string;
    description?: string;
  }) {
    return this.fetchWithAuth('/rbac/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ============================================================================
  // EMAIL TEMPLATES
  // ============================================================================

  static async getEmailTemplates() {
    return this.fetchWithAuth('/admin/email-templates');
  }

  static async updateEmailTemplate(templateId: string, updates: {
    subject?: string;
    body?: string;
    isActive?: boolean;
  }) {
    return this.fetchWithAuth(`/admin/email-templates/${templateId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // ============================================================================
  // API KEYS MANAGEMENT
  // ============================================================================

  static async getApiKeys() {
    return this.fetchWithAuth('/api-keys');
  }

  static async createApiKey(name: string, permissions: string[]) {
    return this.fetchWithAuth('/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name, permissions }),
    });
  }

  static async revokeApiKey(apiKeyId: string) {
    return this.fetchWithAuth(`/api-keys/${apiKeyId}/revoke`, {
      method: 'POST',
    });
  }

  // ============================================================================
  // AUDIT LOGS
  // ============================================================================

  static async getAuditLogs(params?: {
    action?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
    entityType?: string;
    entityId?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.action) query.set('action', params.action);
    if (params?.userId) query.set('userId', params.userId);
    if (params?.startDate) query.set('startDate', params.startDate.toISOString());
    if (params?.endDate) query.set('endDate', params.endDate.toISOString());
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.entityType) query.set('entityType', params.entityType);
    if (params?.entityId) query.set('entityId', params.entityId);
    
    return this.fetchWithAuth(`/audit${query.toString() ? `?${query.toString()}` : ''}`);
  }

  static async getAuditLog(auditLogId: string) {
    return this.fetchWithAuth(`/audit/${auditLogId}`);
  }

  // ============================================================================
  // ORGANIZATIONS (Admin View)
  // ============================================================================

  static async getOrgs(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    
    return this.fetchWithAuth(`/orgs${query.toString() ? `?${query.toString()}` : ''}`);
  }

  static async getOrg(orgId: string) {
    return this.fetchWithAuth(`/orgs/${orgId}`);
  }

  static async updateOrg(orgId: string, updates: {
    name?: string;
    description?: string;
    logo?: string;
  }) {
    return this.fetchWithAuth(`/orgs/${orgId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }
}
