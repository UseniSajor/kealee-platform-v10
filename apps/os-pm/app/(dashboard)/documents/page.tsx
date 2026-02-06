"use client"

import * as React from "react"
import {
  Archive,
  ArrowDownToLine,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  Eye,
  File,
  FileArchive,
  FileImage,
  FilePen,
  FileSpreadsheet,
  FileText,
  Filter,
  Folder,
  FolderOpen,
  FolderPlus,
  HardDrive,
  History,
  Link2,
  MoreHorizontal,
  PenLine,
  Plus,
  Search,
  Share2,
  Tag,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react"
import { format } from "date-fns"

import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FolderItem = {
  id: string
  name: string
  fileCount: number
  icon?: React.ReactNode
}

type DocumentStatus =
  | "Signed"
  | "Current"
  | "Approved"
  | "Pending Approval"
  | "Pending Signature"
  | "Pending Payment"
  | "Under Review"
  | "Submitted"
  | "Attached"
  | "Template"
  | "Archive"
  | "Valid until Dec 2026"
  | "Valid until Jul 2026"
  | "Sent for Signature"
  | "Passed"

type FileType = "pdf" | "dwg" | "docx" | "xlsx" | "zip" | "img"

type DocumentItem = {
  id: string
  name: string
  folder: string
  project: string
  fileType: FileType
  version: number
  size: string
  uploadedBy: string
  date: Date
  status: DocumentStatus
  tags?: string[]
}

type VersionEntry = {
  version: number
  date: string
  author: string
  note: string
}

type ActivityEntry = {
  id: string
  message: string
  time: string
  icon: React.ReactNode
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const folders: FolderItem[] = [
  { id: "all", name: "All Documents", fileCount: 1247 },
  { id: "contracts", name: "Contracts & Agreements", fileCount: 34 },
  { id: "drawings", name: "Drawings & Plans", fileCount: 89 },
  { id: "permits", name: "Permits & Approvals", fileCount: 45 },
  { id: "insurance", name: "Insurance & Compliance", fileCount: 28 },
  { id: "submittals", name: "Submittals", fileCount: 67 },
  { id: "rfi", name: "RFI Attachments", fileCount: 23 },
  { id: "photos", name: "Photos & Media", fileCount: 456 },
  { id: "dailylogs", name: "Daily Logs", fileCount: 124 },
  { id: "changeorders", name: "Change Orders", fileCount: 18 },
  { id: "invoices", name: "Invoices & Payments", fileCount: 156 },
  { id: "templates", name: "Templates", fileCount: 32 },
  { id: "clientshared", name: "Client Shared", fileCount: 89 },
]

const documents: DocumentItem[] = [
  {
    id: "doc-1",
    name: "Master Contract - Thompson Build.pdf",
    folder: "Contracts & Agreements",
    project: "Thompson New Construction",
    fileType: "pdf",
    version: 3,
    size: "2.4 MB",
    uploadedBy: "Mike Rodriguez",
    date: new Date(2026, 1, 3),
    status: "Signed",
    tags: ["contract", "prime"],
  },
  {
    id: "doc-2",
    name: "Foundation Plan Set Rev C.dwg",
    folder: "Drawings & Plans",
    project: "Garcia Pool",
    fileType: "dwg",
    version: 3,
    size: "15.2 MB",
    uploadedBy: "Architect Hub",
    date: new Date(2026, 1, 2),
    status: "Current",
    tags: ["structural", "foundation"],
  },
  {
    id: "doc-3",
    name: "Building Permit #2026-0847.pdf",
    folder: "Permits & Approvals",
    project: "Davis ADU",
    fileType: "pdf",
    version: 1,
    size: "0.8 MB",
    uploadedBy: "Lisa Chen",
    date: new Date(2026, 0, 28),
    status: "Approved",
    tags: ["permit", "building"],
  },
  {
    id: "doc-4",
    name: "GL Insurance Certificate.pdf",
    folder: "Insurance & Compliance",
    project: "Company-wide",
    fileType: "pdf",
    version: 1,
    size: "0.3 MB",
    uploadedBy: "Admin",
    date: new Date(2026, 0, 15),
    status: "Valid until Dec 2026",
    tags: ["insurance", "gl"],
  },
  {
    id: "doc-5",
    name: "Cabinet Shop Drawings.pdf",
    folder: "Submittals",
    project: "Johnson Kitchen",
    fileType: "pdf",
    version: 2,
    size: "8.7 MB",
    uploadedBy: "Cabinet Maker Inc",
    date: new Date(2026, 1, 1),
    status: "Approved",
    tags: ["shop-drawings", "cabinets"],
  },
  {
    id: "doc-6",
    name: "RFI-024 Electrical Layout.pdf",
    folder: "RFI Attachments",
    project: "Chen Master Bath",
    fileType: "pdf",
    version: 1,
    size: "1.2 MB",
    uploadedBy: "Rodriguez Electric",
    date: new Date(2026, 1, 3),
    status: "Attached",
    tags: ["rfi", "electrical"],
  },
  {
    id: "doc-7",
    name: "Daily Log 2026-02-03.pdf",
    folder: "Daily Logs",
    project: "Thompson Build",
    fileType: "pdf",
    version: 1,
    size: "0.5 MB",
    uploadedBy: "Auto-generated",
    date: new Date(2026, 1, 3),
    status: "Submitted",
    tags: ["daily-log", "auto"],
  },
  {
    id: "doc-8",
    name: "CO-008 Scope Change.pdf",
    folder: "Change Orders",
    project: "Williams Roof",
    fileType: "pdf",
    version: 1,
    size: "0.4 MB",
    uploadedBy: "Mary Williams",
    date: new Date(2026, 1, 2),
    status: "Pending Approval",
    tags: ["change-order", "scope"],
  },
  {
    id: "doc-9",
    name: "Invoice #INV-2847.pdf",
    folder: "Invoices & Payments",
    project: "Garcia Pool",
    fileType: "pdf",
    version: 1,
    size: "0.2 MB",
    uploadedBy: "Solid Ground Concrete",
    date: new Date(2026, 1, 3),
    status: "Pending Payment",
    tags: ["invoice", "concrete"],
  },
  {
    id: "doc-10",
    name: "Subcontractor Agreement - Rodriguez.pdf",
    folder: "Contracts & Agreements",
    project: "Multiple",
    fileType: "pdf",
    version: 1,
    size: "1.8 MB",
    uploadedBy: "Legal",
    date: new Date(2026, 0, 20),
    status: "Pending Signature",
    tags: ["contract", "subcontractor"],
  },
  {
    id: "doc-11",
    name: "HVAC Spec Sheet.pdf",
    folder: "Submittals",
    project: "Martinez HVAC",
    fileType: "pdf",
    version: 1,
    size: "3.2 MB",
    uploadedBy: "Summit HVAC",
    date: new Date(2026, 0, 30),
    status: "Under Review",
    tags: ["spec", "hvac"],
  },
  {
    id: "doc-12",
    name: "Site Survey Report.pdf",
    folder: "Drawings & Plans",
    project: "Park Reno",
    fileType: "pdf",
    version: 1,
    size: "5.6 MB",
    uploadedBy: "Surveyor Co",
    date: new Date(2026, 0, 25),
    status: "Current",
    tags: ["survey", "site"],
  },
  {
    id: "doc-13",
    name: "Change Order Template.docx",
    folder: "Templates",
    project: "N/A",
    fileType: "docx",
    version: 4,
    size: "0.1 MB",
    uploadedBy: "Admin",
    date: new Date(2026, 0, 10),
    status: "Template",
    tags: ["template", "change-order"],
  },
  {
    id: "doc-14",
    name: "Progress Photos Jan 2026.zip",
    folder: "Photos & Media",
    project: "All Projects",
    fileType: "zip",
    version: 1,
    size: "45.2 MB",
    uploadedBy: "Auto-compiled",
    date: new Date(2026, 1, 1),
    status: "Archive",
    tags: ["photos", "progress"],
  },
  {
    id: "doc-15",
    name: "Workers Comp Certificate.pdf",
    folder: "Insurance & Compliance",
    project: "Rodriguez Electric",
    fileType: "pdf",
    version: 1,
    size: "0.3 MB",
    uploadedBy: "Rodriguez Electric",
    date: new Date(2026, 0, 5),
    status: "Valid until Jul 2026",
    tags: ["insurance", "workers-comp"],
  },
  {
    id: "doc-16",
    name: "Framing Inspection Report.pdf",
    folder: "Permits & Approvals",
    project: "Thompson Build",
    fileType: "pdf",
    version: 1,
    size: "0.7 MB",
    uploadedBy: "Inspector Smith",
    date: new Date(2026, 1, 1),
    status: "Passed",
    tags: ["inspection", "framing"],
  },
  {
    id: "doc-17",
    name: "Proposal - Brown Addition.pdf",
    folder: "Contracts & Agreements",
    project: "Brown Construction",
    fileType: "pdf",
    version: 2,
    size: "1.5 MB",
    uploadedBy: "Mike Rodriguez",
    date: new Date(2026, 0, 28),
    status: "Sent for Signature",
    tags: ["proposal", "addition"],
  },
  {
    id: "doc-18",
    name: "Material Spec - Flooring.pdf",
    folder: "Submittals",
    project: "Johnson Kitchen",
    fileType: "pdf",
    version: 1,
    size: "2.1 MB",
    uploadedBy: "Floor Pros Inc",
    date: new Date(2026, 0, 29),
    status: "Approved",
    tags: ["spec", "flooring"],
  },
  {
    id: "doc-19",
    name: "Lien Waiver - Premier Plumbing.pdf",
    folder: "Contracts & Agreements",
    project: "Chen Master Bath",
    fileType: "pdf",
    version: 1,
    size: "0.2 MB",
    uploadedBy: "Premier Plumbing",
    date: new Date(2026, 1, 2),
    status: "Signed",
    tags: ["lien-waiver", "plumbing"],
  },
  {
    id: "doc-20",
    name: "Budget Comparison Report.xlsx",
    folder: "Invoices & Payments",
    project: "All Projects",
    fileType: "xlsx",
    version: 1,
    size: "0.8 MB",
    uploadedBy: "Auto-generated",
    date: new Date(2026, 1, 3),
    status: "Current",
    tags: ["budget", "report"],
  },
]

const recentActivity: ActivityEntry[] = [
  {
    id: "a1",
    message: "Mike uploaded Master Contract v3",
    time: "10 min ago",
    icon: <Upload className="h-3.5 w-3.5 text-blue-500" />,
  },
  {
    id: "a2",
    message: "Sarah signed Subcontractor Agreement",
    time: "1 hr ago",
    icon: <PenLine className="h-3.5 w-3.5 text-green-500" />,
  },
  {
    id: "a3",
    message: "Auto-generated Daily Log for Thompson Build",
    time: "3 hrs ago",
    icon: <FileText className="h-3.5 w-3.5 text-neutral-500" />,
  },
  {
    id: "a4",
    message: "Cabinet shop drawings approved by PM",
    time: "5 hrs ago",
    icon: <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />,
  },
  {
    id: "a5",
    message: "Lisa Chen uploaded Building Permit",
    time: "Yesterday",
    icon: <Upload className="h-3.5 w-3.5 text-blue-500" />,
  },
  {
    id: "a6",
    message: "Inspector Smith submitted framing report",
    time: "Yesterday",
    icon: <FileText className="h-3.5 w-3.5 text-amber-500" />,
  },
  {
    id: "a7",
    message: "Proposal sent to Brown for signature",
    time: "2 days ago",
    icon: <Share2 className="h-3.5 w-3.5 text-violet-500" />,
  },
  {
    id: "a8",
    message: "Progress photos auto-compiled for Jan",
    time: "5 days ago",
    icon: <FileImage className="h-3.5 w-3.5 text-purple-500" />,
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getFileTypeIcon(fileType: FileType, className?: string) {
  switch (fileType) {
    case "pdf":
      return <FileText className={cn("h-5 w-5 text-red-500", className)} />
    case "dwg":
      return <File className={cn("h-5 w-5 text-blue-600", className)} />
    case "docx":
      return <FileText className={cn("h-5 w-5 text-blue-500", className)} />
    case "xlsx":
      return <FileSpreadsheet className={cn("h-5 w-5 text-green-600", className)} />
    case "zip":
      return <FileArchive className={cn("h-5 w-5 text-amber-500", className)} />
    case "img":
      return <FileImage className={cn("h-5 w-5 text-purple-500", className)} />
    default:
      return <File className={cn("h-5 w-5 text-neutral-400", className)} />
  }
}

function getFileTypeBg(fileType: FileType) {
  switch (fileType) {
    case "pdf":
      return "bg-red-50"
    case "dwg":
      return "bg-blue-50"
    case "docx":
      return "bg-blue-50"
    case "xlsx":
      return "bg-green-50"
    case "zip":
      return "bg-amber-50"
    case "img":
      return "bg-purple-50"
    default:
      return "bg-neutral-50"
  }
}

function getStatusBadge(status: DocumentStatus) {
  let classes = ""
  let label = status as string
  let icon: React.ReactNode = null

  switch (status) {
    case "Signed":
      classes = "bg-emerald-50 text-emerald-700 border-emerald-200"
      icon = <CheckCircle2 className="h-3 w-3" />
      break
    case "Passed":
      classes = "bg-emerald-50 text-emerald-700 border-emerald-200"
      icon = <CheckCircle2 className="h-3 w-3" />
      break
    case "Approved":
      classes = "bg-emerald-50 text-emerald-700 border-emerald-200"
      icon = <CheckCircle2 className="h-3 w-3" />
      break
    case "Current":
      classes = "bg-blue-50 text-blue-700 border-blue-200"
      break
    case "Pending Signature":
      classes = "bg-amber-50 text-amber-700 border-amber-200"
      icon = <PenLine className="h-3 w-3" />
      break
    case "Sent for Signature":
      classes = "bg-amber-50 text-amber-700 border-amber-200"
      icon = <PenLine className="h-3 w-3" />
      break
    case "Pending Approval":
      classes = "bg-amber-50 text-amber-700 border-amber-200"
      icon = <Clock className="h-3 w-3" />
      break
    case "Pending Payment":
      classes = "bg-orange-50 text-orange-700 border-orange-200"
      icon = <Clock className="h-3 w-3" />
      break
    case "Under Review":
      classes = "bg-amber-50 text-amber-700 border-amber-200"
      icon = <Eye className="h-3 w-3" />
      break
    case "Submitted":
      classes = "bg-blue-50 text-blue-700 border-blue-200"
      break
    case "Attached":
      classes = "bg-blue-50 text-blue-700 border-blue-200"
      icon = <Link2 className="h-3 w-3" />
      break
    case "Template":
      classes = "bg-neutral-100 text-neutral-600 border-neutral-200"
      break
    case "Archive":
      classes = "bg-neutral-100 text-neutral-600 border-neutral-200"
      icon = <Archive className="h-3 w-3" />
      break
    case "Valid until Dec 2026":
    case "Valid until Jul 2026":
      classes = "bg-emerald-50 text-emerald-700 border-emerald-200"
      icon = <CheckCircle2 className="h-3 w-3" />
      label = status
      break
    default:
      classes = "bg-neutral-100 text-neutral-600 border-neutral-200"
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        classes
      )}
    >
      {icon}
      {label}
    </span>
  )
}

function getVersionHistory(doc: DocumentItem): VersionEntry[] {
  const entries: VersionEntry[] = []
  for (let v = doc.version; v >= 1; v--) {
    const daysBack = (doc.version - v) * 7
    const d = new Date(doc.date)
    d.setDate(d.getDate() - daysBack)
    entries.push({
      version: v,
      date: format(d, "MMM d, yyyy"),
      author: doc.uploadedBy,
      note:
        v === doc.version
          ? "Latest version"
          : v === 1
            ? "Initial upload"
            : "Revision update",
    })
  }
  return entries
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function KpiCard({
  title,
  value,
  subtitle,
  icon,
  iconBg,
}: {
  title: string
  value: string
  subtitle?: string
  icon: React.ReactNode
  iconBg: string
}) {
  return (
    <Card className="py-0">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-neutral-500">{title}</p>
            <p className="text-2xl font-bold text-neutral-900">{value}</p>
            {subtitle && (
              <p className="text-xs text-neutral-500">{subtitle}</p>
            )}
          </div>
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              iconBg
            )}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function FolderSidebar({
  activeFolder,
  onSelect,
}: {
  activeFolder: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="space-y-0.5">
      {folders.map((f) => {
        const isActive = activeFolder === f.id
        return (
          <button
            key={f.id}
            onClick={() => onSelect(f.id)}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
              isActive
                ? "bg-blue-50 text-blue-700 font-medium"
                : "text-neutral-700 hover:bg-neutral-50"
            )}
          >
            {isActive ? (
              <FolderOpen className="h-4 w-4 shrink-0" />
            ) : (
              <Folder className="h-4 w-4 shrink-0 text-neutral-400" />
            )}
            <span className="truncate flex-1">{f.name}</span>
            <span
              className={cn(
                "text-xs tabular-nums",
                isActive ? "text-blue-500" : "text-neutral-400"
              )}
            >
              {f.fileCount}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function BulkActionsBar({
  count,
  onClear,
}: {
  count: number
  onClear: () => void
}) {
  if (count === 0) return null
  return (
    <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5">
      <span className="text-sm font-medium text-blue-700">
        {count} document{count !== 1 ? "s" : ""} selected
      </span>
      <div className="flex items-center gap-2 ml-auto">
        <Button variant="outline" size="sm" className="h-7 text-xs">
          <Download className="h-3.5 w-3.5" />
          Download
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-xs">
          <Folder className="h-3.5 w-3.5" />
          Move to Folder
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-xs">
          <Share2 className="h-3.5 w-3.5" />
          Share
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-xs">
          <Tag className="h-3.5 w-3.5" />
          Add Tags
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>
        <button
          onClick={onClear}
          className="ml-2 rounded p-1 text-blue-400 hover:bg-blue-100 hover:text-blue-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function DocumentPreviewPanel({
  doc,
  onClose,
}: {
  doc: DocumentItem
  onClose: () => void
}) {
  const versions = getVersionHistory(doc)

  const relatedItems: { label: string; type: string }[] = []
  if (doc.folder === "RFI Attachments") relatedItems.push({ label: "RFI-024", type: "RFI" })
  if (doc.folder === "Change Orders") relatedItems.push({ label: "CO-008", type: "Change Order" })
  if (doc.folder === "Submittals") relatedItems.push({ label: "Submittal #" + doc.id.split("-")[1], type: "Submittal" })
  if (doc.folder === "Contracts & Agreements") relatedItems.push({ label: "Project Contract", type: "Contract" })
  if (doc.folder === "Invoices & Payments") relatedItems.push({ label: "Payment Application", type: "Invoice" })
  if (relatedItems.length === 0) relatedItems.push({ label: doc.project, type: "Project" })

  return (
    <div className="border-l bg-white flex flex-col h-full overflow-hidden">
      {/* Panel header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold text-neutral-900 truncate pr-2">
          Document Preview
        </h3>
        <button
          onClick={onClose}
          className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Preview placeholder */}
        <div
          className={cn(
            "mx-4 mt-4 flex h-48 flex-col items-center justify-center rounded-lg border-2 border-dashed",
            getFileTypeBg(doc.fileType)
          )}
        >
          {getFileTypeIcon(doc.fileType, "h-12 w-12 opacity-40")}
          <p className="mt-2 text-xs text-neutral-500 uppercase tracking-wider font-medium">
            {doc.fileType.toUpperCase()} Preview
          </p>
        </div>

        {/* Metadata */}
        <div className="px-4 py-4 space-y-3">
          <h4 className="text-sm font-semibold text-neutral-900 leading-tight">
            {doc.name}
          </h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div>
              <span className="text-neutral-500">Type</span>
              <p className="font-medium text-neutral-800 uppercase">
                {doc.fileType}
              </p>
            </div>
            <div>
              <span className="text-neutral-500">Size</span>
              <p className="font-medium text-neutral-800">{doc.size}</p>
            </div>
            <div>
              <span className="text-neutral-500">Uploaded by</span>
              <p className="font-medium text-neutral-800">{doc.uploadedBy}</p>
            </div>
            <div>
              <span className="text-neutral-500">Date</span>
              <p className="font-medium text-neutral-800">
                {format(doc.date, "MMM d, yyyy")}
              </p>
            </div>
            <div>
              <span className="text-neutral-500">Folder</span>
              <p className="font-medium text-neutral-800">{doc.folder}</p>
            </div>
            <div>
              <span className="text-neutral-500">Status</span>
              <div className="mt-0.5">{getStatusBadge(doc.status)}</div>
            </div>
          </div>
        </div>

        {/* Version History */}
        <div className="border-t px-4 py-3">
          <h5 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <History className="h-3.5 w-3.5" />
            Version History
          </h5>
          <div className="space-y-2">
            {versions.map((v) => (
              <div
                key={v.version}
                className={cn(
                  "flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs",
                  v.version === doc.version
                    ? "bg-blue-50 border border-blue-200"
                    : "bg-neutral-50"
                )}
              >
                <div>
                  <span className="font-semibold text-neutral-800">
                    v{v.version}
                  </span>
                  <span className="text-neutral-500 ml-2">{v.date}</span>
                </div>
                <span className="text-neutral-500">{v.note}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sharing settings */}
        <div className="border-t px-4 py-3">
          <h5 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Sharing Settings
          </h5>
          <div className="space-y-1.5">
            {[
              { label: "Internal Team", access: "Full Access", active: true },
              {
                label: "Client",
                access: doc.folder === "Client Shared" ? "View Only" : "No Access",
                active: doc.folder === "Client Shared",
              },
              {
                label: "Subcontractor",
                access:
                  doc.folder === "Submittals" || doc.folder === "RFI Attachments"
                    ? "View Only"
                    : "No Access",
                active:
                  doc.folder === "Submittals" || doc.folder === "RFI Attachments",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center justify-between rounded-md bg-neutral-50 px-2.5 py-1.5 text-xs"
              >
                <span className="text-neutral-700">{s.label}</span>
                <span
                  className={cn(
                    "font-medium",
                    s.active ? "text-blue-600" : "text-neutral-400"
                  )}
                >
                  {s.access}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Related Items */}
        <div className="border-t px-4 py-3">
          <h5 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Link2 className="h-3.5 w-3.5" />
            Related Items
          </h5>
          <div className="space-y-1.5">
            {relatedItems.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-md bg-neutral-50 px-2.5 py-1.5 text-xs"
              >
                <span className="text-neutral-700">{item.label}</span>
                <span className="text-neutral-400">{item.type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t px-4 py-4">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="w-full text-xs">
              <Download className="h-3.5 w-3.5" />
              Download
            </Button>
            <Button variant="outline" size="sm" className="w-full text-xs">
              <Share2 className="h-3.5 w-3.5" />
              Share
            </Button>
            <Button variant="outline" size="sm" className="w-full text-xs">
              <Upload className="h-3.5 w-3.5" />
              New Version
            </Button>
            <Button variant="outline" size="sm" className="w-full text-xs">
              <FilePen className="h-3.5 w-3.5" />
              E-Sign
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full col-span-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Document
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function RecentActivitySidebar() {
  return (
    <Card className="py-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-neutral-400" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="space-y-0">
          {recentActivity.map((a) => (
            <div
              key={a.id}
              className="flex items-start gap-2.5 rounded-md px-2 py-2 hover:bg-neutral-50 transition-colors"
            >
              <div className="mt-0.5 shrink-0">{a.icon}</div>
              <div className="min-w-0">
                <p className="text-xs text-neutral-700 leading-snug">
                  {a.message}
                </p>
                <p className="text-[11px] text-neutral-400 mt-0.5">{a.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [activeFolder, setActiveFolder] = React.useState("all")
  const [selectedDocIds, setSelectedDocIds] = React.useState<Set<string>>(
    new Set()
  )
  const [previewDocId, setPreviewDocId] = React.useState<string | null>(null)
  const [sortField, setSortField] = React.useState<"name" | "date" | "size">(
    "date"
  )
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc")

  // Filter & sort
  const filteredDocs = React.useMemo(() => {
    let result = [...documents]

    // Folder filter
    if (activeFolder !== "all") {
      const folderName = folders.find((f) => f.id === activeFolder)?.name
      if (folderName) {
        result = result.filter((d) => d.folder === folderName)
      }
    }

    // Search
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.project.toLowerCase().includes(q) ||
          d.uploadedBy.toLowerCase().includes(q) ||
          d.folder.toLowerCase().includes(q) ||
          d.status.toLowerCase().includes(q) ||
          d.tags?.some((t) => t.toLowerCase().includes(q))
      )
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0
      if (sortField === "name") {
        cmp = a.name.localeCompare(b.name)
      } else if (sortField === "date") {
        cmp = a.date.getTime() - b.date.getTime()
      } else if (sortField === "size") {
        const parseSize = (s: string) => parseFloat(s.replace(/[^\d.]/g, ""))
        cmp = parseSize(a.size) - parseSize(b.size)
      }
      return sortDir === "asc" ? cmp : -cmp
    })

    return result
  }, [activeFolder, searchQuery, sortField, sortDir])

  const previewDoc = previewDocId
    ? documents.find((d) => d.id === previewDocId) ?? null
    : null

  // Selection handlers
  function toggleDocSelection(id: string) {
    setSelectedDocIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function toggleSelectAll() {
    if (selectedDocIds.size === filteredDocs.length) {
      setSelectedDocIds(new Set())
    } else {
      setSelectedDocIds(new Set(filteredDocs.map((d) => d.id)))
    }
  }

  function handleSort(field: "name" | "date" | "size") {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir("asc")
    }
  }

  const storagePercent = 17

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------------------- */}
      {/* Header */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">
            Document Management
          </h1>
          <p className="text-neutral-500 mt-1">
            Organize, version, share, and track all project documents
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm">
            <Upload className="h-4 w-4" />
            Upload Documents
          </Button>
          <Button variant="outline" size="sm">
            <FolderPlus className="h-4 w-4" />
            Create Folder
          </Button>
          <Button variant="outline" size="sm">
            <FilePen className="h-4 w-4" />
            New Template
          </Button>
          <Button variant="outline" size="sm">
            <ArrowDownToLine className="h-4 w-4" />
            Bulk Download
          </Button>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* KPI Cards */}
      {/* ---------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Total Documents"
          value="1,247"
          subtitle="Across 13 folders"
          icon={<FileText className="h-5 w-5 text-blue-600" />}
          iconBg="bg-blue-100"
        />
        <KpiCard
          title="Storage Used"
          value="8.4 GB"
          subtitle={
            <>
              <span className="text-neutral-500">of 50 GB ({storagePercent}%)</span>
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-neutral-200">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{ width: `${storagePercent}%` }}
                />
              </div>
            </>
          }
          icon={<HardDrive className="h-5 w-5 text-violet-600" />}
          iconBg="bg-violet-100"
        />
        <KpiCard
          title="Pending Signatures"
          value="7"
          subtitle="Requires action"
          icon={<PenLine className="h-5 w-5 text-amber-600" />}
          iconBg="bg-amber-100"
        />
        <KpiCard
          title="Recent Uploads"
          value="23"
          subtitle="This week"
          icon={<Upload className="h-5 w-5 text-emerald-600" />}
          iconBg="bg-emerald-100"
        />
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Main content: Sidebar + Table + Preview */}
      {/* ---------------------------------------------------------------- */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left: Folder Sidebar */}
        <div className="xl:col-span-2">
          <Card className="py-0 sticky top-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Folders</CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <FolderSidebar
                activeFolder={activeFolder}
                onSelect={(id) => {
                  setActiveFolder(id)
                  setSelectedDocIds(new Set())
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Center: Document Table */}
        <div
          className={cn(
            "space-y-4",
            previewDoc ? "xl:col-span-6" : "xl:col-span-7"
          )}
        >
          {/* Search & Filter bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents by name, project, uploader, or tag..."
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>

          {/* Bulk actions bar */}
          <BulkActionsBar
            count={selectedDocIds.size}
            onClear={() => setSelectedDocIds(new Set())}
          />

          {/* Document table */}
          <Card className="py-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-neutral-50/80">
                    <th className="w-10 px-3 py-3 text-left">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-neutral-300 accent-blue-600"
                        checked={
                          filteredDocs.length > 0 &&
                          selectedDocIds.size === filteredDocs.length
                        }
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="px-3 py-3 text-left">
                      <button
                        onClick={() => handleSort("name")}
                        className="flex items-center gap-1 font-semibold text-neutral-600 hover:text-neutral-900"
                      >
                        Name
                        {sortField === "name" && (
                          <ChevronRight
                            className={cn(
                              "h-3.5 w-3.5 transition-transform",
                              sortDir === "asc" ? "-rotate-90" : "rotate-90"
                            )}
                          />
                        )}
                      </button>
                    </th>
                    <th className="px-3 py-3 text-left font-semibold text-neutral-600 hidden lg:table-cell">
                      Folder
                    </th>
                    <th className="px-3 py-3 text-left font-semibold text-neutral-600 hidden xl:table-cell">
                      Project
                    </th>
                    <th className="px-3 py-3 text-center font-semibold text-neutral-600 w-14">
                      Ver
                    </th>
                    <th className="px-3 py-3 text-left font-semibold text-neutral-600 hidden md:table-cell">
                      <button
                        onClick={() => handleSort("size")}
                        className="flex items-center gap-1 font-semibold text-neutral-600 hover:text-neutral-900"
                      >
                        Size
                        {sortField === "size" && (
                          <ChevronRight
                            className={cn(
                              "h-3.5 w-3.5 transition-transform",
                              sortDir === "asc" ? "-rotate-90" : "rotate-90"
                            )}
                          />
                        )}
                      </button>
                    </th>
                    <th className="px-3 py-3 text-left font-semibold text-neutral-600 hidden lg:table-cell">
                      Uploaded By
                    </th>
                    <th className="px-3 py-3 text-left font-semibold text-neutral-600">
                      <button
                        onClick={() => handleSort("date")}
                        className="flex items-center gap-1 font-semibold text-neutral-600 hover:text-neutral-900"
                      >
                        Date
                        {sortField === "date" && (
                          <ChevronRight
                            className={cn(
                              "h-3.5 w-3.5 transition-transform",
                              sortDir === "asc" ? "-rotate-90" : "rotate-90"
                            )}
                          />
                        )}
                      </button>
                    </th>
                    <th className="px-3 py-3 text-left font-semibold text-neutral-600">
                      Status
                    </th>
                    <th className="w-12 px-3 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredDocs.map((doc) => {
                    const isSelected = selectedDocIds.has(doc.id)
                    const isPreviewing = previewDocId === doc.id
                    return (
                      <tr
                        key={doc.id}
                        className={cn(
                          "transition-colors cursor-pointer",
                          isPreviewing
                            ? "bg-blue-50/60"
                            : isSelected
                              ? "bg-blue-50/40"
                              : "hover:bg-neutral-50"
                        )}
                        onClick={() => setPreviewDocId(doc.id)}
                      >
                        <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-neutral-300 accent-blue-600"
                            checked={isSelected}
                            onChange={() => toggleDocSelection(doc.id)}
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={cn(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                                getFileTypeBg(doc.fileType)
                              )}
                            >
                              {getFileTypeIcon(doc.fileType, "h-4 w-4")}
                            </div>
                            <span className="font-medium text-neutral-900 truncate max-w-[220px]">
                              {doc.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-neutral-600 hidden lg:table-cell whitespace-nowrap">
                          {doc.folder}
                        </td>
                        <td className="px-3 py-2.5 text-neutral-600 hidden xl:table-cell whitespace-nowrap">
                          {doc.project}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className="inline-flex items-center justify-center rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-mono font-medium text-neutral-700">
                            v{doc.version}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-neutral-600 hidden md:table-cell whitespace-nowrap tabular-nums">
                          {doc.size}
                        </td>
                        <td className="px-3 py-2.5 text-neutral-600 hidden lg:table-cell whitespace-nowrap">
                          {doc.uploadedBy}
                        </td>
                        <td className="px-3 py-2.5 text-neutral-600 whitespace-nowrap tabular-nums">
                          {format(doc.date, "MMM d, yyyy")}
                        </td>
                        <td className="px-3 py-2.5">
                          {getStatusBadge(doc.status)}
                        </td>
                        <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                          <button className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  {filteredDocs.length === 0 && (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-4 py-12 text-center text-neutral-500"
                      >
                        <FileText className="h-8 w-8 mx-auto text-neutral-300 mb-2" />
                        <p className="font-medium">No documents found</p>
                        <p className="text-xs mt-1">
                          Try adjusting your search or folder filter
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table footer */}
            <div className="flex items-center justify-between border-t bg-neutral-50/80 px-4 py-2.5 text-xs text-neutral-500">
              <span>
                Showing {filteredDocs.length} of {documents.length} documents
              </span>
              <span>{selectedDocIds.size} selected</span>
            </div>
          </Card>
        </div>

        {/* Right: Preview Panel or Activity */}
        <div className={cn(previewDoc ? "xl:col-span-4" : "xl:col-span-3")}>
          {previewDoc ? (
            <Card className="py-0 overflow-hidden h-[calc(100vh-200px)] sticky top-4">
              <DocumentPreviewPanel
                doc={previewDoc}
                onClose={() => setPreviewDocId(null)}
              />
            </Card>
          ) : (
            <div className="space-y-4 sticky top-4">
              <RecentActivitySidebar />

              {/* Storage breakdown mini card */}
              <Card className="py-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-neutral-400" />
                    Storage by Folder
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="space-y-2">
                    {[
                      { name: "Photos & Media", size: "3.8 GB", pct: 45 },
                      { name: "Drawings & Plans", size: "2.1 GB", pct: 25 },
                      { name: "Submittals", size: "1.2 GB", pct: 14 },
                      { name: "Contracts", size: "0.6 GB", pct: 7 },
                      { name: "Other", size: "0.7 GB", pct: 9 },
                    ].map((item) => (
                      <div key={item.name}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-neutral-600">{item.name}</span>
                          <span className="text-neutral-500 tabular-nums">
                            {item.size}
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-neutral-100">
                          <div
                            className="h-full rounded-full bg-blue-400 transition-all"
                            style={{ width: `${item.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
