"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  LinkIcon,
  Loader2,
  MessageSquare,
  Paperclip,
  RefreshCw,
  XCircle,
} from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { Label } from "@kealee/ui/label"
import { cn } from "@pm/lib/utils"
import { useSubmittal } from "@pm/hooks/useSubmittals"

type SubmittalStatus =
  | "pending"
  | "under-review"
  | "approved"
  | "approved-as-noted"
  | "rejected"
  | "revise-resubmit"

const STATUS_STYLES: Record<SubmittalStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  "under-review": "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  "approved-as-noted": "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  "revise-resubmit": "bg-orange-100 text-orange-800",
}

const STATUS_LABELS: Record<SubmittalStatus, string> = {
  pending: "Pending",
  "under-review": "Under Review",
  approved: "Approved",
  "approved-as-noted": "Approved as Noted",
  rejected: "Rejected",
  "revise-resubmit": "Revise & Resubmit",
}

interface SubmittalDetail {
  id: string
  number: string
  title: string
  specSection: string
  specTitle: string
  description: string
  submittedBy: string
  reviewer: string
  status: SubmittalStatus
  submitDate: string
  requiredDate: string
  ballInCourt: string
  project: string
  contractNumber: string
}


function getStepIcon(stepStatus: "complete" | "active" | "pending", index: number) {
  if (stepStatus === "complete") return <Check size={18} />
  if (stepStatus === "active") return <Clock size={18} />
  return <span className="text-xs">{index + 1}</span>
}

function getStepColor(stepStatus: "complete" | "active" | "pending") {
  if (stepStatus === "complete") return "bg-green-500 border-green-500 text-white"
  if (stepStatus === "active") return "bg-blue-500 border-blue-500 text-white"
  return "bg-gray-100 border-gray-300 text-gray-400"
}

function getConnectorColor(currentStatus: string) {
  return currentStatus === "complete" ? "bg-green-500" : "bg-gray-200"
}

export default function SubmittalDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const [comment, setComment] = React.useState("")
  const { data: sub, isLoading } = useSubmittal(params.id)

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
    </div>
  )

  if (!sub) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-500">Submittal not found</p>
    </div>
  )

  const workflow = sub.workflow ?? []
  const revisions = sub.revisions ?? []
  const attachments = sub.attachments ?? []
  const comments = sub.comments ?? []
  const relatedItems = sub.relatedItems ?? []

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center gap-4">
        <Link href="/pm/submittals">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={16} className="mr-1" />
            Back to Submittals
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">{sub.number}</h1>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-xs font-medium",
                STATUS_STYLES[sub.status]
              )}
            >
              {STATUS_LABELS[sub.status]}
            </span>
          </div>
          <p className="text-lg text-gray-700">{sub.title}</p>
          <p className="text-sm text-gray-500 mt-1">
            Spec Section: {sub.specSection} - {sub.specTitle}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
          >
            <XCircle size={16} />
            Reject
          </Button>
          <Button
            variant="outline"
            className="gap-2 text-orange-600 border-orange-200 hover:bg-orange-50"
          >
            <RefreshCw size={16} />
            Revise & Resubmit
          </Button>
          <Button
            variant="outline"
            className="gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
          >
            <CheckCircle2 size={16} />
            Approve as Noted
          </Button>
          <Button className="gap-2 bg-green-600 hover:bg-green-700">
            <CheckCircle2 size={16} />
            Approve
          </Button>
        </div>
      </div>

      {/* Approval Workflow Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Review Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between max-w-lg mx-auto">
            {workflow.map((step, i) => (
              <React.Fragment key={step.label}>
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2",
                      getStepColor(step.stepStatus)
                    )}
                  >
                    {getStepIcon(step.stepStatus, i)}
                  </div>
                  <p
                    className={cn(
                      "text-xs font-medium text-center",
                      step.stepStatus === "pending"
                        ? "text-gray-400"
                        : "text-gray-700"
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-[10px] text-gray-400">{step.date}</p>
                  {step.user && (
                    <p className="text-[10px] text-gray-400 max-w-[100px] text-center truncate">
                      {step.user}
                    </p>
                  )}
                </div>
                {i < workflow.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 mx-2",
                      getConnectorColor(step.stepStatus)
                    )}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 leading-relaxed">
                {sub.description}
              </p>
              <div className="mt-4 pt-4 border-t">
                <Label className="text-xs text-gray-500">
                  Specification Reference
                </Label>
                <p className="text-sm font-medium mt-1">
                  Section {sub.specSection} - {sub.specTitle}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Paperclip size={18} />
                Attachments ({attachments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {attachments.map((doc) => (
                <div
                  key={doc.name}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <FileText size={18} className="text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">{doc.name}</p>
                      <p className="text-xs text-gray-400">
                        {doc.size} &middot; {doc.type.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{doc.date}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Revision History */}
          <Card>
            <CardHeader>
              <CardTitle>Revision History</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium text-gray-600">
                      Rev
                    </th>
                    <th className="text-left py-2 font-medium text-gray-600">
                      Date
                    </th>
                    <th className="text-left py-2 font-medium text-gray-600">
                      Status
                    </th>
                    <th className="text-left py-2 font-medium text-gray-600">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {revisions.map((r) => (
                    <tr key={r.rev} className="border-b last:border-0">
                      <td className="py-2 font-medium">{r.rev}</td>
                      <td className="py-2 text-gray-500">
                        {new Date(
                          r.date + "T00:00:00"
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="py-2">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium",
                            r.status === "Approved"
                              ? "bg-green-100 text-green-800"
                              : r.status === "Rejected"
                                ? "bg-red-100 text-red-800"
                                : r.status === "Approved as Noted"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : r.status === "Revise & Resubmit"
                                    ? "bg-orange-100 text-orange-800"
                                    : r.status === "Under Review"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-yellow-100 text-yellow-800"
                          )}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-2 text-gray-600">{r.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Review Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare size={18} />
                Review Comments ({comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {comments.map((c) => (
                <div key={c.id} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                      {c.user
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{c.user}</p>
                      <p className="text-xs text-gray-400">
                        {c.role} &middot;{" "}
                        {new Date(
                          c.date + "T00:00:00"
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {c.content}
                  </p>
                </div>
              ))}
              <div className="flex gap-2 pt-2 border-t">
                <Input
                  placeholder="Add a review comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="flex-1"
                />
                <Button>
                  <MessageSquare size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                ["Project", sub.project],
                ["Contract", sub.contractNumber],
                ["Spec Section", `${sub.specSection} - ${sub.specTitle}`],
                ["Submitted By", sub.submittedBy],
                [
                  "Submit Date",
                  new Date(
                    sub.submitDate + "T00:00:00"
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }),
                ],
                ["Reviewer", sub.reviewer],
                [
                  "Required Date",
                  new Date(
                    sub.requiredDate + "T00:00:00"
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }),
                ],
                ["Ball-in-Court", sub.ballInCourt],
                ["Status", STATUS_LABELS[sub.status]],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="font-medium">{value}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Related Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon size={18} />
                Related Items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {relatedItems.map((item) => (
                <Link
                  key={`${item.type}-${item.number}`}
                  href={item.link}
                  className="flex items-center justify-between p-2 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-medium",
                        item.type === "RFI"
                          ? "bg-blue-100 text-blue-700"
                          : item.type === "Drawing"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-gray-100 text-gray-700"
                      )}
                    >
                      {item.type}
                    </span>
                    <div>
                      <p className="text-xs font-medium">{item.number}</p>
                      <p className="text-[11px] text-gray-500">
                        {item.title}
                      </p>
                    </div>
                  </div>
                  <ExternalLink size={12} className="text-gray-400" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
