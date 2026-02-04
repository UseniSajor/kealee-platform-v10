// apps/m-ops-services/components/ServiceDetailClient.tsx
// Service Detail Page Client Component

'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { MarketingLayout, ServiceCard } from '@kealee/ui';

interface Service {
  slug: string;
  name: string;
  category: 'operations' | 'estimation';
  price: number;
  priceUnit: 'flat' | 'per_sqft' | 'per_hour' | 'starting_at';
  description: string;
  longDescription: string;
  includes: string[];
  requirements: string[];
  deliveryTime: string;
  sampleDeliverable?: string;
}

interface ServiceDetailClientProps {
  service: Service;
  relatedServices: Service[];
  frequentlyOrderedWith: Service[];
  breadcrumbCategory: string;
}

function formatPrice(price: number, unit: string): string {
  switch (unit) {
    case 'flat':
      return `$${price}`;
    case 'per_sqft':
      return `$${price}/sq ft`;
    case 'per_hour':
      return `$${price}/hr`;
    case 'starting_at':
      return `From $${price}`;
    default:
      return `$${price}`;
  }
}

export function ServiceDetailClient({
  service,
  relatedServices,
  frequentlyOrderedWith,
}: ServiceDetailClientProps) {
  const categoryLabel = service.category === 'operations' ? 'Operations' : 'Estimation';
  const categoryColor = service.category === 'operations' ? 'bg-[#2ABFBF]' : 'bg-[#E8793A]';

  return (
    <MarketingLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/" className="text-gray-500 hover:text-[#4A90D9]">
                Ops Services
              </Link>
              <span className="text-gray-300">/</span>
              <Link
                href={`/services?category=${service.category}`}
                className="text-gray-500 hover:text-[#4A90D9]"
              >
                {categoryLabel}
              </Link>
              <span className="text-gray-300">/</span>
              <span className="text-[#4A90D9] font-medium">{service.name}</span>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column (60%) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:w-3/5"
            >
              {/* Service Name & Category */}
              <div className="mb-6">
                <span
                  className={`inline-block px-3 py-1 ${categoryColor} text-white text-sm font-medium rounded-full mb-3`}
                >
                  {categoryLabel}
                </span>
                <h1 className="text-3xl font-bold text-[#4A90D9]">{service.name}</h1>
              </div>

              {/* Description */}
              <div className="prose prose-lg max-w-none mb-8">
                {service.longDescription.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="text-gray-600 mb-4">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* What's Included */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h2 className="text-xl font-bold text-[#4A90D9] mb-4 flex items-center gap-2">
                  <svg
                    className="w-6 h-6 text-[#38A169]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  What's Included
                </h2>
                <ul className="space-y-3">
                  {service.includes.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-[#38A169] mt-0.5 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* What We Need From You */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h2 className="text-xl font-bold text-[#4A90D9] mb-4 flex items-center gap-2">
                  <svg
                    className="w-6 h-6 text-[#E8793A]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  What We Need From You
                </h2>
                <ul className="space-y-3">
                  {service.requirements.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-sm flex-shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Delivery Timeline */}
              <div className="bg-[#4A90D9] rounded-xl p-6 mb-6 text-white">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white/70 text-sm">Delivery Timeline</p>
                    <p className="text-xl font-bold">{service.deliveryTime}</p>
                  </div>
                </div>
              </div>

              {/* Sample Deliverable */}
              {service.sampleDeliverable && (
                <div className="bg-gray-100 rounded-xl p-6 mb-6">
                  <h3 className="font-semibold text-[#4A90D9] mb-3">Sample Deliverable</h3>
                  <div className="bg-white rounded-lg border border-gray-200 p-8 flex items-center justify-center">
                    <div className="text-center">
                      <svg
                        className="w-16 h-16 text-gray-300 mx-auto mb-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <p className="text-gray-500 text-sm">Sample PDF Preview</p>
                      <Link
                        href={service.sampleDeliverable}
                        className="text-[#E8793A] hover:text-[#d16a2f] text-sm font-medium mt-2 inline-block"
                      >
                        Download Sample →
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Right Column (40%) - Sticky Price Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:w-2/5"
            >
              <div className="lg:sticky lg:top-8">
                <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
                  {/* Price */}
                  <div className="text-center mb-6 pb-6 border-b border-gray-100">
                    <p className="text-5xl font-bold font-mono text-[#4A90D9]">
                      {formatPrice(service.price, service.priceUnit)}
                    </p>
                    <p className="text-gray-500 mt-1">
                      {service.priceUnit === 'starting_at' ? 'Starting price' : 'One-time payment'}
                    </p>
                  </div>

                  {/* CTAs */}
                  <div className="space-y-3">
                    <Link
                      href={`/order/${service.slug}`}
                      className="block w-full py-3 px-4 bg-[#E8793A] text-white font-semibold rounded-xl text-center hover:bg-[#d16a2f] transition-colors"
                    >
                      Order This Service
                    </Link>
                    <button className="w-full py-3 px-4 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors">
                      Add to Cart
                    </button>
                  </div>

                  {/* Security Badges */}
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="flex items-center justify-center gap-4 text-gray-400 text-xs">
                      <span className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                        Secure checkout
                      </span>
                      <span className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                          />
                        </svg>
                        Satisfaction guaranteed
                      </span>
                    </div>
                  </div>

                  {/* Custom Quote */}
                  <div className="mt-6 text-center">
                    <Link
                      href="/contact"
                      className="text-[#E8793A] hover:text-[#d16a2f] text-sm font-medium"
                    >
                      Need a custom quote? Contact us →
                    </Link>
                  </div>
                </div>

                {/* Bundle Suggestion */}
                {frequentlyOrderedWith.length > 0 && (
                  <div className="mt-6 bg-[#E8793A]/5 border border-[#E8793A]/20 rounded-xl p-4">
                    <p className="font-semibold text-[#4A90D9] text-sm mb-2">
                      Frequently Ordered Together
                    </p>
                    <div className="space-y-2">
                      {frequentlyOrderedWith.slice(0, 2).map((related) => (
                        <Link
                          key={related.slug}
                          href={`/services/${related.slug}`}
                          className="flex items-center justify-between p-2 bg-white rounded-lg hover:shadow-sm transition-shadow"
                        >
                          <span className="text-sm text-gray-700">{related.name}</span>
                          <span className="text-sm font-mono font-semibold text-[#4A90D9]">
                            {formatPrice(related.price, related.priceUnit)}
                          </span>
                        </Link>
                      ))}
                    </div>
                    <button className="w-full mt-3 py-2 px-3 bg-[#E8793A] text-white text-sm font-medium rounded-lg hover:bg-[#d16a2f] transition-colors">
                      Add Bundle & Save 10%
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Related Services */}
          {relatedServices.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mt-16"
            >
              <h2 className="text-2xl font-bold text-[#4A90D9] mb-6">Related Services</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {relatedServices.slice(0, 3).map((related) => (
                  <ServiceCard
                    key={related.slug}
                    service={{
                      name: related.name,
                      description: related.description,
                      price: related.price,
                      priceUnit: related.priceUnit === 'starting_at' ? 'from' : '',
                      href: `/services/${related.slug}`,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </MarketingLayout>
  );
}
