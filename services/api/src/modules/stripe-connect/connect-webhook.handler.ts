/**
 * Stripe Connect Webhook Handler
 * Handles webhooks for Stripe Connect events
 */

import Stripe from 'stripe'
import { prisma, ConnectedAccountStatus } from '@kealee/database'
import { ConnectOnboardingService } from './connect-onboarding.service'
import { PayoutService } from './payout.service'
import { withRetry } from '../../utils/retry'

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
    let status: ConnectedAccountStatus = connectedAccount.status

    if (hasCompletedOnboarding && payoutsEnabled) {
      status = ConnectedAccountStatus.ACTIVE
    } else if (account.requirements?.disabled_reason) {
      status = ConnectedAccountStatus.DISABLED
    } else if (
      (account.requirements?.currently_due?.length || 0) > 0 ||
      (account.requirements?.past_due?.length || 0) > 0
    ) {
      status = ConnectedAccountStatus.RESTRICTED
    } else if (account.details_submitted) {
      status = ConnectedAccountStatus.PENDING // Waiting for Stripe verification
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

    // Notify platform admins about the disconnected account
    const adminsDeauth = await prisma.orgMember.findMany({
      where: { roleKey: 'admin' },
      select: { userId: true },
    })
    for (const admin of adminsDeauth) {
      await prisma.notification.create({
        data: {
          userId: admin.userId,
          type: 'ACCOUNT_DISCONNECTED',
          title: 'Connected Account Disconnected',
          message: 'A connected account has been deauthorized by the user.',
          channels: ['email', 'push'],
          data: { connectedAccountId: connectedAccount.id, stripeAccountId: account },
        },
      })
    }

    // Notify the contractor
    await prisma.notification.create({
      data: {
        userId: connectedAccount.userId,
        type: 'ACCOUNT_DISCONNECTED',
        title: 'Stripe Account Disconnected',
        message: 'Your Stripe connected account has been disconnected. Please reconnect to continue receiving payouts.',
        channels: ['email', 'push'],
        data: { connectedAccountId: connectedAccount.id, stripeAccountId: account },
      },
    })
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
      include: { connectedAccount: true },
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

        // Create journal entry for accounting
    const entryNumber = `JE-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`
    await prisma.journalEntry.create({
      data: {
        entryNumber,
        description: `Payout ${ourPayout.id} paid to contractor via Stripe`,
        reference: 'PAYOUT_PAID',
        referenceId: ourPayout.id,
        entryDate: new Date(),
        status: 'POSTED',
        postedAt: new Date(),
        createdBy: 'system:stripe-webhook',
      },
    })

    // Send confirmation notification to contractor
    await prisma.notification.create({
      data: {
        userId: ourPayout.connectedAccount.userId,
        type: 'PAYOUT_PAID',
        title: 'Payout Received',
        message: `Your payout of ${ourPayout.amount} ${ourPayout.currency} has been deposited.`,
        channels: ['email', 'push'],
        data: { payoutId: ourPayout.id, amount: ourPayout.amount.toString(), currency: ourPayout.currency },
      },
    })

    // Update milestone status if linked
    if (ourPayout.milestoneId) {
      await prisma.milestone.update({
        where: { id: ourPayout.milestoneId },
        data: { status: 'PAID' },
      })
    }
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
      include: { connectedAccount: true },
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

        // Notify contractor about the failed payout
    await prisma.notification.create({
      data: {
        userId: ourPayout.connectedAccount.userId,
        type: 'PAYOUT_FAILED',
        title: 'Payout Failed',
        message: `Your payout of ${ourPayout.amount} ${ourPayout.currency} has failed: ${payout.failure_message || 'Unknown error'}. We will retry automatically.`,
        channels: ['email', 'push'],
        data: { payoutId: ourPayout.id, amount: ourPayout.amount.toString(), failureCode: payout.failure_code || 'unknown' },
      },
    })

    // Notify platform admins
    const failAdmins = await prisma.orgMember.findMany({
      where: { roleKey: 'admin' },
      select: { userId: true },
    })
    for (const admin of failAdmins) {
      await prisma.notification.create({
        data: {
          userId: admin.userId,
          type: 'PAYOUT_FAILED',
          title: 'Contractor Payout Failed',
          message: `Payout ${ourPayout.id} failed: ${payout.failure_message || 'Unknown error'}`,
          channels: ['email', 'push'],
          data: { payoutId: ourPayout.id, connectedAccountId: ourPayout.connectedAccountId, failureCode: payout.failure_code || 'unknown' },
        },
      })
    }

    // Schedule automatic retry after 6 hours
    await prisma.jobQueue.create({
      data: {
        queueName: 'payout-retry',
        jobId: `retry-payout-${ourPayout.id}-${Date.now()}`,
        jobName: 'retry-failed-payout',
        status: 'WAITING',
        priority: 1,
        data: { payoutId: ourPayout.id, connectedAccountId: ourPayout.connectedAccountId, amount: ourPayout.amount.toString(), currency: ourPayout.currency, attempt: 1 },
        delay: 6 * 60 * 60 * 1000,
        maxAttempts: 3,
      },
    })
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
    const account = await withRetry(
      () => stripe.accounts.retrieve(accountId),
      { label: 'Stripe.accounts.retrieve' }
    )

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
    const account = await withRetry(
      () => stripe.accounts.retrieve(accountId),
      { label: 'Stripe.accounts.retrieve' }
    )

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

