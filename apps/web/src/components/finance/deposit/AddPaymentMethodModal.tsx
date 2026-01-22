import React, { useState } from 'react';
import { usePaymentMethods } from '../../../hooks/usePaymentMethods';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { Alert, AlertDescription } from '../../ui/Alert';
import { CreditCard, Building2, X, Loader2, AlertCircle } from 'lucide-react';
import type { PaymentMethodType } from '../../../types/finance.types';

interface AddPaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (paymentMethodId: string) => void;
}

export function AddPaymentMethodModal({ isOpen, onClose, onSuccess }: AddPaymentMethodModalProps) {
  const { addPaymentMethod, isAdding } = usePaymentMethods();
  const [paymentType, setPaymentType] = useState<PaymentMethodType>('CARD');
  const [error, setError] = useState<string>('');

  // Card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');

  // ACH fields
  const [routingNumber, setRoutingNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // In a real implementation, you would:
      // 1. Create Stripe PaymentMethod using Stripe.js
      // 2. Get the Stripe PaymentMethod ID
      // 3. Send to your backend to attach to customer

      // For now, simulating the flow:
      const mockStripePaymentMethodId = `pm_${Math.random().toString(36).substr(2, 9)}`;

      const newMethod = await addPaymentMethod({
        type: paymentType,
        stripePaymentMethodId: mockStripePaymentMethodId,
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

          {/* Card Form */}
          {paymentType === 'CARD' && (
            <>
              <div>
                <Label htmlFor="cardName">Cardholder Name</Label>
                <Input
                  id="cardName"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="John Doe"
                  required
                  disabled={isAdding}
                />
              </div>

              <div>
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  value={cardNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\s/g, '');
                    if (/^\d*$/.test(value) && value.length <= 16) {
                      setCardNumber(value.replace(/(\d{4})/g, '$1 ').trim());
                    }
                  }}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  required
                  disabled={isAdding}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cardExpiry">Expiry Date</Label>
                  <Input
                    id="cardExpiry"
                    value={cardExpiry}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '');
                      if (value.length >= 2) {
                        value = value.slice(0, 2) + '/' + value.slice(2, 4);
                      }
                      if (value.length <= 5) {
                        setCardExpiry(value);
                      }
                    }}
                    placeholder="MM/YY"
                    maxLength={5}
                    required
                    disabled={isAdding}
                  />
                </div>
                <div>
                  <Label htmlFor="cardCvc">CVC</Label>
                  <Input
                    id="cardCvc"
                    value={cardCvc}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 4) {
                        setCardCvc(value);
                      }
                    }}
                    placeholder="123"
                    maxLength={4}
                    required
                    disabled={isAdding}
                  />
                </div>
              </div>
            </>
          )}

          {/* ACH Form */}
          {paymentType === 'ACH' && (
            <>
              <div>
                <Label htmlFor="accountName">Account Holder Name</Label>
                <Input
                  id="accountName"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="John Doe"
                  required
                  disabled={isAdding}
                />
              </div>

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
                  disabled={isAdding}
                />
              </div>

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
                  disabled={isAdding}
                />
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  ACH transfers may require microdeposit verification and take 1-2 business days to verify.
                </AlertDescription>
              </Alert>
            </>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Security Notice */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Your payment information is encrypted and securely processed by Stripe.
              We never store your full card or account details.
            </AlertDescription>
          </Alert>

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
              disabled={isAdding}
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

export default AddPaymentMethodModal;

