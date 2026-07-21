/**
 * Deposit Validation Schemas
 * Zod schemas for deposit request validation
 */

import { z } from 'zod';

/**
 * Create Deposit Request Schema
 */
export const CreateDepositSchema = z.object({
  escrowId: z.string().uuid('Invalid escrow ID format'),
  amount: z
    .number()
    .positive('Amount must be greater than zero')
    .min(1, 'Minimum deposit amount is $1.00')
    .max(1000000, 'Maximum deposit amount is $1,000,000'),
  paymentMethodId: z.string().uuid('Invalid payment method ID format'),
  currency: z
    .string()
    .length(3, 'Currency must be a 3-letter ISO code')
    .toUpperCase()
    .default('USD'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type CreateDepositDTO = z.infer<typeof CreateDepositSchema>;

/**
 * Process Deposit Schema
 */
export const ProcessDepositSchema = z.object({
  depositId: z.string().uuid('Invalid deposit ID format'),
  idempotencyKey: z.string().uuid('Invalid idempotency key format').optional(),
});

export type ProcessDepositDTO = z.infer<typeof ProcessDepositSchema>;

/**
 * Retry Deposit Schema
 */
export const RetryDepositSchema = z.object({
  depositId: z.string().uuid('Invalid deposit ID format'),
  paymentMethodId: z.string().uuid('Invalid payment method ID format').optional(),
  force: z.boolean().default(false),
});

export type RetryDepositDTO = z.infer<typeof RetryDepositSchema>;

/**
 * Cancel Deposit Schema
 */
export const CancelDepositSchema = z.object({
  depositId: z.string().uuid('Invalid deposit ID format'),
  reason: z
    .string()
    .min(10, 'Cancellation reason must be at least 10 characters')
    .max(500, 'Cancellation reason must be 500 characters or less'),
});

export type CancelDepositDTO = z.infer<typeof CancelDepositSchema>;

/**
 * Get Deposit History Schema
 */
export const GetDepositHistorySchema = z.object({
  escrowId: z.string().uuid('Invalid escrow ID format').optional(),
  userId: z.string().uuid('Invalid user ID format').optional(),
  status: z
    .enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED'])
    .optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type GetDepositHistoryDTO = z.infer<typeof GetDepositHistorySchema>;

/**
 * Deposit ID Parameter Schema
 */
export const DepositIdParamSchema = z.object({
  depositId: z.string().uuid('Invalid deposit ID format'),
});

export type DepositIdParam = z.infer<typeof DepositIdParamSchema>;

/**
 * Escrow ID Parameter Schema
 */
export const EscrowIdParamSchema = z.object({
  escrowId: z.string().uuid('Invalid escrow ID format'),
});

export type EscrowIdParam = z.infer<typeof EscrowIdParamSchema>;

/**
 * Validate deposit amount constraints
 */
export function validateDepositAmount(amount: number, escrowBalance: number): string | null {
  if (amount <= 0) {
    return 'Deposit amount must be greater than zero';
  }

  if (amount < 1) {
    return 'Minimum deposit amount is $1.00';
  }

  if (amount > 1000000) {
    return 'Maximum single deposit is $1,000,000';
  }

  // Additional business rules can be added here
  return null;
}

/**
 * Validate deposit status transition
 */
export function canTransitionStatus(
  currentStatus: string,
  newStatus: string
): { allowed: boolean; reason?: string } {
  const allowedTransitions: Record<string, string[]> = {
    PENDING: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['COMPLETED', 'FAILED'],
    FAILED: ['PENDING'], // Allow retry
    COMPLETED: ['REFUNDED'],
    CANCELLED: [],
    REFUNDED: [],
  };

  const allowed = allowedTransitions[currentStatus]?.includes(newStatus) || false;

  return {
    allowed,
    reason: allowed ? undefined : `Cannot transition from ${currentStatus} to ${newStatus}`,
  };
}
