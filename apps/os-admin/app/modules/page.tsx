'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import {
  Building2,
  Users,
  HardHat,
  Palette,
  FileCheck,
  Wallet,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  ArrowRight,
  Shield,
  Zap,
  type LucideIcon
} from 'lucide-react';
import Link from 'next/link';

/**
 * SOP v2 - os-admin MODULE CONTROL CENTER
 *
 * This page provides controls and monitoring for ALL platform modules:
 *
 * CLIENT-FACING (m-* apps):
 * - m-marketplace: Central hub, SEO, contractor directory
 * - m-project-owner: Homeowner dashboard, precon workflow
 * - m-ops-services: GC/Builder subscriptions (Package A/B/C/D)
 * - m-architect: Design services portal
 * - m-permits-inspections: Permit & inspection coordination
 * - m-finance-trust: Escrow & payments
 *
 * OPERATIONAL (os-* apps):
 * - os-pm: PM work execution (executes m-ops-services subscriptions)
 * - os-admin: Platform governance (this module)
 */

interface ModuleStatus {
  id: string;
  name: string;
  type: 'client' | 'operational';
  icon: LucideIcon;
  status: 'healthy' | 'degraded' | 'down';
  uptime: string;
  activeUsers: number;
  requestsToday: number;
  errorRate: string;
  lastDeployment: string;
  description: string;
  href: string;
}

const modules: ModuleStatus[] = [
  // Client-facing modules
  {
    id: 'm-marketplace',
    name: 'm-marketplace',
    type: 'client',
    icon: Building2,
    status: 'healthy',
    uptime: '99.98%',
    activeUsers: 1247,
    requestsToday: 45892,
    errorRate: '0.02%',
    lastDeployment: '2h ago',
    description: 'Central hub - All traffic flows through here',
    href: '/modules/m-marketplace'
  },
  {
    id: 'm-project-owner',
    name: 'm-project-owner',
    type: 'client',
    icon: Users,
    status: 'healthy',
    uptime: '99.95%',
    activeUsers: 892,
    requestsToday: 23456,
    errorRate: '0.05%',
    lastDeployment: '4h ago',
    description: 'Homeowner dashboard & precon workflow',
    href: '/modules/m-project-owner'
  },
  {
    id: 'm-ops-services',
    name: 'm-ops-services',
    type: 'client',
    icon: HardHat,
    status: 'healthy',
    uptime: '99.99%',
    activeUsers: 456,
    requestsToday: 12890,
    errorRate: '0.01%',
    lastDeployment: '1d ago',
    description: 'GC/Builder portal - Package subscriptions',
    href: '/modules/m-ops-services'
  },
  {
    id: 'm-architect',
    name: 'm-architect',
    type: 'client',
    icon: Palette,
    status: 'healthy',
    uptime: '99.92%',
    activeUsers: 234,
    requestsToday: 8765,
    errorRate: '0.08%',
    lastDeployment: '6h ago',
    description: 'Design services portal',
    href: '/modules/m-architect'
  },
  {
    id: 'm-permits-inspections',
    name: 'm-permits-inspections',
    type: 'client',
    icon: FileCheck,
    status: 'healthy',
    uptime: '99.97%',
    activeUsers: 567,
    requestsToday: 15678,
    errorRate: '0.03%',
    lastDeployment: '12h ago',
    description: 'Permit & inspection coordination',
    href: '/modules/m-permits-inspections'
  },
  {
    id: 'm-finance-trust',
    name: 'm-finance-trust',
    type: 'client',
    icon: Wallet,
    status: 'healthy',
    uptime: '99.999%',
    activeUsers: 345,
    requestsToday: 9876,
    errorRate: '0.001%',
    lastDeployment: '2d ago',
    description: 'ALL financial transactions & escrow',
    href: '/modules/m-finance-trust'
  },
  // Operational modules
  {
    id: 'os-pm',
    name: 'os-pm',
    type: 'operational',
    icon: Activity,
    status: 'healthy',
    uptime: '99.96%',
    activeUsers: 45,
    requestsToday: 34567,
    errorRate: '0.04%',
    lastDeployment: '3h ago',
    description: 'PM work execution - Delivers m-ops-services',
    href: '/modules/os-pm'
  },
  {
    id: 'os-admin',
    name: 'os-admin',
    type: 'operational',
    icon: Shield,
    status: 'healthy',
    uptime: '99.99%',
    activeUsers: 12,
    requestsToday: 5678,
    errorRate: '0.01%',
    lastDeployment: '1h ago',
    description: 'Platform governance & control (this module)',
    href: '/modules/os-admin'
  }
];

const servicePackageStats = {
  packageA: { active: 45, revenue: 78750 },
  packageB: { active: 32, revenue: 120000 },
  packageC: { active: 18, revenue: 171000 },
  packageD: { active: 5, revenue: 82500 }
};

const platformMetrics = {
  totalEscrow: 847250,
  pendingReleases: 12,
  activeProjects: 156,
  totalRevenueMTD: 452250
};

export default function ModulesPage() {
  const [selectedType, setSelectedType] = useState<'all' | 'client' | 'operational'>('all');

  const filteredModules = modules.filter(
    m => selectedType === 'all' || m.type === selectedType
  );

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Module Control Center</h1>
            <p className="text-gray-600 mt-2">
              SOP v2 - Monitor and control all platform modules
            </p>
          </div>

          {/* SOP Architecture Summary */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white mb-8">
            <h2 className="text-xl font-bold mb-4">Platform Architecture (SOP v2)</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold text-blue-200 mb-2">Client-Facing (m-*)</h3>
                <ul className="text-sm space-y-1 text-blue-100">
                  <li>m-marketplace = Central Hub</li>
                  <li>m-project-owner = Homeowner Dashboard</li>
                  <li>m-ops-services = GC Subscriptions</li>
                  <li>m-architect = Design Portal</li>
                  <li>m-permits-inspections = Permits</li>
                  <li>m-finance-trust = ALL Payments</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-purple-200 mb-2">Operational (os-*)</h3>
                <ul className="text-sm space-y-1 text-purple-100">
                  <li>os-pm = Executes m-ops-services</li>
                  <li>os-admin = Controls ALL modules</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-green-200 mb-2">Key Rules</h3>
                <ul className="text-sm space-y-1 text-green-100">
                  <li>All traffic through m-marketplace</li>
                  <li>All payments through m-finance-trust</li>
                  <li>os-pm delivers Package A/B/C/D</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Platform-wide Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <Wallet className="text-emerald-600" size={20} />
                <span className="text-sm text-gray-500">Total Escrow</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                ${platformMetrics.totalEscrow.toLocaleString()}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="text-amber-600" size={20} />
                <span className="text-sm text-gray-500">Pending Releases</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {platformMetrics.pendingReleases}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <Activity className="text-blue-600" size={20} />
                <span className="text-sm text-gray-500">Active Projects</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {platformMetrics.activeProjects}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="text-purple-600" size={20} />
                <span className="text-sm text-gray-500">Revenue MTD</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                ${platformMetrics.totalRevenueMTD.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Service Package Stats */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Zap size={20} className="text-purple-600" />
              PM Service Packages (m-ops-services subscriptions executed by os-pm)
            </h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-500">Package A ($1,750/mo)</div>
                <div className="text-2xl font-bold text-gray-900">{servicePackageStats.packageA.active}</div>
                <div className="text-sm text-green-600">${servicePackageStats.packageA.revenue.toLocaleString()} MRR</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm font-medium text-blue-600">Package B ($3,750/mo)</div>
                <div className="text-2xl font-bold text-gray-900">{servicePackageStats.packageB.active}</div>
                <div className="text-sm text-green-600">${servicePackageStats.packageB.revenue.toLocaleString()} MRR</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-300">
                <div className="text-sm font-medium text-purple-600">Package C ($9,500/mo) - Popular</div>
                <div className="text-2xl font-bold text-gray-900">{servicePackageStats.packageC.active}</div>
                <div className="text-sm text-green-600">${servicePackageStats.packageC.revenue.toLocaleString()} MRR</div>
              </div>
              <div className="bg-amber-50 rounded-lg p-4">
                <div className="text-sm font-medium text-amber-600">Package D ($16,500/mo)</div>
                <div className="text-2xl font-bold text-gray-900">{servicePackageStats.packageD.active}</div>
                <div className="text-sm text-green-600">${servicePackageStats.packageD.revenue.toLocaleString()} MRR</div>
              </div>
            </div>
          </div>

          {/* Module Filter */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm text-gray-500">Filter:</span>
            {['all', 'client', 'operational'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type === 'all' ? 'All Modules' : type === 'client' ? 'Client (m-*)' : 'Operational (os-*)'}
              </button>
            ))}
          </div>

          {/* Module Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModules.map((module) => {
              const Icon = module.icon;
              return (
                <div
                  key={module.id}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        module.type === 'client' ? 'bg-blue-100' : 'bg-purple-100'
                      }`}>
                        <Icon size={24} className={module.type === 'client' ? 'text-blue-600' : 'text-purple-600'} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{module.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          module.type === 'client' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {module.type === 'client' ? 'Client-Facing' : 'Operational'}
                        </span>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      module.status === 'healthy' ? 'bg-green-100 text-green-700' :
                      module.status === 'degraded' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {module.status === 'healthy' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                      {module.status}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4">{module.description}</p>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500">Uptime</div>
                      <div className="font-bold text-gray-900">{module.uptime}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500">Active Users</div>
                      <div className="font-bold text-gray-900">{module.activeUsers.toLocaleString()}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500">Requests Today</div>
                      <div className="font-bold text-gray-900">{module.requestsToday.toLocaleString()}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500">Error Rate</div>
                      <div className="font-bold text-gray-900">{module.errorRate}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <span className="text-xs text-gray-500">
                      Last deployed: {module.lastDeployment}
                    </span>
                    <Link
                      href={module.href}
                      className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      Manage
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
