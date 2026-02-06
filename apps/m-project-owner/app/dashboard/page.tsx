'use client';

import { useState, useEffect } from 'react';
import { Plus, FolderOpen, Calendar, DollarSign, Users, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@kealee/ui';
import PreConPipeline from '../../components/PreConPipeline';

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

export default function DashboardPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [preconData, setPreconData] = useState<PreConDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch projects and precon dashboard data
      // In production, these would be real API calls
      setProjects([]);

      // Mock precon data for demo
      setPreconData({
        totalProjects: 0,
        activeProjects: 0,
        pipeline: {
          intake: 0,
          design: 0,
          approved: 0,
          marketplace: 0,
          awarded: 0,
          completed: 0,
        },
        pendingFees: { count: 0, total: 0 },
        recentProjects: [],
      });

      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const hasPreconProjects = preconData && preconData.totalProjects > 0;
  const hasProjects = projects.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-500">Manage your construction projects</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Pre-Con CTA - Primary action */}
              <Link
                href="/precon/new"
                className="
                  flex items-center gap-2
                  px-5 py-2.5
                  bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700
                  text-white font-semibold
                  rounded-lg
                  shadow-md hover:shadow-lg
                  transition-all duration-200
                "
              >
                <Sparkles size={18} />
                Start Pre-Con Project
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Pre-Con Projects</p>
            <p className="text-3xl font-bold text-gray-900">{preconData?.totalProjects || 0}</p>
            <p className="text-xs text-gray-400 mt-1">{preconData?.activeProjects || 0} active</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Active Projects</p>
            <p className="text-3xl font-bold text-gray-900">{projects.length}</p>
            <p className="text-xs text-gray-400 mt-1">In construction</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Awaiting Bids</p>
            <p className="text-3xl font-bold text-gray-900">{preconData?.pipeline.marketplace || 0}</p>
            <p className="text-xs text-gray-400 mt-1">In marketplace</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Completed</p>
            <p className="text-3xl font-bold text-gray-900">{preconData?.pipeline.completed || 0}</p>
            <p className="text-xs text-gray-400 mt-1">All time</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Pre-Con Pipeline Widget */}
            {preconData && (
              <PreConPipeline
                pipeline={preconData.pipeline}
                recentProjects={preconData.recentProjects}
                pendingFees={preconData.pendingFees}
              />
            )}

            {/* Active Projects */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Active Construction Projects</h2>
                <Link href="/projects" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                  View All →
                </Link>
              </div>
              <div className="p-6">
                {hasProjects ? (
                  <div className="grid gap-4">
                    {projects.slice(0, 3).map((project) => (
                      <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
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
                    <p className="text-gray-500 mb-4">No active construction projects</p>
                    <p className="text-sm text-gray-400">
                      Start with a pre-con project to get designs and contractor bids.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Getting Started Guide */}
            {!hasPreconProjects && !hasProjects && (
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
                <h3 className="font-semibold text-lg mb-3">Getting Started</h3>
                <p className="text-indigo-100 text-sm mb-4">
                  Create a pre-construction project to get professional designs and competitive contractor bids.
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">1</div>
                    <div>
                      <p className="font-medium">Submit Project Details</p>
                      <p className="text-xs text-indigo-200">Tell us about your project vision</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">2</div>
                    <div>
                      <p className="font-medium">Review Design Concepts</p>
                      <p className="text-xs text-indigo-200">Choose from professional designs</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">3</div>
                    <div>
                      <p className="font-medium">Get Contractor Bids</p>
                      <p className="text-xs text-indigo-200">Qualified contractors compete for your project</p>
                    </div>
                  </div>
                </div>
                <Link
                  href="/precon/new"
                  className="mt-6 w-full py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles size={18} />
                  Start Your Project
                </Link>
              </div>
            )}

            {/* Pending Fees Alert */}
            {preconData && preconData.pendingFees.count > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <h3 className="font-semibold text-amber-800">Pending Payments</h3>
                    <p className="text-sm text-amber-700 mt-1">
                      You have {preconData.pendingFees.count} pending design package fee{preconData.pendingFees.count !== 1 ? 's' : ''}.
                    </p>
                    <Link
                      href="/precon?filter=pending_payment"
                      className="mt-3 inline-flex items-center text-sm font-medium text-amber-800 hover:text-amber-900"
                    >
                      Pay Now →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Fee Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Transparent Pricing</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Design Package</span>
                  <span className="font-medium text-gray-900">$199 - $999</span>
                </div>
                <p className="text-xs text-gray-500 pt-2">
                  All applicable fees are displayed at checkout for complete transparency.
                </p>
              </div>
              <Link
                href="/precon/fee-info"
                className="mt-4 text-indigo-600 hover:text-indigo-700 text-sm font-medium inline-flex items-center"
              >
                Learn more about pricing →
              </Link>
            </div>

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
