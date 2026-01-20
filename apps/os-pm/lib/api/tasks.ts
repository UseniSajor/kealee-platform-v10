/**
 * Task API Service
 * Type-safe API client for task management operations using Supabase Auth
 */

import { supabase } from '../supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || 'http://localhost:3001';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'todo' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'critical';
  dueDate?: Date | string;
  assignedTo?: string;
  assigneeId?: string;
  assigneeName?: string;
  projectId: string;
  projectName?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  comments?: Array<{
    id: string;
    userId: string;
    userName: string;
    content: string;
    message?: string; // Alias for content
    createdAt: Date | string;
    updatedAt: Date | string;
  }>;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy: string;
  completedAt?: Date | string;
}

export class TaskApiService {
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
  // TASK MANAGEMENT
  // ============================================================================

  static async getTasks(params?: {
    projectId?: string;
    assigneeId?: string;
    assignedTo?: string; // Alias for assigneeId
    status?: string;
    priority?: string;
    dueDateStart?: Date | string;
    dueDateEnd?: Date | string;
    search?: string;
    client?: string; // Filter by client/org
    page?: number;
    limit?: number;
    pageSize?: number;
    sortBy?: 'dueDate' | 'priority' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
  }) {
    const query = new URLSearchParams();
    if (params?.projectId) query.set('projectId', params.projectId);
    if (params?.assigneeId) query.set('assignedTo', params.assigneeId);
    if (params?.assignedTo) query.set('assignedTo', params.assignedTo);
    if (params?.status) query.set('status', params.status);
    if (params?.priority) query.set('priority', params.priority);
    if (params?.dueDateStart) query.set('dueDateStart', typeof params.dueDateStart === 'string' ? params.dueDateStart : params.dueDateStart.toISOString());
    if (params?.dueDateEnd) query.set('dueDateEnd', typeof params.dueDateEnd === 'string' ? params.dueDateEnd : params.dueDateEnd.toISOString());
    if (params?.search) query.set('search', params.search);
    if (params?.client) query.set('client', params.client);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.pageSize) query.set('pageSize', params.pageSize.toString());
    if (params?.sortBy) query.set('sortBy', params.sortBy);
    if (params?.sortOrder) query.set('sortOrder', params.sortOrder);
    
    return this.fetchWithAuth(`/pm/tasks${query.toString() ? `?${query.toString()}` : ''}`);
  }

  static async getTask(taskId: string) {
    return this.fetchWithAuth(`/pm/tasks/${taskId}`);
  }

  static async createTask(taskData: {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    dueDate?: Date | string;
    assigneeId?: string;
    assignedTo?: string; // Alias
    projectId: string;
    estimatedHours?: number;
    tags?: string[];
  }) {
    // Note: Backend route may need to be created (POST /pm/tasks)
    // For now, this will throw an error if route doesn't exist
    const body: any = {
      title: taskData.title,
      description: taskData.description,
      status: taskData.status || 'pending',
      priority: taskData.priority || 'medium',
      dueDate: taskData.dueDate ? (typeof taskData.dueDate === 'string' ? taskData.dueDate : taskData.dueDate.toISOString()) : undefined,
      assignedTo: taskData.assigneeId || taskData.assignedTo,
      projectId: taskData.projectId,
      estimatedHours: taskData.estimatedHours,
      tags: taskData.tags,
    };

    return this.fetchWithAuth('/pm/tasks', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  static async updateTask(taskId: string, updates: Partial<Task>) {
    const body: any = {};
    if (updates.title !== undefined) body.title = updates.title;
    if (updates.description !== undefined) body.description = updates.description;
    if (updates.status !== undefined) body.status = updates.status;
    if (updates.priority !== undefined) body.priority = updates.priority;
    if (updates.dueDate !== undefined) {
      body.dueDate = typeof updates.dueDate === 'string' 
        ? updates.dueDate 
        : updates.dueDate?.toISOString();
    }
    if (updates.assignedTo !== undefined) body.assignedTo = updates.assignedTo;
    if (updates.assigneeId !== undefined) body.assignedTo = updates.assigneeId;
    if (updates.estimatedHours !== undefined) body.estimatedHours = updates.estimatedHours;
    if (updates.tags !== undefined) body.tags = updates.tags;

    return this.fetchWithAuth(`/pm/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  static async deleteTask(taskId: string) {
    // Note: Backend route may need to be created (DELETE /pm/tasks/:id)
    return this.fetchWithAuth(`/pm/tasks/${taskId}`, {
      method: 'DELETE',
    });
  }

  static async updateTaskStatus(taskId: string, status: Task['status']) {
    // Use the general update endpoint
    return this.updateTask(taskId, { status });
  }

  static async assignTask(taskId: string, assigneeId: string) {
    // Use the general update endpoint
    return this.updateTask(taskId, { assignedTo: assigneeId });
  }

  static async completeTask(taskId: string, force: boolean = false) {
    return this.fetchWithAuth(`/pm/tasks/${taskId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ force }),
    });
  }

  // ============================================================================
  // TASK COMMENTS
  // ============================================================================

  static async getTaskComments(taskId: string) {
    return this.fetchWithAuth(`/pm/tasks/${taskId}/comments`);
  }

  static async addComment(taskId: string, content: string) {
    return this.fetchWithAuth(`/pm/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ message: content }), // Backend expects 'message'
    });
  }

  static async updateComment(taskId: string, commentId: string, content: string) {
    // Note: Backend route may need to be created (PATCH /pm/tasks/:id/comments/:commentId)
    return this.fetchWithAuth(`/pm/tasks/${taskId}/comments/${commentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ message: content }),
    });
  }

  static async deleteComment(taskId: string, commentId: string) {
    // Note: Backend route may need to be created (DELETE /pm/tasks/:id/comments/:commentId)
    return this.fetchWithAuth(`/pm/tasks/${taskId}/comments/${commentId}`, {
      method: 'DELETE',
    });
  }

  // ============================================================================
  // TASK ATTACHMENTS
  // ============================================================================

  static async addAttachment(taskId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/pm/tasks/${taskId}/attachments`, {
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

  static async deleteAttachment(taskId: string, attachmentId: string) {
    // Note: Backend route may need to be created (DELETE /pm/tasks/:id/attachments/:attachmentId)
    return this.fetchWithAuth(`/pm/tasks/${taskId}/attachments/${attachmentId}`, {
      method: 'DELETE',
    });
  }

  // ============================================================================
  // TASK TIME TRACKING
  // ============================================================================

  static async startTimeTracking(taskId: string) {
    // Note: Backend route may need to be created (POST /pm/tasks/:id/time-tracking/start)
    return this.fetchWithAuth(`/pm/tasks/${taskId}/time-tracking/start`, {
      method: 'POST',
    });
  }

  static async stopTimeTracking(taskId: string) {
    // Note: Backend route may need to be created (POST /pm/tasks/:id/time-tracking/stop)
    return this.fetchWithAuth(`/pm/tasks/${taskId}/time-tracking/stop`, {
      method: 'POST',
    });
  }

  static async addTimeEntry(taskId: string, entry: {
    startTime: Date | string;
    endTime: Date | string;
    description?: string;
  }) {
    // Note: Backend route may need to be created (POST /pm/tasks/:id/time-entries)
    const body = {
      startTime: typeof entry.startTime === 'string' ? entry.startTime : entry.startTime.toISOString(),
      endTime: typeof entry.endTime === 'string' ? entry.endTime : entry.endTime.toISOString(),
      description: entry.description,
    };

    return this.fetchWithAuth(`/pm/tasks/${taskId}/time-entries`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  static async bulkUpdateTasks(taskIds: string[], updates: Partial<Task>) {
    // Note: Backend route may need to be created (PATCH /pm/tasks/bulk-update)
    // For now, update tasks individually
    const results = await Promise.all(
      taskIds.map(id => this.updateTask(id, updates))
    );
    return { updated: results.length, tasks: results.map(r => r.task || r) };
  }

  static async bulkDeleteTasks(taskIds: string[]) {
    // Note: Backend route may need to be created (DELETE /pm/tasks/bulk-delete)
    // For now, delete tasks individually
    const results = await Promise.all(
      taskIds.map(id => this.deleteTask(id))
    );
    return { deleted: results.length };
  }

  static async bulkAssignTasks(taskIds: string[], assigneeId: string) {
    return this.fetchWithAuth('/pm/tasks/bulk-assign', {
      method: 'POST',
      body: JSON.stringify({ taskIds, newAssigneeId: assigneeId }),
    });
  }

  static async bulkCompleteTasks(taskIds: string[]) {
    return this.fetchWithAuth('/pm/tasks/bulk-complete', {
      method: 'POST',
      body: JSON.stringify({ taskIds }),
    });
  }

  // ============================================================================
  // REPORTS
  // ============================================================================

  static async getTaskReport(params: {
    startDate: Date | string;
    endDate: Date | string;
    projectId?: string;
    assigneeId?: string;
  }) {
    // Note: Backend route may need to be created (GET /pm/reports/tasks)
    // For now, use weekly report or task list with date filters
    const query = new URLSearchParams({
      startDate: typeof params.startDate === 'string' ? params.startDate : params.startDate.toISOString(),
      endDate: typeof params.endDate === 'string' ? params.endDate : params.endDate.toISOString(),
    });
    if (params.projectId) query.set('projectId', params.projectId);
    if (params.assigneeId) query.set('assignedTo', params.assigneeId);
    
    // This endpoint may not exist - using weekly report as fallback
    return this.fetchWithAuth(`/pm/reports/weekly?${query.toString()}`);
  }

  static async getTimeTrackingReport(params: {
    startDate: Date | string;
    endDate: Date | string;
    userId?: string;
    projectId?: string;
  }) {
    // Note: Backend route may need to be created (GET /pm/reports/time-tracking)
    const query = new URLSearchParams({
      startDate: typeof params.startDate === 'string' ? params.startDate : params.startDate.toISOString(),
      endDate: typeof params.endDate === 'string' ? params.endDate : params.endDate.toISOString(),
    });
    if (params.userId) query.set('userId', params.userId);
    if (params.projectId) query.set('projectId', params.projectId);
    
    // This endpoint may not exist - will throw error if not implemented
    return this.fetchWithAuth(`/pm/reports/time-tracking?${query.toString()}`);
  }

  static async getWeeklyReport(weekStart?: Date | string) {
    const query = new URLSearchParams();
    if (weekStart) {
      query.set('weekStart', typeof weekStart === 'string' ? weekStart : weekStart.toISOString());
    }
    
    return this.fetchWithAuth(`/pm/reports/weekly${query.toString() ? `?${query.toString()}` : ''}`);
  }

  // ============================================================================
  // COMPLIANCE
  // ============================================================================

  static async getTaskCompliance(taskId: string) {
    return this.fetchWithAuth(`/pm/tasks/${taskId}/compliance`);
  }
}
