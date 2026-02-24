'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  FolderOpen,
  Calendar,
  DollarSign,
  Users,
  Sparkles,
  ArrowRight,
  Bot,
  CheckCircle2,
  AlertCircle,
  Building2,
  Home,
  Layers,
  TrendingUp,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { Card } from '@kealee/ui';
import PreConPipeline from '@owner/components/PreConPipeline';
import { getClawsHealth, type ClawSystemHealth } from '@owner/lib/claws';
import { useOwnerProfile, type OwnerRole } from '@owner/lib/user-context';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PreConDashboardData {
  totalProjects: number;
  activeProjects: number;
  pipeline: {
    intake: number;
    design: number;
    approved: number;
    marketplace: number;
    awarded: number;
    completed: number;
  };
  pendingFees: {
    count: number;
    total: number;
  };
  recentProjects: any[];
}

interface MultifamilyStats {
  totalUnits: number;
  completedUnits: number;
  inProgressUnits: number;
  loanAmount: number;
  drawnToDate: number;
  activePhases: number;
  nextDraw: string | null;
}

// ---------------------------------------------------------------------------
// Role-specific dashboard titles
// ---------------------------------------------------------------------------

const ROLE_TITLES: Record<OwnerRole, { title: string; subtitle: string }> = {
  homeowner: {
    title: 'My Home Project',
    subtitle: 'Track your home construction or remodel',
  },
  developer: {
    title: 'Developer Dashboard',
    subtitle: 'Portfolio overview, draws, and project analytics',
  },
  property_manager: {
    title: 'Property Dashboard',
    subtitle: 'Unit tracking, maintenance, and reports',
  },
  business_owner: {
    title: 'Project Dashboard',
    subtitle: 'Manage your commercial build-out',
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const {
    profile,
    loading: profileLoading,
    isMultifamily,
    isHomeowner,
    isDeveloper,
    isPropertyManager,
  } = useOwnerProfile();

  const [projects, setProjects] = useState<any[]>([]);
  const [preconData, setPreconData] = useState<PreConDashboardData | null>(null);
  const [mfStats, setMfStats] = useState<MultifamilyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [clawsHealth, setClawsHealth] = useState<ClawSystemHealth | null>(null);

  useEffect(() => {
    fetchData();
    fetchClawsHealth();
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchClawsHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchClawsHealth = async () => {
    try {
      const health = await getClawsHealth();
      setClawsHealth(health);
    } catch {
      setClawsHealth({
        status: 'degraded',
        claws: [],
        eventBus: 'disconnected',
        totalClaws: 8,
        onlineClaws: 0,
      });
    }
  };

  const fetchData = async () => {
    try {
      setProjects([]);
      setPreconData({
        totalProjects: 0,
        activeProjects: 0,
        pipeline: { intake: 0, design: 0, approved: 0, marketplace: 0, awarded: 0, completed: 0 },
        pendingFees: { count: 0, total: 0 },
        recentProjects: [],
      });
      // Multifamily stats (would be fetched from API in production)
      setMfStats({
        totalUnits: 0,
        completedUnits: 0,
        inProgressUnits: 0,
        loanAmount: 0,
        drawnToDate: 0,
        activePhases: 0,
        nextDraw: null,
      });
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setIsLoading(false);
    }
  };

  if (isLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const role = profile?.role || 'homeowner';
  const headerInfo = ROLE_TITLES[role] || ROLE_TITLES.homeowner;
  const hasPreconProjects = preconData && preconData.totalProjects > 0;
  const hasProjects = projects.length > 0;

  function formatCurrency(cents: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{headerInfo.title}</h1>
              <p className="text-sm text-gray-500">{headerInfo.subtitle}</p>
            </div>

            <div className="flex items-center gap-3">
              {/* CLAW Status Indicator */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                  clawsHealth?.status === 'ok'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : clawsHealth?.status === 'degraded'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-gray-50 text-gray-500 border border-gray-200'
                }`}
              >
                <Bot size={14} />
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    clawsHealth?.status === 'ok'
                      ? 'bg-green-500 animate-pulse'
                      : clawsHealth?.status === 'degraded'
                      ? 'bg-amber-500'
                      : 'bg-gray-400'
                  }`}
                />
                {clawsHealth?.status === 'ok'
                  ? `${clawsHealth.onlineClaws}/8 CLAWs`
                  : clawsHealth?.status === 'degraded'
                  ? 'CLAWs Starting'
                  : 'CLAWs'}
              </div>

              {/* CTA — role-specific */}
              {isHomeowner ? (
                <Link
                  href="/owner/precon/new"
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Sparkles size={18} />
                  Start Pre-Con Project
                </Link>
              ) : (
                <Link
                  href="/owner/projects/new"
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Plus size={18} />
                  New Project
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* ----------------------------------------------------------------- */}
        {/* Quick Stats — changes by role + project type                       */}
        {/* ----------------------------------------------------------------- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {/* Common stats: all roles see these */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">
              {isHomeowner ? 'My Projects' : 'Total Projects'}
            </p>
            <p className="text-3xl font-bold text-gray-900">{preconData?.totalProjects || 0}</p>
            <p className="text-xs text-gray-400 mt-1">{preconData?.activeProjects || 0} active</p>
          </div>

          {/* Homeowner: simpler stats */}
          {isHomeowner && (
            <>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500 mb-1">Awaiting Bids</p>
                <p className="text-3xl font-bold text-gray-900">
                  {preconData?.pipeline.marketplace || 0}
                </p>
                <p className="text-xs text-gray-400 mt-1">In marketplace</p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500 mb-1">Approvals Due</p>
                <p className="text-3xl font-bold text-amber-600">0</p>
                <p className="text-xs text-gray-400 mt-1">Action required</p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500 mb-1">Completed</p>
                <p className="text-3xl font-bold text-gray-900">
                  {preconData?.pipeline.completed || 0}
                </p>
                <p className="text-xs text-gray-400 mt-1">All time</p>
              </div>
            </>
          )}

          {/* Developer / Business Owner: portfolio stats */}
          {(isDeveloper || role === 'business_owner') && !isMultifamily && (
            <>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500 mb-1">Active Projects</p>
                <p className="text-3xl font-bold text-gray-900">{projects.length}</p>
                <p className="text-xs text-gray-400 mt-1">In progress</p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500 mb-1">Pending Draws</p>
                <p className="text-3xl font-bold text-amber-600">0</p>
                <p className="text-xs text-gray-400 mt-1">Awaiting review</p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500 mb-1">Completed</p>
                <p className="text-3xl font-bold text-green-600">
                  {preconData?.pipeline.completed || 0}
                </p>
                <p className="text-xs text-gray-400 mt-1">All time</p>
              </div>
            </>
          )}

          {/* Developer / Property Manager with Multifamily: unit + draw stats */}
          {isMultifamily && (
            <>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                  <Building2 size={14} />
                  Units
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {mfStats?.totalUnits || 0}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {mfStats?.completedUnits || 0} complete
                </p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                  <DollarSign size={14} />
                  Drawn to Date
                </div>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(mfStats?.drawnToDate || 0)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  of {formatCurrency(mfStats?.loanAmount || 0)}
                </p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                  <Layers size={14} />
                  Active Phases
                </div>
                <p className="text-3xl font-bold text-blue-600">
                  {mfStats?.activePhases || 0}
                </p>
                <p className="text-xs text-gray-400 mt-1">In progress</p>
              </div>
            </>
          )}

          {/* Property Manager (non-multifamily) */}
          {isPropertyManager && !isMultifamily && (
            <>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500 mb-1">Properties</p>
                <p className="text-3xl font-bold text-gray-900">{projects.length}</p>
                <p className="text-xs text-gray-400 mt-1">Under management</p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500 mb-1">Pending Approvals</p>
                <p className="text-3xl font-bold text-amber-600">0</p>
                <p className="text-xs text-gray-400 mt-1">Action required</p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500 mb-1">Reports</p>
                <p className="text-3xl font-bold text-gray-900">0</p>
                <p className="text-xs text-gray-400 mt-1">Available</p>
              </div>
            </>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* ============================================================= */}
            {/* Multifamily Unit Completion Widget — only for multifamily       */}
            {/* ============================================================= */}
            {isMultifamily && mfStats && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Building2 size={20} className="text-blue-600" />
                    Unit Completion
                  </h2>
                  <Link href="/owner/units" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                    View All Units →
                  </Link>
                </div>
                <div className="p-6">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                      <span className="text-sm text-gray-500">
                        {mfStats.completedUnits} / {mfStats.totalUnits} units (
                        {mfStats.totalUnits > 0
                          ? Math.round((mfStats.completedUnits / mfStats.totalUnits) * 100)
                          : 0}
                        %)
                      </span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{
                          width: `${
                            mfStats.totalUnits > 0
                              ? Math.round((mfStats.completedUnits / mfStats.totalUnits) * 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-2xl font-bold text-gray-900">{mfStats.inProgressUnits}</p>
                      <p className="text-xs text-gray-500">In Progress</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-2xl font-bold text-green-700">{mfStats.completedUnits}</p>
                      <p className="text-xs text-gray-500">Complete</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-2xl font-bold text-blue-700">{mfStats.activePhases}</p>
                      <p className="text-xs text-gray-500">Active Phases</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* Lender Draw Progress Widget — only for multifamily              */}
            {/* ============================================================= */}
            {isMultifamily && mfStats && mfStats.loanAmount > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <DollarSign size={20} className="text-green-600" />
                    Loan Draw Progress
                  </h2>
                  <Link href="/owner/draws" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                    View Draws →
                  </Link>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Drawn to Date</span>
                    <span className="text-sm text-gray-500">
                      {formatCurrency(mfStats.drawnToDate)} of {formatCurrency(mfStats.loanAmount)} (
                      {Math.round((mfStats.drawnToDate / mfStats.loanAmount) * 100)}%)
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round((mfStats.drawnToDate / mfStats.loanAmount) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                  {mfStats.nextDraw && (
                    <p className="text-xs text-gray-500 mt-3">
                      Next draw scheduled: {mfStats.nextDraw}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Pre-Con Pipeline Widget — all roles except property manager */}
            {!isPropertyManager && preconData && (
              <PreConPipeline
                pipeline={preconData.pipeline}
                recentProjects={preconData.recentProjects}
                pendingFees={preconData.pendingFees}
              />
            )}

            {/* Active Projects */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {isHomeowner ? 'My Project' : 'Active Projects'}
                </h2>
                <Link
                  href="/owner/projects"
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  View All →
                </Link>
              </div>
              <div className="p-6">
                {hasProjects ? (
                  <div className="grid gap-4">
                    {projects.slice(0, 3).map((project) => (
                      <Link
                        key={project.id}
                        href={`/owner/projects/${project.id}`}
                        className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all"
                      >
                        <div>
                          <h3 className="font-medium text-gray-900">{project.name}</h3>
                          <p className="text-sm text-gray-500">{project.location}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">{project.budget}</p>
                            <p className="text-xs text-gray-500">{project.timeline}</p>
                          </div>
                          <ArrowRight size={16} className="text-gray-400" />
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <FolderOpen className="text-gray-400" size={32} />
                    </div>
                    <p className="text-gray-500 mb-4">
                      {isHomeowner
                        ? 'No projects yet'
                        : 'No active projects'}
                    </p>
                    <p className="text-sm text-gray-400">
                      {isHomeowner
                        ? 'Start with a pre-con project to get designs and contractor bids.'
                        : 'Create a new project to get started.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Getting Started Guide — homeowners only, when no projects */}
            {isHomeowner && !hasPreconProjects && !hasProjects && (
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
                <h3 className="font-semibold text-lg mb-3">Getting Started</h3>
                <p className="text-indigo-100 text-sm mb-4">
                  Create a pre-con project to get professional designs and competitive contractor
                  bids.
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Submit Project Details</p>
                      <p className="text-xs text-indigo-200">Tell us your vision and goals</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                      2
                    </div>
                    <div>
                      <p className="font-medium">AI Generates Concepts</p>
                      <p className="text-xs text-indigo-200">
                        5 revisions, then pick from 3 finals
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Meet Your Designer</p>
                      <p className="text-xs text-indigo-200">Fine-tune with a real architect</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                      4
                    </div>
                    <div>
                      <p className="font-medium">Architecture & Permits</p>
                      <p className="text-xs text-indigo-200">Full plans, then permit handoff</p>
                    </div>
                  </div>
                </div>
                <Link
                  href="/owner/precon/new"
                  className="mt-6 w-full py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles size={18} />
                  Start Your Project
                </Link>
              </div>
            )}

            {/* Developer Quick Actions — developers & property managers */}
            {(isDeveloper || isPropertyManager) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <Link
                    href="/owner/projects/new"
                    className="w-full flex items-center gap-3 py-2.5 px-4 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 text-sm font-medium"
                  >
                    <Plus size={16} />
                    Create New Project
                  </Link>
                  {isMultifamily && (
                    <>
                      <Link
                        href="/owner/draws"
                        className="w-full flex items-center gap-3 py-2.5 px-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-sm font-medium"
                      >
                        <DollarSign size={16} />
                        Lender Draws
                      </Link>
                      <Link
                        href="/owner/units"
                        className="w-full flex items-center gap-3 py-2.5 px-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-medium"
                      >
                        <Building2 size={16} />
                        Unit Tracker
                      </Link>
                      <Link
                        href="/owner/phasing"
                        className="w-full flex items-center gap-3 py-2.5 px-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 text-sm font-medium"
                      >
                        <Layers size={16} />
                        Area Phasing
                      </Link>
                    </>
                  )}
                  <Link
                    href="/owner/reports"
                    className="w-full flex items-center gap-3 py-2.5 px-4 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 text-sm font-medium"
                  >
                    <FileText size={16} />
                    View Reports
                  </Link>
                </div>
              </div>
            )}

            {/* Pending Fees Alert */}
            {preconData && preconData.pendingFees.count > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-amber-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-amber-800">Pending Payments</h3>
                    <p className="text-sm text-amber-700 mt-1">
                      You have {preconData.pendingFees.count} pending design package fee
                      {preconData.pendingFees.count !== 1 ? 's' : ''}.
                    </p>
                    <Link
                      href="/owner/precon?filter=pending_payment"
                      className="mt-3 inline-flex items-center text-sm font-medium text-amber-800 hover:text-amber-900"
                    >
                      Pay Now →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Phase Pricing Overview — homeowners & business owners */}
            {(isHomeowner || role === 'business_owner') && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-3">Project Phases & Pricing</h3>
                <div className="space-y-3 text-sm">
                  <div className="py-2 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Phase 1: Pre-Con</span>
                      <span className="font-medium text-gray-900">$199 – $999</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      AI concepts, revisions & designer meeting
                    </p>
                  </div>
                  <div className="py-2 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Phase 2: Architecture</span>
                      <span className="font-medium text-gray-900">$2,995 – $9,995</span>
                    </div>
                    <p className="text-xs text-green-600 mt-0.5">
                      Concept fee credited toward this phase
                    </p>
                  </div>
                  <div className="py-2 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Phase 3: Permits</span>
                      <span className="font-medium text-gray-900">$495 – $2,995</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Offered after architecture completes
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 pt-1">
                    Each phase connects seamlessly. All fees shown at checkout.
                  </p>
                </div>
                <Link
                  href="/owner/precon/fee-info"
                  className="mt-4 text-indigo-600 hover:text-indigo-700 text-sm font-medium inline-flex items-center"
                >
                  Learn more about pricing →
                </Link>
              </div>
            )}

            {/* Support Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
              <p className="text-sm text-gray-500 mb-4">
                Our team is available to guide you through the process.
              </p>
              <div className="space-y-2">
                <button className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">
                  Chat with Support
                </button>
                <button className="w-full py-2 px-4 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
                  Schedule a Call
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
