'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Home,
  BarChart3,
  FileCheck,
  BookOpen,
  Download,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  ArrowRight,
  MapPin,
  Layers,
  PieChart,
  Calendar,
} from 'lucide-react';

const brand = {
  navy: '#1A2B4A',
  teal: '#0D9488',
  orange: '#C8882A',
  green: '#059669',
};

// Mock dashboard data
const metrics = [
  { label: 'Total Housing Units', value: '1,247', change: '+12%', icon: Home, color: brand.navy },
  { label: 'Active Projects', value: '43', change: '+8%', icon: Building2, color: brand.teal },
  { label: 'Permits This Quarter', value: '89', change: '+15%', icon: FileCheck, color: brand.green },
  { label: 'Pattern Book Adoptions', value: '28', change: '+42%', icon: BookOpen, color: brand.orange },
];

const pipelineStages = [
  { stage: 'Pre-Development', projects: 12, units: 186, color: '#6366F1' },
  { stage: 'Entitlement', projects: 8, units: 124, color: brand.teal },
  { stage: 'Permitting', projects: 9, units: 148, color: brand.orange },
  { stage: 'Under Construction', projects: 10, units: 512, color: brand.green },
  { stage: 'Completed', projects: 4, units: 277, color: brand.navy },
];

const recentActivity = [
  { project: 'Elm Street Fourplex', action: 'Permit approved', date: '2 hours ago', type: 'permit' },
  { project: 'Oak Avenue Townhomes', action: 'Pattern book selected', date: '1 day ago', type: 'pattern' },
  { project: 'Main St Mixed-Use', action: 'Moved to construction', date: '2 days ago', type: 'stage' },
  { project: 'Cedar Lane ADU Program', action: 'CDBG report generated', date: '3 days ago', type: 'report' },
  { project: 'Maple Court Apartments', action: 'Density bonus approved', date: '5 days ago', type: 'permit' },
];

export default function MunicipalDashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('quarter');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold" style={{ color: brand.navy }}>Kealee</Link>
            <span className="text-gray-300">|</span>
            <span className="text-sm font-medium" style={{ color: brand.navy }}>Municipal Housing Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(['month', 'quarter', 'year'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setSelectedPeriod(p)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition capitalize ${
                    selectedPeriod === p ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <Link
              href="/municipal/reports"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50"
            >
              <Download className="w-4 h-4" /> Export
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="bg-white rounded-xl p-5 border border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${m.color}15` }}>
                    <Icon className="w-5 h-5" style={{ color: m.color }} />
                  </div>
                  <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">{m.change}</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{m.value}</div>
                <div className="text-xs text-gray-500 mt-1">{m.label}</div>
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Pipeline Overview */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg" style={{ color: brand.navy }}>Housing Pipeline</h2>
              <Link href="/municipal/pipeline" className="text-sm font-medium flex items-center gap-1 hover:underline" style={{ color: brand.teal }}>
                View Full Pipeline <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-4">
              {pipelineStages.map((stage) => {
                const maxUnits = Math.max(...pipelineStages.map(s => s.units));
                const width = (stage.units / maxUnits) * 100;
                return (
                  <div key={stage.stage}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{stage.stage}</span>
                      <span className="text-sm text-gray-500">{stage.projects} projects · {stage.units} units</span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${width}%`, backgroundColor: stage.color }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-500">Total in pipeline</span>
              <span className="text-lg font-bold" style={{ color: brand.navy }}>
                {pipelineStages.reduce((s, p) => s + p.units, 0).toLocaleString()} units
              </span>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-bold text-lg mb-6" style={{ color: brand.navy }}>Recent Activity</h2>
            <div className="space-y-4">
              {recentActivity.map((activity, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    activity.type === 'permit' ? 'bg-green-500' :
                    activity.type === 'pattern' ? 'bg-orange-500' :
                    activity.type === 'stage' ? 'bg-blue-500' : 'bg-gray-400'
                  }`} />
                  <div>
                    <p className="text-sm text-gray-900 font-medium">{activity.project}</p>
                    <p className="text-xs text-gray-500">{activity.action} · {activity.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {[
            { icon: Layers, title: 'Pipeline Kanban', desc: 'Manage project stages', href: '/municipal/pipeline', color: brand.teal },
            { icon: BarChart3, title: 'Analytics', desc: 'Permit trends & production', href: '/municipal/analytics', color: brand.navy },
            { icon: BookOpen, title: 'Pattern Books', desc: 'Adoption tracking', href: '/municipal/pattern-books', color: brand.orange },
            { icon: Download, title: 'CDBG Reports', desc: 'Generate HUD reports', href: '/municipal/reports', color: brand.green },
          ].map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.title}
                href={link.href}
                className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md hover:border-teal-300 transition group"
              >
                <Icon className="w-6 h-6 mb-3 group-hover:scale-110 transition" style={{ color: link.color }} />
                <h3 className="font-bold text-sm text-gray-900">{link.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{link.desc}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
