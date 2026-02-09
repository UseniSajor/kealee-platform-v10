/**
 * ACH Verification Modal
 * Verify bank account with micro-deposits
 */

import React, { useState } from 'react';
import { usePaymentMethods } from '../../../hooks/usePaymentMethods';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { Alert, AlertDescription } from '../../ui/Alert';
import { X, Loader2, AlertCircle, CheckCircle, Building2 } from 'lucide-react';
import type { PaymentMethod } from '../../../types/finance.types';

interface ACHVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentMethod: PaymentMethod;
}

export function ACHVerificationModal({
  isOpen,
  onClose,
  paymentMethod,
}: ACHVerificationModalProps) {
  const { verifyPaymentMethod, isVerifying } = usePaymentMethods();
  const [amount1, setAmount1] = useState('');
  const [amount2, setAmount2] = useState('');
  const [error, setError] = useState('');
  const [isResending, setIsResending] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate amounts
    const parsedAmount1 = parseFloat(amount1);
    const parsedAmount2 = parseFloat(amount2);

    if (isNaN(parsedAmount1) || isNaN(parsedAmount2)) {
      setError('Please enter valid amounts');
      return;
    }

    if (parsedAmount1 <= 0 || parsedAmount1 >= 1) {
      setError('Amount 1 must be between $0.01 and $0.99');
      return;
    }

    if (parsedAmount2 <= 0 || parsedAmount2 >= 1) {
      setError('Amount 2 must be between $0.01 and $0.99');
      return;
    }

    try {
      verifyPaymentMethod({
        paymentMethodId: paymentMethod.id,
        amount1: Math.round(parsedAmount1 * 100), // Convert to cents
        amount2: Math.round(parsedAmount2 * 100), // Convert to cents
      });
      
      // Close modal on success
      onClose();
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the amounts and try again.');
    }
  };

  const handleResendDeposits = async () => {
    try {
      setIsResending(true);
      setError('');
      const res = await fetch('/api/deposits/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId: paymentMethod.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to resend deposits');
      }
      alert('Micro-deposits have been resent. Please check your bank account in 1-2 business days.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend deposits');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Verify Bank Account</h2>
              <p className="text-sm text-gray-600">
                {paymentMethod.bankName} •••• {paymentMethod.last4}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isVerifying}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Instructions */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Check your bank account</strong>
              <p className="mt-1 text-sm">
                We've sent two small deposits (less than $1 each) to your account.
                This usually takes 1-2 business days. Enter the exact amounts below to verify.
              </p>
            </AlertDescription>
          </Alert>

          {/* Amount 1 */}
          <div>
            <Label htmlFor="amount1">First Deposit Amount</Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                $
              </span>
              <Input
                id="amount1"
                type="number"
                step="0.01"
                min="0.01"
                max="0.99"
                value={amount1}
                onChange={(e) => setAmount1(e.target.value)}
                placeholder="0.32"
                className="pl-7"
                required
                disabled={isVerifying}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Enter amount with cents (e.g., 0.32)
            </p>
          </div>

          {/* Amount 2 */}
          <div>
            <Label htmlFor="amount2">Second Deposit Amount</Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                $
              </span>
              <Input
                id="amount2"
                type="number"
                step="0.01"
                min="0.01"
                max="0.99"
                value={amount2}
                onChange={(e) => setAmount2(e.target.value)}
                placeholder="0.45"
                className="pl-7"
                required
                disabled={isVerifying}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Enter amount with cents (e.g., 0.45)
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Help Text */}
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Verification Tips:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Check your bank statement for "AMTS" or "Stripe"</li>
                <li>Deposits appear within 1-2 business days</li>
                <li>Enter amounts exactly as they appear (including cents)</li>
                <li>You have 3 attempts to verify correctly</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Footer */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isVerifying}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isVerifying}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Account'
              )}
            </Button>
          </div>

          {/* Additional Help */}
          <div className="text-center">
            <button
              type="button"
              className="text-sm text-blue-600 hover:underline disabled:opacity-50"
              disabled={isResending || isVerifying}
              onClick={handleResendDeposits}
            >
              {isResending ? 'Resending...' : "Haven't received deposits? Resend"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ACHVerificationModal;
