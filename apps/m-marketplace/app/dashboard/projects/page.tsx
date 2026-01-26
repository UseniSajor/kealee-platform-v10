'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  FileText,
  ChevronRight,
} from 'lucide-react';

const projects = [
  {
    id: 'proj_1',
    name: 'Kitchen Renovation',
    address: '123 Main Street, San Francisco, CA 94102',
    type: 'Renovation',
    status: 'in_progress',
    progress: 65,
    budget: 45000,
    spent: 29250,
    startDate: '2024-01-15',
    endDate: '2024-03-15',
    contractor: 'Bay Area Renovations',
    nextMilestone: 'Cabinet Installation',
    image: null,
  },
  {
    id: 'proj_2',
    name: 'Master Bathroom Remodel',
    address: '456 Oak Avenue, Oakland, CA 94611',
    type: 'Remodel',
    status: 'in_progress',
    progress: 40,
    budget: 28000,
    spent: 11200,
    startDate: '2024-01-20',
    endDate: '2024-03-30',
    contractor: 'Elite Bath & Kitchen',
    nextMilestone: 'Tile Installation',
    image: null,
  },
  {
    id: 'proj_3',
    name: 'Backyard Deck Addition',
    address: '789 Pine Lane, Berkeley, CA 94704',
    type: 'Addition',
    status: 'planning',
    progress: 10,
    budget: 35000,
    spent: 3500,
    startDate: '2024-02-01',
    endDate: '2024-04-15',
    contractor: 'Outdoor Living Pros',
    nextMilestone: 'Permit Approval',
    image: null,
  },
  {
    id: 'proj_4',
    name: 'ADU Construction',
    address: '321 Maple Drive, Palo Alto, CA 94301',
    type: 'New Construction',
    status: 'completed',
    progress: 100,
    budget: 150000,
    spent: 145000,
    startDate: '2023-06-01',
    endDate: '2023-12-15',
    contractor: 'Premier Construction Co',
    nextMilestone: 'Completed',
    image: null,
  },
];

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  planning: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  completed: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  on_hold: { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-500' },
};

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Projects</h1>
          <p className="text-slate-600 mt-1">Manage and track all your construction projects</p>
        </div>
        <Link
          href="/dashboard/projects/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          New Project
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'planning', 'in_progress', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                statusFilter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {status === 'all' ? 'All' : status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {filteredProjects.map((project) => {
          const status = statusColors[project.status];
          const budgetPercentage = Math.round((project.spent / project.budget) * 100);

          return (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Project Header */}
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900">{project.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                      <MapPin size={14} />
                      <span className="truncate max-w-[250px]">{project.address}</span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${status.bg} ${status.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                    {project.status === 'in_progress' ? 'In Progress' : project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-slate-600">Project Progress</span>
                    <span className="font-semibold text-slate-900">{project.progress}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        project.progress === 100 ? 'bg-green-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Project Details */}
              <div className="p-6 grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                    <DollarSign size={14} />
                    Budget
                  </div>
                  <div className="font-semibold text-slate-900">
                    ${project.spent.toLocaleString()} / ${project.budget.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500">{budgetPercentage}% spent</div>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                    <Calendar size={14} />
                    Timeline
                  </div>
                  <div className="font-semibold text-slate-900">
                    {new Date(project.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="text-xs text-slate-500">Est. completion</div>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                    <Users size={14} />
                    Contractor
                  </div>
                  <div className="font-semibold text-slate-900 truncate">{project.contractor}</div>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                    <FileText size={14} />
                    Next Milestone
                  </div>
                  <div className="font-semibold text-slate-900 truncate">{project.nextMilestone}</div>
                </div>
              </div>

              {/* View Details */}
              <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-sm text-blue-600 font-medium">View Details</span>
                <ChevronRight size={16} className="text-blue-600" />
              </div>
            </Link>
          );
        })}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No projects found</h3>
          <p className="text-slate-600 mb-6">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Start your first construction project today'}
          </p>
          <Link
            href="/dashboard/projects/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            Create Project
          </Link>
        </div>
      )}
    </div>
  );
}
