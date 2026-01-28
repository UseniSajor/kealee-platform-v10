import Link from 'next/link';
import { Check, ArrowRight, Star } from 'lucide-react';

// Package feature definitions based on 50 critical construction operations tasks
const PACKAGE_FEATURES = {
  starter: [
    'Bid deadline management',
    'Daily progress documentation',
    'Punch list management',
    'Owner dashboard portal',
    'Automated progress reporting',
    'Mobile field access',
  ],
  professional: [
    'Schedule coordination with Gantt',
    'RFI management portal',
    'Submittal processing workflow',
    'Change order tracking',
    'AIA pay application generation',
    'Retention tracking',
    'Lien waiver automation',
    'Budget vs actual reporting',
    'Subcontractor prequalification',
    'Scope of work matrix',
    'Schedule compliance tracking',
    'Digital contract execution',
    'Permit application wizard',
    'Inspection scheduling',
  ],
  enterprise: [
    'AI-powered quantity takeoffs',
    'Material price tracking',
    'Labor rate analytics',
    'Bid broadcast to subs',
    'AI meeting transcription',
    'Weather delay tracking',
    'QC inspection checklists',
    'As-built documentation',
    'Cash flow forecasting',
    'Job costing dashboard',
    'AP optimization',
    'COI tracking',
    'Back-charge management',
    'Sub performance ratings',
    'Sub pay app review',
    'Code compliance monitoring',
    'OSHA safety manager',
    'Selection coordination',
    'Warranty portal',
    'Document version control',
  ],
  platform: [
    'AI scope gap analysis',
    'Competitive bid analytics',
    'Historical cost intelligence',
    'Bonding capacity dashboard',
    'Tax document automation',
    'Workforce capacity tracking',
    'Environmental compliance',
    'License renewal management',
    'Dispute resolution workflow',
    'Full API access & integrations',
  ],
};

export function Pricing() {
  const tiers = [
    {
      name: 'Package A: Starter',
      priceRange: '$49-199',
      period: 'month',
      jobs: '1-5 active projects',
      featureCount: 6,
      description: 'Essential tools for small contractors getting started with project management',
      features: PACKAGE_FEATURES.starter,
      cta: 'Start Free Trial',
      href: 'https://app.kealee.com/signup?plan=starter',
      popular: false,
      color: 'gray',
    },
    {
      name: 'Package B: Professional',
      priceRange: '$1,750-4,500',
      period: 'month',
      jobs: '5-25 active projects',
      featureCount: 20,
      description: 'Full-featured PM toolkit for growing construction companies',
      features: [
        'Everything in Starter, plus:',
        ...PACKAGE_FEATURES.professional,
      ],
      cta: 'Start Free Trial',
      href: 'https://app.kealee.com/signup?plan=professional',
      popular: true,
      color: 'blue',
    },
    {
      name: 'Package C: Enterprise',
      priceRange: '$8,500-16,500',
      period: 'month',
      jobs: '25-100 active projects',
      featureCount: 40,
      description: 'Advanced AI-powered tools for mid-size general contractors',
      features: [
        'Everything in Professional, plus:',
        ...PACKAGE_FEATURES.enterprise,
      ],
      cta: 'Contact Sales',
      href: '/contact?plan=enterprise',
      popular: false,
      color: 'purple',
    },
    {
      name: 'Package D: Platform',
      priceRange: '$25,000-50,000',
      period: 'month',
      jobs: '100+ active projects',
      featureCount: 50,
      description: 'Complete platform with full API access for large enterprises',
      features: [
        'Everything in Enterprise, plus:',
        ...PACKAGE_FEATURES.platform,
      ],
      cta: 'Contact Sales',
      href: '/contact?plan=platform',
      popular: false,
      color: 'gold',
    },
  ];

  return (
    <section id="pricing" className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Construction Management Packages
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-4">
            Choose the package that fits your project volume. All plans include our 50 critical construction operations tasks.
          </p>
          <p className="text-sm text-gray-500">
            Upgrade, downgrade, or cancel anytime. No long-term contracts required.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6 max-w-7xl mx-auto">
          {tiers.map((tier, i) => (
            <div
              key={i}
              className={`
                relative
                bg-white rounded-2xl p-6
                border-2
                transition-all duration-300
                flex flex-col
                ${tier.popular
                  ? 'border-blue-600 shadow-2xl lg:scale-105 z-10'
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
                  flex items-center gap-1
                ">
                  <Star size={14} fill="currentColor" />
                  Most Popular
                </div>
              )}

              {/* Tier Name */}
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                {tier.name}
              </h3>

              {/* Jobs Capacity */}
              <p className="text-sm text-blue-600 font-medium mb-2">
                {tier.jobs}
              </p>

              {/* Description */}
              <p className="text-gray-600 text-sm mb-4">
                {tier.description}
              </p>

              {/* Price */}
              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-gray-900">
                    {tier.priceRange}
                  </span>
                  <span className="text-gray-600">/{tier.period}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {tier.featureCount} features included
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-2 mb-6 flex-grow">
                {tier.features.slice(0, 8).map((feature, j) => (
                  <li key={j} className="flex items-start gap-2">
                    {feature.startsWith('Everything') ? (
                      <>
                        <ArrowRight className="text-blue-500 flex-shrink-0 mt-0.5" size={16} />
                        <span className="text-gray-700 text-sm font-medium">{feature}</span>
                      </>
                    ) : (
                      <>
                        <Check className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </>
                    )}
                  </li>
                ))}
                {tier.features.length > 8 && (
                  <li className="text-sm text-blue-600 font-medium pl-6">
                    +{tier.features.length - 8} more features
                  </li>
                )}
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

        {/* Feature Comparison Link */}
        <div className="text-center mt-12">
          <Link
            href="/pricing"
            className="
              inline-flex items-center gap-2
              text-blue-600 hover:text-blue-700 font-semibold
            "
          >
            Compare all 50 features in detail
            <ArrowRight size={20} />
          </Link>
        </div>

        {/* Agent Info */}
        <div className="mt-16 bg-blue-50 rounded-2xl p-8 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            Powered by 7 Specialized AI Agents
          </h3>
          <div className="grid md:grid-cols-4 gap-4 text-center">
            <div className="p-3">
              <div className="font-semibold text-blue-600">Estimating</div>
              <div className="text-xs text-gray-600">Takeoffs & Pricing</div>
            </div>
            <div className="p-3">
              <div className="font-semibold text-blue-600">Project Mgmt</div>
              <div className="text-xs text-gray-600">Schedule & QC</div>
            </div>
            <div className="p-3">
              <div className="font-semibold text-blue-600">Financial</div>
              <div className="text-xs text-gray-600">Billing & Cash Flow</div>
            </div>
            <div className="p-3">
              <div className="font-semibold text-blue-600">Subcontractor</div>
              <div className="text-xs text-gray-600">Prequalification</div>
            </div>
            <div className="p-3">
              <div className="font-semibold text-blue-600">Permits</div>
              <div className="text-xs text-gray-600">Compliance & Safety</div>
            </div>
            <div className="p-3">
              <div className="font-semibold text-blue-600">Client</div>
              <div className="text-xs text-gray-600">Communication</div>
            </div>
            <div className="p-3">
              <div className="font-semibold text-blue-600">Technology</div>
              <div className="text-xs text-gray-600">Integrations</div>
            </div>
            <div className="p-3">
              <div className="font-semibold text-gray-400">+ More</div>
              <div className="text-xs text-gray-400">Coming Soon</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
