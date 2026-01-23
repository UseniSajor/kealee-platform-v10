import React, { useState, useRef } from 'react';
import { Elements, useStripe } from '@stripe/react-stripe-js';
import { usePaymentMethods } from '../../../hooks/usePaymentMethods';
import { getStripe, isStripeConfigured } from '../../../lib/stripe';
import { Button } from '../../ui/Button';
import { Alert, AlertDescription } from '../../ui/Alert';
import { CreditCard, Building2, X, Loader2, AlertCircle } from 'lucide-react';
import { StripeCardElement } from './StripeCardElement';
import { StripeACHElement } from './StripeACHElement';
import type { PaymentMethodType } from '../../../types/finance.types';

interface AddPaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (paymentMethodId: string) => void;
}

// Inner component that has access to Stripe context
function AddPaymentMethodForm({ onClose, onSuccess }: Omit<AddPaymentMethodModalProps, 'isOpen'>) {
  const stripe = useStripe();
  const { addPaymentMethod, isAdding } = usePaymentMethods();
  const [paymentType, setPaymentType] = useState<PaymentMethodType>('CARD');
  const [error, setError] = useState<string>('');
  const [accountName, setAccountName] = useState('');
  
  // Refs to call payment method creation from child components
  const cardElementRef = useRef<{ createPaymentMethod: () => Promise<string | null> }>(null);
  const achElementRef = useRef<{ createPaymentMethod: () => Promise<string | null> }>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!stripe) {
      setError('Stripe is not loaded. Please refresh the page and try again.');
      return;
    }

    try {
      let stripePaymentMethodId: string | null = null;

      // Get payment method ID from the appropriate element
      if (paymentType === 'CARD' && cardElementRef.current) {
        stripePaymentMethodId = await cardElementRef.current.createPaymentMethod();
      } else if (paymentType === 'ACH' && achElementRef.current) {
        stripePaymentMethodId = await achElementRef.current.createPaymentMethod();
      }

      if (!stripePaymentMethodId) {
        // Error already set by child component
        return;
      }

      // Save to backend
      const newMethod = await addPaymentMethod({
        type: paymentType,
        stripePaymentMethodId,
        isDefault: false,
      });

      onSuccess?.(newMethod.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add payment method');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Add Payment Method</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isAdding}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Payment Type Selection */}
          <div>
            <Label>Payment Type</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <button
                type="button"
                onClick={() => setPaymentType('CARD')}
                className={`
                  p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all
                  ${
                    paymentType === 'CARD'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <CreditCard className="w-6 h-6" />
                <span className="font-medium">Card</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentType('ACH')}
                className={`
                  p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all
                  ${
                    paymentType === 'ACH'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <Building2 className="w-6 h-6" />
                <span className="font-medium">Bank Account</span>
              </button>
            </div>
          </div>

          {/* Stripe Elements Integration */}
          {paymentType === 'CARD' && (
            <StripeCardElement
              ref={cardElementRef}
              onPaymentMethodCreated={(id) => {}}
              onError={setError}
            />
          )}

          {paymentType === 'ACH' && (
            <StripeACHElement
              ref={achElementRef}
              onPaymentMethodCreated={(id) => {}}
              onError={setError}
              accountHolderName={accountName}
              onAccountHolderNameChange={setAccountName}
            />
          )}

          {/* Error Message */}
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
              onClick={onClose}
              className="flex-1"
              disabled={isAdding}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isAdding || !stripe}
            >
              {isAdding ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Payment Method'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Main component with Stripe Elements wrapper
export function AddPaymentMethodModal({ isOpen, onClose, onSuccess }: AddPaymentMethodModalProps) {
  if (!isOpen) return null;

  // Check if Stripe is configured
  if (!isStripeConfigured()) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Stripe Not Configured</strong>
              <p className="mt-1">
                Payment processing is not available. Please contact support or configure 
                NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in your environment.
              </p>
            </AlertDescription>
          </Alert>
          <Button onClick={onClose} className="w-full mt-4">
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={getStripe()}>
      <AddPaymentMethodForm onClose={onClose} onSuccess={onSuccess} />
    </Elements>
  );
}

export default AddPaymentMethodModal;

