'use client'

import { useEffect, useState, useCallback } from 'react'
import { CreditCard, DollarSign, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { supabase } from '@/lib/supabase'

interface EscrowAccount {
  id: string
  escrowAccountNumber?: string
  projectName: string
  totalContractAmount: number
  currentBalance: number
  availableBalance: number
  heldBalance: number
  status: string
}

interface PaymentRecord {
  id: string
  type: string
  amount: number
  status: string
  description?: string
  createdAt: string
  milestone?: { id: string; name: string; amount: number }
}

export default function PaymentsPage() {
  const [escrowAccounts, setEscrowAccounts] = useState<EscrowAccount[]>([])
  const [recentPayments, setRecentPayments] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'escrow' | 'history'>('escrow')

  const loadPaymentData = useCallback(async () => {
    setLoading(true)
    try {
      // Get the user's projects first
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const projectsRes = await api.getProjects()
      const projects = projectsRes.projects || []

      // Load escrow + payment history for each project
      const accounts: EscrowAccount[] = []
      const payments: PaymentRecord[] = []

      await Promise.all(
        projects.slice(0, 10).map(async (project: any) => {
          try {
            const escrowRes = await api.getEscrowAgreement(project.id)
            if (escrowRes.escrow) {
              accounts.push({
                id: escrowRes.escrow.id,
                projectName: project.name || 'Unnamed Project',
                totalContractAmount: 0,
                currentBalance: escrowRes.escrow.currentBalance || 0,
                availableBalance: escrowRes.escrow.currentBalance || 0,
                heldBalance: 0,
                status: escrowRes.escrow.status || 'ACTIVE',
              })
            }
          } catch {
            // Project may not have escrow
          }

          try {
            const historyRes = await api.getPaymentHistory(project.id)
            if (historyRes.transactions) {
              payments.push(
                ...historyRes.transactions.map((t) => ({
                  ...t,
                  description: t.milestone?.name || t.type.replace(/_/g, ' '),
                }))
              )
            }
          } catch {
            // Project may not have payment history
          }
        })
      )

      setEscrowAccounts(accounts)
      setRecentPayments(payments.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ))
    } catch (err) {
      console.error('Failed to load payment data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPaymentData()
  }, [loadPaymentData])

  const totalEscrowBalance = escrowAccounts.reduce((sum, a) => sum + a.currentBalance, 0)
  const totalAvailable = escrowAccounts.reduce((sum, a) => sum + a.availableBalance, 0)
  const totalHeld = escrowAccounts.reduce((sum, a) => sum + a.heldBalance, 0)

  const statusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pending': case 'processing': return <Clock className="h-4 w-4 text-amber-500" />
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />
      default: return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const statusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE': return 'bg-green-100 text-green-700'
      case 'PENDING_DEPOSIT': return 'bg-amber-100 text-amber-700'
      case 'FROZEN': return 'bg-red-100 text-red-700'
      case 'CLOSED': return 'bg-gray-100 text-gray-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your escrow accounts and view payment history
        </p>
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2.5">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total in Escrow</p>
              <p className="text-xl font-bold text-gray-900">
                ${totalEscrowBalance.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2.5">
              <ArrowUpRight className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Available for Release</p>
              <p className="text-xl font-bold text-gray-900">
                ${totalAvailable.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2.5">
              <CreditCard className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">On Hold</p>
              <p className="text-xl font-bold text-gray-900">
                ${totalHeld.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('escrow')}
            className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
              activeTab === 'escrow'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Escrow Accounts
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Payment History
          </button>
        </div>
      </div>

      {activeTab === 'escrow' ? (
        <div className="space-y-4">
          {escrowAccounts.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
              <DollarSign className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-sm font-medium text-gray-900">No escrow accounts</h3>
              <p className="mt-1 text-sm text-gray-500">
                Escrow accounts are created when contracts are signed.
              </p>
            </div>
          ) : (
            escrowAccounts.map((account) => {
              const progress = account.totalContractAmount > 0
                ? (account.currentBalance / account.totalContractAmount) * 100
                : 0

              return (
                <div key={account.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{account.projectName}</h3>
                      {account.escrowAccountNumber && (
                        <p className="text-xs text-gray-500">{account.escrowAccountNumber}</p>
                      )}
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColor(account.status)}`}>
                      {account.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="mb-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-gray-500">Contract Total</p>
                      <p className="font-semibold text-gray-900">${account.totalContractAmount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Funded</p>
                      <p className="font-semibold text-green-600">${account.currentBalance.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Available</p>
                      <p className="font-semibold text-blue-600">${account.availableBalance.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">On Hold</p>
                      <p className="font-semibold text-amber-600">${account.heldBalance.toLocaleString()}</p>
                    </div>
                  </div>

                  {account.totalContractAmount > 0 && (
                    <>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-green-500 transition-all"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <p className="mt-1 text-right text-xs text-gray-500">{progress.toFixed(0)}% funded</p>
                    </>
                  )}
                </div>
              )
            })
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          {recentPayments.length === 0 ? (
            <div className="py-16 text-center">
              <Clock className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-sm font-medium text-gray-900">No payment history</h3>
              <p className="mt-1 text-sm text-gray-500">Your payment transactions will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    {payment.type === 'DEPOSIT' ? (
                      <div className="rounded-lg bg-green-100 p-2">
                        <ArrowDownLeft className="h-4 w-4 text-green-600" />
                      </div>
                    ) : (
                      <div className="rounded-lg bg-blue-100 p-2">
                        <ArrowUpRight className="h-4 w-4 text-blue-600" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{payment.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(payment.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold ${
                      payment.type === 'DEPOSIT' ? 'text-green-600' : 'text-gray-900'
                    }`}>
                      {payment.type === 'DEPOSIT' ? '+' : '-'}${payment.amount.toLocaleString()}
                    </span>
                    {statusIcon(payment.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
