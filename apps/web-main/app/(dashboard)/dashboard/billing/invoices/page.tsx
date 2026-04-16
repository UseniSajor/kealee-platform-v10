/**
 * Invoice History Page
 * Shows past invoices and payment history
 */

import React from 'react'
import Link from 'next/link'
import { getServerUser } from '@kealee/core-auth'
import { redirect } from 'next/navigation'

interface Invoice {
  id: string
  amountDue: number
  currency: string
  dueDate: string
  hostedInvoiceUrl?: string
  invoicePdf?: string
  status: string
  paidAt?: string
}

interface SubscriptionDetails {
  subscription: {
    id: string
    orgId: string
    orgName: string
  }
  stripe: {
    subscriptionId: string
  }
  upcomingInvoice?: Invoice
  [key: string]: any
}

export default async function InvoicesPage() {
  const user = await getServerUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user's organization
  const orgId = user.user_metadata?.orgId || null
  if (!orgId) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Invoice History</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">
            Your account is not associated with an organization.
          </p>
        </div>
      </div>
    )
  }

  // Fetch subscription details (which includes invoices)
  let subscriptionData: SubscriptionDetails | null = null
  let invoices: Invoice[] = []
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
      // The API would need to return invoices - for now we'll fetch them separately
      // TODO: Extend API to return invoice list
    } else if (response.status === 404) {
      // No subscription - no invoices
      subscriptionData = null
    } else {
      error = 'Failed to load invoices'
    }
  } catch (err: any) {
    console.error('Failed to fetch invoices:', err)
    error = 'Unable to connect to billing service'
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
      case 'open':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
      case 'uncollectible':
        return 'bg-red-100 text-red-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Paid'
      case 'open':
        return 'Pending'
      case 'pending':
        return 'Pending'
      case 'failed':
        return 'Failed'
      case 'uncollectible':
        return 'Uncollectible'
      case 'draft':
        return 'Draft'
      default:
        return status
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoice History</h1>
          <p className="text-gray-600 mt-1">View and download your invoices</p>
        </div>
        <Link
          href="/dashboard/billing"
          className="text-blue-600 hover:text-blue-700 font-semibold"
        >
          ← Back to Billing
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
          <p>{error}</p>
        </div>
      )}

      {/* No Subscription State */}
      {!subscriptionData && !error && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">No Invoices</h2>
          <p className="text-gray-700 mb-6">
            You don't have any invoices yet. Once you subscribe to a plan, your invoices will appear here.
          </p>
          <Link
            href="/checkout"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            View Plans
          </Link>
        </div>
      )}

      {/* Invoices Table */}
      {subscriptionData && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Invoice
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {/* Upcoming Invoice */}
                {subscriptionData.upcomingInvoice && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      Upcoming Invoice
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(subscriptionData.upcomingInvoice.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      ${subscriptionData.upcomingInvoice.amountDue.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                        Upcoming
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="text-gray-500">–</span>
                    </td>
                  </tr>
                )}

                {/* Empty State */}
                {!subscriptionData.upcomingInvoice && invoices.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      <p>No invoices yet. Your first invoice will appear after your trial ends.</p>
                    </td>
                  </tr>
                )}

                {/* Historical Invoices */}
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {invoice.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      ${invoice.amountDue.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(invoice.status)}`}>
                        {getStatusLabel(invoice.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      {invoice.hostedInvoiceUrl && (
                        <a
                          href={invoice.hostedInvoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 font-semibold"
                        >
                          View
                        </a>
                      )}
                      {invoice.invoicePdf && (
                        <>
                          {invoice.hostedInvoiceUrl && <span className="text-gray-300">|</span>}
                          <a
                            href={invoice.invoicePdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 font-semibold"
                          >
                            PDF
                          </a>
                        </>
                      )}
                      {!invoice.hostedInvoiceUrl && !invoice.invoicePdf && (
                        <span className="text-gray-500">–</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Need help with invoices?</h3>
        <p className="text-gray-700 mb-4">
          Invoices are generated automatically on your billing date. You can download them as PDF for your records.
        </p>
        <Link
          href="/contact"
          className="text-blue-600 hover:text-blue-700 font-semibold"
        >
          Contact our support team →
        </Link>
      </div>
    </div>
  )
}
