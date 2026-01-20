/**
 * Inspection API Service
 * Type-safe API client for inspection operations using Supabase Auth
 */

import { createClient } from '../supabase/client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || 'http://localhost:3001';

export interface Inspection {
  id: string;
  permitId: string;
  permitNumber: string;
  projectName: string;
  type: string;
  subtype?: string;
  description: string;
  status: 'requested' | 'scheduled' | 'in_progress' | 'passed' | 'failed' | 'cancelled' | 'rescheduled';
  priority: 'normal' | 'high' | 'emergency';
  
  // Scheduling
  requestedDate: Date | string;
  requestedBy: string;
  requestedByName: string;
  scheduledDate?: Date | string;
  scheduledTime?: string;
  estimatedDuration: number; // in minutes
  actualStartTime?: Date | string;
  actualEndTime?: Date | string;
  duration?: number; // in minutes
  
  // Location
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    siteContact?: string;
    siteContactPhone?: string;
    accessInstructions?: string;
    specialInstructions?: string;
  };
  
  // Inspector
  inspectorId?: string;
  inspectorName?: string;
  inspectorEmail?: string;
  inspectorPhone?: string;
  inspectorNotes?: string;
  
  // Results
  findings?: string;
  notes?: string;
  violations?: Array<{
    code: string;
    description: string;
    severity: 'minor' | 'moderate' | 'major' | 'critical';
    correctiveAction: string;
    dueDate?: Date | string;
    status: 'open' | 'in_progress' | 'corrected' | 'verified';
  }>;
  followUpRequired: boolean;
  followUpDate?: Date | string;
  followUpInspectionId?: string;
  
  // Documentation
  photos: Array<{
    id: string;
    url: string;
    caption?: string;
    takenAt: Date | string;
    takenBy: string;
    gpsLocation?: {
      latitude: number;
      longitude: number;
    };
  }>;
  documents: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
    uploadedBy: string;
    uploadedAt: Date | string;
  }>;
  signatures: Array<{
    id: string;
    name: string;
    role: string;
    signatureUrl: string;
    signedAt: Date | string;
    ipAddress?: string;
    location?: {
      latitude: number;
      longitude: number;
    };
  }>;
  
  // Metadata
  checklistItems?: Array<{
    id: string;
    description: string;
    status: 'pending' | 'pass' | 'fail' | 'na';
    notes?: string;
    photos?: string[]; // photo IDs
  }>;
  weatherConditions?: {
    temperature?: number;
    conditions?: string;
    precipitation?: boolean;
    notes?: string;
  };
  metadata?: Record<string, any>;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export class InspectionApiService {
  /**
   * Get authentication token from Supabase session
   */
  private static async getAuthToken(): Promise<string | null> {
    try {
      const supabase = createClient();
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
  // INSPECTION MANAGEMENT
  // ============================================================================

  static async getInspections(params?: {
    permitId?: string;
    inspectorId?: string;
    status?: string;
    startDate?: Date | string;
    endDate?: Date | string;
    priority?: string;
    type?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    // Note: Backend route may need to be created (GET /inspections)
    const query = new URLSearchParams();
    if (params?.permitId) query.set('permitId', params.permitId);
    if (params?.inspectorId) query.set('inspectorId', params.inspectorId);
    if (params?.status) query.set('status', params.status);
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
    if (params?.priority) query.set('priority', params.priority);
    if (params?.type) query.set('type', params.type);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    
    return this.fetchWithAuth(`/inspections${query.toString() ? `?${query.toString()}` : ''}`);
  }

  static async getInspection(inspectionId: string) {
    // Note: Backend route may need to be created (GET /inspections/:id)
    return this.fetchWithAuth(`/inspections/${inspectionId}`);
  }

  static async createInspection(inspectionData: {
    permitId: string;
    type: string;
    subtype?: string;
    description: string;
    priority?: string;
    requestedDate: Date | string;
    estimatedDuration?: number;
    location: {
      address: string;
      city: string;
      state: string;
      zipCode: string;
      siteContact?: string;
      siteContactPhone?: string;
      accessInstructions?: string;
      specialInstructions?: string;
    };
    checklistItems?: Array<{
      description: string;
      required: boolean;
    }>;
  }) {
    // Note: Backend route may need to be created (POST /inspections)
    return this.fetchWithAuth('/inspections', {
      method: 'POST',
      body: JSON.stringify({
        ...inspectionData,
        requestedDate: typeof inspectionData.requestedDate === 'string' 
          ? inspectionData.requestedDate 
          : inspectionData.requestedDate.toISOString(),
      }),
    });
  }

  static async updateInspection(inspectionId: string, updates: Partial<Inspection>) {
    // Note: Backend route may need to be created (PATCH /inspections/:id)
    // Convert Date objects to ISO strings
    const updatesWithDates = { ...updates };
    if (updates.scheduledDate && updates.scheduledDate instanceof Date) {
      (updatesWithDates as any).scheduledDate = updates.scheduledDate.toISOString();
    }
    if (updates.actualStartTime && updates.actualStartTime instanceof Date) {
      (updatesWithDates as any).actualStartTime = updates.actualStartTime.toISOString();
    }
    if (updates.actualEndTime && updates.actualEndTime instanceof Date) {
      (updatesWithDates as any).actualEndTime = updates.actualEndTime.toISOString();
    }
    if (updates.followUpDate && updates.followUpDate instanceof Date) {
      (updatesWithDates as any).followUpDate = updates.followUpDate.toISOString();
    }

    return this.fetchWithAuth(`/inspections/${inspectionId}`, {
      method: 'PATCH',
      body: JSON.stringify(updatesWithDates),
    });
  }

  static async deleteInspection(inspectionId: string) {
    // Note: Backend route may need to be created (DELETE /inspections/:id)
    return this.fetchWithAuth(`/inspections/${inspectionId}`, {
      method: 'DELETE',
    });
  }

  // ============================================================================
  // SCHEDULING
  // ============================================================================

  static async scheduleInspection(inspectionId: string, scheduleData: {
    scheduledDate: Date | string;
    scheduledTime: string;
    inspectorId: string;
    notes?: string;
  }) {
    // Note: Backend route may need to be created (POST /inspections/:id/schedule)
    return this.fetchWithAuth(`/inspections/${inspectionId}/schedule`, {
      method: 'POST',
      body: JSON.stringify({
        ...scheduleData,
        scheduledDate: typeof scheduleData.scheduledDate === 'string' 
          ? scheduleData.scheduledDate 
          : scheduleData.scheduledDate.toISOString(),
      }),
    });
  }

  static async rescheduleInspection(inspectionId: string, rescheduleData: {
    newDate: Date | string;
    newTime: string;
    reason: string;
    notifyParties: boolean;
  }) {
    // Note: Backend route may need to be created (POST /inspections/:id/reschedule)
    return this.fetchWithAuth(`/inspections/${inspectionId}/reschedule`, {
      method: 'POST',
      body: JSON.stringify({
        ...rescheduleData,
        newDate: typeof rescheduleData.newDate === 'string' 
          ? rescheduleData.newDate 
          : rescheduleData.newDate.toISOString(),
      }),
    });
  }

  static async cancelInspection(inspectionId: string, reason: string) {
    // Note: Backend route may need to be created (POST /inspections/:id/cancel)
    return this.fetchWithAuth(`/inspections/${inspectionId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  static async getAvailableSlots(params: {
    inspectorId?: string;
    date: Date | string;
    duration: number;
  }) {
    // Note: Backend route may need to be created (GET /inspections/available-slots)
    const query = new URLSearchParams({
      date: typeof params.date === 'string' 
        ? params.date 
        : params.date.toISOString(),
      duration: params.duration.toString(),
    });
    if (params.inspectorId) query.set('inspectorId', params.inspectorId);
    
    return this.fetchWithAuth(`/inspections/available-slots?${query.toString()}`);
  }

  // ============================================================================
  // INSPECTION EXECUTION
  // ============================================================================

  static async startInspection(inspectionId: string, startData?: {
    startTime?: Date | string;
    gpsLocation?: {
      latitude: number;
      longitude: number;
    };
    weatherConditions?: {
      temperature?: number;
      conditions?: string;
      precipitation?: boolean;
    };
  }) {
    // Note: Backend route may need to be created (POST /inspections/:id/start)
    return this.fetchWithAuth(`/inspections/${inspectionId}/start`, {
      method: 'POST',
      body: JSON.stringify({
        ...startData,
        startTime: startData?.startTime 
          ? (typeof startData.startTime === 'string' 
              ? startData.startTime 
              : startData.startTime.toISOString())
          : undefined,
      }),
    });
  }

  static async updateChecklistItem(inspectionId: string, itemId: string, updates: {
    status: string;
    notes?: string;
    photos?: File[];
  }) {
    // Note: Backend route may need to be created (PATCH /inspections/:id/checklist/:itemId)
    const formData = new FormData();
    formData.append('data', JSON.stringify({
      status: updates.status,
      notes: updates.notes,
    }));
    
    if (updates.photos) {
      updates.photos.forEach(file => {
        formData.append('photos', file);
      });
    }

    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${API_BASE_URL}/inspections/${inspectionId}/checklist/${itemId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
        credentials: 'include',
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error?.message || error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  static async addViolation(inspectionId: string, violationData: {
    code: string;
    description: string;
    severity: string;
    correctiveAction: string;
    dueDate?: Date | string;
    photos?: File[];
  }) {
    // Note: Backend route may need to be created (POST /inspections/:id/violations)
    const formData = new FormData();
    formData.append('data', JSON.stringify({
      code: violationData.code,
      description: violationData.description,
      severity: violationData.severity,
      correctiveAction: violationData.correctiveAction,
      dueDate: violationData.dueDate 
        ? (typeof violationData.dueDate === 'string' 
            ? violationData.dueDate 
            : violationData.dueDate.toISOString())
        : undefined,
    }));
    
    if (violationData.photos) {
      violationData.photos.forEach(file => {
        formData.append('photos', file);
      });
    }

    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${API_BASE_URL}/inspections/${inspectionId}/violations`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
        credentials: 'include',
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error?.message || error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  static async completeInspection(inspectionId: string, completionData: {
    findings: string;
    notes?: string;
    followUpRequired?: boolean;
    followUpDate?: Date | string;
    signatures?: Array<{
      name: string;
      role: string;
      signatureData: string; // base64 encoded signature
    }>;
    photos?: File[];
  }) {
    // Note: Backend route may need to be created (POST /inspections/:id/complete)
    const formData = new FormData();
    formData.append('data', JSON.stringify({
      findings: completionData.findings,
      notes: completionData.notes,
      followUpRequired: completionData.followUpRequired,
      followUpDate: completionData.followUpDate 
        ? (typeof completionData.followUpDate === 'string' 
            ? completionData.followUpDate 
            : completionData.followUpDate.toISOString())
        : undefined,
      signatures: completionData.signatures,
    }));
    
    if (completionData.photos) {
      completionData.photos.forEach(file => {
        formData.append('photos', file);
      });
    }

    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${API_BASE_URL}/inspections/${inspectionId}/complete`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
        credentials: 'include',
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error?.message || error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // ============================================================================
  // PHOTO MANAGEMENT
  // ============================================================================

  static async uploadPhoto(inspectionId: string, photoData: {
    file: File;
    caption?: string;
    gpsLocation?: {
      latitude: number;
      longitude: number;
    };
  }) {
    // Note: Backend route may need to be created (POST /inspections/:id/photos)
    const formData = new FormData();
    formData.append('file', photoData.file);
    if (photoData.caption) formData.append('caption', photoData.caption);
    if (photoData.gpsLocation) {
      formData.append('gpsLocation', JSON.stringify(photoData.gpsLocation));
    }

    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${API_BASE_URL}/inspections/${inspectionId}/photos`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
        credentials: 'include',
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error?.message || error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  static async deletePhoto(inspectionId: string, photoId: string) {
    // Note: Backend route may need to be created (DELETE /inspections/:id/photos/:photoId)
    return this.fetchWithAuth(`/inspections/${inspectionId}/photos/${photoId}`, {
      method: 'DELETE',
    });
  }

  // ============================================================================
  // FOLLOW-UP ACTIONS
  // ============================================================================

  static async createFollowUpInspection(inspectionId: string, followUpData: {
    description: string;
    requestedDate: Date | string;
    focusAreas: string[];
  }) {
    // Note: Backend route may need to be created (POST /inspections/:id/follow-up)
    return this.fetchWithAuth(`/inspections/${inspectionId}/follow-up`, {
      method: 'POST',
      body: JSON.stringify({
        ...followUpData,
        requestedDate: typeof followUpData.requestedDate === 'string' 
          ? followUpData.requestedDate 
          : followUpData.requestedDate.toISOString(),
      }),
    });
  }

  static async updateViolationStatus(inspectionId: string, violationId: string, updates: {
    status: string;
    correctionNotes?: string;
    correctionDate?: Date | string;
    verificationNotes?: string;
    verificationDate?: Date | string;
    verificationPhotos?: File[];
  }) {
    // Note: Backend route may need to be created (PATCH /inspections/:id/violations/:violationId)
    const formData = new FormData();
    formData.append('data', JSON.stringify({
      status: updates.status,
      correctionNotes: updates.correctionNotes,
      correctionDate: updates.correctionDate 
        ? (typeof updates.correctionDate === 'string' 
            ? updates.correctionDate 
            : updates.correctionDate.toISOString())
        : undefined,
      verificationNotes: updates.verificationNotes,
      verificationDate: updates.verificationDate 
        ? (typeof updates.verificationDate === 'string' 
            ? updates.verificationDate 
            : updates.verificationDate.toISOString())
        : undefined,
    }));
    
    if (updates.verificationPhotos) {
      updates.verificationPhotos.forEach(file => {
        formData.append('verificationPhotos', file);
      });
    }

    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${API_BASE_URL}/inspections/${inspectionId}/violations/${violationId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
        credentials: 'include',
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error?.message || error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // ============================================================================
  // INSPECTOR MANAGEMENT
  // ============================================================================

  static async getInspectors(params?: {
    department?: string;
    specialty?: string;
    availableOn?: Date | string;
    active?: boolean;
  }) {
    // Note: Backend route may need to be created (GET /inspectors)
    const query = new URLSearchParams();
    if (params?.department) query.set('department', params.department);
    if (params?.specialty) query.set('specialty', params.specialty);
    if (params?.availableOn) {
      query.set('availableOn', typeof params.availableOn === 'string' 
        ? params.availableOn 
        : params.availableOn.toISOString());
    }
    if (params?.active !== undefined) query.set('active', params.active.toString());
    
    return this.fetchWithAuth(`/inspectors${query.toString() ? `?${query.toString()}` : ''}`);
  }

  static async getInspectorSchedule(inspectorId: string, params?: {
    startDate?: Date | string;
    endDate?: Date | string;
  }) {
    // Note: Backend route may need to be created (GET /inspectors/:id/schedule)
    const query = new URLSearchParams();
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
    
    return this.fetchWithAuth(`/inspectors/${inspectorId}/schedule${query.toString() ? `?${query.toString()}` : ''}`);
  }

  // ============================================================================
  // NOTIFICATIONS
  // ============================================================================

  static async sendInspectionNotification(inspectionId: string, notificationType: string) {
    // Note: Backend route may need to be created (POST /inspections/:id/notify/:notificationType)
    return this.fetchWithAuth(`/inspections/${inspectionId}/notify/${notificationType}`, {
      method: 'POST',
    });
  }

  // ============================================================================
  // REPORTS
  // ============================================================================

  static async getInspectionReport(params: {
    startDate: Date | string;
    endDate: Date | string;
    inspectorId?: string;
    permitType?: string;
    status?: string;
  }) {
    // Note: Backend route may need to be created (GET /inspections/report)
    const query = new URLSearchParams({
      startDate: typeof params.startDate === 'string' 
        ? params.startDate 
        : params.startDate.toISOString(),
      endDate: typeof params.endDate === 'string' 
        ? params.endDate 
        : params.endDate.toISOString(),
    });
    if (params.inspectorId) query.set('inspectorId', params.inspectorId);
    if (params.permitType) query.set('permitType', params.permitType);
    if (params.status) query.set('status', params.status);
    
    return this.fetchWithAuth(`/inspections/report?${query.toString()}`);
  }

  // ============================================================================
  // DASHBOARD
  // ============================================================================

  static async getInspectionDashboard() {
    // Note: Backend route may need to be created (GET /inspections/dashboard)
    return this.fetchWithAuth('/inspections/dashboard');
  }
}
