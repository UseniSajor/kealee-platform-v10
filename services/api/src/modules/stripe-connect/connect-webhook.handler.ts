/**
 * Stripe Connect Webhook Handler
 * Handles webhooks for Stripe Connect events
 */

import Stripe from 'stripe'
import { prisma } from '@kealee/database'
import { ConnectOnboardingService } from './connect-onboarding.service'
import { PayoutService } from './payout.service'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export class ConnectWebhookHandler {
  /**
   * Handle account.updated event
   * Triggered when connected account details are updated
   */
  static async handleAccountUpdated(event: Stripe.Event) {
    const account = event.data.object as Stripe.Account

    // Find connected account by Stripe account ID
    const connectedAccount = await prisma.connectedAccount.findUnique({
      where: { stripeAccountId: account.id },
    })

    if (!connectedAccount) {
      console.warn(`Connected account not found for ${account.id}`)
      return
    }

    // Check capabilities
    const payoutsEnabled = account.capabilities?.transfers === 'active'
    const chargesEnabled = account.capabilities?.card_payments === 'active'

    // Check onboarding completion
    const hasCompletedOnboarding =
      account.details_submitted === true &&
      account.charges_enabled === true &&
      account.payouts_enabled === true

    // Determine status
    let status = connectedAccount.status

    if (hasCompletedOnboarding && payoutsEnabled) {
      status = 'ACTIVE'
    } else if (account.requirements?.disabled_reason) {
      status = 'DISABLED'
    } else if (
      (account.requirements?.currently_due?.length || 0) > 0 ||
      (account.requirements?.past_due?.length || 0) > 0
    ) {
      status = 'RESTRICTED'
    } else if (account.details_submitted) {
      status = 'PENDING' // Waiting for Stripe verification
    }

    // Update database
    await prisma.connectedAccount.update({
      where: { id: connectedAccount.id },
      data: {
        status,
        hasCompletedOnboarding,
        payoutsEnabled,
        chargesEnabled,
        requirements: account.requirements
          ? JSON.parse(JSON.stringify(account.requirements))
          : null,
      },
    })

    console.log(
      `Updated connected account ${connectedAccount.id} - Status: ${status}`
    )
  }

  /**
   * Handle account.application.deauthorized event
   * Triggered when user revokes access to their connected account
   */
  static async handleAccountDeauthorized(event: Stripe.Event) {
    const deauthorization = event.data.object as any

    const account = deauthorization.account as string

    // Find connected account
    const connectedAccount = await prisma.connectedAccount.findUnique({
      where: { stripeAccountId: account },
    })

    if (!connectedAccount) {
      console.warn(`Connected account not found for ${account}`)
      return
    }

    // Disable account
    await prisma.connectedAccount.update({
      where: { id: connectedAccount.id },
      data: {
        status: 'DISABLED',
        metadata: {
          ...(connectedAccount.metadata as any),
          deauthorizedAt: new Date().toISOString(),
          deauthorizedReason: 'User revoked access',
        },
      },
    })

    console.log(`Deauthorized connected account ${connectedAccount.id}`)

    // TODO: Send notification to platform admins
    // TODO: Notify contractor that their account was disconnected
  }

  /**
   * Handle payout.paid event
   * Triggered when a payout is successfully paid to contractor's bank account
   */
  static async handlePayoutPaid(event: Stripe.Event) {
    const payout = event.data.object as Stripe.Payout

    // Find our payout record
    const ourPayout = await prisma.payout.findFirst({
      where: { stripePayoutId: payout.id },
    })

    if (!ourPayout) {
      console.warn(`Payout not found for Stripe payout ${payout.id}`)
      return
    }

    // Update payout status
    await prisma.payout.update({
      where: { id: ourPayout.id },
      data: {
        status: 'PAID',
        arrivalDate: payout.arrival_date
          ? new Date(payout.arrival_date * 1000)
          : null,
      },
    })

    console.log(`Payout ${ourPayout.id} marked as PAID`)

    // TODO: Create journal entry for accounting
    // TODO: Send confirmation email to contractor
    // TODO: Update milestone status if linked
  }

  /**
   * Handle payout.failed event
   * Triggered when a payout fails
   */
  static async handlePayoutFailed(event: Stripe.Event) {
    const payout = event.data.object as Stripe.Payout

    // Find our payout record
    const ourPayout = await prisma.payout.findFirst({
      where: { stripePayoutId: payout.id },
    })

    if (!ourPayout) {
      console.warn(`Payout not found for Stripe payout ${payout.id}`)
      return
    }

    // Update payout status
    await prisma.payout.update({
      where: { id: ourPayout.id },
      data: {
        status: 'FAILED',
        failedAt: new Date(),
        failureCode: payout.failure_code || 'unknown',
        failureMessage: payout.failure_message || 'Payout failed',
      },
    })

    console.error(
      `Payout ${ourPayout.id} FAILED: ${payout.failure_message}`
    )

    // TODO: Send notification to contractor about failed payout
    // TODO: Notify platform admins
    // TODO: Automatically retry payout after X hours
  }

  /**
   * Handle capability.updated event
   * Triggered when capabilities (payouts, charges) are updated
   */
  static async handleCapabilityUpdated(event: Stripe.Event) {
    const capability = event.data.object as Stripe.Capability

    // Extract account ID from capability
    const accountId = capability.account as string

    // Find connected account
    const connectedAccount = await prisma.connectedAccount.findUnique({
      where: { stripeAccountId: accountId },
    })

    if (!connectedAccount) {
      console.warn(`Connected account not found for ${accountId}`)
      return
    }

    // Fetch full account to get all capabilities
    const account = await stripe.accounts.retrieve(accountId)

    // Update capabilities
    await prisma.connectedAccount.update({
      where: { id: connectedAccount.id },
      data: {
        payoutsEnabled: account.capabilities?.transfers === 'active',
        chargesEnabled: account.capabilities?.card_payments === 'active',
      },
    })

    console.log(
      `Updated capabilities for connected account ${connectedAccount.id}`
    )
  }

  /**
   * Handle person.updated event
   * Triggered when beneficial owner information is updated
   */
  static async handlePersonUpdated(event: Stripe.Event) {
    const person = event.data.object as Stripe.Person

    const accountId = person.account as string

    // Find connected account
    const connectedAccount = await prisma.connectedAccount.findUnique({
      where: { stripeAccountId: accountId },
    })

    if (!connectedAccount) {
      console.warn(`Connected account not found for ${accountId}`)
      return
    }

    // Fetch full account to check requirements
    const account = await stripe.accounts.retrieve(accountId)

    // Update requirements
    await prisma.connectedAccount.update({
      where: { id: connectedAccount.id },
      data: {
        requirements: account.requirements
          ? JSON.parse(JSON.stringify(account.requirements))
          : null,
      },
    })

    console.log(
      `Updated person information for connected account ${connectedAccount.id}`
    )
  }

  /**
   * Main webhook processor
   * Routes webhook events to appropriate handlers
   */
  static async processWebhook(event: Stripe.Event) {
    console.log(`Processing Stripe Connect webhook: ${event.type}`)

    try {
      switch (event.type) {
        case 'account.updated':
          await this.handleAccountUpdated(event)
          break

        case 'account.application.deauthorized':
          await this.handleAccountDeauthorized(event)
          break

        case 'payout.paid':
          await this.handlePayoutPaid(event)
          break

        case 'payout.failed':
          await this.handlePayoutFailed(event)
          break

        case 'capability.updated':
          await this.handleCapabilityUpdated(event)
          break

        case 'person.updated':
          await this.handlePersonUpdated(event)
          break

        default:
          console.log(`Unhandled event type: ${event.type}`)
      }

      return { success: true }
    } catch (error: any) {
      console.error(`Error processing webhook ${event.type}:`, error)
      throw error
    }
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(
    payload: string | Buffer,
    signature: string,
    secret: string
  ): Stripe.Event {
    try {
      return stripe.webhooks.constructEvent(payload, signature, secret)
    } catch (error: any) {
      console.error('Webhook signature verification failed:', error.message)
      throw new Error('Invalid webhook signature')
    }
  }
}

