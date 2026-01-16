"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  ArrowRight,
  DollarSign,
  MapPin,
  User,
  Building2,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  UserPlus,
  Award,
} from "lucide-react"

import { api } from "@/lib/api-client"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"
import type { Lead, LeadStage } from "@/lib/types"

const STAGES: LeadStage[] = ["INTAKE", "QUALIFIED", "SCOPED", "QUOTED", "WON", "LOST"]

const STAGE_LABELS: Record<LeadStage, string> = {
  INTAKE: "Intake",
  QUALIFIED: "Qualified",
  SCOPED: "Scoped",
  QUOTED: "Quoted",
  WON: "Won",
  LOST: "Lost",
}

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const leadId = params.id as string

  const { data, isLoading, error } = useQuery({
    queryKey: ["lead", leadId],
    queryFn: () => api.getLead(leadId),
  })

  const lead = data?.lead as Lead | undefined

  const [stageSelectOpen, setStageSelectOpen] = React.useState(false)
  const [assignRepOpen, setAssignRepOpen] = React.useState(false)
  const [awardContractorOpen, setAwardContractorOpen] = React.useState(false)
  const [closeLostOpen, setCloseLostOpen] = React.useState(false)
  const [newStage, setNewStage] = React.useState<LeadStage | "">("")
  const [salesRepId, setSalesRepId] = React.useState("")
  const [contractorProfileId, setContractorProfileId] = React.useState("")
  const [lostReason, setLostReason] = React.useState("")
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const updateStageMutation = useMutation({
    mutationFn: (stage: string) => api.updateLeadStage(leadId, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", leadId] })
      queryClient.invalidateQueries({ queryKey: ["pipeline-leads"] })
      setStageSelectOpen(false)
      setNewStage("")
      setErrorMessage(null)
    },
    onError: (error: Error) => {
      setErrorMessage(error.message)
    },
  })

  const assignRepMutation = useMutation({
    mutationFn: (salesRepId: string) => api.assignSalesRep(leadId, salesRepId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", leadId] })
      queryClient.invalidateQueries({ queryKey: ["pipeline-leads"] })
      setAssignRepOpen(false)
      setSalesRepId("")
      setErrorMessage(null)
    },
    onError: (error: Error) => {
      setErrorMessage(error.message)
    },
  })

  const awardContractorMutation = useMutation({
    mutationFn: (profileId: string) => api.awardContractor(leadId, profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", leadId] })
      queryClient.invalidateQueries({ queryKey: ["pipeline-leads"] })
      setAwardContractorOpen(false)
      setContractorProfileId("")
      setErrorMessage(null)
    },
    onError: (error: Error) => {
      setErrorMessage(error.message)
    },
  })

  const closeLostMutation = useMutation({
    mutationFn: (reason: string) => api.closeLost(leadId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", leadId] })
      queryClient.invalidateQueries({ queryKey: ["pipeline-leads"] })
      setCloseLostOpen(false)
      setLostReason("")
      setErrorMessage(null)
    },
    onError: (error: Error) => {
      setErrorMessage(error.message)
    },
  })

  function formatCurrency(value: string | null | undefined): string {
    if (!value) return "—"
    const num = parseFloat(value)
    if (isNaN(num)) return "—"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num)
  }

  function formatDate(date: string | null | undefined): string {
    if (!date) return "—"
    return new Date(date).toLocaleDateString()
  }

  const currentStageIndex = lead ? STAGES.indexOf(lead.stage) : -1
  const nextStage = currentStageIndex >= 0 && currentStageIndex < STAGES.length - 1
    ? STAGES[currentStageIndex + 1]
    : null

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-neutral-600">Loading lead...</div>
      </div>
    )
  }

  if (error || !lead) {
    return (
      <div className="space-y-6">
        <div className="text-red-600">
          Error loading lead: {error instanceof Error ? error.message : "Lead not found"}
        </div>
        <Button variant="outline" onClick={() => router.push("/pipeline")}>
          <ArrowLeft className="h-4 w-4" />
          Back to Pipeline
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.push("/pipeline")}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{lead.name}</h1>
          <p className="text-neutral-600 mt-1">Lead Details</p>
        </div>
      </div>

      {errorMessage && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-3 text-red-700 text-sm">{errorMessage}</CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Lead Information */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-neutral-600">Stage</label>
                  <div className="mt-1">
                    <span
                      className={cn(
                        "text-xs rounded-full border px-2 py-1 inline-block",
                        lead.stage === "WON"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : lead.stage === "LOST"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                      )}
                    >
                      {STAGE_LABELS[lead.stage]}
                    </span>
                  </div>
                </div>
                {lead.estimatedValue && (
                  <div>
                    <label className="text-sm font-medium text-neutral-600">Estimated Value</label>
                    <div className="mt-1 font-semibold">{formatCurrency(lead.estimatedValue)}</div>
                  </div>
                )}
                {lead.email && (
                  <div>
                    <label className="text-sm font-medium text-neutral-600">Email</label>
                    <div className="mt-1 flex items-center gap-1">
                      <Mail className="h-4 w-4 text-neutral-400" />
                      {lead.email}
                    </div>
                  </div>
                )}
                {lead.phone && (
                  <div>
                    <label className="text-sm font-medium text-neutral-600">Phone</label>
                    <div className="mt-1 flex items-center gap-1">
                      <Phone className="h-4 w-4 text-neutral-400" />
                      {lead.phone}
                    </div>
                  </div>
                )}
                {lead.city && (
                  <div>
                    <label className="text-sm font-medium text-neutral-600">City</label>
                    <div className="mt-1">{lead.city}</div>
                  </div>
                )}
                {lead.state && (
                  <div>
                    <label className="text-sm font-medium text-neutral-600">State</label>
                    <div className="mt-1">{lead.state}</div>
                  </div>
                )}
                {lead.projectType && (
                  <div>
                    <label className="text-sm font-medium text-neutral-600">Project Type</label>
                    <div className="mt-1">{lead.projectType}</div>
                  </div>
                )}
              </div>
              {lead.description && (
                <div>
                  <label className="text-sm font-medium text-neutral-600">Description</label>
                  <div className="mt-1 text-sm text-neutral-700">{lead.description}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assigned Sales Rep */}
          {lead.assignedSalesRep && (
            <Card>
              <CardHeader>
                <CardTitle>Assigned Sales Rep</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-neutral-400" />
                  <div>
                    <div className="font-medium">{lead.assignedSalesRep.name}</div>
                    <div className="text-sm text-neutral-600">{lead.assignedSalesRep.email}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Awarded Contractor */}
          {lead.awardedProfile && (
            <Card>
              <CardHeader>
                <CardTitle>Awarded Contractor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-emerald-600" />
                  <div>
                    <div className="font-medium">{lead.awardedProfile.businessName}</div>
                    <div className="text-sm text-neutral-600">{lead.awardedProfile.user.email}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quotes */}
          {lead.quotes && lead.quotes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Quotes ({lead.quotes.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lead.quotes.map((quote) => (
                    <div key={quote.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{quote.profile.businessName}</div>
                          <div className="text-sm text-neutral-600">
                            {formatCurrency(quote.amount)} • {quote.status}
                          </div>
                        </div>
                        <div className="text-xs text-neutral-500">
                          {formatDate(quote.submittedAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Advance Stage */}
              {nextStage && lead.stage !== "WON" && lead.stage !== "LOST" && (
                <div>
                  {!stageSelectOpen ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setStageSelectOpen(true)}
                    >
                      <ArrowRight className="h-4 w-4" />
                      Advance Stage
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <select
                        className="w-full h-9 rounded-md border bg-white px-3 text-sm"
                        value={newStage}
                        onChange={(e) => setNewStage(e.target.value as LeadStage)}
                      >
                        <option value="">Select stage...</option>
                        {STAGES.map((stage) => (
                          <option key={stage} value={stage}>
                            {STAGE_LABELS[stage]}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            if (newStage) {
                              updateStageMutation.mutate(newStage)
                            }
                          }}
                          disabled={!newStage || updateStageMutation.isPending}
                        >
                          Update
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setStageSelectOpen(false)
                            setNewStage("")
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Assign Sales Rep */}
              {!lead.assignedSalesRep && (
                <div>
                  {!assignRepOpen ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setAssignRepOpen(true)}
                    >
                      <UserPlus className="h-4 w-4" />
                      Assign Sales Rep
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        placeholder="Sales Rep User ID"
                        value={salesRepId}
                        onChange={(e) => setSalesRepId(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            if (salesRepId) {
                              assignRepMutation.mutate(salesRepId)
                            }
                          }}
                          disabled={!salesRepId || assignRepMutation.isPending}
                        >
                          Assign
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAssignRepOpen(false)
                            setSalesRepId("")
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Award Contractor */}
              {lead.stage === "QUOTED" && !lead.awardedProfile && (
                <div>
                  {!awardContractorOpen ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setAwardContractorOpen(true)}
                    >
                      <Award className="h-4 w-4" />
                      Award Contractor
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        placeholder="Contractor Profile ID"
                        value={contractorProfileId}
                        onChange={(e) => setContractorProfileId(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            if (contractorProfileId) {
                              awardContractorMutation.mutate(contractorProfileId)
                            }
                          }}
                          disabled={!contractorProfileId || awardContractorMutation.isPending}
                        >
                          Award
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAwardContractorOpen(false)
                            setContractorProfileId("")
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Close Lost */}
              {lead.stage !== "WON" && lead.stage !== "LOST" && (
                <div>
                  {!closeLostOpen ? (
                    <Button
                      variant="outline"
                      className="w-full border-red-200 text-red-700 hover:bg-red-50"
                      onClick={() => setCloseLostOpen(true)}
                    >
                      <XCircle className="h-4 w-4" />
                      Close as Lost
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        placeholder="Reason for loss"
                        value={lostReason}
                        onChange={(e) => setLostReason(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1"
                          onClick={() => {
                            if (lostReason) {
                              closeLostMutation.mutate(lostReason)
                            }
                          }}
                          disabled={!lostReason || closeLostMutation.isPending}
                        >
                          Close
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCloseLostOpen(false)
                            setLostReason("")
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Create Project (if WON) */}
              {lead.stage === "WON" && lead.awardedProfile && !lead.projectId && (
                <Button
                  variant="default"
                  className="w-full"
                  onClick={() => {
                    // Navigate to project creation from lead
                    // Note: This endpoint should be in the API - for now, show a message
                    alert("Project creation from lead will be implemented. Use POST /projects/from-lead/:leadId")
                  }}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Create Project
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-600">Created</span>
                <span>{formatDate(lead.createdAt)}</span>
              </div>
              {lead.qualifiedAt && (
                <div className="flex justify-between">
                  <span className="text-neutral-600">Qualified</span>
                  <span>{formatDate(lead.qualifiedAt)}</span>
                </div>
              )}
              {lead.scopedAt && (
                <div className="flex justify-between">
                  <span className="text-neutral-600">Scoped</span>
                  <span>{formatDate(lead.scopedAt)}</span>
                </div>
              )}
              {lead.quotedAt && (
                <div className="flex justify-between">
                  <span className="text-neutral-600">Quoted</span>
                  <span>{formatDate(lead.quotedAt)}</span>
                </div>
              )}
              {lead.wonAt && (
                <div className="flex justify-between">
                  <span className="text-neutral-600">Won</span>
                  <span>{formatDate(lead.wonAt)}</span>
                </div>
              )}
              {lead.lostAt && (
                <div className="flex justify-between">
                  <span className="text-neutral-600">Lost</span>
                  <span>{formatDate(lead.lostAt)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
