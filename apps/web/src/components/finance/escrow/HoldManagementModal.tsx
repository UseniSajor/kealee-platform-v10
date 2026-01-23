/**
 * Hold Management Modal
 * Place, view, and release holds on escrow funds
 */

import React, { useState } from 'react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { Alert, AlertDescription } from '../../ui/Alert';
import { Badge } from '../../ui/Badge';
import {
  X,
  Loader2,
  AlertCircle,
  Lock,
  Unlock,
  DollarSign,
  Clock,
} from 'lucide-react';

interface Hold {
  id: string;
  amount: number;
  reason: string;
  placedAt: Date;
  expiresAt?: Date;
  status: 'ACTIVE' | 'RELEASED' | 'EXPIRED';
}

interface HoldManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  escrowId: string;
  availableBalance: number;
  existingHolds?: Hold[];
  onPlaceHold: (data: PlaceHoldData) => Promise<void>;
  onReleaseHold: (holdId: string) => Promise<void>;
}

export interface PlaceHoldData {
  amount: number;
  reason: string;
  duration?: number; // days
}

export function HoldManagementModal({
  isOpen,
  onClose,
  escrowId,
  availableBalance,
  existingHolds = [],
  onPlaceHold,
  onReleaseHold,
}: HoldManagementModalProps) {
  const [mode, setMode] = useState<'view' | 'place'>('view');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('30');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const activeHolds = existingHolds.filter((h) => h.status === 'ACTIVE');
  const totalHeld = activeHolds.reduce((sum, h) => sum + h.amount, 0);

  const handlePlaceHold = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Amount must be greater than $0');
      return;
    }

    if (parsedAmount > availableBalance) {
      setError(`Amount cannot exceed available balance ($${availableBalance.toFixed(2)})`);
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason for the hold');
      return;
    }

    setIsProcessing(true);

    try {
      await onPlaceHold({
        amount: parsedAmount,
        reason,
        duration: parseInt(duration) || undefined,
      });

      setAmount('');
      setReason('');
      setMode('view');
    } catch (err: any) {
      setError(err.message || 'Failed to place hold');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReleaseHold = async (holdId: string) => {
    if (!confirm('Are you sure you want to release this hold?')) {
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      await onReleaseHold(holdId);
    } catch (err: any) {
      setError(err.message || 'Failed to release hold');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Lock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Hold Management</h2>
              <p className="text-sm text-gray-600">
                Available: ${availableBalance.toFixed(2)} | Held: ${totalHeld.toFixed(2)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isProcessing}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Mode Toggle */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={mode === 'view' ? 'default' : 'outline'}
              onClick={() => setMode('view')}
              className="flex-1"
              disabled={isProcessing}
            >
              View Holds ({activeHolds.length})
            </Button>
            <Button
              variant={mode === 'place' ? 'default' : 'outline'}
              onClick={() => setMode('place')}
              className="flex-1"
              disabled={isProcessing}
            >
              Place New Hold
            </Button>
          </div>

          {/* View Mode */}
          {mode === 'view' && (
            <div className="space-y-4">
              {activeHolds.length === 0 ? (
                <div className="text-center py-12">
                  <Lock className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">No Active Holds</h3>
                  <p className="text-gray-600 mb-4">
                    No funds are currently on hold
                  </p>
                  <Button onClick={() => setMode('place')}>Place New Hold</Button>
                </div>
              ) : (
                activeHolds.map((hold) => (
                  <div
                    key={hold.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Lock className="w-4 h-4 text-orange-600" />
                          <span className="font-semibold text-lg">
                            ${hold.amount.toFixed(2)}
                          </span>
                          <Badge variant="warning">On Hold</Badge>
                        </div>
                        <p className="text-gray-700 mb-1">{hold.reason}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>
                            Placed: {new Date(hold.placedAt).toLocaleDateString()}
                          </span>
                          {hold.expiresAt && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Expires: {new Date(hold.expiresAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReleaseHold(hold.id)}
                        disabled={isProcessing}
                        className="ml-4"
                      >
                        <Unlock className="w-4 h-4 mr-1" />
                        Release
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Place Hold Mode */}
          {mode === 'place' && (
            <form onSubmit={handlePlaceHold} className="space-y-6">
              {/* Amount */}
              <div>
                <Label htmlFor="hold-amount">Hold Amount</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <Input
                    id="hold-amount"
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
                  Available to hold: ${availableBalance.toFixed(2)}
                </p>
              </div>

              {/* Reason */}
              <div>
                <Label htmlFor="hold-reason">Reason for Hold</Label>
                <select
                  id="hold-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={isProcessing}
                >
                  <option value="">Select a reason...</option>
                  <option value="DISPUTE">Dispute investigation</option>
                  <option value="VERIFICATION">Pending verification</option>
                  <option value="REVIEW">Quality review</option>
                  <option value="INSPECTION">Pending inspection</option>
                  <option value="DOCUMENTATION">Missing documentation</option>
                  <option value="COMPLIANCE">Compliance check</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {/* Duration */}
              <div>
                <Label htmlFor="hold-duration">Hold Duration (Days)</Label>
                <Input
                  id="hold-duration"
                  type="number"
                  min="1"
                  max="90"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="30"
                  required
                  disabled={isProcessing}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Hold will automatically expire after this many days (max 90)
                </p>
              </div>

              {/* Error */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Info */}
              <Alert>
                <Lock className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>What are holds?</strong> Holds temporarily freeze funds in escrow,
                  making them unavailable for release. Use holds during disputes, pending
                  verification, or quality reviews.
                </AlertDescription>
              </Alert>

              {/* Footer */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMode('view')}
                  className="flex-1"
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Placing...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Place Hold
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default HoldManagementModal;
