/**
 * Stripe Card Element Component
 * Integrates Stripe Elements for secure card input
 */

import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { StripeCardElementOptions } from '@stripe/stripe-js';
import { Alert, AlertDescription } from '../../ui/Alert';
import { AlertCircle, CreditCard } from 'lucide-react';

interface StripeCardElementProps {
  onPaymentMethodCreated: (paymentMethodId: string) => void;
  onError: (error: string) => void;
}

export interface StripeCardElementHandle {
  createPaymentMethod: () => Promise<string | null>;
}

const CARD_ELEMENT_OPTIONS: StripeCardElementOptions = {
  style: {
    base: {
      color: '#32325d',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4'
      }
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444'
    }
  },
  hidePostalCode: true,
};

export const StripeCardElement = forwardRef<StripeCardElementHandle, StripeCardElementProps>(
  ({ onPaymentMethodCreated, onError }, ref) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [cardComplete, setCardComplete] = useState(false);

  const handleCardChange = (event: any) => {
    setCardComplete(event.complete);
    if (event.error) {
      onError(event.error.message);
    } else {
      onError('');
    }
  };

    const createPaymentMethod = async (): Promise<string | null> => {
      if (!stripe || !elements) {
        onError('Stripe has not loaded yet. Please wait a moment and try again.');
        return null;
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        onError('Card element not found');
        return null;
      }

      setIsProcessing(true);

      try {
        // Create PaymentMethod using Stripe.js
        const { error, paymentMethod } = await stripe.createPaymentMethod({
          type: 'card',
          card: cardElement,
        });

        if (error) {
          onError(error.message || 'Failed to create payment method');
          return null;
        }

        if (!paymentMethod) {
          onError('No payment method returned from Stripe');
          return null;
        }

        return paymentMethod.id;
      } catch (err: any) {
        onError(err.message || 'An unexpected error occurred');
        return null;
      } finally {
        setIsProcessing(false);
      }
    };

    // Expose createPaymentMethod to parent via ref
    useImperativeHandle(ref, () => ({
      createPaymentMethod,
    }));

    return (
      <div className="space-y-4">
        {/* Card Element Container */}
        <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-700">Card Information</span>
          </div>
          <CardElement
            options={CARD_ELEMENT_OPTIONS}
            onChange={handleCardChange}
          />
        </div>

        {/* Helper Text */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Your card information is processed securely by Stripe and never stored on our servers.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
);

StripeCardElement.displayName = 'StripeCardElement';

export default StripeCardElement;
