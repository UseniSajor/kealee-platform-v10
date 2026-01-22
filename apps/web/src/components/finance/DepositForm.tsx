import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDeposit } from '../../hooks/useDeposit';
import { usePaymentMethods } from '../../hooks/usePaymentMethods';
import { useEscrow } from '../../hooks/useEscrow';
import { 
  CreditCard, 
  Building2, 
  ArrowLeft, 
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { formatCurrency } from '../../utils/format';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { RadioGroup, RadioGroupItem } from '../ui/RadioGroup';
import { Alert, AlertDescription } from '../ui/Alert';
import { Separator } from '../ui/Separator';
import type { PaymentMethod } from '../../types/finance.types';

export function DepositForm() {
  const { escrowId } = useParams<{ escrowId: string }>();
  const navigate = useNavigate();
  const { escrow, isLoading: escrowLoading } = useEscrow(escrowId);
  const { paymentMethods, isLoading: methodsLoading } = usePaymentMethods();
  const { createDeposit, isCreating } = useDeposit();

  const [amount, setAmount] = useState('');
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  const [step, setStep] = useState<'amount' | 'payment' | 'confirm'>('amount');
  const [error, setError] = useState<string>('');

  const handleAmountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (amountNum < 10) {
      setError('Minimum deposit amount is $10');
      return;
    }

    if (amountNum > 1000000) {
      setError('Maximum deposit amount is $1,000,000');
      return;
    }

    setStep('payment');
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedMethodId) {
      setError('Please select a payment method');
      return;
    }

    setStep('confirm');
  };

  const handleConfirmDeposit = async () => {
    if (!escrowId) return;

    setError('');
    try {
      await createDeposit({
        escrowId,
        amount: parseFloat(amount),
        paymentMethodId: selectedMethodId,
      });

      navigate(`/escrow/${escrowId}?depositSuccess=true`);
    } catch (err: any) {
      setError(err.message || 'Failed to process deposit');
    }
  };

  if (escrowLoading || methodsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!escrow) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Escrow account not found</AlertDescription>
      </Alert>
    );
  }

  const selectedMethod = paymentMethods?.find(m => m.id === selectedMethodId);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          onClick={() => navigate(`/escrow/${escrowId}`)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Add Deposit</h1>
        <p className="text-gray-600 mt-1">
          Account #{escrow.escrowAccountNumber}
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        <StepIndicator 
          number={1} 
          label="Amount" 
          active={step === 'amount'} 
          completed={step !== 'amount'} 
        />
        <div className="flex-1 h-1 bg-gray-200 mx-4">
          <div 
            className={`h-full bg-blue-600 transition-all duration-300 ${
              step === 'amount' ? 'w-0' : step === 'payment' ? 'w-1/2' : 'w-full'
            }`}
          />
        </div>
        <StepIndicator 
          number={2} 
          label="Payment" 
          active={step === 'payment'} 
          completed={step === 'confirm'} 
        />
        <div className="flex-1 h-1 bg-gray-200 mx-4">
          <div 
            className={`h-full bg-blue-600 transition-all duration-300 ${
              step === 'confirm' ? 'w-full' : 'w-0'
            }`}
          />
        </div>
        <StepIndicator 
          number={3} 
          label="Confirm" 
          active={step === 'confirm'} 
          completed={false} 
        />
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step 1: Amount */}
      {step === 'amount' && (
        <Card>
          <form onSubmit={handleAmountSubmit}>
            <CardHeader>
              <CardTitle>Enter Deposit Amount</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="amount">Amount (USD)</Label>
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">
                    $
                  </span>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="10"
                    max="1000000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-8 text-2xl font-semibold h-14"
                    placeholder="0.00"
                    autoFocus
                    required
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Minimum: $10 • Maximum: $1,000,000
                </p>
              </div>

              {/* Quick Amount Buttons */}
              <div>
                <Label>Quick amounts</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {[100, 500, 1000, 5000].map((quickAmount) => (
                    <Button
                      key={quickAmount}
                      type="button"
                      variant="outline"
                      onClick={() => setAmount(quickAmount.toString())}
                    >
                      ${quickAmount.toLocaleString()}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Escrow Info */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">Current Escrow Balance</p>
                    <p className="text-lg">{formatCurrency(escrow.currentBalance)}</p>
                    <p className="text-sm text-gray-600 mt-2">
                      After deposit: {formatCurrency(escrow.currentBalance + (parseFloat(amount) || 0))}
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" size="lg">
                Continue to Payment Method
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* Step 2: Payment Method */}
      {step === 'payment' && (
        <Card>
          <form onSubmit={handlePaymentSubmit}>
            <CardHeader>
              <CardTitle>Select Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentMethods && paymentMethods.length > 0 ? (
                <RadioGroup value={selectedMethodId} onValueChange={setSelectedMethodId}>
                  <div className="space-y-3">
                    {paymentMethods.map((method) => (
                      <PaymentMethodCard 
                        key={method.id} 
                        method={method} 
                        selected={selectedMethodId === method.id}
                      />
                    ))}
                  </div>
                </RadioGroup>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No payment methods found. Please add a payment method first.
                  </AlertDescription>
                </Alert>
              )}

              <Separator />

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => navigate('/settings/payment-methods?redirect=' + encodeURIComponent(window.location.pathname))}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Add New Payment Method
              </Button>
            </CardContent>
            <CardFooter className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setStep('amount')}
              >
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={!selectedMethodId}
              >
                Continue to Review
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* Step 3: Confirm */}
      {step === 'confirm' && (
        <Card>
          <CardHeader>
            <CardTitle>Review Deposit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert variant="success">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Please review the details before confirming your deposit.
              </AlertDescription>
            </Alert>

            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Deposit Amount</span>
                <span className="text-2xl font-bold text-gray-900">
                  {formatCurrency(parseFloat(amount))}
                </span>
              </div>
              
              <Separator />

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Payment Method</span>
                <div className="text-right">
                  {selectedMethod?.type === 'CARD' ? (
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      <span className="font-medium">
                        {selectedMethod.brand} •••• {selectedMethod.last4}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      <span className="font-medium">
                        {selectedMethod?.bankName} •••• {selectedMethod?.last4}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Escrow Account</span>
                <span className="font-medium">{escrow.escrowAccountNumber}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">New Balance</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(escrow.currentBalance + parseFloat(amount))}
                </span>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <ul className="list-disc list-inside space-y-1">
                  <li>ACH deposits may take 3-5 business days to clear</li>
                  <li>Card deposits are typically available within 1-2 business days</li>
                  <li>You'll receive an email confirmation once the deposit clears</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setStep('payment')}
              disabled={isCreating}
            >
              Back
            </Button>
            <Button
              onClick={handleConfirmDeposit}
              className="flex-1"
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm Deposit'
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

// Sub-components
interface StepIndicatorProps {
  number: number;
  label: string;
  active: boolean;
  completed: boolean;
}

function StepIndicator({ number, label, active, completed }: StepIndicatorProps) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
          completed
            ? 'bg-green-500 text-white'
            : active
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-600'
        }`}
      >
        {completed ? <CheckCircle className="w-5 h-5" /> : number}
      </div>
      <span
        className={`text-xs mt-2 font-medium ${
          active || completed ? 'text-gray-900' : 'text-gray-500'
        }`}
      >
        {label}
      </span>
    </div>
  );
}

interface PaymentMethodCardProps {
  method: PaymentMethod;
  selected: boolean;
}

function PaymentMethodCard({ method, selected }: PaymentMethodCardProps) {
  return (
    <label
      className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
        selected
          ? 'border-blue-600 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <RadioGroupItem value={method.id} id={method.id} />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          {method.type === 'CARD' ? (
            <CreditCard className="w-5 h-5 text-gray-600" />
          ) : (
            <Building2 className="w-5 h-5 text-gray-600" />
          )}
          <span className="font-medium">
            {method.type === 'CARD'
              ? `${method.brand} •••• ${method.last4}`
              : `${method.bankName} •••• ${method.last4}`}
          </span>
          {method.isDefault && (
            <Badge variant="secondary" className="text-xs">Default</Badge>
          )}
        </div>
        {method.type === 'CARD' && method.expiryMonth && method.expiryYear && (
          <p className="text-sm text-gray-600 mt-1">
            Expires {method.expiryMonth}/{method.expiryYear}
          </p>
        )}
        {method.type === 'ACH' && (
          <p className="text-sm text-gray-600 mt-1">
            ACH Transfer • 3-5 business days
          </p>
        )}
      </div>
      {method.status === 'VERIFICATION_PENDING' && (
        <Badge variant="warning" className="text-xs">Pending Verification</Badge>
      )}
    </label>
  );
}

function Badge({ children, variant = 'default', className = '' }: { 
  children: React.ReactNode; 
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive'; 
  className?: string;
}) {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    secondary: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-amber-100 text-amber-800',
    destructive: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

export default DepositForm;

