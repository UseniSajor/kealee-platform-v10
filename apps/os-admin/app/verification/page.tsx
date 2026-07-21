'use client'

/**
 * /verification
 *
 * Admin contractor verification queue.
 * Lists all CONTRACTOR / DESIGN_BUILD marketplace profiles with their
 * current verification status and quick-action drill-down links.
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  HelpCircle,
  RefreshCw,
} from 'lucide-react'
import {
  VerificationClient,
  VerificationStatus,
  ContractorSummaryRow,
  VerificationQueueResponse,
} from '@/lib/api/verification-client'
import { toast } from 'sonner'

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  VerificationStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }
> = {
  PENDING:      { label: 'Pending',      variant: 'secondary',    icon: Clock        },
  NEEDS_INFO:   { label: 'Needs Info',   variant: 'outline',      icon: HelpCircle   },
  UNDER_REVIEW: { label: 'Under Review', variant: 'default',      icon: RefreshCw    },
  APPROVED:     { label: 'Approved',     variant: 'default',      icon: CheckCircle2 },
  REJECTED:     { label: 'Rejected',     variant: 'destructive',  icon: XCircle      },
  SUSPENDED:    { label: 'Suspended',    variant: 'destructive',  icon: AlertTriangle },
}

const STATUS_TABS: Array<{ key: VerificationStatus | 'ALL'; label: string }> = [
  { key: 'ALL',        label: 'All'         },
  { key: 'PENDING',    label: 'Pending'     },
  { key: 'NEEDS_INFO', label: 'Needs Info'  },
  { key: 'APPROVED',   label: 'Approved'    },
  { key: 'REJECTED',   label: 'Rejected'    },
  { key: 'SUSPENDED',  label: 'Suspended'   },
]

// ─── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: VerificationStatus }) {
  const cfg = STATUS_CONFIG[status]
  const Icon = cfg.icon
  return (
    <Badge variant={cfg.variant} className="inline-flex items-center gap-1 text-xs">
      <Icon size={11} />
      {cfg.label}
    </Badge>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function VerificationQueuePage() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [data,    setData]    = useState<VerificationQueueResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const [search,      setSearch]      = useState(searchParams.get('search') ?? '')
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  const [activeStatus, setActiveStatus] = useState<VerificationStatus | 'ALL'>(
    (searchParams.get('status') as VerificationStatus | 'ALL') ?? 'ALL'
  )
  const [page, setPage] = useState(Number(searchParams.get('page') ?? 1))

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [activeStatus, debouncedSearch])

  const fetchQueue = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await VerificationClient.getQueue({
        status: activeStatus === 'ALL' ? undefined : activeStatus,
        search: debouncedSearch || undefined,
        page,
        limit: 25,
      })
      setData(result)
    } catch (err: any) {
      setError(err.message ?? 'Failed to load verification queue')
    } finally {
      setLoading(false)
    }
  }, [activeStatus, debouncedSearch, page])

  useEffect(() => { fetchQueue() }, [fetchQueue])

  const contractors = data?.contractors ?? []
  const pagination  = data?.pagination
  const counts      = data?.counts

  return (
    <ProtectedRoute requiredRole="admin">
      <AppLayout>
        <div className="p-6 max-w-7xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Contractor Verification</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Review and approve contractor license &amp; insurance credentials
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchQueue} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'animate-spin mr-1.5' : 'mr-1.5'} />
              Refresh
            </Button>
          </div>

          {/* Status filter tabs */}
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_TABS.map(({ key, label }) => {
              const count = key === 'ALL'
                ? (counts ? Object.values(counts).reduce((a, b) => a + b, 0) : undefined)
                : counts?.[key as VerificationStatus]
              const isActive = activeStatus === key
              return (
                <button
                  key={key}
                  onClick={() => setActiveStatus(key)}
                  className={`
                    px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                    ${isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }
                  `}
                >
                  {label}
                  {count !== undefined && (
                    <span className={`ml-1.5 text-xs ${isActive ? 'opacity-80' : 'text-gray-400'}`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Table card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">
                  {pagination ? `${pagination.total} contractor${pagination.total !== 1 ? 's' : ''}` : 'Contractors'}
                </CardTitle>
                <div className="relative w-64">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search name, email, company..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 h-8 text-sm"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">

              {/* Error state */}
              {error && (
                <div className="flex items-center gap-2 p-4 text-red-700 bg-red-50 border-t border-red-100">
                  <AlertCircle size={16} />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Loading skeleton */}
              {loading && (
                <div className="flex items-center justify-center py-16">
                  <Loader2 size={24} className="animate-spin text-blue-500" />
                </div>
              )}

              {/* Table */}
              {!loading && !error && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Verified</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead>Last Action</TableHead>
                      <TableHead className="w-[80px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contractors.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-12 text-gray-500 text-sm">
                          No contractors found
                        </TableCell>
                      </TableRow>
                    ) : (
                      contractors.map((row) => (
                        <ContractorRow key={row.profileId} row={row} />
                      ))
                    )}
                  </TableBody>
                </Table>
              )}

              {/* Pagination */}
              {!loading && pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    Page {pagination.page} of {pagination.totalPages} &middot; {pagination.total} total
                  </span>
                  <div className="flex gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft size={14} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= pagination.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight size={14} />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}

// ─── Contractor row ────────────────────────────────────────────────────────────

function ContractorRow({ row }: { row: ContractorSummaryRow }) {
  const registeredDate = new Date(row.registeredAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
  const lastActionDate = row.lastActionAt
    ? new Date(row.lastActionAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null

  return (
    <TableRow className="hover:bg-gray-50/50">
      <TableCell className="font-medium">
        <div className="max-w-[180px]">
          <p className="truncate text-sm">{row.businessName}</p>
          {row.specialties.slice(0, 2).map((s) => (
            <span
              key={s}
              className="inline-block mr-1 mt-0.5 text-[10px] bg-gray-100 text-gray-600 rounded px-1"
            >
              {s}
            </span>
          ))}
        </div>
      </TableCell>
      <TableCell>
        <div className="text-xs">
          <p className="text-gray-800">{row.contactName ?? '—'}</p>
          <p className="text-gray-500 truncate max-w-[160px]">{row.contactEmail ?? '—'}</p>
        </div>
      </TableCell>
      <TableCell className="text-xs text-gray-600">
        {row.city && row.state ? `${row.city}, ${row.state}` : row.state ?? '—'}
      </TableCell>
      <TableCell>
        <span className="text-xs text-gray-600 capitalize">
          {row.professionalType === 'DESIGN_BUILD' ? 'Design-Build' : 'Contractor'}
        </span>
      </TableCell>
      <TableCell>
        <StatusBadge status={row.verificationStatus} />
      </TableCell>
      <TableCell>
        <div className="flex gap-2 text-xs">
          <span className={row.licenseVerified ? 'text-green-600' : 'text-gray-400'}>
            {row.licenseVerified ? '✓' : '✗'} Lic
          </span>
          <span className={row.insuranceVerified ? 'text-green-600' : 'text-gray-400'}>
            {row.insuranceVerified ? '✓' : '✗'} Ins
          </span>
        </div>
      </TableCell>
      <TableCell className="text-xs text-gray-500">{registeredDate}</TableCell>
      <TableCell className="text-xs text-gray-500">
        {lastActionDate ?? '—'}
        {row.reviewedBy && (
          <p className="text-[10px] text-gray-400 truncate max-w-[100px]">by {row.reviewedBy}</p>
        )}
      </TableCell>
      <TableCell>
        <Link href={`/verification/${row.profileId}`}>
          <Button variant="outline" size="sm" className="h-7 text-xs">
            Review
          </Button>
        </Link>
      </TableCell>
    </TableRow>
  )
}
