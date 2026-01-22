import React, { useState } from 'react';
import { usePaymentMethods } from '../../../hooks/usePaymentMethods';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { AddPaymentMethodModal } from './AddPaymentMethodModal';
import { CreditCard, Building2, Plus, Check, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../../ui/Alert';
import type { PaymentMethod } from '../../../types/finance.types';

interface PaymentMethodSelectorProps {
  onSelect: (paymentMethodId: string) => void;
  selectedId: string;
}

export function PaymentMethodSelector({ onSelect, selectedId }: PaymentMethodSelectorProps) {
  const { paymentMethods, isLoading, error } = usePaymentMethods();
  const [showAddModal, setShowAddModal] = useState(false);
  const [localSelectedId, setLocalSelectedId] = useState(selectedId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load payment methods. Please try again.</AlertDescription>
      </Alert>
    );
  }

  const handleMethodSelect = (methodId: string) => {
    setLocalSelectedId(methodId);
  };

  const handleContinue = () => {
    if (localSelectedId) {
      onSelect(localSelectedId);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Select Payment Method</h2>
        <p className="text-gray-600">Choose how you'd like to fund this deposit</p>
      </div>

      <div className="space-y-3">
        {paymentMethods && paymentMethods.length > 0 ? (
          <>
            {paymentMethods.map((method) => (
              <PaymentMethodCard
                key={method.id}
                method={method}
                isSelected={method.id === localSelectedId}
                onSelect={() => handleMethodSelect(method.id)}
              />
            ))}
          </>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No payment methods found. Add a payment method to continue.
            </AlertDescription>
          </Alert>
        )}

        <button
          onClick={() => setShowAddModal(true)}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-colors"
        >
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <Plus className="w-5 h-5" />
            <span className="font-medium">Add Payment Method</span>
          </div>
        </button>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleContinue}
          disabled={!localSelectedId}
          size="lg"
        >
          Continue
        </Button>
      </div>

      <AddPaymentMethodModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={(newMethodId) => {
          setShowAddModal(false);
          setLocalSelectedId(newMethodId);
        }}
      />
    </div>
  );
}

function PaymentMethodCard({
  method,
  isSelected,
  onSelect,
}: {
  method: PaymentMethod;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const getIcon = () => {
    if (method.type === 'CARD') {
      return <CreditCard className="w-6 h-6" />;
    }
    return <Building2 className="w-6 h-6" />;
  };

  const getMethodText = () => {
    if (method.type === 'CARD') {
      return `${method.brand} •••• ${method.last4}`;
    }
    if (method.type === 'ACH') {
      return `${method.bankName} •••• ${method.last4}`;
    }
    return 'Wire Transfer';
  };

  const getProcessingTime = () => {
    if (method.type === 'CARD') return 'Instant';
    if (method.type === 'ACH') return '3-5 business days';
    return '5-7 business days';
  };

  return (
    <button
      onClick={onSelect}
      disabled={method.status !== 'ACTIVE'}
      className={`
        w-full border-2 rounded-lg p-4 text-left transition-all
        ${
          isSelected
            ? 'border-blue-600 bg-blue-50'
            : 'border-gray-200 hover:border-gray-300'
        }
        ${method.status !== 'ACTIVE' ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`
            p-2 rounded-lg
            ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}
          `}
          >
            {getIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-gray-900">{getMethodText()}</p>
              {method.isDefault && (
                <Badge variant="secondary" className="text-xs">Default</Badge>
              )}
            </div>
            <p className="text-sm text-gray-600">{getProcessingTime()}</p>
          </div>
        </div>
        {isSelected && (
          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {method.status === 'VERIFICATION_PENDING' && (
        <div className="mt-2">
          <Badge variant="warning" className="text-xs">
            Verification pending
          </Badge>
        </div>
      )}

      {method.status === 'FAILED' && (
        <div className="mt-2">
          <Badge variant="destructive" className="text-xs">
            Verification failed
          </Badge>
        </div>
      )}

      {method.type === 'CARD' && method.expiryMonth && method.expiryYear && (
        <p className="text-xs text-gray-500 mt-2">
          Expires {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear}
        </p>
      )}
    </button>
  );
}

export default PaymentMethodSelector;

