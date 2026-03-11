'use client'

import { useState, useEffect } from 'react'
import { FileText, Upload, Download, Search, FolderOpen, File, Image, FileSpreadsheet, Shield, Clock, CheckCircle, AlertTriangle, ChevronDown, ChevronRight, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'

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

const DOCUMENTS: Document[] = [
  // Building Permit docs
  { id: '1', name: 'Site Plan - Modern Duplex.pdf', type: 'pdf', project: 'Modern Duplex', size: '4.2 MB', uploaded: '2025-10-10', category: 'Permits', permitType: 'BUILDING', status: 'approved' },
  { id: '2', name: 'Floor Plans A1-A4.pdf', type: 'pdf', project: 'Modern Duplex', size: '18.7 MB', uploaded: '2025-10-12', category: 'Permits', permitType: 'BUILDING', status: 'approved' },
  { id: '3', name: 'Elevations - North & South.pdf', type: 'pdf', project: 'Modern Duplex', size: '8.3 MB', uploaded: '2025-10-12', category: 'Permits', permitType: 'BUILDING', status: 'approved' },
  { id: '4', name: 'Structural Calculations.pdf', type: 'pdf', project: 'Modern Duplex', size: '3.1 MB', uploaded: '2025-10-14', category: 'Permits', permitType: 'BUILDING', status: 'approved' },
  { id: '5', name: 'Title 24 Energy Compliance.pdf', type: 'pdf', project: 'Modern Duplex', size: '2.8 MB', uploaded: '2025-10-14', category: 'Permits', permitType: 'BUILDING', status: 'approved' },
  { id: '6', name: 'Proof of Ownership - Deed.pdf', type: 'pdf', project: 'Modern Duplex', size: '540 KB', uploaded: '2025-10-08', category: 'Permits', permitType: 'BUILDING', status: 'approved' },

  // Electrical Permit docs
  { id: '7', name: 'Electrical Plans E1-E3.pdf', type: 'pdf', project: 'Modern Duplex', size: '6.4 MB', uploaded: '2025-11-05', category: 'Permits', permitType: 'ELECTRICAL', status: 'approved' },
  { id: '8', name: 'Load Calculations.xlsx', type: 'xlsx', project: 'Modern Duplex', size: '128 KB', uploaded: '2025-11-05', category: 'Permits', permitType: 'ELECTRICAL', status: 'approved' },
  { id: '9', name: 'Panel Schedule.pdf', type: 'pdf', project: 'Modern Duplex', size: '890 KB', uploaded: '2025-11-06', category: 'Permits', permitType: 'ELECTRICAL', status: 'approved' },
  { id: '10', name: 'Single-Line Diagram.pdf', type: 'pdf', project: 'Modern Duplex', size: '1.1 MB', uploaded: '2025-11-06', category: 'Permits', permitType: 'ELECTRICAL', status: 'approved' },

  // Plumbing Permit docs (pending)
  { id: '11', name: 'Plumbing Plans P1-P2.pdf', type: 'pdf', project: 'Modern Duplex', size: '5.2 MB', uploaded: '2026-02-20', category: 'Permits', permitType: 'PLUMBING', status: 'pending_review' },
  { id: '12', name: 'Fixture Unit Calculations.xlsx', type: 'xlsx', project: 'Modern Duplex', size: '95 KB', uploaded: '2026-02-20', category: 'Permits', permitType: 'PLUMBING', status: 'pending_review' },
  { id: '13', name: 'Water Supply Sizing.pdf', type: 'pdf', project: 'Modern Duplex', size: '780 KB', uploaded: '2026-02-22', category: 'Permits', permitType: 'PLUMBING', status: 'pending_review' },
  { id: '14', name: 'Isometric Diagram.pdf', type: 'pdf', project: 'Modern Duplex', size: '1.4 MB', uploaded: '2026-02-22', category: 'Permits', permitType: 'PLUMBING', status: 'uploaded' },

  // Mechanical Permit docs (pending)
  { id: '15', name: 'Mechanical Plans M1-M3.pdf', type: 'pdf', project: 'Modern Duplex', size: '7.8 MB', uploaded: '2026-02-25', category: 'Permits', permitType: 'MECHANICAL', status: 'pending_review' },
  { id: '16', name: 'Manual J - HVAC Load Calcs.pdf', type: 'pdf', project: 'Modern Duplex', size: '2.1 MB', uploaded: '2026-02-25', category: 'Permits', permitType: 'MECHANICAL', status: 'pending_review' },
  { id: '17', name: 'Equipment Specifications.pdf', type: 'pdf', project: 'Modern Duplex', size: '3.4 MB', uploaded: '2026-02-26', category: 'Permits', permitType: 'MECHANICAL', status: 'uploaded' },

  // Zoning docs
  { id: '18', name: 'Site Plan with Setbacks.pdf', type: 'pdf', project: 'Modern Duplex', size: '5.6 MB', uploaded: '2025-09-20', category: 'Permits', permitType: 'ZONING', status: 'approved' },
  { id: '19', name: 'Zoning Analysis Letter.pdf', type: 'pdf', project: 'Modern Duplex', size: '420 KB', uploaded: '2025-09-18', category: 'Permits', permitType: 'ZONING', status: 'approved' },
  { id: '20', name: 'Property Survey - ALTA.pdf', type: 'pdf', project: 'Modern Duplex', size: '3.9 MB', uploaded: '2025-09-15', category: 'Permits', permitType: 'ZONING', status: 'approved' },

  // General project documents
  { id: '21', name: 'Construction Contract - Final.pdf', type: 'pdf', project: 'Modern Duplex', size: '2.4 MB', uploaded: '2025-10-28', category: 'Contracts', status: 'approved' },
  { id: '22', name: 'Insurance Certificate - GL.pdf', type: 'pdf', project: 'All Projects', size: '320 KB', uploaded: '2025-09-15', category: 'Insurance', status: 'approved' },
  { id: '23', name: 'Foundation Inspection Report.pdf', type: 'pdf', project: 'Modern Duplex', size: '1.2 MB', uploaded: '2025-12-22', category: 'Inspections', status: 'approved' },
  { id: '24', name: 'Progress Photos - March 2026.zip', type: 'zip', project: 'Modern Duplex', size: '45.3 MB', uploaded: '2026-03-07', category: 'Photos', status: 'uploaded' },
  { id: '25', name: 'Draw Schedule.xlsx', type: 'xlsx', project: 'Modern Duplex', size: '89 KB', uploaded: '2025-10-30', category: 'Financial', status: 'approved' },
  { id: '26', name: 'Kitchen Design Concept.pdf', type: 'pdf', project: 'Kitchen Remodel', size: '5.1 MB', uploaded: '2026-01-20', category: 'Plans', status: 'approved' },
]

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

export default function DocumentsPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [view, setView] = useState<'permits' | 'documents'>('permits')
  const [expandedPermit, setExpandedPermit] = useState<string | null>('BUILDING')
  const [documents, setDocuments] = useState<Document[]>(DOCUMENTS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDocuments() {
      try {
        const projRes = await api.listMyProjects()
        if (projRes.projects?.[0]) {
          const docsRes = await api.listProjectDocuments(projRes.projects[0].id).catch(() => null)
          if (docsRes?.documents?.length) {
            const mapped: Document[] = docsRes.documents.map((d, i) => ({
              id: d.id || String(i),
              name: d.fileName || d.title,
              type: (d.fileName || '').split('.').pop() || 'pdf',
              project: projRes.projects[0].name,
              size: d.sizeBytes ? `${(d.sizeBytes / 1024 / 1024).toFixed(1)} MB` : '—',
              uploaded: d.createdAt,
              category: d.documentType || 'General',
              status: (d.status === 'APPROVED' ? 'approved' : d.status === 'PENDING' ? 'pending_review' : 'uploaded') as Document['status'],
            }))
            setDocuments(mapped)
          }
        }
      } catch {
        // Fall back to mock documents
      } finally {
        setLoading(false)
      }
    }
    fetchDocuments()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#2ABFBF' }} />
      </div>
    )
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
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: '#1A2B4A' }}>Documents</h1>
          <p className="mt-1 text-sm text-gray-600">{documents.length} files across all projects</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90" style={{ backgroundColor: '#E8793A' }}>
          <Upload className="h-4 w-4" />
          Upload
        </button>
      </div>

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
                                <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-600">
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
                      <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                        <Download className="h-4 w-4" />
                      </button>
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
