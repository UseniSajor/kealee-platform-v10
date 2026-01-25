'use client';

import { useState, useEffect } from 'react';
import { Plus, FolderOpen, Calendar, DollarSign, Users, ArrowRight, Building2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { api, type ProjectSummary } from '@/lib/api';

// Extended project type with additional fields for display
interface ProjectDisplay extends ProjectSummary {
  status?: string;
  budgetTotal?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  contractorCount?: number;
  completionPercentage?: number;
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<ProjectDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Calculate stats from projects
  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'ACTIVE' || p.status === 'CONTRACTING' || p.status === 'READINESS').length,
    completedProjects: projects.filter(p => p.status === 'COMPLETED').length,
    totalBudget: projects.reduce((sum, p) => sum + (p.budgetTotal || 0), 0),
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">Welcome back! Here's an overview of your projects.</p>
            </div>

            <Link
              href="/projects/new"
              className="
                flex items-center gap-2
                px-5 py-2.5
                bg-blue-600 hover:bg-blue-700
                text-white font-semibold text-sm
                rounded-lg
                shadow-md hover:shadow-lg
                transition-all duration-200
                active:scale-[0.98]
              "
            >
              <Plus size={18} />
              New Project
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {error ? (
          <ErrorState message={error} onRetry={fetchProjects} />
        ) : projects.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Projects"
                value={stats.totalProjects}
                icon={<Building2 size={24} />}
                variant="default"
              />
              <StatCard
                title="Active Projects"
                value={stats.activeProjects}
                icon={<Clock size={24} />}
                variant="gradient"
                iconColor="text-amber-600"
                iconBg="bg-amber-50"
              />
              <StatCard
                title="Completed"
                value={stats.completedProjects}
                icon={<CheckCircle size={24} />}
                iconColor="text-emerald-600"
                iconBg="bg-emerald-50"
              />
              <StatCard
                title="Total Budget"
                value={`$${(stats.totalBudget / 1000).toFixed(0)}K`}
                icon={<DollarSign size={24} />}
                iconColor="text-blue-600"
                iconBg="bg-blue-50"
              />
            </div>

            {/* Projects Section */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Your Projects</h2>
              <Link
                href="/projects"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                View all <ArrowRight size={16} />
              </Link>
            </div>

            <ProjectList projects={projects} />
          </>
        )}
      </main>
    </div>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  icon,
  variant = 'default',
  iconColor = 'text-blue-600',
  iconBg = 'bg-blue-50'
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  variant?: 'default' | 'gradient';
  iconColor?: string;
  iconBg?: string;
}) {
  return (
    <div className={`
      rounded-xl p-6 transition-all duration-200 hover:shadow-md
      ${variant === 'gradient'
        ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100'
        : 'bg-white border border-gray-200 shadow-sm'
      }
    `}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 tracking-tight">
            {value}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${iconBg} ${iconColor}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// Dashboard Skeleton
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-48 bg-gray-100 rounded mt-2 animate-pulse" />
            </div>
            <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
      </header>
      <main className="container mx-auto px-6 py-8">
        {/* Stats skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  <div className="h-8 w-16 bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="h-12 w-12 bg-gray-200 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
        {/* Projects skeleton */}
        <div className="h-6 w-32 bg-gray-200 rounded mb-6 animate-pulse" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="space-y-4">
                <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse" />
                <div className="flex gap-4 pt-2">
                  <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

// Error State
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="max-w-md mx-auto text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
        <AlertCircle className="text-red-600" size={32} />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to load projects</h2>
      <p className="text-gray-600 mb-6">{message}</p>
      <button
        onClick={onRetry}
        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}

// Empty State
function EmptyState() {
  return (
    <div className="max-w-2xl mx-auto text-center py-12">
      <div className="w-32 h-32 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
        <FolderOpen className="text-blue-600" size={64} />
      </div>

      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        Start Your First Project
      </h2>

      <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
        Track milestones, manage contractors, and approve payments all in one place.
        Creating a project takes less than 2 minutes.
      </p>

      <Link
        href="/projects/new"
        className="
          inline-flex items-center gap-2
          px-8 py-4
          bg-blue-600 hover:bg-blue-700
          text-white text-lg font-semibold
          rounded-lg
          shadow-lg hover:shadow-xl
          transition-all duration-200
          active:scale-[0.98]
        "
      >
        <Plus size={24} />
        Create Your First Project
      </Link>

      <p className="mt-6 text-sm text-gray-500">
        Join 500+ project owners using Kealee
      </p>
    </div>
  );
}

// Project List
function ProjectList({ projects }: { projects: ProjectDisplay[] }) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-100 text-emerald-700';
      case 'COMPLETED': return 'bg-blue-100 text-blue-700';
      case 'READINESS': return 'bg-amber-100 text-amber-700';
      case 'CONTRACTING': return 'bg-purple-100 text-purple-700';
      case 'DRAFT': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      KITCHEN: 'Kitchen Remodel',
      BATHROOM: 'Bathroom Remodel',
      ADDITION: 'Home Addition',
      NEW_CONSTRUCTION: 'New Construction',
      RENOVATION: 'Renovation',
      OTHER: 'Other',
    };
    return labels[category] || category;
  };

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <Link
          key={project.id}
          href={`/projects/${project.id}`}
          className="
            bg-white rounded-xl border-2 border-gray-200 p-6
            hover:border-blue-500 hover:shadow-lg
            transition-all duration-200
            cursor-pointer
            group
          "
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {project.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{getCategoryLabel(project.category)}</p>
              </div>
              {project.status && (
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
              )}
            </div>

            {project.description && (
              <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
            )}

            <div className="flex items-center gap-4 text-sm text-gray-500 pt-2 border-t border-gray-100">
              {project.budgetTotal && (
                <div className="flex items-center gap-1.5">
                  <DollarSign size={16} className="text-gray-400" />
                  <span>${project.budgetTotal.toLocaleString()}</span>
                </div>
              )}
              {project.startDate && (
                <div className="flex items-center gap-1.5">
                  <Calendar size={16} className="text-gray-400" />
                  <span>{new Date(project.startDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              {project.contractorCount !== undefined && (
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Users size={16} className="text-gray-400" />
                  <span>{project.contractorCount} contractor{project.contractorCount !== 1 ? 's' : ''}</span>
                </div>
              )}
              <span className="text-blue-600 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                View <ArrowRight size={14} />
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
