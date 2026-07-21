import type { Contractor, ContractorScore, MatchQuery } from './types.js';

const WEIGHTS = {
  tradeMatch: 0.35,
  location: 0.20,
  experience: 0.20,
  rating: 0.15,
  availability: 0.10,
};

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function scoreTradeMatch(contractorTrades: string[], requiredTrade: string): number {
  const norm = (s: string) => s.toLowerCase().trim();
  const target = norm(requiredTrade);
  if (contractorTrades.map(norm).includes(target)) return 100;
  // Check related trades (e.g. "HVAC" relates to "mechanical")
  const related: Record<string, string[]> = {
    hvac: ['mechanical', 'heating', 'cooling', 'air conditioning'],
    electrical: ['low voltage', 'data', 'fire alarm'],
    plumbing: ['mechanical', 'fire suppression'],
    framing: ['carpentry', 'rough carpentry', 'structural'],
    concrete: ['masonry', 'foundations'],
    roofing: ['waterproofing', 'sheet metal'],
  };
  for (const [key, aliases] of Object.entries(related)) {
    if (target === key || aliases.includes(target)) {
      if (contractorTrades.map(norm).some(t => t === key || aliases.includes(t))) return 70;
    }
  }
  return 0;
}

function scoreLocation(distanceKm: number, radiusKm: number): number {
  if (distanceKm <= radiusKm * 0.2) return 100;
  if (distanceKm <= radiusKm * 0.5) return 80;
  if (distanceKm <= radiusKm) return 50;
  return Math.max(0, 100 - (distanceKm / radiusKm) * 100);
}

function scoreExperience(years: number): number {
  if (years >= 20) return 100;
  if (years >= 10) return 85;
  if (years >= 5) return 70;
  if (years >= 2) return 50;
  return 30;
}

function scoreRating(rating: number): number {
  return Math.min(100, (rating / 5) * 100);
}

function scoreAvailability(availabilityStr: string): number {
  const lower = availabilityStr.toLowerCase();
  if (lower.includes('immediate') || lower.includes('now') || lower.includes('today')) return 100;
  const match = lower.match(/(\d+)\s*(day|week|month)/);
  if (!match) return 50;
  const n = parseInt(match[1]);
  const unit = match[2];
  const days = unit === 'day' ? n : unit === 'week' ? n * 7 : n * 30;
  if (days <= 7) return 90;
  if (days <= 14) return 75;
  if (days <= 30) return 60;
  if (days <= 60) return 40;
  return 20;
}

export function scoreContractor(contractor: Contractor, query: MatchQuery): ContractorScore {
  const radiusKm = query.radiusKm ?? 25;
  const distance = haversineDistance(query.location.lat, query.location.lng, contractor.lat, contractor.lng);

  const breakdown = {
    tradeMatch: scoreTradeMatch(contractor.trades, query.trade),
    location: scoreLocation(distance, radiusKm),
    experience: scoreExperience(contractor.yearsExperience),
    rating: scoreRating(contractor.rating),
    availability: scoreAvailability(contractor.availability),
  };

  const totalScore =
    breakdown.tradeMatch * WEIGHTS.tradeMatch +
    breakdown.location * WEIGHTS.location +
    breakdown.experience * WEIGHTS.experience +
    breakdown.rating * WEIGHTS.rating +
    breakdown.availability * WEIGHTS.availability;

  return {
    contractorId: contractor.id,
    totalScore: Math.round(totalScore),
    breakdown,
    distance,
  };
}

export function rankContractors(contractors: Contractor[], query: MatchQuery): Array<{ contractor: Contractor; score: ContractorScore }> {
  return contractors
    .filter(c => c.isActive && c.licenseStatus === 'valid' && c.insuranceActive)
    .filter(c => {
      const dist = haversineDistance(query.location.lat, query.location.lng, c.lat, c.lng);
      return dist <= (query.radiusKm ?? 25);
    })
    .map(contractor => ({ contractor, score: scoreContractor(contractor, query) }))
    .sort((a, b) => b.score.totalScore - a.score.totalScore)
    .slice(0, 10);
}
