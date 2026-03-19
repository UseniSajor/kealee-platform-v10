'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, CheckCircle, Clock, Loader } from 'lucide-react'

interface ServiceRequest {
  id: string
  serviceType: string
  status: 'PENDING' | 'PAID' | 'IN_PROGRESS' | 'DELIVERED'
  propertyAddress: string | null
  deliverableUrl: string | null
  requestedAt: string
  deliveredAt: string | null
}

const STATUS_STEPS = ['PENDING', 'PAID', 'IN_PROGRESS', 'DELIVERED']

export default function ServiceRequestPage() {
  const { id } = useParams()
  const [request, setRequest] = useState<ServiceRequest | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    fetch(`/api/v1/developer/services/${id}`, { credentials: 'include' })
      .then(r => r.json())
      .then(setRequest)
      .catch(() => setRequest(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <div className="flex items-center justify-center py-20">
      <Loader className="h-6 w-6 animate-spin text-teal-500" />
    </div>
  }

  if (!request) return (
    <div className="p-6">
      <p className="text-gray-500">Request not found.</p>
      <Link href="/services" className="mt-2 text-sm text-teal-600">Back to services</Link>
    </div>
  )

  const currentStep = STATUS_STEPS.indexOf(request.status)

  return (
    <div className="p-6 max-w-2xl">
      <Link href="/services" className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" /> Back to services
      </Link>

      <h1 className="mb-1 text-xl font-bold" style={{ color: '#1A2B4A' }}>
        {request.serviceType.replace(/_/g, ' ')}
      </h1>
      <p className="mb-8 text-sm text-gray-500">
        Requested {new Date(request.requestedAt).toLocaleDateString()}
        {request.propertyAddress && ` · ${request.propertyAddress}`}
      </p>

      {/* Status timeline */}
      <div className="mb-8 space-y-3">
        {STATUS_STEPS.map((step, i) => {
          const done    = i < currentStep
          const current = i === currentStep
          return (
            <div key={step} className="flex items-center gap-4">
              <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full`}
                style={{
                  backgroundColor: done ? '#38A169' : current ? '#2ABFBF' : '#E5E7EB',
                }}>
                {done ? (
                  <CheckCircle className="h-4 w-4 text-white" />
                ) : current ? (
                  <Clock className="h-4 w-4 text-white" />
                ) : (
                  <span className="text-xs text-gray-400">{i + 1}</span>
                )}
              </div>
              <span className="text-sm" style={{
                color: done || current ? '#1A2B4A' : '#9CA3AF',
                fontWeight: current ? 600 : 400,
              }}>
                {step.replace(/_/g, ' ')}
              </span>
            </div>
          )
        })}
      </div>

      {/* Deliverable download */}
      {request.status === 'DELIVERED' && request.deliverableUrl && (
        <a
          href={request.deliverableUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl px-6 py-4 text-sm font-bold text-white"
          style={{ backgroundColor: '#38A169' }}
        >
          <Download className="h-5 w-5" />
          Download Deliverable
        </a>
      )}
    </div>
  )
}
