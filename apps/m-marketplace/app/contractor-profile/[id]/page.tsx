'use client';

import React, { useState, useEffect } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface ContractorProfile {
  contractorId: string;
  companyName: string;
  contactName: string;
  trades: string[];
  city: string;
  state: string;
  yearsInBusiness: number;
  employeeCount: number;
  isVerified: boolean;
  backgroundCheck: boolean;
  projectsCompleted: number;
  platformRating: number;
  reviewCount: number;
}

interface PublicScore {
  starRating: number;
  confidence: 'low' | 'medium' | 'high';
  label: string;
  breakdown?: {
    onTime: string;
    quality: string;
    responsiveness: string;
  };
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  projectName: string;
  reviewerName: string;
  createdAt: string;
}

interface PortfolioPhoto {
  id: string;
  url: string;
  caption: string;
  projectName: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function StarRating({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-lg' : 'text-sm';
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      stars.push(<span key={i} className={`${sizeClass} text-yellow-400`}>&#9733;</span>);
    } else if (i - 0.5 <= rating) {
      stars.push(<span key={i} className={`${sizeClass} text-yellow-400`}>&#9733;</span>);
    } else {
      stars.push(<span key={i} className={`${sizeClass} text-gray-300`}>&#9733;</span>);
    }
  }
  return <div className="flex items-center gap-0.5">{stars}</div>;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ContractorProfilePage({ params }: { params: { id: string } }) {
  const [profile, setProfile] = useState<ContractorProfile | null>(null);
  const [score, setScore] = useState<PublicScore | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [photos, setPhotos] = useState<PortfolioPhoto[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'portfolio' | 'reviews'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Placeholder — replace with actual API calls
    // fetch(`/api/contractors/${params.id}`)
    // fetch(`/api/scoring/contractors/${params.id}`)
    setLoading(false);
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto">
          {/* Placeholder profile for UI development */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-10 text-white">
              <h1 className="text-3xl font-bold">Contractor Profile</h1>
              <p className="text-blue-200 mt-2">Loading contractor details...</p>
            </div>

            <div className="p-8 text-center text-gray-500">
              <p>Connect the API to display contractor profile data.</p>
              <p className="text-sm text-gray-400 mt-2">
                GET /api/scoring/contractors/{params.id}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-8 text-white">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold">{profile.companyName}</h1>
                <p className="text-blue-200 mt-1">{profile.contactName}</p>
                <p className="text-blue-200 text-sm mt-1">
                  {profile.city}, {profile.state} | {profile.yearsInBusiness} years in business
                </p>
              </div>

              {/* Reliability Badge */}
              <div className="bg-white/10 backdrop-blur rounded-xl px-5 py-3 text-center">
                {score ? (
                  <>
                    <StarRating rating={score.starRating} size="lg" />
                    <div className="text-sm mt-1">{score.starRating}/5</div>
                    <div className="text-xs text-blue-200 mt-0.5">{score.label}</div>
                  </>
                ) : (
                  <div className="text-sm text-blue-200">New to Kealee</div>
                )}
              </div>
            </div>

            {/* Component Breakdown (if enough data) */}
            {score?.breakdown && (
              <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/20">
                <span className="text-sm">
                  On-Time: <strong>{score.breakdown.onTime}</strong>
                </span>
                <span className="text-white/40">|</span>
                <span className="text-sm">
                  Quality: <strong>{score.breakdown.quality}</strong>
                </span>
                <span className="text-white/40">|</span>
                <span className="text-sm">
                  Responsiveness: <strong>{score.breakdown.responsiveness}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100">
            <QuickStat value={profile.projectsCompleted} label="Projects" />
            <QuickStat value={profile.reviewCount} label="Reviews" />
            <QuickStat value={profile.employeeCount || '-'} label="Team Size" />
            <QuickStat
              value={profile.platformRating.toFixed(1)}
              label="Rating"
              suffix="/ 5"
            />
          </div>

          {/* Verified Badges */}
          <div className="px-8 py-4 flex items-center gap-4">
            {profile.isVerified && (
              <Badge icon="&#10003;" label="Licensed" color="green" />
            )}
            <Badge icon="&#10003;" label="Insured" color="green" />
            {profile.backgroundCheck && (
              <Badge icon="&#10003;" label="Background Checked" color="green" />
            )}
            <div className="flex-1" />
            <div className="flex gap-1">
              {profile.trades.map(trade => (
                <span key={trade} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                  {trade}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-lg border border-gray-200 p-1">
          {(['overview', 'portfolio', 'reviews'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'portfolio' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Portfolio</h2>
            {photos.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">
                No portfolio photos uploaded yet
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map(photo => (
                  <div key={photo.id} className="rounded-lg overflow-hidden bg-gray-100 aspect-[4/3]">
                    <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Client Reviews</h2>
            {reviews.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">
                No reviews yet
              </p>
            ) : (
              <div className="space-y-4">
                {reviews.map(review => (
                  <div key={review.id} className="border-b border-gray-50 pb-4 last:border-0">
                    <div className="flex items-center gap-2 mb-1">
                      <StarRating rating={review.rating} size="sm" />
                      <span className="text-xs text-gray-500">{review.reviewerName}</span>
                      <span className="text-xs text-gray-400">|</span>
                      <span className="text-xs text-gray-400">{review.projectName}</span>
                    </div>
                    <p className="text-sm text-gray-700">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">About</h2>
            <p className="text-sm text-gray-600">
              Full contractor overview with services, experience, and capabilities.
              Connect the API to display detailed contractor information.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function QuickStat({ value, label, suffix }: {
  value: string | number; label: string; suffix?: string;
}) {
  return (
    <div className="py-4 text-center">
      <div className="text-xl font-bold text-gray-900">
        {value}
        {suffix && <span className="text-xs text-gray-400 font-normal ml-0.5">{suffix}</span>}
      </div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

function Badge({ icon, label, color }: {
  icon: string; label: string; color: 'green' | 'blue' | 'gray';
}) {
  const colors = {
    green: 'bg-green-50 text-green-700 border-green-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${colors[color]}`}>
      {icon} {label}
    </span>
  );
}
