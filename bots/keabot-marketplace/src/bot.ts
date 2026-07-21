import { KeaBot, BotConfig, HandoffRequest } from '@kealee/core-bots';

const CONFIG: BotConfig = {
  name: 'keabot-marketplace',
  description: 'Helps with contractor marketplace: finding, vetting, and matching contractors',
  domain: 'marketplace',
  systemPrompt: `You are KeaBot Marketplace, a specialized assistant for the contractor marketplace on the Kealee Platform.
You help with contractor marketplace: finding, vetting, and matching contractors.

Your capabilities:
- Search for contractors by trade, location, availability, and rating
- Match contractor skills and certifications to project requirements
- Verify credentials, insurance, and licensing status
- Compare contractor bids and performance history
- Track contractor performance ratings and reviews

Rules:
- Always call OS service APIs for data operations (never access DB directly)
- If a request falls outside your domain, hand off to the appropriate bot
- Always include verification status when presenting contractor information
- Be concise and action-oriented`,
};

export class KeaBotMarketplace extends KeaBot {
  constructor() {
    super(CONFIG);
  }

  async initialize(): Promise<void> {
    this.registerTool({
      name: 'search_contractors',
      description: 'Search for contractors by trade, location, availability, and minimum rating',
      parameters: {
        trade: { type: 'string', description: 'Trade or specialty (e.g., Plumbing, Electrical, HVAC, General)', required: true },
        location: { type: 'string', description: 'Service area (city, zip, or radius)', required: false },
        minRating: { type: 'number', description: 'Minimum rating (1-5 scale)', required: false },
      },
      handler: async (params) => {
        return {
          query: { trade: params.trade, location: params.location, minRating: params.minRating },
          results: [
            {
              id: 'ctr_001', name: 'Elite Plumbing LLC', trade: params.trade, rating: 4.8, reviewCount: 47,
              location: 'Portland, OR', availability: 'available_in_2_weeks',
              verified: true, insuranceValid: true, licenseValid: true,
              projectsCompleted: 124, avgBidAccuracy: 0.95,
            },
            {
              id: 'ctr_002', name: 'Metro Plumbing Co', trade: params.trade, rating: 4.2, reviewCount: 31,
              location: 'Portland, OR', availability: 'immediately',
              verified: true, insuranceValid: true, licenseValid: true,
              projectsCompleted: 78, avgBidAccuracy: 0.88,
            },
            {
              id: 'ctr_003', name: 'ProPipe Services', trade: params.trade, rating: 4.9, reviewCount: 63,
              location: 'Beaverton, OR', availability: 'available_in_4_weeks',
              verified: true, insuranceValid: true, licenseValid: true,
              projectsCompleted: 201, avgBidAccuracy: 0.97,
            },
          ],
          totalResults: 3,
        };
      },
    });

    this.registerTool({
      name: 'match_skills',
      description: 'Match contractor skills and certifications to specific project requirements',
      parameters: {
        projectId: { type: 'string', description: 'The project ID with requirements', required: true },
        trade: { type: 'string', description: 'Trade to match', required: true },
        certifications: { type: 'string', description: 'Comma-separated required certifications', required: false },
      },
      handler: async (params) => {
        return {
          projectId: params.projectId,
          trade: params.trade,
          requirements: {
            minExperience: '5 years commercial',
            certifications: ['Master Plumber License', 'Backflow Prevention Certified'],
            insuranceMinimum: '$2M general liability',
            bondingRequired: true,
          },
          matches: [
            { id: 'ctr_001', name: 'Elite Plumbing LLC', matchScore: 95, meetsAll: true, strengths: ['15 years commercial experience', 'All certifications held'] },
            { id: 'ctr_003', name: 'ProPipe Services', matchScore: 92, meetsAll: true, strengths: ['20+ years experience', 'Highest platform rating'] },
            { id: 'ctr_002', name: 'Metro Plumbing Co', matchScore: 78, meetsAll: false, gaps: ['Missing backflow certification'] },
          ],
        };
      },
    });

    this.registerTool({
      name: 'verify_credentials',
      description: 'Verify contractor credentials, insurance, and licensing status',
      parameters: {
        contractorId: { type: 'string', description: 'The contractor ID to verify', required: true },
      },
      handler: async (params) => {
        return {
          contractorId: params.contractorId,
          contractor: 'Elite Plumbing LLC',
          verification: {
            generalLiability: { status: 'valid', amount: '$2M/$4M', carrier: 'Hartford', expires: '2026-12-31' },
            workersComp: { status: 'valid', carrier: 'SAIF', expires: '2026-09-30' },
            license: { status: 'valid', number: 'CCB-2018-77432', type: 'Plumbing Contractor', expires: '2027-06-30' },
            bonding: { status: 'valid', amount: '$500,000', surety: 'Travelers' },
            w9: { status: 'on_file', lastUpdated: '2026-01-15' },
            safetyRecord: { emr: 0.82, osha300Log: 'on_file', lastIncident: '2024-08-12' },
          },
          overallStatus: 'fully_verified',
          lastVerified: '2026-03-01',
        };
      },
    });
  }

  async handleMessage(message: string, context?: Record<string, unknown>): Promise<string> {
    return this.chat(message, context);
  }

  shouldHandoff(message: string): HandoffRequest | null {
    const lower = message.toLowerCase();

    if (/\b(bid management|coordinate sub|crew scheduling)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-gc', reason: 'GC operations topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }
    if (/\b(estimate|takeoff|cost comparison)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-estimate', reason: 'Estimation topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }
    if (/\b(payment|escrow|lien waiver)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-payments', reason: 'Payments topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }

    return null;
  }
}
