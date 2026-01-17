'use client';

import { useState } from 'react';

// Stripe products configuration
const STRIPE_PRODUCTS = {
  packages: {
    A: {
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PACKAGE_A!,
      name: 'Essential',
      price: 1750,
      interval: 'month',
      features: [
        'Timeline & task management',
        'Document organization',
        'Weekly check-ins',
      ],
    },
    B: {
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PACKAGE_B!,
      name: 'Professional',
      price: 3750,
      interval: 'month',
      features: [
        'Everything in Essential',
        'Contractor coordination',
        'Budget tracking',
        'Site visits',
      ],
    },
    C: {
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PACKAGE_C!,
      name: 'Premium',
      price: 9500,
      interval: 'month',
      popular: true,
      features: [
        'Everything in Professional',
        'Permit management',
        'Inspection coordination',
        'Full contractor oversight',
      ],
    },
    D: {
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PACKAGE_D!,
      name: 'White Glove',
      price: 16500,
      interval: 'month',
      features: [
        'Everything in Premium',
        'We hire contractors',
        'Handle all payments',
        'Complete hands-off',
      ],
    },
  },
};

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const packages = Object.entries(STRIPE_PRODUCTS.packages);

  const handleSubscribe = async (packageId: string) => {
    setLoading(packageId);
    
    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to start checkout. Please try again.');
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Package
          </h1>
          <p className="text-xl text-gray-600">
            Select the perfect plan for your project management needs
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {packages.map(([key, pkg]) => (
            <div
              key={key}
              className={`bg-white border rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow ${
                pkg.popular ? 'ring-2 ring-blue-500 relative' : ''
              }`}
            >
              {pkg.popular && (
                <span className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              )}

              <div className="mt-2">
                <h3 className="text-2xl font-bold text-gray-900">
                  Package {key}
                </h3>
                <p className="text-gray-600 mt-1">{pkg.name}</p>
              </div>

              <div className="my-6">
                <span className="text-4xl font-bold text-gray-900">
                  ${pkg.price.toLocaleString()}
                </span>
                <span className="text-gray-600">/{pkg.interval}</span>
              </div>

              <ul className="space-y-3 mb-6">
                {pkg.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <svg
                      className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(key)}
                disabled={loading === key}
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  pkg.popular
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-800 text-white hover:bg-gray-900'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading === key ? 'Loading...' : 'Get Started'}
              </button>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center text-gray-600">
          <p className="mb-2">All plans include:</p>
          <div className="flex justify-center gap-8 flex-wrap">
            <span>✓ 24/7 Support</span>
            <span>✓ Cancel Anytime</span>
            <span>✓ No Setup Fees</span>
          </div>
        </div>
      </div>
    </div>
  );
}
