'use client';

import { useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';

interface Service {
  name: string;
  description: string;
  price: string;
}

interface ServiceCategory {
  id: string;
  title: string;
  description: string;
  services: Service[];
}

const serviceCategories: ServiceCategory[] = [
  {
    id: 'permits-field',
    title: 'Permits & Field Ops',
    description: 'On-site coordination and regulatory compliance support',
    services: [
      {
        name: 'Permit Application Assistance',
        description: 'Submit and track permit applications through approval',
        price: 'Starting at $325',
      },
      {
        name: 'Inspection Scheduling',
        description: 'Coordinate inspections and handle re-inspection follow-ups',
        price: 'Starting at $200',
      },
      {
        name: 'Site Visit & Reporting',
        description: 'Scheduled site visits with photo documentation and progress reports',
        price: 'Starting at $350',
      },
      {
        name: 'Quality Control Review',
        description: 'Independent quality checks against plans and specifications',
        price: 'Starting at $400',
      },
    ],
  },
  {
    id: 'coordination-admin',
    title: 'Coordination & Admin',
    description: 'Keep your projects moving with organized communication',
    services: [
      {
        name: 'Contractor Coordination',
        description: 'Manage sub schedules, deliveries, and change order tracking',
        price: 'Starting at $500',
      },
      {
        name: 'Change Order Management',
        description: 'Document, price, and track change orders from request to approval',
        price: 'Starting at $475',
      },
      {
        name: 'Document Organization',
        description: 'Centralize contracts, invoices, and project documents',
        price: 'Starting at $400',
      },
      {
        name: 'Progress Reporting',
        description: 'Weekly or bi-weekly client updates with photos and milestones',
        price: 'Starting at $250',
      },
    ],
  },
  {
    id: 'estimating-precon',
    title: 'Estimating & Pre-Construction',
    description: 'Front-end planning for better project outcomes',
    services: [
      {
        name: 'Budget Analysis',
        description: 'Review estimates and provide cost-saving recommendations',
        price: 'Starting at $450',
      },
      {
        name: 'Schedule Optimization',
        description: 'Build or refine project schedules to minimize delays',
        price: 'Starting at $1,250',
      },
      {
        name: 'Scope Review',
        description: 'Identify gaps and clarify specifications before the build',
        price: '$300/hour',
      },
      {
        name: 'Value Engineering',
        description: 'Cost-reduction analysis without sacrificing quality',
        price: '$400/hour',
      },
    ],
  },
];

export function OnDemandOps() {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  return (
    <section className="max-w-5xl mx-auto">
      {/* Section Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-zinc-900">
          On-Demand Ops
        </h2>
        <p className="mt-3 text-lg text-zinc-600 max-w-2xl mx-auto">
          Add flexible operational support to any Kealee Ops package — only when
          you need it.
        </p>
      </div>

      {/* Accordion Categories */}
      <div className="space-y-3">
        {serviceCategories.map((category) => {
          const isExpanded = expandedCategory === category.id;

          return (
            <div
              key={category.id}
              className="border border-zinc-200 rounded-xl bg-white overflow-hidden transition-shadow hover:shadow-sm"
            >
              {/* Category Header - Clickable */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-zinc-50/50 transition-colors"
              >
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-zinc-900">
                    {category.title}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-600">
                    {category.description}
                  </p>
                </div>
                <ChevronDown
                  className={`h-5 w-5 text-zinc-400 transition-transform flex-shrink-0 ml-4 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Services List - Collapsible */}
              {isExpanded && (
                <div className="border-t border-zinc-100 bg-zinc-50/30">
                  <div className="divide-y divide-zinc-100">
                    {category.services.map((service, idx) => (
                      <div
                        key={idx}
                        className="px-6 py-4 flex items-start justify-between gap-4 hover:bg-white/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-zinc-900">
                            {service.name}
                          </h4>
                          <p className="mt-1 text-sm text-zinc-600">
                            {service.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-sm font-semibold text-zinc-700 whitespace-nowrap">
                            {service.price}
                          </span>
                          <button
                            className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Add service:', service.name);
                            }}
                          >
                            <Plus className="h-4 w-4 mr-1.5" />
                            Add
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div className="mt-8 p-6 bg-gradient-to-br from-zinc-50 to-zinc-100/50 rounded-xl border border-zinc-200">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-zinc-900">
              Need a custom package?
            </h3>
            <p className="text-sm text-zinc-600 mt-1">
              Talk to our team about combining services for your specific needs
            </p>
          </div>
          <button className="px-6 py-2.5 bg-zinc-900 text-white font-medium rounded-lg hover:bg-zinc-800 transition-colors whitespace-nowrap">
            Contact Sales
          </button>
        </div>
      </div>
    </section>
  );
}
