import { Decimal } from '@prisma/client/runtime/library';

/**
 * Convert Decimal to number safely
 */
export function toNumber(value: Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return value instanceof Decimal ? value.toNumber() : value;
}

/**
 * Convert to Decimal safely
 */
export function toDecimal(value: number | string | Decimal): Decimal {
  if (value instanceof Decimal) return value;
  return new Decimal(value);
}

/**
 * Add Decimal values and return number
 */
export function addDecimal(a: Decimal | number, b: Decimal | number): number {
  return toNumber(a) + toNumber(b);
}

/**
 * Subtract Decimal values and return number
 */
export function subtractDecimal(a: Decimal | number, b: Decimal | number): number {
  return toNumber(a) - toNumber(b);
}

/**
 * Multiply Decimal values and return number
 */
export function multiplyDecimal(a: Decimal | number, b: Decimal | number): number {
  return toNumber(a) * toNumber(b);
}

/**
 * Divide Decimal values and return number
 */
export function divideDecimal(a: Decimal | number, b: Decimal | number): number {
  return toNumber(a) / toNumber(b);
}

/**
 * Sum array of Decimal values
 */
export function sumDecimals(values: (Decimal | number)[]): number {
  return values.reduce((sum, val) => {
    return sum + toNumber(val);
  }, 0);
}

/**
 * Format Decimal as currency
 */
export function formatDecimalCurrency(value: Decimal | number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(toNumber(value));
}
