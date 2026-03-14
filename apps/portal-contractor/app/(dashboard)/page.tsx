'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Megaphone, ShieldCheck, FolderKanban, ArrowRight,
  AlertTriangle, CheckCircle, Clock, User,
} from 'lucide-react'
import { getContractorProfile, getContractorLeads, getVerificationDocuments } from '@/lib/api/contractor'
import type { ContractorProfile, LeadCounts, VerificationDocument } from '@/lib/api/contractor'

// ── Loading skeleton ──────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className ?? ''}`} />
}

// ── Status helpers ────────────────────────────────────────────────────────────

const docStatusColor: Record<string, { bg: string; text: string }> = {
  UPLOADED:     { bg: 'rgba(49,130,206,0.1)',   text: '#3182CE' },
  UNDER_REVIEW: { bg: 'rgba(234,179,8,0.12)',   text: '#92400E' },
  APPROVED:     { bg: 'rgba(56,161,105,0.1)',   text: '#38A169' },
  REJECTED:     { bg: 'rgba(229,62,62,0.1)',    text: '#E53E3E' },
  EXPIRED:      { bg: 'rgba(229,62,62,0.08)',   text: '#C53030' },
  ARCHIVED:     { bg: 'rgba(107,114,128,0.1)',  text: '#6B7280' },
}

const verificationColors: Record<string, { bg: string; text: string }> = {
  VERIFIED:   { bg: 'rgba(56,161,105,0.1)', text: '#38A169' },
  PENDING:    { bg: 'rgba(234,179,8,0.12)', text: '#92400E' },
  REJECTED:   { bg: 'rgba(229,62,62,0.1)', text: '#E53E3E' },
  UNVERIFIED: { bg: 'rgba(107,114,128,0.1)', text: '#6B7280' },
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<ContractorProfile | null>(null)
  const [counts, setCounts] = useState<LeadCounts | null>(null)
  const [docs, setDocs] = useState<VerificationDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const [profileData, leadsData, docsData] = await Promise.all([
          getContractorProfile(),
          getContractorLeads('active', 1),
          getVerificationDocuments(),
        ])
        if (!mounted) return
        setProfile(profileData)
        setCounts(leadsData.counts)
        setDocs(docsData.documents)
      } catch (err: any) {
        if (!mounted) return
        setError(err.message ?? 'Failed to load dashboard')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  // ── Derived doc summary ─────────────────────────────────────────────────────

  const expiredOrRejected = docs.filter(
    d => d.effectiveStatus === 'EXPIRED' || d.effectiveStatus === 'REJECTED',
  )
  const pendingReview = docs.filter(d => d.effectiveStatus === 'UNDER_REVIEW')
  const approved = docs.filter(d => d.effectiveStatus === 'APPROVED')

  // ── Render ──────────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-amber-500" />
        <p className="text-sm font-medium text-gray-700">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: '#E8793A' }}
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Welcome header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold" style={{ color: '#1A2B4A' }}>
          {loading ? (
            <Skeleton className="h-7 w-64" />
          ) : (
            <>Welcome back, {profile?.businessName ?? 'Contractor'}</>
          )}
        </h1>
        <p className="mt-1 text-sm text-gray-500">Here&apos;s a summary of your activity</p>
      </div>

      {/* Quick stats row */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Pending leads */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Pending Leads</p>
          {loading ? (
            <Skeleton className="mt-1 h-8 w-12" />
          ) : (
            <p className="mt-1 text-2xl font-bold font-display" style={{ color: '#E8793A' }}>
              {counts?.pending ?? 0}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-400">{counts?.accepted ?? 0} accepted</p>
        </div>

        {/* Active docs */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Approved Docs</p>
          {loading ? (
            <Skeleton className="mt-1 h-8 w-12" />
          ) : (
            <p className="mt-1 text-2xl font-bold font-display" style={{ color: '#38A169' }}>
              {approved.length}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-400">{pendingReview.length} under review</p>
        </div>

        {/* Issues */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Action Needed</p>
          {loading ? (
            <Skeleton className="mt-1 h-8 w-12" />
          ) : (
            <p
              className="mt-1 text-2xl font-bold font-display"
              style={{ color: expiredOrRejected.length > 0 ? '#E53E3E' : '#38A169' }}
            >
              {expiredOrRejected.length}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-400">expired/rejected docs</p>
        </div>

        {/* Verification status */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Verification</p>
          {loading ? (
            <Skeleton className="mt-1 h-8 w-28" />
          ) : (
            <div className="mt-2">
              {profile?.verificationStatus ? (
                <span
                  className="rounded-full px-2.5 py-1 text-xs font-semibold"
                  style={{
                    backgroundColor: (verificationColors[profile.verificationStatus] ?? verificationColors['UNVERIFIED']).bg,
                    color: (verificationColors[profile.verificationStatus] ?? verificationColors['UNVERIFIED']).text,
                  }}
                >
                  {profile.verificationStatus}
                </span>
              ) : (
                <span className="text-xs text-gray-400">—</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Alert banner */}
      {!loading && expiredOrRejected.length > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">
              {expiredOrRejected.length} credential{expiredOrRejected.length > 1 ? 's' : ''} need attention
            </p>
            <p className="text-xs text-amber-700">
              Upload updated documents to maintain active bidding status
            </p>
          </div>
          <Link href="/credentials" className="text-xs font-semibold text-amber-700 hover:underline">
            Fix now →
          </Link>
        </div>
      )}

      {/* Reverification alert */}
      {!loading && profile?.requiresReverification && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Profile re-verification required</p>
            <p className="text-xs text-red-700">Your credentials have changed and require admin review</p>
          </div>
          <Link href="/profile" className="text-xs font-semibold text-red-700 hover:underline">
            View profile →
          </Link>
        </div>
      )}

      {/* Main panels */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pending Leads panel */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4" style={{ color: '#E8793A' }} />
              <span className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>Pending Leads</span>
            </div>
            <Link href="/leads" className="flex items-center gap-1 text-xs font-medium" style={{ color: '#2ABFBF' }}>
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-5">
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map(i => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : (counts?.pending ?? 0) === 0 ? (
              <div className="py-6 text-center">
                <Megaphone className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                <p className="text-sm text-gray-500">No pending leads</p>
                <p className="text-xs text-gray-400">New leads will appear here</p>
              </div>
            ) : (
              <div>
                <p className="text-3xl font-bold font-display" style={{ color: '#E8793A' }}>
                  {counts!.pending}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  lead{counts!.pending !== 1 ? 's' : ''} awaiting your response
                </p>
                <Link
                  href="/leads"
                  className="mt-4 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-white"
                  style={{ backgroundColor: '#E8793A' }}
                >
                  Review leads <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Credentials panel */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" style={{ color: '#2ABFBF' }} />
              <span className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>Credentials</span>
            </div>
            <Link href="/credentials" className="flex items-center gap-1 text-xs font-medium" style={{ color: '#2ABFBF' }}>
              Manage <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-5">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : docs.length === 0 ? (
              <div className="py-6 text-center">
                <ShieldCheck className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                <p className="text-sm text-gray-500">No documents uploaded</p>
                <Link href="/credentials" className="mt-2 block text-xs font-medium" style={{ color: '#E8793A' }}>
                  Upload credentials →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {docs.slice(0, 4).map(doc => {
                  const c = docStatusColor[doc.effectiveStatus] ?? docStatusColor['UPLOADED']
                  return (
                    <div key={doc.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                      <div>
                        <p className="text-xs font-medium" style={{ color: '#1A2B4A' }}>
                          {doc.documentType.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-gray-400 capitalize">
                          {doc.issuerName ?? doc.fileName}
                        </p>
                      </div>
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{ backgroundColor: c.bg, color: c.text }}
                      >
                        {doc.effectiveStatus}
                      </span>
                    </div>
                  )
                })}
                {docs.length > 4 && (
                  <p className="text-xs text-gray-400 text-center">+{docs.length - 4} more</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Profile panel */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" style={{ color: '#1A2B4A' }} />
              <span className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>Profile</span>
            </div>
            <Link href="/profile" className="flex items-center gap-1 text-xs font-medium" style={{ color: '#2ABFBF' }}>
              Edit <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-5">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-40" />
              </div>
            ) : profile ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>
                    {profile.businessName}
                  </p>
                  {profile.businessType && (
                    <p className="text-xs text-gray-500">{profile.businessType}</p>
                  )}
                </div>

                {profile.serviceArea && (
                  <p className="text-xs text-gray-500">📍 {profile.serviceArea}</p>
                )}

                {profile.csiDivisions.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-medium text-gray-500">CSI Divisions</p>
                    <div className="flex flex-wrap gap-1">
                      {profile.csiDivisions.slice(0, 5).map(div => (
                        <span
                          key={div}
                          className="rounded px-1.5 py-0.5 text-xs"
                          style={{ backgroundColor: 'rgba(42,191,191,0.1)', color: '#1A8F8F' }}
                        >
                          {div}
                        </span>
                      ))}
                      {profile.csiDivisions.length > 5 && (
                        <span className="text-xs text-gray-400">+{profile.csiDivisions.length - 5}</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
                  {profile.rating !== null && (
                    <span className="text-xs text-gray-500">⭐ {profile.rating.toFixed(1)}</span>
                  )}
                  <span className="text-xs text-gray-500">
                    {profile.completedProjects} completed project{profile.completedProjects !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center">
                <User className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                <p className="text-sm text-gray-500">No profile yet</p>
                <Link href="/profile" className="mt-2 block text-xs font-medium" style={{ color: '#E8793A' }}>
                  Complete your profile →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
