/**
 * Approval Workflow API Service
 * Type-safe API client for approval workflow operations using Supabase Auth
 * 
 * Note: Backend approval workflow endpoints may need to be created
 */

import { supabase } from '../supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || 'http://localhost:3001';

export interface ApprovalRequest {
  id: string;
  type: 'expense' | 'time_off' | 'purchase' | 'document' | 'custom';
  subtype?: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description?: string;
  requesterId: string;
  requesterName: string;
  amount?: number;
  currency?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  
  // Approval chain
  approvalChain: Array<{
    id: string;
    approverId: string;
    approverName: string;
    approverRole?: string;
    status: 'pending' | 'approved' | 'rejected' | 'skipped';
    comments?: string;
    approvedAt?: Date | string;
    rejectedAt?: Date | string;
    order: number;
    required: boolean;
  }>;
  
  currentStep?: number;
  approvedBy?: Array<{
    userId: string;
    userName: string;
    approvedAt: Date | string;
    comments?: string;
  }>;
  rejectedBy?: {
    userId: string;
    userName: string;
    rejectedAt: Date | string;
    comments: string;
  };
  
  metadata?: Record<string, any>;
  createdAt: Date | string;
  updatedAt: Date | string;
  submittedAt?: Date | string;
  completedAt?: Date | string;
}

export interface ApprovalRule {
  id: string;
  name: string;
  type: string;
  subtype?: string;
  conditions: Array<{
    field: string;
    operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in';
    value: any;
  }>;
  approvalChain: Array<{
    role: string;
    department?: string;
    order: number;
    required: boolean;
    fallbackApproverId?: string;
  }>;
  priority?: string;
  sla?: number; // in hours
  active: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export class ApprovalWorkflowService {
  /**
   * Get authentication token from Supabase session
   */
  private static async getAuthToken(): Promise<string | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
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

    // Don't set Content-Type for FormData
    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }

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
  // APPROVAL REQUESTS
  // ============================================================================

  static async getApprovalRequests(params?: {
    type?: string;
    status?: string;
    requesterId?: string;
    approverId?: string;
    startDate?: Date | string;
    endDate?: Date | string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    // Note: Backend route may need to be created (GET /pm/approvals)
    const query = new URLSearchParams();
    if (params?.type) query.set('type', params.type);
    if (params?.status) query.set('status', params.status);
    if (params?.requesterId) query.set('requesterId', params.requesterId);
    if (params?.approverId) query.set('approverId', params.approverId);
    if (params?.startDate) {
      query.set('startDate', typeof params.startDate === 'string' 
        ? params.startDate 
        : params.startDate.toISOString());
    }
    if (params?.endDate) {
      query.set('endDate', typeof params.endDate === 'string' 
        ? params.endDate 
        : params.endDate.toISOString());
    }
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    
    return this.fetchWithAuth(`/pm/approvals${query.toString() ? `?${query.toString()}` : ''}`);
  }

  static async getApprovalRequest(requestId: string) {
    // Note: Backend route may need to be created (GET /pm/approvals/:id)
    return this.fetchWithAuth(`/pm/approvals/${requestId}`);
  }

  static async createApprovalRequest(requestData: {
    type: string;
    subtype?: string;
    title: string;
    description?: string;
    priority?: string;
    amount?: number;
    currency?: string;
    startDate?: Date | string;
    endDate?: Date | string;
    attachments?: File[];
    metadata?: Record<string, any>;
  }) {
    // Note: Backend route may need to be created (POST /pm/approvals)
    const formData = new FormData();
    
    // Create data object without attachments
    const { attachments, ...data } = requestData;
    const dataObj: any = {
      type: data.type,
      subtype: data.subtype,
      title: data.title,
      description: data.description,
      priority: data.priority || 'medium',
      amount: data.amount,
      currency: data.currency || 'usd',
      metadata: data.metadata,
    };

    if (data.startDate) {
      dataObj.startDate = typeof data.startDate === 'string' 
        ? data.startDate 
        : data.startDate.toISOString();
    }
    if (data.endDate) {
      dataObj.endDate = typeof data.endDate === 'string' 
        ? data.endDate 
        : data.endDate.toISOString();
    }

    formData.append('data', JSON.stringify(dataObj));
    
    if (attachments) {
      attachments.forEach(file => {
        formData.append('attachments', file);
      });
    }

    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/pm/approvals`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error?.message || error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  static async submitApprovalRequest(requestId: string) {
    // Note: Backend route may need to be created (POST /pm/approvals/:id/submit)
    return this.fetchWithAuth(`/pm/approvals/${requestId}/submit`, {
      method: 'POST',
    });
  }

  static async approveRequest(requestId: string, comments?: string) {
    // Note: Backend route may need to be created (POST /pm/approvals/:id/approve)
    return this.fetchWithAuth(`/pm/approvals/${requestId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ comments }),
    });
  }

  static async rejectRequest(requestId: string, comments: string) {
    // Note: Backend route may need to be created (POST /pm/approvals/:id/reject)
    return this.fetchWithAuth(`/pm/approvals/${requestId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ comments }),
    });
  }

  static async cancelRequest(requestId: string, reason?: string) {
    // Note: Backend route may need to be created (POST /pm/approvals/:id/cancel)
    return this.fetchWithAuth(`/pm/approvals/${requestId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // ============================================================================
  // APPROVAL RULES
  // ============================================================================

  static async getApprovalRules(params?: {
    type?: string;
    active?: boolean;
    page?: number;
    limit?: number;
  }) {
    // Note: Backend route may need to be created (GET /pm/approval-rules)
    const query = new URLSearchParams();
    if (params?.type) query.set('type', params.type);
    if (params?.active !== undefined) query.set('active', params.active.toString());
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    
    return this.fetchWithAuth(`/pm/approval-rules${query.toString() ? `?${query.toString()}` : ''}`);
  }

  static async getApprovalRule(ruleId: string) {
    // Note: Backend route may need to be created (GET /pm/approval-rules/:id)
    return this.fetchWithAuth(`/pm/approval-rules/${ruleId}`);
  }

  static async createApprovalRule(ruleData: {
    name: string;
    type: string;
    subtype?: string;
    conditions: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
    approvalChain: Array<{
      role: string;
      department?: string;
      order: number;
      required: boolean;
      fallbackApproverId?: string;
    }>;
    priority?: string;
    sla?: number;
    active?: boolean;
  }) {
    // Note: Backend route may need to be created (POST /pm/approval-rules)
    return this.fetchWithAuth('/pm/approval-rules', {
      method: 'POST',
      body: JSON.stringify(ruleData),
    });
  }

  static async updateApprovalRule(ruleId: string, updates: Partial<ApprovalRule>) {
    // Note: Backend route may need to be created (PATCH /pm/approval-rules/:id)
    return this.fetchWithAuth(`/pm/approval-rules/${ruleId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  static async deleteApprovalRule(ruleId: string) {
    // Note: Backend route may need to be created (DELETE /pm/approval-rules/:id)
    return this.fetchWithAuth(`/pm/approval-rules/${ruleId}`, {
      method: 'DELETE',
    });
  }

  // ============================================================================
  // MY APPROVALS
  // ============================================================================

  static async getMyPendingApprovals(params?: {
    type?: string;
    page?: number;
    limit?: number;
  }) {
    // Note: Backend route may need to be created (GET /pm/approvals/my-pending)
    const query = new URLSearchParams();
    if (params?.type) query.set('type', params.type);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    
    return this.fetchWithAuth(`/pm/approvals/my-pending${query.toString() ? `?${query.toString()}` : ''}`);
  }

  static async getMyApprovalRequests(params?: {
    status?: string;
    type?: string;
    page?: number;
    limit?: number;
  }) {
    // Get requests where current user is the requester
    return this.getApprovalRequests({
      requesterId: 'me', // Backend should resolve 'me' to current user ID
      ...params,
    });
  }

  // ============================================================================
  // REPORTS
  // ============================================================================

  static async getApprovalReport(params: {
    startDate: Date | string;
    endDate: Date | string;
    type?: string;
    department?: string;
  }) {
    // Note: Backend route may need to be created (GET /pm/reports/approvals)
    const query = new URLSearchParams({
      startDate: typeof params.startDate === 'string' 
        ? params.startDate 
        : params.startDate.toISOString(),
      endDate: typeof params.endDate === 'string' 
        ? params.endDate 
        : params.endDate.toISOString(),
    });
    if (params.type) query.set('type', params.type);
    if (params.department) query.set('department', params.department);
    
    return this.fetchWithAuth(`/pm/reports/approvals?${query.toString()}`);
  }

  // ============================================================================
  // APPROVAL REQUEST ATTACHMENTS
  // ============================================================================

  static async addAttachment(requestId: string, file: File) {
    // Note: Backend route may need to be created (POST /pm/approvals/:id/attachments)
    const formData = new FormData();
    formData.append('file', file);

    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/pm/approvals/${requestId}/attachments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error?.message || error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  static async deleteAttachment(requestId: string, attachmentId: string) {
    // Note: Backend route may need to be created (DELETE /pm/approvals/:id/attachments/:attachmentId)
    return this.fetchWithAuth(`/pm/approvals/${requestId}/attachments/${attachmentId}`, {
      method: 'DELETE',
    });
  }

  // ============================================================================
  // APPROVAL REQUEST COMMENTS
  // ============================================================================

  static async addComment(requestId: string, content: string) {
    // Note: Backend route may need to be created (POST /pm/approvals/:id/comments)
    return this.fetchWithAuth(`/pm/approvals/${requestId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  static async getComments(requestId: string) {
    // Note: Backend route may need to be created (GET /pm/approvals/:id/comments)
    return this.fetchWithAuth(`/pm/approvals/${requestId}/comments`);
  }
}
