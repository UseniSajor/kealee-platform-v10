'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  Calendar,
  Building2,
  DollarSign,
} from 'lucide-react';

const quotes = [
  {
    id: 'quote_1',
    serviceType: 'architect',
    projectType: 'Renovation',
    title: 'Permit-Ready Drawings for Kitchen',
    description: 'Full permit-ready drawings for a kitchen renovation including structural modifications',
    propertyAddress: '123 Main Street, San Francisco, CA',
    estimatedBudget: '$3,500 - $5,000',
    status: 'pending',
    submittedAt: '2024-01-25T10:30:00Z',
    responses: 0,
  },
  {
    id: 'quote_2',
    serviceType: 'permits',
    projectType: 'Addition',
    title: 'ADU Permit Application',
    description: 'Permit processing for a 500 sq ft ADU in backyard',
    propertyAddress: '456 Oak Avenue, Oakland, CA',
    estimatedBudget: '$150 - $200',
    status: 'in_review',
    submittedAt: '2024-01-22T14:15:00Z',
    responses: 2,
  },
  {
    id: 'quote_3',
    serviceType: 'ops',
    projectType: 'New Construction',
    title: 'Project Management - Custom Home',
    description: 'Full PM services for 2,500 sq ft custom home build',
    propertyAddress: '789 Pine Lane, Berkeley, CA',
    estimatedBudget: '$8,500/month',
    status: 'accepted',
    submittedAt: '2024-01-18T09:00:00Z',
    responses: 3,
    acceptedQuote: '$7,500/month',
  },
  {
    id: 'quote_4',
    serviceType: 'architect',
    projectType: 'Remodel',
    title: '3D Renderings for Bathroom',
    description: 'Photorealistic 3D renderings for master bathroom remodel',
    propertyAddress: '321 Maple Drive, Palo Alto, CA',
    estimatedBudget: '$800 - $1,200',
    status: 'expired',
    submittedAt: '2024-01-05T16:45:00Z',
    responses: 1,
  },
];

const statusConfig: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  pending: { label: 'Pending', bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
  in_review: { label: 'In Review', bg: 'bg-blue-100', text: 'text-blue-700', icon: FileText },
  accepted: { label: 'Accepted', bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
  expired: { label: 'Expired', bg: 'bg-slate-100', text: 'text-slate-700', icon: XCircle },
  rejected: { label: 'Rejected', bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
};

const serviceLabels: Record<string, string> = {
  architect: 'Architect Services',
  permits: 'Permits & Inspections',
  ops: 'PM Services',
  portal: 'Project Owner Portal',
};

export default function QuotesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredQuotes = quotes.filter((quote) => {
    const matchesSearch =
      quote.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quote Requests</h1>
          <p className="text-slate-600 mt-1">Track and manage your service quote requests</p>
        </div>
        <Link
          href="/dashboard/quotes/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Request Quote
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search quotes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          {['all', 'pending', 'in_review', 'accepted', 'expired'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-colors ${
                statusFilter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {status === 'all' ? 'All' : status === 'in_review' ? 'In Review' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Quotes List */}
      <div className="space-y-4">
        {filteredQuotes.map((quote) => {
          const status = statusConfig[quote.status];
          const StatusIcon = status.icon;

          return (
            <div
              key={quote.id}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg">
                        {serviceLabels[quote.serviceType]}
                      </span>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${status.bg} ${status.text}`}>
                        <StatusIcon size={12} />
                        {status.label}
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg text-slate-900 mb-1">{quote.title}</h3>
                    <p className="text-slate-600 text-sm mb-3">{quote.description}</p>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <Building2 size={14} />
                        <span>{quote.propertyAddress}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign size={14} />
                        <span>{quote.estimatedBudget}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{new Date(quote.submittedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {quote.responses > 0 && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-slate-900">{quote.responses}</div>
                        <div className="text-xs text-slate-500">Response{quote.responses !== 1 ? 's' : ''}</div>
                      </div>
                    )}
                    <Link
                      href={`/dashboard/quotes/${quote.id}`}
                      className="flex items-center gap-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
                    >
                      View <ChevronRight size={16} />
                    </Link>
                  </div>
                </div>

                {quote.status === 'accepted' && quote.acceptedQuote && (
                  <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-100">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle size={16} />
                      <span className="font-medium">Accepted Quote: {quote.acceptedQuote}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredQuotes.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No quotes found</h3>
          <p className="text-slate-600 mb-6">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Request a quote to get started with our services'}
          </p>
          <Link
            href="/dashboard/quotes/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            Request Quote
          </Link>
        </div>
      )}
    </div>
  );
}
