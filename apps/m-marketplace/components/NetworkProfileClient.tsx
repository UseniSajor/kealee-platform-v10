// apps/m-marketplace/components/NetworkProfileClient.tsx
// Client-side interactive business profile component

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MarketingLayout, PriceDisplay, MarketingBadge } from '@kealee/ui';

interface ProfileData {
  id: string;
  slug: string;
  businessName: string;
  principalName?: string;
  type: string;
  typeLabel: string;
  trades: string[];
  sectors: string[];
  rating: number;
  reviewCount: number;
  location: {
    city: string;
    state: string;
    serviceRadius: number;
  };
  stats: {
    projectsCompleted: number;
    yearsExperience: number;
    responseTime: string;
  };
  badges: string[];
  availability: 'available' | 'busy' | 'unavailable';
  memberSince: string;
  verified: {
    licensed: boolean;
    insured: boolean;
    backgroundChecked: boolean;
  };
  bio?: string;
  specialties?: string[];
  services?: {
    id: string;
    name: string;
    description: string;
    priceRange?: { min: number; max: number; unit: string };
    popular?: boolean;
  }[];
  portfolio?: {
    id: string;
    title: string;
    description: string;
    images: string[];
    completedDate: string;
    projectType: string;
    sector: string;
    value?: number;
    location: string;
  }[];
  reviews?: {
    id: string;
    rating: number;
    title: string;
    content: string;
    authorName: string;
    authorType: string;
    projectType: string;
    createdAt: string;
    verified: boolean;
  }[];
  credentials?: {
    type: string;
    name: string;
    issuedBy: string;
    number?: string;
    expirationDate?: string;
    verified: boolean;
  }[];
}

interface NetworkProfileClientProps {
  profile: ProfileData;
}

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'services', label: 'Services & Pricing' },
  { id: 'credentials', label: 'Credentials' },
];

const availabilityConfig = {
  available: { label: 'Available Now', color: 'bg-green-100 text-green-700' },
  busy: { label: 'Booking 2+ Weeks', color: 'bg-yellow-100 text-yellow-700' },
  unavailable: { label: 'Fully Booked', color: 'bg-gray-100 text-gray-500' },
};

export function NetworkProfileClient({ profile }: NetworkProfileClientProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`w-5 h-5 ${i < Math.floor(rating) ? 'text-[#E8793A]' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  const renderRatingBreakdown = () => {
    if (!profile.reviews || profile.reviews.length === 0) return null;

    const breakdown = [5, 4, 3, 2, 1].map((stars) => {
      const count = profile.reviews?.filter((r) => Math.floor(r.rating) === stars).length || 0;
      const percentage = profile.reviews ? (count / profile.reviews.length) * 100 : 0;
      return { stars, count, percentage };
    });

    return (
      <div className="space-y-2">
        {breakdown.map(({ stars, count, percentage }) => (
          <div key={stars} className="flex items-center gap-2">
            <span className="text-sm text-gray-600 w-8">{stars} star</span>
            <div className="flex-grow h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#E8793A] rounded-full"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-sm text-gray-500 w-8">{count}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <MarketingLayout
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Network', href: '/network' },
        { label: profile.businessName, href: `/network/${profile.slug}` },
      ]}
      showSearch={false}
    >
      {/* Cover Photo Banner */}
      <div className="h-48 md:h-64 bg-gradient-to-r from-[#4A90D9] to-[#2ABFBF] relative">
        <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10" />
      </div>

      {/* Profile Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6 -mt-12 md:-mt-16 pb-6">
            {/* Logo */}
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl bg-white shadow-lg border-4 border-white flex items-center justify-center text-3xl md:text-4xl font-bold text-[#4A90D9]">
              {profile.businessName.split(' ').map((w) => w[0]).join('').slice(0, 2)}
            </div>

            {/* Info */}
            <div className="flex-grow">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-[#4A90D9]">
                  {profile.businessName}
                </h1>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-medium ${
                    availabilityConfig[profile.availability].color
                  }`}
                >
                  {availabilityConfig[profile.availability].label}
                </span>
              </div>

              {profile.principalName && (
                <p className="text-gray-600 mb-1">{profile.principalName}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                <span className="font-medium text-[#4A90D9]">{profile.typeLabel}</span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  {profile.location.city}, {profile.location.state}
                </span>
                <span>Member since {profile.memberSince}</span>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex">{renderStars(profile.rating)}</div>
                <span className="font-bold text-[#4A90D9]">{profile.rating.toFixed(1)}</span>
                <span className="text-gray-500">({profile.reviewCount} reviews)</span>
              </div>

              {/* Trade Tags */}
              <div className="flex flex-wrap gap-2">
                {profile.trades.slice(0, 5).map((trade) => (
                  <span
                    key={trade}
                    className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                  >
                    {trade}
                  </span>
                ))}
                {profile.trades.length > 5 && (
                  <span className="text-xs text-gray-400 px-2 py-1">
                    +{profile.trades.length - 5} more
                  </span>
                )}
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 md:pb-2">
              <button className="px-6 py-3 bg-[#E8793A] text-white font-semibold rounded-lg hover:bg-[#d16a2f] transition-colors">
                Request Quote
              </button>
              <button className="px-6 py-3 bg-[#4A90D9] text-white font-semibold rounded-lg hover:bg-[#4A90D9]/90 transition-colors">
                Invite to Bid
              </button>
              <button className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors">
                Message
              </button>
            </div>
          </div>

          {/* Verification Badges */}
          <div className="flex flex-wrap items-center gap-4 py-4 border-t border-gray-100">
            {profile.verified.licensed && (
              <span className="flex items-center gap-1.5 text-sm text-green-700">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                Licensed
              </span>
            )}
            {profile.verified.insured && (
              <span className="flex items-center gap-1.5 text-sm text-green-700">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                Insured
              </span>
            )}
            {profile.verified.backgroundChecked && (
              <span className="flex items-center gap-1.5 text-sm text-green-700">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                Background Checked
              </span>
            )}
            <div className="flex-grow" />
            {profile.badges.map((badge) => (
              <MarketingBadge key={badge} text={badge} color="teal" size="sm" variant="soft" />
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto -mb-px">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-[#4A90D9] text-[#4A90D9]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-gray-50 py-8 min-h-[50vh]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid lg:grid-cols-3 gap-8"
            >
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Bio */}
                {profile.bio && (
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-[#4A90D9] mb-3">About</h2>
                    <p className="text-gray-600 leading-relaxed">{profile.bio}</p>
                  </div>
                )}

                {/* Specialties */}
                {profile.specialties && profile.specialties.length > 0 && (
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-[#4A90D9] mb-3">Specialties</h2>
                    <ul className="grid md:grid-cols-2 gap-2">
                      {profile.specialties.map((specialty) => (
                        <li key={specialty} className="flex items-center gap-2 text-gray-600">
                          <svg
                            className="w-4 h-4 text-[#2ABFBF]"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          {specialty}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Service Area Map Placeholder */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-[#4A90D9] mb-3">Service Area</h2>
                  <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <svg
                        className="w-12 h-12 mx-auto mb-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                        />
                      </svg>
                      <p>
                        Serves within {profile.location.serviceRadius} miles of{' '}
                        {profile.location.city}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-[#4A90D9] mb-4">Quick Stats</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Projects Completed</span>
                      <span
                        className="font-bold text-[#4A90D9]"
                        style={{ fontFamily: '"JetBrains Mono", monospace' }}
                      >
                        {profile.stats.projectsCompleted}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Years Experience</span>
                      <span
                        className="font-bold text-[#4A90D9]"
                        style={{ fontFamily: '"JetBrains Mono", monospace' }}
                      >
                        {profile.stats.yearsExperience}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Avg Response Time</span>
                      <span className="font-bold text-[#2ABFBF]">
                        {profile.stats.responseTime}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sectors */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-[#4A90D9] mb-3">Sectors</h2>
                  <div className="flex flex-wrap gap-2">
                    {profile.sectors.map((sector) => (
                      <span
                        key={sector}
                        className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm capitalize"
                      >
                        {sector}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Portfolio Tab */}
          {activeTab === 'portfolio' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {profile.portfolio && profile.portfolio.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {profile.portfolio.map((project) => (
                    <div
                      key={project.id}
                      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="h-48 bg-gray-200 flex items-center justify-center">
                        <svg
                          className="w-16 h-16 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-[#4A90D9] mb-1">{project.title}</h3>
                        <p className="text-sm text-gray-500 mb-2">{project.projectType}</p>
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>{project.location}</span>
                          <span>
                            {new Date(project.completedDate).toLocaleDateString('en-US', {
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-xl">
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
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No Portfolio Yet</h3>
                  <p className="text-gray-500">This business hasn't added portfolio projects yet.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid lg:grid-cols-3 gap-8"
            >
              {/* Rating Summary */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-center mb-6">
                  <p className="text-5xl font-bold text-[#4A90D9]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                    {profile.rating.toFixed(1)}
                  </p>
                  <div className="flex justify-center my-2">{renderStars(profile.rating)}</div>
                  <p className="text-gray-500">{profile.reviewCount} reviews</p>
                </div>
                {renderRatingBreakdown()}
              </div>

              {/* Reviews List */}
              <div className="lg:col-span-2 space-y-4">
                {profile.reviews && profile.reviews.length > 0 ? (
                  profile.reviews.map((review) => (
                    <div key={review.id} className="bg-white rounded-xl p-6 shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-[#4A90D9]">{review.title}</span>
                            {review.verified && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                Verified
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex">{renderStars(review.rating)}</div>
                          </div>
                        </div>
                        <span className="text-sm text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{review.content}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{review.authorName}</span>
                        <span>•</span>
                        <span>{review.projectType}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 bg-white rounded-xl">
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
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                      />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Reviews Yet</h3>
                    <p className="text-gray-500">Be the first to leave a review.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Services & Pricing Tab */}
          {activeTab === 'services' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {profile.services && profile.services.length > 0 ? (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left py-4 px-6 font-semibold text-[#4A90D9]">Service</th>
                        <th className="text-left py-4 px-6 font-semibold text-[#4A90D9] hidden md:table-cell">
                          Description
                        </th>
                        <th className="text-right py-4 px-6 font-semibold text-[#4A90D9]">Price Range</th>
                        <th className="py-4 px-6"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {profile.services.map((service) => (
                        <tr key={service.id} className="hover:bg-gray-50">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-[#4A90D9]">{service.name}</span>
                              {service.popular && (
                                <span className="text-xs bg-[#E8793A]/10 text-[#E8793A] px-2 py-0.5 rounded-full">
                                  Popular
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 md:hidden mt-1">{service.description}</p>
                          </td>
                          <td className="py-4 px-6 text-gray-600 hidden md:table-cell">
                            {service.description}
                          </td>
                          <td className="py-4 px-6 text-right">
                            {service.priceRange ? (
                              <span
                                className="font-semibold text-[#E8793A]"
                                style={{ fontFamily: '"JetBrains Mono", monospace' }}
                              >
                                ${service.priceRange.min.toLocaleString()} - $
                                {service.priceRange.max.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-gray-500">Contact for quote</span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <button className="px-4 py-2 text-sm font-medium text-[#E8793A] hover:bg-[#E8793A]/10 rounded-lg transition-colors">
                              Request Quote
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-xl">
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No Services Listed</h3>
                  <p className="text-gray-500">Contact this business for pricing information.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Credentials Tab */}
          {activeTab === 'credentials' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid md:grid-cols-2 gap-6"
            >
              {profile.credentials && profile.credentials.length > 0 ? (
                profile.credentials.map((credential, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-green-500"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs uppercase text-gray-500 font-medium mb-1">
                          {credential.type}
                        </p>
                        <h3 className="font-semibold text-[#4A90D9] mb-1">{credential.name}</h3>
                        <p className="text-sm text-gray-600">{credential.issuedBy}</p>
                        {credential.number && (
                          <p className="text-sm text-gray-500 mt-1">{credential.number}</p>
                        )}
                        {credential.expirationDate && (
                          <p className="text-sm text-gray-400 mt-1">
                            Expires: {new Date(credential.expirationDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      {credential.verified && (
                        <span className="flex items-center gap-1 text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="md:col-span-2 text-center py-16 bg-white rounded-xl">
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    No Credentials Listed
                  </h3>
                  <p className="text-gray-500">
                    This business hasn't added credential information yet.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </MarketingLayout>
  );
}
