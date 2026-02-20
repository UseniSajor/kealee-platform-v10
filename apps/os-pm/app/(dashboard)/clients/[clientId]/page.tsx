'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Package,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Folder,
  ArrowRight,
  Briefcase,
  Zap,
  Star
} from 'lucide-react';
import { toast } from 'sonner';
import { use } from 'react';

/**
 * SOP v2 - CLIENT DETAIL PAGE (os-pm)
 *
 * This page shows what the PM needs to EXECUTE for this client
 * based on their subscription via m-ops-services.
 *
 * Key displays:
 * - Service Package (A/B/C/D) and what's included
 * - Hours per week allocation
 * - Active projects
 * - Tasks to complete
 * - Support level & response time
 */

interface ClientSubscription {
  id: string;
  packageTier: 'PACKAGE_A' | 'PACKAGE_B' | 'PACKAGE_C' | 'PACKAGE_D';
  monthlyPrice: number;
  hoursPerWeek: string;
  maxConcurrentProjects: string;
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
  startDate: string;
  supportLevel: string;
  responseTime: number;
  includesPermitMgmt: boolean;
  includesSiteVisits: boolean;
  siteVisitsPerMonth: number;
  marketplaceFeeWaiver: boolean;
}

interface ClientData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  status: 'ACTIVE' | 'INACTIVE';
  subscription?: ClientSubscription;
  projects: Array<{
    id: string;
    name: string;
    status: string;
    address?: string;
  }>;
  openTasks: number;
  hoursUsedThisWeek: number;
}

const PACKAGE_DETAILS = {
  PACKAGE_A: {
    name: 'Package A - Starter',
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    hours: '5-10 hrs/week',
    projects: '1 concurrent',
    features: ['Weekly progress reports', 'Basic task tracking', 'Contractor coordination', 'Budget monitoring']
  },
  PACKAGE_B: {
    name: 'Package B - Professional',
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    hours: '15-20 hrs/week',
    projects: 'Up to 3',
    features: ['Bi-weekly reports', 'Advanced tracking', 'Full coordination', 'Risk management']
  },
  PACKAGE_C: {
    name: 'Package C - Premium',
    color: 'bg-purple-100 text-purple-700 border-purple-300',
    hours: '30-40 hrs/week',
    projects: 'Unlimited',
    features: ['Daily reports with photos', 'Dedicated PM', 'Permit management', 'Site visits', 'Premium support']
  },
  PACKAGE_D: {
    name: 'Package D - Enterprise',
    color: 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border-amber-400',
    hours: '40+ hrs/week',
    projects: 'Portfolio',
    features: ['White-glove service', 'We hire contractors', 'We handle payments', 'Complete hands-off']
  }
};

export default function ClientDetailPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = use(params);
  const [client, setClient] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In production, this would fetch from the API
    // For now, using mock data to demonstrate the UI
    const mockClient: ClientData = {
      id: clientId,
      name: 'Johnson Family Renovation',
      email: 'mjohnson@email.com',
      phone: '(555) 123-4567',
      address: '123 Oak Street, Arlington, VA 22201',
      status: 'ACTIVE',
      subscription: {
        id: 'sub_1234',
        packageTier: 'PACKAGE_C',
        monthlyPrice: 9500,
        hoursPerWeek: '30-40',
        maxConcurrentProjects: 'Unlimited',
        status: 'ACTIVE',
        startDate: '2026-01-01',
        supportLevel: '24/7 Priority',
        responseTime: 4,
        includesPermitMgmt: true,
        includesSiteVisits: true,
        siteVisitsPerMonth: 4,
        marketplaceFeeWaiver: true
      },
      projects: [
        { id: 'proj_1', name: 'Kitchen Remodel', status: 'IN_PROGRESS', address: '123 Oak Street' },
        { id: 'proj_2', name: 'Basement Finish', status: 'PLANNING', address: '123 Oak Street' }
      ],
      openTasks: 12,
      hoursUsedThisWeek: 28
    };

    setTimeout(() => {
      setClient(mockClient);
      setLoading(false);
    }, 500);
  }, [clientId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
        <h2 className="text-xl font-bold text-gray-900">Client not found</h2>
      </div>
    );
  }

  const packageInfo = client.subscription ? PACKAGE_DETAILS[client.subscription.packageTier] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center text-white text-xl font-bold">
              {client.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                client.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              }`}>
                <CheckCircle2 size={12} />
                {client.status}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Link
            href={`/clients/${clientId}/projects`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Folder size={18} />
            View Projects
          </Link>
        </div>
      </div>

      {/* Service Subscription Card - CRITICAL SOP v2 ELEMENT */}
      {client.subscription && packageInfo && (
        <div className={`rounded-2xl border-2 p-6 ${packageInfo.color}`}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Package size={24} />
                <h2 className="text-xl font-bold">{packageInfo.name}</h2>
                {client.subscription.packageTier === 'PACKAGE_C' && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-white/50 rounded-full text-xs font-semibold">
                    <Star size={12} fill="currentColor" />
                    Most Popular
                  </span>
                )}
              </div>
              <p className="text-sm opacity-80">
                Subscribed via m-ops-services • Active since {new Date(client.subscription.startDate).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">${client.subscription.monthlyPrice.toLocaleString()}</div>
              <div className="text-sm opacity-80">per month</div>
            </div>
          </div>

          {/* Service Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-current/20">
            <div>
              <div className="flex items-center gap-2 text-sm opacity-70 mb-1">
                <Clock size={14} />
                Hours This Week
              </div>
              <div className="text-2xl font-bold">
                {client.hoursUsedThisWeek} / {client.subscription.hoursPerWeek.split('-')[1] || '40'}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm opacity-70 mb-1">
                <Folder size={14} />
                Projects
              </div>
              <div className="text-2xl font-bold">
                {client.projects.length} / {client.subscription.maxConcurrentProjects}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm opacity-70 mb-1">
                <Zap size={14} />
                Response Time
              </div>
              <div className="text-2xl font-bold">
                {client.subscription.responseTime}h
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm opacity-70 mb-1">
                <CheckCircle2 size={14} />
                Open Tasks
              </div>
              <div className="text-2xl font-bold">
                {client.openTasks}
              </div>
            </div>
          </div>

          {/* Included Features */}
          <div className="mt-4 pt-4 border-t border-current/20">
            <h3 className="text-sm font-semibold mb-2">What You Need to Deliver:</h3>
            <div className="flex flex-wrap gap-2">
              {packageInfo.features.map((feature) => (
                <span key={feature} className="px-2 py-1 bg-white/30 rounded-full text-xs font-medium">
                  {feature}
                </span>
              ))}
              {client.subscription.includesPermitMgmt && (
                <span className="px-2 py-1 bg-green-200/50 rounded-full text-xs font-medium text-green-800">
                  + Permit Management
                </span>
              )}
              {client.subscription.includesSiteVisits && (
                <span className="px-2 py-1 bg-green-200/50 rounded-full text-xs font-medium text-green-800">
                  + {client.subscription.siteVisitsPerMonth} Site Visits/mo
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contact & Projects Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Contact Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Contact Information</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-gray-600">
              <Mail size={18} className="text-gray-400" />
              <a href={`mailto:${client.email}`} className="hover:text-blue-600">{client.email}</a>
            </div>
            {client.phone && (
              <div className="flex items-center gap-3 text-gray-600">
                <Phone size={18} className="text-gray-400" />
                <a href={`tel:${client.phone}`} className="hover:text-blue-600">{client.phone}</a>
              </div>
            )}
            {client.address && (
              <div className="flex items-start gap-3 text-gray-600">
                <MapPin size={18} className="text-gray-400 mt-0.5" />
                <span>{client.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Active Projects */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Active Projects</h3>
            <Link href={`/clients/${clientId}/projects`} className="text-blue-600 text-sm hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {client.projects.map((project) => (
              <Link
                key={project.id}
                href={`/clients/${clientId}/projects/${project.id}`}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
              >
                <div>
                  <div className="font-medium text-gray-900 group-hover:text-blue-600">{project.name}</div>
                  {project.address && (
                    <div className="text-sm text-gray-500">{project.address}</div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    project.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                    project.status === 'PLANNING' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {project.status.replace('_', ' ')}
                  </span>
                  <ArrowRight size={18} className="text-gray-400 group-hover:text-blue-600" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* SOP Reminder */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-amber-600 mt-0.5" size={20} />
          <div>
            <h4 className="font-semibold text-amber-800">SOP v2 Reminder</h4>
            <p className="text-sm text-amber-700 mt-1">
              You are executing the {packageInfo?.name.split(' - ')[1]} service that this client purchased via m-ops-services.
              Ensure you deliver all included features within the allocated hours.
              All financial transactions are processed through Kealee Platform.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
