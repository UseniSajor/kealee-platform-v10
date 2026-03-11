/**
 * Marketplace Service -- Comprehensive marketplace operations
 *
 * Covers: Contractor listings, matchmaking, bidding, lead management,
 * reviews/ratings, skills verification, workforce pipeline.
 */

import { PrismaClient } from '@kealee/database';

const prisma = new PrismaClient();

// ── Types ────────────────────────────────────────────────────────

type Decimal = any;

export type ContractorSearchInput = {
  search?: string;
  specialty?: string;
  city?: string;
  state?: string;
  verifiedOnly?: boolean;
  minRating?: number;
  acceptingLeads?: boolean;
  limit?: number;
  offset?: number;
};

export type MatchRequest = {
  projectType: string;
  city?: string;
  state?: string;
  estimatedValue?: number;
  requiredSpecialties?: string[];
  maxResults?: number;
};

export type BidRequestInput = {
  leadId: string;
  title: string;
  description?: string;
  dueDate?: string;
  userId?: string;
};

export type BidResponseInput = {
  bidRequestId: string;
  profileId: string;
  amount: number;
  timeline?: string;
  details?: string;
  userId?: string;
};

export type CreateLeadInput = {
  category: string;
  description: string;
  estimatedValue?: number;
  srp?: number;
  location: string;
  city?: string;
  state?: string;
  projectId?: string;
  projectType?: string;
  userId?: string;
};

export type ReviewInput = {
  contractorId: string;
  projectId?: string;
  reviewerId?: string;
  rating: number;
  comment?: string;
  workQuality?: number;
  communication?: number;
  timeliness?: number;
  professionalism?: number;
  wouldRecommend?: boolean;
};

export type CredentialInput = {
  contractorId: string;
  type: string; // LICENSE, INSURANCE, BOND, CERTIFICATION
  name: string;
  number?: string;
  issuedBy?: string;
  issuedAt?: string;
  expiresAt?: string;
  documentUrl?: string;
};

// ── Service ──────────────────────────────────────────────────────

export const marketplaceService = {
  // ============================================================
  // CONTRACTOR LISTINGS
  // ============================================================

  async createContractorProfile(data: {
    userId: string;
    businessName: string;
    description?: string;
    specialties?: string[];
    serviceArea?: Record<string, unknown>;
    subscriptionTier?: string;
    maxPipelineValue?: number;
  }) {
    return prisma.marketplaceProfile.create({
      data: {
        userId: data.userId,
        businessName: data.businessName,
        description: data.description,
        specialties: data.specialties ?? [],
        serviceArea: (data.serviceArea ?? undefined) as any,
        subscriptionTier: data.subscriptionTier,
        maxPipelineValue: data.maxPipelineValue as any,
        acceptingLeads: true,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
        portfolio: true,
      },
    });
  },

  async getContractorProfile(profileId: string) {
    const profile = await prisma.marketplaceProfile.findUnique({
      where: { id: profileId },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
        portfolio: true,
        quotes: {
          where: { status: 'ACCEPTED' },
          select: { id: true },
        },
      },
    });

    if (!profile) return null;

    // Get active contracts count for capacity indicator
    const activeContractsCount = await prisma.contractAgreement.count({
      where: {
        contractorId: profile.userId,
        status: { in: ['DRAFT', 'SENT', 'SIGNED', 'ACTIVE'] },
      },
    }).catch(() => 0);

    return {
      ...profile,
      availableCapacity:
        activeContractsCount < 5
          ? 'Available'
          : activeContractsCount < 10
            ? 'Limited'
            : 'Fully Booked',
      activeContractsCount,
    };
  },

  async getContractorProfileByUserId(userId: string) {
    const profile = await prisma.marketplaceProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
        portfolio: true,
      },
    });
    return profile;
  },

  async updateContractorProfile(profileId: string, data: Record<string, unknown>) {
    return prisma.marketplaceProfile.update({
      where: { id: profileId },
      data: data as any,
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
        portfolio: true,
      },
    });
  },

  async searchContractors(input: ContractorSearchInput) {
    const where: any = {};

    // Only show active users
    where.user = { status: 'ACTIVE' };

    if (input.search) {
      where.OR = [
        { businessName: { contains: input.search, mode: 'insensitive' } },
        { description: { contains: input.search, mode: 'insensitive' } },
      ];
    }

    if (input.specialty) {
      where.specialties = { has: input.specialty };
    }

    if (input.verifiedOnly) {
      where.verified = true;
    }

    if (input.minRating !== undefined) {
      where.rating = { gte: input.minRating };
    }

    if (input.acceptingLeads !== undefined) {
      where.acceptingLeads = input.acceptingLeads;
    }

    const limit = input.limit ?? 20;
    const offset = input.offset ?? 0;

    const [profiles, total] = await Promise.all([
      prisma.marketplaceProfile.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
        take: limit,
        skip: offset,
        orderBy: [{ verified: 'desc' }, { rating: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.marketplaceProfile.count({ where }),
    ]);

    return { profiles, total, limit, offset };
  },

  // ── Portfolio ────────────────────────────────────────────────

  async addPortfolioItem(profileId: string, data: {
    projectName: string;
    description?: string;
    category: string;
    imageUrls?: string[];
    completedAt?: string;
  }) {
    return prisma.portfolio.create({
      data: {
        profileId,
        projectName: data.projectName,
        description: data.description,
        category: data.category,
        imageUrls: data.imageUrls ?? [],
        completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
      },
    });
  },

  async listPortfolio(profileId: string) {
    return prisma.portfolio.findMany({
      where: { profileId },
      orderBy: { completedAt: 'desc' },
    });
  },

  async deletePortfolioItem(portfolioId: string) {
    return prisma.portfolio.delete({ where: { id: portfolioId } });
  },

  // ============================================================
  // MATCHMAKING
  // ============================================================

  async matchContractors(input: MatchRequest) {
    const maxResults = input.maxResults ?? 10;

    // Find active contractors accepting leads
    const where: any = {
      acceptingLeads: true,
      verified: true,
      user: { status: 'ACTIVE' },
    };

    // If specialties required, filter for them
    if (input.requiredSpecialties && input.requiredSpecialties.length > 0) {
      where.specialties = { hasSome: input.requiredSpecialties };
    }

    const profiles = await prisma.marketplaceProfile.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        portfolio: { take: 3 },
      },
    });

    // Score each contractor
    const scored = profiles.map((profile) => {
      let score = 0;

      // Rating weight (0-25 points)
      if (profile.rating) score += Math.min(Number(profile.rating) * 5, 25);

      // Performance score weight (0-25 points)
      if (profile.performanceScore) score += Math.min(profile.performanceScore / 4, 25);

      // Projects completed weight (0-20 points)
      score += Math.min(profile.projectsCompleted * 2, 20);

      // Specialty match weight (0-20 points)
      if (input.requiredSpecialties && input.requiredSpecialties.length > 0) {
        const matchCount = input.requiredSpecialties.filter((s) =>
          profile.specialties.includes(s)
        ).length;
        score += (matchCount / input.requiredSpecialties.length) * 20;
      } else {
        score += 10; // Neutral if no specialty requirement
      }

      // Capacity weight (0-10 points) -- prefer those with more capacity
      const pipeline = Number(profile.currentPipelineValue ?? 0);
      const maxPipeline = Number(profile.maxPipelineValue ?? 1);
      const utilization = maxPipeline > 0 ? pipeline / maxPipeline : 1;
      score += Math.max(0, (1 - utilization) * 10);

      return {
        profile,
        matchScore: Math.round(score * 10) / 10,
      };
    });

    // Sort by score descending
    scored.sort((a, b) => b.matchScore - a.matchScore);

    return {
      matches: scored.slice(0, maxResults).map((s) => ({
        profileId: s.profile.id,
        userId: s.profile.userId,
        businessName: s.profile.businessName,
        specialties: s.profile.specialties,
        rating: s.profile.rating,
        reviewCount: s.profile.reviewCount,
        projectsCompleted: s.profile.projectsCompleted,
        verified: s.profile.verified,
        matchScore: s.matchScore,
        user: (s.profile as any).user,
        portfolio: (s.profile as any).portfolio,
      })),
      totalCandidates: profiles.length,
      criteria: {
        projectType: input.projectType,
        city: input.city,
        state: input.state,
        requiredSpecialties: input.requiredSpecialties,
      },
    };
  },

  // ============================================================
  // BIDDING
  // ============================================================

  async createBidRequest(input: BidRequestInput) {
    // Verify lead exists
    const lead = await prisma.lead.findUnique({ where: { id: input.leadId } });
    if (!lead) throw new Error(`Lead ${input.leadId} not found`);

    // For now, store bid request metadata on the lead itself.
    // The Lead model serves as the bid-request anchor; quotes are the bids.
    const updated = await prisma.lead.update({
      where: { id: input.leadId },
      data: {
        stage: 'OPEN',
        stageChangedAt: new Date(),
      },
    });

    return {
      id: updated.id,
      title: input.title,
      description: input.description ?? lead.description,
      leadId: lead.id,
      estimatedValue: lead.estimatedValue,
      srp: lead.srp,
      stage: updated.stage,
      createdAt: updated.createdAt,
    };
  },

  async submitBid(input: BidResponseInput) {
    const lead = await prisma.lead.findUnique({ where: { id: input.bidRequestId } });
    if (!lead) throw new Error(`Lead / BidRequest ${input.bidRequestId} not found`);

    // Enforce 3% bid-up max over SRP
    const srp = lead.srp ? Number(lead.srp) : lead.estimatedValue ? Number(lead.estimatedValue) : null;
    if (srp !== null) {
      const maxBid = srp * 1.03;
      if (input.amount > maxBid) {
        throw new Error(
          `Bid amount $${input.amount} exceeds the maximum allowed bid of $${maxBid.toFixed(2)} (3% over SRP of $${srp})`
        );
      }
    }

    const quote = await prisma.quote.create({
      data: {
        leadId: input.bidRequestId,
        profileId: input.profileId,
        amount: input.amount as any,
        timeline: input.timeline,
        details: input.details,
        status: 'SUBMITTED',
      },
      include: {
        profile: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    // Move lead to QUOTED stage if first quote
    if (lead.stage === 'OPEN' || lead.stage === 'INTAKE' || lead.stage === 'DISTRIBUTED') {
      await prisma.lead.update({
        where: { id: input.bidRequestId },
        data: { stage: 'QUOTED', stageChangedAt: new Date() },
      });
    }

    return quote;
  },

  async listBids(leadId: string) {
    return prisma.quote.findMany({
      where: { leadId },
      include: {
        profile: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { amount: 'asc' },
    });
  },

  async awardBid(quoteId: string) {
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: { profile: true },
    });
    if (!quote) throw new Error(`Quote ${quoteId} not found`);

    // Accept the winning quote
    await prisma.quote.update({
      where: { id: quoteId },
      data: { status: 'ACCEPTED' },
    });

    // Reject all other quotes for this lead
    await prisma.quote.updateMany({
      where: { leadId: quote.leadId, id: { not: quoteId } },
      data: { status: 'REJECTED' },
    });

    // Move lead to AWARDED
    await prisma.lead.update({
      where: { id: quote.leadId },
      data: { stage: 'AWARDED', stageChangedAt: new Date() },
    });

    // Update contractor's lastWonAt
    await prisma.marketplaceProfile.update({
      where: { id: quote.profileId },
      data: {
        lastWonAt: new Date(),
        projectsCompleted: { increment: 1 },
      },
    });

    return {
      awardedQuote: quote,
      leadId: quote.leadId,
      contractorProfileId: quote.profileId,
    };
  },

  // ============================================================
  // LEAD MANAGEMENT
  // ============================================================

  async createLead(input: CreateLeadInput) {
    return prisma.lead.create({
      data: {
        category: input.category,
        description: input.description,
        estimatedValue: input.estimatedValue as any,
        srp: input.srp as any,
        location: input.location,
        city: input.city,
        state: input.state,
        projectId: input.projectId,
        projectType: input.projectType,
        stage: 'OPEN',
      },
    });
  },

  async getLead(leadId: string) {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        quotes: {
          include: {
            profile: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
        project: { select: { id: true, name: true, status: true } },
      },
    });
    if (!lead) throw new Error(`Lead ${leadId} not found`);
    return lead;
  },

  async listLeads(filters: {
    stage?: string;
    city?: string;
    state?: string;
    projectType?: string;
    estimatedValueMin?: number;
    estimatedValueMax?: number;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters.stage) where.stage = filters.stage;
    if (filters.city) where.city = { contains: filters.city, mode: 'insensitive' };
    if (filters.state) where.state = filters.state;
    if (filters.projectType) where.projectType = filters.projectType;

    if (filters.estimatedValueMin !== undefined || filters.estimatedValueMax !== undefined) {
      where.estimatedValue = {};
      if (filters.estimatedValueMin !== undefined) where.estimatedValue.gte = filters.estimatedValueMin as any;
      if (filters.estimatedValueMax !== undefined) where.estimatedValue.lte = filters.estimatedValueMax as any;
    }

    const limit = filters.limit ?? 50;
    const offset = filters.offset ?? 0;

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          quotes: { select: { id: true, status: true, amount: true } },
          project: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.lead.count({ where }),
    ]);

    return { leads, total, limit, offset };
  },

  async updateLeadStage(leadId: string, stage: string) {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new Error(`Lead ${leadId} not found`);

    const now = new Date();
    const updateData: any = { stage, stageChangedAt: now };

    // Track stage-specific timestamps
    if (stage === 'LOST' && !lead.lostAt) updateData.lostAt = now;

    return prisma.lead.update({
      where: { id: leadId },
      data: updateData,
    });
  },

  async distributeLead(leadId: string, profileIds: string[]) {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new Error(`Lead ${leadId} not found`);

    // Store the profile IDs on the lead
    const updated = await prisma.lead.update({
      where: { id: leadId },
      data: {
        distributedTo: profileIds,
        stage: 'DISTRIBUTED',
        stageChangedAt: new Date(),
      },
    });

    return updated;
  },

  async scoreLeads() {
    // Retrieve leads in OPEN stage and compute a simple priority score
    const leads = await prisma.lead.findMany({
      where: { stage: 'OPEN' },
      orderBy: { createdAt: 'asc' },
    });

    const scored = leads.map((lead) => {
      let score = 0;

      // Higher estimated value = higher priority
      const value = Number(lead.estimatedValue ?? 0);
      if (value > 100_000) score += 30;
      else if (value > 50_000) score += 20;
      else if (value > 10_000) score += 10;

      // Older leads get priority (days since creation)
      const ageMs = Date.now() - lead.createdAt.getTime();
      const ageDays = ageMs / (1000 * 60 * 60 * 24);
      score += Math.min(ageDays * 2, 30);

      // Leads with SRP already computed get priority
      if (lead.srp) score += 10;

      return { leadId: lead.id, category: lead.category, estimatedValue: lead.estimatedValue, score: Math.round(score) };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored;
  },

  // ============================================================
  // REVIEWS & RATINGS
  // ============================================================

  async createReview(input: ReviewInput) {
    // Find the Contractor record by contractorId (which maps to user or org)
    const review = await prisma.contractorReview.create({
      data: {
        contractorId: input.contractorId,
        projectId: input.projectId,
        reviewerId: input.reviewerId,
        rating: input.rating,
        comment: input.comment,
        workQuality: input.workQuality,
        communication: input.communication,
        timeliness: input.timeliness,
        professionalism: input.professionalism,
        wouldRecommend: input.wouldRecommend ?? true,
      },
    });

    // Recompute aggregate rating on the Contractor
    const agg = await prisma.contractorReview.aggregate({
      where: { contractorId: input.contractorId },
      _avg: { rating: true },
      _count: { id: true },
    });

    await prisma.contractor.update({
      where: { id: input.contractorId },
      data: {
        rating: agg._avg.rating ?? 0,
        reviewCount: agg._count.id,
      },
    }).catch(() => {
      // Contractor record may not exist if using MarketplaceProfile flow
    });

    return review;
  },

  async listReviews(contractorId: string, limit?: number, offset?: number) {
    const [reviews, total] = await Promise.all([
      prisma.contractorReview.findMany({
        where: { contractorId },
        orderBy: { createdAt: 'desc' },
        take: limit ?? 20,
        skip: offset ?? 0,
      }),
      prisma.contractorReview.count({ where: { contractorId } }),
    ]);

    return { reviews, total };
  },

  async getReviewSummary(contractorId: string) {
    const agg = await prisma.contractorReview.aggregate({
      where: { contractorId },
      _avg: {
        rating: true,
        workQuality: true,
        communication: true,
        timeliness: true,
        professionalism: true,
      },
      _count: { id: true },
    });

    const recommendCount = await prisma.contractorReview.count({
      where: { contractorId, wouldRecommend: true },
    });

    return {
      contractorId,
      averageRating: agg._avg.rating,
      averageWorkQuality: agg._avg.workQuality,
      averageCommunication: agg._avg.communication,
      averageTimeliness: agg._avg.timeliness,
      averageProfessionalism: agg._avg.professionalism,
      totalReviews: agg._count.id,
      recommendationRate: agg._count.id > 0 ? Math.round((recommendCount / agg._count.id) * 100) : null,
    };
  },

  // ============================================================
  // SKILLS VERIFICATION
  // ============================================================

  async addCredential(input: CredentialInput) {
    return prisma.contractorCredential.create({
      data: {
        contractorId: input.contractorId,
        type: input.type,
        name: input.name,
        number: input.number,
        issuedBy: input.issuedBy,
        issuedAt: input.issuedAt ? new Date(input.issuedAt) : undefined,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
        documentUrl: input.documentUrl,
        verified: false,
      },
    });
  },

  async listCredentials(contractorId: string) {
    return prisma.contractorCredential.findMany({
      where: { contractorId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async verifyCredential(credentialId: string) {
    return prisma.contractorCredential.update({
      where: { id: credentialId },
      data: { verified: true, verifiedAt: new Date() },
    });
  },

  async getVerificationStatus(contractorId: string) {
    const credentials = await prisma.contractorCredential.findMany({
      where: { contractorId },
    });

    const total = credentials.length;
    const verified = credentials.filter((c) => c.verified).length;
    const expired = credentials.filter(
      (c) => c.expiresAt && new Date(c.expiresAt) < new Date()
    ).length;
    const pending = total - verified - expired;

    // Check for specific credential types
    const types = credentials.map((c) => c.type.toUpperCase());
    const hasLicense = types.includes('LICENSE');
    const hasInsurance = types.includes('INSURANCE');
    const hasBond = types.includes('BOND');

    return {
      contractorId,
      totalCredentials: total,
      verifiedCount: verified,
      pendingCount: pending,
      expiredCount: expired,
      hasLicense,
      hasInsurance,
      hasBond,
      fullyVerified: total > 0 && verified === total && expired === 0,
      credentials,
    };
  },

  // ============================================================
  // WORKFORCE PIPELINE
  // ============================================================

  async getWorkforceSummary() {
    const [totalContractors, activeContractors, verifiedContractors, acceptingLeads] =
      await Promise.all([
        prisma.marketplaceProfile.count(),
        prisma.marketplaceProfile.count({
          where: { user: { status: 'ACTIVE' } },
        }),
        prisma.marketplaceProfile.count({ where: { verified: true } }),
        prisma.marketplaceProfile.count({ where: { acceptingLeads: true } }),
      ]);

    // Lead pipeline summary
    const leadCounts = await prisma.lead.groupBy({
      by: ['stage'],
      _count: { id: true },
    });

    const leadPipeline: Record<string, number> = {};
    for (const row of leadCounts) {
      leadPipeline[row.stage] = row._count.id;
    }

    // Specialty distribution
    const profiles = await prisma.marketplaceProfile.findMany({
      select: { specialties: true },
    });
    const specialtyCounts: Record<string, number> = {};
    for (const p of profiles) {
      for (const s of p.specialties) {
        specialtyCounts[s] = (specialtyCounts[s] || 0) + 1;
      }
    }

    // Subscription tier distribution
    const tierCounts = await prisma.marketplaceProfile.groupBy({
      by: ['subscriptionTier'],
      _count: { id: true },
    });
    const tiers: Record<string, number> = {};
    for (const row of tierCounts) {
      tiers[row.subscriptionTier ?? 'none'] = row._count.id;
    }

    return {
      contractors: {
        total: totalContractors,
        active: activeContractors,
        verified: verifiedContractors,
        acceptingLeads,
      },
      leadPipeline,
      specialtyDistribution: specialtyCounts,
      subscriptionTiers: tiers,
    };
  },

  async getContractorAvailability(profileId: string) {
    const profile = await prisma.marketplaceProfile.findUnique({
      where: { id: profileId },
    });
    if (!profile) throw new Error(`Profile ${profileId} not found`);

    const activeContracts = await prisma.contractAgreement.count({
      where: {
        contractorId: profile.userId,
        status: { in: ['ACTIVE', 'SIGNED'] },
      },
    }).catch(() => 0);

    const pendingQuotes = await prisma.quote.count({
      where: { profileId, status: 'SUBMITTED' },
    });

    const pipeline = Number(profile.currentPipelineValue ?? 0);
    const maxPipeline = Number(profile.maxPipelineValue ?? 0);
    const utilization = maxPipeline > 0 ? Math.round((pipeline / maxPipeline) * 100) : 0;

    return {
      profileId,
      businessName: profile.businessName,
      acceptingLeads: profile.acceptingLeads,
      activeContracts,
      pendingQuotes,
      currentPipelineValue: pipeline,
      maxPipelineValue: maxPipeline,
      utilizationPercent: utilization,
      status:
        !profile.acceptingLeads
          ? 'NOT_ACCEPTING'
          : utilization >= 90
            ? 'FULLY_BOOKED'
            : utilization >= 70
              ? 'LIMITED'
              : 'AVAILABLE',
    };
  },
};
