'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, Plus, Search, Filter, Clock, CheckCircle, AlertCircle, ArrowRight, Calendar, DollarSign, RefreshCw } from 'lucide-react';
import { getProjects, type ProjectInfo } from '../../lib/client-api';

interface Project {
  id: string;
  name: string;
  address: string;
  status: 'active' | 'completed' | 'on_hold' | 'planning' | string;
  progress: number;
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  contractor: string;
}

/**
 * Maps a backend ProjectInfo record into the shape the UI expects.
 * Derives address from the nested property, and maps known status strings
 * (DRAFT, READINESS, CONTRACTING, ACTIVE, CLOSEOUT, COMPLETED, CANCELLED)
 * into the display buckets the page already understands.
 */
function toUIProject(p: ProjectInfo): Project {
  const address = p.property
    ? `${p.property.address}, ${p.property.city}, ${p.property.state}`
    : '';

  // Map backend status to UI status
  const statusMap: Record<string, string> = {
    DRAFT: 'planning',
    READINESS: 'planning',
    CONTRACTING: 'planning',
    ACTIVE: 'active',
    CLOSEOUT: 'active',
    COMPLETED: 'completed',
    CANCELLED: 'on_hold',
  };

  const status = statusMap[p.status ?? ''] ?? 'planning';

  // Find a contractor member if present
  const contractor = p.memberships?.find(m => m.role === 'CONTRACTOR')?.user?.name ?? '';

  return {
    id: p.id,
    name: p.name,
    address,
    status: status as Project['status'],
    progress: p.percentComplete ?? 0,
    budget: p.budgetTotal ?? 0,
    spent: p.budgetSpent ?? 0,
    startDate: p.startDate ?? '',
    endDate: p.endDate ?? '',
    contractor,
  };
}

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    setLoading(true);
    setError(null);
    try {
      const data = await getProjects();
      setProjects((data.projects ?? []).map(toUIProject));
    } catch (err: any) {
      console.error('Failed to fetch projects:', err);
      setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-700';
      case 'planning':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'completed':
        return 'Completed';
      case 'on_hold':
        return 'On Hold';
      case 'planning':
        return 'Planning';
      default:
        return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const filteredProjects = projects
    .filter(p => statusFilter === 'all' || p.status === statusFilter)
    .filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
              <p className="text-gray-600">Track all your projects in one place</p>
            </div>
          </div>
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
              <p className="text-gray-500">Loading your projects...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
              <p className="text-gray-600">Track all your projects in one place</p>
            </div>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition"
            >
              <Plus size={20} />
              New Project
            </Link>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <AlertCircle className="text-red-400 mx-auto mb-4" size={48} />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Unable to load projects</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={fetchProjects}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition"
            >
              <RefreshCw size={20} />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
            <p className="text-gray-600">Track all your projects in one place</p>
          </div>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition"
          >
            <Plus size={20} />
            New Project
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'active', 'planning', 'completed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition capitalize ${
                    statusFilter === status
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'All' : getStatusLabel(status)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Projects List */}
        {filteredProjects.length > 0 ? (
          <div className="space-y-4">
            {filteredProjects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="block bg-white rounded-xl shadow-sm hover:shadow-lg transition group"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">

                    {/* Project Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Building2 className="text-indigo-600" size={24} />
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition">
                          {project.name}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                          {getStatusLabel(project.status)}
                        </span>
                      </div>
                      {project.address && (
                        <p className="text-gray-600 mb-3">{project.address}</p>
                      )}

                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        {(project.startDate || project.endDate) && (
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {formatDate(project.startDate)}
                            {project.endDate ? ` - ${formatDate(project.endDate)}` : ''}
                          </span>
                        )}
                        {project.budget > 0 && (
                          <span className="flex items-center gap-1">
                            <DollarSign size={14} />
                            {formatCurrency(project.budget)} budget
                          </span>
                        )}
                        {project.contractor && (
                          <span>Contractor: {project.contractor}</span>
                        )}
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="lg:w-48">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Progress</span>
                        <span className="text-sm font-bold text-gray-900">{project.progress}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full transition-all"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      {project.budget > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {formatCurrency(project.spent)} of {formatCurrency(project.budget)} spent
                        </p>
                      )}
                    </div>

                    <ArrowRight className="text-gray-400 group-hover:text-indigo-600 transition hidden lg:block" size={24} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Building2 className="text-gray-300 mx-auto mb-4" size={64} />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'Get started by creating your first project.'}
            </p>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition"
            >
              <Plus size={20} />
              Create Project
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
