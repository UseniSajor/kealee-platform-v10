// apps/m-marketplace/components/NetworkSearchClient.tsx
// Client-side interactive network search component

'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MarketingLayout,
  NetworkProfileCard,
  SectionLabel,
} from '@kealee/ui';

interface Profile {
  id: string;
  slug: string;
  businessName: string;
  ownerName?: string;
  type: string;
  trades: string[];
  rating: number;
  reviews: number;
  location: string;
  distance?: string;
  stats?: {
    projectsCompleted?: number;
    yearsExperience?: number;
    responseTime?: string;
  };
  badges?: string[];
  availability: 'available' | 'busy' | 'unavailable';
  ctaHref: string;
}

interface NetworkSearchClientProps {
  initialProfiles: Profile[];
}

const PROFESSIONAL_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'gc', label: 'General Contractor' },
  { value: 'specialty', label: 'Specialty Contractor' },
  { value: 'architect', label: 'Architect' },
  { value: 'engineer', label: 'Engineer' },
  { value: 'supplier', label: 'Supplier' },
];

const TRADES = [
  'General Construction',
  'Electrical',
  'Plumbing',
  'HVAC',
  'Roofing',
  'Carpentry',
  'Concrete',
  'Masonry',
  'Painting',
  'Flooring',
];

const AVAILABILITY_OPTIONS = [
  { value: 'all', label: 'Any Availability' },
  { value: 'available', label: 'Available Now' },
  { value: 'busy', label: 'Booking 2+ Weeks' },
];

const SECTORS = [
  { value: 'all', label: 'All Sectors' },
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'government', label: 'Government' },
];

const SORT_OPTIONS = [
  { value: 'best_match', label: 'Best Match' },
  { value: 'highest_rated', label: 'Highest Rated' },
  { value: 'most_jobs', label: 'Most Jobs' },
];

export function NetworkSearchClient({ initialProfiles }: NetworkSearchClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [professionalType, setProfessionalType] = useState('all');
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [availability, setAvailability] = useState('all');
  const [sector, setSector] = useState('all');
  const [sortBy, setSortBy] = useState('best_match');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Filter profiles
  const filteredProfiles = useMemo(() => {
    let result = [...initialProfiles];

    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.businessName.toLowerCase().includes(query) ||
          p.trades.some((t) => t.toLowerCase().includes(query)) ||
          p.type.toLowerCase().includes(query)
      );
    }

    // Availability filter
    if (availability !== 'all') {
      result = result.filter((p) => p.availability === availability);
    }

    // Trades filter
    if (selectedTrades.length > 0) {
      result = result.filter((p) =>
        selectedTrades.some((trade) =>
          p.trades.some((t) => t.toLowerCase().includes(trade.toLowerCase()))
        )
      );
    }

    // Sort
    switch (sortBy) {
      case 'highest_rated':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'most_jobs':
        result.sort(
          (a, b) =>
            (b.stats?.projectsCompleted || 0) - (a.stats?.projectsCompleted || 0)
        );
        break;
      default:
        // Best match - keep original order
        break;
    }

    return result;
  }, [initialProfiles, searchQuery, availability, selectedTrades, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredProfiles.length / itemsPerPage);
  const paginatedProfiles = filteredProfiles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleTrade = (trade: string) => {
    setSelectedTrades((prev) =>
      prev.includes(trade) ? prev.filter((t) => t !== trade) : [...prev, trade]
    );
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setLocation('');
    setProfessionalType('all');
    setSelectedTrades([]);
    setAvailability('all');
    setSector('all');
    setCurrentPage(1);
  };

  const activeFiltersCount =
    (professionalType !== 'all' ? 1 : 0) +
    selectedTrades.length +
    (availability !== 'all' ? 1 : 0) +
    (sector !== 'all' ? 1 : 0);

  return (
    <MarketingLayout
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Network', href: '/network' },
      ]}
      showSearch={false}
    >
      {/* Hero Section */}
      <section className="bg-white py-12 md:py-16 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <SectionLabel text="KEALEE CONSTRUCTION NETWORK" color="teal" />
            <h1
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1A2B4A] mt-4 mb-4"
              style={{ fontFamily: '"Clash Display", "Plus Jakarta Sans", sans-serif' }}
            >
              Find the Right Professional
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Search verified contractors, architects, and engineers in the DC-Baltimore corridor.
            </p>
          </div>

          {/* Large Search Bar */}
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-grow relative">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search by trade, name, or specialty..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 bg-white text-lg focus:outline-none focus:ring-2 focus:ring-[#2ABFBF] focus:border-transparent"
                />
              </div>
              <div className="relative">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full md:w-48 pl-12 pr-4 py-4 rounded-xl border border-gray-200 bg-white text-lg focus:outline-none focus:ring-2 focus:ring-[#2ABFBF] appearance-none"
                >
                  <option value="">All Areas</option>
                  <option value="dc">Washington, DC</option>
                  <option value="md">Maryland</option>
                  <option value="va">Northern Virginia</option>
                  <option value="baltimore">Baltimore</option>
                </select>
              </div>
              <button className="px-8 py-4 bg-[#2ABFBF] text-white font-semibold rounded-xl hover:bg-[#25a8a8] transition-colors text-lg">
                Search
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Bar */}
      <section className="bg-gray-50 border-b border-gray-200 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Desktop Filters */}
          <div className="hidden lg:flex items-center gap-4 flex-wrap">
            <select
              value={professionalType}
              onChange={(e) => {
                setProfessionalType(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2ABFBF]"
            >
              {PROFESSIONAL_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            <select
              value={availability}
              onChange={(e) => {
                setAvailability(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2ABFBF]"
            >
              {AVAILABILITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              value={sector}
              onChange={(e) => {
                setSector(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2ABFBF]"
            >
              {SECTORS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            <div className="h-6 w-px bg-gray-300" />

            {/* Trade Pills */}
            <div className="flex flex-wrap gap-2">
              {TRADES.slice(0, 6).map((trade) => (
                <button
                  key={trade}
                  onClick={() => toggleTrade(trade)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    selectedTrades.includes(trade)
                      ? 'bg-[#2ABFBF] text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-[#2ABFBF] hover:text-[#2ABFBF]'
                  }`}
                >
                  {trade}
                </button>
              ))}
            </div>

            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Mobile Filter Button */}
          <div className="lg:hidden flex items-center justify-between">
            <button
              onClick={() => setShowFilters(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Filters
              {activeFiltersCount > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-[#2ABFBF] text-white text-xs rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Active Filters Pills */}
          {(selectedTrades.length > 0 || availability !== 'all') && (
            <div className="flex flex-wrap gap-2 mt-3 lg:hidden">
              {selectedTrades.map((trade) => (
                <span
                  key={trade}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-[#2ABFBF]/10 text-[#2ABFBF] rounded-full text-sm"
                >
                  {trade}
                  <button onClick={() => toggleTrade(trade)} className="hover:text-[#1A2B4A]">
                    ×
                  </button>
                </span>
              ))}
              {availability !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#38A169]/10 text-[#38A169] rounded-full text-sm">
                  {AVAILABILITY_OPTIONS.find((o) => o.value === availability)?.label}
                  <button
                    onClick={() => setAvailability('all')}
                    className="hover:text-[#1A2B4A]"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Results Section */}
      <section className="py-8 md:py-12 bg-gray-50 min-h-[60vh]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Fair Bid Rotation Banner */}
          <div className="mb-6 p-4 bg-[#2ABFBF]/10 border border-[#2ABFBF]/20 rounded-xl">
            <div className="flex items-center gap-3">
              <svg
                className="w-6 h-6 text-[#2ABFBF] flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <div>
                <p className="font-semibold text-[#1A2B4A]">Fair Bid Rotation Active</p>
                <p className="text-sm text-gray-600">
                  Qualified professionals get equal opportunities. No pay-to-play positioning.
                </p>
              </div>
            </div>
          </div>

          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-600">
              <span className="font-semibold text-[#1A2B4A]">{filteredProfiles.length}</span>{' '}
              professionals found
            </p>
            <div className="hidden lg:block">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2ABFBF]"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    Sort: {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Grid */}
          {paginatedProfiles.length > 0 ? (
            <motion.div
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {paginatedProfiles.map((profile, index) => (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <NetworkProfileCard
                    businessName={profile.businessName}
                    ownerName={profile.ownerName}
                    type={profile.type}
                    trades={profile.trades}
                    rating={profile.rating}
                    reviews={profile.reviews}
                    location={profile.location}
                    distance={profile.distance}
                    stats={profile.stats}
                    badges={profile.badges}
                    availability={profile.availability}
                    ctaHref={profile.ctaHref}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-16">
              <svg
                className="w-16 h-16 text-gray-300 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No results found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your filters or search terms.</p>
              <button
                onClick={clearFilters}
                className="px-6 py-2 bg-[#2ABFBF] text-white rounded-lg font-medium hover:bg-[#25a8a8] transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-[#1A2B4A] text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Mobile Filter Bottom Sheet */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setShowFilters(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 lg:hidden max-h-[80vh] overflow-y-auto"
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
                <h3 className="font-bold text-lg text-[#1A2B4A]">Filters</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="p-4 space-y-6">
                {/* Professional Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Professional Type
                  </label>
                  <select
                    value={professionalType}
                    onChange={(e) => setProfessionalType(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white"
                  >
                    {PROFESSIONAL_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Availability */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Availability
                  </label>
                  <select
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white"
                  >
                    {AVAILABILITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sector</label>
                  <select
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white"
                  >
                    {SECTORS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Trades */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trade / Specialty
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TRADES.map((trade) => (
                      <button
                        key={trade}
                        onClick={() => toggleTrade(trade)}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedTrades.includes(trade)
                            ? 'bg-[#2ABFBF] text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {trade}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white">
                <button
                  onClick={clearFilters}
                  className="flex-1 py-3 border border-gray-200 rounded-lg font-medium text-gray-600"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="flex-1 py-3 bg-[#1A2B4A] text-white rounded-lg font-semibold"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </MarketingLayout>
  );
}
