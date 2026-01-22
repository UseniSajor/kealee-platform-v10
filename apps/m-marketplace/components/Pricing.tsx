import Link from 'next/link';
import { Check, ArrowRight } from 'lucide-react';

export function Pricing() {
  const tiers = [
    {
      name: 'Starter',
      price: 0,
      period: 'forever',
      description: 'Perfect for small projects and getting started',
      features: [
        'Up to 3 projects',
        'Basic project tracking',
        'Document storage (5GB)',
        'Email support',
        'Mobile app access',
      ],
      cta: 'Start Free',
      href: 'https://app.kealee.com/signup',
      popular: false,
    },
    {
      name: 'Professional',
      price: 4500,
      period: 'month',
      description: 'For growing teams managing multiple projects',
      features: [
        'Unlimited projects',
        'Advanced tracking & analytics',
        'Unlimited storage',
        'Priority support',
        'PM services (Package B)',
        'Permit assistance',
        'Team collaboration',
      ],
      cta: 'Start Free Trial',
      href: 'https://ops.kealee.com',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: null,
      period: 'custom',
      description: 'For large organizations with custom needs',
      features: [
        'Everything in Professional',
        'Dedicated account manager',
        'Custom integrations',
        'SLA guarantees',
        'Advanced security',
        'Training & onboarding',
        'Custom contracts',
      ],
      cta: 'Contact Sales',
      href: '/contact',
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="container mx-auto px-6">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the plan that fits your needs. Upgrade, downgrade, or cancel anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier, i) => (
            <div
              key={i}
              className={`
                relative
                bg-white rounded-2xl p-8
                border-2
                transition-all duration-300
                ${tier.popular
                  ? 'border-blue-600 shadow-2xl scale-105'
                  : 'border-gray-200 shadow-lg hover:shadow-xl'
                }
              `}
            >
              {/* Popular Badge */}
              {tier.popular && (
                <div className="
                  absolute -top-4 left-1/2 -translate-x-1/2
                  bg-blue-600 text-white
                  px-4 py-1
                  rounded-full text-sm font-semibold
                  shadow-lg
                ">
                  Most Popular
                </div>
              )}

              {/* Tier Name */}
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {tier.name}
              </h3>

              {/* Description */}
              <p className="text-gray-600 mb-6">
                {tier.description}
              </p>

              {/* Price */}
              <div className="mb-6">
                {tier.price === null ? (
                  <div className="text-4xl font-bold text-gray-900">
                    Custom
                  </div>
                ) : tier.price === 0 ? (
                  <div className="text-4xl font-bold text-gray-900">
                    Free
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900">
                      ${tier.price.toLocaleString()}
                    </span>
                    <span className="text-gray-600">/{tier.period}</span>
                  </div>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {tier.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-3">
                    <Check className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={tier.href}
                className={`
                  block w-full py-3 text-center
                  font-semibold
                  rounded-lg
                  transition-all duration-200
                  ${tier.popular
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-900 hover:bg-gray-800 text-white'
                  }
                `}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Compare Plans */}
        <div className="text-center mt-12">
          <Link
            href="/pricing"
            className="
              inline-flex items-center gap-2
              text-blue-600 hover:text-blue-700 font-semibold
            "
          >
            Compare all features
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </section>
  );
}




