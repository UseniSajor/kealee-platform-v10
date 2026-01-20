'use client';

import { Check, ArrowRight, Star } from 'lucide-react';
import Link from 'next/link';
import { Button, Card, Badge } from '@kealee/ui';

export default function PricingPage() {
  const packages = [
    {
      id: 'a',
      name: 'Package A',
      subtitle: 'Starter',
      price: 1750,
      bestFor: 'Small projects, limited PM needs',
      features: [
        '5-10 hours/week PM time',
        'Single project focus',
        'Email support (48hr response)',
        'Weekly progress reports',
        'Basic task tracking',
      ],
      cta: 'Get Started',
      popular: false,
    },
    {
      id: 'b',
      name: 'Package B',
      subtitle: 'Professional',
      price: 4500,
      bestFor: 'Growing projects, multiple workstreams',
      features: [
        '15-20 hours/week PM time',
        'Up to 3 concurrent projects',
        'Priority email & phone support',
        'Bi-weekly progress reports',
        'Advanced project tracking',
        'Contractor coordination',
      ],
      cta: 'Get Started',
      popular: false,
    },
    {
      id: 'c',
      name: 'Package C',
      subtitle: 'Premium',
      price: 8500,
      bestFor: 'Complex projects, full PM coverage',
      features: [
        '30-40 hours/week PM time',
        'Unlimited projects',
        '24/7 priority support',
        'Daily progress reports',
        'Dedicated PM assigned',
        'Full contractor management',
        'Budget optimization',
        'Risk management',
      ],
      cta: 'Get Started',
      popular: true,
    },
    {
      id: 'd',
      name: 'Package D',
      subtitle: 'Enterprise',
      price: 16500,
      bestFor: 'Portfolio management, institutional',
      features: [
        '40+ hours/week PM time',
        'Portfolio management',
        'Dedicated account manager',
        'Custom reporting',
        'Strategic planning support',
        'Multi-project coordination',
        'Executive-level insights',
        'White-glove service',
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Professional Project Management
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the package that fits your needs. All packages include 14-day free trial. Cancel anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {packages.map((pkg) => (
            <Card
              key={pkg.id}
              variant={pkg.popular ? 'elevated' : 'default'}
              hover
              className={`
                relative
                p-8
                transition-all duration-300
                ${pkg.popular ? 'border-primary-600 border-2 scale-105' : ''}
              `}
            >
              {/* Popular Badge */}
              {pkg.popular && (
                <div className="
                  absolute -top-4 left-1/2 -translate-x-1/2
                  bg-primary-600 text-white
                  px-4 py-1
                  rounded-full text-sm font-semibold
                  shadow-lg
                  z-10
                ">
                  Most Popular
                </div>
              )}

              {/* Package Name */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {pkg.name}
                </h3>
                <p className="text-sm text-gray-600">{pkg.subtitle}</p>
              </div>

              {/* Price */}
              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-gray-900">
                    ${pkg.price.toLocaleString()}
                  </span>
                  <span className="text-gray-600">/month</span>
                </div>
              </div>

              {/* Best For */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700 text-center">
                  <span className="font-semibold">Best for:</span> {pkg.bestFor}
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8 min-h-[300px]">
                {pkg.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link href={`/checkout/${pkg.id}`}>
                <Button
                  variant={pkg.popular ? 'primary' : 'default'}
                  size="lg"
                  className="w-full"
                  rightIcon={pkg.id !== 'd' ? <ArrowRight size={20} /> : undefined}
                >
                  {pkg.cta}
                </Button>
              </Link>

              {/* Trial Notice */}
              <p className="text-center text-xs text-gray-500 mt-4">
                14-day free trial • No credit card required
              </p>
            </Card>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <div className="flex items-center justify-center gap-8 text-gray-600 flex-wrap">
            <div className="flex items-center gap-2">
              <Star className="text-yellow-400 fill-yellow-400" size={20} />
              <span className="font-semibold">4.9/5 rating</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="text-green-500" size={20} />
              <span className="font-semibold">500+ projects</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="text-green-500" size={20} />
              <span className="font-semibold">94% on-time delivery</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
