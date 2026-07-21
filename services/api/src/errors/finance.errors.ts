/**
 * Finance Module Custom Error Classes
 * Standardized errors for payment, escrow, and deposit operations
 */

/**
 * Base Finance Error
 */
export class FinanceError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, any>;

  constructor(
    message: string,
    code: string = 'FINANCE_ERROR',
    statusCode: number = 500,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        name: this.name,
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        details: this.details,
      },
    };
  }
}

// ============================================================================
// PAYMENT METHOD ERRORS
// ============================================================================

export class PaymentMethodError extends FinanceError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'PAYMENT_METHOD_ERROR', 400, details);
  }
}

export class PaymentMethodNotFoundError extends FinanceError {
  constructor(paymentMethodId: string) {
    super(
      `Payment method not found: ${paymentMethodId}`,
      'PAYMENT_METHOD_NOT_FOUND',
      404,
      { paymentMethodId }
    );
  }
}

export class PaymentMethodNotVerifiedError extends FinanceError {
  constructor(paymentMethodId: string) {
    super(
      'Payment method requires verification before use',
      'PAYMENT_METHOD_NOT_VERIFIED',
      403,
      { paymentMethodId }
    );
  }
}

export class PaymentMethodExpiredError extends FinanceError {
  constructor(paymentMethodId: string) {
    super(
      'Payment method has expired',
      'PAYMENT_METHOD_EXPIRED',
      400,
      { paymentMethodId }
    );
  }
}

export class InvalidCardError extends FinanceError {
  constructor(reason: string) {
    super(`Invalid card: ${reason}`, 'INVALID_CARD', 400, { reason });
  }
}

export class InvalidBankAccountError extends FinanceError {
  constructor(reason: string) {
    super(`Invalid bank account: ${reason}`, 'INVALID_BANK_ACCOUNT', 400, { reason });
  }
}

// ============================================================================
// DEPOSIT ERRORS
// ============================================================================

export class DepositError extends FinanceError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'DEPOSIT_ERROR', 400, details);
  }
}

export class DepositNotFoundError extends FinanceError {
  constructor(depositId: string) {
    super(
      `Deposit not found: ${depositId}`,
      'DEPOSIT_NOT_FOUND',
      404,
      { depositId }
    );
  }
}

export class DepositAlreadyProcessedError extends FinanceError {
  constructor(depositId: string) {
    super(
      'Deposit has already been processed',
      'DEPOSIT_ALREADY_PROCESSED',
      409,
      { depositId }
    );
  }
}

export class DepositProcessingError extends FinanceError {
  constructor(message: string, depositId: string, details?: Record<string, any>) {
    super(
      `Deposit processing failed: ${message}`,
      'DEPOSIT_PROCESSING_FAILED',
      500,
      { depositId, ...details }
    );
  }
}

export class InsufficientFundsError extends FinanceError {
  constructor(required: number, available: number) {
    super(
      `Insufficient funds: Required $${required.toFixed(2)}, Available $${available.toFixed(2)}`,
      'INSUFFICIENT_FUNDS',
      402,
      { required, available }
    );
  }
}

export class DepositAmountError extends FinanceError {
  constructor(reason: string, amount?: number) {
    super(
      `Invalid deposit amount: ${reason}`,
      'INVALID_DEPOSIT_AMOUNT',
      400,
      { reason, amount }
    );
  }
}

// ============================================================================
// ESCROW ERRORS
// ============================================================================

export class EscrowError extends FinanceError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'ESCROW_ERROR', 400, details);
  }
}

export class EscrowNotFoundError extends FinanceError {
  constructor(escrowId: string) {
    super(
      `Escrow account not found: ${escrowId}`,
      'ESCROW_NOT_FOUND',
      404,
      { escrowId }
    );
  }
}

export class EscrowFrozenError extends FinanceError {
  constructor(escrowId: string, reason?: string) {
    super(
      `Escrow account is frozen${reason ? `: ${reason}` : ''}`,
      'ESCROW_FROZEN',
      403,
      { escrowId, reason }
    );
  }
}

export class EscrowClosedError extends FinanceError {
  constructor(escrowId: string) {
    super(
      'Escrow account is closed and cannot be modified',
      'ESCROW_CLOSED',
      403,
      { escrowId }
    );
  }
}

export class InsufficientEscrowBalanceError extends FinanceError {
  constructor(escrowId: string, required: number, available: number) {
    super(
      `Insufficient escrow balance: Required $${required.toFixed(2)}, Available $${available.toFixed(2)}`,
      'INSUFFICIENT_ESCROW_BALANCE',
      402,
      { escrowId, required, available }
    );
  }
}

export class EscrowHoldError extends FinanceError {
  constructor(message: string, holdId?: string) {
    super(
      `Hold error: ${message}`,
      'ESCROW_HOLD_ERROR',
      400,
      { holdId }
    );
  }
}

export class EscrowReleaseError extends FinanceError {
  constructor(message: string, details?: Record<string, any>) {
    super(
      `Release error: ${message}`,
      'ESCROW_RELEASE_ERROR',
      400,
      details
    );
  }
}

// ============================================================================
// REFUND ERRORS
// ============================================================================

export class RefundError extends FinanceError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'REFUND_ERROR', 400, details);
  }
}

export class RefundNotAllowedError extends FinanceError {
  constructor(reason: string) {
    super(
      `Refund not allowed: ${reason}`,
      'REFUND_NOT_ALLOWED',
      403,
      { reason }
    );
  }
}

export class RefundProcessingError extends FinanceError {
  constructor(message: string, details?: Record<string, any>) {
    super(
      `Refund processing failed: ${message}`,
      'REFUND_PROCESSING_FAILED',
      500,
      details
    );
  }
}

// ============================================================================
// STRIPE ERRORS
// ============================================================================

export class StripeError extends FinanceError {
  constructor(message: string, stripeCode?: string, details?: Record<string, any>) {
    super(
      `Stripe error: ${message}`,
      'STRIPE_ERROR',
      402,
      { stripeCode, ...details }
    );
  }
}

export class StripeCardDeclinedError extends FinanceError {
  constructor(declineCode?: string) {
    super(
      'Card was declined',
      'CARD_DECLINED',
      402,
      { declineCode }
    );
  }
}

export class StripeInsufficientFundsError extends FinanceError {
  constructor() {
    super(
      'Insufficient funds in account',
      'STRIPE_INSUFFICIENT_FUNDS',
      402
    );
  }
}

export class StripeAuthenticationRequiredError extends FinanceError {
  constructor(paymentIntentId: string) {
    super(
      'Additional authentication required',
      'AUTHENTICATION_REQUIRED',
      402,
      { paymentIntentId }
    );
  }
}

// ============================================================================
// VALIDATION ERRORS
// ============================================================================

export class ValidationError extends FinanceError {
  constructor(message: string, fields?: Record<string, string[]>) {
    super(
      `Validation failed: ${message}`,
      'VALIDATION_ERROR',
      400,
      { fields }
    );
  }
}

// ============================================================================
// AUTHORIZATION ERRORS
// ============================================================================

export class UnauthorizedFinanceOperationError extends FinanceError {
  constructor(operation: string, userId: string) {
    super(
      `Unauthorized to perform ${operation}`,
      'UNAUTHORIZED_FINANCE_OPERATION',
      403,
      { operation, userId }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if error is operational (expected error vs programming error)
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof FinanceError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Convert Stripe error to custom error
 */
export function handleStripeError(stripeError: any): FinanceError {
  const { type, code, message, decline_code, payment_intent } = stripeError;

  switch (type) {
    case 'card_error':
      if (decline_code === 'insufficient_funds') {
        return new StripeInsufficientFundsError();
      }
      if (code === 'card_declined') {
        return new StripeCardDeclinedError(decline_code);
      }
      return new StripeError(message, code);

    case 'authentication_error':
      return new StripeAuthenticationRequiredError(payment_intent?.id);

    case 'api_error':
    case 'api_connection_error':
    case 'rate_limit_error':
      return new StripeError(message, code, { type });

    default:
      return new StripeError(message || 'Unknown Stripe error', code);
  }
}

/**
 * Log finance error for monitoring
 */
export function logFinanceError(error: FinanceError, context?: Record<string, any>): void {
  console.error('[Finance Error]', {
    name: error.name,
    code: error.code,
    message: error.message,
    statusCode: error.statusCode,
    details: error.details,
    context,
    stack: error.stack,
  });
}
