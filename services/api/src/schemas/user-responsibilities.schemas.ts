/**
 * Validation Schemas for User Responsibilities
 * Based on Kealee_User_Responsibilities_Guide.md
 */

import { z } from 'zod'

// ============================================================================
// FILE UPLOAD SCHEMAS
// ============================================================================

export const FileUploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.string(),
  size: z.number().positive(),
  category: z.enum([
    'SITE_PHOTO',
    'PROGRESS_PHOTO',
    'INSPECTION_CORRECTION_PHOTO',
    'EXISTING_CONDITION_PHOTO',
    'RECEIPT',
    'INVOICE',
    'SUBCONTRACTOR_INVOICE',
    'LIEN_WAIVER',
    'LICENSE',
    'INSURANCE_CERTIFICATE',
    'WORKERS_COMP_CERTIFICATE',
    'PERMIT_DOCUMENT',
    'PERMIT_APPLICATION',
    'PERMIT_APPROVAL',
    'FLOOR_PLAN',
    'DESIGN_FILE',
    'STAMPED_DRAWING',
    'AS_BUILT',
    'SPECIFICATION',
    'RENDERING',
    'PORTFOLIO_PHOTO',
    'COMPANY_LOGO',
    'PROFILE_PHOTO',
    'CONTRACT',
    'CHANGE_ORDER',
    'WARRANTY',
    'CLOSEOUT_PACKAGE',
    'OTHER',
  ]),
  projectId: z.string().uuid().optional(),
  propertyId: z.string().uuid().optional(),
  milestoneId: z.string().uuid().optional(),
  leadId: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional(),
  description: z.string().max(1000).optional(),
  location: z.string().max(255).optional(),
  tags: z.array(z.string()).optional(),
})

export const BatchFileUploadSchema = z.object({
  files: z
    .array(
      z.object({
        fileName: z.string(),
        mimeType: z.string(),
        size: z.number().positive(),
      })
    )
    .min(1)
    .max(20),
  commonData: z.object({
    category: FileUploadSchema.shape.category,
    projectId: z.string().uuid().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
})

// ============================================================================
// CONTRACTOR SCHEMAS
// ============================================================================

export const CreateDailyLogSchema = z.object({
  projectId: z.string().uuid(),
  date: z.coerce.date().optional(),
  workPerformed: z.string().min(10).max(5000),
  crewCount: z.number().int().positive().max(100).optional(),
  hoursWorked: z.number().positive().max(24).optional(),
  weather: z.string().max(100).optional(),
  temperature: z.string().max(50).optional(),
  progressNotes: z.string().max(2000).optional(),
  issues: z.string().max(2000).optional(),
  safetyIncidents: z.string().max(2000).optional(),
  materialsDelivered: z.string().max(2000).optional(),
  equipmentUsed: z.string().max(2000).optional(),
  subsOnSite: z.array(z.string()).optional(),
  photoIds: z.array(z.string().uuid()).optional(),
})

export const UpdateDailyLogSchema = CreateDailyLogSchema.partial().omit({
  projectId: true,
})

export const UploadReceiptSchema = z.object({
  projectId: z.string().uuid(),
  purchaseDate: z.coerce.date().optional(),
  notes: z.string().max(1000).optional(),
})

export const SubmitBidSchema = z.object({
  leadId: z.string().uuid(),
  amount: z.number().positive().min(100),
  estimatedTimeline: z.number().int().positive().max(365),
  scopeOfWork: z.string().min(50).max(5000),
  notes: z.string().max(2000).optional(),
})

export const ContractorOnboardingSchema = z.object({
  companyName: z.string().min(2).max(255),
  tradeSpecialties: z
    .array(
      z.enum([
        'plumbing',
        'electrical',
        'HVAC',
        'carpentry',
        'roofing',
        'painting',
        'general',
        'concrete',
        'masonry',
        'tile',
        'flooring',
        'drywall',
        'demolition',
        'landscaping',
        'windows_doors',
        'siding',
        'gutters',
        'insulation',
      ])
    )
    .min(1),
  licenseNumber: z.string().min(1).max(50),
  serviceArea: z.object({
    zipCodes: z.array(z.string().regex(/^\d{5}$/)).optional(),
    cities: z.array(z.string()).optional(),
    radius: z.number().positive().max(500).optional(),
  }),
  yearsInBusiness: z.number().int().min(0).max(100),
  companyDescription: z.string().max(2000).optional(),
})

// ============================================================================
// CLIENT SCHEMAS
// ============================================================================

export const CreateProjectSchema = z.object({
  propertyAddress: z.string().min(10).max(500),
  propertyType: z.enum(['SINGLE_FAMILY', 'CONDO', 'TOWNHOUSE', 'MULTI_FAMILY']),
  projectDescription: z.string().min(50).max(5000),
  projectType: z.string().min(2).max(100),
  budgetRange: z.object({
    min: z.number().positive().min(1000),
    max: z.number().positive(),
  }).refine((data) => data.max >= data.min, {
    message: 'Maximum budget must be greater than or equal to minimum',
  }),
  desiredStartDate: z.coerce.date().optional(),
  desiredTimeline: z
    .enum(['2_weeks', '1_month', '2_3_months', '3_6_months', '6_plus_months'])
    .optional(),
  specialRequirements: z.string().max(2000).optional(),
  existingConditionPhotoIds: z.array(z.string().uuid()).optional(),
  floorPlanDocumentIds: z.array(z.string().uuid()).optional(),
})

export const ApproveMilestoneSchema = z.object({
  milestoneId: z.string().uuid(),
  approved: z.boolean(),
  comments: z.string().max(2000).optional(),
})

export const ApproveChangeOrderSchema = z.object({
  changeOrderId: z.string().uuid(),
  approved: z.boolean(),
  comments: z.string().max(2000).optional(),
})

export const LeaveReviewSchema = z.object({
  projectId: z.string().uuid(),
  contractorId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  reviewText: z.string().min(20).max(5000),
  categories: z
    .object({
      quality: z.number().int().min(1).max(5),
      communication: z.number().int().min(1).max(5),
      timeline: z.number().int().min(1).max(5),
      professionalism: z.number().int().min(1).max(5),
    })
    .optional(),
})

export const FundEscrowSchema = z.object({
  escrowId: z.string().uuid(),
  paymentMethodId: z.string(),
})

// ============================================================================
// ARCHITECT SCHEMAS
// ============================================================================

export const ArchitectOnboardingSchema = z.object({
  firmName: z.string().min(2).max(255),
  specialties: z
    .array(
      z.enum([
        'residential',
        'commercial',
        'interior',
        'landscape',
        'structural',
        'MEP',
      ])
    )
    .min(1),
  licenseNumber: z.string().min(1).max(50),
  licenseState: z.string().length(2),
  serviceArea: z.array(z.string()).min(1),
  firmBio: z.string().max(2000).optional(),
  portfolioImageIds: z.array(z.string().uuid()).optional(),
})

export const UploadDesignFileSchema = z.object({
  projectId: z.string().uuid(),
  designPhase: z.enum([
    'CONCEPT',
    'SCHEMATIC',
    'DESIGN_DEVELOPMENT',
    'CONSTRUCTION_DOCUMENTS',
  ]),
  fileType: z.enum(['DRAWING', 'RENDERING', 'SPECIFICATION', 'STAMPED_DRAWING']),
  versionNumber: z.string().max(20).optional(),
  notes: z.string().max(2000).optional(),
})

export const ReviewDesignSchema = z.object({
  designVersionId: z.string().uuid(),
  approved: z.boolean(),
  comments: z
    .array(
      z.object({
        x: z.number().min(0).max(10000),
        y: z.number().min(0).max(10000),
        text: z.string().min(1).max(1000),
        page: z.number().int().positive().optional(),
      })
    )
    .optional(),
})

export const UploadLicenseSchema = z.object({
  licenseNumber: z.string().min(1).max(50),
  licenseState: z.string().length(2),
  expirationDate: z.coerce.date().optional(),
})

// ============================================================================
// PM SCHEMAS
// ============================================================================

export const CompleteSiteVisitSchema = z.object({
  siteVisitId: z.string().uuid(),
  findings: z.string().min(10).max(5000),
  photoIds: z.array(z.string().uuid()).min(1),
  checklistData: z.record(z.string(), z.boolean()).optional(),
  notes: z.string().max(2000).optional(),
  duration: z.number().int().positive().max(480).optional(),
})

export const MarkMilestoneCompleteSchema = z.object({
  milestoneId: z.string().uuid(),
  completedAt: z.coerce.date(),
  notes: z.string().max(2000).optional(),
  supportingPhotoIds: z.array(z.string().uuid()).optional(),
})

export const RecordInspectionResultSchema = z.object({
  inspectionId: z.string().uuid(),
  result: z.enum(['PASS', 'PASS_WITH_COMMENTS', 'FAIL', 'PARTIAL_PASS']),
  notes: z.string().max(5000).optional(),
  corrections: z
    .array(
      z.object({
        description: z.string().min(10).max(1000),
        location: z.string().max(255).optional(),
        category: z.string().max(100),
        severity: z.enum(['MINOR', 'MAJOR', 'CRITICAL']),
      })
    )
    .optional(),
  photoIds: z.array(z.string().uuid()).optional(),
})

export const SubmitPermitApplicationSchema = z.object({
  projectId: z.string().uuid(),
  permitType: z.enum(['BUILDING', 'ELECTRICAL', 'PLUMBING', 'MECHANICAL']),
  scope: z.string().min(20).max(5000),
  valuation: z.number().positive(),
  documentIds: z.array(z.string().uuid()).min(1),
})

// ============================================================================
// ROLE PERMISSION VALIDATION
// ============================================================================

export const UserRoleSchema = z.enum([
  'HOMEOWNER',
  'DEVELOPER',
  'PROPERTY_MANAGER',
  'CONTRACTOR',
  'SUBCONTRACTOR',
  'ARCHITECT',
  'ENGINEER',
  'KEALEE_PM',
  'KEALEE_ADMIN',
])

export type UserRole = z.infer<typeof UserRoleSchema>

// Define which roles can perform which actions
export const ROLE_PERMISSIONS = {
  // Account & Onboarding
  CREATE_ACCOUNT: ['HOMEOWNER', 'DEVELOPER', 'PROPERTY_MANAGER', 'CONTRACTOR', 'ARCHITECT'],
  UPLOAD_LICENSE: ['CONTRACTOR', 'ARCHITECT', 'ENGINEER'],
  UPLOAD_INSURANCE: ['CONTRACTOR'],
  ADD_PROPERTY: ['HOMEOWNER', 'DEVELOPER', 'PROPERTY_MANAGER'],

  // Projects & Leads
  CREATE_PROJECT: ['HOMEOWNER', 'DEVELOPER', 'PROPERTY_MANAGER'],
  SUBMIT_BID: ['CONTRACTOR'],
  ACCEPT_BID: ['HOMEOWNER', 'DEVELOPER', 'PROPERTY_MANAGER'],
  SIGN_CONTRACT: ['HOMEOWNER', 'DEVELOPER', 'PROPERTY_MANAGER', 'CONTRACTOR', 'ARCHITECT'],
  FUND_ESCROW: ['HOMEOWNER', 'DEVELOPER', 'PROPERTY_MANAGER'],

  // During Project
  UPLOAD_SITE_PHOTO: ['CONTRACTOR', 'KEALEE_PM'],
  UPLOAD_RECEIPT: ['CONTRACTOR', 'KEALEE_PM'],
  CREATE_DAILY_LOG: ['CONTRACTOR'],
  MARK_TASK_COMPLETE: ['CONTRACTOR', 'KEALEE_PM'],
  MARK_MILESTONE_COMPLETE: ['KEALEE_PM'],
  APPROVE_MILESTONE_PAYMENT: ['HOMEOWNER', 'DEVELOPER', 'PROPERTY_MANAGER'],
  APPROVE_CHANGE_ORDER: ['HOMEOWNER', 'DEVELOPER', 'PROPERTY_MANAGER'],
  UPLOAD_PERMIT_DOCUMENT: ['CONTRACTOR', 'ARCHITECT', 'KEALEE_PM'],
  SUBMIT_PERMIT_APPLICATION: ['KEALEE_PM'],
  RECORD_INSPECTION_RESULT: ['KEALEE_PM'],

  // Design
  UPLOAD_DESIGN_FILE: ['ARCHITECT'],
  REVIEW_DESIGN: ['HOMEOWNER', 'DEVELOPER'],
  APPROVE_DESIGN: ['HOMEOWNER', 'DEVELOPER'],
  UPLOAD_STAMPED_DRAWING: ['ARCHITECT'],

  // Billing
  ADD_PAYMENT_METHOD: ['HOMEOWNER', 'DEVELOPER', 'PROPERTY_MANAGER'],
  COMPLETE_STRIPE_CONNECT: ['CONTRACTOR'],

  // Other
  LEAVE_REVIEW: ['HOMEOWNER', 'DEVELOPER', 'PROPERTY_MANAGER'],
} as const

export type ActionType = keyof typeof ROLE_PERMISSIONS

/**
 * Check if a user role has permission to perform an action
 */
export function hasPermission(userRole: UserRole, action: ActionType): boolean {
  const allowedRoles = ROLE_PERMISSIONS[action]
  return allowedRoles.includes(userRole)
}

/**
 * Validate permission or throw error
 */
export function requirePermission(userRole: UserRole, action: ActionType): void {
  if (!hasPermission(userRole, action)) {
    throw new Error(`Role ${userRole} does not have permission to perform ${action}`)
  }
}

// ============================================================================
// QUERY PARAMETER SCHEMAS
// ============================================================================

export const PaginationSchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export const ProjectFilesQuerySchema = PaginationSchema.extend({
  category: FileUploadSchema.shape.category.optional(),
  uploadedByRole: UserRoleSchema.optional(),
})

export const DailyLogsQuerySchema = PaginationSchema.extend({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
})

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreateDailyLogInput = z.infer<typeof CreateDailyLogSchema>
export type UpdateDailyLogInput = z.infer<typeof UpdateDailyLogSchema>
export type UploadReceiptInput = z.infer<typeof UploadReceiptSchema>
export type SubmitBidInput = z.infer<typeof SubmitBidSchema>
export type ContractorOnboardingInput = z.infer<typeof ContractorOnboardingSchema>
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>
export type ApproveMilestoneInput = z.infer<typeof ApproveMilestoneSchema>
export type ApproveChangeOrderInput = z.infer<typeof ApproveChangeOrderSchema>
export type LeaveReviewInput = z.infer<typeof LeaveReviewSchema>
export type ArchitectOnboardingInput = z.infer<typeof ArchitectOnboardingSchema>
export type UploadDesignFileInput = z.infer<typeof UploadDesignFileSchema>
export type ReviewDesignInput = z.infer<typeof ReviewDesignSchema>
export type CompleteSiteVisitInput = z.infer<typeof CompleteSiteVisitSchema>
export type MarkMilestoneCompleteInput = z.infer<typeof MarkMilestoneCompleteSchema>
export type RecordInspectionResultInput = z.infer<typeof RecordInspectionResultSchema>
export type SubmitPermitApplicationInput = z.infer<typeof SubmitPermitApplicationSchema>
