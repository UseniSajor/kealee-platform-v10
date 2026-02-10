'use client';

import { useState, useEffect } from 'react';
import { useRequireAuth } from '@kealee/auth/client';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { ArrowLeft, Calendar, FileText, Loader2, Download } from 'lucide-react';
import Link from 'next/link';

export default function NewReportPage() {
  const { user } = useRequireAuth();
  const [reportType, setReportType] = useState<'weekly' | 'monthly' | 'custom'>('weekly');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  // Auto-set date range based on type
  useEffect(() => {
    const today = new Date();
    
    if (reportType === 'weekly') {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      setDateRange({
        start: weekStart.toISOString().split('T')[0],
        end: weekEnd.toISOString().split('T')[0],
      });
    } else if (reportType === 'monthly') {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      setDateRange({
        start: monthStart.toISOString().split('T')[0],
        end: monthEnd.toISOString().split('T')[0],
      });
    }
  }, [reportType]);

  const handleGenerate = async () => {
    setGenerating(true);

    try {
      const data = await api.generateReport({
        type: reportType,
        startDate: dateRange.start,
        endDate: dateRange.end,
      });

      setReportData(data);
      setGenerated(true);
      toast.success('Report generated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!reportData?.id) return;
    
    try {
      const blob = await api.downloadReport(reportData.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${reportData.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Report downloaded');
    } catch (error) {
      toast.error('Failed to download report');
    }
  };

  if (generated && reportData) {
    return (
      <div className="space-y-8">
        
        {/* Success Message */}
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="
            w-20 h-20 mx-auto mb-6
            bg-green-100 rounded-full
            flex items-center justify-center
          ">
            <FileText className="text-green-600" size={40} />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Report Generated Successfully!
          </h1>

          <p className="text-lg text-gray-600 mb-8">
            Your {reportType} report for {reportData.period} is ready
          </p>

          {/* Stats Preview */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {reportData.stats?.tasksCompleted || 0}
                </div>
                <div className="text-sm text-gray-600">Tasks Completed</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {reportData.stats?.hoursLogged || 0}
                </div>
                <div className="text-sm text-gray-600">Hours Logged</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {reportData.stats?.clientsServed || 0}
                </div>
                <div className="text-sm text-gray-600">Clients Served</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleDownload}
              className="
                flex items-center gap-2
                px-8 py-4
                bg-blue-600 hover:bg-blue-700
                text-white font-semibold
                rounded-lg
                shadow-lg hover:shadow-xl
                transition-all duration-200
              "
            >
              <Download size={20} />
              Download PDF
            </button>

            <Link
              href="/reports"
              className="
                px-8 py-4
                border-2 border-gray-300
                text-gray-700 font-semibold
                rounded-lg
                hover:border-gray-400
                transition-all duration-200
              "
            >
              View All Reports
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div>
        <Link
          href="/reports"
          className="
            inline-flex items-center gap-2
            text-blue-600 hover:text-blue-700 font-medium
            mb-4
          "
        >
          <ArrowLeft size={20} />
          Back to Reports
        </Link>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Generate New Report
        </h1>
        <p className="text-gray-600">
          Create a performance report for your work
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="space-y-6">
          
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Report Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' },
                { value: 'custom', label: 'Custom' },
              ].map((type) => (
                <button
                  key={type.value}
                  onClick={() => setReportType(type.value as any)}
                  className={`
                    px-4 py-3 rounded-lg font-medium
                    transition-all duration-200
                    ${reportType === type.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                  className="
                    w-full px-4 py-3
                    border-2 border-gray-300 rounded-lg
                    focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                    transition-all duration-200
                  "
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                  className="
                    w-full px-4 py-3
                    border-2 border-gray-300 rounded-lg
                    focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                    transition-all duration-200
                  "
                />
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <h3 className="font-semibold text-blue-900 mb-2">
              Report will include:
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Tasks completed and in progress</li>
              <li>• Total hours logged</li>
              <li>• Clients served</li>
              <li>• Performance metrics</li>
              <li>• Detailed activity breakdown</li>
            </ul>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating || !dateRange.start || !dateRange.end}
            className="
              w-full py-4
              bg-blue-600 hover:bg-blue-700
              text-white font-semibold text-lg
              rounded-lg
              shadow-md hover:shadow-lg
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
              flex items-center justify-center gap-2
            "
          >
            {generating ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Generating Report...
              </>
            ) : (
              <>
                <FileText size={20} />
                Generate Report
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}




