'use client'

import { useEffect, useState, useRef } from 'react'
import {
  ShieldCheck, Upload, AlertTriangle, CheckCircle, Clock,
  FileText, Download, Trash2, RefreshCw, X,
} from 'lucide-react'
import {
  getVerificationDocuments,
  getDocumentDownloadUrl,
  getContractorProfile,
} from '@/lib/api/contractor'
import { apiFetch } from '@/lib/api/client'
import type { VerificationDocument, DocumentType, DocumentStatus } from '@/lib/api/contractor'

// ── Helpers ───────────────────────────────────────────────────────────────────

const DOC_TYPES: DocumentType[] = ['LICENSE', 'INSURANCE', 'BOND', 'CERTIFICATION', 'OTHER']

const STATUS_CONFIG: Record<DocumentStatus, { label: string; bg: string; text: string; icon: typeof CheckCircle }> = {
  UPLOADED:     { label: 'Uploaded',     bg: 'rgba(49,130,206,0.1)',  text: '#3182CE', icon: Clock },
  UNDER_REVIEW: { label: 'Under Review', bg: 'rgba(234,179,8,0.12)', text: '#92400E', icon: Clock },
  APPROVED:     { label: 'Approved',     bg: 'rgba(56,161,105,0.1)', text: '#38A169', icon: CheckCircle },
  REJECTED:     { label: 'Rejected',     bg: 'rgba(229,62,62,0.1)',  text: '#E53E3E', icon: AlertTriangle },
  EXPIRED:      { label: 'Expired',      bg: 'rgba(229,62,62,0.08)', text: '#C53030', icon: AlertTriangle },
  ARCHIVED:     { label: 'Archived',     bg: 'rgba(107,114,128,0.1)',text: '#6B7280', icon: FileText },
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className ?? ''}`} />
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ── Upload modal ──────────────────────────────────────────────────────────────

function UploadModal({
  open,
  profileId,
  onClose,
  onSuccess,
}: {
  open: boolean
  profileId: string | null
  onClose: () => void
  onSuccess: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [docType, setDocType] = useState<DocumentType>('LICENSE')
  const [issuerName, setIssuerName] = useState('')
  const [documentNumber, setDocumentNumber] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [step, setStep] = useState<'form' | 'uploading' | 'confirming' | 'done' | 'error'>('form')
  const [errorMsg, setErrorMsg] = useState('')

  const reset = () => {
    setDocType('LICENSE')
    setIssuerName('')
    setDocumentNumber('')
    setExpiresAt('')
    setFile(null)
    setStep('form')
    setErrorMsg('')
  }

  const handleClose = () => { reset(); onClose() }

  const handleUpload = async () => {
    if (!file) return
    setStep('uploading')
    setErrorMsg('')

    try {
      // Step 1: Get presigned URL
      const { presignedUrl, key } = await apiFetch<{
        presignedUrl: string
        key: string
        expiresAt: string
        marketplaceProfileId: string
      }>('/verification/documents/presigned-url', {
        method: 'POST',
        body: JSON.stringify({
          documentType: docType,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
        }),
      })

      // Step 2: PUT file to S3
      const putRes = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })
      if (!putRes.ok) throw new Error('S3 upload failed')

      // Step 3: Confirm
      setStep('confirming')
      await apiFetch('/verification/documents', {
        method: 'POST',
        body: JSON.stringify({
          key,
          documentType: docType,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          issuerName: issuerName || undefined,
          documentNumber: documentNumber || undefined,
          expiresAt: expiresAt || undefined,
        }),
      })

      setStep('done')
      onSuccess()
      setTimeout(() => { handleClose() }, 1500)
    } catch (err: any) {
      setStep('error')
      setErrorMsg(err.message ?? 'Upload failed')
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-base font-bold" style={{ color: '#1A2B4A' }}>Upload Document</h3>
          <button onClick={handleClose} className="rounded-lg p-1 hover:bg-gray-100">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {step === 'done' ? (
          <div className="py-8 text-center">
            <CheckCircle className="mx-auto mb-3 h-12 w-12 text-green-500" />
            <p className="font-medium text-green-700">Document uploaded successfully!</p>
          </div>
        ) : step === 'error' ? (
          <div>
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <p className="text-sm text-red-700">{errorMsg}</p>
            </div>
            <button
              onClick={() => setStep('form')}
              className="w-full rounded-lg border border-gray-300 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Document type */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Document Type</label>
              <select
                value={docType}
                onChange={e => setDocType(e.target.value as DocumentType)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none"
                disabled={step !== 'form'}
              >
                {DOC_TYPES.map(t => (
                  <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>

            {/* File */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">File</label>
              <div
                className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 hover:border-teal-400"
                onClick={() => fileRef.current?.click()}
              >
                {file ? (
                  <div className="text-center">
                    <FileText className="mx-auto mb-1 h-6 w-6 text-gray-400" />
                    <p className="text-sm font-medium text-gray-700">{file.name}</p>
                    <p className="text-xs text-gray-400">{formatBytes(file.size)}</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                    <p className="text-sm text-gray-500">Click to select file</p>
                    <p className="text-xs text-gray-400">PDF, DOCX, XLSX, JPEG, PNG up to 20MB</p>
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx,.xlsx,.jpeg,.jpg,.png,.webp"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
              />
            </div>

            {/* Optional metadata */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Issuer (optional)</label>
                <input
                  value={issuerName}
                  onChange={e => setIssuerName(e.target.value)}
                  placeholder="e.g. Texas TDLR"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none"
                  disabled={step !== 'form'}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Doc # (optional)</label>
                <input
                  value={documentNumber}
                  onChange={e => setDocumentNumber(e.target.value)}
                  placeholder="License/policy #"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none"
                  disabled={step !== 'form'}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Expiry Date (optional)</label>
              <input
                type="date"
                value={expiresAt}
                onChange={e => setExpiresAt(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none"
                disabled={step !== 'form'}
              />
            </div>

            <button
              onClick={handleUpload}
              disabled={!file || step !== 'form'}
              className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: '#E8793A' }}
            >
              {step === 'uploading' ? (
                <><RefreshCw className="h-4 w-4 animate-spin" />Uploading…</>
              ) : step === 'confirming' ? (
                <><RefreshCw className="h-4 w-4 animate-spin" />Saving…</>
              ) : (
                <><Upload className="h-4 w-4" />Upload Document</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function CredentialsPage() {
  const [docs, setDocs] = useState<VerificationDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<DocumentType | 'ALL'>('ALL')
  const [showUpload, setShowUpload] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3000)
  }

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [docsData, profileData] = await Promise.all([
        getVerificationDocuments(),
        getContractorProfile().catch(() => null),
      ])
      setDocs(docsData.documents)
      setProfileId(profileData?.id ?? null)
    } catch (err: any) {
      setError(err.message ?? 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleDownload = async (doc: VerificationDocument) => {
    try {
      const { url } = await getDocumentDownloadUrl(doc.id)
      window.open(url, '_blank')
    } catch (err: any) {
      showToast('error', err.message ?? 'Download failed')
    }
  }

  const handleArchive = async (docId: string) => {
    try {
      await apiFetch(`/verification/documents/${docId}`, { method: 'DELETE' })
      showToast('success', 'Document archived')
      await load()
    } catch (err: any) {
      showToast('error', err.message ?? 'Archive failed')
    }
  }

  // ── Derived ─────────────────────────────────────────────────────────────────

  const filtered = activeTab === 'ALL' ? docs : docs.filter(d => d.documentType === activeTab)

  const countByType: Record<string, number> = {}
  for (const d of docs) {
    countByType[d.documentType] = (countByType[d.documentType] ?? 0) + 1
  }

  const expiringSoon = docs.filter(
    d => ['EXPIRED', 'REJECTED'].includes(d.effectiveStatus),
  ).length

  const approvedCount = docs.filter(d => d.effectiveStatus === 'APPROVED').length
  const underReviewCount = docs.filter(d => d.effectiveStatus === 'UNDER_REVIEW').length

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          className="fixed right-4 top-20 z-50 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg"
          style={{ backgroundColor: toast.type === 'success' ? '#38A169' : '#E53E3E' }}
        >
          {toast.msg}
        </div>
      )}

      <UploadModal
        open={showUpload}
        profileId={profileId}
        onClose={() => setShowUpload(false)}
        onSuccess={() => { load(); showToast('success', 'Document uploaded successfully') }}
      />

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: '#1A2B4A' }}>Credentials</h1>
          <p className="mt-1 text-sm text-gray-500">Licenses, insurance, and certification documents</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white"
          style={{ backgroundColor: '#E8793A' }}
          onMouseOver={e => (e.currentTarget.style.backgroundColor = '#C65A20')}
          onMouseOut={e => (e.currentTarget.style.backgroundColor = '#E8793A')}
        >
          <Upload className="h-4 w-4" />Upload Document
        </button>
      </div>

      {/* Alert banner */}
      {!loading && expiringSoon > 0 && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              {expiringSoon} document{expiringSoon > 1 ? 's' : ''} need attention
            </p>
            <p className="text-xs text-amber-700">Upload updated documents to maintain active bidding status</p>
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Total Documents</p>
          {loading ? <Skeleton className="mt-1 h-8 w-12" /> : (
            <p className="mt-1 text-2xl font-bold font-display" style={{ color: '#1A2B4A' }}>{docs.length}</p>
          )}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Approved</p>
          {loading ? <Skeleton className="mt-1 h-8 w-12" /> : (
            <p className="mt-1 text-2xl font-bold font-display" style={{ color: '#38A169' }}>{approvedCount}</p>
          )}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Under Review</p>
          {loading ? <Skeleton className="mt-1 h-8 w-12" /> : (
            <p className="mt-1 text-2xl font-bold font-display" style={{ color: '#92400E' }}>{underReviewCount}</p>
          )}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Need Action</p>
          {loading ? <Skeleton className="mt-1 h-8 w-12" /> : (
            <p className="mt-1 text-2xl font-bold font-display" style={{ color: expiringSoon > 0 ? '#E53E3E' : '#38A169' }}>
              {expiringSoon}
            </p>
          )}
        </div>
      </div>

      {/* Tab filter */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-4 overflow-x-auto">
          {(['ALL', ...DOC_TYPES] as const).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className="flex items-center gap-1 border-b-2 pb-3 text-sm font-medium whitespace-nowrap"
              style={{
                borderColor: activeTab === t ? '#E8793A' : 'transparent',
                color: activeTab === t ? '#E8793A' : '#6B7280',
              }}
            >
              {t === 'ALL' ? 'All Documents' : t.replace(/_/g, ' ')}
              {t !== 'ALL' && countByType[t] !== undefined && (
                <span
                  className="rounded-full px-1.5 py-0.5 text-xs"
                  style={{
                    backgroundColor: activeTab === t ? 'rgba(232,121,58,0.1)' : '#F3F4F6',
                    color: activeTab === t ? '#E8793A' : '#6B7280',
                  }}
                >
                  {countByType[t]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={load} className="ml-auto text-xs font-medium text-red-700 underline">Retry</button>
        </div>
      )}

      {/* Document list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
          <ShieldCheck className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-sm font-medium" style={{ color: '#1A2B4A' }}>No documents</h3>
          <p className="mt-1 text-sm text-gray-500">Upload your first credential document</p>
          <button
            onClick={() => setShowUpload(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: '#E8793A' }}
          >
            <Upload className="h-4 w-4" />Upload Document
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(doc => {
            const config = STATUS_CONFIG[doc.effectiveStatus]
            const StatusIcon = config.icon
            return (
              <div
                key={doc.id}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                style={{
                  borderLeftWidth: '4px',
                  borderLeftColor:
                    doc.effectiveStatus === 'APPROVED' ? '#38A169' :
                    doc.effectiveStatus === 'REJECTED' || doc.effectiveStatus === 'EXPIRED' ? '#E53E3E' :
                    '#E5E7EB',
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>
                        {doc.documentType.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-gray-400">v{doc.version}</span>
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
                        style={{ backgroundColor: config.bg, color: config.text }}
                      >
                        <StatusIcon className="h-3 w-3" />{config.label}
                      </span>
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />{doc.fileName}
                      </span>
                      {doc.issuerName && <span>{doc.issuerName}</span>}
                      {doc.documentNumber && <span>#{doc.documentNumber}</span>}
                      {doc.expiresAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Exp: {new Date(doc.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                    </div>

                    {doc.rejectionReason && (
                      <p className="mt-2 text-xs text-red-600">
                        Rejection reason: {doc.rejectionReason}
                      </p>
                    )}
                    {doc.reviewNote && (
                      <p className="mt-1 text-xs text-gray-500">Note: {doc.reviewNote}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownload(doc)}
                      className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50"
                      title="Download"
                    >
                      <Download className="h-4 w-4 text-gray-500" />
                    </button>
                    {!['APPROVED', 'ARCHIVED'].includes(doc.effectiveStatus) && (
                      <button
                        onClick={() => handleArchive(doc.id)}
                        className="rounded-lg border border-gray-200 p-2 hover:bg-red-50"
                        title="Archive"
                      >
                        <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
