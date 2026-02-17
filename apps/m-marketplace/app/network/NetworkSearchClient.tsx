'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  RotateCw,
  Star,
  MapPin,
  Clock,
  CheckCircle2,
  BadgeCheck,
  ArrowRight,
  Building2,
  Loader2,
  AlertCircle,
} from 'lucide-react';

import {
  MarketingLayout,
  Badge,
  brand,
  shadows,
} from '@kealee/ui';

import { getContractors } from '@/lib/api';

// Types
type ProfessionalType = 'gc' | 'specialty_contractor' | 'architect' | 'engineer' | 'supplier' | 'owner_developer';
type Sector = 'residential' | 'commercial' | 'industrial' | 'government' | 'mixed_use';
type AvailabilityStatus = 'available' | 'busy' | 'unavailable';
type VerificationBadge = 'licensed' | 'insured' | 'background_checked' | 'verified' | 'preferred';

interface NetworkProfile {
  id: string;
  slug: string;
  businessName: string;
  principalName: string;
  type: ProfessionalType;
  trades: string[];
  specialties: string[];
  sectors: Sector[];
  location: { city: string; state: string };
  serviceAreas: string[];
  rating: number;
  reviewCount: number;
  stats: {
    projectsCompleted?: number;
    yearsInBusiness?: number;
    responseTime?: string;
    onTimeRate?: string;
  };
  badges: VerificationBadge[];
  availability: AvailabilityStatus;
  memberSince: string;
}

/** Map a raw API contractor profile to our NetworkProfile shape */
function mapApiProfile(p: any): NetworkProfile {
  return {
    id: p.id,
    slug: p.id, // Use the profile UUID as the URL segment for API lookups
    businessName: p.businessName || 'Unknown Business',
    principalName: p.user?.name || '',
    type: 'gc' as ProfessionalType, // Backend doesn't expose type yet; default
    trades: Array.isArray(p.specialties) ? p.specialties : [],
    specialties: Array.isArray(p.specialties) ? p.specialties : [],
    sectors: ['residential', 'commercial'] as Sector[], // Placeholder until backend exposes sectors
    location: { city: '', state: '' }, // Backend doesn't expose location on list endpoint yet
    serviceAreas: [],
    rating: typeof p.rating === 'number' ? p.rating : 0,
    reviewCount: typeof p.reviewCount === 'number' ? p.reviewCount : 0,
    stats: {
      projectsCompleted: typeof p.projectsCompleted === 'number' ? p.projectsCompleted : undefined,
    },
    badges: p.verified ? ['verified' as VerificationBadge] : [],
    availability: 'available' as AvailabilityStatus, // Placeholder until backend exposes availability
    memberSince: '',
  };
}

const PROFESSIONAL_TYPE_LABELS: Record<ProfessionalType, string> = {
  gc: 'General Contractor',
  specialty_contractor: 'Specialty Contractor',
  architect: 'Architect',
  engineer: 'Engineer',
  supplier: 'Supplier',
  owner_developer: 'Owner/Developer',
};

const SECTOR_LABELS: Record<Sector, string> = {
  residential: 'Residential',
  commercial: 'Commercial',
  industrial: 'Industrial',
  government: 'Government',
  mixed_use: 'Mixed-Use',
};

const availabilityConfig: Record<AvailabilityStatus, { color: string; label: string; bg: string }> = {
  available: { color: '#38A169', label: 'Available Now', bg: '#E8F5E9' },
  busy: { color: '#DD6B20', label: 'Limited Availability', bg: '#FEF3E8' },
  unavailable: { color: '#E53E3E', label: 'Fully Booked', bg: '#FEE2E2' },
};

export function NetworkSearchClient() {
  const [profiles, setProfiles] = useState<NetworkProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<ProfessionalType[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<Sector[]>([]);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [selectedAvailability, setSelectedAvailability] = useState<AvailabilityStatus[]>([]);
  const [sortBy, setSortBy] = useState<'best_match' | 'highest_rated' | 'most_jobs'>('best_match');

  // Fetch contractors from API
  const fetchContractors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getContractors({
        search: searchQuery || undefined,
        verifiedOnly: undefined,
        minRating: minRating ?? undefined,
        limit: 50,
        offset: 0,
      });

      if (result.success && result.data) {
        const mapped = (result.data.profiles || []).map(mapApiProfile);
        setProfiles(mapped);
        setTotalResults(result.data.total || mapped.length);
      } else {
        setError(result.error || 'Failed to load contractors');
        setProfiles([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, minRating]);

  // Fetch on mount and when search/filter params change
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchContractors();
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [fetchContractors]);

  // Client-side filtering on top of API results (for filters the API doesn't support)
  const filteredProfiles = useMemo(() => {
    let results = [...profiles];

    // Type filter (client-side since API doesn't support it yet)
    if (selectedTypes.length > 0) {
      results = results.filter((p) => selectedTypes.includes(p.type));
    }

    // Sector filter (client-side since API doesn't support it yet)
    if (selectedSectors.length > 0) {
      results = results.filter((p) => p.sectors.some((s) => selectedSectors.includes(s)));
    }

    // Availability filter (client-side since API doesn't support it yet)
    if (selectedAvailability.length > 0) {
      results = results.filter((p) => selectedAvailability.includes(p.availability));
    }

    // Sort
    switch (sortBy) {
      case 'highest_rated':
        results.sort((a, b) => b.rating - a.rating);
        break;
      case 'most_jobs':
        results.sort((a, b) => (b.stats.projectsCompleted || 0) - (a.stats.projectsCompleted || 0));
        break;
      default:
        // best_match - keep original order
        break;
    }

    return results;
  }, [profiles, selectedTypes, selectedSectors, selectedAvailability, sortBy]);

  const activeFilters = [
    ...selectedTypes.map((t) => ({ type: 'type', value: t, label: PROFESSIONAL_TYPE_LABELS[t] })),
    ...selectedSectors.map((s) => ({ type: 'sector', value: s, label: SECTOR_LABELS[s] })),
    ...(minRating ? [{ type: 'rating', value: minRating, label: `${minRating}+ Stars` }] : []),
    ...selectedAvailability.map((a) => ({ type: 'availability', value: a, label: availabilityConfig[a].label })),
  ];

  const removeFilter = (filter: { type: string; value: string | number }) => {
    switch (filter.type) {
      case 'type':
        setSelectedTypes((prev) => prev.filter((t) => t !== filter.value));
        break;
      case 'sector':
        setSelectedSectors((prev) => prev.filter((s) => s !== filter.value));
        break;
      case 'rating':
        setMinRating(null);
        break;
      case 'availability':
        setSelectedAvailability((prev) => prev.filter((a) => a !== filter.value));
        break;
    }
  };

  const clearAllFilters = () => {
    setSelectedTypes([]);
    setSelectedSectors([]);
    setMinRating(null);
    setSelectedAvailability([]);
    setSearchQuery('');
  };

  return (
    <MarketingLayout
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Professional Network' },
      ]}
      showSidebar={true}
    >
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-[#F7FAFC] to-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <h1
            className="text-3xl lg:text-4xl font-bold mb-4"
            style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
          >
            Kealee Network
          </h1>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Find verified contractors, architects, engineers, and suppliers in the DC-Baltimore corridor.
          </p>

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-3xl mx-auto">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by trade, name, or specialty..."
                className="w-full pl-12 pr-4 py-4 text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
              />
            </div>
            <button
              className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold text-white transition-colors"
              style={{ backgroundColor: brand.teal }}
            >
              <Search className="w-5 h-5" />
              Search
            </button>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="sticky top-16 z-30 bg-white border-b border-gray-200 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Desktop Filters */}
          <div className="hidden md:flex items-center gap-3 flex-wrap">
            {/* Professional Type */}
            <select
              value=""
              onChange={(e) => {
                const val = e.target.value as ProfessionalType;
                if (val && !selectedTypes.includes(val)) {
                  setSelectedTypes([...selectedTypes, val]);
                }
              }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="">Professional Type</option>
              {Object.entries(PROFESSIONAL_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            {/* Sector */}
            <select
              value=""
              onChange={(e) => {
                const val = e.target.value as Sector;
                if (val && !selectedSectors.includes(val)) {
                  setSelectedSectors([...selectedSectors, val]);
                }
              }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="">Sector</option>
              {Object.entries(SECTOR_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            {/* Rating */}
            <select
              value={minRating || ''}
              onChange={(e) => setMinRating(e.target.value ? Number(e.target.value) : null)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="">Rating</option>
              <option value="4">4+ Stars</option>
              <option value="4.5">4.5+ Stars</option>
              <option value="5">5 Stars</option>
            </select>

            {/* Availability */}
            <select
              value=""
              onChange={(e) => {
                const val = e.target.value as AvailabilityStatus;
                if (val && !selectedAvailability.includes(val)) {
                  setSelectedAvailability([...selectedAvailability, val]);
                }
              }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="">Availability</option>
              <option value="available">Available Now</option>
              <option value="busy">Limited Availability</option>
            </select>

            <div className="flex-1" />

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="best_match">Best Match</option>
              <option value="highest_rated">Highest Rated</option>
              <option value="most_jobs">Most Jobs</option>
            </select>
          </div>

          {/* Mobile Filter Button */}
          <div className="md:hidden">
            <button
              onClick={() => setShowFilters(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFilters.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded text-xs">
                  {activeFilters.length}
                </span>
              )}
            </button>
          </div>

          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {activeFilters.map((filter, i) => (
                <button
                  key={i}
                  onClick={() => removeFilter(filter)}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-full text-sm text-gray-700 hover:bg-gray-200"
                >
                  {filter.label}
                  <X className="w-3.5 h-3.5" />
                </button>
              ))}
              <button
                onClick={clearAllFilters}
                className="text-sm text-gray-500 hover:text-gray-700 underline ml-2"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Results */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Fair Bid Banner */}
          <div
            className="rounded-xl p-4 mb-6 flex items-center gap-3"
            style={{ backgroundColor: `${brand.teal}10` }}
          >
            <RotateCw className="w-5 h-5 flex-shrink-0" style={{ color: brand.teal }} />
            <p className="text-sm text-gray-700">
              <span className="font-semibold" style={{ color: brand.teal }}>
                Fair Bid Rotation:
              </span>{' '}
              All qualified professionals get equal opportunity to bid on projects. No pay-to-play.
            </p>
          </div>

          {/* Error State */}
          {error && (
            <div className="rounded-xl p-4 mb-6 flex items-center gap-3 bg-red-50 border border-red-200">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
              <div className="flex-1">
                <p className="text-sm text-red-700 font-medium">Unable to load contractors</p>
                <p className="text-xs text-red-600 mt-0.5">{error}</p>
              </div>
              <button
                onClick={fetchContractors}
                className="text-sm font-medium text-red-600 hover:text-red-800 underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-4" />
              <p className="text-sm text-gray-500">Loading contractors...</p>
            </div>
          )}

          {/* Results (only show when not loading) */}
          {!loading && (
            <>
              {/* Results Count */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-semibold">{filteredProfiles.length}</span>{' '}
                  {totalResults > filteredProfiles.length ? `of ${totalResults} ` : ''}professional{filteredProfiles.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Profile Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProfiles.map((profile, index) => (
                  <motion.div
                    key={profile.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <ProfileCard profile={profile} />
                  </motion.div>
                ))}
              </div>

              {filteredProfiles.length === 0 && !error && (
                <div className="text-center py-16">
                  <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No contractors found</h3>
                  <p className="text-gray-500 mb-4">Try adjusting your filters or search query.</p>
                  <button
                    onClick={clearAllFilters}
                    className="text-teal-600 font-medium hover:underline"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </>
          )}

          {/* Pagination */}
          {!loading && filteredProfiles.length > 0 && (
            <div className="flex items-center justify-center gap-2 mt-12">
              <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
                Previous
              </button>
              <button
                className="px-4 py-2 rounded-lg text-sm text-white"
                style={{ backgroundColor: brand.teal }}
              >
                1
              </button>
              <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
                2
              </button>
              <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
                3
              </button>
              <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
                Next
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Mobile Filters Bottom Sheet */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40 md:hidden"
              onClick={() => setShowFilters(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl max-h-[80vh] overflow-y-auto md:hidden"
            >
              <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between">
                <h3 className="font-semibold text-lg">Filters</h3>
                <button onClick={() => setShowFilters(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-6">
                {/* Professional Type */}
                <div>
                  <h4 className="font-medium mb-3">Professional Type</h4>
                  <div className="space-y-2">
                    {Object.entries(PROFESSIONAL_TYPE_LABELS).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedTypes.includes(key as ProfessionalType)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTypes([...selectedTypes, key as ProfessionalType]);
                            } else {
                              setSelectedTypes(selectedTypes.filter((t) => t !== key));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Sector */}
                <div>
                  <h4 className="font-medium mb-3">Sector</h4>
                  <div className="space-y-2">
                    {Object.entries(SECTOR_LABELS).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedSectors.includes(key as Sector)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSectors([...selectedSectors, key as Sector]);
                            } else {
                              setSelectedSectors(selectedSectors.filter((s) => s !== key));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Apply Button */}
                <button
                  onClick={() => setShowFilters(false)}
                  className="w-full py-3 rounded-lg font-semibold text-white"
                  style={{ backgroundColor: brand.teal }}
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

// Profile Card Component
function ProfileCard({ profile }: { profile: NetworkProfile }) {
  const availConfig = availabilityConfig[profile.availability];

  return (
    <Link
      href={`/network/${profile.slug}`}
      className="block bg-white rounded-xl overflow-hidden transition-all hover:shadow-lg"
      style={{ boxShadow: shadows.level1 }}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          {/* Logo Placeholder */}
          <div
            className="w-14 h-14 rounded-lg flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
            style={{ backgroundColor: brand.navy, fontFamily: '"Clash Display", sans-serif' }}
          >
            {profile.businessName.substring(0, 2).toUpperCase()}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3
              className="font-bold text-base truncate mb-0.5"
              style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: brand.navy }}
            >
              {profile.businessName}
            </h3>
            <p className="text-xs text-gray-500 truncate">{profile.principalName}</p>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-xs font-medium px-2 py-0.5 rounded"
                style={{ backgroundColor: brand.gray[100], color: brand.gray[600] }}
              >
                {PROFESSIONAL_TYPE_LABELS[profile.type]}
              </span>
              {profile.badges.includes('verified') && (
                <BadgeCheck className="w-4 h-4 text-blue-500" />
              )}
            </div>
          </div>

          {/* Rating */}
          <div className="text-right flex-shrink-0">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-current" style={{ color: brand.orange }} />
              <span
                className="font-bold text-sm"
                style={{ fontFamily: '"JetBrains Mono", monospace', color: brand.navy }}
              >
                {profile.rating.toFixed(1)}
              </span>
            </div>
            <p className="text-xs text-gray-500">({profile.reviewCount})</p>
          </div>
        </div>

        {/* Trades */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {profile.trades.slice(0, 3).map((trade) => (
            <span
              key={trade}
              className="text-xs px-2 py-0.5 rounded"
              style={{ backgroundColor: `${brand.teal}15`, color: '#1A8F8F' }}
            >
              {trade}
            </span>
          ))}
          {profile.trades.length > 3 && (
            <span className="text-xs text-gray-500">+{profile.trades.length - 3}</span>
          )}
        </div>

        {/* Location */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {profile.location.city}, {profile.location.state}
          </span>
          {profile.stats.responseTime && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {profile.stats.responseTime}
            </span>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {profile.badges.includes('licensed') && (
            <span className="flex items-center gap-1 text-xs text-green-700">
              <CheckCircle2 className="w-3.5 h-3.5" /> Licensed
            </span>
          )}
          {profile.badges.includes('insured') && (
            <span className="flex items-center gap-1 text-xs text-green-700">
              <CheckCircle2 className="w-3.5 h-3.5" /> Insured
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span
            className="text-xs font-medium px-2 py-1 rounded"
            style={{ backgroundColor: availConfig.bg, color: availConfig.color }}
          >
            {availConfig.label}
          </span>
          <span
            className="text-sm font-semibold flex items-center gap-1"
            style={{ color: brand.orange }}
          >
            View Profile
            <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
