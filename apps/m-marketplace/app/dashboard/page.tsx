'use client';

import Link from 'next/link';
import {
  FolderKanban,
  FileText,
  Clock,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Plus,
  Calendar,
  DollarSign,
} from 'lucide-react';

const stats = [
  {
    name: 'Active Projects',
    value: '3',
    change: '+1 this month',
    changeType: 'positive',
    icon: FolderKanban,
    color: 'blue',
  },
  {
    name: 'Pending Quotes',
    value: '2',
    change: 'Awaiting review',
    changeType: 'neutral',
    icon: FileText,
    color: 'orange',
  },
  {
    name: 'Total Invested',
    value: '$127,500',
    change: '+$15,000 this month',
    changeType: 'positive',
    icon: DollarSign,
    color: 'green',
  },
  {
    name: 'Completion Rate',
    value: '94%',
    change: 'On track',
    changeType: 'positive',
    icon: TrendingUp,
    color: 'purple',
  },
];

const recentProjects = [
  {
    id: 1,
    name: 'Kitchen Renovation',
    address: '123 Main Street, San Francisco',
    status: 'in_progress',
    progress: 65,
    nextMilestone: 'Cabinet Installation',
    dueDate: '2024-02-15',
  },
  {
    id: 2,
    name: 'Bathroom Remodel',
    address: '456 Oak Avenue, Oakland',
    status: 'in_progress',
    progress: 40,
    nextMilestone: 'Plumbing Rough-in',
    dueDate: '2024-02-20',
  },
  {
    id: 3,
    name: 'Deck Addition',
    address: '789 Pine Lane, Berkeley',
    status: 'planning',
    progress: 10,
    nextMilestone: 'Permit Approval',
    dueDate: '2024-02-28',
  },
];

const pendingActions = [
  {
    id: 1,
    type: 'approval',
    title: 'Approve Milestone Payment',
    project: 'Kitchen Renovation',
    amount: '$8,500',
    urgency: 'high',
  },
  {
    id: 2,
    type: 'review',
    title: 'Review Contractor Quote',
    project: 'Deck Addition',
    amount: '$12,000',
    urgency: 'medium',
  },
  {
    id: 3,
    type: 'document',
    title: 'Sign Contract Amendment',
    project: 'Bathroom Remodel',
    urgency: 'low',
  },
];

const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-600', icon: 'text-blue-600' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-600', icon: 'text-orange-600' },
  green: { bg: 'bg-green-100', text: 'text-green-600', icon: 'text-green-600' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600', icon: 'text-purple-600' },
};

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, John</h1>
          <p className="text-slate-600 mt-1">Here's what's happening with your projects.</p>
        </div>
        <Link
          href="/dashboard/quotes/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Request Quote
        </Link>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const colors = colorMap[stat.color];
          return (
            <div
              key={stat.name}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center`}>
                  <stat.icon className={colors.icon} size={24} />
                </div>
                <span
                  className={`text-sm font-medium ${
                    stat.changeType === 'positive'
                      ? 'text-green-600'
                      : stat.changeType === 'negative'
                      ? 'text-red-600'
                      : 'text-slate-500'
                  }`}
                >
                  {stat.change}
                </span>
              </div>
              <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
              <div className="text-slate-600 mt-1">{stat.name}</div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Projects */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">Active Projects</h2>
            <Link
              href="/dashboard/projects"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentProjects.map((project) => (
              <div key={project.id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{project.name}</h3>
                    <p className="text-sm text-slate-500">{project.address}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      project.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-700'
                        : project.status === 'planning'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {project.status === 'in_progress' ? 'In Progress' : 'Planning'}
                  </span>
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-600">Progress</span>
                    <span className="font-medium text-slate-900">{project.progress}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock size={14} />
                    <span>Next: {project.nextMilestone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Calendar size={14} />
                    <span>{new Date(project.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">Action Required</h2>
            <p className="text-sm text-slate-500 mt-1">Items needing your attention</p>
          </div>

          <div className="divide-y divide-slate-100">
            {pendingActions.map((action) => (
              <div key={action.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      action.urgency === 'high'
                        ? 'bg-red-100'
                        : action.urgency === 'medium'
                        ? 'bg-orange-100'
                        : 'bg-slate-100'
                    }`}
                  >
                    {action.urgency === 'high' ? (
                      <AlertCircle
                        size={16}
                        className="text-red-600"
                      />
                    ) : (
                      <CheckCircle2
                        size={16}
                        className={action.urgency === 'medium' ? 'text-orange-600' : 'text-slate-600'}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 text-sm">{action.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{action.project}</p>
                    {action.amount && (
                      <p className="text-sm font-semibold text-slate-900 mt-1">{action.amount}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-slate-100">
            <button className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all actions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
