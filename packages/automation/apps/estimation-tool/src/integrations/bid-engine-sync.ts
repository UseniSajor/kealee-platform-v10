/**
 * Bid Engine Sync
 * Integration with APP-01 Bid Engine
 *
 * Note: This integration works with available Prisma models:
 * - BidRequest: Has projectId, title, deadline, status, scope, trades
 * - BidSubmission: Has bidRequestId, contractorId, amount, scope, alternates, exclusions
 * - Estimate: Has organizationId, bidRequestId, status (EstimateStatus enum)
 */

import { Prisma, PrismaClient } from '@prisma/client';
import { v4 as uuid } from 'uuid';
import {
  notifyBidSubmitted,
  notifyBidSyncComplete,
} from '@kealee/realtime';

const prisma = new PrismaClient();

/**
 * Internal interface representing bid request data for this integration.
 * Maps from actual BidRequest model which uses 'deadline' instead of 'dueDate'.
 */
export interface BidRequestData {
  id: string;
  projectId: string;
  title: string | null;
  deadline: Date;
  status: string;
  scope?: Record<string, unknown>;
  trades?: string[];
}

/**
 * Submission data for creating a bid from an estimate.
 * Note: Actual BidSubmission model uses 'amount' and 'contractorId',
 * and links to Estimate via Estimate.bidRequestId.
 */
export interface BidSubmissionInput {
  bidRequestId: string;
  estimateId: string;
  contractorId: string;
  amount: number;
  scope?: Record<string, unknown>;
  alternates?: BidAlternate[];
  exclusions?: string[];
  assumptions?: string[];
  validUntil?: Date;
}

export interface BidAlternate {
  id: string;
  name: string;
  description: string;
  addAmount?: number;
  deductAmount?: number;
}

export interface SyncResult {
  success: boolean;
  syncedAt: Date;
  details: {
    bidRequestsReceived?: number;
    estimatesLinked?: number;
    errors?: string[];
  };
}

export class BidEngineSync {
  private readonly bidEngineUrl: string;

  constructor() {
    this.bidEngineUrl = process.env.BID_ENGINE_URL || 'http://localhost:3001';
  }

  /**
   * Sync bid requests from bid engine and link with estimates.
   * Since there's no EstimationOrder model, this method finds open bid requests
   * and checks if there are linked estimates via Estimate.bidRequestId.
   */
  async syncBidRequests(organizationId: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      syncedAt: new Date(),
      details: {
        bidRequestsReceived: 0,
        estimatesLinked: 0,
        errors: [],
      },
    };

    try {
      // Get open bid requests - BidRequest doesn't have organizationId,
      // so we get all open ones and filter by project's organization if needed
      const bidRequests = await prisma.bidRequest.findMany({
        where: {
          status: 'OPEN',
        },
        orderBy: { deadline: 'asc' },
        include: {
          project: true,
        },
      });

      result.details.bidRequestsReceived = bidRequests.length;

      // Check for linked estimates for each bid request
      for (const bidRequest of bidRequests) {
        const linkedEstimate = await prisma.estimate.findFirst({
          where: {
            bidRequestId: bidRequest.id,
            organizationId,
          },
        });

        if (linkedEstimate) {
          result.details.estimatesLinked = (result.details.estimatesLinked || 0) + 1;
        }
        // Note: Estimate creation would be handled separately by the estimation service
        // This sync just tracks the relationship between bid requests and estimates
      }

      // Broadcast bid sync complete event
      notifyBidSyncComplete({
        projectId: '',
        organizationId,
      }).catch((err: unknown) =>
        console.error('[Realtime] bid.sync_complete broadcast failed:', err)
      );

    } catch (error) {
      result.success = false;
      result.details.errors?.push(String(error));
    }

    return result;
  }

  /**
   * Submit estimate as bid.
   * Creates a BidSubmission record and updates the linked Estimate status.
   */
  async submitBid(submission: BidSubmissionInput): Promise<{
    success: boolean;
    bidId?: string;
    error?: string;
  }> {
    try {
      // Validate estimate
      const estimate = await prisma.estimate.findUnique({
        where: { id: submission.estimateId },
      });

      if (!estimate) {
        return { success: false, error: 'Estimate not found' };
      }

      // Validate bid request
      const bidRequest = await prisma.bidRequest.findUnique({
        where: { id: submission.bidRequestId },
      });

      if (!bidRequest) {
        return { success: false, error: 'Bid request not found' };
      }

      if (bidRequest.status !== 'OPEN') {
        return { success: false, error: 'Bid request is no longer open' };
      }

      // Create bid submission using actual schema fields
      const bidId = uuid();
      await prisma.bidSubmission.create({
        data: {
          id: bidId,
          bidRequestId: submission.bidRequestId,
          contractorId: submission.contractorId,
          amount: submission.amount,
          scope: submission.scope ? (submission.scope as Prisma.InputJsonValue) : Prisma.JsonNull,
          alternates: submission.alternates ? (submission.alternates as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
          exclusions: submission.exclusions || [],
          assumptions: submission.assumptions || [],
          validUntil: submission.validUntil,
          status: 'SUBMITTED',
        },
      });

      // Update estimate status to SENT_ESTIMATE (actual enum value)
      // and link to this bid request if not already linked
      await prisma.estimate.update({
        where: { id: submission.estimateId },
        data: {
          status: 'SENT_ESTIMATE',
          bidRequestId: submission.bidRequestId,
          sentAt: new Date(),
          metadata: {
            ...(estimate.metadata as Record<string, unknown> | null),
            bidSubmissionId: bidId,
            submittedAt: new Date().toISOString(),
          },
        },
      });

      // In production, would also call bid engine API
      // await this.callBidEngineAPI('POST', '/api/bids/submit', { bidId, ...submission });

      // Broadcast bid submitted event
      notifyBidSubmitted({
        bidId,
        bidRequestId: submission.bidRequestId,
        estimateId: submission.estimateId,
        amount: submission.amount,
        projectId: estimate.projectId || '',
        organizationId: estimate.organizationId,
      }).catch((err: unknown) =>
        console.error('[Realtime] bid.submitted broadcast failed:', err)
      );

      return { success: true, bidId };

    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get bid analysis for a bid request.
   * Analyzes all submissions and provides statistical summary.
   */
  async getBidAnalysis(bidRequestId: string): Promise<{
    bidRequest: BidRequestData;
    submissions: {
      id: string;
      contractorId: string;
      amount: number;
      rank: number;
      variance: number;
    }[];
    analysis: {
      averageBid: number;
      medianBid: number;
      lowBid: number;
      highBid: number;
      spread: number;
    };
  } | null> {
    const bidRequest = await prisma.bidRequest.findUnique({
      where: { id: bidRequestId },
    });

    if (!bidRequest) return null;

    // BidSubmission uses 'amount' not 'totalAmount'
    const submissions = await prisma.bidSubmission.findMany({
      where: { bidRequestId },
      orderBy: { amount: 'asc' },
    });

    if (submissions.length === 0) {
      return {
        bidRequest: this.mapToBidRequestData(bidRequest),
        submissions: [],
        analysis: {
          averageBid: 0,
          medianBid: 0,
          lowBid: 0,
          highBid: 0,
          spread: 0,
        },
      };
    }

    const amounts = submissions.map(s => Number(s.amount) || 0);
    const average = amounts.reduce((sum, t) => sum + t, 0) / amounts.length;
    const sorted = [...amounts].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    return {
      bidRequest: this.mapToBidRequestData(bidRequest),
      submissions: submissions.map((s, index) => ({
        id: s.id,
        contractorId: s.contractorId, // Uses contractorId, not organizationId
        amount: Number(s.amount),
        rank: index + 1,
        variance: average > 0 ? ((Number(s.amount) - average) / average) * 100 : 0,
      })),
      analysis: {
        averageBid: average,
        medianBid: median,
        lowBid: sorted[0],
        highBid: sorted[sorted.length - 1],
        spread: sorted[sorted.length - 1] - sorted[0],
      },
    };
  }

  /**
   * Get pending bid requests for an organization.
   * Since BidRequest doesn't have organizationId, we find estimates
   * linked to bid requests for this organization and return associated bid data.
   */
  async getPendingBidRequests(
    organizationId: string
  ): Promise<{
    bidRequest: BidRequestData;
    hasEstimate: boolean;
    estimateId?: string;
    daysUntilDeadline: number;
  }[]> {
    // Get open bid requests
    const bidRequests = await prisma.bidRequest.findMany({
      where: {
        status: 'OPEN',
      },
      orderBy: { deadline: 'asc' },
    });

    const result = [];

    for (const bidRequest of bidRequests) {
      // Check if there's an estimate linked to this bid request for this organization
      const linkedEstimate = await prisma.estimate.findFirst({
        where: {
          bidRequestId: bidRequest.id,
          organizationId,
        },
      });

      const now = new Date();
      const deadline = new Date(bidRequest.deadline);
      const daysUntilDeadline = Math.ceil(
        (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      result.push({
        bidRequest: this.mapToBidRequestData(bidRequest),
        hasEstimate: !!linkedEstimate,
        estimateId: linkedEstimate?.id || undefined,
        daysUntilDeadline,
      });
    }

    return result;
  }

  /**
   * Calculate priority from deadline date.
   * Useful for UI display and sorting.
   */
  calculatePriorityFromDeadline(deadline: Date): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    const now = new Date();
    const days = Math.ceil(
      (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (days <= 3) return 'CRITICAL';
    if (days <= 7) return 'HIGH';
    if (days <= 14) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Map database BidRequest to BidRequestData interface.
   * Handles the actual schema fields (deadline instead of dueDate, etc.)
   */
  private mapToBidRequestData(record: {
    id: string;
    projectId: string;
    title: string | null;
    deadline: Date;
    status: string;
    scope: unknown;
    trades: string[];
  }): BidRequestData {
    return {
      id: record.id,
      projectId: record.projectId,
      title: record.title,
      deadline: record.deadline,
      status: record.status,
      scope: record.scope as Record<string, unknown> | undefined,
      trades: record.trades,
    };
  }
}

export const bidEngineSync = new BidEngineSync();
