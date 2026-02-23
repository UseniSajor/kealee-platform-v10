"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  Plus,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  MessageSquare,
  Package,
  ClipboardList,
  X,
} from "lucide-react"

import { api } from "@architect/lib/api"

type ModalType = "ifc" | "bid" | "rfi" | "submittal" | "asbuilt" | null

export default function ConstructionHandoffPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const projectId = params.id as string

  const [activeTab, setActiveTab] = React.useState<"ifc" | "bids" | "rfis" | "submittals" | "asbuilt">("ifc")
  const [openModal, setOpenModal] = React.useState<ModalType>(null)

  // Form state for IFC Package
  const [ifcName, setIfcName] = React.useState("")
  const [ifcDescription, setIfcDescription] = React.useState("")
  const [ifcIncludeAll, setIfcIncludeAll] = React.useState(true)

  // Form state for Bid Package
  const [bidName, setBidName] = React.useState("")
  const [bidDescription, setBidDescription] = React.useState("")
  const [bidDueDate, setBidDueDate] = React.useState("")

  // Form state for RFI
  const [rfiSubject, setRfiSubject] = React.useState("")
  const [rfiQuestion, setRfiQuestion] = React.useState("")
  const [rfiPriority, setRfiPriority] = React.useState("MEDIUM")

  // Form state for Submittal
  const [submittalName, setSubmittalName] = React.useState("")
  const [submittalType, setSubmittalType] = React.useState("PRODUCT_DATA")
  const [submittalDescription, setSubmittalDescription] = React.useState("")

  // Form state for As-Built
  const [asbuiltName, setAsbuiltName] = React.useState("")
  const [asbuiltType, setAsbuiltType] = React.useState("DRAWING")
  const [asbuiltDescription, setAsbuiltDescription] = React.useState("")

  // Mutations
  const generateIFCMutation = useMutation({
    mutationFn: () => api.generateIFCPackage(projectId, {
      packageName: ifcName,
      description: ifcDescription || undefined,
      includeAllDrawings: ifcIncludeAll,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ifc-packages", projectId] })
      setOpenModal(null)
      resetIFCForm()
    },
  })

  const generateBidMutation = useMutation({
    mutationFn: () => api.generateBidPackage(projectId, {
      packageName: bidName,
      description: bidDescription || undefined,
      bidDueDate: bidDueDate || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bid-packages", projectId] })
      setOpenModal(null)
      resetBidForm()
    },
  })

  const createRFIMutation = useMutation({
    mutationFn: () => api.createRFI(projectId, {
      subject: rfiSubject,
      questionText: rfiQuestion,
      priority: rfiPriority,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rfis", projectId] })
      setOpenModal(null)
      resetRFIForm()
    },
  })

  const createSubmittalMutation = useMutation({
    mutationFn: () => api.createSubmittal(projectId, {
      submittalName: submittalName,
      submittalType: submittalType,
      description: submittalDescription || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submittals", projectId] })
      setOpenModal(null)
      resetSubmittalForm()
    },
  })

  const createAsBuiltMutation = useMutation({
    mutationFn: () => api.createAsBuiltDocumentation(projectId, {
      documentationName: asbuiltName,
      documentationType: asbuiltType,
      description: asbuiltDescription || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asbuilt", projectId] })
      setOpenModal(null)
      resetAsBuiltForm()
    },
  })

  function resetIFCForm() { setIfcName(""); setIfcDescription(""); setIfcIncludeAll(true); }
  function resetBidForm() { setBidName(""); setBidDescription(""); setBidDueDate(""); }
  function resetRFIForm() { setRfiSubject(""); setRfiQuestion(""); setRfiPriority("MEDIUM"); }
  function resetSubmittalForm() { setSubmittalName(""); setSubmittalType("PRODUCT_DATA"); setSubmittalDescription(""); }
  function resetAsBuiltForm() { setAsbuiltName(""); setAsbuiltType("DRAWING"); setAsbuiltDescription(""); }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => router.push(`/architect/projects/${projectId}`)}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Project
          </button>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Construction Administration</h1>
            <p className="text-neutral-600">IFC packages, bid packages, RFIs, submittals, and as-built documentation</p>
          </div>

          {/* Tabs */}
          <div className="mb-6 border-b border-neutral-200">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab("ifc")}
                className={`px-4 py-2 border-b-2 transition-colors ${
                  activeTab === "ifc"
                    ? "border-primary text-primary font-medium"
                    : "border-transparent text-neutral-600 hover:text-neutral-900"
                }`}
              >
                IFC Packages
              </button>
              <button
                onClick={() => setActiveTab("bids")}
                className={`px-4 py-2 border-b-2 transition-colors ${
                  activeTab === "bids"
                    ? "border-primary text-primary font-medium"
                    : "border-transparent text-neutral-600 hover:text-neutral-900"
                }`}
              >
                Bid Packages
              </button>
              <button
                onClick={() => setActiveTab("rfis")}
                className={`px-4 py-2 border-b-2 transition-colors ${
                  activeTab === "rfis"
                    ? "border-primary text-primary font-medium"
                    : "border-transparent text-neutral-600 hover:text-neutral-900"
                }`}
              >
                RFIs
              </button>
              <button
                onClick={() => setActiveTab("submittals")}
                className={`px-4 py-2 border-b-2 transition-colors ${
                  activeTab === "submittals"
                    ? "border-primary text-primary font-medium"
                    : "border-transparent text-neutral-600 hover:text-neutral-900"
                }`}
              >
                Submittals
              </button>
              <button
                onClick={() => setActiveTab("asbuilt")}
                className={`px-4 py-2 border-b-2 transition-colors ${
                  activeTab === "asbuilt"
                    ? "border-primary text-primary font-medium"
                    : "border-transparent text-neutral-600 hover:text-neutral-900"
                }`}
              >
                As-Built Docs
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "ifc" && (
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Issue for Construction (IFC) Packages
                </h2>
                <button
                  onClick={() => setOpenModal("ifc")}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" />
                  Generate IFC Package
                </button>
              </div>
              <div className="text-center py-12 text-neutral-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
                <p>No IFC packages yet</p>
                <p className="text-sm mt-2">Generate an IFC package to issue drawings for construction</p>
              </div>
            </div>
          )}

          {activeTab === "bids" && (
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Bid Packages
                </h2>
                <button
                  onClick={() => setOpenModal("bid")}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" />
                  Generate Bid Package
                </button>
              </div>
              <div className="text-center py-12 text-neutral-500">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
                <p>No bid packages yet</p>
                <p className="text-sm mt-2">Generate a bid package to solicit contractor bids</p>
              </div>
            </div>
          )}

          {activeTab === "rfis" && (
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Requests for Information (RFIs)
                </h2>
                <button
                  onClick={() => setOpenModal("rfi")}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" />
                  Create RFI
                </button>
              </div>
              <div className="text-center py-12 text-neutral-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
                <p>No RFIs yet</p>
                <p className="text-sm mt-2">Create an RFI to request information during construction</p>
              </div>
            </div>
          )}

          {activeTab === "submittals" && (
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Submittals
                </h2>
                <button
                  onClick={() => setOpenModal("submittal")}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" />
                  Create Submittal
                </button>
              </div>
              <div className="text-center py-12 text-neutral-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
                <p>No submittals yet</p>
                <p className="text-sm mt-2">Create a submittal to track contractor submissions during construction</p>
              </div>
            </div>
          )}

          {activeTab === "asbuilt" && (
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  As-Built Documentation
                </h2>
                <button
                  onClick={() => setOpenModal("asbuilt")}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" />
                  Create As-Built
                </button>
              </div>
              <div className="text-center py-12 text-neutral-500">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
                <p>No as-built documentation yet</p>
                <p className="text-sm mt-2">Create as-built documentation to record final construction conditions</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* IFC Package Modal */}
      {openModal === "ifc" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Generate IFC Package</h3>
              <button onClick={() => { setOpenModal(null); resetIFCForm(); }} className="text-neutral-400 hover:text-neutral-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Package Name *</label>
                <input
                  type="text"
                  value={ifcName}
                  onChange={(e) => setIfcName(e.target.value)}
                  placeholder="e.g. IFC Set - Phase 1"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
                <textarea
                  value={ifcDescription}
                  onChange={(e) => setIfcDescription(e.target.value)}
                  placeholder="Describe the IFC package contents..."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                  rows={3}
                />
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={ifcIncludeAll} onChange={(e) => setIfcIncludeAll(e.target.checked)} className="w-4 h-4" />
                <span className="text-sm text-neutral-700">Include all drawings</span>
              </label>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => generateIFCMutation.mutate()}
                  disabled={!ifcName || generateIFCMutation.isPending}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {generateIFCMutation.isPending ? "Generating..." : "Generate"}
                </button>
                <button onClick={() => { setOpenModal(null); resetIFCForm(); }} className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50">
                  Cancel
                </button>
              </div>
              {generateIFCMutation.isError && (
                <p className="text-sm text-red-600">Failed to generate IFC package. Please try again.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bid Package Modal */}
      {openModal === "bid" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Generate Bid Package</h3>
              <button onClick={() => { setOpenModal(null); resetBidForm(); }} className="text-neutral-400 hover:text-neutral-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Package Name *</label>
                <input
                  type="text"
                  value={bidName}
                  onChange={(e) => setBidName(e.target.value)}
                  placeholder="e.g. General Contractor Bid Package"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
                <textarea
                  value={bidDescription}
                  onChange={(e) => setBidDescription(e.target.value)}
                  placeholder="Describe the bid package scope..."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Bid Due Date</label>
                <input
                  type="date"
                  value={bidDueDate}
                  onChange={(e) => setBidDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => generateBidMutation.mutate()}
                  disabled={!bidName || generateBidMutation.isPending}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {generateBidMutation.isPending ? "Generating..." : "Generate"}
                </button>
                <button onClick={() => { setOpenModal(null); resetBidForm(); }} className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50">
                  Cancel
                </button>
              </div>
              {generateBidMutation.isError && (
                <p className="text-sm text-red-600">Failed to generate bid package. Please try again.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RFI Modal */}
      {openModal === "rfi" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create RFI</h3>
              <button onClick={() => { setOpenModal(null); resetRFIForm(); }} className="text-neutral-400 hover:text-neutral-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Subject *</label>
                <input
                  type="text"
                  value={rfiSubject}
                  onChange={(e) => setRfiSubject(e.target.value)}
                  placeholder="e.g. Clarification on structural detail"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Question *</label>
                <textarea
                  value={rfiQuestion}
                  onChange={(e) => setRfiQuestion(e.target.value)}
                  placeholder="Describe the information you need..."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Priority</label>
                <select
                  value={rfiPriority}
                  onChange={(e) => setRfiPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => createRFIMutation.mutate()}
                  disabled={!rfiSubject || !rfiQuestion || createRFIMutation.isPending}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {createRFIMutation.isPending ? "Creating..." : "Create RFI"}
                </button>
                <button onClick={() => { setOpenModal(null); resetRFIForm(); }} className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50">
                  Cancel
                </button>
              </div>
              {createRFIMutation.isError && (
                <p className="text-sm text-red-600">Failed to create RFI. Please try again.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submittal Modal */}
      {openModal === "submittal" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create Submittal</h3>
              <button onClick={() => { setOpenModal(null); resetSubmittalForm(); }} className="text-neutral-400 hover:text-neutral-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Submittal Name *</label>
                <input
                  type="text"
                  value={submittalName}
                  onChange={(e) => setSubmittalName(e.target.value)}
                  placeholder="e.g. Window Schedule Submittal"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Type</label>
                <select
                  value={submittalType}
                  onChange={(e) => setSubmittalType(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                >
                  <option value="PRODUCT_DATA">Product Data</option>
                  <option value="SHOP_DRAWING">Shop Drawing</option>
                  <option value="SAMPLE">Sample</option>
                  <option value="CERTIFICATE">Certificate</option>
                  <option value="MIX_DESIGN">Mix Design</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
                <textarea
                  value={submittalDescription}
                  onChange={(e) => setSubmittalDescription(e.target.value)}
                  placeholder="Describe the submittal..."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => createSubmittalMutation.mutate()}
                  disabled={!submittalName || createSubmittalMutation.isPending}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {createSubmittalMutation.isPending ? "Creating..." : "Create Submittal"}
                </button>
                <button onClick={() => { setOpenModal(null); resetSubmittalForm(); }} className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50">
                  Cancel
                </button>
              </div>
              {createSubmittalMutation.isError && (
                <p className="text-sm text-red-600">Failed to create submittal. Please try again.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* As-Built Modal */}
      {openModal === "asbuilt" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create As-Built Documentation</h3>
              <button onClick={() => { setOpenModal(null); resetAsBuiltForm(); }} className="text-neutral-400 hover:text-neutral-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Documentation Name *</label>
                <input
                  type="text"
                  value={asbuiltName}
                  onChange={(e) => setAsbuiltName(e.target.value)}
                  placeholder="e.g. As-Built Floor Plan - Level 1"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Type</label>
                <select
                  value={asbuiltType}
                  onChange={(e) => setAsbuiltType(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                >
                  <option value="DRAWING">Drawing</option>
                  <option value="SPECIFICATION">Specification</option>
                  <option value="PHOTO_DOCUMENTATION">Photo Documentation</option>
                  <option value="SURVEY">Survey</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
                <textarea
                  value={asbuiltDescription}
                  onChange={(e) => setAsbuiltDescription(e.target.value)}
                  placeholder="Describe the as-built documentation..."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => createAsBuiltMutation.mutate()}
                  disabled={!asbuiltName || createAsBuiltMutation.isPending}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {createAsBuiltMutation.isPending ? "Creating..." : "Create As-Built"}
                </button>
                <button onClick={() => { setOpenModal(null); resetAsBuiltForm(); }} className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50">
                  Cancel
                </button>
              </div>
              {createAsBuiltMutation.isError && (
                <p className="text-sm text-red-600">Failed to create as-built documentation. Please try again.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
