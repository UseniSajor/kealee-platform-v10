// Services Mega-Menu Component
// Organized with sections for easy navigation and browsing
// Used across all portal topbar navigations

import React from 'react';

// Icons
const Icons = {
  HardHat: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  Calculator: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  FileCheck: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Briefcase: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Boxes: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  Search: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  ClipboardList: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  Users: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  ChevronRight: () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  ),
  ArrowRight: () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  ),
};

// Service item type
interface ServiceItem {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.FC;
  badge?: {
    label: string;
    color: 'orange' | 'teal' | 'green' | 'blue' | 'purple';
  };
}

// Service section type
interface ServiceSection {
  id: string;
  title: string;
  icon: React.FC;
  iconBg: string;
  items: ServiceItem[];
}

// Badge color classes
const badgeColors = {
  orange: 'bg-orange-100 text-orange-700',
  teal: 'bg-teal-100 text-teal-700',
  green: 'bg-green-100 text-green-700',
  blue: 'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
};

// Service sections data
const serviceSections: ServiceSection[] = [
  {
    id: 'contractor-estimation',
    title: 'Contractor & Estimation',
    icon: Icons.HardHat,
    iconBg: 'bg-orange-100 text-orange-600',
    items: [
      {
        id: 'find-contractors',
        title: 'Find Contractors',
        description: 'Browse our network of vetted contractors in your area',
        href: '/services/contractors',
        icon: Icons.Users,
        badge: { label: 'Popular', color: 'orange' },
      },
      {
        id: 'request-bids',
        title: 'Request Bids',
        description: 'Post your project and receive competitive bids',
        href: '/services/bids',
        icon: Icons.ClipboardList,
      },
      {
        id: 'get-estimate',
        title: 'Get Estimate',
        description: 'AI-powered construction cost estimation in 24-48 hours',
        href: '/services/estimation',
        icon: Icons.Calculator,
        badge: { label: 'AI', color: 'teal' },
      },
      {
        id: 'assembly-library',
        title: 'Assembly Library',
        description: 'Browse 1,200+ pre-built construction assemblies',
        href: '/services/assemblies',
        icon: Icons.Boxes,
        badge: { label: '1,200+', color: 'green' },
      },
    ],
  },
  {
    id: 'permits-management',
    title: 'Permits & Management',
    icon: Icons.FileCheck,
    iconBg: 'bg-blue-100 text-blue-600',
    items: [
      {
        id: 'permit-assistance',
        title: 'Permit Assistance',
        description: 'Expert help with building permit applications',
        href: '/services/permits',
        icon: Icons.FileCheck,
      },
      {
        id: 'inspection-coordination',
        title: 'Inspection Coordination',
        description: 'Schedule and track building inspections',
        href: '/services/inspections',
        icon: Icons.Search,
      },
      {
        id: 'pm-services',
        title: 'Project Management',
        description: 'Managed PM services for your construction project',
        href: '/services/pm',
        icon: Icons.Briefcase,
      },
      {
        id: 'remote-pm',
        title: 'Remote PM',
        description: 'Full remote project oversight by our expert team',
        href: '/services/remote-pm',
        icon: Icons.Users,
        badge: { label: 'Premium', color: 'purple' },
      },
    ],
  },
];

// Service Item Component
function ServiceItemComponent({ item }: { item: ServiceItem }) {
  const Icon = item.icon;

  return (
    <a
      href={item.href}
      className="group flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-gray-50"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition-colors group-hover:bg-[#4A90D9]/10 group-hover:text-[#4A90D9]">
        <Icon />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900 group-hover:text-[#4A90D9]">
            {item.title}
          </p>
          {item.badge && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${badgeColors[item.badge.color]}`}>
              {item.badge.label}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{item.description}</p>
      </div>
      <Icons.ChevronRight />
    </a>
  );
}

// Service Section Component
function ServiceSectionComponent({ section }: { section: ServiceSection }) {
  const Icon = section.icon;

  return (
    <div>
      <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
        <span className={`flex h-5 w-5 items-center justify-center rounded ${section.iconBg}`}>
          <Icon />
        </span>
        {section.title}
      </h4>
      <div className="space-y-1">
        {section.items.map((item) => (
          <ServiceItemComponent key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

// Main Mega Menu Component
interface ServicesMegaMenuProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

export default function ServicesMegaMenu({ isOpen = true, onClose, className = '' }: ServicesMegaMenuProps) {
  if (!isOpen) return null;

  return (
    <div className={`absolute left-1/2 top-full z-50 mt-2 w-[720px] -translate-x-1/2 rounded-xl bg-white shadow-xl ring-1 ring-gray-200 ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Platform Services</h3>
            <p className="mt-0.5 text-sm text-gray-500">Expert services to support your construction projects</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-8">
          {serviceSections.map((section) => (
            <ServiceSectionComponent key={section.id} section={section} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-6 py-4 rounded-b-xl">
        <a
          href="/services"
          className="inline-flex items-center gap-1 text-sm font-medium text-[#4A90D9] hover:text-[#3a7bc0] transition-colors"
        >
          View All Services
          <Icons.ArrowRight />
        </a>
        <div className="flex items-center gap-4">
          <a href="/pricing" className="text-sm text-gray-600 hover:text-gray-900">
            Pricing
          </a>
          <a href="/help" className="text-sm text-gray-600 hover:text-gray-900">
            Help Center
          </a>
        </div>
      </div>
    </div>
  );
}

// Standalone Services Menu for embedding
export function ServicesMenuStandalone() {
  return (
    <div className="mx-auto max-w-3xl p-8">
      <div className="rounded-xl border border-gray-200 bg-white shadow-lg">
        {/* Header */}
        <div className="border-b border-gray-100 px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">Platform Services</h3>
          <p className="mt-0.5 text-sm text-gray-500">Expert services to support your construction projects</p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid gap-8 md:grid-cols-2">
            {serviceSections.map((section) => (
              <ServiceSectionComponent key={section.id} section={section} />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-6 py-4 rounded-b-xl">
          <a
            href="/services"
            className="inline-flex items-center gap-1 text-sm font-medium text-[#4A90D9] hover:text-[#3a7bc0] transition-colors"
          >
            View All Services
            <Icons.ArrowRight />
          </a>
          <div className="flex items-center gap-4">
            <a href="/pricing" className="text-sm text-gray-600 hover:text-gray-900">
              Pricing
            </a>
            <a href="/help" className="text-sm text-gray-600 hover:text-gray-900">
              Help Center
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mobile-optimized version
export function ServicesMobileMenu() {
  return (
    <div className="divide-y divide-gray-100">
      {serviceSections.map((section) => (
        <div key={section.id} className="py-4">
          <h4 className="mb-3 flex items-center gap-2 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
            <span className={`flex h-5 w-5 items-center justify-center rounded ${section.iconBg}`}>
              <section.icon />
            </span>
            {section.title}
          </h4>
          <div className="space-y-1 px-2">
            {section.items.map((item) => (
              <a
                key={item.id}
                href={item.href}
                className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{item.title}</span>
                  {item.badge && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${badgeColors[item.badge.color]}`}>
                      {item.badge.label}
                    </span>
                  )}
                </div>
                <Icons.ChevronRight />
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Export types for external use
export type { ServiceItem, ServiceSection };
