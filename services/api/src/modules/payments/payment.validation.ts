/**
 * Payment Method Validation Schemas
 * Zod schemas for payment method management
 */

import { z } from 'zod';

/**
 * Add Payment Method Schema
 */
export const AddPaymentMethodSchema = z.object({
  type: z.enum(['CARD', 'ACH', 'WIRE'], {
    errorMap: () => ({ message: 'Payment type must be CARD, ACH, or WIRE' }),
  }),
  stripePaymentMethodId: z
    .string()
    .min(1, 'Stripe payment method ID is required')
    .regex(/^pm_[a-zA-Z0-9]+$/, 'Invalid Stripe payment method ID format'),
  isDefault: z.boolean().default(false),
  billingDetails: z
    .object({
      name: z.string().min(1).max(100).optional(),
      email: z.string().email().optional(),
      phone: z.string().max(20).optional(),
      address: z
        .object({
          line1: z.string().max(100).optional(),
          line2: z.string().max(100).optional(),
          city: z.string().max(50).optional(),
          state: z.string().max(50).optional(),
          postalCode: z.string().max(20).optional(),
          country: z.string().length(2).optional(),
        })
        .optional(),
    })
    .optional(),
});

export type AddPaymentMethodDTO = z.infer<typeof AddPaymentMethodSchema>;

/**
 * Verify Payment Method Schema (for ACH micro-deposits)
 */
export const VerifyPaymentMethodSchema = z.object({
  amount1: z
    .number()
    .int('Amount must be in cents')
    .positive('Amount must be greater than zero')
    .max(99, 'Amount must be less than $1.00'),
  amount2: z
    .number()
    .int('Amount must be in cents')
    .positive('Amount must be greater than zero')
    .max(99, 'Amount must be less than $1.00'),
});

export type VerifyPaymentMethodDTO = z.infer<typeof VerifyPaymentMethodSchema>;

/**
 * Set Default Payment Method Schema
 */
export const SetDefaultPaymentMethodSchema = z.object({
  paymentMethodId: z.string().uuid('Invalid payment method ID format'),
});

export type SetDefaultPaymentMethodDTO = z.infer<typeof SetDefaultPaymentMethodSchema>;

/**
 * Remove Payment Method Schema
 */
export const RemovePaymentMethodSchema = z.object({
  paymentMethodId: z.string().uuid('Invalid payment method ID format'),
  force: z.boolean().default(false), // Force delete even if it's the default
});

export type RemovePaymentMethodDTO = z.infer<typeof RemovePaymentMethodSchema>;

/**
 * Get Setup Intent Schema
 */
export const GetSetupIntentSchema = z.object({
  type: z.enum(['CARD', 'ACH']),
  customerId: z.string().optional(),
});

export type GetSetupIntentDTO = z.infer<typeof GetSetupIntentSchema>;

/**
 * Payment Method ID Parameter Schema
 */
export const PaymentMethodIdParamSchema = z.object({
  paymentMethodId: z.string().uuid('Invalid payment method ID format'),
});

export type PaymentMethodIdParam = z.infer<typeof PaymentMethodIdParamSchema>;

/**
 * List Payment Methods Schema
 */
export const ListPaymentMethodsSchema = z.object({
  type: z.enum(['CARD', 'ACH', 'WIRE']).optional(),
  isVerified: z.coerce.boolean().optional(),
  isDefault: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export type ListPaymentMethodsDTO = z.infer<typeof ListPaymentMethodsSchema>;

/**
 * Validate card expiry
 */
export function validateCardExpiry(month: number, year: number): string | null {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed

  if (month < 1 || month > 12) {
    return 'Invalid expiry month. Must be between 1 and 12';
  }

  if (year < currentYear) {
    return 'Card has expired';
  }

  if (year === currentYear && month < currentMonth) {
    return 'Card has expired';
  }

  if (year > currentYear + 20) {
    return 'Invalid expiry year';
  }

  return null;
}

/**
 * Validate routing number (US bank routing number)
 */
export function validateRoutingNumber(routingNumber: string): string | null {
  // Must be exactly 9 digits
  if (!/^\d{9}$/.test(routingNumber)) {
    return 'Routing number must be exactly 9 digits';
  }

  // ABA routing number checksum validation
  const digits = routingNumber.split('').map(Number);
  const checksum =
    3 * (digits[0] + digits[3] + digits[6]) +
    7 * (digits[1] + digits[4] + digits[7]) +
    (digits[2] + digits[5] + digits[8]);

  if (checksum % 10 !== 0) {
    return 'Invalid routing number checksum';
  }

  return null;
}

/**
 * Validate account number
 */
export function validateAccountNumber(accountNumber: string): string | null {
  // Must be between 4 and 17 digits
  if (!/^\d{4,17}$/.test(accountNumber)) {
    return 'Account number must be between 4 and 17 digits';
  }

  return null;
}
