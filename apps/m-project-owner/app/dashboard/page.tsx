'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  FolderOpen,
  Calendar,
  DollarSign,
  Users,
  ArrowRight,
  Building2,
  CheckCircle,
  Clock,
  AlertCircle,
  Shield,
  TrendingUp,
  Bell,
  Search,
  Settings,
  ChevronRight,
  FileText,
  Eye,
  ArrowUpRight,
  Zap,
  Home,
  LogOut,
  User,
  HelpCircle,
} from 'lucide-react';
import Link from 'next/link';
import { api, type ProjectSummary } from '@/lib/api';

interface ProjectDisplay extends ProjectSummary {
  status?: string;
  budgetTotal?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  contractorCount?: number;
  completionPercentage?: number;
  escrowBalance?: number;
  milestonesComplete?: number;
  milestonesTotal?: number;
}

const quickActions = [
  {
    icon: Plus,
    title: 'New Project',
    description: 'Start a new construction project',
    href: '/projects/new',
    gradient: 'from-blue-500 to-blue-600',
  },
  {
    icon: Users,
    title: 'Find Contractors',
    description: 'Browse verified professionals',
    href: '/marketplace',
    gradient: 'from-purple-500 to-purple-600',
  },
  {
    icon: FileText,
    title: 'Documents',
    description: 'View all project documents',
    href: '/documents',
    gradient: 'from-emerald-500 to-emerald-600',
  },
  {
    icon: HelpCircle,
    title: 'Get Help',
    description: 'Contact support team',
    href: '/help',
    gradient: 'from-amber-500 to-orange-500',
  },
];

const recentActivity = [
  {
    type: 'milestone',
    title: 'Milestone Approved',
    description: 'Electrical rough-in completed',
    project: 'Kitchen Renovation',
    time: '2 hours ago',
    icon: CheckCircle,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    type: 'payment',
    title: 'Payment Released',
    description: '$4,500 released to contractor',
    project: 'Kitchen Renovation',
    time: '4 hours ago',
    icon: DollarSign,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    type: 'document',
    title: 'Document Uploaded',
    description: 'Permit approval received',
    project: 'Bathroom Remodel',
    time: '1 day ago',
    icon: FileText,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  {
    type: 'inspection',
    title: 'Inspection Scheduled',
    description: 'Framing inspection on Jan 28',
    project: 'Kitchen Renovation',
    time: '2 days ago',
    icon: Eye,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
];

export default function DashboardPage() {
  const [projects, setProjects] = useState<ProjectDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.listMyProjects();
      setProjects(response.projects || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter(
      (p) => p.status === 'ACTIVE' || p.status === 'CONTRACTING' || p.status === 'READINESS'
    ).length,
    completedProjects: projects.filter((p) => p.status === 'COMPLETED').length,
    totalBudget: projects.reduce((sum, p) => sum + (p.budgetTotal || 0), 0),
    escrowBalance: projects.reduce((sum, p) => sum + (p.escrowBalance || 0), 0),
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Home className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-slate-900">Kealee</span>
                <span className="text-xs font-medium text-slate-500 block -mt-0.5">Project Owner</span>
              </div>
            </Link>

            {/* Search */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search projects, contractors, documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <Bell size={20} className="text-slate-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <Settings size={20} className="text-slate-600" />
              </button>
              <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
              <button className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-slate-100 transition-colors">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                  JD
                </div>
                <span className="hidden sm:block text-sm font-medium text-slate-700">John Doe</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <ErrorState message={error} onRetry={fetchProjects} />
        ) : projects.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-2xl p-8 mb-8 relative overflow-hidden">
              <div className="absolute inset-0">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Welcome back, John!</h1>
                  <p className="text-blue-100">
                    You have {stats.activeProjects} active project{stats.activeProjects !== 1 ? 's' : ''} in progress.
                  </p>
                </div>
                <Link
                  href="/projects/new"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-700 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                >
                  <Plus size={20} />
                  New Project
                </Link>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
              <StatCard
                title="Total Projects"
                value={stats.totalProjects.toString()}
                icon={Building2}
                gradient="from-blue-500 to-blue-600"
                trend="+2 this month"
              />
              <StatCard
                title="Active Projects"
                value={stats.activeProjects.toString()}
                icon={Clock}
                gradient="from-amber-500 to-orange-500"
              />
              <StatCard
                title="Completed"
                value={stats.completedProjects.toString()}
                icon={CheckCircle}
                gradient="from-emerald-500 to-emerald-600"
              />
              <StatCard
                title="Total Budget"
                value={`$${(stats.totalBudget / 1000).toFixed(0)}K`}
                icon={DollarSign}
                gradient="from-purple-500 to-purple-600"
              />
            </div>

            {/* Escrow Status Banner */}
            {stats.escrowBalance > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-8 flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="text-emerald-600" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-emerald-900">Escrow Protected</h3>
                  <p className="text-sm text-emerald-700">
                    ${stats.escrowBalance.toLocaleString()} secured in escrow across your active projects
                  </p>
                </div>
                <Link
                  href="/escrow"
                  className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800"
                >
                  View Details <ArrowRight size={16} />
                </Link>
              </div>
            )}

            {/* Main Grid */}
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Projects Section */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-900">Your Projects</h2>
                  <Link
                    href="/projects"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    View all <ArrowRight size={16} />
                  </Link>
                </div>

                <div className="space-y-4">
                  {projects.slice(0, 4).map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-8">
                {/* Quick Actions */}
                <div>
                  <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {quickActions.map((action, index) => (
                      <Link
                        key={index}
                        href={action.href}
                        className="group p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all"
                      >
                        <div
                          className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-3`}
                        >
                          <action.icon className="text-white" size={20} />
                        </div>
                        <h3 className="font-semibold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                          {action.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">{action.description}</p>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Activity</h2>
                  <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="p-4 flex gap-4">
                        <div
                          className={`w-10 h-10 ${activity.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}
                        >
                          <activity.icon className={activity.iconColor} size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 text-sm">{activity.title}</p>
                          <p className="text-sm text-slate-500 truncate">{activity.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-400">{activity.project}</span>
                            <span className="text-xs text-slate-300">•</span>
                            <span className="text-xs text-slate-400">{activity.time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/activity"
                    className="mt-4 w-full inline-flex items-center justify-center gap-1 py-2.5 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
                  >
                    View All Activity <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  gradient,
  trend,
}: {
  title: string;
  value: string;
  icon: typeof Building2;
  gradient: string;
  trend?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
          <Icon className="text-white" size={24} />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
            <TrendingUp size={12} />
            {trend}
          </div>
        )}
      </div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function ProjectCard({ project }: { project: ProjectDisplay }) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'READINESS':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'CONTRACTING':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const completionPercentage = project.milestonesTotal
    ? Math.round((project.milestonesComplete || 0 / project.milestonesTotal) * 100)
    : project.completionPercentage || 0;

  return (
    <Link
      href={`/projects/${project.id}`}
      className="block bg-white rounded-xl border-2 border-slate-200 p-6 hover:border-blue-400 hover:shadow-xl transition-all group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
            {project.name}
          </h3>
          {project.description && (
            <p className="text-sm text-slate-500 mt-1 line-clamp-1">{project.description}</p>
          )}
        </div>
        {project.status && (
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(project.status)}`}
          >
            {project.status}
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-slate-500">Progress</span>
          <span className="font-semibold text-slate-700">{completionPercentage}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-6 text-sm text-slate-500">
        {project.budgetTotal && (
          <div className="flex items-center gap-1.5">
            <DollarSign size={16} className="text-slate-400" />
            <span>${project.budgetTotal.toLocaleString()}</span>
          </div>
        )}
        {project.milestonesTotal && (
          <div className="flex items-center gap-1.5">
            <CheckCircle size={16} className="text-slate-400" />
            <span>
              {project.milestonesComplete || 0}/{project.milestonesTotal} milestones
            </span>
          </div>
        )}
        {project.contractorCount !== undefined && (
          <div className="flex items-center gap-1.5">
            <Users size={16} className="text-slate-400" />
            <span>
              {project.contractorCount} contractor{project.contractorCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* View Arrow */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-end">
        <span className="text-blue-600 font-medium text-sm flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          View Project <ArrowUpRight size={16} />
        </span>
      </div>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-200 rounded-xl animate-pulse" />
              <div className="h-6 w-20 bg-slate-200 rounded animate-pulse" />
            </div>
            <div className="h-10 w-64 bg-slate-100 rounded-xl animate-pulse hidden md:block" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-200 rounded-lg animate-pulse" />
              <div className="w-10 h-10 bg-slate-200 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-32 bg-slate-200 rounded-2xl mb-8 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="w-12 h-12 bg-slate-200 rounded-xl mb-4 animate-pulse" />
              <div className="h-4 w-20 bg-slate-200 rounded mb-2 animate-pulse" />
              <div className="h-8 w-16 bg-slate-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="max-w-md mx-auto text-center py-16">
      <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
        <AlertCircle className="text-red-600" size={40} />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-3">Unable to load projects</h2>
      <p className="text-slate-600 mb-8">{message}</p>
      <button
        onClick={onRetry}
        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
      >
        Try Again
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="max-w-2xl mx-auto text-center py-16">
      <div className="w-40 h-40 mx-auto mb-8 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center">
        <FolderOpen className="text-blue-600" size={80} />
      </div>

      <h2 className="text-3xl font-bold text-slate-900 mb-4">Start Your First Project</h2>

      <p className="text-lg text-slate-600 mb-10 max-w-md mx-auto">
        Track milestones, manage contractors, and approve payments all in one place. Creating a project takes less
        than 2 minutes.
      </p>

      <Link
        href="/projects/new"
        className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
      >
        <Plus size={24} />
        Create Your First Project
      </Link>

      <p className="mt-8 text-sm text-slate-500">
        <span className="font-medium text-slate-700">500+</span> project owners trust Kealee
      </p>

      {/* Quick Actions for Empty State */}
      <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action, index) => (
          <Link
            key={index}
            href={action.href}
            className="group p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all"
          >
            <div
              className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-3 mx-auto`}
            >
              <action.icon className="text-white" size={20} />
            </div>
            <h3 className="font-semibold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
              {action.title}
            </h3>
          </Link>
        ))}
      </div>
    </div>
  );
}
