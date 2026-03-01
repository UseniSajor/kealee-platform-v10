'use client'

import { useState, useEffect } from 'react'
import { useProfile } from '@kealee/auth/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Package,
  Clock,
  CheckCircle,
  Sparkles,
  Download,
  Loader2,
  CreditCard,
  Calendar,
  FileText,
  Phone,
} from 'lucide-react'

interface OrderDetail {
  id: string
  packageName: string
  packageTier: string
  amount: number
  currency: string
  status: string
  deliveryStatus: string
  deliveryUrl: string | null
  deliveredAt: string | null
  stripeSessionId: string
  createdAt: string
  updatedAt: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

const statusSteps = [
  { key: 'completed', label: 'Payment Confirmed', icon: CreditCard },
  { key: 'generating', label: 'Concept Generating', icon: Sparkles },
  { key: 'ready', label: 'Ready for Download', icon: FileText },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle },
]

function getStepIndex(deliveryStatus: string): number {
  if (deliveryStatus === 'pending') return 0
  if (deliveryStatus === 'generating') return 1
  if (deliveryStatus === 'ready') return 2
  if (deliveryStatus === 'delivered') return 3
  return 0
}

export default function OrderDetailPage() {
  const { profile, loading: authLoading } = useProfile()
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!authLoading && !profile) {
      router.push(`/auth/login?redirect=/dashboard/orders/${orderId}`)
      return
    }
    if (profile && orderId) fetchOrder()
  }, [profile, authLoading, orderId, router])

  const fetchOrder = async () => {
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${profile?.access_token || ''}` },
      })
      if (res.ok) {
        const data = await res.json()
        setOrder(data.order)
      } else if (res.status === 404) {
        setNotFound(true)
      }
    } catch {
      // fail silently
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-sky-600" size={32} />
      </div>
    )
  }

  if (notFound || !order) {
    return (
      <div className="text-center py-24">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Package className="text-gray-400" size={28} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Order not found</h2>
        <p className="text-gray-500 mb-6">This order doesn&apos;t exist or you don&apos;t have access.</p>
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center gap-2 text-sky-600 font-semibold hover:text-sky-700"
        >
          <ArrowLeft size={16} /> Back to orders
        </Link>
      </div>
    )
  }

  const currentStep = getStepIndex(order.deliveryStatus)

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/dashboard/orders"
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-700 transition"
      >
        <ArrowLeft size={16} /> Back to orders
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-gray-900">{order.packageName}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Order #{order.id.slice(-8).toUpperCase()} &middot;{' '}
              {new Date(order.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-gray-900">
              ${(order.amount / 100).toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              {order.status === 'completed' ? 'Paid' : order.status}
            </p>
          </div>
        </div>
      </div>

      {/* Progress tracker */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Delivery Progress</h2>
        <div className="relative">
          {/* Progress line */}
          <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200" />
          <div
            className="absolute top-5 left-5 h-0.5 bg-sky-500 transition-all duration-500"
            style={{ width: `${(currentStep / (statusSteps.length - 1)) * (100 - 10)}%` }}
          />

          <div className="relative flex justify-between">
            {statusSteps.map((step, i) => {
              const StepIcon = step.icon
              const isComplete = i <= currentStep
              const isCurrent = i === currentStep
              return (
                <div key={step.key} className="flex flex-col items-center w-24">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all ${
                      isComplete
                        ? isCurrent
                          ? 'bg-sky-600 text-white ring-4 ring-sky-100'
                          : 'bg-sky-600 text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    <StepIcon size={18} />
                  </div>
                  <span
                    className={`text-xs font-medium mt-2 text-center ${
                      isComplete ? 'text-sky-700' : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Status message */}
        <div className="mt-8 p-4 rounded-xl bg-sky-50 border border-sky-200">
          {order.deliveryStatus === 'pending' && (
            <p className="text-sm text-sky-800">
              Your concept package has been confirmed and our AI system will begin generating your design concept shortly.
              This typically takes a few hours.
            </p>
          )}
          {order.deliveryStatus === 'generating' && (
            <p className="text-sm text-sky-800">
              Our AI is generating your design concept now. You&apos;ll receive an email notification when it&apos;s ready.
            </p>
          )}
          {(order.deliveryStatus === 'ready' || order.deliveryStatus === 'delivered') && (
            <p className="text-sm text-sky-800">
              Your concept package is ready! Download it using the button below.
            </p>
          )}
        </div>

        {/* Download button */}
        {order.deliveryUrl && (order.deliveryStatus === 'ready' || order.deliveryStatus === 'delivered') && (
          <div className="mt-6">
            <a
              href={order.deliveryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-sm transition"
            >
              <Download size={18} />
              Download Concept Package
            </a>
          </div>
        )}
      </div>

      {/* Order details */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Order Details</h2>
        <dl className="grid sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-gray-500 flex items-center gap-2">
              <Package size={14} /> Package
            </dt>
            <dd className="mt-1 text-sm font-semibold text-gray-900">{order.packageName}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500 flex items-center gap-2">
              <CreditCard size={14} /> Payment
            </dt>
            <dd className="mt-1 text-sm font-semibold text-gray-900">
              ${(order.amount / 100).toLocaleString()} {order.currency.toUpperCase()}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500 flex items-center gap-2">
              <Calendar size={14} /> Ordered
            </dt>
            <dd className="mt-1 text-sm font-semibold text-gray-900">
              {new Date(order.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </dd>
          </div>
          {order.deliveredAt && (
            <div>
              <dt className="text-sm text-gray-500 flex items-center gap-2">
                <CheckCircle size={14} /> Delivered
              </dt>
              <dd className="mt-1 text-sm font-semibold text-gray-900">
                {new Date(order.deliveredAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Support */}
      <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 text-center">
        <p className="text-sm text-gray-500">
          Questions about your order? Call us at{' '}
          <a href="tel:+13015758777" className="text-sky-600 font-semibold hover:underline">
            (301) 575-8777
          </a>{' '}
          or email{' '}
          <a href="mailto:support@kealee.com" className="text-sky-600 font-semibold hover:underline">
            support@kealee.com
          </a>
        </p>
      </div>
    </div>
  )
}
