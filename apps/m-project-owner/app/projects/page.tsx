'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building2, Plus, Search, Filter, Clock, CheckCircle, AlertCircle, ArrowRight, Calendar, DollarSign } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  address: string;
  status: 'active' | 'completed' | 'on_hold' | 'planning';
  progress: number;
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  contractor: string;
}

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const projects: Project[] = [
    {
      id: '1',
      name: 'Home Renovation - Kitchen & Bath',
      address: '1234 Oak Street, Washington, DC',
      status: 'active',
      progress: 65,
      budget: 150000,
      spent: 97500,
      startDate: '2024-10-15',
      endDate: '2025-03-01',
      contractor: 'ABC Construction',
    },
    {
      id: '2',
      name: 'Basement Finishing',
      address: '1234 Oak Street, Washington, DC',
      status: 'planning',
      progress: 10,
      budget: 75000,
      spent: 7500,
      startDate: '2025-04-01',
      endDate: '2025-07-01',
      contractor: 'ABC Construction',
    },
    {
      id: '3',
      name: 'Deck Addition',
      address: '5678 Maple Ave, Arlington, VA',
      status: 'completed',
      progress: 100,
      budget: 45000,
      spent: 43200,
      startDate: '2024-06-01',
      endDate: '2024-09-15',
      contractor: 'XYZ Builders',
    },
  ];

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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
            <p className="text-gray-600">Track all your construction projects in one place</p>
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
                      <p className="text-gray-600 mb-3">{project.address}</p>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {formatDate(project.startDate)} - {formatDate(project.endDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign size={14} />
                          {formatCurrency(project.budget)} budget
                        </span>
                        <span>Contractor: {project.contractor}</span>
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
                      <p className="text-xs text-gray-500 mt-1">
                        {formatCurrency(project.spent)} of {formatCurrency(project.budget)} spent
                      </p>
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
