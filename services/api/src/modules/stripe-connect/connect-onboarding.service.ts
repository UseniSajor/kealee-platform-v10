/**
 * Connect Onboarding Service
 * Handles Stripe Connect account creation and onboarding for contractors
 */

import Stripe from 'stripe'
import { prisma } from '@kealee/database'
import { ConnectedAccountType, ConnectedAccountStatus } from '@kealee/database'
import { withRetry } from '../../utils/retry'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export interface CreateConnectedAccountDTO {
  userId: string
  accountType: ConnectedAccountType
  email: string
  country?: string
  businessType?: 'individual' | 'company' | 'non_profit'
  platformFeePercentage?: number
}

export interface GenerateOnboardingLinkDTO {
  userId: string
  returnUrl: string
  refreshUrl: string
}

export interface UpdateAccountRequirementsDTO {
  stripeAccountId: string
  requirements: any
}

export class ConnectOnboardingService {
  /**
   * Create a Stripe Connected Account for a contractor
   */
  static async createConnectedAccount(data: CreateConnectedAccountDTO) {
    const {
      userId,
      accountType,
      email,
      country = 'US',
      businessType = 'individual',
      platformFeePercentage = 2.5, // Default 2.5% platform fee
    } = data

    // Check if user already has a connected account
    const existing = await prisma.connectedAccount.findUnique({
      where: { userId },
    })

    if (existing) {
      throw new Error('User already has a connected account')
    }

    // Determine account type for Stripe
    const stripeAccountType = accountType === 'EXPRESS' ? 'express' : 'standard'

    // Create Stripe Account
    const stripeAccount = await withRetry(
      () => stripe.accounts.create({
        type: stripeAccountType,
        country,
        email,
        business_type: businessType,
        capabilities: {
          transfers: {
            requested: true,
          },
          ...(accountType === 'EXPRESS' && {
            card_payments: {
              requested: true,
            },
          }),
        },
        settings: {
          payouts: {
            schedule: {
              interval: 'daily', // Daily payouts
            },
          },
        },
        metadata: {
          userId,
          platform: 'kealee',
          accountType,
        },
      }),
      { label: 'Stripe.accounts.create' }
    )

    // Create database record
    const connectedAccount = await prisma.connectedAccount.create({
      data: {
        userId,
        stripeAccountId: stripeAccount.id,
        accountType,
        status: 'PENDING',
        country,
        currency: stripeAccount.default_currency?.toUpperCase() || 'USD',
        email,
        hasCompletedOnboarding: false,
        payoutsEnabled: false,
        chargesEnabled: false,
        platformFeePercentage,
        requirements: stripeAccount.requirements
          ? JSON.parse(JSON.stringify(stripeAccount.requirements))
          : null,
      },
    })

    return {
      connectedAccount,
      stripeAccount,
    }
  }

  /**
   * Generate an onboarding link for account information collection
   */
  static async generateOnboardingLink(data: GenerateOnboardingLinkDTO) {
    const { userId, returnUrl, refreshUrl } = data

    // Get connected account
    const connectedAccount = await prisma.connectedAccount.findUnique({
      where: { userId },
    })

    if (!connectedAccount) {
      throw new Error('Connected account not found')
    }

    // Create Stripe Account Link
    const accountLink = await withRetry(
      () => stripe.accountLinks.create({
        account: connectedAccount.stripeAccountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      }),
      { label: 'Stripe.accountLinks.create' }
    )

    // Update database with link info
    await prisma.connectedAccount.update({
      where: { id: connectedAccount.id },
      data: {
        onboardingLink: accountLink.url,
        onboardingLinkExpires: new Date(accountLink.expires_at * 1000),
      },
    })

    return {
      url: accountLink.url,
      expiresAt: new Date(accountLink.expires_at * 1000),
    }
  }

  /**
   * Refresh account details from Stripe
   */
  static async refreshAccountDetails(userId: string) {
    const connectedAccount = await prisma.connectedAccount.findUnique({
      where: { userId },
    })

    if (!connectedAccount) {
      throw new Error('Connected account not found')
    }

    // Fetch latest from Stripe
    const stripeAccount = await withRetry(
      () => stripe.accounts.retrieve(
        connectedAccount.stripeAccountId
      ),
      { label: 'Stripe.accounts.retrieve' }
    )

    // Check capabilities
    const payoutsEnabled =
      stripeAccount.capabilities?.transfers === 'active'
    const chargesEnabled =
      stripeAccount.capabilities?.card_payments === 'active'

    // Check onboarding completion
    const hasCompletedOnboarding =
      stripeAccount.details_submitted &&
      stripeAccount.charges_enabled === true &&
      stripeAccount.payouts_enabled === true

    // Determine status
    let status: ConnectedAccountStatus = connectedAccount.status

    if (hasCompletedOnboarding && payoutsEnabled) {
      status = 'ACTIVE'
    } else if (stripeAccount.requirements?.disabled_reason) {
      status = 'DISABLED'
    } else if (
      (stripeAccount.requirements?.currently_due?.length ?? 0) > 0 ||
      (stripeAccount.requirements?.past_due?.length ?? 0) > 0
    ) {
      status = 'RESTRICTED'
    } else if (stripeAccount.details_submitted) {
      status = 'PENDING' // Waiting for Stripe verification
    }

    // Update database
    const updated = await prisma.connectedAccount.update({
      where: { id: connectedAccount.id },
      data: {
        status,
        hasCompletedOnboarding,
        payoutsEnabled,
        chargesEnabled,
        requirements: stripeAccount.requirements
          ? JSON.parse(JSON.stringify(stripeAccount.requirements))
          : null,
      },
    })

    return {
      connectedAccount: updated,
      stripeAccount,
    }
  }

  /**
   * Get account requirements (missing information)
   */
  static async getAccountRequirements(userId: string) {
    const connectedAccount = await prisma.connectedAccount.findUnique({
      where: { userId },
    })

    if (!connectedAccount) {
      throw new Error('Connected account not found')
    }

    const stripeAccount = await withRetry(
      () => stripe.accounts.retrieve(
        connectedAccount.stripeAccountId
      ),
      { label: 'Stripe.accounts.retrieve' }
    )

    return {
      currentlyDue: stripeAccount.requirements?.currently_due || [],
      eventuallyDue: stripeAccount.requirements?.eventually_due || [],
      pastDue: stripeAccount.requirements?.past_due || [],
      disabledReason: stripeAccount.requirements?.disabled_reason,
      pendingVerification:
        stripeAccount.requirements?.pending_verification || [],
    }
  }

  /**
   * Update tax information
   */
  static async updateTaxInformation(
    userId: string,
    taxData: {
      taxClassification: string
      taxId: string
      taxFormStatus: string
    }
  ) {
    const connectedAccount = await prisma.connectedAccount.findUnique({
      where: { userId },
    })

    if (!connectedAccount) {
      throw new Error('Connected account not found')
    }

    // Update database with tax info
    const updated = await prisma.connectedAccount.update({
      where: { id: connectedAccount.id },
      data: {
        taxClassification: taxData.taxClassification,
        taxId: taxData.taxId, // Should be encrypted in production
        taxFormStatus: taxData.taxFormStatus,
      },
    })

    return updated
  }

  /**
   * Get account balance from Stripe
   */
  static async getAccountBalance(userId: string) {
    const connectedAccount = await prisma.connectedAccount.findUnique({
      where: { userId },
    })

    if (!connectedAccount) {
      throw new Error('Connected account not found')
    }

    const balance = await withRetry(
      () => stripe.balance.retrieve({
        stripeAccount: connectedAccount.stripeAccountId,
      }),
      { label: 'Stripe.balance.retrieve' }
    )

    return {
      available: balance.available.map((b) => ({
        amount: b.amount / 100, // Convert from cents
        currency: b.currency.toUpperCase(),
      })),
      pending: balance.pending.map((b) => ({
        amount: b.amount / 100,
        currency: b.currency.toUpperCase(),
      })),
    }
  }

  /**
   * Deauthorize/disable account
   */
  static async deauthorizeAccount(userId: string, reason?: string) {
    const connectedAccount = await prisma.connectedAccount.findUnique({
      where: { userId },
    })

    if (!connectedAccount) {
      throw new Error('Connected account not found')
    }

    // Update database status
    await prisma.connectedAccount.update({
      where: { id: connectedAccount.id },
      data: {
        status: 'DISABLED',
        metadata: {
          ...(connectedAccount.metadata as any),
          disabledReason: reason,
          disabledAt: new Date().toISOString(),
        },
      },
    })

    // Note: Stripe account is not deleted, just marked as disabled
    // Actual Stripe account deletion should be done manually via Stripe Dashboard
    // or with explicit contractor consent due to legal requirements

    return { success: true }
  }

  /**
   * Get connected account by user ID
   */
  static async getConnectedAccount(userId: string) {
    const connectedAccount = await prisma.connectedAccount.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return connectedAccount
  }

  /**
   * List all connected accounts (admin)
   */
  static async listConnectedAccounts(filters?: {
    status?: ConnectedAccountStatus
    hasCompletedOnboarding?: boolean
    limit?: number
    offset?: number
  }) {
    const where: any = {}

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.hasCompletedOnboarding !== undefined) {
      where.hasCompletedOnboarding = filters.hasCompletedOnboarding
    }

    const [accounts, total] = await Promise.all([
      prisma.connectedAccount.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.connectedAccount.count({ where }),
    ])

    return {
      accounts,
      total,
      limit: filters?.limit || 50,
      offset: filters?.offset || 0,
    }
  }
}

