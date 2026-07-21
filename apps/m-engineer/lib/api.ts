/**
 * Engineering API Client
 * Centralized client for backend engineer endpoints at /engineer/*
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
}

async function getAuthHeader(): Promise<Record<string, string>> {
  if (typeof window === 'undefined') return {};
  try {
    const { createBrowserClient } = await import('@supabase/ssr');
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` };
    }
  } catch {
    // Auth not available
  }
  return {};
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    const authHeaders = await getAuthHeader();
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...(options.headers as Record<string, string> || {}),
      },
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: response.statusText }));
      return { success: false, error: err.message || err.error || 'Request failed' };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Network error' };
  }
}

// ============================================================================
// Types
// ============================================================================

export interface EngineeringProject {
  id: string;
  userId: string;
  projectName: string;
  status: string;
  disciplines: string[];
  packageTier: string;
  assignedEngineerId?: string;
  totalPrice: number;
  platformFee: number;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  completedAt?: string;
  deliverables?: EngineeringDeliverable[];
}

export interface EngineeringDeliverable {
  id: string;
  projectId: string;
  name: string;
  type: string;
  fileUrl?: string;
  status: string;
  createdAt: string;
}

export interface EngineeringService {
  id: string;
  name: string;
  description: string;
  startingPrice: number;
  features: string[];
}

export interface PricingPackage {
  tier: string;
  price: number;
  turnaround: { min: number; max: number };
}

export interface PricingDiscipline {
  discipline: string;
  basePrice: number;
}

export interface PricingInfo {
  packages: PricingPackage[];
  disciplines: PricingDiscipline[];
  platformCommission: string;
  rushFee: string;
  emergencyFee: string;
}

export interface DashboardStats {
  activeProjects: number;
  completedProjects: number;
  pendingQuotes: number;
  totalRevenue: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentProjects: EngineeringProject[];
  pendingActions: any[];
}

// ============================================================================
// PROJECTS
// ============================================================================

export async function getProjects() {
  return apiRequest<{ success: boolean; projects: EngineeringProject[] }>('/engineer/projects');
}

export async function getProject(id: string) {
  return apiRequest<{ success: boolean; project: EngineeringProject }>(`/engineer/projects/${id}`);
}

export async function createProject(data: {
  quoteId: string;
  projectName: string;
  projectDescription?: string;
  disciplines: string[];
  packageTier: string;
}) {
  return apiRequest<{ success: boolean; project: EngineeringProject }>('/engineer/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============================================================================
// QUOTES
// ============================================================================

export async function requestQuote(data: {
  projectName: string;
  projectDescription?: string;
  disciplines: string[];
  packageTier: string;
  address?: string;
  squareFootage?: number;
  projectType?: string;
  urgency?: string;
  attachments?: string[];
}) {
  return apiRequest('/engineer/quote', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============================================================================
// SERVICES
// ============================================================================

export async function getServices() {
  return apiRequest<{ success: boolean; services: EngineeringService[] }>('/engineer/services');
}

// ============================================================================
// PRICING
// ============================================================================

export async function getPricing() {
  return apiRequest<PricingInfo>('/engineer/pricing');
}

// ============================================================================
// DASHBOARD
// ============================================================================

export async function getDashboard() {
  return apiRequest<DashboardData>('/engineer/dashboard');
}

// ============================================================================
// Default export
// ============================================================================

export const engineerApi = {
  getProjects,
  getProject,
  createProject,
  requestQuote,
  getServices,
  getPricing,
  getDashboard,
};
