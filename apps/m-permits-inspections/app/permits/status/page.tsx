'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, FileText, Clock, CheckCircle, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';

export default function PermitStatusPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'permit' | 'address'>('permit');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock results
    setSearchResults([
      {
        id: 'BP-2024-001234',
        address: '123 Main Street, Washington, DC 20001',
        type: 'Building Permit',
        status: 'approved',
        statusLabel: 'Approved',
        submittedDate: '2024-12-15',
        approvedDate: '2025-01-10',
      },
      {
        id: 'BP-2024-001189',
        address: '123 Main Street, Washington, DC 20001',
        type: 'Electrical Permit',
        status: 'in_review',
        statusLabel: 'Under Review',
        submittedDate: '2025-01-05',
        approvedDate: null,
      },
    ]);

    setIsSearching(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'in_review':
        return <Clock className="text-yellow-500" size={20} />;
      case 'rejected':
        return <AlertCircle className="text-red-500" size={20} />;
      default:
        return <Clock className="text-gray-400" size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'in_review':
        return 'bg-yellow-100 text-yellow-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-4xl mx-auto">

        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Search className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Check Permit Status
          </h1>
          <p className="text-xl text-gray-600">
            Look up the status of your permit application
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <form onSubmit={handleSearch}>

            {/* Search Type Toggle */}
            <div className="flex gap-4 mb-6">
              <button
                type="button"
                onClick={() => setSearchType('permit')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                  searchType === 'permit'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Search by Permit Number
              </button>
              <button
                type="button"
                onClick={() => setSearchType('address')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                  searchType === 'address'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Search by Address
              </button>
            </div>

            {/* Search Input */}
            <div className="flex gap-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  searchType === 'permit'
                    ? 'Enter permit number (e.g., BP-2024-001234)'
                    : 'Enter property address'
                }
                className="
                  flex-1 px-4 py-3
                  border-2 border-gray-300 rounded-lg
                  focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                  transition-all duration-200
                "
              />
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="
                  px-8 py-3
                  bg-blue-600 hover:bg-blue-700
                  text-white font-semibold
                  rounded-lg
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200
                  flex items-center gap-2
                "
              >
                {isSearching ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search size={20} />
                    Search
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Search Results */}
        {searchResults !== null && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {searchResults.length > 0 ? (
              <>
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Found {searchResults.length} permit{searchResults.length > 1 ? 's' : ''}
                </h2>
                <div className="space-y-4">
                  {searchResults.map((permit) => (
                    <Link
                      key={permit.id}
                      href={`/permits/status/${permit.id}`}
                      className="block p-6 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-lg transition group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <FileText className="text-blue-600" size={20} />
                            <span className="font-bold text-gray-900">{permit.id}</span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(permit.status)}`}>
                              {permit.statusLabel}
                            </span>
                          </div>
                          <p className="text-gray-600 mb-1">{permit.address}</p>
                          <p className="text-sm text-gray-500">
                            {permit.type} • Submitted {permit.submittedDate}
                            {permit.approvedDate && ` • Approved ${permit.approvedDate}`}
                          </p>
                        </div>
                        <ArrowRight className="text-gray-400 group-hover:text-blue-600 transition flex-shrink-0 mt-2" size={20} />
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="text-gray-400 mx-auto mb-4" size={48} />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No permits found</h3>
                <p className="text-gray-600">
                  We couldn't find any permits matching your search. Please check your {searchType === 'permit' ? 'permit number' : 'address'} and try again.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 rounded-xl p-6">
          <h3 className="font-bold text-gray-900 mb-2">Need Help?</h3>
          <p className="text-gray-600 text-sm mb-4">
            If you can't find your permit or have questions about your application status,
            please contact our support team.
          </p>
          <a
            href="mailto:support@kealee.com"
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            support@kealee.com
          </a>
        </div>

      </div>
    </div>
  );
}
