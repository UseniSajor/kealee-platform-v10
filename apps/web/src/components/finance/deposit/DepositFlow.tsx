import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEscrow } from '../../../hooks/useEscrow';
import { useDeposit } from '../../../hooks/useDeposit';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { DepositAmountStep } from './DepositAmountStep';
import { DepositConfirmation } from './DepositConfirmation';
import { DepositProcessing } from './DepositProcessing';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { ArrowLeft } from 'lucide-react';

type Step = 'payment-method' | 'amount' | 'confirm' | 'processing';

export function DepositFlow() {
  const { escrowId } = useParams<{ escrowId: string }>();
  const navigate = useNavigate();
  const { escrow } = useEscrow(escrowId);
  const { createDeposit } = useDeposit();

  const [currentStep, setCurrentStep] = useState<Step>('payment-method');
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [depositId, setDepositId] = useState<string>('');

  const handlePaymentMethodSelect = (paymentMethodId: string) => {
    setSelectedPaymentMethodId(paymentMethodId);
    setCurrentStep('amount');
  };

  const handleAmountSubmit = (depositAmount: number) => {
    setAmount(depositAmount);
    setCurrentStep('confirm');
  };

  const handleConfirm = async () => {
    setCurrentStep('processing');
    
    try {
      const deposit = await createDeposit({
        escrowId: escrowId!,
        amount,
        paymentMethodId: selectedPaymentMethodId,
      });
      setDepositId(deposit.id);
    } catch (error) {
      // Error handled by toast in hook
      setCurrentStep('confirm'); // Go back to confirmation
    }
  };

  const handleBack = () => {
    const steps: Step[] = ['payment-method', 'amount', 'confirm', 'processing'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    } else {
      navigate(`/escrow/${escrowId}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="mb-4"
          disabled={currentStep === 'processing'}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Add Deposit</h1>
        <p className="text-gray-600 mt-1">
          Account #{escrow?.escrowAccountNumber}
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <ProgressSteps currentStep={currentStep} />
      </div>

      {/* Step Content */}
      <Card className="p-6">
        {currentStep === 'payment-method' && (
          <PaymentMethodSelector
            onSelect={handlePaymentMethodSelect}
            selectedId={selectedPaymentMethodId}
          />
        )}

        {currentStep === 'amount' && (
          <DepositAmountStep
            escrow={escrow!}
            onSubmit={handleAmountSubmit}
            initialAmount={amount}
          />
        )}

        {currentStep === 'confirm' && (
          <DepositConfirmation
            amount={amount}
            paymentMethodId={selectedPaymentMethodId}
            escrow={escrow!}
            onConfirm={handleConfirm}
            onBack={() => setCurrentStep('amount')}
          />
        )}

        {currentStep === 'processing' && (
          <DepositProcessing
            depositId={depositId}
            onComplete={() => navigate(`/escrow/${escrowId}`)}
          />
        )}
      </Card>
    </div>
  );
}

function ProgressSteps({ currentStep }: { currentStep: Step }) {
  const steps = [
    { key: 'payment-method', label: 'Payment Method' },
    { key: 'amount', label: 'Amount' },
    { key: 'confirm', label: 'Confirm' },
    { key: 'processing', label: 'Processing' },
  ];

  const currentIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => (
        <React.Fragment key={step.key}>
          <div className="flex flex-col items-center">
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center font-semibold
                ${
                  index <= currentIndex
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }
              `}
            >
              {index + 1}
            </div>
            <span
              className={`text-sm mt-2 ${
                index <= currentIndex ? 'text-gray-900' : 'text-gray-500'
              }`}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`flex-1 h-1 mx-4 ${
                index < currentIndex ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default DepositFlow;

