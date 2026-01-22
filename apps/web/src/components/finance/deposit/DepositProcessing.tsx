import React, { useEffect, useState } from 'react';
import { useDepositStatus } from '../../../hooks/useDeposit';
import { Button } from '../../ui/Button';
import { Alert, AlertDescription } from '../../ui/Alert';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../../../utils/format';

interface DepositProcessingProps {
  depositId: string;
  onComplete: () => void;
}

export function DepositProcessing({ depositId, onComplete }: DepositProcessingProps) {
  const { data: deposit, isLoading, error } = useDepositStatus(depositId);
  const [autoRedirectSeconds, setAutoRedirectSeconds] = useState(5);

  // Auto-redirect countdown when completed
  useEffect(() => {
    if (deposit?.status === 'COMPLETED' || deposit?.status === 'CLEARING') {
      const interval = setInterval(() => {
        setAutoRedirectSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            onComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [deposit?.status, onComplete]);

  if (isLoading && !deposit) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-lg font-medium text-gray-900">Loading deposit status...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium">Failed to load deposit status</p>
            <p className="text-sm mt-1">Please try refreshing the page or contact support.</p>
          </AlertDescription>
        </Alert>
        <div className="flex justify-center">
          <Button onClick={onComplete}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  if (!deposit) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Deposit not found</AlertDescription>
        </Alert>
        <div className="flex justify-center">
          <Button onClick={onComplete}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  // Status: FAILED
  if (deposit.status === 'FAILED') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center py-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Deposit Failed</h2>
          <p className="text-gray-600 text-center max-w-md">
            {deposit.failureReason || 'Your deposit could not be processed.'}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Amount</span>
            <span className="font-medium">{formatCurrency(deposit.amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Failure Code</span>
            <span className="font-mono text-xs">{deposit.failureCode || 'UNKNOWN'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Attempted At</span>
            <span>{formatDateTime(deposit.createdAt)}</span>
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <p className="font-medium mb-1">What to do next:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Check that your payment method has sufficient funds</li>
              <li>Verify your card/account details are correct</li>
              <li>Try a different payment method</li>
              <li>Contact your bank if the issue persists</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onComplete} className="flex-1">
            Return to Dashboard
          </Button>
          <Button onClick={() => window.location.reload()} className="flex-1">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Status: PROCESSING or CLEARING
  if (deposit.status === 'PROCESSING' || deposit.status === 'CLEARING') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center py-8">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Deposit</h2>
          <p className="text-gray-600 text-center max-w-md">
            Your deposit is being processed. This usually takes a few moments.
          </p>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">What's happening:</p>
              <ul className="space-y-1">
                <li>✓ Deposit request created</li>
                <li>⏳ Verifying payment method</li>
                <li>⏳ Processing transaction</li>
                <li className="text-blue-600">⏳ Waiting for clearance...</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Deposit Amount</span>
            <span className="font-medium">{formatCurrency(deposit.amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Status</span>
            <span className="font-medium capitalize">{deposit.status.toLowerCase()}</span>
          </div>
          {deposit.expectedClearanceDate && (
            <div className="flex justify-between">
              <span className="text-gray-600">Expected Clearance</span>
              <span>{formatDateTime(deposit.expectedClearanceDate)}</span>
            </div>
          )}
        </div>

        {deposit.status === 'CLEARING' && (
          <Alert>
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-sm">
              <p className="font-medium text-green-900 mb-1">Transaction Authorized</p>
              <p className="text-green-800">
                Your payment has been authorized and is now clearing. Redirecting in {autoRedirectSeconds}s...
              </p>
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  // Status: COMPLETED
  if (deposit.status === 'COMPLETED') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Deposit Successful!</h2>
          <p className="text-gray-600 text-center max-w-md">
            Your deposit of {formatCurrency(deposit.amount)} has been added to your escrow account.
          </p>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-900">
              <p className="font-medium mb-1">What happens next:</p>
              <ul className="space-y-1">
                <li>✓ Funds are now in escrow</li>
                <li>✓ Email confirmation sent</li>
                <li>✓ Balance updated in your dashboard</li>
                <li>✓ Funds ready for milestone releases</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Amount Deposited</span>
            <span className="font-semibold text-green-600">{formatCurrency(deposit.amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Completed At</span>
            <span>{formatDateTime(deposit.clearedAt || deposit.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Deposit ID</span>
            <span className="font-mono text-xs">{deposit.id}</span>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600 mb-4">
            Redirecting to dashboard in {autoRedirectSeconds} seconds...
          </p>
          <Button onClick={onComplete} size="lg">
            Return to Dashboard Now
          </Button>
        </div>
      </div>
    );
  }

  // Status: PENDING or other
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center py-8">
        <Loader2 className="w-12 h-12 text-gray-400 animate-spin mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Deposit Pending</h2>
        <p className="text-gray-600">Your deposit is queued for processing.</p>
      </div>

      <div className="flex justify-center">
        <Button onClick={onComplete}>Return to Dashboard</Button>
      </div>
    </div>
  );
}

export default DepositProcessing;

