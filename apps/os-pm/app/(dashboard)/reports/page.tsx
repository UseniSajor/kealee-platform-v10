'use client';

import { useState, useEffect } from 'react';
import { useRequireAuth } from '@kealee/auth/client';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  Plus,
  Filter
} from 'lucide-react';
import Link from 'next/link';

interface Report {
  id: string;
  title: string;
  type: 'weekly' | 'monthly' | 'custom';
  period: string;
  createdAt: string;
  generatedBy: string;
  downloadUrl: string;
  stats: {
    tasksCompleted: number;
    hoursLogged: number;
    clientsServed: number;
  };
}

export default function ReportsPage() {
  const { user } = useRequireAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'weekly' | 'monthly'>('all');

  useEffect(() => {
    loadReports();
  }, [filter]);

  const loadReports = async () => {
    try {
      const filters: any = {};
      if (filter !== 'all') filters.type = filter;
      
      const data = await api.getReports(filters);
      setReports(data.reports || []);
    } catch (error) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (reportId: string) => {
    try {
      const blob = await api.downloadReport(reportId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Report downloaded');
    } catch (error) {
      toast.error('Failed to download report');
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Reports
          </h1>
          <p className="text-gray-600">
            Generate and download performance reports
          </p>
        </div>

        <Link
          href="/reports/new"
          className="
            flex items-center gap-2
            px-6 py-3
            bg-blue-600 hover:bg-blue-700
            text-white font-semibold
            rounded-lg
            shadow-md hover:shadow-lg
            transition-all duration-200
          "
        >
          <Plus size={20} />
          Generate Report
        </Link>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-4">
          <Filter size={20} className="text-gray-600" />
          <div className="flex gap-2">
            {['all', 'weekly', 'monthly'].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type as any)}
                className={`
                  px-4 py-2 rounded-lg font-medium
                  transition-all duration-200
                  ${filter === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <FileText className="mx-auto mb-4 text-gray-400" size={64} />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            No reports yet
          </h3>
          <p className="text-gray-600 mb-6">
            Generate your first report to track your performance
          </p>
          <Link
            href="/reports/new"
            className="
              inline-block px-6 py-3
              bg-blue-600 hover:bg-blue-700
              text-white font-semibold
              rounded-lg
              shadow-md hover:shadow-lg
              transition-all duration-200
            "
          >
            Generate Report
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onDownload={handleDownload}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ReportCard({ report, onDownload }: { report: Report; onDownload: (id: string) => void }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4">
          <div className="
            w-12 h-12
            bg-blue-100 text-blue-600
            rounded-xl
            flex items-center justify-center
          ">
            <FileText size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {report.title}
            </h3>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Calendar size={16} />
                {report.period}
              </span>
              <span>•</span>
              <span>Generated {new Date(report.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => onDownload(report.id)}
          className="
            flex items-center gap-2
            px-4 py-2
            bg-blue-600 hover:bg-blue-700
            text-white font-semibold
            rounded-lg
            shadow-md hover:shadow-lg
            transition-all duration-200
          "
        >
          <Download size={20} />
          Download
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {report.stats.tasksCompleted}
          </div>
          <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
            <CheckCircle size={14} />
            Tasks Completed
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {report.stats.hoursLogged}
          </div>
          <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
            <Clock size={14} />
            Hours Logged
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {report.stats.clientsServed}
          </div>
          <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
            <TrendingUp size={14} />
            Clients Served
          </div>
        </div>
      </div>
    </div>
  );
}
