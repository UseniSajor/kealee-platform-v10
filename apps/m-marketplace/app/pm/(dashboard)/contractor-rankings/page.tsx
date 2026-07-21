'use client';

import React, { useState, useEffect } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface ContractorRanking {
  rank: number;
  contractorId: string;
  companyName: string;
  trades: string[];
  state: string;
  overallScore: number;
  confidence: 'low' | 'medium' | 'high';
  projectsCompleted: number;
  isVerified: boolean;
  topScores: {
    onTime: number;
    quality: number;
    responsiveness: number;
  };
}

interface ContractorDetail {
  contractorId: string;
  companyName: string;
  trades: string[];
  overallScore: number;
  confidence: string;
  components: {
    responsiveness: { score: number; weight: string; label: string };
    uploadCompliance: { score: number; weight: string; label: string };
    bidAccuracy: { score: number; weight: string; label: string };
    scheduleAdherence: { score: number; weight: string; label: string };
    quality: { score: number; weight: string; label: string };
    clientSatisfaction: { score: number; weight: string; label: string };
    safety: { score: number; weight: string; label: string };
  };
}

// ============================================================================
// HELPERS
// ============================================================================

const CONFIDENCE_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-green-100 text-green-700',
};

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-500';
  return 'text-red-500';
}

function getScoreBarColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}

// ============================================================================
// COMPONENT
// ============================================================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function ContractorRankingsPage() {
  const [contractors, setContractors] = useState<ContractorRanking[]>([]);
  const [selectedContractor, setSelectedContractor] = useState<ContractorDetail | null>(null);
  const [tradeFilter, setTradeFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeaderboard() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (tradeFilter) params.set('trade', tradeFilter);
        if (regionFilter) params.set('region', regionFilter);
        params.set('limit', '50');

        const res = await fetch(`${API_BASE}/scoring/leaderboard?${params.toString()}`, {
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          setContractors(data.contractors || []);
        } else {
          console.warn('Leaderboard API returned', res.status);
          setContractors([]);
        }
      } catch (err) {
        console.warn('Failed to load contractor leaderboard:', err);
        setContractors([]);
      } finally {
        setLoading(false);
      }
    }
    loadLeaderboard();
  }, [tradeFilter, regionFilter]);

  const loadContractorDetail = async (contractorId: string) => {
    try {
      const res = await fetch(`${API_BASE}/scoring/contractors/${contractorId}/full`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedContractor(data);
      } else {
        console.warn('Contractor detail API returned', res.status);
        setSelectedContractor(null);
      }
    } catch (err) {
      console.warn('Failed to load contractor detail:', err);
      setSelectedContractor(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Contractor Rankings</h1>
        <p className="text-gray-600 mt-1">
          Reliability scores based on actual behavior — responsiveness, quality, schedule adherence, and more.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          value={tradeFilter}
          onChange={e => setTradeFilter(e.target.value)}
        >
          <option value="">All Trades</option>
          <option value="general">General Contractor</option>
          <option value="electrical">Electrical</option>
          <option value="plumbing">Plumbing</option>
          <option value="hvac">HVAC</option>
          <option value="concrete">Concrete</option>
          <option value="roofing">Roofing</option>
          <option value="painting">Painting</option>
          <option value="framing">Framing</option>
        </select>

        <select
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          value={regionFilter}
          onChange={e => setRegionFilter(e.target.value)}
        >
          <option value="">All Regions</option>
          <option value="CA">California</option>
          <option value="TX">Texas</option>
          <option value="FL">Florida</option>
          <option value="NY">New York</option>
          <option value="IL">Illinois</option>
        </select>
      </div>

      <div className="flex gap-6">
        {/* Leaderboard */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Leaderboard</h2>
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-500">Loading rankings...</div>
          ) : contractors.length === 0 ? (
            <div className="py-12 text-center">
              <div className="text-gray-300 text-4xl mb-3">&#9733;</div>
              <p className="text-gray-500 text-sm">No contractor scores yet</p>
              <p className="text-gray-400 text-xs mt-1">
                Scores build automatically as contractors work on projects
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {contractors.map(contractor => (
                <div
                  key={contractor.contractorId}
                  className="px-5 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => loadContractorDetail(contractor.contractorId)}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
                      {contractor.rank}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {contractor.companyName}
                        </p>
                        {contractor.isVerified && (
                          <span className="text-blue-500 text-xs">&#10003; Verified</span>
                        )}
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${CONFIDENCE_COLORS[contractor.confidence]}`}>
                          {contractor.confidence}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {contractor.trades.slice(0, 3).map(trade => (
                          <span key={trade} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                            {trade}
                          </span>
                        ))}
                        <span className="text-xs text-gray-400">
                          {contractor.projectsCompleted} projects
                        </span>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      <div className={`text-xl font-bold ${getScoreColor(contractor.overallScore)}`}>
                        {contractor.overallScore}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">/ 100</div>
                    </div>
                  </div>

                  {/* Mini score bars */}
                  <div className="flex items-center gap-4 mt-3 pl-12">
                    <MiniBar label="On-Time" score={contractor.topScores.onTime} />
                    <MiniBar label="Quality" score={contractor.topScores.quality} />
                    <MiniBar label="Response" score={contractor.topScores.responsiveness} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedContractor && (
          <div className="w-96 bg-white rounded-xl border border-gray-200 p-5 h-fit sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {selectedContractor.companyName}
            </h3>
            <div className="flex items-center gap-2 mb-4">
              {selectedContractor.trades.map(trade => (
                <span key={trade} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  {trade}
                </span>
              ))}
            </div>

            {/* Overall Score */}
            <div className="text-center mb-6">
              <div className={`text-4xl font-bold ${getScoreColor(selectedContractor.overallScore)}`}>
                {selectedContractor.overallScore}
              </div>
              <div className="text-sm text-gray-500">Overall Score</div>
            </div>

            {/* Component Breakdown */}
            <div className="space-y-3">
              {Object.entries(selectedContractor.components).map(([key, comp]) => (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">{comp.label}</span>
                    <span className={`font-medium ${getScoreColor(comp.score)}`}>
                      {comp.score} ({comp.weight})
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${getScoreBarColor(comp.score)}`}
                      style={{ width: `${comp.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <button className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                Recommend for Project
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function MiniBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex items-center gap-1.5 flex-1">
      <span className="text-[10px] text-gray-400 w-14 text-right">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${getScoreBarColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-[10px] font-medium w-6 ${getScoreColor(score)}`}>{score}</span>
    </div>
  );
}
