/**
 * Permit API Service
 * Type-safe API client for permit operations using Supabase Auth
 */

import { createClient } from '../supabase/client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || 'http://localhost:3001';

export interface Permit {
  id: string;
  permitNumber: string;
  projectId: string;
  projectName: string;
  applicantId: string;
  applicantName: string;
  permitType: 'building' | 'electrical' | 'plumbing' | 'mechanical' | 'zoning' | 'environmental';
  permitSubtype?: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'issued' | 'expired' | 'closed';
  priority: 'standard' | 'expedited' | 'emergency';
  
  // Location Information
  propertyAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    county: string;
    parcelNumber?: string;
    latitude?: number;
    longitude?: number;
  };
  
  // Project Details
  projectDetails: {
    description: string;
    scopeOfWork: string;
    valuation: number;
    squareFootage: number;
    numberOfStories: number;
    occupancyType: string;
    constructionType: string;
    proposedUse: string;
  };
  
  // Jurisdiction Information
  jurisdiction: {
    id: string;
    name: string;
    department: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    website?: string;
    feeSchedule: Array<{
      type: string;
      amount: number;
      description: string;
    }>;
  };
  
  // Application Details
  applicationDate: Date | string;
  submissionDate?: Date | string;
  reviewStartDate?: Date | string;
  approvalDate?: Date | string;
  issueDate?: Date | string;
  expirationDate?: Date | string;
  estimatedReviewTime?: number; // in days
  
  // Fees and Payments
  fees: Array<{
    type: string;
    description: string;
    amount: number;
    status: 'pending' | 'paid' | 'waived' | 'refunded';
    paidDate?: Date | string;
    paymentMethod?: string;
    receiptUrl?: string;
  }>;
  totalFees: number;
  paidAmount: number;
  
  // Documents
  documents: Array<{
    id: string;
    name: string;
    type: string;
    fileUrl: string;
    uploadedBy: string;
    uploadedAt: Date | string;
    isRequired: boolean;
    status: 'pending' | 'approved' | 'rejected';
    reviewComments?: string;
  }>;
  
  // Reviews and Approvals
  reviews: Array<{
    id: string;
    department: string;
    reviewerId?: string;
    reviewerName?: string;
    status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'needs_correction';
    comments?: string;
    assignedDate?: Date | string;
    completedDate?: Date | string;
    requiredActions?: string[];
  }>;
  
  // Inspections
  inspections: Array<{
    id: string;
    type: string;
    description: string;
    status: 'scheduled' | 'in_progress' | 'passed' | 'failed' | 'cancelled';
    scheduledDate?: Date | string;
    scheduledTime?: string;
    actualDate?: Date | string;
    inspectorId?: string;
    inspectorName?: string;
    findings?: string;
    notes?: string;
    followUpRequired: boolean;
    followUpDate?: Date | string;
    photos?: Array<{
      id: string;
      url: string;
      caption?: string;
      takenAt: Date | string;
    }>;
  }>;
  
  // Conditions and Comments
  conditions: Array<{
    description: string;
    status: 'pending' | 'completed' | 'verified';
    completedDate?: Date | string;
    verifiedBy?: string;
    verifiedAt?: Date | string;
  }>;
  
  comments: Array<{
    id: string;
    userId: string;
    userName: string;
    userRole: string;
    message: string;
    attachments?: Array<{
      id: string;
      name: string;
      url: string;
    }>;
    createdAt: Date | string;
  }>;
  
  // Metadata
  tags?: string[];
  metadata?: Record<string, any>;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy: string;
}

export class PermitApiService {
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
  // PERMIT MANAGEMENT
  // ============================================================================

  static async getPermits(params?: {
    projectId?: string;
    applicantId?: string;
    permitType?: string;
    status?: string;
    jurisdictionId?: string;
    search?: string;
    startDate?: Date | string;
    endDate?: Date | string;
    page?: number;
    limit?: number;
  }) {
    // Note: Backend route may need to be created (GET /permits)
    const query = new URLSearchParams();
    if (params?.projectId) query.set('projectId', params.projectId);
    if (params?.applicantId) query.set('applicantId', params.applicantId);
    if (params?.permitType) query.set('permitType', params.permitType);
    if (params?.status) query.set('status', params.status);
    if (params?.jurisdictionId) query.set('jurisdictionId', params.jurisdictionId);
    if (params?.search) query.set('search', params.search);
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
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    
    return this.fetchWithAuth(`/permits${query.toString() ? `?${query.toString()}` : ''}`);
  }

  static async getPermit(permitId: string) {
    // Note: Backend route may need to be created (GET /permits/:id)
    return this.fetchWithAuth(`/permits/${permitId}`);
  }

  static async createPermit(permitData: {
    projectId: string;
    permitType: string;
    permitSubtype?: string;
    priority?: string;
    propertyAddress: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      county: string;
      parcelNumber?: string;
    };
    projectDetails: {
      description: string;
      scopeOfWork: string;
      valuation: number;
      squareFootage: number;
      numberOfStories: number;
      occupancyType: string;
      constructionType: string;
      proposedUse: string;
    };
    jurisdictionId: string;
    documents?: File[];
  }) {
    // Note: Backend route may need to be created (POST /permits)
    const formData = new FormData();
    
    // Create data object without documents
    const { documents, ...data } = permitData;
    formData.append('data', JSON.stringify(data));
    
    if (documents) {
      documents.forEach(file => {
        formData.append('documents', file);
      });
    }

    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/permits`, {
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

  static async updatePermit(permitId: string, updates: Partial<Permit>) {
    // Note: Backend route may need to be created (PATCH /permits/:id)
    return this.fetchWithAuth(`/permits/${permitId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  static async deletePermit(permitId: string) {
    // Note: Backend route may need to be created (DELETE /permits/:id)
    return this.fetchWithAuth(`/permits/${permitId}`, {
      method: 'DELETE',
    });
  }

  static async submitPermit(permitId: string) {
    // Note: Backend route may need to be created (POST /permits/:id/submit)
    return this.fetchWithAuth(`/permits/${permitId}/submit`, {
      method: 'POST',
    });
  }

  static async withdrawPermit(permitId: string, reason: string) {
    // Note: Backend route may need to be created (POST /permits/:id/withdraw)
    return this.fetchWithAuth(`/permits/${permitId}/withdraw`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // ============================================================================
  // DOCUMENT MANAGEMENT
  // ============================================================================

  static async uploadDocument(permitId: string, documentData: {
    file: File;
    type: string;
    isRequired?: boolean;
    description?: string;
  }) {
    // Note: Backend route may need to be created (POST /permits/:id/documents)
    const formData = new FormData();
    formData.append('file', documentData.file);
    formData.append('type', documentData.type);
    if (documentData.isRequired !== undefined) {
      formData.append('isRequired', documentData.isRequired.toString());
    }
    if (documentData.description) {
      formData.append('description', documentData.description);
    }

    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/permits/${permitId}/documents`, {
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

  static async getDocuments(permitId: string) {
    // Note: Backend route may need to be created (GET /permits/:id/documents)
    return this.fetchWithAuth(`/permits/${permitId}/documents`);
  }

  static async deleteDocument(permitId: string, documentId: string) {
    // Note: Backend route may need to be created (DELETE /permits/:id/documents/:documentId)
    return this.fetchWithAuth(`/permits/${permitId}/documents/${documentId}`, {
      method: 'DELETE',
    });
  }

  // ============================================================================
  // FEE MANAGEMENT
  // ============================================================================

  static async calculateFees(permitId: string) {
    // Note: Backend route may need to be created (POST /permits/:id/calculate-fees)
    return this.fetchWithAuth(`/permits/${permitId}/calculate-fees`, {
      method: 'POST',
    });
  }

  static async payFees(permitId: string, paymentData: {
    amount: number;
    paymentMethodId: string;
    savePaymentMethod?: boolean;
  }) {
    // Note: Backend route may need to be created (POST /permits/:id/pay-fees)
    return this.fetchWithAuth(`/permits/${permitId}/pay-fees`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  static async getPaymentHistory(permitId: string) {
    // Note: Backend route may need to be created (GET /permits/:id/payments)
    return this.fetchWithAuth(`/permits/${permitId}/payments`);
  }

  // ============================================================================
  // INSPECTION MANAGEMENT
  // ============================================================================

  static async scheduleInspection(permitId: string, inspectionData: {
    type: string;
    description: string;
    requestedDate: Date | string;
    preferredTime?: string;
    specialInstructions?: string;
  }) {
    // Note: Backend route may need to be created (POST /permits/:id/inspections)
    return this.fetchWithAuth(`/permits/${permitId}/inspections`, {
      method: 'POST',
      body: JSON.stringify({
        ...inspectionData,
        requestedDate: typeof inspectionData.requestedDate === 'string' 
          ? inspectionData.requestedDate 
          : inspectionData.requestedDate.toISOString(),
      }),
    });
  }

  static async getInspections(permitId: string) {
    // Note: Backend route may need to be created (GET /permits/:id/inspections)
    return this.fetchWithAuth(`/permits/${permitId}/inspections`);
  }

  static async updateInspection(permitId: string, inspectionId: string, updates: {
    status?: string;
    scheduledDate?: Date | string;
    scheduledTime?: string;
    inspectorId?: string;
    notes?: string;
  }) {
    // Note: Backend route may need to be created (PATCH /permits/:id/inspections/:inspectionId)
    return this.fetchWithAuth(`/permits/${permitId}/inspections/${inspectionId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        ...updates,
        scheduledDate: updates.scheduledDate 
          ? (typeof updates.scheduledDate === 'string' 
              ? updates.scheduledDate 
              : updates.scheduledDate.toISOString())
          : undefined,
      }),
    });
  }

  static async cancelInspection(permitId: string, inspectionId: string, reason: string) {
    // Note: Backend route may need to be created (POST /permits/:id/inspections/:inspectionId/cancel)
    return this.fetchWithAuth(`/permits/${permitId}/inspections/${inspectionId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  static async uploadInspectionPhoto(permitId: string, inspectionId: string, photoData: {
    file: File;
    caption?: string;
  }) {
    // Note: Backend route may need to be created (POST /permits/:id/inspections/:inspectionId/photos)
    const formData = new FormData();
    formData.append('file', photoData.file);
    if (photoData.caption) {
      formData.append('caption', photoData.caption);
    }

    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${API_BASE_URL}/permits/${permitId}/inspections/${inspectionId}/photos`,
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
  // REVIEW MANAGEMENT
  // ============================================================================

  static async getReviews(permitId: string) {
    // Note: Backend route may need to be created (GET /permits/:id/reviews)
    return this.fetchWithAuth(`/permits/${permitId}/reviews`);
  }

  static async submitReviewResponse(permitId: string, reviewId: string, responseData: {
    status: string;
    comments?: string;
    requiredActions?: string[];
    documents?: File[];
  }) {
    // Note: Backend route may need to be created (POST /permits/:id/reviews/:reviewId/respond)
    const formData = new FormData();
    formData.append('data', JSON.stringify({
      status: responseData.status,
      comments: responseData.comments,
      requiredActions: responseData.requiredActions,
    }));
    
    if (responseData.documents) {
      responseData.documents.forEach(file => {
        formData.append('documents', file);
      });
    }

    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${API_BASE_URL}/permits/${permitId}/reviews/${reviewId}/respond`,
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
  // COMMENT MANAGEMENT
  // ============================================================================

  static async addComment(permitId: string, message: string, attachments?: File[]) {
    // Note: Backend route may need to be created (POST /permits/:id/comments)
    const formData = new FormData();
    formData.append('message', message);
    
    if (attachments) {
      attachments.forEach(file => {
        formData.append('attachments', file);
      });
    }

    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/permits/${permitId}/comments`, {
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

  static async getComments(permitId: string) {
    // Note: Backend route may need to be created (GET /permits/:id/comments)
    return this.fetchWithAuth(`/permits/${permitId}/comments`);
  }

  // ============================================================================
  // CONDITION MANAGEMENT
  // ============================================================================

  static async updateCondition(permitId: string, conditionIndex: number, updates: {
    status?: string;
    completedDate?: Date | string;
    verificationNotes?: string;
    verificationDocuments?: File[];
  }) {
    // Note: Backend route may need to be created (PATCH /permits/:id/conditions/:conditionIndex)
    const formData = new FormData();
    formData.append('data', JSON.stringify({
      status: updates.status,
      completedDate: updates.completedDate 
        ? (typeof updates.completedDate === 'string' 
            ? updates.completedDate 
            : updates.completedDate.toISOString())
        : undefined,
      verificationNotes: updates.verificationNotes,
    }));
    
    if (updates.verificationDocuments) {
      updates.verificationDocuments.forEach(file => {
        formData.append('verificationDocuments', file);
      });
    }

    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${API_BASE_URL}/permits/${permitId}/conditions/${conditionIndex}`,
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
  // JURISDICTION MANAGEMENT
  // ============================================================================

  static async getJurisdictions(params?: {
    state?: string;
    county?: string;
    city?: string;
    search?: string;
  }) {
    // Note: Backend route may need to be created (GET /jurisdictions)
    const query = new URLSearchParams();
    if (params?.state) query.set('state', params.state);
    if (params?.county) query.set('county', params.county);
    if (params?.city) query.set('city', params.city);
    if (params?.search) query.set('search', params.search);
    
    return this.fetchWithAuth(`/jurisdictions${query.toString() ? `?${query.toString()}` : ''}`);
  }

  static async getJurisdiction(jurisdictionId: string) {
    // Note: Backend route may need to be created (GET /jurisdictions/:id)
    return this.fetchWithAuth(`/jurisdictions/${jurisdictionId}`);
  }

  static async getPermitTypes(jurisdictionId: string) {
    // Note: Backend route may need to be created (GET /jurisdictions/:id/permit-types)
    return this.fetchWithAuth(`/jurisdictions/${jurisdictionId}/permit-types`);
  }

  static async getRequiredDocuments(jurisdictionId: string, permitType: string) {
    // Note: Backend route may need to be created (GET /jurisdictions/:id/required-documents)
    return this.fetchWithAuth(
      `/jurisdictions/${jurisdictionId}/required-documents?permitType=${permitType}`
    );
  }

  // ============================================================================
  // REPORTS AND ANALYTICS
  // ============================================================================

  static async getPermitReport(params: {
    startDate: Date | string;
    endDate: Date | string;
    jurisdictionId?: string;
    permitType?: string;
    status?: string;
  }) {
    // Note: Backend route may need to be created (GET /permits/report)
    const query = new URLSearchParams({
      startDate: typeof params.startDate === 'string' 
        ? params.startDate 
        : params.startDate.toISOString(),
      endDate: typeof params.endDate === 'string' 
        ? params.endDate 
        : params.endDate.toISOString(),
    });
    if (params.jurisdictionId) query.set('jurisdictionId', params.jurisdictionId);
    if (params.permitType) query.set('permitType', params.permitType);
    if (params.status) query.set('status', params.status);
    
    return this.fetchWithAuth(`/permits/report?${query.toString()}`);
  }

  static async getInspectionReport(params: {
    startDate: Date | string;
    endDate: Date | string;
    jurisdictionId?: string;
    inspectorId?: string;
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
    if (params.jurisdictionId) query.set('jurisdictionId', params.jurisdictionId);
    if (params.inspectorId) query.set('inspectorId', params.inspectorId);
    if (params.status) query.set('status', params.status);
    
    return this.fetchWithAuth(`/inspections/report?${query.toString()}`);
  }

  // ============================================================================
  // DASHBOARD
  // ============================================================================

  static async getPermitDashboard() {
    // Note: Backend route may need to be created (GET /permits/dashboard)
    return this.fetchWithAuth('/permits/dashboard');
  }

  // ============================================================================
  // CHECKLIST MANAGEMENT
  // ============================================================================

  static async getChecklistItems(permitId: string) {
    // Note: Backend route may need to be created (GET /permits/:id/checklist)
    return this.fetchWithAuth(`/permits/${permitId}/checklist`);
  }

  static async updateChecklistItem(permitId: string, itemId: string, updates: {
    completed: boolean;
    notes?: string;
    completedAt?: Date | string;
    completedBy?: string;
  }) {
    // Note: Backend route may need to be created (PATCH /permits/:id/checklist/:itemId)
    return this.fetchWithAuth(`/permits/${permitId}/checklist/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        ...updates,
        completedAt: updates.completedAt 
          ? (typeof updates.completedAt === 'string' 
              ? updates.completedAt 
              : updates.completedAt.toISOString())
          : undefined,
      }),
    });
  }
}
