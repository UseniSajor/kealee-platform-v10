'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { FileText, Upload, Download, Search, FolderOpen, File, Image, FileSpreadsheet, Shield, Clock, CheckCircle, AlertTriangle, ChevronDown, ChevronRight, Loader2, Trash2 } from 'lucide-react'
import { listFiles, uploadFile, getDownloadUrl, deleteFile, type UploadedFile } from '@/lib/api/files'

// ── Permit Types from seed-v20-core ──
// BUILDING (21 days), ELECTRICAL (10 days), PLUMBING (10 days), MECHANICAL (14 days), ZONING (45 days), DEMOLITION (14 days)

interface PermitCategory {
  key: string
  name: string
  typicalDays: number
  requiredDocuments: string[]
  status: 'approved' | 'pending' | 'not_submitted'
}

const PERMIT_CATEGORIES: PermitCategory[] = [
  {
    key: 'BUILDING',
    name: 'Building Permit',
    typicalDays: 21,
    requiredDocuments: [
      'Site Plan',
      'Floor Plans',
      'Elevations',
      'Structural Calculations',
      'Energy Compliance (Title 24 / IECC)',
      'Proof of Ownership or Authorization',
    ],
    status: 'approved',
  },
  {
    key: 'ELECTRICAL',
    name: 'Electrical Permit',
    typicalDays: 10,
    requiredDocuments: [
      'Electrical Plans',
      'Load Calculations',
      'Panel Schedule',
      'Single-Line Diagram',
    ],
    status: 'approved',
  },
  {
    key: 'PLUMBING',
    name: 'Plumbing Permit',
    typicalDays: 10,
    requiredDocuments: [
      'Plumbing Plans',
      'Fixture Count / Fixture Unit Calculations',
      'Water Supply Sizing',
      'Isometric Diagram',
    ],
    status: 'pending',
  },
  {
    key: 'MECHANICAL',
    name: 'Mechanical Permit',
    typicalDays: 14,
    requiredDocuments: [
      'Mechanical Plans',
      'HVAC Load Calculations (Manual J / Manual D)',
      'Equipment Specifications',
      'Duct Layout',
    ],
    status: 'pending',
  },
  {
    key: 'ZONING',
    name: 'Zoning Permit / Variance',
    typicalDays: 45,
    requiredDocuments: [
      'Site Plan with Setbacks',
      'Zoning Analysis Letter',
      'Survey / Plat',
      'Variance Application (if applicable)',
      'Neighbor Notification Records',
    ],
    status: 'approved',
  },
  {
    key: 'DEMOLITION',
    name: 'Demolition Permit',
    typicalDays: 14,
    requiredDocuments: [
      'Demolition Plan',
      'Asbestos / Lead Survey Report',
      'Utility Disconnection Confirmation',
      'Erosion Control Plan',
      'Debris Disposal Plan',
    ],
    status: 'not_submitted',
  },
]

interface Document {
  id: string
  name: string
  type: string
  project: string
  size: string
  uploaded: string
  category: string
  permitType?: string
  status: 'uploaded' | 'approved' | 'pending_review' | 'missing'
}


const ALL_CATEGORIES = ['All', 'Permits', 'Contracts', 'Plans', 'Inspections', 'Photos', 'Financial', 'Insurance']

const fileIcon = (type: string) => {
  switch (type) {
    case 'pdf': return <FileText className="h-5 w-5 text-red-500" />
    case 'xlsx': return <FileSpreadsheet className="h-5 w-5 text-green-500" />
    case 'zip': return <Image className="h-5 w-5 text-purple-500" />
    default: return <File className="h-5 w-5 text-gray-500" />
  }
}

const statusBadge = (status: Document['status']) => {
  switch (status) {
    case 'approved':
      return <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"><CheckCircle className="h-3 w-3" />Approved</span>
    case 'pending_review':
      return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700"><Clock className="h-3 w-3" />Pending Review</span>
    case 'uploaded':
      return <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700"><Shield className="h-3 w-3" />Uploaded</span>
    case 'missing':
      return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700"><AlertTriangle className="h-3 w-3" />Missing</span>
  }
}

const permitStatusBadge = (status: PermitCategory['status']) => {
  switch (status) {
    case 'approved':
      return <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700"><CheckCircle className="h-3.5 w-3.5" />Approved</span>
    case 'pending':
      return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700"><Clock className="h-3.5 w-3.5" />Under Review</span>
    case 'not_submitted':
      return <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500"><AlertTriangle className="h-3.5 w-3.5" />Not Submitted</span>
  }
}

function mapApiFileToDoc(f: UploadedFile): Document {
  const ext = f.fileName.split('.').pop()?.toLowerCase() || 'pdf'
  const sizeKB = f.size / 1024
  const sizeStr = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${Math.round(sizeKB)} KB`
  return {
    id: f.id,
    name: f.fileName,
    type: ['pdf','xlsx','zip','png','jpg'].includes(ext) ? ext : 'pdf',
    project: f.metadata?.project || 'My Project',
    size: sizeStr,
    uploaded: f.createdAt.split('T')[0],
    category: f.metadata?.category || 'Uploads',
    status: 'uploaded',
  }
}

export default function DocumentsPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [view, setView] = useState<'permits' | 'documents'>('permits')
  const [expandedPermit, setExpandedPermit] = useState<string | null>('BUILDING')
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLive, setIsLive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadFiles = useCallback(async () => {
    try {
      const data = await listFiles('project-documents')
      if (data.files?.length) {
        setDocuments(data.files.map(mapApiFileToDoc))
        setIsLive(true)
      }
    } catch { /* fail silently */ }
  }, [])

  useEffect(() => { loadFiles() }, [loadFiles])

  async function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    setUploadError('')
    try {
      const uploaded = await Promise.all(
        files.map(f => uploadFile(f, 'project-documents', { category: 'Uploads', project: 'My Project' }))
      )
      setDocuments(prev => [...prev, ...uploaded.map(mapApiFileToDoc)])
      if (uploaded.length > 0) setIsLive(true)
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDownload(doc: Document) {
    try {
      const { url } = await getDownloadUrl(doc.id)
      window.open(url, '_blank', 'noopener')
    } catch {
      // fall through — no download URL for seed docs
    }
  }

  async function handleDelete(doc: Document) {
    if (!confirm(`Delete "${doc.name}"?`)) return
    try {
      await deleteFile(doc.id)
      setDocuments(prev => prev.filter(d => d.id !== doc.id))
    } catch { /* ignore */ }
  }

  const filtered = documents.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.project.toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'All' || d.category === category
    return matchSearch && matchCat
  })

  const approvedCount = PERMIT_CATEGORIES.filter(p => p.status === 'approved').length
  const pendingCount = PERMIT_CATEGORIES.filter(p => p.status === 'pending').length
  const totalRequiredDocs = PERMIT_CATEGORIES.reduce((s, p) => s + p.requiredDocuments.length, 0)
  const uploadedPermitDocs = documents.filter(d => d.permitType).length

  return (
    <div>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        accept=".pdf,.doc,.docx,.xlsx,.xls,.png,.jpg,.jpeg,.zip,.dwg"
        onChange={handleFilesSelected}
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: '#1A2B4A' }}>Documents</h1>
          <p className="mt-1 text-sm text-gray-600">
            {documents.length} files across all projects
            {isLive && <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700"><span className="h-1.5 w-1.5 rounded-full bg-green-500" />Live</span>}
          </p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: '#E8793A' }}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
      </div>
      {uploadError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{uploadError}</div>
      )}

      {/* Permit Summary Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Permit Types</p>
          <p className="mt-1 text-2xl font-bold font-display" style={{ color: '#1A2B4A' }}>{PERMIT_CATEGORIES.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Approved</p>
          <p className="mt-1 text-2xl font-bold font-display text-green-600">{approvedCount}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Under Review</p>
          <p className="mt-1 text-2xl font-bold font-display" style={{ color: '#E8793A' }}>{pendingCount}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Docs Uploaded</p>
          <p className="mt-1 text-2xl font-bold font-display" style={{ color: '#2ABFBF' }}>{uploadedPermitDocs}/{totalRequiredDocs}</p>
        </div>
      </div>

      {/* View Toggle */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-6">
          <button onClick={() => setView('permits')}
            className={`border-b-2 pb-3 text-sm font-medium ${view === 'permits' ? 'border-transparent' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            style={view === 'permits' ? { borderColor: '#2ABFBF', color: '#2ABFBF' } : undefined}>
            Permit Documents
          </button>
          <button onClick={() => setView('documents')}
            className={`border-b-2 pb-3 text-sm font-medium ${view === 'documents' ? 'border-transparent' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            style={view === 'documents' ? { borderColor: '#2ABFBF', color: '#2ABFBF' } : undefined}>
            All Documents
          </button>
        </div>
      </div>

      {view === 'permits' ? (
        /* ── Permit Types View ── */
        <div className="space-y-3">
          {PERMIT_CATEGORIES.map((permit) => {
            const isExpanded = expandedPermit === permit.key
            const permitDocs = documents.filter(d => d.permitType === permit.key)
            const uploadedCount = permitDocs.length
            const requiredCount = permit.requiredDocuments.length

            return (
              <div key={permit.key} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpandedPermit(isExpanded ? null : permit.key)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{
                        backgroundColor: permit.status === 'approved' ? 'rgba(56,161,105,0.1)' :
                          permit.status === 'pending' ? 'rgba(232,121,58,0.1)' : 'rgba(160,174,192,0.1)'
                      }}>
                        <Shield className="h-5 w-5" style={{
                          color: permit.status === 'approved' ? '#38A169' :
                            permit.status === 'pending' ? '#E8793A' : '#A0AEC0'
                        }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>{permit.name}</p>
                          {permitStatusBadge(permit.status)}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Typical review: {permit.typicalDays} days -- {uploadedCount}/{requiredCount} documents uploaded
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Doc completion mini-bar */}
                      <div className="hidden sm:flex items-center gap-1.5">
                        <div className="h-1.5 w-24 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min((uploadedCount / requiredCount) * 100, 100)}%`,
                              backgroundColor: uploadedCount >= requiredCount ? '#38A169' : '#E8793A',
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">{uploadedCount}/{requiredCount}</span>
                      </div>
                      {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 pb-5">
                    <p className="py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Required Documents</p>
                    <div className="space-y-2">
                      {permit.requiredDocuments.map((reqDoc, i) => {
                        const matchedDoc = permitDocs.find(d =>
                          d.name.toLowerCase().includes(reqDoc.split(' ')[0].toLowerCase()) ||
                          reqDoc.toLowerCase().includes(d.name.split(' ')[0].toLowerCase().replace('.pdf', ''))
                        )
                        // Check by index for ordered matching
                        const docByIndex = permitDocs[i]
                        const doc = matchedDoc || docByIndex

                        return (
                          <div key={reqDoc} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                            <div className="flex items-center gap-3">
                              {doc ? fileIcon(doc.type) : <File className="h-5 w-5 text-gray-300" />}
                              <div>
                                <p className="text-sm font-medium text-gray-700">{reqDoc}</p>
                                {doc ? (
                                  <p className="text-xs text-gray-400">{doc.name} -- {doc.size} -- {new Date(doc.uploaded).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                ) : (
                                  <p className="text-xs text-red-400">Not yet uploaded</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {doc ? statusBadge(doc.status) : statusBadge('missing')}
                              {doc && (
                                <button onClick={() => handleDownload(doc)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-600">
                                  <Download className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        /* ── All Documents View ── */
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search documents..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-1"
                style={{ '--tw-ring-color': '#2ABFBF' } as React.CSSProperties}
              />
            </div>
            <div className="flex gap-1 overflow-x-auto">
              {ALL_CATEGORIES.map((c) => (
                <button key={c} onClick={() => setCategory(c)}
                  className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    category === c ? '' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={category === c ? { backgroundColor: 'rgba(42,191,191,0.15)', color: '#2ABFBF' } : undefined}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <FolderOpen className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-4 text-sm font-medium text-gray-900">No documents found</h3>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filtered.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      {fileIcon(doc.type)}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                        <p className="text-xs text-gray-500">
                          {doc.project} -- {doc.size} -- {new Date(doc.uploaded).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {doc.permitType && <span className="ml-2 text-gray-400">({PERMIT_CATEGORIES.find(p => p.key === doc.permitType)?.name})</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {statusBadge(doc.status)}
                      <button onClick={() => handleDownload(doc)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                        <Download className="h-4 w-4" />
                      </button>
                      {isLive && (
                        <button onClick={() => handleDelete(doc)} className="rounded-lg p-2 text-gray-300 hover:bg-red-50 hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
