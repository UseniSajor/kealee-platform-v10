/**
 * Billing Management Dashboard
 * Shows subscription status, payment methods, and billing actions
 */

import React from 'react'
import Link from 'next/link'
import { getServerUser } from '@kealee/core-auth'
import { redirect } from 'next/navigation'
import BillingPortalButton from '@/components/BillingPortalButton'
import CancelSubscriptionButton from '@/components/CancelSubscriptionButton'

interface SubscriptionDetails {
  subscription: {
    id: string
    orgId: string
    orgName: string
    status: string
    plan: {
      id: string
      name: string
      slug: string
    }
    currentPeriodStart: string
    currentPeriodEnd: string
    cancelAtPeriodEnd: boolean
    canceledAt?: string
    metadata?: any
  }
  stripe: {
    subscriptionId: string
    status: string
    currentPeriodStart: string
    currentPeriodEnd: string
    cancelAtPeriodEnd: boolean
    canceledAt?: string
    items: Array<{
      id: string
      priceId: string
      amount: number
      currency: string
      interval: string
    }>
  }
  customer?: {
    id: string
    email: string
    name: string
    phone?: string
  }
  paymentMethod?: {
    id: string
    type: string
    card?: {
      brand: string
      last4: string
      expMonth: number
      expYear: number
    }
  }
  upcomingInvoice?: {
    id: string
    amountDue: number
    currency: string
    dueDate: string
  }
}

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'trial':
      return 'bg-blue-100 text-blue-800'
    case 'past_due':
      return 'bg-yellow-100 text-yellow-800'
    case 'canceled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'active':
      return 'Active'
    case 'trial':
      return 'Trial'
    case 'past_due':
      return 'Past Due'
    case 'canceled':
      return 'Canceled'
    default:
      return status
  }
}

export default async function BillingPage() {
  const user = await getServerUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user's organization (assuming single org for now)
  const orgId = user.user_metadata?.orgId || null
  if (!orgId) {
    // TODO: Implement org selection UI when users have multiple orgs
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-yellow-900 mb-2">No Organization</h2>
          <p className="text-yellow-800">
            Your account is not associated with an organization. Please contact support.
          </p>
        </div>
      </div>
    )
  }

  // Fetch subscription details from API
  let subscriptionData: SubscriptionDetails | null = null
  let error: string | null = null

  try {
    const apiUrl = process.env.API_URL || 'http://localhost:3001'
    const response = await fetch(`${apiUrl}/billing/subscriptions/${orgId}/details`, {
      headers: {
        'Authorization': `Bearer ${user.id}`,
      },
      cache: 'no-store',
    })

    if (response.ok) {
      subscriptionData = await response.json()
    } else if (response.status === 404) {
      // No subscription found - this is OK
      subscriptionData = null
    } else {
      error = 'Failed to load subscription details'
    }
  } catch (err: any) {
    console.error('Failed to fetch subscription:', err)
    error = 'Unable to connect to billing service'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
        <Link
          href="/dashboard/billing/invoices"
          className="text-blue-600 hover:text-blue-700 font-semibold"
        >
          View Invoices →
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
          <p>{error}</p>
          <p className="text-sm mt-2">Please try again later or contact support.</p>
        </div>
      )}

      {/* No Subscription State */}
      {!subscriptionData && !error && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">No Active Subscription</h2>
          <p className="text-gray-700 mb-6">
            You don't have an active subscription yet. Choose a plan to get started with all the features you need.
          </p>
          <Link
            href="/checkout"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            View Plans
          </Link>
        </div>
      )}

      {/* Subscription Details */}
      {subscriptionData && (
        <>
          {/* Current Plan Card */}
          <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-blue-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Plan Info */}
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">
                      {subscriptionData.subscription.plan?.name || 'Unknown Plan'}
                    </h2>
                    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadgeColor(subscriptionData.stripe.status)}`}>
                      {getStatusLabel(subscriptionData.stripe.status)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 text-gray-700">
                  <div>
                    <p className="text-sm text-gray-600">Monthly Amount</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${(subscriptionData.stripe.items[0]?.amount || 0).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      {subscriptionData.stripe.items[0]?.interval === 'year' ? '/year' : '/month'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Billing Cycle</p>
                    <p className="text-gray-900">
                      {new Date(subscriptionData.stripe.currentPeriodStart).toLocaleDateString()} –{' '}
                      {new Date(subscriptionData.stripe.currentPeriodEnd).toLocaleDateString()}
                    </p>
                  </div>

                  {subscriptionData.upcomingInvoice && (
                    <div>
                      <p className="text-sm text-gray-600">Next Invoice</p>
                      <p className="text-gray-900">
                        ${subscriptionData.upcomingInvoice.amountDue.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        due {new Date(subscriptionData.upcomingInvoice.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {subscriptionData.stripe.cancelAtPeriodEnd && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm font-semibold text-yellow-900">
                        This subscription will be canceled at the end of the current billing period.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>

                {subscriptionData.paymentMethod?.card ? (
                  <div className="bg-gradient-to-r from-gray-900 to-gray-700 rounded-lg p-6 text-white mb-6">
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <p className="text-sm text-gray-300 uppercase tracking-wider">Card</p>
                        <p className="text-xl font-semibold mt-1">
                          {subscriptionData.paymentMethod.card.brand.toUpperCase()}
                        </p>
                      </div>
                      <p className="text-2xl font-bold">♣</p>
                    </div>

                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-sm text-gray-300">Card Number</p>
                        <p className="font-mono text-lg tracking-wider">
                          •••• •••• •••• {subscriptionData.paymentMethod.card.last4}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-300">Expires</p>
                        <p className="font-mono">
                          {subscriptionData.paymentMethod.card.expMonth.toString().padStart(2, '0')}/
                          {subscriptionData.paymentMethod.card.expYear}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                    <p className="text-gray-700">No payment method on file</p>
                  </div>
                )}

                <BillingPortalButton
                  customerId={subscriptionData.customer?.id || ''}
                  returnUrl={`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/billing`}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/checkout"
              className="block bg-white border border-gray-200 rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition"
            >
              <p className="font-semibold text-gray-900 mb-1">Change Plan</p>
              <p className="text-sm text-gray-600">Upgrade or downgrade your subscription</p>
            </Link>

            <CancelSubscriptionButton orgId={orgId} />

            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <p className="font-semibold text-gray-900 mb-3">Need Help?</p>
              <Link
                href="/contact"
                className="text-blue-600 hover:text-blue-700 text-sm font-semibold"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
