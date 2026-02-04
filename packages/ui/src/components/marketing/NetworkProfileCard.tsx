// packages/ui/src/components/marketing/NetworkProfileCard.tsx
// Professional profile card for Construction Network search results

'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '../../lib/utils';

export interface NetworkProfileCardProps {
  logo?: string;
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
  availability?: 'available' | 'busy' | 'unavailable';
  ctaHref: string;
  className?: string;
}

const availabilityConfig = {
  available: { label: 'Available Now', color: 'bg-green-100 text-green-700' },
  busy: { label: 'Booking 2+ Weeks', color: 'bg-yellow-100 text-yellow-700' },
  unavailable: { label: 'Fully Booked', color: 'bg-gray-100 text-gray-500' },
};

export const NetworkProfileCard: React.FC<NetworkProfileCardProps> = ({
  logo,
  businessName,
  ownerName,
  type,
  trades,
  rating,
  reviews,
  location,
  distance,
  stats,
  badges = [],
  availability = 'available',
  ctaHref,
  className,
}) => {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-md transition-all duration-200',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        {/* Logo/Avatar */}
        {logo ? (
          <img
            src={logo}
            alt={businessName}
            className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-[#1A2B4A] text-white flex items-center justify-center flex-shrink-0 font-bold text-lg">
            {businessName.split(' ').map(w => w[0]).join('').slice(0, 2)}
          </div>
        )}

        {/* Business Info */}
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-[#1A2B4A] truncate">{businessName}</h4>
            <span className={cn(
              'text-xs px-2 py-0.5 rounded-full flex-shrink-0',
              availabilityConfig[availability].color
            )}>
              {availabilityConfig[availability].label}
            </span>
          </div>
          {ownerName && (
            <p className="text-sm text-gray-500">{ownerName}</p>
          )}
          <p className="text-xs text-gray-400">{type}</p>
        </div>
      </div>

      {/* Rating & Location */}
      <div className="flex items-center justify-between mb-4 text-sm">
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4 text-[#E8793A]" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="font-semibold text-[#1A2B4A]">{rating.toFixed(1)}</span>
          <span className="text-gray-400">({reviews} reviews)</span>
        </div>
        <div className="flex items-center gap-1 text-gray-500">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{location}</span>
          {distance && <span className="text-gray-400">• {distance}</span>}
        </div>
      </div>

      {/* Trades */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {trades.slice(0, 4).map((trade, index) => (
          <span
            key={index}
            className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
          >
            {trade}
          </span>
        ))}
        {trades.length > 4 && (
          <span className="text-xs text-gray-400 px-2 py-1">
            +{trades.length - 4} more
          </span>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
          {stats.projectsCompleted !== undefined && (
            <div className="bg-gray-50 rounded-lg py-2">
              <p className="text-lg font-bold text-[#1A2B4A]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                {stats.projectsCompleted}
              </p>
              <p className="text-[10px] text-gray-500 uppercase">Projects</p>
            </div>
          )}
          {stats.yearsExperience !== undefined && (
            <div className="bg-gray-50 rounded-lg py-2">
              <p className="text-lg font-bold text-[#1A2B4A]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                {stats.yearsExperience}
              </p>
              <p className="text-[10px] text-gray-500 uppercase">Years</p>
            </div>
          )}
          {stats.responseTime && (
            <div className="bg-gray-50 rounded-lg py-2">
              <p className="text-lg font-bold text-[#1A2B4A]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                {stats.responseTime}
              </p>
              <p className="text-[10px] text-gray-500 uppercase">Response</p>
            </div>
          )}
        </div>
      )}

      {/* Badges */}
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {badges.map((badge, index) => (
            <span
              key={index}
              className="text-xs bg-[#2ABFBF]/10 text-[#2ABFBF] px-2 py-1 rounded-full font-medium"
            >
              {badge}
            </span>
          ))}
        </div>
      )}

      {/* CTA */}
      <Link
        href={ctaHref}
        className="block w-full py-2.5 text-center rounded-lg border-2 border-[#1A2B4A] text-[#1A2B4A] font-semibold text-sm hover:bg-[#1A2B4A] hover:text-white transition-colors"
      >
        View Profile
      </Link>
    </div>
  );
};

export default NetworkProfileCard;
