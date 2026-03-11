/**
 * Marketplace Service Integration Tests
 * Tests contractor profiles, matchmaking, bidding lifecycle,
 * lead management, reviews/ratings, and credential verification.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock PrismaClient ────────────────────────────────────────

const mockPrisma = {
  marketplaceProfile: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
  },
  contractAgreement: {
    count: vi.fn(),
  },
  portfolio: {
    create: vi.fn(),
    findMany: vi.fn(),
    delete: vi.fn(),
  },
  lead: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
  },
  quote: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    count: vi.fn(),
  },
  contractorReview: {
    create: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
  },
  contractor: {
    update: vi.fn(),
  },
  contractorCredential: {
    create: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock('@kealee/database', () => ({
  PrismaClient: vi.fn().mockImplementation(() => mockPrisma),
}));

// Import after mock
import { marketplaceService } from '../marketplace.service';

beforeEach(() => {
  vi.clearAllMocks();
});

// =====================================================================
// CONTRACTOR PROFILES
// =====================================================================

describe('marketplaceService.createContractorProfile', () => {
  it('creates a profile with acceptingLeads=true by default', async () => {
    const input = {
      userId: 'user_001',
      businessName: 'Elite Builders LLC',
      description: 'Full-service general contractor',
      specialties: ['Residential', 'Commercial', 'Mixed-Use'],
      serviceArea: { city: 'Austin', state: 'TX', radius: 50 },
      subscriptionTier: 'PRO',
      maxPipelineValue: 5000000,
    };

    mockPrisma.marketplaceProfile.create.mockResolvedValue({
      id: 'profile_001',
      ...input,
      acceptingLeads: true,
      user: { id: 'user_001', name: 'John Builder', email: 'john@elite.com' },
      portfolio: [],
    });

    const result = await marketplaceService.createContractorProfile(input);

    expect(result.acceptingLeads).toBe(true);
    expect(result.businessName).toBe('Elite Builders LLC');
    expect(mockPrisma.marketplaceProfile.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user_001',
        businessName: 'Elite Builders LLC',
        specialties: ['Residential', 'Commercial', 'Mixed-Use'],
        acceptingLeads: true,
      }),
      include: expect.objectContaining({
        user: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
        portfolio: true,
      }),
    });
  });

  it('defaults specialties to empty array', async () => {
    mockPrisma.marketplaceProfile.create.mockResolvedValue({
      id: 'profile_002',
      specialties: [],
    });

    await marketplaceService.createContractorProfile({
      userId: 'user_002',
      businessName: 'Simple Contractors',
    });

    expect(mockPrisma.marketplaceProfile.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        specialties: [],
      }),
      include: expect.any(Object),
    });
  });
});

describe('marketplaceService.getContractorProfile', () => {
  it('returns profile with capacity indicator', async () => {
    mockPrisma.marketplaceProfile.findUnique.mockResolvedValue({
      id: 'profile_100',
      userId: 'user_001',
      businessName: 'Elite Builders',
      user: { id: 'user_001', name: 'John' },
      portfolio: [],
      quotes: [{ id: 'q1' }, { id: 'q2' }],
    });

    mockPrisma.contractAgreement.count.mockResolvedValue(3);

    const result = await marketplaceService.getContractorProfile('profile_100');

    expect(result).not.toBeNull();
    expect(result!.availableCapacity).toBe('Available'); // 3 < 5
    expect(result!.activeContractsCount).toBe(3);
  });

  it('shows Limited capacity when 5-9 active contracts', async () => {
    mockPrisma.marketplaceProfile.findUnique.mockResolvedValue({
      id: 'profile_101',
      userId: 'user_002',
      user: { id: 'user_002' },
      portfolio: [],
      quotes: [],
    });

    mockPrisma.contractAgreement.count.mockResolvedValue(7);

    const result = await marketplaceService.getContractorProfile('profile_101');
    expect(result!.availableCapacity).toBe('Limited');
  });

  it('shows Fully Booked when 10+ active contracts', async () => {
    mockPrisma.marketplaceProfile.findUnique.mockResolvedValue({
      id: 'profile_102',
      userId: 'user_003',
      user: { id: 'user_003' },
      portfolio: [],
      quotes: [],
    });

    mockPrisma.contractAgreement.count.mockResolvedValue(12);

    const result = await marketplaceService.getContractorProfile('profile_102');
    expect(result!.availableCapacity).toBe('Fully Booked');
  });

  it('returns null when profile not found', async () => {
    mockPrisma.marketplaceProfile.findUnique.mockResolvedValue(null);

    const result = await marketplaceService.getContractorProfile('nonexistent');
    expect(result).toBeNull();
  });
});

describe('marketplaceService.searchContractors', () => {
  it('searches with all filters applied', async () => {
    mockPrisma.marketplaceProfile.findMany.mockResolvedValue([
      { id: 'p1', businessName: 'Builder A', verified: true, rating: 4.8 },
    ]);
    mockPrisma.marketplaceProfile.count.mockResolvedValue(1);

    const result = await marketplaceService.searchContractors({
      search: 'Builder',
      specialty: 'Residential',
      verifiedOnly: true,
      minRating: 4.0,
      acceptingLeads: true,
      limit: 10,
      offset: 0,
    });

    expect(result.profiles).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('defaults to 20 limit and 0 offset', async () => {
    mockPrisma.marketplaceProfile.findMany.mockResolvedValue([]);
    mockPrisma.marketplaceProfile.count.mockResolvedValue(0);

    const result = await marketplaceService.searchContractors({});

    expect(result.limit).toBe(20);
    expect(result.offset).toBe(0);
  });
});

// =====================================================================
// MATCHMAKING
// =====================================================================

describe('marketplaceService.matchContractors', () => {
  it('scores and ranks contractors by match quality', async () => {
    mockPrisma.marketplaceProfile.findMany.mockResolvedValue([
      {
        id: 'p1',
        userId: 'u1',
        businessName: 'Top Builder',
        specialties: ['Residential', 'Commercial'],
        rating: 4.9,
        performanceScore: 90,
        projectsCompleted: 15,
        reviewCount: 20,
        verified: true,
        currentPipelineValue: 1000000,
        maxPipelineValue: 5000000,
        user: { id: 'u1', name: 'John', email: 'john@top.com' },
        portfolio: [],
      },
      {
        id: 'p2',
        userId: 'u2',
        businessName: 'Average Builder',
        specialties: ['Residential'],
        rating: 3.5,
        performanceScore: 60,
        projectsCompleted: 5,
        reviewCount: 8,
        verified: true,
        currentPipelineValue: 4000000,
        maxPipelineValue: 5000000,
        user: { id: 'u2', name: 'Jane', email: 'jane@avg.com' },
        portfolio: [],
      },
    ]);

    const result = await marketplaceService.matchContractors({
      projectType: 'Residential',
      city: 'Austin',
      state: 'TX',
      requiredSpecialties: ['Residential', 'Commercial'],
    });

    expect(result.matches).toHaveLength(2);
    expect(result.totalCandidates).toBe(2);

    // Top Builder should score higher due to better ratings, performance, and capacity
    expect(result.matches[0].businessName).toBe('Top Builder');
    expect(result.matches[0].matchScore).toBeGreaterThan(result.matches[1].matchScore);
  });

  it('limits results to maxResults', async () => {
    const profiles = Array.from({ length: 20 }, (_, i) => ({
      id: `p${i}`,
      userId: `u${i}`,
      businessName: `Builder ${i}`,
      specialties: ['Residential'],
      rating: 4.0,
      performanceScore: 70,
      projectsCompleted: 10,
      reviewCount: 5,
      verified: true,
      currentPipelineValue: 0,
      maxPipelineValue: 5000000,
      user: { id: `u${i}`, name: `Builder ${i}` },
      portfolio: [],
    }));

    mockPrisma.marketplaceProfile.findMany.mockResolvedValue(profiles);

    const result = await marketplaceService.matchContractors({
      projectType: 'Residential',
      maxResults: 5,
    });

    expect(result.matches).toHaveLength(5);
    expect(result.totalCandidates).toBe(20);
  });

  it('gives neutral score when no specialty requirements', async () => {
    mockPrisma.marketplaceProfile.findMany.mockResolvedValue([
      {
        id: 'p1',
        userId: 'u1',
        businessName: 'Builder',
        specialties: [],
        rating: 4.0,
        performanceScore: 80,
        projectsCompleted: 10,
        reviewCount: 5,
        verified: true,
        currentPipelineValue: 0,
        maxPipelineValue: 1000000,
        user: { id: 'u1' },
        portfolio: [],
      },
    ]);

    const result = await marketplaceService.matchContractors({
      projectType: 'General',
    });

    expect(result.matches).toHaveLength(1);
    expect(result.matches[0].matchScore).toBeGreaterThan(0);
  });
});

// =====================================================================
// BIDDING
// =====================================================================

describe('marketplaceService.submitBid', () => {
  it('creates a quote and transitions lead to QUOTED stage', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({
      id: 'lead_001',
      srp: 100000,
      estimatedValue: 100000,
      stage: 'OPEN',
    });

    mockPrisma.quote.create.mockResolvedValue({
      id: 'quote_001',
      leadId: 'lead_001',
      profileId: 'profile_001',
      amount: 98000,
      status: 'SUBMITTED',
      profile: {
        user: { id: 'u1', name: 'Builder', email: 'builder@test.com' },
      },
    });

    mockPrisma.lead.update.mockResolvedValue({
      id: 'lead_001',
      stage: 'QUOTED',
    });

    const result = await marketplaceService.submitBid({
      bidRequestId: 'lead_001',
      profileId: 'profile_001',
      amount: 98000,
      timeline: '90 days',
      details: 'Includes all materials and labor',
    });

    expect(result.status).toBe('SUBMITTED');
    expect(result.amount).toBe(98000);

    // Lead should transition to QUOTED
    expect(mockPrisma.lead.update).toHaveBeenCalledWith({
      where: { id: 'lead_001' },
      data: { stage: 'QUOTED', stageChangedAt: expect.any(Date) },
    });
  });

  it('enforces 3% bid-up cap over SRP', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({
      id: 'lead_002',
      srp: 100000,
      estimatedValue: null,
      stage: 'OPEN',
    });

    // Max bid = 100000 * 1.03 = 103000
    await expect(
      marketplaceService.submitBid({
        bidRequestId: 'lead_002',
        profileId: 'profile_001',
        amount: 105000,
      }),
    ).rejects.toThrow(/exceeds the maximum allowed bid/);

    expect(mockPrisma.quote.create).not.toHaveBeenCalled();
  });

  it('allows bid at exactly the 3% cap', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({
      id: 'lead_003',
      srp: 100000,
      estimatedValue: null,
      stage: 'OPEN',
    });

    mockPrisma.quote.create.mockResolvedValue({
      id: 'quote_002',
      amount: 103000,
      status: 'SUBMITTED',
    });
    mockPrisma.lead.update.mockResolvedValue({});

    const result = await marketplaceService.submitBid({
      bidRequestId: 'lead_003',
      profileId: 'profile_001',
      amount: 103000,
    });

    expect(result.amount).toBe(103000);
  });

  it('uses estimatedValue as SRP fallback', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({
      id: 'lead_004',
      srp: null,
      estimatedValue: 50000,
      stage: 'OPEN',
    });

    // Max bid = 50000 * 1.03 = 51500
    await expect(
      marketplaceService.submitBid({
        bidRequestId: 'lead_004',
        profileId: 'profile_001',
        amount: 52000,
      }),
    ).rejects.toThrow(/exceeds the maximum allowed bid/);
  });

  it('throws when lead not found', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue(null);

    await expect(
      marketplaceService.submitBid({
        bidRequestId: 'nonexistent',
        profileId: 'profile_001',
        amount: 50000,
      }),
    ).rejects.toThrow('Lead / BidRequest nonexistent not found');
  });
});

describe('marketplaceService.awardBid', () => {
  it('accepts winning quote, rejects others, and updates lead/contractor', async () => {
    mockPrisma.quote.findUnique.mockResolvedValue({
      id: 'quote_100',
      leadId: 'lead_100',
      profileId: 'profile_001',
      amount: 95000,
      profile: { id: 'profile_001' },
    });

    mockPrisma.quote.update.mockResolvedValue({});
    mockPrisma.quote.updateMany.mockResolvedValue({ count: 3 });
    mockPrisma.lead.update.mockResolvedValue({});
    mockPrisma.marketplaceProfile.update.mockResolvedValue({});

    const result = await marketplaceService.awardBid('quote_100');

    expect(result.awardedQuote.id).toBe('quote_100');
    expect(result.leadId).toBe('lead_100');
    expect(result.contractorProfileId).toBe('profile_001');

    // Winning quote accepted
    expect(mockPrisma.quote.update).toHaveBeenCalledWith({
      where: { id: 'quote_100' },
      data: { status: 'ACCEPTED' },
    });

    // Other quotes rejected
    expect(mockPrisma.quote.updateMany).toHaveBeenCalledWith({
      where: { leadId: 'lead_100', id: { not: 'quote_100' } },
      data: { status: 'REJECTED' },
    });

    // Lead moved to AWARDED
    expect(mockPrisma.lead.update).toHaveBeenCalledWith({
      where: { id: 'lead_100' },
      data: { stage: 'AWARDED', stageChangedAt: expect.any(Date) },
    });

    // Contractor profile updated
    expect(mockPrisma.marketplaceProfile.update).toHaveBeenCalledWith({
      where: { id: 'profile_001' },
      data: {
        lastWonAt: expect.any(Date),
        projectsCompleted: { increment: 1 },
      },
    });
  });

  it('throws when quote not found', async () => {
    mockPrisma.quote.findUnique.mockResolvedValue(null);

    await expect(
      marketplaceService.awardBid('nonexistent'),
    ).rejects.toThrow('Quote nonexistent not found');
  });
});

// =====================================================================
// REVIEWS & RATINGS
// =====================================================================

describe('marketplaceService.createReview', () => {
  it('creates a review and updates contractor aggregate rating', async () => {
    mockPrisma.contractorReview.create.mockResolvedValue({
      id: 'review_001',
      contractorId: 'contractor_001',
      rating: 5,
      workQuality: 5,
      communication: 4,
      timeliness: 5,
      professionalism: 5,
      wouldRecommend: true,
    });

    mockPrisma.contractorReview.aggregate.mockResolvedValue({
      _avg: { rating: 4.7 },
      _count: { id: 15 },
    });

    mockPrisma.contractor.update.mockResolvedValue({});

    const result = await marketplaceService.createReview({
      contractorId: 'contractor_001',
      projectId: 'proj_001',
      reviewerId: 'user_001',
      rating: 5,
      comment: 'Excellent work, highly recommend!',
      workQuality: 5,
      communication: 4,
      timeliness: 5,
      professionalism: 5,
      wouldRecommend: true,
    });

    expect(result.rating).toBe(5);

    // Aggregate recalculated
    expect(mockPrisma.contractorReview.aggregate).toHaveBeenCalledWith({
      where: { contractorId: 'contractor_001' },
      _avg: { rating: true },
      _count: { id: true },
    });

    // Contractor record updated with new aggregate
    expect(mockPrisma.contractor.update).toHaveBeenCalledWith({
      where: { id: 'contractor_001' },
      data: {
        rating: 4.7,
        reviewCount: 15,
      },
    });
  });

  it('defaults wouldRecommend to true', async () => {
    mockPrisma.contractorReview.create.mockResolvedValue({
      id: 'review_002',
      wouldRecommend: true,
    });
    mockPrisma.contractorReview.aggregate.mockResolvedValue({
      _avg: { rating: 4.0 },
      _count: { id: 1 },
    });
    mockPrisma.contractor.update.mockResolvedValue({});

    await marketplaceService.createReview({
      contractorId: 'contractor_002',
      rating: 4,
    });

    expect(mockPrisma.contractorReview.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        wouldRecommend: true,
      }),
    });
  });
});

describe('marketplaceService.listReviews', () => {
  it('lists reviews with default pagination', async () => {
    mockPrisma.contractorReview.findMany.mockResolvedValue([
      { id: 'r1', rating: 5 },
      { id: 'r2', rating: 4 },
    ]);
    mockPrisma.contractorReview.count.mockResolvedValue(2);

    const result = await marketplaceService.listReviews('contractor_001');

    expect(result.reviews).toHaveLength(2);
    expect(result.total).toBe(2);
  });
});

// =====================================================================
// CREDENTIALS & VERIFICATION
// =====================================================================

describe('marketplaceService.addCredential', () => {
  it('creates a credential with verified=false by default', async () => {
    mockPrisma.contractorCredential.create.mockResolvedValue({
      id: 'cred_001',
      type: 'LICENSE',
      name: 'Texas General Contractor License',
      verified: false,
    });

    const result = await marketplaceService.addCredential({
      contractorId: 'contractor_001',
      type: 'LICENSE',
      name: 'Texas General Contractor License',
      number: 'GC-12345',
      issuedBy: 'Texas Department of Licensing',
      issuedAt: '2024-01-15',
      expiresAt: '2027-01-15',
      documentUrl: 'https://storage.example.com/license.pdf',
    });

    expect(result.verified).toBe(false);
    expect(mockPrisma.contractorCredential.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        contractorId: 'contractor_001',
        type: 'LICENSE',
        name: 'Texas General Contractor License',
        number: 'GC-12345',
        verified: false,
        issuedAt: expect.any(Date),
        expiresAt: expect.any(Date),
      }),
    });
  });
});

describe('marketplaceService.verifyCredential', () => {
  it('marks a credential as verified with timestamp', async () => {
    mockPrisma.contractorCredential.update.mockResolvedValue({
      id: 'cred_100',
      verified: true,
      verifiedAt: new Date(),
    });

    const result = await marketplaceService.verifyCredential('cred_100');

    expect(result.verified).toBe(true);
    expect(mockPrisma.contractorCredential.update).toHaveBeenCalledWith({
      where: { id: 'cred_100' },
      data: { verified: true, verifiedAt: expect.any(Date) },
    });
  });
});

describe('marketplaceService.getVerificationStatus', () => {
  it('returns comprehensive verification status', async () => {
    const now = new Date();
    const future = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    mockPrisma.contractorCredential.findMany.mockResolvedValue([
      { type: 'LICENSE', verified: true, expiresAt: future },
      { type: 'INSURANCE', verified: true, expiresAt: future },
      { type: 'BOND', verified: false, expiresAt: future },
      { type: 'CERTIFICATION', verified: true, expiresAt: past }, // expired
    ]);

    const result = await marketplaceService.getVerificationStatus('contractor_001');

    expect(result.totalCredentials).toBe(4);
    expect(result.verifiedCount).toBe(3);
    expect(result.expiredCount).toBe(1);
    expect(result.pendingCount).toBe(0); // 4 - 3 - 1 = 0
    expect(result.hasLicense).toBe(true);
    expect(result.hasInsurance).toBe(true);
    expect(result.hasBond).toBe(true);
    expect(result.fullyVerified).toBe(false); // has expired credential
  });

  it('returns fullyVerified=true when all credentials are verified and not expired', async () => {
    const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    mockPrisma.contractorCredential.findMany.mockResolvedValue([
      { type: 'LICENSE', verified: true, expiresAt: future },
      { type: 'INSURANCE', verified: true, expiresAt: future },
    ]);

    const result = await marketplaceService.getVerificationStatus('contractor_002');

    expect(result.fullyVerified).toBe(true);
    expect(result.verifiedCount).toBe(2);
    expect(result.expiredCount).toBe(0);
  });
});

// =====================================================================
// LEAD MANAGEMENT
// =====================================================================

describe('marketplaceService.createLead', () => {
  it('creates a lead in OPEN stage', async () => {
    mockPrisma.lead.create.mockResolvedValue({
      id: 'lead_001',
      category: 'General Construction',
      description: 'New commercial build-out',
      estimatedValue: 250000,
      location: 'Austin, TX',
      stage: 'OPEN',
    });

    const result = await marketplaceService.createLead({
      category: 'General Construction',
      description: 'New commercial build-out',
      estimatedValue: 250000,
      srp: 240000,
      location: 'Austin, TX',
      city: 'Austin',
      state: 'TX',
      projectType: 'Commercial',
    });

    expect(result.stage).toBe('OPEN');
    expect(mockPrisma.lead.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        category: 'General Construction',
        stage: 'OPEN',
        estimatedValue: 250000,
        srp: 240000,
      }),
    });
  });
});

describe('marketplaceService.createBidRequest', () => {
  it('creates a bid request from an existing lead', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({
      id: 'lead_200',
      description: 'Office renovation',
      estimatedValue: 100000,
      srp: 95000,
      stage: 'INTAKE',
    });

    mockPrisma.lead.update.mockResolvedValue({
      id: 'lead_200',
      stage: 'OPEN',
      stageChangedAt: new Date(),
      createdAt: new Date(),
    });

    const result = await marketplaceService.createBidRequest({
      leadId: 'lead_200',
      title: 'Office Renovation Bid',
      description: 'Seeking bids for 5000 SF office renovation',
    });

    expect(result.stage).toBe('OPEN');
    expect(result.title).toBe('Office Renovation Bid');
    expect(result.leadId).toBe('lead_200');
  });

  it('throws when lead not found', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue(null);

    await expect(
      marketplaceService.createBidRequest({
        leadId: 'nonexistent',
        title: 'Test',
      }),
    ).rejects.toThrow('Lead nonexistent not found');
  });
});
