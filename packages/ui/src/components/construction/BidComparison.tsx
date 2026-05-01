// packages/ui/src/components/construction/BidComparison.tsx
// Bid comparison card — contractor bid metrics with AI recommendation

import React from 'react';
import { cn } from '../../lib/utils';
import { Star, MapPin, CheckCircle, AlertTriangle, Award, User } from 'lucide-react';

export interface BidItem {
  contractorId: string;
  contractorName: string;
  logoUrl?: string;
  location: string;
  distanceMiles?: number;
  rating: number;
  reviewCount: number;
  bidAmount: number;
  avgBidAmount?: number;
  timelineDays: number;
  avgTimelineDays?: number;
  score: number; // 0–100 AI score
  isRecommended?: boolean;
  strengths?: string[];
  considerations?: string[];
  onViewProfile?: () => void;
  onAwardContract?: () => void;
}

export interface BidComparisonProps {
  bid: BidItem;
  className?: string;
}

function ScoreBar({ value, avg, color }: { value: number; avg: number; color: string }) {
  return (
    <div className="w-full">
      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn('absolute inset-y-0 left-0 rounded-full', color)}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
      {avg > 0 && (
        <p className="text-xs text-gray-500 mt-0.5">
          vs {typeof avg === 'number' ? avg.toLocaleString() : avg} avg
        </p>
      )}
    </div>
  );
}

export function BidComparison({ bid, className }: BidComparisonProps) {
  const {
    contractorName,
    logoUrl,
    location,
    distanceMiles,
    rating,
    reviewCount,
    bidAmount,
    avgBidAmount,
    timelineDays,
    avgTimelineDays,
    score,
    isRecommended,
    strengths = [],
    considerations = [],
    onViewProfile,
    onAwardContract,
  } = bid;

  const bidVariance = avgBidAmount ? ((bidAmount - avgBidAmount) / avgBidAmount) * 100 : 0;

  return (
    <div
      className={cn(
        'bg-white rounded-xl border shadow-md hover:shadow-lg transition-shadow duration-200',
        isRecommended ? 'border-primary-400 ring-1 ring-primary-200' : 'border-gray-200',
        className
      )}
    >
      {isRecommended && (
        <div className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 rounded-t-xl">
          <Award className="w-4 h-4 text-white" />
          <span className="text-xs font-semibold text-white uppercase tracking-wide">AI Recommended</span>
        </div>
      )}

      <div className="p-5">
        {/* Contractor header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} alt={contractorName} className="w-full h-full object-cover" />
            ) : (
              <User className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{contractorName}</h3>
            <div className="flex items-center gap-3 mt-0.5">
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-warning-400 fill-warning-400" />
                <span className="text-xs text-gray-700 font-medium">{rating.toFixed(1)}</span>
                <span className="text-xs text-gray-400">({reviewCount})</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3" />
                {location}
                {distanceMiles !== undefined && ` · ${distanceMiles} mi`}
              </div>
            </div>
          </div>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
          {/* Bid amount */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Bid Amount</p>
            <p className="text-lg font-bold text-gray-900">${bidAmount.toLocaleString()}</p>
            <ScoreBar
              value={avgBidAmount ? Math.min(100, (1 - bidVariance / 100) * 100) : 70}
              avg={0}
              color="bg-primary-500"
            />
            {avgBidAmount && (
              <p className={cn('text-xs mt-0.5', bidVariance > 0 ? 'text-warning-600' : 'text-success-600')}>
                {bidVariance > 0 ? '+' : ''}{bidVariance.toFixed(0)}% vs avg
              </p>
            )}
          </div>

          {/* Timeline */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Timeline</p>
            <p className="text-lg font-bold text-gray-900">{timelineDays}d</p>
            <ScoreBar
              value={avgTimelineDays ? Math.min(100, (avgTimelineDays / timelineDays) * 70) : 60}
              avg={0}
              color="bg-primary-400"
            />
            {avgTimelineDays && (
              <p className="text-xs text-gray-500 mt-0.5">vs {avgTimelineDays}d avg</p>
            )}
          </div>

          {/* Score */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">AI Score</p>
            <p className="text-lg font-bold text-gray-900">{score}/100</p>
            <ScoreBar value={score} avg={0} color={score >= 80 ? 'bg-success-500' : score >= 60 ? 'bg-warning-400' : 'bg-error-400'} />
          </div>
        </div>

        {/* Strengths & Considerations */}
        {(strengths.length > 0 || considerations.length > 0) && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {strengths.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">Strengths</p>
                <ul className="space-y-1">
                  {strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                      <CheckCircle className="w-3.5 h-3.5 text-success-500 shrink-0 mt-0.5" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {considerations.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">Considerations</p>
                <ul className="space-y-1">
                  {considerations.map((c, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                      <AlertTriangle className="w-3.5 h-3.5 text-warning-500 shrink-0 mt-0.5" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
          {onViewProfile && (
            <button
              onClick={onViewProfile}
              className="flex-1 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors font-medium"
            >
              View Profile
            </button>
          )}
          {onAwardContract && (
            <button
              onClick={onAwardContract}
              className="flex-1 px-3 py-2 text-sm bg-gradient-to-r from-secondary-500 to-secondary-400 hover:from-secondary-600 hover:to-secondary-500 text-white rounded-lg transition-all font-semibold shadow-sm hover:shadow-md flex items-center justify-center gap-1.5"
            >
              Award Contract
              <Award className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
