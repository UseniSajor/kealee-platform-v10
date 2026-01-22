import React, { useState } from 'react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { Alert, AlertDescription } from '../../ui/Alert';
import { AlertCircle, DollarSign } from 'lucide-react';
import { formatCurrency } from '../../../utils/format';
import type { EscrowAgreement } from '../../../types/finance.types';

interface DepositAmountStepProps {
  escrow: EscrowAgreement;
  onSubmit: (amount: number) => void;
  initialAmount?: number;
}

const MIN_DEPOSIT = 10;
const MAX_DEPOSIT = 1000000;

const QUICK_AMOUNTS = [100, 500, 1000, 5000, 10000];

export function DepositAmountStep({ escrow, onSubmit, initialAmount = 0 }: DepositAmountStepProps) {
  const [amount, setAmount] = useState<string>(initialAmount > 0 ? initialAmount.toString() : '');
  const [error, setError] = useState<string>('');

  const handleAmountChange = (value: string) => {
    // Allow empty string, numbers, and single decimal point
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setAmount(value);
      setError('');
    }
  };

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString());
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amountNum = parseFloat(amount);

    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (amountNum < MIN_DEPOSIT) {
      setError(`Minimum deposit amount is ${formatCurrency(MIN_DEPOSIT)}`);
      return;
    }

    if (amountNum > MAX_DEPOSIT) {
      setError(`Maximum deposit amount is ${formatCurrency(MAX_DEPOSIT)}`);
      return;
    }

    // Check if escrow is at max capacity (if there's a limit)
    if (escrow.totalContractAmount) {
      const remainingCapacity = escrow.totalContractAmount - escrow.currentBalance;
      if (amountNum > remainingCapacity) {
        setError(`Amount exceeds remaining escrow capacity (${formatCurrency(remainingCapacity)})`);
        return;
      }
    }

    onSubmit(amountNum);
  };

  const amountNum = parseFloat(amount) || 0;
  const newBalance = escrow.currentBalance + amountNum;
  const isInitialDeposit = escrow.currentBalance === 0 && escrow.initialDepositAmount > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Enter Deposit Amount</h2>
        <p className="text-gray-600">
          How much would you like to deposit into escrow?
        </p>
      </div>

      {/* Amount Input */}
      <div>
        <Label htmlFor="amount">Amount (USD)</Label>
        <div className="relative mt-2">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <Input
            id="amount"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            className="pl-10 text-2xl font-semibold h-16"
            placeholder="0.00"
            autoFocus
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Min: {formatCurrency(MIN_DEPOSIT)} • Max: {formatCurrency(MAX_DEPOSIT)}
        </p>
      </div>

      {/* Quick Amount Buttons */}
      <div>
        <Label>Quick amounts</Label>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {QUICK_AMOUNTS.map((quickAmount) => (
            <Button
              key={quickAmount}
              type="button"
              variant="outline"
              onClick={() => handleQuickAmount(quickAmount)}
              className={amount === quickAmount.toString() ? 'border-blue-600 bg-blue-50' : ''}
            >
              {formatCurrency(quickAmount)}
            </Button>
          ))}
        </div>
      </div>

      {/* Initial Deposit Notice */}
      {isInitialDeposit && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">Initial Deposit Required</p>
              <p className="text-sm">
                This contract requires an initial deposit of {formatCurrency(escrow.initialDepositAmount)}.
                {amountNum >= escrow.initialDepositAmount
                  ? ' ✓ Amount meets requirement'
                  : ` You need to deposit at least ${formatCurrency(escrow.initialDepositAmount - amountNum)} more.`}
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Balance Preview */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Current Balance</span>
          <span className="font-medium">{formatCurrency(escrow.currentBalance)}</span>
        </div>
        
        {amountNum > 0 && (
          <>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Deposit Amount</span>
              <span className="font-medium text-green-600">+{formatCurrency(amountNum)}</span>
            </div>
            
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="text-gray-900 font-medium">New Balance</span>
              <span className="text-xl font-bold text-gray-900">
                {formatCurrency(newBalance)}
              </span>
            </div>
          </>
        )}

        {escrow.totalContractAmount > 0 && (
          <div className="text-xs text-gray-600 pt-2 border-t">
            Contract Total: {formatCurrency(escrow.totalContractAmount)}
            {' • '}
            Remaining: {formatCurrency(escrow.totalContractAmount - newBalance)}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Info Box */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <ul className="list-disc list-inside space-y-1">
            <li>Deposits are processed securely through Stripe</li>
            <li>Processing times vary by payment method</li>
            <li>You'll receive confirmation once funds clear</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={!amount || parseFloat(amount) <= 0}>
          Continue to Review
        </Button>
      </div>
    </form>
  );
}

export default DepositAmountStep;

