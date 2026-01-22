import React from 'react';
import { usePaymentMethods } from '../../../hooks/usePaymentMethods';
import { Button } from '../../ui/Button';
import { Alert, AlertDescription } from '../../ui/Alert';
import { Separator } from '../../ui/Separator';
import { CreditCard, Building2, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { formatCurrency } from '../../../utils/format';
import type { EscrowAgreement } from '../../../types/finance.types';

interface DepositConfirmationProps {
  amount: number;
  paymentMethodId: string;
  escrow: EscrowAgreement;
  onConfirm: () => void;
  onBack: () => void;
}

export function DepositConfirmation({
  amount,
  paymentMethodId,
  escrow,
  onConfirm,
  onBack,
}: DepositConfirmationProps) {
  const { paymentMethods } = usePaymentMethods();
  
  const paymentMethod = paymentMethods?.find((m) => m.id === paymentMethodId);
  
  if (!paymentMethod) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Payment method not found</AlertDescription>
      </Alert>
    );
  }

  const platformFee = amount * 0.029 + 0.30; // 2.9% + $0.30 (typical Stripe fee)
  const totalCharge = amount + platformFee;
  const processingTime = paymentMethod.type === 'CARD' ? 'Instant' : '3-5 business days';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Review Deposit</h2>
        <p className="text-gray-600">
          Please review the details before confirming your deposit.
        </p>
      </div>

      {/* Success Alert */}
      <Alert variant="success">
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          Your deposit details are ready for confirmation.
        </AlertDescription>
      </Alert>

      {/* Deposit Summary */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        {/* Amount */}
        <div>
          <p className="text-sm text-gray-600 mb-1">Deposit Amount</p>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(amount)}</p>
        </div>

        <Separator />

        {/* Payment Method */}
        <div>
          <p className="text-sm text-gray-600 mb-2">Payment Method</p>
          <div className="flex items-center gap-3 bg-white rounded-lg p-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              {paymentMethod.type === 'CARD' ? (
                <CreditCard className="w-5 h-5 text-gray-600" />
              ) : (
                <Building2 className="w-5 h-5 text-gray-600" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">
                {paymentMethod.type === 'CARD'
                  ? `${paymentMethod.brand} •••• ${paymentMethod.last4}`
                  : `${paymentMethod.bankName} •••• ${paymentMethod.last4}`}
              </p>
              <p className="text-sm text-gray-600">{processingTime}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Escrow Account */}
        <div>
          <p className="text-sm text-gray-600 mb-2">Escrow Account</p>
          <div className="bg-white rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Account Number</span>
              <span className="font-mono font-medium">{escrow.escrowAccountNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Current Balance</span>
              <span className="font-medium">{formatCurrency(escrow.currentBalance)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">New Balance</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(escrow.currentBalance + amount)}
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Fee Breakdown */}
        <div>
          <p className="text-sm text-gray-600 mb-2">Fee Breakdown</p>
          <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Deposit Amount</span>
              <span className="font-medium">{formatCurrency(amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Processing Fee</span>
              <span className="font-medium">{formatCurrency(platformFee)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total Charge</span>
              <span>{formatCurrency(totalCharge)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Processing Time Notice */}
      <Alert>
        <Clock className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <p className="font-medium mb-1">Processing Time: {processingTime}</p>
          {paymentMethod.type === 'CARD' ? (
            <p>Card deposits are typically available within 1-2 business days after clearing.</p>
          ) : (
            <p>
              ACH transfers typically take 3-5 business days to clear. You'll receive an email
              confirmation once the funds are available in escrow.
            </p>
          )}
        </AlertDescription>
      </Alert>

      {/* Terms Notice */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-xs">
          By confirming this deposit, you agree to the{' '}
          <a href="/terms" className="text-blue-600 hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/escrow-agreement" className="text-blue-600 hover:underline">
            Escrow Agreement
          </a>
          . Funds will be held in escrow until released per the contract milestones.
        </AlertDescription>
      </Alert>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button onClick={onConfirm} className="flex-1" size="lg">
          Confirm Deposit
        </Button>
      </div>
    </div>
  );
}

export default DepositConfirmation;

