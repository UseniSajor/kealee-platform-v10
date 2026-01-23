/**
 * Release/Payout Modal
 * Release escrow funds to a party
 */

import React, { useState } from 'react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { Alert, AlertDescription } from '../../ui/Alert';
import { Separator } from '../../ui/Separator';
import {
  X,
  Loader2,
  AlertCircle,
  DollarSign,
  ArrowRight,
  CheckCircle,
  FileText,
  Shield,
} from 'lucide-react';

interface ReleasePayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  escrowId: string;
  availableBalance: number;
  recipientType?: 'CONTRACTOR' | 'OWNER';
  onRelease: (data: ReleasePayoutData) => Promise<void>;
}

export interface ReleasePayoutData {
  amount: number;
  recipientType: 'CONTRACTOR' | 'OWNER';
  reason: string;
  notes?: string;
}

export function ReleasePayoutModal({
  isOpen,
  onClose,
  escrowId,
  availableBalance,
  recipientType = 'CONTRACTOR',
  onRelease,
}: ReleasePayoutModalProps) {
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState<'CONTRACTOR' | 'OWNER'>(recipientType);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');

  if (!isOpen) return null;

  const parsedAmount = parseFloat(amount) || 0;
  const fee = parsedAmount * 0.029 + 0.3; // 2.9% + $0.30
  const netAmount = parsedAmount - fee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (parsedAmount <= 0) {
      setError('Amount must be greater than $0');
      return;
    }

    if (parsedAmount > availableBalance) {
      setError(`Amount cannot exceed available balance ($${availableBalance.toFixed(2)})`);
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason for the release');
      return;
    }

    // Move to confirmation step
    setStep('confirm');
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    setError('');

    try {
      await onRelease({
        amount: parsedAmount,
        recipientType: recipient,
        reason,
        notes,
      });

      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Failed to release funds');
      setStep('form');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setReason('');
    setNotes('');
    setError('');
    setStep('form');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                {step === 'success' ? 'Payout Complete' : 'Release Escrow Funds'}
              </h2>
              <p className="text-sm text-gray-600">
                Available: ${availableBalance.toFixed(2)}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isProcessing}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {step === 'form' && (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Recipient Selection */}
            <div>
              <Label>Release funds to</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setRecipient('CONTRACTOR')}
                  className={`
                    p-4 border-2 rounded-lg transition-all
                    ${
                      recipient === 'CONTRACTOR'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="font-medium">Contractor</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Pay for completed work
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setRecipient('OWNER')}
                  className={`
                    p-4 border-2 rounded-lg transition-all
                    ${
                      recipient === 'OWNER'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="font-medium">Project Owner</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Refund or return funds
                  </div>
                </button>
              </div>
            </div>

            {/* Amount */}
            <div>
              <Label htmlFor="amount">Release Amount</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  $
                </span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={availableBalance}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-7"
                  required
                  disabled={isProcessing}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Maximum: ${availableBalance.toFixed(2)}
              </p>
            </div>

            {/* Fee Breakdown */}
            {parsedAmount > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Release amount:</span>
                  <span className="font-medium">${parsedAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Processing fee:</span>
                  <span className="font-medium text-red-600">-${fee.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-semibold">Net payout:</span>
                  <span className="font-semibold text-green-600">
                    ${netAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Reason */}
            <div>
              <Label htmlFor="reason">Reason for Release</Label>
              <select
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={isProcessing}
              >
                <option value="">Select a reason...</option>
                <option value="MILESTONE_COMPLETED">Milestone completed</option>
                <option value="WORK_COMPLETED">Work completed</option>
                <option value="PARTIAL_PAYMENT">Partial payment</option>
                <option value="FINAL_PAYMENT">Final payment</option>
                <option value="REFUND">Refund</option>
                <option value="CANCELLATION">Project cancellation</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes..."
                rows={3}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isProcessing}
              />
            </div>

            {/* Error */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Security Notice */}
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Secure Transaction:</strong> Funds will be transferred securely via
                Stripe. The recipient will receive a notification and can expect the funds
                within 1-2 business days.
              </AlertDescription>
            </Alert>

            {/* Footer */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isProcessing || !parsedAmount}>
                Review Release
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </form>
        )}

        {/* Confirmation Step */}
        {step === 'confirm' && (
          <div className="p-6 space-y-6">
            {/* Summary */}
            <div className="bg-blue-50 rounded-lg p-6 space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">You are releasing</p>
                <p className="text-4xl font-bold text-gray-900">${parsedAmount.toFixed(2)}</p>
                <p className="text-sm text-gray-600 mt-1">
                  to {recipient === 'CONTRACTOR' ? 'Contractor' : 'Project Owner'}
                </p>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Release amount:</span>
                  <span className="font-medium">${parsedAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Processing fee:</span>
                  <span className="font-medium">-${fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t">
                  <span>Net payout:</span>
                  <span className="text-green-600">${netAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-600">Reason:</span>
                <span className="ml-2 font-medium">{reason.replace(/_/g, ' ')}</span>
              </div>
              {notes && (
                <div>
                  <span className="text-gray-600">Notes:</span>
                  <p className="mt-1 text-gray-900">{notes}</p>
                </div>
              </div>
            </div>

            {/* Warning */}
            <Alert variant="warning">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>This action cannot be undone.</strong> Once released, funds will be
                transferred to the recipient's account.
              </AlertDescription>
            </Alert>

            {/* Error */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Footer */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('form')}
                className="flex-1"
                disabled={isProcessing}
              >
                Back
              </Button>
              <Button
                onClick={handleConfirm}
                className="flex-1"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Confirm Release
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <div className="p-6 space-y-6 text-center">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Funds Released Successfully!
              </h3>
              <p className="text-gray-600">
                ${netAmount.toFixed(2)} will be transferred to the recipient's account within 1-2
                business days.
              </p>
            </div>

            {/* Receipt */}
            <div className="bg-gray-50 rounded-lg p-4 text-left space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600 mb-3">
                <FileText className="w-4 h-4" />
                <span className="font-medium">Transaction Summary</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">${parsedAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fee:</span>
                <span className="font-medium">-${fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Recipient:</span>
                <span className="font-medium capitalize">{recipient.toLowerCase()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t font-semibold">
                <span>Net Payout:</span>
                <span className="text-green-600">${netAmount.toFixed(2)}</span>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                A receipt has been sent to your email. You can also view this transaction in your
                transaction history.
              </AlertDescription>
            </Alert>

            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReleasePayoutModal;
