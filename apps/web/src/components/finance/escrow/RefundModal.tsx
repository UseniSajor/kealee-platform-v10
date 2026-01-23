/**
 * Refund Modal
 * Process refunds from escrow to original depositor
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
  RotateCcw,
  CheckCircle,
  ArrowLeft,
  Shield,
} from 'lucide-react';

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  escrowId: string;
  availableBalance: number;
  originalDeposit: number;
  depositorName: string;
  onRefund: (data: RefundData) => Promise<void>;
}

export interface RefundData {
  amount: number;
  reason: string;
  refundType: 'FULL' | 'PARTIAL';
  notes?: string;
}

export function RefundModal({
  isOpen,
  onClose,
  escrowId,
  availableBalance,
  originalDeposit,
  depositorName,
  onRefund,
}: RefundModalProps) {
  const [refundType, setRefundType] = useState<'FULL' | 'PARTIAL'>('FULL');
  const [amount, setAmount] = useState(availableBalance.toString());
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');

  if (!isOpen) return null;

  const parsedAmount = parseFloat(amount) || 0;
  const fee = parsedAmount * 0.029 + 0.3; // 2.9% + $0.30
  const netRefund = parsedAmount - fee;

  // Set amount when refund type changes
  React.useEffect(() => {
    if (refundType === 'FULL') {
      setAmount(availableBalance.toString());
    }
  }, [refundType, availableBalance]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (parsedAmount <= 0) {
      setError('Refund amount must be greater than $0');
      return;
    }

    if (parsedAmount > availableBalance) {
      setError(`Refund cannot exceed available balance ($${availableBalance.toFixed(2)})`);
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason for the refund');
      return;
    }

    setStep('confirm');
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    setError('');

    try {
      await onRefund({
        amount: parsedAmount,
        reason,
        refundType,
        notes,
      });

      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Failed to process refund');
      setStep('form');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setAmount(availableBalance.toString());
    setReason('');
    setNotes('');
    setError('');
    setStep('form');
    setRefundType('FULL');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <RotateCcw className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                {step === 'success' ? 'Refund Processed' : 'Process Refund'}
              </h2>
              <p className="text-sm text-gray-600">
                To: {depositorName} | Available: ${availableBalance.toFixed(2)}
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
            {/* Refund Type */}
            <div>
              <Label>Refund Type</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setRefundType('FULL')}
                  className={`
                    p-4 border-2 rounded-lg transition-all
                    ${
                      refundType === 'FULL'
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="font-medium">Full Refund</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Return all available funds
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setRefundType('PARTIAL')}
                  className={`
                    p-4 border-2 rounded-lg transition-all
                    ${
                      refundType === 'PARTIAL'
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="font-medium">Partial Refund</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Return a specific amount
                  </div>
                </button>
              </div>
            </div>

            {/* Amount */}
            <div>
              <Label htmlFor="refund-amount">Refund Amount</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  $
                </span>
                <Input
                  id="refund-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={availableBalance}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-7"
                  required
                  disabled={isProcessing || refundType === 'FULL'}
                  readOnly={refundType === 'FULL'}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Original deposit: ${originalDeposit.toFixed(2)}
              </p>
            </div>

            {/* Fee Breakdown */}
            {parsedAmount > 0 && (
              <div className="bg-purple-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Refund amount:</span>
                  <span className="font-medium">${parsedAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Processing fee:</span>
                  <span className="font-medium text-red-600">-${fee.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-semibold">Net refund:</span>
                  <span className="font-semibold text-purple-600">
                    ${netRefund.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Reason */}
            <div>
              <Label htmlFor="refund-reason">Reason for Refund</Label>
              <select
                id="refund-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
                disabled={isProcessing}
              >
                <option value="">Select a reason...</option>
                <option value="PROJECT_CANCELLED">Project cancelled</option>
                <option value="WORK_NOT_STARTED">Work not started</option>
                <option value="CUSTOMER_REQUEST">Customer request</option>
                <option value="DISPUTE_RESOLUTION">Dispute resolution</option>
                <option value="CONTRACTOR_UNAVAILABLE">Contractor unavailable</option>
                <option value="QUALITY_ISSUES">Quality issues</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="refund-notes">Additional Notes (Optional)</Label>
              <textarea
                id="refund-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Provide additional context..."
                rows={3}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                <strong>Secure Refund:</strong> Funds will be returned to the original payment
                method. The depositor will receive a notification and can expect the refund within
                5-10 business days.
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
                Review Refund
              </Button>
            </div>
          </form>
        )}

        {/* Confirmation Step */}
        {step === 'confirm' && (
          <div className="p-6 space-y-6">
            {/* Summary */}
            <div className="bg-purple-50 rounded-lg p-6 space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">
                  {refundType === 'FULL' ? 'Full Refund' : 'Partial Refund'}
                </p>
                <p className="text-4xl font-bold text-gray-900">${parsedAmount.toFixed(2)}</p>
                <p className="text-sm text-gray-600 mt-1">to {depositorName}</p>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Refund amount:</span>
                  <span className="font-medium">${parsedAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Processing fee:</span>
                  <span className="font-medium">-${fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t">
                  <span>Net refund:</span>
                  <span className="text-purple-600">${netRefund.toFixed(2)}</span>
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
              )}
            </div>

            {/* Warning */}
            <Alert variant="warning">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>This action cannot be undone.</strong> The refund will be processed to the
                original payment method. Funds will appear in 5-10 business days.
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
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleConfirm} className="flex-1" disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Confirm Refund
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
                Refund Processed Successfully!
              </h3>
              <p className="text-gray-600">
                ${netRefund.toFixed(2)} will be refunded to {depositorName}'s original payment
                method within 5-10 business days.
              </p>
            </div>

            {/* Receipt */}
            <div className="bg-gray-50 rounded-lg p-4 text-left space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Refund Amount:</span>
                <span className="font-medium">${parsedAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Processing Fee:</span>
                <span className="font-medium">-${fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium capitalize">{refundType.toLowerCase()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t font-semibold">
                <span>Net Refund:</span>
                <span className="text-purple-600">${netRefund.toFixed(2)}</span>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Both you and {depositorName} will receive email confirmation. The refund will appear
                on the original payment method statement as "KEALEE REFUND".
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

export default RefundModal;
