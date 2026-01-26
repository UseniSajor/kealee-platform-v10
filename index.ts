// ============================================================================
// APP-01: CONTRACTOR BID ENGINE
// ============================================================================
// Automates contractor sourcing, bid collection, analysis, and recommendation
// Automation Level: 85%
// Build Time: 6-8 weeks
// ============================================================================

import { prisma } from '@kealee/database';
import { Job } from 'bullmq';
import { createWorker, queues, JOB_OPTIONS, QUEUE_NAMES } from '../../shared/queue';
import { getEventBus, EVENT_TYPES } from '../../shared/events';
import { generateJSON, generateText } from '../../shared/ai';
import { sendEmail, EMAIL_TEMPLATES } from '../../shared/integrations/sendgrid';
import { formatCurrency, calculatePercentage } from '../../shared/utils/money';
import { addWorkingDays } from '../../shared/utils/date';

// ============================================================================
// TYPES
// ============================================================================

export interface MatchCriteria {
  projectId: string;
  trades: string[];
  location: { lat: number; lng: number };
  budgetRange: { min: number; max: number };
  timeline: { start: Date; end: Date };
  minRating?: number;
  requiredCredentials?: string[];
}

export interface MatchResult {
  contractorId: string;
  contractor: {
    id: string;
    name: string;
    company: string;
    email: string;
    phone: string;
    rating: number;
    trades: string[];
  };
  score: number;
  matchReasons: string[];
  distance: number;
  availability: boolean;
}

export interface BidAnalysis {
  submissionId: string;
  contractorName: string;
  amount: number;
  priceScore: number;
  timelineScore: number;
  scopeScore: number;
  qualificationScore: number;
  overallScore: number;
  strengths: string[];
  concerns: string[];
  recommendation: 'HIGHLY_RECOMMENDED' | 'RECOMMENDED' | 'ACCEPTABLE' | 'NOT_RECOMMENDED';
  rank: number;
}

export interface BidComparison {
  projectId: string;
  bidRequestId: string;
  analyses: BidAnalysis[];
  summary: {
    totalBids: number;
    averagePrice: number;
    priceRange: { min: number; max: number };
    recommendedContractor: string;
    aiNarrative: string;
  };
  generatedAt: Date;
}

// ============================================================================
// CONTRACTOR MATCHER
// ============================================================================

export class ContractorMatcher {
  private readonly MAX_DISTANCE_MILES = 50;
  private readonly MIN_RATING = 3.5;
  private readonly MAX_MATCHES = 10;

  async findMatches(criteria: MatchCriteria): Promise<MatchResult[]> {
    // Get contractors matching basic criteria
    const contractors = await prisma.contractor.findMany({
      where: {
        status: 'ACTIVE',
        trades: { hasSome: criteria.trades },
        rating: { gte: criteria.minRating || this.MIN_RATING },
      },
      include: {
        credentials: {
          where: { expiresAt: { gt: new Date() } },
        },
        projects: {
          take: 10,
          orderBy: { completedAt: 'desc' },
          where: { status: 'COMPLETED' },
        },
        reviews: {
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Score and filter contractors
    const matches = contractors
      .map(contractor => this.scoreContractor(contractor, criteria))
      .filter(match => match !== null && match.score >= 0.4)
      .sort((a, b) => b!.score - a!.score)
      .slice(0, this.MAX_MATCHES) as MatchResult[];

    return matches;
  }

  private scoreContractor(contractor: any, criteria: MatchCriteria): MatchResult | null {
    let score = 0;
    const matchReasons: string[] = [];

    // Distance score (0-25 points)
    const distance = this.calculateDistance(
      criteria.location,
      { lat: contractor.latitude, lng: contractor.longitude }
    );
    
    if (distance > this.MAX_DISTANCE_MILES) {
      return null; // Too far
    }
    
    const distanceScore = 25 * (1 - distance / this.MAX_DISTANCE_MILES);
    score += distanceScore;
    matchReasons.push(`${Math.round(distance)} miles from project`);

    // Trade match score (0-25 points)
    const matchedTrades = contractor.trades.filter((t: string) =>
      criteria.trades.map(ct => ct.toLowerCase()).includes(t.toLowerCase())
    );
    const tradeScore = (matchedTrades.length / criteria.trades.length) * 25;
    score += tradeScore;
    matchReasons.push(`${matchedTrades.length}/${criteria.trades.length} required trades`);

    // Rating score (0-20 points)
    const ratingScore = ((contractor.rating - 3) / 2) * 20; // 3-5 stars → 0-20 points
    score += Math.max(0, ratingScore);
    matchReasons.push(`${contractor.rating.toFixed(1)}★ rating (${contractor.reviews.length} reviews)`);

    // Project history score (0-15 points)
    const similarProjects = contractor.projects.filter((p: any) => {
      const budget = Number(p.contractValue);
      return budget >= criteria.budgetRange.min * 0.5 &&
             budget <= criteria.budgetRange.max * 2;
    });
    const historyScore = Math.min(similarProjects.length, 5) * 3; // 3 points per project, max 5
    score += historyScore;
    if (similarProjects.length > 0) {
      matchReasons.push(`${similarProjects.length} similar projects completed`);
    }

    // Credential score (0-15 points)
    const requiredCreds = criteria.requiredCredentials || ['LICENSE', 'INSURANCE', 'BOND'];
    const validCredentials = contractor.credentials.filter((c: any) =>
      requiredCreds.some(req => c.type.toUpperCase().includes(req))
    );
    const credScore = (validCredentials.length / requiredCreds.length) * 15;
    score += credScore;
    matchReasons.push(`${validCredentials.length}/${requiredCreds.length} credentials verified`);

    return {
      contractorId: contractor.id,
      contractor: {
        id: contractor.id,
        name: contractor.contactName,
        company: contractor.companyName,
        email: contractor.email,
        phone: contractor.phone,
        rating: contractor.rating,
        trades: contractor.trades,
      },
      score: score / 100,
      matchReasons,
      distance,
      availability: true, // TODO: Check against active projects
    };
  }

  private calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRad(point2.lat - point1.lat);
    const dLng = this.toRad(point2.lng - point1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(point1.lat)) *
      Math.cos(this.toRad(point2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

// ============================================================================
// BID REQUEST BUILDER
// ============================================================================

export class BidRequestBuilder {
  async createBidRequest(params: {
    projectId: string;
    trades: string[];
    scope: {
      description: string;
      lineItems: Array<{ item: string; quantity?: number; unit?: string }>;
      inclusions: string[];
      exclusions: string[];
    };
    requirements: {
      insuranceMinimum: number;
      bondRequired: boolean;
      prevailingWage?: boolean;
      certifications?: string[];
    };
    deadline: Date;
    responseDeadline: Date;
  }): Promise<string> {
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: params.projectId },
      include: { client: true },
    });

    const bidRequest = await prisma.bidRequest.create({
      data: {
        projectId: params.projectId,
        scope: params.scope,
        requirements: params.requirements,
        deadline: params.responseDeadline,
        status: 'OPEN',
      },
    });

    // Emit event
    await getEventBus().publish(
      EVENT_TYPES.BID_REQUEST_CREATED,
      {
        bidRequestId: bidRequest.id,
        projectId: params.projectId,
        projectName: project.name,
        trades: params.trades,
        deadline: params.responseDeadline,
      },
      'bid-engine'
    );

    return bidRequest.id;
  }

  async generateScopeDocument(bidRequestId: string): Promise<string> {
    const bidRequest = await prisma.bidRequest.findUniqueOrThrow({
      where: { id: bidRequestId },
      include: {
        project: {
          include: { client: true },
        },
      },
    });

    const scope = bidRequest.scope as any;
    const requirements = bidRequest.requirements as any;

    // Generate scope document using AI
    const prompt = `Generate a professional bid scope document for a construction project.

PROJECT: ${bidRequest.project.name}
ADDRESS: ${bidRequest.project.address}
CLIENT: ${bidRequest.project.client.name}

SCOPE OF WORK:
${scope.description}

LINE ITEMS:
${scope.lineItems.map((li: any) => `- ${li.item}${li.quantity ? ` (${li.quantity} ${li.unit || 'units'})` : ''}`).join('\n')}

INCLUSIONS:
${scope.inclusions.map((i: string) => `- ${i}`).join('\n')}

EXCLUSIONS:
${scope.exclusions.map((e: string) => `- ${e}`).join('\n')}

REQUIREMENTS:
- Minimum Insurance: ${formatCurrency(requirements.insuranceMinimum)}
- Bond Required: ${requirements.bondRequired ? 'Yes' : 'No'}
${requirements.prevailingWage ? '- Prevailing Wage Project' : ''}
${requirements.certifications?.length ? `- Required Certifications: ${requirements.certifications.join(', ')}` : ''}

BID DEADLINE: ${bidRequest.deadline.toLocaleDateString()}

Generate a professional, detailed scope document that contractors can use to prepare accurate bids.`;

    return generateText(prompt, 'You are a construction project manager creating detailed bid documents.');
  }
}

// ============================================================================
// INVITATION SENDER
// ============================================================================

export class InvitationSender {
  async sendInvitations(
    bidRequestId: string,
    contractors: MatchResult[]
  ): Promise<string[]> {
    const bidRequest = await prisma.bidRequest.findUniqueOrThrow({
      where: { id: bidRequestId },
      include: { project: true },
    });

    const invitationIds: string[] = [];

    for (const match of contractors) {
      // Create invitation record
      const invitation = await prisma.bidInvitation.create({
        data: {
          bidRequestId,
          contractorId: match.contractorId,
          status: 'SENT',
        },
      });

      // Generate unique bid submission link
      const bidLink = `${process.env.APP_URL}/bids/submit/${invitation.id}`;

      // Send email invitation
      await sendEmail({
        to: match.contractor.email,
        templateId: EMAIL_TEMPLATES.BID_INVITATION,
        dynamicTemplateData: {
          contractorName: match.contractor.name,
          projectName: bidRequest.project.name,
          projectAddress: bidRequest.project.address,
          deadline: bidRequest.deadline.toLocaleDateString(),
          bidLink,
          matchScore: Math.round(match.score * 100),
          matchReasons: match.matchReasons,
        },
      });

      invitationIds.push(invitation.id);

      // Emit event
      await getEventBus().publish(
        EVENT_TYPES.BID_INVITATION_SENT,
        {
          invitationId: invitation.id,
          bidRequestId,
          contractorId: match.contractorId,
          contractorEmail: match.contractor.email,
        },
        'bid-engine'
      );
    }

    return invitationIds;
  }

  async sendReminders(bidRequestId: string): Promise<void> {
    const invitations = await prisma.bidInvitation.findMany({
      where: {
        bidRequestId,
        status: { in: ['SENT', 'VIEWED'] },
      },
      include: {
        contractor: true,
        bidRequest: { include: { project: true } },
      },
    });

    for (const invitation of invitations) {
      const daysUntilDeadline = Math.ceil(
        (invitation.bidRequest.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilDeadline <= 3 && daysUntilDeadline > 0) {
        await sendEmail({
          to: invitation.contractor.email,
          subject: `Reminder: Bid deadline in ${daysUntilDeadline} days - ${invitation.bidRequest.project.name}`,
          html: `
            <p>Hi ${invitation.contractor.contactName},</p>
            <p>This is a friendly reminder that the bid deadline for <strong>${invitation.bidRequest.project.name}</strong> 
            is in <strong>${daysUntilDeadline} days</strong>.</p>
            <p>Please submit your bid before ${invitation.bidRequest.deadline.toLocaleDateString()}.</p>
            <p><a href="${process.env.APP_URL}/bids/submit/${invitation.id}">Submit Your Bid</a></p>
          `,
        });
      }
    }
  }
}

// ============================================================================
// BID ANALYZER
// ============================================================================

export class BidAnalyzer {
  private readonly WEIGHTS = {
    price: 0.35,
    timeline: 0.25,
    scope: 0.25,
    qualifications: 0.15,
  };

  async analyzeBids(bidRequestId: string): Promise<BidComparison> {
    const bidRequest = await prisma.bidRequest.findUniqueOrThrow({
      where: { id: bidRequestId },
      include: {
        project: true,
        submissions: {
          include: { contractor: true },
        },
      },
    });

    if (bidRequest.submissions.length === 0) {
      throw new Error('No bids submitted');
    }

    // Calculate baseline metrics
    const prices = bidRequest.submissions.map(s => Number(s.amount));
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    // Analyze each submission
    const analyses: BidAnalysis[] = bidRequest.submissions.map(submission => {
      return this.analyzeSubmission(submission, {
        avgPrice,
        minPrice,
        projectBudget: Number(bidRequest.project.budget) || avgPrice,
      });
    });

    // Sort by overall score and assign ranks
    analyses.sort((a, b) => b.overallScore - a.overallScore);
    analyses.forEach((analysis, index) => {
      analysis.rank = index + 1;
    });

    // Generate AI narrative
    const aiNarrative = await this.generateComparisonNarrative(
      bidRequest.project.name,
      analyses
    );

    const comparison: BidComparison = {
      projectId: bidRequest.projectId,
      bidRequestId,
      analyses,
      summary: {
        totalBids: analyses.length,
        averagePrice: avgPrice,
        priceRange: { min: minPrice, max: maxPrice },
        recommendedContractor: analyses[0].contractorName,
        aiNarrative,
      },
      generatedAt: new Date(),
    };

    // Store analysis results
    for (const analysis of analyses) {
      await prisma.bidSubmission.update({
        where: { id: analysis.submissionId },
        data: {
          score: analysis.overallScore,
          recommendation: analysis.recommendation,
        },
      });
    }

    // Emit event
    await getEventBus().publish(
      EVENT_TYPES.BID_ANALYSIS_COMPLETE,
      {
        bidRequestId,
        projectId: bidRequest.projectId,
        totalBids: analyses.length,
        recommendedContractor: analyses[0].contractorName,
      },
      'bid-engine'
    );

    return comparison;
  }

  private analyzeSubmission(
    submission: any,
    context: { avgPrice: number; minPrice: number; projectBudget: number }
  ): BidAnalysis {
    const strengths: string[] = [];
    const concerns: string[] = [];
    const amount = Number(submission.amount);
    const timeline = submission.timeline as any;
    const scope = submission.scope as any;

    // Price Score (0-100)
    let priceScore: number;
    const priceRatio = amount / context.avgPrice;
    
    if (priceRatio <= 0.9) {
      priceScore = 95;
      strengths.push(`Competitive pricing (${Math.round((1 - priceRatio) * 100)}% below average)`);
    } else if (priceRatio <= 1.0) {
      priceScore = 85;
      strengths.push('Pricing at or below market average');
    } else if (priceRatio <= 1.1) {
      priceScore = 70;
    } else if (priceRatio <= 1.2) {
      priceScore = 50;
      concerns.push(`Pricing ${Math.round((priceRatio - 1) * 100)}% above average`);
    } else {
      priceScore = 30;
      concerns.push(`Significant premium pricing (${Math.round((priceRatio - 1) * 100)}% above average)`);
    }

    // Very low prices are a concern
    if (amount < context.minPrice * 1.05 && amount < context.avgPrice * 0.8) {
      concerns.push('Pricing significantly below competitors - verify scope understanding');
      priceScore = Math.min(priceScore, 60);
    }

    // Timeline Score (0-100)
    let timelineScore = 70;
    const proposedDays = timeline?.totalDays || 0;
    
    if (timeline?.milestones?.length > 3) {
      timelineScore += 15;
      strengths.push('Detailed milestone schedule provided');
    }
    if (timeline?.startDate && new Date(timeline.startDate) <= new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)) {
      timelineScore += 10;
      strengths.push('Quick mobilization capability');
    }
    if (!timeline || !timeline.totalDays) {
      timelineScore = 40;
      concerns.push('Timeline details not provided');
    }

    // Scope Score (0-100)
    let scopeScore = 70;
    
    if (scope?.inclusions?.length > 5) {
      scopeScore += 15;
      strengths.push('Comprehensive scope inclusions');
    }
    if (scope?.exclusions?.length > 0) {
      scopeScore += 10;
      strengths.push('Clear exclusions defined');
    }
    if (scope?.clarifications?.length > 0) {
      strengths.push('Proactive clarifications provided');
    }
    if (!scope || Object.keys(scope).length < 2) {
      scopeScore = 40;
      concerns.push('Scope details insufficient');
    }

    // Qualification Score (0-100)
    let qualificationScore = 70;
    const contractor = submission.contractor;
    
    if (contractor.rating >= 4.5) {
      qualificationScore += 20;
      strengths.push(`Excellent rating (${contractor.rating}★)`);
    } else if (contractor.rating >= 4.0) {
      qualificationScore += 10;
    } else if (contractor.rating < 3.5) {
      qualificationScore -= 20;
      concerns.push(`Lower rating (${contractor.rating}★)`);
    }

    // Calculate overall score
    const overallScore =
      priceScore * this.WEIGHTS.price +
      timelineScore * this.WEIGHTS.timeline +
      scopeScore * this.WEIGHTS.scope +
      qualificationScore * this.WEIGHTS.qualifications;

    // Determine recommendation
    let recommendation: BidAnalysis['recommendation'];
    if (overallScore >= 85) {
      recommendation = 'HIGHLY_RECOMMENDED';
    } else if (overallScore >= 70) {
      recommendation = 'RECOMMENDED';
    } else if (overallScore >= 55) {
      recommendation = 'ACCEPTABLE';
    } else {
      recommendation = 'NOT_RECOMMENDED';
    }

    return {
      submissionId: submission.id,
      contractorName: contractor.companyName,
      amount,
      priceScore,
      timelineScore,
      scopeScore,
      qualificationScore,
      overallScore,
      strengths,
      concerns,
      recommendation,
      rank: 0, // Set later
    };
  }

  private async generateComparisonNarrative(
    projectName: string,
    analyses: BidAnalysis[]
  ): Promise<string> {
    const prompt = `Generate a brief executive summary (2-3 paragraphs) comparing these contractor bids for "${projectName}":

${analyses.map((a, i) => `
#${i + 1} ${a.contractorName}
- Amount: ${formatCurrency(a.amount)}
- Overall Score: ${a.overallScore.toFixed(1)}/100
- Recommendation: ${a.recommendation}
- Strengths: ${a.strengths.join(', ')}
- Concerns: ${a.concerns.join(', ') || 'None'}
`).join('\n')}

Provide an objective analysis highlighting key differences and the rationale for the top recommendation.`;

    return generateText(prompt, 'You are a construction consultant providing bid analysis.');
  }
}

// ============================================================================
// CREDENTIAL VERIFIER
// ============================================================================

export class CredentialVerifier {
  async verifyContractor(contractorId: string): Promise<{
    isVerified: boolean;
    issues: string[];
    credentials: Array<{ type: string; status: string; expiresAt?: Date }>;
  }> {
    const contractor = await prisma.contractor.findUniqueOrThrow({
      where: { id: contractorId },
      include: { credentials: true },
    });

    const issues: string[] = [];
    const now = new Date();

    const credentials = contractor.credentials.map(cred => {
      let status = 'VALID';
      
      if (cred.expiresAt && cred.expiresAt < now) {
        status = 'EXPIRED';
        issues.push(`${cred.type} expired on ${cred.expiresAt.toLocaleDateString()}`);
      } else if (cred.expiresAt && cred.expiresAt < addWorkingDays(now, 30)) {
        status = 'EXPIRING_SOON';
        issues.push(`${cred.type} expires on ${cred.expiresAt.toLocaleDateString()}`);
      }

      return {
        type: cred.type,
        status,
        expiresAt: cred.expiresAt || undefined,
      };
    });

    // Check for required credentials
    const requiredTypes = ['LICENSE', 'GENERAL_LIABILITY', 'WORKERS_COMP'];
    for (const required of requiredTypes) {
      const found = credentials.find(c => 
        c.type.toUpperCase().includes(required) && c.status === 'VALID'
      );
      if (!found) {
        issues.push(`Missing or invalid ${required.replace('_', ' ')}`);
      }
    }

    return {
      isVerified: issues.length === 0,
      issues,
      credentials,
    };
  }

  async verifyLicense(licenseNumber: string, state: string): Promise<{
    valid: boolean;
    details?: any;
  }> {
    // In production, integrate with state licensing board APIs
    // For now, return mock verification
    console.log(`Verifying license ${licenseNumber} in ${state}`);
    
    return {
      valid: true,
      details: {
        licenseNumber,
        state,
        status: 'ACTIVE',
        verifiedAt: new Date(),
      },
    };
  }

  async verifyInsurance(contractorId: string): Promise<{
    valid: boolean;
    coverage: {
      generalLiability?: number;
      workersComp?: boolean;
      autoLiability?: number;
    };
  }> {
    const credentials = await prisma.credential.findMany({
      where: {
        contractorId,
        type: { contains: 'INSURANCE' },
        expiresAt: { gt: new Date() },
      },
    });

    const coverage: any = {};
    
    for (const cred of credentials) {
      const details = cred.details as any;
      if (cred.type.includes('GENERAL_LIABILITY')) {
        coverage.generalLiability = details?.coverageAmount;
      }
      if (cred.type.includes('WORKERS_COMP')) {
        coverage.workersComp = true;
      }
      if (cred.type.includes('AUTO')) {
        coverage.autoLiability = details?.coverageAmount;
      }
    }

    return {
      valid: Boolean(coverage.generalLiability && coverage.workersComp),
      coverage,
    };
  }
}

// ============================================================================
// JOB HANDLERS
// ============================================================================

interface CreateBidRequestJob {
  type: 'CREATE_BID_REQUEST';
  projectId: string;
  trades: string[];
  scope: any;
  requirements: any;
  deadline: string;
}

interface FindContractorsJob {
  type: 'FIND_CONTRACTORS';
  bidRequestId: string;
  criteria: MatchCriteria;
}

interface SendInvitationsJob {
  type: 'SEND_INVITATIONS';
  bidRequestId: string;
  contractorIds: string[];
}

interface AnalyzeBidsJob {
  type: 'ANALYZE_BIDS';
  bidRequestId: string;
}

interface SendRemindersJob {
  type: 'SEND_REMINDERS';
  bidRequestId: string;
}

type BidEngineJob = 
  | CreateBidRequestJob 
  | FindContractorsJob 
  | SendInvitationsJob 
  | AnalyzeBidsJob
  | SendRemindersJob;

// ============================================================================
// WORKER
// ============================================================================

const matcher = new ContractorMatcher();
const builder = new BidRequestBuilder();
const sender = new InvitationSender();
const analyzer = new BidAnalyzer();
const verifier = new CredentialVerifier();

export const bidEngineWorker = createWorker<BidEngineJob>(
  QUEUE_NAMES.BID_ENGINE,
  async (job: Job<BidEngineJob>) => {
    console.log(`Processing bid-engine job: ${job.data.type}`);

    switch (job.data.type) {
      case 'CREATE_BID_REQUEST': {
        const { projectId, trades, scope, requirements, deadline } = job.data;
        
        // Create bid request
        const bidRequestId = await builder.createBidRequest({
          projectId,
          trades,
          scope,
          requirements,
          deadline: new Date(deadline),
          responseDeadline: new Date(deadline),
        });

        // Queue contractor matching
        await queues.BID_ENGINE.add(
          'find-contractors',
          {
            type: 'FIND_CONTRACTORS',
            bidRequestId,
            criteria: {
              projectId,
              trades,
              location: { lat: 38.9, lng: -77.0 }, // TODO: Get from project
              budgetRange: { min: 0, max: Infinity },
              timeline: { start: new Date(), end: new Date(deadline) },
            },
          },
          JOB_OPTIONS.DEFAULT
        );

        return { bidRequestId };
      }

      case 'FIND_CONTRACTORS': {
        const { bidRequestId, criteria } = job.data;
        
        // Find matching contractors
        const matches = await matcher.findMatches(criteria);

        if (matches.length === 0) {
          console.log('No matching contractors found');
          return { matches: [] };
        }

        // Verify top contractors
        for (const match of matches.slice(0, 5)) {
          const verification = await verifier.verifyContractor(match.contractorId);
          if (!verification.isVerified) {
            console.log(`Contractor ${match.contractor.company} has issues:`, verification.issues);
          }
        }

        // Queue invitation sending
        await queues.BID_ENGINE.add(
          'send-invitations',
          {
            type: 'SEND_INVITATIONS',
            bidRequestId,
            contractorIds: matches.map(m => m.contractorId),
          },
          JOB_OPTIONS.DEFAULT
        );

        return { matchCount: matches.length, matches };
      }

      case 'SEND_INVITATIONS': {
        const { bidRequestId, contractorIds } = job.data;
        
        // Get contractor details
        const contractors = await prisma.contractor.findMany({
          where: { id: { in: contractorIds } },
        });

        const matchResults: MatchResult[] = contractors.map(c => ({
          contractorId: c.id,
          contractor: {
            id: c.id,
            name: c.contactName,
            company: c.companyName,
            email: c.email,
            phone: c.phone,
            rating: Number(c.rating),
            trades: c.trades,
          },
          score: 0.8,
          matchReasons: [],
          distance: 0,
          availability: true,
        }));

        const invitationIds = await sender.sendInvitations(bidRequestId, matchResults);

        // Schedule reminder job
        const bidRequest = await prisma.bidRequest.findUnique({
          where: { id: bidRequestId },
        });
        
        if (bidRequest) {
          const reminderDelay = bidRequest.deadline.getTime() - Date.now() - 3 * 24 * 60 * 60 * 1000;
          if (reminderDelay > 0) {
            await queues.BID_ENGINE.add(
              'send-reminders',
              { type: 'SEND_REMINDERS', bidRequestId },
              { ...JOB_OPTIONS.SCHEDULED, delay: reminderDelay }
            );
          }
        }

        return { invitationCount: invitationIds.length };
      }

      case 'ANALYZE_BIDS': {
        const { bidRequestId } = job.data;
        const comparison = await analyzer.analyzeBids(bidRequestId);
        return comparison;
      }

      case 'SEND_REMINDERS': {
        const { bidRequestId } = job.data;
        await sender.sendReminders(bidRequestId);
        return { sent: true };
      }

      default:
        throw new Error(`Unknown job type: ${(job.data as any).type}`);
    }
  },
  3 // Concurrency
);

// ============================================================================
// API ROUTES
// ============================================================================

import { FastifyInstance } from 'fastify';

export async function bidEngineRoutes(fastify: FastifyInstance) {
  // Create bid request
  fastify.post('/bid-requests', async (request, reply) => {
    const body = request.body as any;
    
    const job = await queues.BID_ENGINE.add(
      'create-bid-request',
      {
        type: 'CREATE_BID_REQUEST',
        ...body,
      },
      JOB_OPTIONS.DEFAULT
    );

    return { jobId: job.id, message: 'Bid request creation started' };
  });

  // Get bid request status
  fastify.get('/bid-requests/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    const bidRequest = await prisma.bidRequest.findUnique({
      where: { id },
      include: {
        project: true,
        invitations: { include: { contractor: true } },
        submissions: { include: { contractor: true } },
      },
    });

    if (!bidRequest) {
      return reply.status(404).send({ error: 'Bid request not found' });
    }

    return bidRequest;
  });

  // Manually trigger analysis
  fastify.post('/bid-requests/:id/analyze', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    const job = await queues.BID_ENGINE.add(
      'analyze-bids',
      { type: 'ANALYZE_BIDS', bidRequestId: id },
      JOB_OPTIONS.HIGH_PRIORITY
    );

    return { jobId: job.id, message: 'Bid analysis started' };
  });

  // Get bid comparison
  fastify.get('/bid-requests/:id/comparison', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    const submissions = await prisma.bidSubmission.findMany({
      where: { bidRequestId: id },
      include: { contractor: true },
      orderBy: { score: 'desc' },
    });

    return submissions;
  });

  // Find contractors for a project
  fastify.post('/contractors/match', async (request, reply) => {
    const criteria = request.body as MatchCriteria;
    const matches = await matcher.findMatches(criteria);
    return matches;
  });

  // Verify contractor credentials
  fastify.get('/contractors/:id/verify', async (request, reply) => {
    const { id } = request.params as { id: string };
    const verification = await verifier.verifyContractor(id);
    return verification;
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  ContractorMatcher,
  BidRequestBuilder,
  InvitationSender,
  BidAnalyzer,
  CredentialVerifier,
};
