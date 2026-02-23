// ============================================================
// JURISDICTION STAFF TYPE DEFINITIONS
// ============================================================

export type StaffRole = 
  | 'PLAN_REVIEWER'
  | 'INSPECTOR'
  | 'PERMIT_COORDINATOR'
  | 'ADMINISTRATOR'
  | 'SUPERVISOR';

export type ReviewDiscipline = 
  | 'ZONING'
  | 'BUILDING'
  | 'STRUCTURAL'
  | 'ELECTRICAL'
  | 'PLUMBING'
  | 'MECHANICAL'
  | 'FIRE'
  | 'ENERGY'
  | 'ACCESSIBILITY'
  | 'ENVIRONMENTAL'
  | 'HEALTH'
  | 'TRANSPORTATION';

export interface JurisdictionStaff {
  id: string;
  jurisdictionId: string;
  userId?: string;
  
  // Staff Info
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  employeeId?: string;
  
  // Role & Specialty
  role: StaffRole;
  disciplines: ReviewDiscipline[];
  certifications: string[];
  
  // Workload Management
  currentWorkload: number;
  maxWorkload: number;
  avgReviewTime?: number; // Minutes
  isActive: boolean;
  
  // Performance
  reviewsCompleted: number;
  inspectionsCompleted: number;
  avgAccuracy?: number; // 0-1
  
  // Availability
  workingHours: WorkingHours;
  timezone: string;
  vacationDates: VacationDate[];
  
  // Mobile
  mobileDeviceId?: string;
  lastLocation?: GPSLocation;
  lastActive?: Date;
  
  // Training & Certification
  trainingRecords: TrainingRecord[];
  certifications: Certification[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkingHours {
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
}

export interface DaySchedule {
  start: string; // "09:00"
  end: string; // "17:00"
  breaks?: Array<{start: string; end: string}>;
}

export interface VacationDate {
  start: Date;
  end: Date;
  type: 'vacation' | 'sick' | 'personal' | 'training' | 'other';
  approved: boolean;
}

export interface GPSLocation {
  latitude: number;
  longitude: number;
  timestamp: Date;
  accuracy?: number;
}

export interface TrainingRecord {
  id: string;
  title: string;
  description?: string;
  provider: string;
  completedAt: Date;
  expiresAt?: Date;
  certificateUrl?: string;
  hours: number;
}

export interface Certification {
  id: string;
  name: string;
  issuingAuthority: string;
  licenseNumber?: string;
  issuedAt: Date;
  expiresAt?: Date;
  verified: boolean;
  documentUrl?: string;
}

export interface StaffPermission {
  id: string;
  key: string;
  name: string;
  description?: string;
  category: 'permit' | 'inspection' | 'review' | 'admin' | 'reporting';
}

export interface RolePermission {
  role: StaffRole;
  permissions: StaffPermission[];
}

export interface WorkloadAssignment {
  staffId: string;
  permitId?: string;
  inspectionId?: string;
  reviewId?: string;
  assignedAt: Date;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedHours: number;
}

export interface PerformanceMetrics {
  staffId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
  
  // Review Metrics
  reviewsAssigned: number;
  reviewsCompleted: number;
  reviewsOnTime: number;
  avgReviewTime: number; // Minutes
  avgAccuracy: number; // 0-1
  
  // Inspection Metrics
  inspectionsAssigned: number;
  inspectionsCompleted: number;
  inspectionsOnTime: number;
  avgInspectionTime: number; // Minutes
  passRate: number; // 0-1
  
  // Workload
  avgWorkload: number;
  maxWorkload: number;
  utilizationRate: number; // 0-1
  
  // Quality
  correctionsRequested: number;
  appealsReceived: number;
  customerSatisfaction?: number; // 0-5
}

export interface AvailabilitySlot {
  staffId: string;
  startTime: Date;
  endTime: Date;
  type: 'available' | 'busy' | 'unavailable';
  location?: GPSLocation;
}
