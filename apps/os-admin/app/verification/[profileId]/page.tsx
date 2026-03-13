'use client'

/**
 * /verification/[profileId]
 *
 * Admin contractor verification detail page.
 * Shows full contractor profile, credentials, verification history,
 * and action buttons: Approve, Reject, Request Info, Suspend.
 */

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  Loader2,
  AlertCircle,
  Building2,
  Phone,
  Mail,
  MapPin,
  Shield,
  FileText,
  Calendar,
  User,
  Activity,
} from 'lucide-react'
import {
  VerificationClient,
  VerificationStatus,
  ContractorDetailResponse,
  VerificationEventRecord,
} from '@/lib/api/verification-client'
import { toast } from 'sonner'

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<VerificationStatus, { label: string; color: string; icon: React.ElementType }> = {
  PENDING:      { label: 'Pending Review',    color: 'text-amber-600 bg-amber-50 border-amber-200',    icon: Clock         },
  NEEDS_INFO:   { label: 'Needs Information', color: 'text-purple-600 bg-purple-50 border-purple-200', icon: HelpCircle    },
  UNDER_REVIEW: { label: 'Under Review',      color: 'text-blue-600 bg-blue-50 border-blue-200',       icon: RefreshCw     },
  APPROVED:     { label: 'Approved',          color: 'text-green-600 bg-green-50 border-green-200',    icon: CheckCircle2  },
  REJECTED:     { label: 'Rejected',          color: 'text-red-600 bg-red-50 border-red-200',          icon: XCircle       },
  SUSPENDED:    { label: 'Suspended',         color: 'text-red-700 bg-red-50 border-red-200',          icon: AlertTriangle },
}

// ─── Action dialog config ──────────────────────────────────────────────────────

type ActionType = 'approve' | 'reject' | 'requestInfo' | 'suspend' | 'unsuspend' | 'finalReject'

interface ActionConfig {
  title:        string
  description:  string
  submitLabel:  string
  submitClass:  string
  requireNote:  boolean
  notePlaceholder: string
}

const ACTION_CONFIG: Record<ActionType, ActionConfig> = {
  approve: {
    title:           'Approve Contractor',
    description:     'This will mark the contractor as ELIGIBLE and allow them to receive leads. You can optionally add an approval note.',
    submitLabel:     'Approve',
    submitClass:     'bg-green-600 hover:bg-green-700 text-white',
    requireNote:     false,
    notePlaceholder: 'Optional approval note...',
  },
  reject: {
    title:           'Reject Contractor',
    description:     'The contractor will remain in PENDING status and can resubmit. A rejection reason is required.',
    submitLabel:     'Reject',
    submitClass:     'bg-red-600 hover:bg-red-700 text-white',
    requireNote:     true,
    notePlaceholder: 'Rejection reason (required)...',
  },
  finalReject: {
    title:           'Permanently Reject',
    description:     'This will mark the contractor as INELIGIBLE. They will not be able to reactivate. This action cannot be undone.',
    submitLabel:     'Permanently Reject',
    submitClass:     'bg-red-700 hover:bg-red-800 text-white',
    requireNote:     true,
    notePlaceholder: 'Reason for permanent rejection (required)...',
  },
  requestInfo: {
    title:           'Request More Information',
    description:     'The contractor will be notified that additional documentation is required. Specify exactly what is needed.',
    submitLabel:     'Send Request',
    submitClass:     'bg-purple-600 hover:bg-purple-700 text-white',
    requireNote:     true,
    notePlaceholder: 'What information or documents are required?',
  },
  suspend: {
    title:           'Suspend Contractor',
    description:     'The contractor will be immediately removed from lead rotation. A suspension reason is required.',
    submitLabel:     'Suspend',
    submitClass:     'bg-orange-600 hover:bg-orange-700 text-white',
    requireNote:     true,
    notePlaceholder: 'Suspension reason (required)...',
  },
  unsuspend: {
    title:           'Unsuspend Contractor',
    description:     'The contractor will be returned to PENDING status for re-review. A note is required.',
    submitLabel:     'Unsuspend',
    submitClass:     'bg-blue-600 hover:bg-blue-700 text-white',
    requireNote:     true,
    notePlaceholder: 'Reason for unsuspending...',
  },
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function VerificationDetailPage() {
  const params  = useParams()
  const router  = useRouter()
  const profileId = params.profileId as string

  const [detail,  setDetail]  = useState<ContractorDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  // Action dialog state
  const [activeAction, setActiveAction] = useState<ActionType | null>(null)
  const [actionNote,   setActionNote]   = useState('')
  const [submitting,   setSubmitting]   = useState(false)

  useEffect(() => {
    loadDetail()
  }, [profileId])

  async function loadDetail() {
    setLoading(true)
    setError(null)
    try {
      const d = await VerificationClient.getDetail(profileId)
      setDetail(d)
    } catch (err: any) {
      setError(err.message ?? 'Failed to load contractor detail')
    } finally {
      setLoading(false)
    }
  }

  async function handleActionSubmit() {
    if (!activeAction) return
    const cfg = ACTION_CONFIG[activeAction]
    if (cfg.requireNote && !actionNote.trim()) {
      toast.error('A note is required for this action')
      return
    }

    setSubmitting(true)
    try {
      let result
      if (activeAction === 'approve') {
        result = await VerificationClient.approve(profileId, actionNote || undefined)
      } else if (activeAction === 'reject') {
        result = await VerificationClient.reject(profileId, actionNote, false)
      } else if (activeAction === 'finalReject') {
        result = await VerificationClient.reject(profileId, actionNote, true)
      } else if (activeAction === 'requestInfo') {
        result = await VerificationClient.requestInfo(profileId, actionNote)
      } else if (activeAction === 'suspend') {
        result = await VerificationClient.suspend(profileId, actionNote, false)
      } else if (activeAction === 'unsuspend') {
        result = await VerificationClient.suspend(profileId, actionNote, true)
      }

      toast.success(`Action completed: contractor is now ${result?.verificationStatus}`)
      setActiveAction(null)
      setActionNote('')
      await loadDetail()
    } catch (err: any) {
      toast.error(err.message ?? 'Action failed')
    } finally {
      setSubmitting(false)
    }
  }

  function openAction(action: ActionType) {
    setActionNote('')
    setActiveAction(action)
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <AppLayout>
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 size={28} className="animate-spin text-blue-500" />
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  if (error || !detail) {
    return (
      <ProtectedRoute requiredRole="admin">
        <AppLayout>
          <div className="p-6">
            <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg p-4">
              <AlertCircle size={16} />
              <span>{error ?? 'Contractor not found'}</span>
            </div>
            <Link href="/verification" className="mt-4 inline-flex items-center text-sm text-blue-600 hover:underline">
              <ArrowLeft size={14} className="mr-1" /> Back to queue
            </Link>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  const statusCfg = STATUS_CONFIG[detail.verificationStatus]
  const StatusIcon = statusCfg.icon
  const isSuspended = detail.verificationStatus === 'SUSPENDED'
  const isApproved  = detail.verificationStatus === 'APPROVED'

  return (
    <ProtectedRoute requiredRole="admin">
      <AppLayout>
        <div className="p-6 max-w-5xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <Link
                href="/verification"
                className="inline-flex items-center text-xs text-gray-500 hover:text-gray-700 mb-2"
              >
                <ArrowLeft size={12} className="mr-1" />
                Verification queue
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">{detail.businessName}</h1>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${statusCfg.color}`}>
                  <StatusIcon size={12} />
                  {statusCfg.label}
                </span>
                <span className="text-xs text-gray-500">
                  {detail.professionalType === 'DESIGN_BUILD' ? 'Design-Build' : 'Contractor'}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <ActionButtons
              status={detail.verificationStatus}
              isSuspended={isSuspended}
              isApproved={isApproved}
              onAction={openAction}
            />
          </div>

          <div className="grid grid-cols-3 gap-5">

            {/* Left column — profile info */}
            <div className="col-span-2 space-y-5">

              {/* Business details */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Building2 size={15} />
                    Business Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <DetailRow label="Company" value={detail.businessName} />
                  {detail.address && (
                    <DetailRow
                      label="Address"
                      icon={<MapPin size={13} className="text-gray-400" />}
                      value={[detail.address, detail.city, detail.state, detail.zip].filter(Boolean).join(', ')}
                    />
                  )}
                  {detail.phone && (
                    <DetailRow
                      label="Phone"
                      icon={<Phone size={13} className="text-gray-400" />}
                      value={detail.phone}
                    />
                  )}
                  {detail.contactEmail && (
                    <DetailRow
                      label="Email"
                      icon={<Mail size={13} className="text-gray-400" />}
                      value={detail.contactEmail}
                    />
                  )}
                  {detail.description && (
                    <div className="pt-1">
                      <p className="text-xs text-gray-500 mb-0.5">Description</p>
                      <p className="text-gray-700 text-xs leading-relaxed">{detail.description}</p>
                    </div>
                  )}
                  {detail.specialties.length > 0 && (
                    <div className="pt-1">
                      <p className="text-xs text-gray-500 mb-1">Trade Specialties</p>
                      <div className="flex flex-wrap gap-1">
                        {detail.specialties.map((s) => (
                          <span key={s} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {detail.serviceAreas.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Service Areas</p>
                      <div className="flex flex-wrap gap-1">
                        {detail.serviceAreas.map((a) => (
                          <span key={a} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Credentials */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shield size={15} />
                    Credentials
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* License */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-700">License</p>
                      {detail.licenseNumber
                        ? <p className="text-sm text-gray-900 mt-0.5">{detail.licenseNumber}</p>
                        : <p className="text-xs text-gray-400 mt-0.5">Not provided</p>
                      }
                      {detail.allLicenses.length > 1 && (
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          +{detail.allLicenses.length - 1} more
                        </p>
                      )}
                    </div>
                    <VerifiedBadge verified={detail.licenseVerified} label="License" />
                  </div>

                  <div className="border-t border-gray-100 pt-3 flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-700">Insurance</p>
                      {detail.insuranceCarrier
                        ? (
                          <>
                            <p className="text-sm text-gray-900 mt-0.5">{detail.insuranceCarrier}</p>
                            {detail.insuranceExpiration && (
                              <p className="text-[11px] text-gray-500 mt-0.5">
                                Exp: {new Date(detail.insuranceExpiration).toLocaleDateString()}
                              </p>
                            )}
                          </>
                        )
                        : <p className="text-xs text-gray-400 mt-0.5">Not provided</p>
                      }
                    </div>
                    <VerifiedBadge verified={detail.insuranceVerified} label="Insurance" />
                  </div>
                </CardContent>
              </Card>

              {/* Workflow stage timeline */}
              {detail.stageTimeline.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Activity size={15} />
                      Stage Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative space-y-3 pl-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-px before:bg-gray-200">
                      {detail.stageTimeline.map((stage, i) => (
                        <div key={stage.id} className="relative flex gap-3 items-start">
                          <div className="absolute -left-2.5 w-2 h-2 rounded-full bg-blue-500 mt-1 ring-2 ring-white" />
                          <div>
                            <p className="text-xs font-medium text-gray-800">{stage.stageName}</p>
                            <p className="text-[10px] text-gray-400">
                              {new Date(stage.enteredAt).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric', year: 'numeric',
                              })}
                            </p>
                            {stage.notes && (
                              <p className="text-[11px] text-gray-500 mt-0.5">{stage.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right column — contact, account, events */}
            <div className="space-y-5">

              {/* Account info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User size={15} />
                    Account
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <DetailRow label="Name"       value={detail.user.name} />
                  <DetailRow label="Email"      value={detail.user.email} />
                  <DetailRow
                    label="Joined"
                    value={new Date(detail.user.createdAt).toLocaleDateString('en-US', {
                      month: 'long', day: 'numeric', year: 'numeric',
                    })}
                  />
                </CardContent>
              </Card>

              {/* Open work items */}
              {detail.openWorkItems.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText size={15} />
                      Open Requests
                      <span className="ml-auto text-xs font-normal bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">
                        {detail.openWorkItems.length}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {detail.openWorkItems.map((item) => (
                      <div key={item.id} className="text-xs border border-gray-100 rounded-lg p-2.5">
                        <p className="font-medium text-gray-800">{item.title}</p>
                        {item.description && (
                          <p className="text-gray-500 mt-0.5 leading-relaxed">{item.description}</p>
                        )}
                        {item.dueAt && (
                          <p className="text-amber-600 mt-1 flex items-center gap-1">
                            <Calendar size={10} />
                            Due {new Date(item.dueAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Event history / audit trail */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock size={15} />
                    Audit History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {detail.eventHistory.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-3">No actions yet</p>
                  ) : (
                    <div className="space-y-3">
                      {detail.eventHistory.map((ev, i) => (
                        <EventRow key={i} event={ev} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Action dialog */}
        {activeAction && (
          <ActionDialog
            action={activeAction}
            note={actionNote}
            onNoteChange={setActionNote}
            submitting={submitting}
            onSubmit={handleActionSubmit}
            onClose={() => {
              setActiveAction(null)
              setActionNote('')
            }}
          />
        )}
      </AppLayout>
    </ProtectedRoute>
  )
}

// ─── Action buttons ────────────────────────────────────────────────────────────

function ActionButtons({
  status,
  isSuspended,
  isApproved,
  onAction,
}: {
  status:      VerificationStatus
  isSuspended: boolean
  isApproved:  boolean
  onAction:    (a: ActionType) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {!isApproved && !isSuspended && (
        <Button
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white"
          onClick={() => onAction('approve')}
        >
          <CheckCircle2 size={14} className="mr-1.5" />
          Approve
        </Button>
      )}
      {!isSuspended && (
        <Button
          variant="outline"
          size="sm"
          className="text-purple-700 border-purple-300 hover:bg-purple-50"
          onClick={() => onAction('requestInfo')}
        >
          <HelpCircle size={14} className="mr-1.5" />
          Request Info
        </Button>
      )}
      {!isApproved && !isSuspended && (
        <Button
          variant="outline"
          size="sm"
          className="text-red-700 border-red-300 hover:bg-red-50"
          onClick={() => onAction('reject')}
        >
          <XCircle size={14} className="mr-1.5" />
          Reject
        </Button>
      )}
      {isSuspended ? (
        <Button
          variant="outline"
          size="sm"
          className="text-blue-700 border-blue-300 hover:bg-blue-50"
          onClick={() => onAction('unsuspend')}
        >
          <RefreshCw size={14} className="mr-1.5" />
          Unsuspend
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="text-orange-700 border-orange-300 hover:bg-orange-50"
          onClick={() => onAction('suspend')}
        >
          <AlertTriangle size={14} className="mr-1.5" />
          Suspend
        </Button>
      )}
    </div>
  )
}

// ─── Action dialog ─────────────────────────────────────────────────────────────

function ActionDialog({
  action,
  note,
  onNoteChange,
  submitting,
  onSubmit,
  onClose,
}: {
  action:       ActionType
  note:         string
  onNoteChange: (v: string) => void
  submitting:   boolean
  onSubmit:     () => void
  onClose:      () => void
}) {
  const cfg = ACTION_CONFIG[action]

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{cfg.title}</DialogTitle>
          <DialogDescription>{cfg.description}</DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <textarea
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder={cfg.notePlaceholder}
            className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none h-28 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {cfg.requireNote && !note.trim() && (
            <p className="text-xs text-red-500 mt-1">This field is required</p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            size="sm"
            className={cfg.submitClass}
            disabled={submitting || (cfg.requireNote && !note.trim())}
            onClick={onSubmit}
          >
            {submitting && <Loader2 size={13} className="animate-spin mr-1.5" />}
            {cfg.submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function DetailRow({
  label,
  value,
  icon,
}: {
  label: string
  value: string | null | undefined
  icon?: React.ReactNode
}) {
  if (!value) return null
  return (
    <div className="flex gap-2 text-xs">
      <span className="text-gray-400 w-20 flex-shrink-0">{label}</span>
      <span className="text-gray-800 flex items-center gap-1">
        {icon}
        {value}
      </span>
    </div>
  )
}

function VerifiedBadge({ verified, label }: { verified: boolean; label: string }) {
  return verified ? (
    <span className="inline-flex items-center gap-1 text-[11px] text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
      <CheckCircle2 size={10} />
      {label} verified
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-gray-50 border border-gray-200 rounded-full px-2 py-0.5">
      <Clock size={10} />
      Pending
    </span>
  )
}

const EVENT_LABELS: Record<string, { label: string; color: string }> = {
  'verification.approved':    { label: 'Approved',         color: 'text-green-600'  },
  'verification.rejected':    { label: 'Rejected',         color: 'text-red-600'    },
  'verification.needs_info':  { label: 'Needs Info',       color: 'text-purple-600' },
  'verification.under_review':{ label: 'Under Review',     color: 'text-blue-600'   },
  'verification.suspended':   { label: 'Suspended',        color: 'text-orange-600' },
  'verification.unsuspended': { label: 'Unsuspended',      color: 'text-blue-600'   },
}

function EventRow({ event }: { event: VerificationEventRecord }) {
  const cfg = EVENT_LABELS[event.eventType] ?? { label: event.eventType, color: 'text-gray-600' }
  return (
    <div className="text-xs border-l-2 border-gray-200 pl-3 py-0.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className={`font-medium ${cfg.color}`}>{cfg.label}</span>
        <span className="text-gray-400 text-[10px]">
          {new Date(event.createdAt).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric',
          })}
        </span>
      </div>
      {event.reviewedBy && (
        <p className="text-gray-400 text-[10px]">by {event.reviewedBy}</p>
      )}
      {event.note && (
        <p className="text-gray-600 mt-0.5 leading-relaxed">{event.note}</p>
      )}
    </div>
  )
}
