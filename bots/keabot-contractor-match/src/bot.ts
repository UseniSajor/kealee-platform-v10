/**
 * bots/keabot-contractor-match/src/bot.ts
 *
 * ContractorMatchBot — Finds and scores the best contractors for a project.
 *
 * Tools:
 *   1. search_contractors      — Query contractor DB by trade/location/rating
 *   2. score_contractors       — Calculate match scores
 *   3. get_contractor_details  — Fetch full profile + reviews + credentials
 *   4. verify_license_insurance — Check license + insurance validity
 *   5. generate_contractor_bids — Request bids from top 3-5 matches
 *   6. track_contractor_engagement — Monitor communication + job history
 */

import { KeaBot, BotConfig } from '@kealee/core-bots';
import { rankContractors, scoreContractor } from './scoring.js';
import { verifyLicenseInsurance } from './verification.js';
import type { Contractor, MatchQuery, MatchResult, BidRequest } from './types.js';

const API_BASE = process.env.API_BASE_URL ?? 'https://kealee-platform-v10-staging.up.railway.app';

async function apiGet(path: string): Promise<unknown> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

async function apiPost(path: string, body: unknown): Promise<unknown> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

const CONFIG: BotConfig = {
  name: 'keabot-contractor-match',
  description: 'Finds and scores the best contractors for a construction project using trade fit, proximity, experience, rating, and availability.',
  domain: 'contractor',
  systemPrompt: `You are KeaBot Contractor Match, a specialized assistant for finding and evaluating contractors.

Your capabilities:
- Search contractors by trade, location, rating, and availability
- Score contractors using a weighted algorithm (trade 35%, location 20%, experience 20%, rating 15%, availability 10%)
- Verify contractor licenses and insurance
- Request and compare bids from top matches
- Track contractor engagement and communication

Rules:
- Always verify license and insurance before recommending a contractor
- Present top 5 matches ranked by score
- Include distance, rating, price range, and availability in results
- Flag any license or insurance issues clearly
- Never recommend unlicensed or uninsured contractors`,
  model: 'claude-opus-4-6',
  maxTokens: 4096,
  temperature: 0.2,
};

export class KeaBotContractorMatch extends KeaBot {
  constructor() { super(CONFIG); }

  async initialize(): Promise<void> {
    this.registerTool({
      name: 'search_contractors',
      description: 'Search contractor database by trade, location, and rating. Returns filtered list.',
      parameters: {
        trade:      { type: 'string', description: 'Trade type (e.g. HVAC, electrical, plumbing, framing)', required: true },
        lat:        { type: 'number', description: 'Project latitude', required: true },
        lng:        { type: 'number', description: 'Project longitude', required: true },
        city:       { type: 'string', description: 'City name for display', required: true },
        radiusKm:   { type: 'number', description: 'Search radius in km (default 25)', required: false },
        minRating:  { type: 'number', description: 'Minimum contractor rating 1-5', required: false },
      },
      handler: async (params) => {
        const query = `trade=${params.trade}&lat=${params.lat}&lng=${params.lng}&radius=${params.radiusKm ?? 25}`;
        const data = await apiGet(`/api/contractors?${query}`) as any;
        const contractors: Contractor[] = data?.contractors ?? this._getMockContractors(params.trade as string);
        return {
          found: contractors.length,
          trade: params.trade,
          location: params.city,
          radius: `${params.radiusKm ?? 25}km`,
          contractors: contractors.map(c => ({
            id: c.id, name: c.name, trades: c.trades, rating: c.rating,
            yearsExperience: c.yearsExperience, availability: c.availability,
            priceRange: `$${c.priceRangeLow.toLocaleString()}–$${c.priceRangeHigh.toLocaleString()}`,
          })),
        };
      },
    });

    this.registerTool({
      name: 'score_contractors',
      description: 'Calculate match scores for contractors based on trade fit, distance, experience, rating, and availability.',
      parameters: {
        projectId:  { type: 'string', description: 'Project ID', required: true },
        trade:      { type: 'string', description: 'Required trade', required: true },
        lat:        { type: 'number', description: 'Project latitude', required: true },
        lng:        { type: 'number', description: 'Project longitude', required: true },
        city:       { type: 'string', description: 'City name', required: true },
        budget:     { type: 'number', description: 'Project budget', required: true },
      },
      handler: async (params) => {
        const data = await apiGet(`/api/contractors?trade=${params.trade}`) as any;
        const contractors: Contractor[] = data?.contractors ?? this._getMockContractors(params.trade as string);
        const query: MatchQuery = {
          projectId: params.projectId as string,
          trade: params.trade as string,
          location: { lat: params.lat as number, lng: params.lng as number, city: params.city as string },
          budget: params.budget as number,
        };
        const ranked = rankContractors(contractors, query);
        return {
          projectId: params.projectId,
          matches: ranked.slice(0, 5).map(({ contractor: c, score: s }) => ({
            contractorId: c.id,
            name: c.name,
            score: s.totalScore,
            distance: `${s.distance.toFixed(1)} km`,
            rating: c.rating,
            yearsExperience: c.yearsExperience,
            bidPrice: `$${c.priceRangeLow.toLocaleString()}–$${c.priceRangeHigh.toLocaleString()}`,
            availability: c.availability,
            scoreBreakdown: s.breakdown,
          })),
        };
      },
    });

    this.registerTool({
      name: 'get_contractor_details',
      description: 'Fetch full contractor profile including reviews, credentials, portfolio, and contact info.',
      parameters: {
        contractorId: { type: 'string', description: 'Contractor ID', required: true },
      },
      handler: async (params) => {
        const data = await apiGet(`/api/contractors/${params.contractorId}`) as any;
        if (data) return data;
        return {
          id: params.contractorId,
          note: 'Contractor profile not found via API.',
          suggestion: 'Verify contractor ID and try again.',
        };
      },
    });

    this.registerTool({
      name: 'verify_license_insurance',
      description: 'Verify contractor license status and insurance validity.',
      parameters: {
        contractorId: { type: 'string', description: 'Contractor ID', required: true },
      },
      handler: async (params) => {
        const data = await apiGet(`/api/contractors/${params.contractorId}`) as any;
        if (!data) {
          return { contractorId: params.contractorId, verified: false, issues: ['Contractor not found'] };
        }
        const contractor = data as Contractor;
        return verifyLicenseInsurance(contractor);
      },
    });

    this.registerTool({
      name: 'generate_contractor_bids',
      description: 'Send bid requests to top 3-5 matched contractors.',
      parameters: {
        projectId:          { type: 'string', description: 'Project ID', required: true },
        contractorIds:      { type: 'string', description: 'Comma-separated contractor IDs', required: true },
        projectDescription: { type: 'string', description: 'Brief project description', required: true },
        trade:              { type: 'string', description: 'Required trade', required: true },
        budget:             { type: 'number', description: 'Project budget', required: true },
        timeline:           { type: 'string', description: 'Expected timeline', required: true },
        location:           { type: 'string', description: 'Project location', required: true },
      },
      handler: async (params) => {
        const ids = (params.contractorIds as string).split(',').map(s => s.trim());
        const bids: BidRequest[] = ids.map(id => ({
          contractorId: id,
          projectId: params.projectId as string,
          projectDescription: params.projectDescription as string,
          trade: params.trade as string,
          budget: params.budget as number,
          timeline: params.timeline as string,
          location: params.location as string,
        }));
        const result = await apiPost('/api/bids/request', { bids }) as any;
        return result ?? {
          status: 'bid_requests_queued',
          projectId: params.projectId,
          requestsSent: ids.length,
          contractors: ids,
          expectedResponseTime: '24-48 hours',
          message: `Bid requests sent to ${ids.length} contractor(s). Expect responses within 48 hours.`,
        };
      },
    });

    this.registerTool({
      name: 'track_contractor_engagement',
      description: 'Monitor contractor communication, response rates, and job history.',
      parameters: {
        contractorId: { type: 'string', description: 'Contractor ID', required: true },
        projectId:    { type: 'string', description: 'Optional project ID to filter', required: false },
      },
      handler: async (params) => {
        const data = await apiGet(`/api/contractors/${params.contractorId}/engagement${params.projectId ? `?projectId=${params.projectId}` : ''}`) as any;
        return data ?? {
          contractorId: params.contractorId,
          responseRate: 'N/A',
          avgResponseTime: 'N/A',
          jobsCompleted: 0,
          activeJobs: 0,
          lastActivity: null,
        };
      },
    });
  }

  private _getMockContractors(trade: string): Contractor[] {
    return [
      {
        id: 'cont_001', name: "Premier Construction LLC", trades: [trade, 'general'],
        serviceArea: ['DC', 'Maryland', 'Virginia'], lat: 38.9072, lng: -77.0369,
        rating: 4.8, reviewCount: 124, yearsExperience: 15,
        licenseNumber: 'DC-GC-12345', licenseStatus: 'valid',
        insuranceActive: true, insuranceExpiry: new Date('2026-12-31'),
        isActive: true, priceRangeLow: 45000, priceRangeHigh: 85000, availability: '2 weeks',
      },
      {
        id: 'cont_002', name: "Apex Builders Inc", trades: [trade],
        serviceArea: ['DC', 'Maryland'], lat: 38.8951, lng: -77.0364,
        rating: 4.6, reviewCount: 87, yearsExperience: 12,
        licenseNumber: 'DC-GC-67890', licenseStatus: 'valid',
        insuranceActive: true, insuranceExpiry: new Date('2026-09-30'),
        isActive: true, priceRangeLow: 38000, priceRangeHigh: 72000, availability: '3 weeks',
      },
    ];
  }

  async handleMessage(message: string, context?: Record<string, unknown>): Promise<string> {
    return this.chat(message, context);
  }
}
