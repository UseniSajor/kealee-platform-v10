'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, MapPin, Clock, CheckCircle2, BadgeCheck } from 'lucide-react';
import { brand, shadows } from './brand';
import { Badge } from './Badge';

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
    projects?: number;
    responseTime?: string;
    onTimeRate?: string;
  };
  badges?: string[];
  availability?: 'available' | 'busy' | 'unavailable';
  ctaHref: string;
  className?: string;
}

const availabilityConfig = {
  available: { color: '#38A169', label: 'Available Now', bg: '#E8F5E9' },
  busy: { color: '#DD6B20', label: 'Limited Availability', bg: '#FEF3E8' },
  unavailable: { color: '#E53E3E', label: 'Fully Booked', bg: '#FEE2E2' },
};

export function NetworkProfileCard({
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
  className = '',
}: NetworkProfileCardProps) {
  const availConfig = availabilityConfig[availability];

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link
        href={ctaHref}
        className={`block bg-white rounded-xl overflow-hidden transition-all hover:shadow-lg ${className}`}
        style={{ boxShadow: shadows.level1 }}
      >
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            {/* Logo */}
            {logo ? (
              <img
                src={logo}
                alt={businessName}
                className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div
                className="w-14 h-14 rounded-lg flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
                style={{ backgroundColor: brand.navy, fontFamily: '"Clash Display", sans-serif' }}
              >
                {businessName.substring(0, 2).toUpperCase()}
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3
                className="font-bold text-base truncate mb-0.5"
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: brand.navy }}
              >
                {businessName}
              </h3>
              {ownerName && (
                <p className="text-xs text-gray-500 truncate">{ownerName}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded"
                  style={{ backgroundColor: brand.gray[100], color: brand.gray[600] }}
                >
                  {type}
                </span>
                {badges.includes('verified') && (
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
                  {rating.toFixed(1)}
                </span>
              </div>
              <p className="text-xs text-gray-500">({reviews} reviews)</p>
            </div>
          </div>

          {/* Trades */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {trades.slice(0, 3).map((trade) => (
              <span
                key={trade}
                className="text-xs px-2 py-0.5 rounded"
                style={{ backgroundColor: `${brand.teal}15`, color: '#1A8F8F' }}
              >
                {trade}
              </span>
            ))}
            {trades.length > 3 && (
              <span className="text-xs text-gray-500">+{trades.length - 3} more</span>
            )}
          </div>

          {/* Location & Distance */}
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {location}
            </span>
            {distance && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {distance}
              </span>
            )}
          </div>

          {/* Stats */}
          {stats && (
            <div className="flex items-center gap-4 text-xs text-gray-600 mb-4">
              {stats.projects !== undefined && (
                <span>{stats.projects}+ projects</span>
              )}
              {stats.responseTime && (
                <span>Responds in {stats.responseTime}</span>
              )}
              {stats.onTimeRate && (
                <span>{stats.onTimeRate} on-time</span>
              )}
            </div>
          )}

          {/* Badges Row */}
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {badges.includes('licensed') && (
                <span className="flex items-center gap-1 text-xs text-green-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Licensed
                </span>
              )}
              {badges.includes('insured') && (
                <span className="flex items-center gap-1 text-xs text-green-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Insured
                </span>
              )}
              {badges.includes('background') && (
                <span className="flex items-center gap-1 text-xs text-green-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Background Checked
                </span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <span
              className="text-xs font-medium px-2 py-1 rounded"
              style={{ backgroundColor: availConfig.bg, color: availConfig.color }}
            >
              {availConfig.label}
            </span>
            <span
              className="text-sm font-semibold"
              style={{ color: brand.orange, fontFamily: '"Plus Jakarta Sans", sans-serif' }}
            >
              View Profile &rarr;
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
