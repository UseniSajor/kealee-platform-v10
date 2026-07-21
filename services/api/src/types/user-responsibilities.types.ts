/**
 * TypeScript Types for User Responsibilities
 * Based on Kealee_User_Responsibilities_Guide.md
 */

import { FileCategory, UploadedByRole } from '@prisma/client'

// ============================================================================
// CONTRACTOR TYPES (Section 5 of Guide)
// ============================================================================

export interface CreateDailyLogInput {
  projectId: string
  date?: Date
  workPerformed: string
  crewCount?: number
  hoursWorked?: number
  weather?: string
  temperature?: string
  progressNotes?: string
  issues?: string
  safetyIncidents?: string
  materialsDelivered?: string
  equipmentUsed?: string
  subsOnSite?: string[]
  photoIds?: string[]
}

export interface UploadReceiptInput {
  projectId: string
  imageUrl: string
  fileUploadId?: string
  purchaseDate?: Date
  notes?: string
}

export interface ContractorOnboardingInput {
  companyName: string
  tradeSpecialties: string[] // plumbing, electrical, HVAC, etc.
  licenseNumber: string
  serviceArea: {
    zipCodes?: string[]
    cities?: string[]
    radius?: number
  }
  yearsInBusiness: number
  companyDescription?: string
}

export interface SubmitBidInput {
  leadId: string
  amount: number
  estimatedTimeline: number // days
  scopeOfWork: string
  notes?: string
}

// ============================================================================
// CLIENT TYPES (Sections 2-4 of Guide)
// ============================================================================

export interface CreateProjectInput {
  propertyAddress: string
  propertyType: 'SINGLE_FAMILY' | 'CONDO' | 'TOWNHOUSE' | 'MULTI_FAMILY'
  projectDescription: string
  projectType: string // kitchen, bathroom, roof, etc.
  budgetRange: {
    min: number
    max: number
  }
  desiredStartDate?: Date
  desiredTimeline?: string
  specialRequirements?: string
  existingConditionPhotoIds?: string[]
  floorPlanDocumentIds?: string[]
}

export interface ApproveMilestoneInput {
  milestoneId: string
  approved: boolean
  comments?: string
}

export interface ApproveChangeOrderInput {
  changeOrderId: string
  approved: boolean
  comments?: string
}

export interface LeaveReviewInput {
  projectId: string
  contractorId: string
  rating: number // 1-5 stars
  reviewText: string
  categories?: {
    quality: number
    communication: number
    timeline: number
    professionalism: number
  }
}

// ============================================================================
// ARCHITECT TYPES (Section 6 of Guide)
// ============================================================================

export interface ArchitectOnboardingInput {
  firmName: string
  specialties: string[] // residential, commercial, interior, etc.
  licenseNumber: string
  licenseState: string
  serviceArea: string[]
  firmBio?: string
  portfolioImageIds?: string[]
}

export interface UploadDesignFileInput {
  projectId: string
  designPhase: 'CONCEPT' | 'SCHEMATIC' | 'DESIGN_DEVELOPMENT' | 'CONSTRUCTION_DOCUMENTS'
  fileType: 'DRAWING' | 'RENDERING' | 'SPECIFICATION' | 'STAMPED_DRAWING'
  versionNumber?: string
  notes?: string
  fileIds: string[]
}

export interface ReviewDesignInput {
  designVersionId: string
  approved: boolean
  comments?: Array<{
    x: number // Coordinate for pin-point comments
    y: number
    text: string
    page?: number
  }>
}

// ============================================================================
// PM TYPES (Section 7 of Guide)
// ============================================================================

export interface CompleteSiteVisitInput {
  siteVisitId: string
  findings: string
  photoIds: string[]
  checklistData?: Record<string, boolean>
  notes?: string
  duration?: number // minutes
}

export interface MarkMilestoneCompleteInput {
  milestoneId: string
  completedAt: Date
  notes?: string
  supportingPhotoIds?: string[]
}

export interface RecordInspectionResultInput {
  inspectionId: string
  result: 'PASS' | 'PASS_WITH_COMMENTS' | 'FAIL' | 'PARTIAL_PASS'
  notes?: string
  corrections?: Array<{
    description: string
    location?: string
    category: string
    severity: 'MINOR' | 'MAJOR' | 'CRITICAL'
  }>
  photoIds?: string[]
}

export interface SubmitPermitApplicationInput {
  projectId: string
  permitType: 'BUILDING' | 'ELECTRICAL' | 'PLUMBING' | 'MECHANICAL'
  scope: string
  valuation: number
  documentIds: string[]
}

// ============================================================================
// FILE UPLOAD TYPES (Section 10 of Guide)
// ============================================================================

export interface FileUploadRequest {
  fileName: string
  mimeType: string
  size: number
  category: FileCategory
  userRole: UploadedByRole
  projectId?: string
  propertyId?: string
  milestoneId?: string
  leadId?: string
  organizationId?: string
  description?: string
  location?: string
  tags?: string[]
}

export interface FileUploadResponse {
  id: string
  fileName: string
  fileUrl: string
  fileSize: number
  mimeType: string
  category: FileCategory
  uploadedById: string
  uploadedByRole: UploadedByRole
  uploadedAt: Date
}

export interface BatchFileUploadRequest {
  files: Array<{
    fileName: string
    mimeType: string
    size: number
  }>
  commonData: {
    category: FileCategory
    userRole: UploadedByRole
    projectId?: string
    description?: string
    tags?: string[]
  }
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface FileValidationResult {
  valid: boolean
  errors: string[]
}

export interface RolePermissionCheck {
  allowed: boolean
  error?: string
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

// ============================================================================
// USER ACTION TRACKING
// ============================================================================

export type UserActionType =
  // Account & Onboarding
  | 'CREATE_ACCOUNT'
  | 'COMPLETE_ONBOARDING'
  | 'UPDATE_PROFILE'
  | 'UPLOAD_LICENSE'
  | 'UPLOAD_INSURANCE'
  | 'ADD_PROPERTY'
  // Projects & Leads
  | 'CREATE_PROJECT'
  | 'SUBMIT_BID'
  | 'ACCEPT_BID'
  | 'SIGN_CONTRACT'
  | 'FUND_ESCROW'
  // During Project
  | 'UPLOAD_SITE_PHOTO'
  | 'UPLOAD_RECEIPT'
  | 'CREATE_DAILY_LOG'
  | 'MARK_TASK_COMPLETE'
  | 'MARK_MILESTONE_COMPLETE'
  | 'APPROVE_MILESTONE_PAYMENT'
  | 'APPROVE_CHANGE_ORDER'
  | 'UPLOAD_PERMIT_DOCUMENT'
  | 'SUBMIT_PERMIT_APPLICATION'
  | 'RECORD_INSPECTION_RESULT'
  // Design
  | 'UPLOAD_DESIGN_FILE'
  | 'REVIEW_DESIGN'
  | 'APPROVE_DESIGN'
  | 'UPLOAD_STAMPED_DRAWING'
  // Billing
  | 'ADD_PAYMENT_METHOD'
  | 'COMPLETE_STRIPE_CONNECT'
  | 'UPDATE_PAYMENT_METHOD'
  // Other
  | 'LEAVE_REVIEW'
  | 'SEND_MESSAGE'
  | 'UPLOAD_FILE'

export interface UserActionLog {
  id: string
  userId: string
  userRole: string
  action: UserActionType
  entity: string
  entityId?: string
  projectId?: string
  organizationId?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  createdAt: Date
}

// ============================================================================
// MATRIX TYPES (Section 1 of Guide)
// ============================================================================

export interface ResponsibilityMatrixItem {
  action: string
  homeowner: boolean
  developer: boolean
  propertyManager: boolean
  contractor: boolean
  architect: boolean
  kealeePM: boolean
  platform: boolean
}

export const RESPONSIBILITY_MATRIX: ResponsibilityMatrixItem[] = [
  // Account & Onboarding
  {
    action: 'CREATE_ACCOUNT',
    homeowner: true,
    developer: true,
    propertyManager: true,
    contractor: true,
    architect: true,
    kealeePM: false,
    platform: false,
  },
  {
    action: 'UPLOAD_LICENSE',
    homeowner: false,
    developer: false,
    propertyManager: false,
    contractor: true,
    architect: true,
    kealeePM: false,
    platform: false,
  },
  // Add more matrix items as needed...
]
