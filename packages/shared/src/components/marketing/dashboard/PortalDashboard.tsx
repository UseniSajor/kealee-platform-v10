// Portal Dashboard with Topbar Navigation
// Generic dashboard template for all portals
// Uses topbar navigation instead of sidebar

import React, { useState } from 'react';

// Icons
const Icons = {
  Building2: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  Menu: () => (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  X: () => (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  ChevronDown: () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  ),
  Bell: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  Settings: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  User: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  TrendingUp: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  TrendingDown: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
    </svg>
  ),
  Plus: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  ),
  FolderKanban: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  ),
  Clock: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  DollarSign: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  ChevronRight: () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  ),
};

// Types
interface StatCard {
  label: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down';
  icon: React.FC;
}

interface ProjectCard {
  id: string;
  name: string;
  address: string;
  status: 'active' | 'pending' | 'completed';
  progress: number;
  budget: string;
  nextMilestone: string;
}

// Portal configuration type
interface PortalConfig {
  name: string;
  logoText: string;
  primaryColor: string;
  bgColor: string;
  hoverColor: string;
}

// Sample data
const sampleStats: StatCard[] = [
  { label: 'Active Projects', value: '12', change: '+2 vs last month', trend: 'up', icon: Icons.FolderKanban },
  { label: 'Pending Items', value: '8', change: '-3 vs last month', trend: 'down', icon: Icons.Clock },
  { label: 'Revenue This Month', value: '$45,200', change: '+12%', trend: 'up', icon: Icons.DollarSign },
  { label: 'Goal Progress', value: '85%', change: 'On track', trend: 'up', icon: Icons.TrendingUp },
];

const sampleProjects: ProjectCard[] = [
  { id: '1', name: 'Downtown Office TI', address: '1234 Main St, Baltimore', status: 'active', progress: 65, budget: '$125,000', nextMilestone: 'Drywall complete - Feb 15' },
  { id: '2', name: 'Retail Renovation', address: '567 Commerce Blvd', status: 'active', progress: 30, budget: '$78,000', nextMilestone: 'Permit approval - Feb 10' },
  { id: '3', name: 'Medical Suite Build-out', address: '890 Health Park Dr', status: 'pending', progress: 0, budget: '$245,000', nextMilestone: 'Contractor selection - Feb 8' },
  { id: '4', name: 'Restaurant Kitchen', address: '234 Foodie Lane', status: 'active', progress: 90, budget: '$92,000', nextMilestone: 'Final inspection - Feb 5' },
];

// Status badge component
function StatusBadge({ status }: { status: ProjectCard['status'] }) {
  const styles = {
    active: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-gray-100 text-gray-700',
  };

  const labels = {
    active: 'Active',
    pending: 'Pending',
    completed: 'Completed',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

// Topbar Navigation for Dashboard
function DashboardTopbar({ config }: { config: PortalConfig }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white">
      <nav className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-x-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${config.bgColor} text-white`}>
            <Icons.Building2 />
          </div>
          <span className="text-xl font-semibold text-[#4A90D9]">{config.logoText}</span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex lg:items-center lg:gap-x-6">
          <a href="/dashboard" className="text-sm font-medium text-[#2ABFBF] border-b-2 border-[#2ABFBF] pb-0.5">
            Dashboard
          </a>

          {/* Features Dropdown */}
          <div className="relative">
            <button
              onClick={() => { setFeaturesOpen(!featuresOpen); setServicesOpen(false); }}
              className="flex items-center gap-x-1 text-sm font-medium text-gray-700 hover:text-[#4A90D9]"
            >
              Features
              <Icons.ChevronDown />
            </button>
            {featuresOpen && (
              <div className="absolute left-0 top-full mt-2 w-[520px] rounded-xl bg-white p-5 shadow-xl ring-1 ring-gray-200">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Project Management
                    </h4>
                    <div className="space-y-1">
                      <a href="/projects" className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-gray-50 transition-colors">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${config.bgColor}/10 ${config.primaryColor}`}>
                          <Icons.FolderKanban />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Projects</p>
                          <p className="text-xs text-gray-500">View all projects</p>
                        </div>
                      </a>
                      <a href="/schedule" className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-gray-50 transition-colors">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${config.bgColor}/10 ${config.primaryColor}`}>
                          <Icons.Clock />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Schedule</p>
                          <p className="text-xs text-gray-500">Timeline & milestones</p>
                        </div>
                      </a>
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Finance & Team
                    </h4>
                    <div className="space-y-1">
                      <a href="/budget" className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-gray-50 transition-colors">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${config.bgColor}/10 ${config.primaryColor}`}>
                          <Icons.DollarSign />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Budget</p>
                          <p className="text-xs text-gray-500">Track finances</p>
                        </div>
                      </a>
                      <a href="/team" className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-gray-50 transition-colors">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${config.bgColor}/10 ${config.primaryColor}`}>
                          <Icons.User />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Team</p>
                          <p className="text-xs text-gray-500">Manage team members</p>
                        </div>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Services Dropdown - Links to Services Mega Menu */}
          <div className="relative">
            <button
              onClick={() => { setServicesOpen(!servicesOpen); setFeaturesOpen(false); }}
              className="flex items-center gap-x-1 text-sm font-medium text-gray-700 hover:text-[#4A90D9]"
            >
              Services
              <Icons.ChevronDown />
            </button>
            {servicesOpen && (
              <ServicesMegaMenu onClose={() => setServicesOpen(false)} />
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-x-3">
          {/* Notifications */}
          <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
            <Icons.Bell />
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              3
            </span>
          </button>

          {/* Settings */}
          <a href="/settings" className="hidden sm:block rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
            <Icons.Settings />
          </a>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-gray-600">
                <Icons.User />
              </div>
              <span className="hidden text-sm font-medium text-gray-700 sm:block">John D.</span>
              <Icons.ChevronDown />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-white p-2 shadow-lg ring-1 ring-gray-200">
                <div className="border-b border-gray-100 px-3 py-2 mb-2">
                  <p className="text-sm font-medium text-gray-900">John Doe</p>
                  <p className="text-xs text-gray-500">john@company.com</p>
                </div>
                <a href="/settings" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <Icons.Settings />
                  Settings
                </a>
                <a href="/logout" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                  Sign out
                </a>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden rounded-lg p-2 text-gray-700 hover:bg-gray-100"
          >
            {mobileMenuOpen ? <Icons.X /> : <Icons.Menu />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white px-4 py-4">
          <div className="space-y-4">
            <a href="/dashboard" className="block text-base font-medium text-[#2ABFBF]">Dashboard</a>
            <a href="/projects" className="block text-base font-medium text-gray-700">Projects</a>
            <a href="/budget" className="block text-base font-medium text-gray-700">Budget</a>
            <a href="/team" className="block text-base font-medium text-gray-700">Team</a>
            <div className="border-t border-gray-200 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Services</p>
              <div className="mt-2 space-y-2 pl-4">
                <a href="/services/contractors" className="block text-sm text-gray-700">Find Contractors</a>
                <a href="/services/estimation" className="block text-sm text-gray-700">Estimation</a>
                <a href="/services/permits" className="block text-sm text-gray-700">Permits</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

// Services Mega Menu Component
function ServicesMegaMenu({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute left-1/2 top-full mt-2 w-[680px] -translate-x-1/2 rounded-xl bg-white p-6 shadow-xl ring-1 ring-gray-200">
      {/* Header */}
      <div className="mb-4 border-b border-gray-100 pb-3">
        <h3 className="text-sm font-semibold text-gray-900">Platform Services</h3>
        <p className="text-xs text-gray-500">Expert services to support your projects</p>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Contractor & Estimation */}
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-orange-100 text-orange-600">
              <Icons.Building2 />
            </span>
            Contractor & Estimation
          </h4>
          <div className="space-y-1">
            <a href="/services/contractors" className="group flex items-start gap-3 rounded-lg p-2.5 hover:bg-gray-50 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">Find Contractors</p>
                  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-700">Popular</span>
                </div>
                <p className="text-xs text-gray-500">Browse our network of vetted contractors</p>
              </div>
              <Icons.ChevronRight />
            </a>
            <a href="/services/estimation" className="group flex items-start gap-3 rounded-lg p-2.5 hover:bg-gray-50 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">Get Estimate</p>
                  <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-medium text-teal-700">AI</span>
                </div>
                <p className="text-xs text-gray-500">AI-powered construction cost estimation</p>
              </div>
              <Icons.ChevronRight />
            </a>
            <a href="/services/assemblies" className="group flex items-start gap-3 rounded-lg p-2.5 hover:bg-gray-50 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">Assembly Library</p>
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">1,200+</span>
                </div>
                <p className="text-xs text-gray-500">Pre-built construction assemblies</p>
              </div>
              <Icons.ChevronRight />
            </a>
          </div>
        </div>

        {/* Permits & PM */}
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-blue-100 text-blue-600">
              <Icons.FolderKanban />
            </span>
            Permits & Management
          </h4>
          <div className="space-y-1">
            <a href="/services/permits" className="group flex items-start gap-3 rounded-lg p-2.5 hover:bg-gray-50 transition-colors">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Permit Assistance</p>
                <p className="text-xs text-gray-500">Expert help with building permits</p>
              </div>
              <Icons.ChevronRight />
            </a>
            <a href="/services/inspections" className="group flex items-start gap-3 rounded-lg p-2.5 hover:bg-gray-50 transition-colors">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Inspection Coordination</p>
                <p className="text-xs text-gray-500">Schedule and track building inspections</p>
              </div>
              <Icons.ChevronRight />
            </a>
            <a href="/services/pm" className="group flex items-start gap-3 rounded-lg p-2.5 hover:bg-gray-50 transition-colors">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">PM Services</p>
                <p className="text-xs text-gray-500">Managed project management</p>
              </div>
              <Icons.ChevronRight />
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
        <a href="/services" className="text-sm font-medium text-[#4A90D9] hover:text-[#3a7bc0]">
          View All Services →
        </a>
        <a href="/pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900">
          Compare Pricing
        </a>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ stat }: { stat: StatCard }) {
  const Icon = stat.icon;
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
          <Icon />
        </div>
        {stat.trend && (
          <span className={`flex items-center gap-1 text-xs font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {stat.trend === 'up' ? <Icons.TrendingUp /> : <Icons.TrendingDown />}
            {stat.change}
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-bold text-gray-900">{stat.value}</p>
      <p className="text-sm text-gray-500">{stat.label}</p>
    </div>
  );
}

// Project Card Component
function ProjectCardComponent({ project }: { project: ProjectCard }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{project.name}</h3>
          <p className="text-sm text-gray-500">{project.address}</p>
        </div>
        <StatusBadge status={project.status} />
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium text-gray-900">{project.progress}%</span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-[#2ABFBF] transition-all"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      {/* Details */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <div>
          <span className="text-gray-500">Budget:</span>
          <span className="ml-1 font-medium text-gray-900">{project.budget}</span>
        </div>
      </div>

      {/* Next Milestone */}
      <div className="mt-3 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm">
        <Icons.Clock />
        <span className="text-gray-600">{project.nextMilestone}</span>
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <a href={`/projects/${project.id}`} className="flex-1 rounded-lg bg-gray-100 px-3 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-200">
          View
        </a>
        <a href={`/projects/${project.id}/edit`} className="flex-1 rounded-lg bg-[#4A90D9] px-3 py-2 text-center text-sm font-medium text-white hover:bg-[#3a7bc0]">
          Edit
        </a>
      </div>
    </div>
  );
}

// Page Header Component
function PageHeader({ title, breadcrumbs }: { title: string; breadcrumbs: string[] }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <nav className="mt-1 flex items-center gap-1 text-sm text-gray-500">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb}>
              {index > 0 && <Icons.ChevronRight />}
              <span className={index === breadcrumbs.length - 1 ? 'text-gray-900' : ''}>{crumb}</span>
            </React.Fragment>
          ))}
        </nav>
      </div>
      <button className="inline-flex items-center gap-2 rounded-lg bg-[#E8793A] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#d66a2e]">
        <Icons.Plus />
        New Project
      </button>
    </div>
  );
}

// Main Dashboard Component
interface PortalDashboardProps {
  portalType?: 'developer' | 'owner' | 'contractor' | 'professional' | 'homeowner';
}

export default function PortalDashboard({ portalType = 'developer' }: PortalDashboardProps) {
  const portalConfigs: Record<string, PortalConfig> = {
    developer: {
      name: 'Developer',
      logoText: 'Kealee Developer',
      primaryColor: 'text-purple-600',
      bgColor: 'bg-purple-600',
      hoverColor: 'hover:bg-purple-50',
    },
    owner: {
      name: 'Owner',
      logoText: 'Kealee Owner',
      primaryColor: 'text-orange-600',
      bgColor: 'bg-[#E8793A]',
      hoverColor: 'hover:bg-orange-50',
    },
    contractor: {
      name: 'Contractor',
      logoText: 'Kealee Contractor',
      primaryColor: 'text-orange-600',
      bgColor: 'bg-[#E8793A]',
      hoverColor: 'hover:bg-orange-50',
    },
    professional: {
      name: 'Professional',
      logoText: 'Kealee Professional',
      primaryColor: 'text-teal-600',
      bgColor: 'bg-[#2ABFBF]',
      hoverColor: 'hover:bg-teal-50',
    },
    homeowner: {
      name: 'Homeowner',
      logoText: 'Kealee',
      primaryColor: 'text-[#4A90D9]',
      bgColor: 'bg-[#4A90D9]',
      hoverColor: 'hover:bg-blue-50',
    },
  };

  const config = portalConfigs[portalType];

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardTopbar config={config} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <PageHeader title="Dashboard" breadcrumbs={['Home', 'Dashboard']} />

        {/* Stats Grid */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {sampleStats.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </div>

        {/* Projects Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Projects</h2>
            <a href="/projects" className="text-sm font-medium text-[#4A90D9] hover:text-[#3a7bc0]">
              View all →
            </a>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {sampleProjects.map((project) => (
              <ProjectCardComponent key={project.id} project={project} />
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <a href="/estimation/new" className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 hover:bg-gray-50">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
                <Icons.DollarSign />
              </div>
              <div>
                <p className="font-medium text-gray-900">New Estimate</p>
                <p className="text-xs text-gray-500">Create a cost estimate</p>
              </div>
            </a>
            <a href="/contractors/search" className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 hover:bg-gray-50">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                <Icons.User />
              </div>
              <div>
                <p className="font-medium text-gray-900">Find Contractor</p>
                <p className="text-xs text-gray-500">Search verified contractors</p>
              </div>
            </a>
            <a href="/permits/new" className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 hover:bg-gray-50">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <Icons.FolderKanban />
              </div>
              <div>
                <p className="font-medium text-gray-900">Start Permit</p>
                <p className="text-xs text-gray-500">Begin permit process</p>
              </div>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

// Export components
export { DashboardTopbar, ServicesMegaMenu, StatCard, ProjectCardComponent, PageHeader };
