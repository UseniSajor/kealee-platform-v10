/**
 * Regression tests for contractor matching scoring.
 * Snapshots of the original bots/keabot-contractor-match/src/scoring.ts behaviour.
 */

import { describe, it, expect } from 'vitest';
import { haversineDistance, scoreContractor, rankContractors } from '../scoring/contractor';
import type { Contractor, MatchQuery } from '../scoring/contractor-types';

const DC_LAT = 38.9072;
const DC_LNG = -77.0369;

function makeContractor(overrides: Partial<Contractor> = {}): Contractor {
  return {
    id: 'c1',
    name: 'Test Contractor',
    trades: ['framing'],
    serviceArea: ['DC'],
    lat: 38.9072,
    lng: -77.0369,
    rating: 4.5,
    reviewCount: 20,
    yearsExperience: 10,
    licenseNumber: 'DC-12345',
    licenseStatus: 'valid',
    insuranceActive: true,
    insuranceExpiry: new Date(Date.now() + 365 * 86400000),
    isActive: true,
    priceRangeLow: 50,
    priceRangeHigh: 150,
    availability: '1 week',
    ...overrides,
  };
}

const baseQuery: MatchQuery = {
  projectId: 'p1',
  trade: 'framing',
  location: { lat: DC_LAT, lng: DC_LNG, city: 'Washington DC' },
  budget: 100_000,
  radiusKm: 25,
};

describe('haversineDistance', () => {
  it('returns 0 for same coordinates', () => {
    expect(haversineDistance(38.9, -77.0, 38.9, -77.0)).toBe(0);
  });

  it('returns ~5.5km for DC to Arlington VA (approximate)', () => {
    const dist = haversineDistance(38.9072, -77.0369, 38.8816, -77.0910);
    expect(dist).toBeGreaterThan(4);
    expect(dist).toBeLessThan(8);
  });

  it('is symmetric', () => {
    const a = haversineDistance(38.9, -77.0, 39.0, -77.1);
    const b = haversineDistance(39.0, -77.1, 38.9, -77.0);
    expect(Math.abs(a - b)).toBeLessThan(0.001);
  });
});

describe('scoreContractor — weight total', () => {
  it('scores a perfect match near 100', () => {
    const contractor = makeContractor({
      trades: ['framing'],
      lat: DC_LAT,
      lng: DC_LNG,
      rating: 5,
      yearsExperience: 25,
      availability: 'immediate',
    });
    const score = scoreContractor(contractor, baseQuery);
    expect(score.totalScore).toBeGreaterThanOrEqual(95);
  });

  it('penalizes inexperienced contractors', () => {
    const veteran = makeContractor({ yearsExperience: 20 });
    const junior  = makeContractor({ yearsExperience: 1 });
    const vScore = scoreContractor(veteran, baseQuery);
    const jScore = scoreContractor(junior,  baseQuery);
    expect(vScore.totalScore).toBeGreaterThan(jScore.totalScore);
  });

  it('penalizes trade mismatches heavily', () => {
    const matched  = makeContractor({ trades: ['framing'] });
    const unrelated = makeContractor({ trades: ['painting'] });
    const mScore = scoreContractor(matched,   baseQuery);
    const uScore = scoreContractor(unrelated, baseQuery);
    expect(mScore.totalScore).toBeGreaterThan(uScore.totalScore + 25);
  });

  it('accepts related trade with partial score', () => {
    const related = makeContractor({ trades: ['carpentry'] }); // related to framing
    const score = scoreContractor(related, baseQuery);
    expect(score.breakdown.tradeMatch).toBe(70);
  });
});

describe('rankContractors', () => {
  it('excludes inactive contractors', () => {
    const inactive = makeContractor({ isActive: false });
    const results = rankContractors([inactive], baseQuery);
    expect(results).toHaveLength(0);
  });

  it('excludes contractors with invalid license', () => {
    const expired = makeContractor({ licenseStatus: 'expired' });
    const results = rankContractors([expired], baseQuery);
    expect(results).toHaveLength(0);
  });

  it('excludes contractors outside radius', () => {
    const farAway = makeContractor({ lat: 40.7128, lng: -74.0060 }); // New York
    const results = rankContractors([farAway], baseQuery);
    expect(results).toHaveLength(0);
  });

  it('returns top 10 maximum', () => {
    const contractors = Array.from({ length: 15 }, (_, i) =>
      makeContractor({ id: `c${i}`, lat: DC_LAT + i * 0.01, lng: DC_LNG }),
    );
    const results = rankContractors(contractors, baseQuery);
    expect(results.length).toBeLessThanOrEqual(10);
  });

  it('sorts by descending score', () => {
    const high = makeContractor({ id: 'h', yearsExperience: 25, rating: 5, availability: 'immediate' });
    const low  = makeContractor({ id: 'l', yearsExperience: 1,  rating: 2, availability: '3 months'  });
    const results = rankContractors([low, high], baseQuery);
    expect(results[0].contractor.id).toBe('h');
  });
});
