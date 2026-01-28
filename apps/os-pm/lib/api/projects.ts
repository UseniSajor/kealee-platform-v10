/**
 * Project API Service
 * Type-safe API client for project management operations using Supabase Auth
 */

import { supabase } from '../supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || 'http://localhost:3001';

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled' | 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  priority: 'low' | 'medium' | 'high' | 'critical';
  startDate?: Date | string;
  endDate?: Date | string;
  actualStartDate?: Date | string;
  actualEndDate?: Date | string;
  budget?: number;
  actualCost?: number;
  clientId?: string;
  orgId?: string; // Alias for clientId
  clientName?: string;
  managerId: string;
  ownerId?: string; // Alias for managerId
  managerName?: string;
  teamMembers: Array<{
    userId: string;
    userName: string;
    role: string;
    hourlyRate?: number;
  }>;
  milestones: Array<{
    id: string;
    name: string;
    description?: string;
    dueDate: Date | string;
    completedDate?: Date | string;
    status: 'pending' | 'in_progress' | 'completed' | 'delayed';
    dependencies?: string[];
  }>;
  tags?: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export class ProjectApiService {
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

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers as Record<string, string>),
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
  // PROJECT MANAGEMENT
  // ============================================================================

  static async getProjects(params?: {
    status?: string;
    managerId?: string;
    ownerId?: string; // Alias
    clientId?: string;
    orgId?: string; // Alias
    search?: string;
    page?: number;
    limit?: number;
  }) {
    // Use /projects endpoint (not /pm/projects)
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.managerId) query.set('managerId', params.managerId);
    if (params?.ownerId) query.set('ownerId', params.ownerId);
    if (params?.clientId) query.set('clientId', params.clientId);
    if (params?.orgId) query.set('orgId', params.orgId);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    
    return this.fetchWithAuth(`/projects${query.toString() ? `?${query.toString()}` : ''}`);
  }

  static async getProject(projectId: string) {
    return this.fetchWithAuth(`/projects/${projectId}`);
  }

  static async getMyProjects() {
    // Backend has GET /projects which returns user's projects
    return this.fetchWithAuth('/projects');
  }

  static async createProject(projectData: {
    name: string;
    description?: string;
    status?: string;
    priority?: string;
    startDate?: Date | string;
    endDate?: Date | string;
    budget?: number;
    clientId?: string;
    orgId?: string; // Alias
    managerId: string;
    ownerId?: string; // Alias
    teamMembers?: Array<{ userId: string; role: string; hourlyRate?: number }>;
    tags?: string[];
    category?: string;
    categoryMetadata?: Record<string, any>;
  }) {
    const body: any = {
      name: projectData.name,
      description: projectData.description,
      orgId: projectData.orgId || projectData.clientId,
      // Backend expects ownerId, not managerId
      // ownerId will be set from authenticated user
    };

    if (projectData.category) body.category = projectData.category;
    if (projectData.categoryMetadata) body.categoryMetadata = projectData.categoryMetadata;
    if (projectData.budget) body.budget = projectData.budget;
    if (projectData.startDate) {
      body.startDate = typeof projectData.startDate === 'string' 
        ? projectData.startDate 
        : projectData.startDate.toISOString();
    }
    if (projectData.endDate) {
      body.endDate = typeof projectData.endDate === 'string' 
        ? projectData.endDate 
        : projectData.endDate.toISOString();
    }
    if (projectData.tags) body.tags = projectData.tags;

    return this.fetchWithAuth('/projects', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  static async updateProject(projectId: string, updates: Partial<Project>) {
    const body: any = {};
    if (updates.name !== undefined) body.name = updates.name;
    if (updates.description !== undefined) body.description = updates.description;
    if (updates.status !== undefined) body.status = updates.status;
    if (updates.priority !== undefined) body.priority = updates.priority;
    if (updates.startDate !== undefined) {
      body.startDate = typeof updates.startDate === 'string' 
        ? updates.startDate 
        : updates.startDate?.toISOString();
    }
    if (updates.endDate !== undefined) {
      body.endDate = typeof updates.endDate === 'string' 
        ? updates.endDate 
        : updates.endDate?.toISOString();
    }
    if (updates.budget !== undefined) body.budget = updates.budget;
    if (updates.tags !== undefined) body.tags = updates.tags;

    return this.fetchWithAuth(`/projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  static async deleteProject(projectId: string) {
    // Note: Backend route may need to be created (DELETE /projects/:id)
    return this.fetchWithAuth(`/projects/${projectId}`, {
      method: 'DELETE',
    });
  }

  // ============================================================================
  // PROJECT TIMELINE
  // ============================================================================

  static async getProjectTimeline(projectId: string) {
    // Note: Backend route may need to be created (GET /projects/:id/timeline)
    // Check if it exists at /pm/projects/:id/timeline
    try {
      return await this.fetchWithAuth(`/pm/projects/${projectId}/timeline`);
    } catch {
      // Fallback to /projects/:id/timeline
      return this.fetchWithAuth(`/projects/${projectId}/timeline`);
    }
  }

  static async updateProjectTimeline(projectId: string, timeline: {
    startDate?: Date | string;
    endDate?: Date | string;
    milestones?: Array<{
      name: string;
      dueDate: Date | string;
      description?: string;
      dependencies?: string[];
    }>;
  }) {
    const body: any = {};
    if (timeline.startDate) {
      body.startDate = typeof timeline.startDate === 'string' 
        ? timeline.startDate 
        : timeline.startDate.toISOString();
    }
    if (timeline.endDate) {
      body.endDate = typeof timeline.endDate === 'string' 
        ? timeline.endDate 
        : timeline.endDate.toISOString();
    }
    if (timeline.milestones) {
      body.milestones = timeline.milestones.map(m => ({
        name: m.name,
        dueDate: typeof m.dueDate === 'string' ? m.dueDate : m.dueDate.toISOString(),
        description: m.description,
        dependencies: m.dependencies,
      }));
    }

    // Try /pm/projects/:id/timeline first
    try {
      return await this.fetchWithAuth(`/pm/projects/${projectId}/timeline`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
    } catch {
      // Fallback to /projects/:id/timeline
      return this.fetchWithAuth(`/projects/${projectId}/timeline`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
    }
  }

  // ============================================================================
  // PROJECT TEAM
  // ============================================================================

  static async addTeamMember(projectId: string, teamMember: {
    userId: string;
    role: string;
    hourlyRate?: number;
  }) {
    // Backend has POST /projects/:id/members
    const body: any = {
      userId: teamMember.userId,
      role: teamMember.role,
    };

    return this.fetchWithAuth(`/projects/${projectId}/members`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  static async removeTeamMember(projectId: string, userId: string) {
    // Note: Backend route may need to be created (DELETE /projects/:id/members/:userId)
    return this.fetchWithAuth(`/projects/${projectId}/members/${userId}`, {
      method: 'DELETE',
    });
  }

  static async updateTeamMemberRole(projectId: string, userId: string, role: string) {
    // Use addTeamMember which updates if member exists
    return this.addTeamMember(projectId, { userId, role });
  }

  // ============================================================================
  // PROJECT MILESTONES
  // ============================================================================

  static async createMilestone(projectId: string, milestone: {
    name: string;
    description?: string;
    dueDate: Date | string;
    dependencies?: string[];
  }) {
    // Note: Backend route may need to be created (POST /projects/:id/milestones)
    const body = {
      name: milestone.name,
      description: milestone.description,
      dueDate: typeof milestone.dueDate === 'string' 
        ? milestone.dueDate 
        : milestone.dueDate.toISOString(),
      dependencies: milestone.dependencies,
    };

    return this.fetchWithAuth(`/projects/${projectId}/milestones`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  static async updateMilestone(projectId: string, milestoneId: string, updates: {
    name?: string;
    description?: string;
    dueDate?: Date | string;
    status?: string;
    completedDate?: Date | string;
  }) {
    // Note: Backend route may need to be created (PATCH /projects/:id/milestones/:milestoneId)
    const body: any = {};
    if (updates.name !== undefined) body.name = updates.name;
    if (updates.description !== undefined) body.description = updates.description;
    if (updates.dueDate !== undefined) {
      body.dueDate = typeof updates.dueDate === 'string' 
        ? updates.dueDate 
        : updates.dueDate.toISOString();
    }
    if (updates.status !== undefined) body.status = updates.status;
    if (updates.completedDate !== undefined) {
      body.completedDate = typeof updates.completedDate === 'string' 
        ? updates.completedDate 
        : updates.completedDate.toISOString();
    }

    return this.fetchWithAuth(`/projects/${projectId}/milestones/${milestoneId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  static async deleteMilestone(projectId: string, milestoneId: string) {
    // Note: Backend route may need to be created (DELETE /projects/:id/milestones/:milestoneId)
    return this.fetchWithAuth(`/projects/${projectId}/milestones/${milestoneId}`, {
      method: 'DELETE',
    });
  }

  // ============================================================================
  // PROJECT BUDGET
  // ============================================================================

  static async getProjectBudget(projectId: string) {
    // Try /pm/projects/:id/budget first
    try {
      return await this.fetchWithAuth(`/pm/projects/${projectId}/budget`);
    } catch {
      // Fallback to /projects/:id/budget
      return this.fetchWithAuth(`/projects/${projectId}/budget`);
    }
  }

  static async updateProjectBudget(projectId: string, budget: {
    budget?: number;
    actualCost?: number;
    lineItems?: Array<{
      name: string;
      amount: number;
      category?: string;
    }>;
  }) {
    // Try /pm/projects/:id/budget first
    try {
      return await this.fetchWithAuth(`/pm/projects/${projectId}/budget`, {
        method: 'PUT',
        body: JSON.stringify(budget),
      });
    } catch {
      // Fallback to /projects/:id/budget
      return this.fetchWithAuth(`/projects/${projectId}/budget`, {
        method: 'PATCH',
        body: JSON.stringify(budget),
      });
    }
  }

  // ============================================================================
  // PROJECT REPORTS
  // ============================================================================

  static async getProjectReport(projectId: string) {
    // Note: Backend route may need to be created (GET /projects/:id/report)
    return this.fetchWithAuth(`/projects/${projectId}/report`);
  }

  static async getProjectBudgetReport(projectId: string) {
    // Note: Backend route may need to be created (GET /projects/:id/budget-report)
    return this.fetchWithAuth(`/projects/${projectId}/budget-report`);
  }

  static async getProjectProgressReport(projectId: string) {
    // Note: Backend route may need to be created (GET /projects/:id/progress-report)
    return this.fetchWithAuth(`/projects/${projectId}/progress-report`);
  }

  // ============================================================================
  // PROJECT DASHBOARD
  // ============================================================================

  static async getProjectDashboard() {
    // Use PM stats endpoint
    return this.fetchWithAuth('/pm/stats');
  }

  // ============================================================================
  // PROJECT FROM LEAD
  // ============================================================================

  static async createProjectFromLead(leadId: string, orgId?: string) {
    // Backend has POST /projects/from-lead/:leadId
    return this.fetchWithAuth(`/projects/from-lead/${leadId}`, {
      method: 'POST',
      body: JSON.stringify({ orgId }),
    });
  }
}
