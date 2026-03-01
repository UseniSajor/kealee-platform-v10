/**
 * Stripe Connect Service
 * Handles contractor onboarding and Connect account management
 */

import { getStripe } from '../billing/stripe.client'
import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError, ValidationError } from '../../errors/app.error'
import { withRetry } from '../../utils/retry'

const PLATFORM_FEE_PERCENTAGE = 0.03 // 3%

class StripeConnectService {
  /**
   * Create Stripe Connect account for contractor
   */
  async createConnectAccount(userId: string, email: string, country: string = 'US') {
    const stripe = getStripe()

    // Check if user already has a Connect account
    const user = await prismaAny.user.findUnique({
      where: { id: userId },
      select: { id: true, stripeAccountId: true },
    })

    if (!user) {
      throw new NotFoundError('User', userId)
    }

    if (user.stripeAccountId) {
      // Return existing account
      const account = await withRetry(
        () => stripe.accounts.retrieve(user.stripeAccountId),
        { label: 'Stripe.accounts.retrieve' }
      )
      return {
        accountId: account.id,
        onboardingUrl: null, // Already onboarded
        isOnboarded: account.details_submitted,
      }
    }

    // Create Express account (recommended for contractors)
    const account = await withRetry(
      () => stripe.accounts.create({
        type: 'express',
        country,
        email,
        capabilities: {
          transfers: { requested: true },
          card_payments: { requested: true },
        },
        metadata: {
          userId,
          type: 'contractor',
        },
      }),
      { label: 'Stripe.accounts.create' }
    )

    // Store account ID in database
    await prismaAny.user.update({
      where: { id: userId },
      data: { stripeAccountId: account.id },
    })

    // Create account link for onboarding
    const accountLink = await withRetry(
      () => stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/contractor/onboarding/refresh`,
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/contractor/onboarding/complete`,
        type: 'account_onboarding',
      }),
      { label: 'Stripe.accountLinks.create' }
    )

    return {
      accountId: account.id,
      onboardingUrl: accountLink.url,
      isOnboarded: false,
    }
  }

  /**
   * Get Connect account status
   */
  async getConnectAccountStatus(userId: string) {
    const user = await prismaAny.user.findUnique({
      where: { id: userId },
      select: { id: true, stripeAccountId: true },
    })

    if (!user) {
      throw new NotFoundError('User', userId)
    }

    if (!user.stripeAccountId) {
      return {
        hasAccount: false,
        isOnboarded: false,
        canReceivePayments: false,
      }
    }

    const stripe = getStripe()
    const account = await withRetry(
      () => stripe.accounts.retrieve(user.stripeAccountId),
      { label: 'Stripe.accounts.retrieve' }
    )

    return {
      hasAccount: true,
      accountId: account.id,
      isOnboarded: account.details_submitted,
      canReceivePayments: account.charges_enabled && account.payouts_enabled,
      requirements: account.requirements,
    }
  }

  /**
   * Create account link for onboarding or updating
   */
  async createAccountLink(userId: string, type: 'onboarding' | 'update' = 'onboarding') {
    const user = await prismaAny.user.findUnique({
      where: { id: userId },
      select: { id: true, stripeAccountId: true },
    })

    if (!user) {
      throw new NotFoundError('User', userId)
    }

    if (!user.stripeAccountId) {
      throw new ValidationError('User does not have a Stripe Connect account. Create one first.')
    }

    const stripe = getStripe()
    const accountLink = await withRetry(
      () => stripe.accountLinks.create({
        account: user.stripeAccountId,
        refresh_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/contractor/onboarding/refresh`,
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/contractor/onboarding/complete`,
        type: type === 'onboarding' ? 'account_onboarding' : 'account_update',
      }),
      { label: 'Stripe.accountLinks.create' }
    )

    return {
      url: accountLink.url,
      expiresAt: new Date(accountLink.expires_at * 1000).toISOString(),
    }
  }

  /**
   * Handle Connect webhook events
   */
  async handleConnectWebhook(event: any) {
    const stripe = getStripe()

    switch (event.type) {
      case 'account.updated':
        // Update account status in database
        const accountId = event.data.object.id
        const account = event.data.object

        const user = await prismaAny.user.findFirst({
          where: { stripeAccountId: accountId },
        })

        if (user) {
          // Account status updated - could trigger notifications
          await prismaAny.event.create({
            data: {
              entityType: 'User',
              entityId: user.id,
              type: 'STRIPE_CONNECT_ACCOUNT_UPDATED',
              payload: {
                accountId,
                chargesEnabled: account.charges_enabled,
                payoutsEnabled: account.payouts_enabled,
                detailsSubmitted: account.details_submitted,
              },
              userId: user.id,
            },
          })
        }
        break

      case 'account.application.deauthorized':
        // Account disconnected - remove from database
        const deauthAccountId = event.data.object.id
        await prismaAny.user.updateMany({
          where: { stripeAccountId: deauthAccountId },
          data: { stripeAccountId: null },
        })
        break

      default:
        // Log unhandled events
        console.log(`Unhandled Connect webhook event: ${event.type}`)
    }
  }
}

export const stripeConnectService = new StripeConnectService()
