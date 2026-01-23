/**
 * Payment Methods Settings Page
 * Manage payment methods, add/remove cards and bank accounts
 */

import React, { useState } from 'react';
import { usePaymentMethods, useIsPaymentMethodExpired, useRequiresVerification } from '../../hooks/usePaymentMethods';
import { AddPaymentMethodModal } from '../../components/finance/deposit/AddPaymentMethodModal';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Alert, AlertDescription } from '../../components/ui/Alert';
import { 
  CreditCard, 
  Building2, 
  Plus, 
  Trash2, 
  Check, 
  AlertCircle,
  Clock,
  Shield,
  Star,
  Loader2
} from 'lucide-react';
import type { PaymentMethod } from '../../types/finance.types';

export function PaymentMethodsSettingsPage() {
  const {
    paymentMethods,
    isLoading,
    error,
    removePaymentMethod,
    isRemoving,
    setDefault,
    isSettingDefault,
    refetch,
  } = usePaymentMethods();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedMethodToDelete, setSelectedMethodToDelete] = useState<string | null>(null);

  // Handle delete confirmation
  const handleDelete = (methodId: string) => {
    if (confirm('Are you sure you want to remove this payment method?')) {
      removePaymentMethod(methodId);
      setSelectedMethodToDelete(null);
    }
  };

  // Handle set as default
  const handleSetDefault = (methodId: string) => {
    setDefault(methodId);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Loading payment methods...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load payment methods. Please try again.
          </AlertDescription>
        </Alert>
        <Button onClick={() => refetch()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Methods</h1>
          <p className="text-gray-600 mt-1">
            Manage your cards and bank accounts for deposits and payments
          </p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Payment Method
        </Button>
      </div>

      {/* Security Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Your payment information is secure.</strong> All payment data is encrypted
          and processed by Stripe, a PCI-DSS Level 1 certified payment processor.
        </AlertDescription>
      </Alert>

      {/* Payment Methods List */}
      {!paymentMethods || paymentMethods.length === 0 ? (
        <Card className="p-12 text-center">
          <CreditCard className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Payment Methods
          </h3>
          <p className="text-gray-600 mb-6">
            Add a payment method to make deposits and manage your escrow accounts
          </p>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="mx-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Payment Method
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {paymentMethods.map((method) => (
            <PaymentMethodCard
              key={method.id}
              method={method}
              onDelete={handleDelete}
              onSetDefault={handleSetDefault}
              isDeleting={isRemoving && selectedMethodToDelete === method.id}
              isSettingDefault={isSettingDefault}
            />
          ))}
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <CreditCard className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Card Payments</h3>
              <p className="text-sm text-gray-600">
                Credit and debit cards are processed instantly. Funds are available immediately.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-3">
            <Building2 className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Bank Transfers (ACH)</h3>
              <p className="text-sm text-gray-600">
                Lower fees. Takes 1-2 business days to verify and 3-5 days to process.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Add Payment Method Modal */}
      <AddPaymentMethodModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setIsAddModalOpen(false);
          refetch();
        }}
      />
    </div>
  );
}

/**
 * Individual Payment Method Card Component
 */
interface PaymentMethodCardProps {
  method: PaymentMethod;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
  isDeleting: boolean;
  isSettingDefault: boolean;
}

function PaymentMethodCard({
  method,
  onDelete,
  onSetDefault,
  isDeleting,
  isSettingDefault,
}: PaymentMethodCardProps) {
  const isExpired = useIsPaymentMethodExpired(method);
  const requiresVerification = useRequiresVerification(method);

  return (
    <Card className={`p-6 ${isExpired ? 'border-red-200 bg-red-50' : ''}`}>
      <div className="flex items-start justify-between">
        {/* Left: Payment Method Info */}
        <div className="flex items-start gap-4 flex-1">
          {/* Icon */}
          <div
            className={`
              w-12 h-12 rounded-lg flex items-center justify-center
              ${method.type === 'CARD' ? 'bg-blue-100' : 'bg-green-100'}
            `}
          >
            {method.type === 'CARD' ? (
              <CreditCard className={`w-6 h-6 ${isExpired ? 'text-red-600' : 'text-blue-600'}`} />
            ) : (
              <Building2 className="w-6 h-6 text-green-600" />
            )}
          </div>

          {/* Details */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900">
                {method.type === 'CARD'
                  ? `${method.brand || 'Card'} •••• ${method.last4}`
                  : `${method.bankName || 'Bank Account'} •••• ${method.last4}`}
              </h3>
              
              {/* Badges */}
              {method.isDefault && (
                <Badge variant="primary" className="flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Default
                </Badge>
              )}
              
              {isExpired && (
                <Badge variant="destructive">Expired</Badge>
              )}
              
              {requiresVerification && (
                <Badge variant="warning" className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Needs Verification
                </Badge>
              )}
              
              {method.isVerified && method.type === 'ACH' && (
                <Badge variant="success" className="flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Verified
                </Badge>
              )}
            </div>

            {/* Expiry for cards */}
            {method.type === 'CARD' && method.expiryMonth && method.expiryYear && (
              <p className="text-sm text-gray-600">
                Expires {String(method.expiryMonth).padStart(2, '0')}/{method.expiryYear}
              </p>
            )}

            {/* Account holder name for ACH */}
            {method.type === 'ACH' && method.accountHolderName && (
              <p className="text-sm text-gray-600">{method.accountHolderName}</p>
            )}

            {/* Status messages */}
            {isExpired && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  This card has expired. Please add a new payment method or update your card details.
                </AlertDescription>
              </Alert>
            )}

            {requiresVerification && (
              <Alert variant="warning" className="mt-2">
                <Clock className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  This bank account needs verification. Check your account for two small deposits
                  (less than $1 each) and verify them to activate.
                </AlertDescription>
              </Alert>
            )}

            <p className="text-xs text-gray-500 mt-1">
              Added on {new Date(method.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 ml-4">
          {!method.isDefault && !isExpired && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSetDefault(method.id)}
              disabled={isSettingDefault}
            >
              {isSettingDefault ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Set as Default'
              )}
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(method.id)}
            disabled={isDeleting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default PaymentMethodsSettingsPage;
