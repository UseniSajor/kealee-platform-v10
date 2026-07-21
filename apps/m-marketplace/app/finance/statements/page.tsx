'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Download, Calendar, ChevronDown, Filter } from 'lucide-react';

interface Statement {
  id: string;
  period: string;
  type: 'monthly' | 'quarterly' | 'annual';
  generatedDate: string;
  totalDeposits: number;
  totalReleases: number;
  fees: number;
  downloadUrl: string;
}

export default function StatementsPage() {
  const [selectedYear, setSelectedYear] = useState('2025');
  const [selectedType, setSelectedType] = useState<'all' | 'monthly' | 'quarterly' | 'annual'>('all');

  const statements: Statement[] = [
    {
      id: 'STM-2025-01',
      period: 'January 2025',
      type: 'monthly',
      generatedDate: '2025-02-01',
      totalDeposits: 125000,
      totalReleases: 87500,
      fees: 2625,
      downloadUrl: '#',
    },
    {
      id: 'STM-2024-Q4',
      period: 'Q4 2024',
      type: 'quarterly',
      generatedDate: '2025-01-15',
      totalDeposits: 450000,
      totalReleases: 312500,
      fees: 9375,
      downloadUrl: '#',
    },
    {
      id: 'STM-2024-12',
      period: 'December 2024',
      type: 'monthly',
      generatedDate: '2025-01-01',
      totalDeposits: 175000,
      totalReleases: 125000,
      fees: 3750,
      downloadUrl: '#',
    },
    {
      id: 'STM-2024-11',
      period: 'November 2024',
      type: 'monthly',
      generatedDate: '2024-12-01',
      totalDeposits: 145000,
      totalReleases: 98000,
      fees: 2940,
      downloadUrl: '#',
    },
    {
      id: 'STM-2024-10',
      period: 'October 2024',
      type: 'monthly',
      generatedDate: '2024-11-01',
      totalDeposits: 130000,
      totalReleases: 89500,
      fees: 2685,
      downloadUrl: '#',
    },
    {
      id: 'STM-2024-Q3',
      period: 'Q3 2024',
      type: 'quarterly',
      generatedDate: '2024-10-15',
      totalDeposits: 380000,
      totalReleases: 265000,
      fees: 7950,
      downloadUrl: '#',
    },
    {
      id: 'STM-2024-ANNUAL',
      period: '2024 Annual',
      type: 'annual',
      generatedDate: '2025-01-31',
      totalDeposits: 1450000,
      totalReleases: 1050000,
      fees: 31500,
      downloadUrl: '#',
    },
  ];

  const filteredStatements = statements.filter(s => {
    if (selectedType !== 'all' && s.type !== selectedType) return false;
    return true;
  });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'monthly': return 'Monthly';
      case 'quarterly': return 'Quarterly';
      case 'annual': return 'Annual';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'monthly': return 'bg-blue-100 text-blue-700';
      case 'quarterly': return 'bg-purple-100 text-purple-700';
      case 'annual': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-zinc-100 text-zinc-700';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">

      {/* Header */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <Link href="/finance" className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-4">
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-black text-zinc-900">Account Statements</h1>
          <p className="text-zinc-600">Download your escrow account statements and reports</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="text-zinc-400" size={18} />
            <span className="text-sm text-zinc-600">Filter by:</span>
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as typeof selectedType)}
            className="px-4 py-2 border border-zinc-200 rounded-lg text-sm focus:border-emerald-500"
          >
            <option value="all">All Types</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annual">Annual</option>
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2 border border-zinc-200 rounded-lg text-sm focus:border-emerald-500"
          >
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
          </select>
        </div>

        {/* Statements List */}
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="text-left p-4 font-semibold">Statement</th>
                <th className="text-left p-4 font-semibold">Type</th>
                <th className="text-right p-4 font-semibold">Deposits</th>
                <th className="text-right p-4 font-semibold">Releases</th>
                <th className="text-right p-4 font-semibold">Fees</th>
                <th className="text-left p-4 font-semibold">Generated</th>
                <th className="text-right p-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStatements.map((statement) => (
                <tr key={statement.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center">
                        <FileText className="text-zinc-500" size={20} />
                      </div>
                      <div>
                        <p className="font-semibold text-zinc-900">{statement.period}</p>
                        <p className="text-xs text-zinc-500">{statement.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(statement.type)}`}>
                      {getTypeLabel(statement.type)}
                    </span>
                  </td>
                  <td className="p-4 text-right font-medium text-emerald-600">
                    {formatCurrency(statement.totalDeposits)}
                  </td>
                  <td className="p-4 text-right font-medium text-zinc-900">
                    {formatCurrency(statement.totalReleases)}
                  </td>
                  <td className="p-4 text-right text-zinc-500">
                    {formatCurrency(statement.fees)}
                  </td>
                  <td className="p-4 text-zinc-500">
                    {new Date(statement.generatedDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="p-4 text-right">
                    <button className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 rounded-lg transition">
                      <Download size={16} />
                      PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredStatements.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-zinc-200">
            <FileText className="text-zinc-300 mx-auto mb-4" size={48} />
            <h3 className="text-lg font-bold text-zinc-900 mb-2">No statements found</h3>
            <p className="text-zinc-600">Try adjusting your filters.</p>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-bold text-blue-900 mb-2">About Your Statements</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Monthly statements are generated on the 1st of each month</li>
            <li>• Quarterly statements are generated within 15 days of quarter end</li>
            <li>• Annual statements are generated by January 31st</li>
            <li>• All statements are available for download for 7 years</li>
          </ul>
        </div>

      </main>
    </div>
  );
}
