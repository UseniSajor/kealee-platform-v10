import { z } from 'zod'

export const readinessItemTypeSchema = z.enum([
  'DOCUMENT_UPLOAD',
  'QUESTION_ANSWER',
  'DATE_CONFIRMATION',
  'EXTERNAL_VERIFICATION',
  'CUSTOM',
])

export const readinessTemplateCreateSchema = z.object({
  orgId: z.string().uuid().nullable().optional(),
  name: z.string().min(1),
  category: z
    .enum(['KITCHEN', 'BATHROOM', 'ADDITION', 'NEW_CONSTRUCTION', 'RENOVATION', 'OTHER'])
    .nullable()
    .optional(),
  isActive: z.boolean().optional(),
})

export const readinessTemplateItemCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  type: readinessItemTypeSchema,
  required: z.boolean().optional(),
  order: z.number().int().optional(),
  dueDays: z.number().int().positive().nullable().optional(),
  defaultAssigneeRole: z.enum(['OWNER', 'CONTRACTOR', 'PROJECT_MANAGER', 'MEMBER', 'VIEWER']).nullable().optional(),
  config: z.unknown().nullable().optional(),
})

export const listReadinessTemplatesQuerySchema = z.object({
  orgId: z.string().uuid().optional(),
  category: z.enum(['KITCHEN', 'BATHROOM', 'ADDITION', 'NEW_CONSTRUCTION', 'RENOVATION', 'OTHER']).optional(),
  activeOnly: z.string().optional(),
})

export const attachEvidenceSchema = z.object({
  url: z.string().url(),
  fileName: z.string().min(1).nullable().optional(),
  mimeType: z.string().min(1).nullable().optional(),
  sizeBytes: z.number().int().positive().nullable().optional(),
  type: z.enum(['PHOTO', 'DOCUMENT', 'VIDEO', 'INSPECTION_RESULT', 'OTHER']).optional(),
  metadata: z.unknown().nullable().optional(),
})

// Prompt 1.6: Type-specific response schemas
export const documentUploadResponseSchema = z.object({
  documentUrl: z.string().url(),
  fileName: z.string().min(1),
  mimeType: z.string().optional(),
  uploadedAt: z.string().datetime().optional(),
})

export const questionAnswerResponseSchema = z.object({
  answer: z.boolean(),
  explanation: z.string().min(1).optional(),
})

export const dateConfirmationResponseSchema = z.object({
  confirmedDate: z.string().datetime(),
  notes: z.string().optional(),
})

export const externalVerificationResponseSchema = z.object({
  verifiedBy: z.string().min(1), // Third-party name/org
  verificationDate: z.string().datetime(),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
})

export const customResponseSchema = z.record(z.unknown()) // Flexible validation

// Type-specific response validation based on item type
export function validateReadinessItemResponse(
  type: 'DOCUMENT_UPLOAD' | 'QUESTION_ANSWER' | 'DATE_CONFIRMATION' | 'EXTERNAL_VERIFICATION' | 'CUSTOM',
  response: unknown
): { valid: boolean; error?: string; normalized?: unknown } {
  try {
    switch (type) {
      case 'DOCUMENT_UPLOAD':
        const docResult = documentUploadResponseSchema.safeParse(response)
        if (!docResult.success) {
          return { valid: false, error: `Document upload requires: documentUrl (URL), fileName (string)` }
        }
        return { valid: true, normalized: docResult.data }
      case 'QUESTION_ANSWER':
        const qaResult = questionAnswerResponseSchema.safeParse(response)
        if (!qaResult.success) {
          return { valid: false, error: `Question/answer requires: answer (boolean), explanation (optional string)` }
        }
        return { valid: true, normalized: qaResult.data }
      case 'DATE_CONFIRMATION':
        const dateResult = dateConfirmationResponseSchema.safeParse(response)
        if (!dateResult.success) {
          return { valid: false, error: `Date confirmation requires: confirmedDate (ISO datetime string)` }
        }
        return { valid: true, normalized: dateResult.data }
      case 'EXTERNAL_VERIFICATION':
        const extResult = externalVerificationResponseSchema.safeParse(response)
        if (!extResult.success) {
          return { valid: false, error: `External verification requires: verifiedBy (string), verificationDate (ISO datetime)` }
        }
        return { valid: true, normalized: extResult.data }
      case 'CUSTOM':
        // Custom items accept any JSON object
        if (typeof response !== 'object' || response === null) {
          return { valid: false, error: 'Custom response must be a JSON object' }
        }
        return { valid: true, normalized: response }
      default:
        return { valid: false, error: `Unknown readiness item type: ${type}` }
    }
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Validation failed' }
  }
}

export const updateReadinessItemSchema = z.object({
  status: z.enum(['PENDING', 'COMPLETED', 'APPROVED', 'REJECTED']).optional(),
  response: z.unknown().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  assigneeUserId: z.string().uuid().nullable().optional(),
})

