'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Megaphone, ShieldCheck, FolderKanban, ArrowRight,
  AlertTriangle, CheckCircle, Clock, User, TrendingUp,
} from 'lucide-react'
import { getContractorProfile, getContractorLeads, getVerificationDocuments } from '@/lib/api/contractor'
import type { ContractorProfile, LeadCounts, VerificationDocument } from '@/lib/api/contractor'
import { RevenueHookModal } from '@kealee/core-hooks'

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
  const [showGrowthHook, setShowGrowthHook] = useState(false)

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

  // Show growth hook once per session for verified contractors
  useEffect(() => {
    if (!loading && profile?.verificationStatus === 'VERIFIED') {
      const key = 'kea_growth_hook_shown'
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1')
        setShowGrowthHook(true)
      }
    }
  }, [loading, profile])

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
          className="mt-4 rounded-lg px-4 py-2 text-sm font-medium text-white bg-[#E8793A]"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="rounded-3xl px-8 py-7 text-white overflow-hidden relative shadow-lg bg-gradient-to-br from-slate-900 via-[#22170f] to-slate-950 border border-orange-500/5">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-15 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 80% 50%, #F59E0B, transparent 70%)' }} />
        <div className="relative">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#F59E0B] bg-[#F59E0B]/10 px-2.5 py-1 rounded">
            Contractor Portal
          </span>
          <h1 className="font-sans text-3xl font-extrabold text-white mt-3 tracking-tight">
            {loading ? 'Loading…' : <>Welcome back, {profile?.businessName ?? 'Contractor'}</>}
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">Manage your project leads, view verification status, and credentials.</p>
        </div>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Pending leads */}
        <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-sm hover:shadow transition relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#F59E0B]" />
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Pending Leads</p>
          {loading ? (
            <Skeleton className="mt-2.5 h-8 w-12" />
          ) : (
            <p className="mt-2 text-2xl font-black font-sans tracking-tight text-[#F59E0B]">
              {counts?.pending ?? 0}
            </p>
          )}
          <p className="mt-1 text-[10px] text-slate-400 font-semibold uppercase">{counts?.accepted ?? 0} accepted</p>
        </div>

        {/* Active docs */}
        <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-sm hover:shadow transition relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#38A169]" />
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Approved Docs</p>
          {loading ? (
            <Skeleton className="mt-2.5 h-8 w-12" />
          ) : (
            <p className="mt-2 text-2xl font-black font-sans tracking-tight text-[#38A169]">
              {approved.length}
            </p>
          )}
          <p className="mt-1 text-[10px] text-slate-400 font-semibold uppercase">{pendingReview.length} under review</p>
        </div>

        {/* Issues */}
        <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-sm hover:shadow transition relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: expiredOrRejected.length > 0 ? '#E53E3E' : '#38A169' }} />
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Action Needed</p>
          {loading ? (
            <Skeleton className="mt-2.5 h-8 w-12" />
          ) : (
            <p
              className="mt-2 text-2xl font-black font-sans tracking-tight"
              style={{ color: expiredOrRejected.length > 0 ? '#E53E3E' : '#38A169' }}
            >
              {expiredOrRejected.length}
            </p>
          )}
          <p className="mt-1 text-[10px] text-slate-400 font-semibold uppercase">expired/rejected docs</p>
        </div>

        {/* Verification status */}
        <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-sm hover:shadow transition relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#6366F1]" />
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Verification</p>
          {loading ? (
            <Skeleton className="mt-2.5 h-8 w-28" />
          ) : (
            <div className="mt-3">
              {profile?.verificationStatus ? (
                <span
                  className="rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider border border-black/5"
                  style={{
                    backgroundColor: (verificationColors[profile.verificationStatus] ?? verificationColors['UNVERIFIED']).bg,
                    color: (verificationColors[profile.verificationStatus] ?? verificationColors['UNVERIFIED']).text,
                  }}
                >
                  {profile.verificationStatus}
                </span>
              ) : (
                <span className="text-xs text-slate-400 font-medium">—</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Alert banner */}
      {!loading && expiredOrRejected.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800">
              {expiredOrRejected.length} credential{expiredOrRejected.length > 1 ? 's' : ''} need attention
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Upload updated documents to maintain active bidding status.
            </p>
          </div>
          <Link href="/credentials" className="text-xs font-bold text-amber-800 hover:underline shrink-0">
            Fix now →
          </Link>
        </div>
      )}

      {/* Reverification alert */}
      {!loading && profile?.requiresReverification && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
          <div className="flex-1">
            <p className="text-sm font-bold text-red-800">Profile re-verification required</p>
            <p className="text-xs text-red-700 mt-0.5">Your credentials have changed and require admin review.</p>
          </div>
          <Link href="/profile" className="text-xs font-bold text-red-700 hover:underline shrink-0">
            View profile →
          </Link>
        </div>
      )}

      {/* Main panels */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pending Leads panel */}
        <div className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-50 px-6 py-4">
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-[#E8793A]" />
              <span className="text-sm font-bold text-slate-900">Pending Leads</span>
            </div>
            <Link href="/leads" className="flex items-center gap-1 text-xs font-bold text-[#2ABFBF] hover:underline">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-center">
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map(i => <Skeleton key={i} className="h-14 w-full rounded-2xl" />)}
              </div>
            ) : (counts?.pending ?? 0) === 0 ? (
              <div className="py-8 text-center">
                <Megaphone className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                <p className="text-sm font-medium text-slate-500">No pending leads</p>
                <p className="text-xs text-slate-400 mt-0.5">New leads will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-4xl font-black font-sans tracking-tight text-[#E8793A]">
                    {counts!.pending}
                  </p>
                  <p className="mt-1 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    lead{counts!.pending !== 1 ? 's' : ''} awaiting response
                  </p>
                </div>
                <Link
                  href="/leads"
                  className="flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-bold text-white shadow-md shadow-orange-100 transition hover:bg-[#D45C33] text-center"
                  style={{ backgroundColor: '#E8793A' }}
                >
                  Review Leads <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Credentials panel */}
        <div className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-50 px-6 py-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#2ABFBF]" />
              <span className="text-sm font-bold text-slate-900">Credentials</span>
            </div>
            <Link href="/credentials" className="flex items-center gap-1 text-xs font-bold text-[#2ABFBF] hover:underline">
              Manage <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-center">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full rounded-xl" />)}
              </div>
            ) : docs.length === 0 ? (
              <div className="py-8 text-center">
                <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                <p className="text-sm font-medium text-slate-500">No documents uploaded</p>
                <Link href="/credentials" className="mt-3 inline-block text-xs font-bold text-[#E8793A] hover:underline">
                  Upload credentials →
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {docs.slice(0, 4).map(doc => {
                  const c = docStatusColor[doc.effectiveStatus] ?? docStatusColor['UPLOADED']
                  return (
                    <div key={doc.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3">
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-xs font-bold text-slate-800 truncate capitalize">
                          {doc.documentType.replace(/_/g, ' ')}
                        </p>
                        <p className="text-[10px] text-slate-400 font-semibold truncate capitalize mt-0.5">
                          {doc.issuerName ?? doc.fileName}
                        </p>
                      </div>
                      <span
                        className="rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide border border-black/5"
                        style={{ backgroundColor: c.bg, color: c.text }}
                      >
                        {doc.effectiveStatus}
                      </span>
                    </div>
                  )
                })}
                {docs.length > 4 && (
                  <p className="text-[10px] text-slate-400 font-bold text-center uppercase tracking-wide mt-2">+{docs.length - 4} more</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Profile panel */}
        <div className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-50 px-6 py-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-slate-700" />
              <span className="text-sm font-bold text-slate-900">Profile</span>
            </div>
            <Link href="/profile" className="flex items-center gap-1 text-xs font-bold text-[#2ABFBF] hover:underline">
              Edit <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-48 rounded-lg" />
                <Skeleton className="h-4 w-36 rounded-lg" />
                <Skeleton className="h-4 w-40 rounded-lg" />
              </div>
            ) : profile ? (
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 leading-tight">
                    {profile.businessName}
                  </h4>
                  {profile.businessType && (
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{profile.businessType}</p>
                  )}
                </div>

                {profile.serviceArea && (
                  <p className="text-xs text-slate-500 flex items-center gap-1">📍 {profile.serviceArea}</p>
                )}

                {profile.csiDivisions.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">CSI Divisions</p>
                    <div className="flex flex-wrap gap-1">
                      {profile.csiDivisions.slice(0, 5).map(div => (
                        <span
                          key={div}
                          className="rounded-lg px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide bg-teal-50 text-teal-700 border border-teal-100 shadow-sm"
                        >
                          {div}
                        </span>
                      ))}
                      {profile.csiDivisions.length > 5 && (
                        <span className="text-xs text-slate-400 font-medium">+{profile.csiDivisions.length - 5}</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 border-t border-slate-100 pt-3">
                  {profile.rating !== null && (
                    <span className="text-xs text-slate-600 font-bold">⭐ {profile.rating.toFixed(1)}</span>
                  )}
                  <span className="text-xs text-slate-500 font-medium">
                    {profile.completedProjects} completed project{profile.completedProjects !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center">
                <User className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                <p className="text-sm text-gray-500">No profile yet</p>
                <Link href="/profile" className="mt-2 block text-xs font-bold text-[#E8793A] hover:underline">
                  Complete your profile →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grow Your Business panel */}
      {!loading && profile?.verificationStatus === 'VERIFIED' && (
        <div className="flex items-center justify-between rounded-2xl border border-teal-200 bg-teal-50/50 px-6 py-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#2ABFBF]/10" aria-hidden="true">
              <TrendingUp className="h-5 w-5 text-[#2ABFBF]" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Grow your business on Kealee</p>
              <p className="text-xs text-slate-500 mt-0.5">Get featured leads, priority matching, and exclusive marketing tools.</p>
            </div>
          </div>
          <button
            onClick={() => setShowGrowthHook(true)}
            className="flex-shrink-0 rounded-xl bg-[#E8793A] hover:bg-[#D45C33] px-6 py-3 text-sm font-bold text-white transition shadow"
          >
            Upgrade Account
          </button>
        </div>
      )}

      {/* Revenue Hook: contractor_growth */}
      {showGrowthHook && (
        <RevenueHookModal
          stage="contractor_growth"
          onSelect={() => setShowGrowthHook(false)}
          onDismiss={() => setShowGrowthHook(false)}
        />
      )}
    </div>
  )
}
