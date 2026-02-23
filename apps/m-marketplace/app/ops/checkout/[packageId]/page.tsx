'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, ArrowLeft, Lock } from 'lucide-react';
import Link from 'next/link';
import { Button, Input, Card } from '@kealee/ui';

const PACKAGES = {
  a: {
    name: 'Package A - Starter',
    price: 1750,
    annualPrice: 1400,
    features: ['5-10 hours/week PM time', 'Single project focus', 'Email support'],
  },
  b: {
    name: 'Package B - Professional',
    price: 4500,
    annualPrice: 3600,
    features: ['15-20 hours/week PM time', 'Up to 3 concurrent projects', 'Priority support'],
  },
  c: {
    name: 'Package C - Premium',
    price: 8500,
    annualPrice: 6800,
    features: ['30-40 hours/week PM time', 'Up to 20 projects', '24/7 priority support'],
  },
  d: {
    name: 'Package D - Enterprise',
    price: 16500,
    annualPrice: 13200,
    features: ['40+ hours/week PM time', 'Portfolio management', 'Dedicated account manager'],
  },
};

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const packageId = params.packageId as string;
  const pkg = PACKAGES[packageId as keyof typeof PACKAGES];

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    company: '',
  });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!pkg) {
      router.push('/ops/pricing');
    }
  }, [pkg, router]);

  if (!pkg) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    try {
      // Create Stripe Checkout session via backend
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId,
          email: formData.email,
          name: formData.name,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Checkout failed' }));
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const data = await response.json();

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        // Fallback: redirect to success page with session ID
        router.push(`/ops/checkout/success?session_id=${data.id || data.sessionId}`);
      }
    } catch (error) {
      console.error('Error processing checkout:', error);
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* Back Link */}
        <Link
          href="/ops/pricing"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} />
          Back to Pricing
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Start Your 14-Day Free Trial
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  label="Email Address"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your.email@example.com"
                  autoFocus
                />

                <Input
                  label="Full Name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                />

                <Input
                  label="Company (Optional)"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Your Company"
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  isLoading={processing}
                  leftIcon={!processing ? <Lock size={20} /> : undefined}
                >
                  {processing ? 'Processing...' : 'Start Free Trial'}
                </Button>

                <p className="text-sm text-gray-500 text-center">
                  By continuing, you agree to our Terms of Service and Privacy Policy.
                  No credit card required for trial.
                </p>
              </form>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Order Summary
              </h3>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="font-medium text-gray-900">{pkg.name}</p>
                  <p className="text-sm text-gray-600">Monthly subscription</p>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Monthly</span>
                    <span className="text-xl font-bold text-gray-900">
                      ${pkg.price.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-gray-600">Annual billing</span>
                    <span className="text-green-600 font-semibold">
                      ${pkg.annualPrice.toLocaleString()}/mo
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-green-600">14-day trial</span>
                    <span className="text-green-600 font-semibold">Free</span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                  <div className="text-sm">
                    <p className="font-semibold text-green-900 mb-1">
                      Free Trial Included
                    </p>
                    <p className="text-green-800">
                      Try {pkg.name} free for 14 days. Cancel anytime.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-green-500" size={16} />
                  <span>Cancel anytime</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-green-500" size={16} />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-green-500" size={16} />
                  <span>Instant access</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
