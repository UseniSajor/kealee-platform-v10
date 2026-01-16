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
} from "lucide-react"

import { api } from "@/lib/api"

export default function ConstructionHandoffPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const projectId = params.id as string

  const [activeTab, setActiveTab] = React.useState<"ifc" | "bids" | "rfis" | "submittals" | "asbuilt">("ifc")

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => router.push(`/projects/${projectId}`)}
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
                  onClick={() => {
                    // TODO: Open generate IFC package modal
                  }}
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
                  onClick={() => {
                    // TODO: Open generate bid package modal
                  }}
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
                  onClick={() => {
                    // TODO: Open create RFI modal
                  }}
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
                  onClick={() => {
                    // TODO: Open create submittal modal
                  }}
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
                  onClick={() => {
                    // TODO: Open create as-built modal
                  }}
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
    </div>
  )
}
