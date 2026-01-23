/**
 * Stripe ACH (Bank Account) Element Component
 * Handles US bank account setup via Stripe
 */

import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { useStripe } from '@stripe/react-stripe-js';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { Alert, AlertDescription } from '../../ui/Alert';
import { AlertCircle, Building2 } from 'lucide-react';

interface StripeACHElementProps {
  onPaymentMethodCreated: (paymentMethodId: string) => void;
  onError: (error: string) => void;
  accountHolderName: string;
  onAccountHolderNameChange: (name: string) => void;
}

export interface StripeACHElementHandle {
  createPaymentMethod: () => Promise<string | null>;
}

export const StripeACHElement = forwardRef<StripeACHElementHandle, StripeACHElementProps>(
  ({
    onPaymentMethodCreated,
    onError,
    accountHolderName,
    onAccountHolderNameChange,
  }, ref) => {
    const stripe = useStripe();
    const [routingNumber, setRoutingNumber] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountNumberConfirm, setAccountNumberConfirm] = useState('');

  const validateACH = (): boolean => {
    if (!accountHolderName.trim()) {
      onError('Account holder name is required');
      return false;
    }

    if (routingNumber.length !== 9) {
      onError('Routing number must be 9 digits');
      return false;
    }

    if (accountNumber.length < 4 || accountNumber.length > 17) {
      onError('Account number must be between 4 and 17 digits');
      return false;
    }

    if (accountNumber !== accountNumberConfirm) {
      onError('Account numbers do not match');
      return false;
    }

    return true;
  };

    const createPaymentMethod = async (): Promise<string | null> => {
      if (!stripe) {
        onError('Stripe has not loaded yet. Please wait a moment and try again.');
        return null;
      }

      if (!validateACH()) {
        return null;
      }

      try {
        // Create PaymentMethod using Stripe.js for US Bank Account
        const { error, paymentMethod } = await stripe.createPaymentMethod({
          type: 'us_bank_account',
          us_bank_account: {
            routing_number: routingNumber,
            account_number: accountNumber,
            account_holder_type: 'individual', // or 'company'
          },
          billing_details: {
            name: accountHolderName,
          },
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
      }
    };

    // Expose createPaymentMethod to parent via ref
    useImperativeHandle(ref, () => ({
      createPaymentMethod,
    }));

    return (
      <div className="space-y-4">
        {/* Account Holder Name */}
        <div>
          <Label htmlFor="accountHolderName">Account Holder Name</Label>
          <div className="relative mt-1">
            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="accountHolderName"
              value={accountHolderName}
              onChange={(e) => onAccountHolderNameChange(e.target.value)}
              placeholder="John Doe"
              className="pl-10"
              required
            />
          </div>
        </div>

        {/* Routing Number */}
        <div>
          <Label htmlFor="routingNumber">Routing Number</Label>
          <Input
            id="routingNumber"
            value={routingNumber}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              if (value.length <= 9) {
                setRoutingNumber(value);
              }
            }}
            placeholder="123456789"
            maxLength={9}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            9-digit number found on the bottom left of your check
          </p>
        </div>

        {/* Account Number */}
        <div>
          <Label htmlFor="accountNumber">Account Number</Label>
          <Input
            id="accountNumber"
            type="password"
            value={accountNumber}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              if (value.length <= 17) {
                setAccountNumber(value);
              }
            }}
            placeholder="••••••••••"
            maxLength={17}
            required
          />
        </div>

        {/* Confirm Account Number */}
        <div>
          <Label htmlFor="accountNumberConfirm">Confirm Account Number</Label>
          <Input
            id="accountNumberConfirm"
            type="password"
            value={accountNumberConfirm}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              if (value.length <= 17) {
                setAccountNumberConfirm(value);
              }
            }}
            placeholder="••••••••••"
            maxLength={17}
            required
          />
        </div>

        {/* ACH Verification Notice */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Verification Required:</strong> After adding your bank account, we'll send
            2 small deposits (less than $1 each) within 1-2 business days. You'll need to verify
            these amounts to activate your account for payments.
          </AlertDescription>
        </Alert>

        {/* Security Notice */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Your banking information is encrypted and securely processed by Stripe.
            We never store your account details.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
);

StripeACHElement.displayName = 'StripeACHElement';

export default StripeACHElement;
