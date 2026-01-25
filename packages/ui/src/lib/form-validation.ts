/**
 * Form Validation Utilities
 * Wrapper around Zod for consistent form validation
 */

import { z, ZodIssue } from 'zod'

export type ValidationError = {
  field: string
  message: string
}

/**
 * Validate form data with Zod schema
 */
export function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: ValidationError[] } {
  try {
    const result = schema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    }
    const errors: ValidationError[] = result.error.issues.map((err: ZodIssue) => ({
      field: String(err.path.join('.')),
      message: err.message,
    }));
    return { success: false, errors };
  } catch (error) {
    return {
      success: false,
      errors: [
        {
          field: 'form',
          message: error instanceof Error ? error.message : 'Validation failed',
        },
      ],
    };
  }
}
export const commonSchemas = {
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  url: z.string().url('Invalid URL'),
  uuid: z.string().uuid('Invalid UUID'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  date: z.string().datetime('Invalid date'),
  positiveNumber: z.number().positive('Must be a positive number'),
  nonEmptyString: z.string().min(1, 'This field is required'),
}
